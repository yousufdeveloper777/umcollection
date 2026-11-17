CREATE FUNCTION public.admin_import_stock(_items jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE item jsonb; quantity numeric; product public.products;
BEGIN
 IF NOT public.has_role(auth.uid(),'super_admin') THEN RAISE EXCEPTION 'Access denied' USING ERRCODE='42501'; END IF;
 IF _items IS NULL OR jsonb_typeof(_items)<>'array' THEN RAISE EXCEPTION 'Invalid inventory file'; END IF;
 IF jsonb_array_length(_items)<1 OR jsonb_array_length(_items)>500 THEN RAISE EXCEPTION 'Import between 1 and 500 products'; END IF;
 IF (SELECT count(*) FROM jsonb_array_elements(_items)) <> (SELECT count(DISTINCT value->>'id') FROM jsonb_array_elements(_items)) THEN RAISE EXCEPTION 'Duplicate product'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(_items) ORDER BY value->>'id' LOOP
   IF jsonb_typeof(item->'stock') IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Stock must be a whole number'; END IF;
   quantity:=(item->>'stock')::numeric;
   IF quantity<0 OR quantity<>trunc(quantity) OR quantity>2147483647 THEN RAISE EXCEPTION 'Invalid stock quantity'; END IF;
   SELECT * INTO product FROM public.products WHERE id=(item->>'id')::uuid FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Unknown product'; END IF;
   UPDATE public.products SET stock=quantity::integer,
     status=CASE WHEN status='draft' THEN 'draft' WHEN quantity=0 THEN 'out_of_stock' ELSE 'active' END
   WHERE id=product.id;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.admin_import_stock(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_import_stock(jsonb) TO authenticated;