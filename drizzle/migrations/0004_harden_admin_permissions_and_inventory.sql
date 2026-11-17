CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT public.has_role(_user_id, 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE first_account boolean;
BEGIN
 PERFORM pg_advisory_xact_lock(82347001);
 SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO first_account;
 INSERT INTO public.profiles (id, full_name, email)
 VALUES (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.email);
 INSERT INTO public.user_roles (user_id, role) VALUES (new.id, CASE WHEN first_account THEN 'super_admin'::public.app_role ELSE 'customer'::public.app_role END);
 RETURN new;
END $$;

CREATE OR REPLACE FUNCTION public.protect_admin_access()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target uuid; removing boolean;
BEGIN
 PERFORM pg_advisory_xact_lock(82347001);
 IF TG_TABLE_NAME = 'profiles' THEN
   target := OLD.id;
   removing := OLD.is_active AND NOT NEW.is_active;
   IF NEW.id IS DISTINCT FROM OLD.id THEN RAISE EXCEPTION 'Account identity cannot be changed'; END IF;
 ELSE
   IF TG_OP = 'INSERT' THEN RETURN NEW; END IF;
   target := OLD.user_id;
   removing := OLD.role = 'super_admin' AND (TG_OP = 'DELETE' OR NEW.role IS DISTINCT FROM OLD.role OR NEW.user_id IS DISTINCT FROM OLD.user_id);
   IF TG_OP = 'UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN RAISE EXCEPTION 'Role ownership cannot be changed'; END IF;
 END IF;
 IF target = auth.uid() AND (TG_TABLE_NAME = 'user_roles' OR removing) THEN
   RAISE EXCEPTION 'You cannot change your own role or deactivate your account';
 END IF;
 IF removing AND public.has_role(target, 'super_admin') AND NOT EXISTS (
   SELECT 1 FROM public.user_roles r JOIN public.profiles p ON p.id=r.user_id
   WHERE r.role='super_admin' AND p.is_active AND p.id<>target
 ) THEN RAISE EXCEPTION 'The last active super admin must be retained'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect_role_access BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.protect_admin_access();
CREATE TRIGGER protect_profile_access BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_admin_access();

CREATE FUNCTION public.admin_update_user(_user_id uuid, _role public.app_role DEFAULT NULL, _active boolean DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(82347001);
 IF NOT public.has_role(auth.uid(),'super_admin') THEN RAISE EXCEPTION 'Access denied' USING ERRCODE='42501'; END IF;
 IF _user_id=auth.uid() THEN RAISE EXCEPTION 'You cannot change your own role or status'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=_user_id) THEN RAISE EXCEPTION 'Account not found'; END IF;
 IF _role IS NOT NULL THEN
   DELETE FROM public.user_roles WHERE user_id=_user_id;
   INSERT INTO public.user_roles(user_id,role) VALUES (_user_id,_role);
 END IF;
 IF _active IS NOT NULL THEN UPDATE public.profiles SET is_active=_active WHERE id=_user_id; END IF;
END $$;
REVOKE ALL ON FUNCTION public.admin_update_user(uuid,public.app_role,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_user(uuid,public.app_role,boolean) TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated;

CREATE OR REPLACE FUNCTION public.write_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE old_value jsonb; new_value jsonb; rid text; actor text;
BEGIN
 IF TG_OP<>'INSERT' THEN old_value:=to_jsonb(OLD); END IF;
 IF TG_OP<>'DELETE' THEN new_value:=to_jsonb(NEW); END IF;
 IF auth.uid() IS NOT NULL THEN
   SELECT coalesce(full_name,email) INTO actor FROM public.profiles WHERE id=auth.uid();
   rid:=coalesce(new_value,old_value)->>coalesce(TG_ARGV[1],'id');
   INSERT INTO public.audit_logs(actor_id,actor_name,action,resource_type,resource_id,details)
   VALUES(auth.uid(),actor,CASE WHEN TG_OP='INSERT' THEN 'CREATE' ELSE TG_OP END,
     coalesce(TG_ARGV[0],TG_TABLE_NAME),rid,
     jsonb_build_object('name',coalesce(new_value->>'name',new_value->>'code',old_value->>'name',old_value->>'code'),'old_value',old_value,'new_value',new_value));
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER audit_coupons ON public.coupons;
CREATE TRIGGER audit_coupons AFTER INSERT OR UPDATE OR DELETE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.write_audit('Coupon','id');
DROP TRIGGER audit_orders ON public.orders;
CREATE TRIGGER audit_orders AFTER INSERT OR UPDATE OR DELETE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.write_audit('Order','order_number');

REVOKE EXECUTE ON FUNCTION public.handle_new_user(),public.write_audit(),public.touch_updated_at(),public.protect_admin_access() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.checkout(text,text,text,text,text,jsonb,text), public.coupon_discount(text,numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.checkout(text,text,text,text,text,jsonb,text), public.coupon_discount(text,numeric) TO anon,authenticated;
ALTER TABLE public.products ADD COLUMN low_stock_threshold integer NOT NULL DEFAULT 3 CHECK (low_stock_threshold >= 0);