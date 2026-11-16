CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage','fixed')),
  discount_value numeric NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
  min_order_amount numeric NOT NULL DEFAULT 0,
  max_uses integer,
  per_user_limit integer,
  used_count integer NOT NULL DEFAULT 0,
  total_discount numeric NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff reads coupons" ON public.coupons FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "super admin writes coupons" ON public.coupons FOR ALL TO authenticated USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER audit_coupons AFTER INSERT OR UPDATE OR DELETE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.write_audit();

CREATE TABLE public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlists TO authenticated;
GRANT ALL ON public.wishlists TO service_role;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wishlist read" ON public.wishlists FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own wishlist insert" ON public.wishlists FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own wishlist delete" ON public.wishlists FOR DELETE TO authenticated USING (user_id = auth.uid());

ALTER TABLE public.orders ADD COLUMN subtotal numeric NOT NULL DEFAULT 0,
  ADD COLUMN shipping_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN discount_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN coupon_code text,
  ADD COLUMN tracking_number text,
  ADD COLUMN payment_method text NOT NULL DEFAULT 'cod';
ALTER TABLE public.order_items ADD COLUMN variant jsonb;

CREATE OR REPLACE FUNCTION public.coupon_discount(_code text, _subtotal numeric)
RETURNS numeric LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.coupons; uses int;
BEGIN
  SELECT * INTO c FROM public.coupons WHERE upper(code) = upper(trim(_code));
  IF NOT FOUND OR NOT c.is_active THEN RAISE EXCEPTION 'Invalid coupon code'; END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN RAISE EXCEPTION 'This coupon has expired'; END IF;
  IF c.max_uses IS NOT NULL AND c.used_count >= c.max_uses THEN RAISE EXCEPTION 'This coupon has been fully used'; END IF;
  IF _subtotal < c.min_order_amount THEN RAISE EXCEPTION 'Minimum order for this coupon is Rs %', c.min_order_amount; END IF;
  IF c.per_user_limit IS NOT NULL AND auth.uid() IS NOT NULL THEN
    SELECT count(*) INTO uses FROM public.orders WHERE customer_id = auth.uid() AND upper(coupon_code) = upper(c.code) AND status <> 'cancelled';
    IF uses >= c.per_user_limit THEN RAISE EXCEPTION 'You have already used this coupon'; END IF;
  END IF;
  RETURN round(least(_subtotal, CASE WHEN c.discount_type = 'percentage' THEN _subtotal * least(c.discount_value,100) / 100 ELSE c.discount_value END), 2);
END $$;
GRANT EXECUTE ON FUNCTION public.coupon_discount(text, numeric) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.checkout(_name text, _phone text, _email text, _address text, _notes text, _items jsonb, _coupon text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _order uuid; _item jsonb; _p public.products; _qty int; _sub numeric := 0; _ship numeric := 0; _disc numeric := 0; s jsonb;
BEGIN
  IF coalesce(trim(_name),'') = '' OR coalesce(trim(_phone),'') = '' OR coalesce(trim(_address),'') = '' THEN
    RAISE EXCEPTION 'Name, phone and address are required';
  END IF;
  IF _items IS NULL OR jsonb_array_length(_items) = 0 OR jsonb_array_length(_items) > 50 THEN RAISE EXCEPTION 'Your cart is empty'; END IF;
  INSERT INTO public.orders (customer_id, customer_name, customer_email, customer_phone, address, notes)
    VALUES (auth.uid(), left(_name,120), left(_email,200), left(_phone,40), left(_address,500), left(_notes,1000)) RETURNING id INTO _order;
  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _qty := greatest(1, least(20, (_item->>'quantity')::int));
    SELECT * INTO _p FROM public.products WHERE id = (_item->>'product_id')::uuid AND status = 'active' FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'A product in your cart is no longer available'; END IF;
    IF _p.stock < _qty THEN RAISE EXCEPTION '% has only % left', _p.name, _p.stock; END IF;
    UPDATE public.products SET stock = stock - _qty, status = CASE WHEN stock - _qty <= 0 THEN 'out_of_stock' ELSE status END WHERE id = _p.id;
    INSERT INTO public.order_items (order_id, product_id, product_name, unit_price, quantity, variant)
      VALUES (_order, _p.id, _p.name, _p.price, _qty, CASE WHEN jsonb_typeof(_item->'variant') = 'object' THEN _item->'variant' END);
    _sub := _sub + _p.price * _qty;
  END LOOP;
  SELECT data INTO s FROM public.store_settings WHERE id = 1;
  IF coalesce(trim(_coupon),'') <> '' THEN
    _disc := public.coupon_discount(_coupon, _sub);
    UPDATE public.coupons SET used_count = used_count + 1, total_discount = total_discount + _disc WHERE upper(code) = upper(trim(_coupon));
  END IF;
  IF NOT (coalesce((s->>'free_shipping_threshold')::numeric, 0) > 0 AND _sub >= (s->>'free_shipping_threshold')::numeric) THEN
    _ship := coalesce((s->>'flat_rate')::numeric, 0);
  END IF;
  UPDATE public.orders SET subtotal = _sub, shipping_amount = _ship, discount_amount = _disc,
    coupon_code = nullif(upper(trim(coalesce(_coupon,''))),''), total = greatest(0, _sub - _disc) + _ship WHERE id = _order;
  RETURN _order;
END $$;
GRANT EXECUTE ON FUNCTION public.checkout(text,text,text,text,text,jsonb,text) TO anon, authenticated;