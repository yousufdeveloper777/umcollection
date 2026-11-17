CREATE FUNCTION public.internal_has_role(_user_id uuid,_role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM public.user_roles r JOIN public.profiles p ON p.id=r.user_id WHERE r.user_id=_user_id AND r.role=_role AND p.is_active);
$$;
REVOKE ALL ON FUNCTION public.internal_has_role(uuid,public.app_role) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid,_role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT CASE WHEN auth.uid() IS NOT NULL AND _user_id=auth.uid() THEN public.internal_has_role(_user_id,_role) ELSE false END;
$$;
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT public.has_role(_user_id,'super_admin');
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid,public.app_role),public.is_staff(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role),public.is_staff(uuid) TO anon,authenticated;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 INSERT INTO public.profiles(id,full_name,email) VALUES(new.id,coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name',split_part(new.email,'@',1)),new.email);
 INSERT INTO public.user_roles(user_id,role) VALUES(new.id,'customer');
 RETURN new;
END $$;
CREATE OR REPLACE FUNCTION public.protect_admin_access()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE target uuid; removing boolean;
BEGIN
 PERFORM pg_advisory_xact_lock(82347001);
 IF TG_TABLE_NAME='profiles' THEN
  target:=OLD.id;
  removing:=OLD.is_active AND NOT NEW.is_active;
  IF NEW.id IS DISTINCT FROM OLD.id THEN RAISE EXCEPTION 'Account identity cannot be changed'; END IF;
 ELSE
  IF TG_OP='INSERT' THEN RETURN NEW; END IF;
  target:=OLD.user_id;
  IF TG_OP='DELETE' THEN removing:=OLD.role='super_admin';
  ELSE removing:=OLD.role='super_admin' AND (NEW.role IS DISTINCT FROM OLD.role OR NEW.user_id IS DISTINCT FROM OLD.user_id);
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN RAISE EXCEPTION 'Role ownership cannot be changed'; END IF;
  END IF;
 END IF;
 IF target=auth.uid() AND (TG_TABLE_NAME='user_roles' OR removing) THEN RAISE EXCEPTION 'You cannot change your own role or deactivate your account'; END IF;
 IF removing AND public.internal_has_role(target,'super_admin') AND NOT EXISTS(SELECT 1 FROM public.user_roles r JOIN public.profiles p ON p.id=r.user_id WHERE r.role='super_admin' AND p.is_active AND p.id<>target) THEN RAISE EXCEPTION 'The last active super admin must be retained'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;