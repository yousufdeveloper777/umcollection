
create type public.app_role as enum ('super_admin','manager','viewer','customer');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
grant select, insert, update, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles r join public.profiles p on p.id = r.user_id
    where r.user_id = _user_id and r.role = _role and p.is_active)
$$;
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles r join public.profiles p on p.id = r.user_id
    where r.user_id = _user_id and r.role in ('super_admin','manager','viewer') and p.is_active)
$$;

create policy "own or staff read profiles" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "super admin updates profiles" on public.profiles for update to authenticated
  using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));
create policy "own or staff read roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "super admin inserts roles" on public.user_roles for insert to authenticated
  with check (public.has_role(auth.uid(),'super_admin'));
create policy "super admin updates roles" on public.user_roles for update to authenticated
  using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));
create policy "super admin deletes roles" on public.user_roles for delete to authenticated
  using (public.has_role(auth.uid(),'super_admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.email);
  if not exists (select 1 from public.user_roles where role = 'super_admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'super_admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'customer');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references public.categories(id) on delete set null,
  image_url text,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  price numeric(12,2) not null default 0,
  compare_at_price numeric(12,2),
  stock int not null default 0,
  sku text,
  images text[] not null default '{}',
  primary_image text,
  image_alt text,
  variants jsonb not null default '[]',
  status text not null default 'active' check (status in ('active','draft','out_of_stock')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity,
  customer_id uuid,
  customer_name text not null,
  customer_email text,
  customer_phone text not null,
  address text not null,
  notes text,
  total numeric(12,2) not null default 0,
  status text not null default 'pending' check (status in ('pending','processing','shipped','delivered','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','refunded')),
  created_at timestamptz not null default now()
);
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(12,2) not null,
  quantity int not null check (quantity > 0)
);
create table public.site_content (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
create table public.store_settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_name text,
  action text not null,
  resource_type text not null,
  resource_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

grant select on public.categories, public.products, public.site_content, public.store_settings to anon;
grant select, insert, update, delete on public.categories, public.products, public.orders, public.order_items, public.site_content, public.store_settings to authenticated;
grant select on public.audit_logs to authenticated;
grant all on public.categories, public.products, public.orders, public.order_items, public.site_content, public.store_settings, public.audit_logs to service_role;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.site_content enable row level security;
alter table public.store_settings enable row level security;
alter table public.audit_logs enable row level security;

create policy "public reads categories" on public.categories for select to anon, authenticated using (true);
create policy "super admin writes categories" on public.categories for all to authenticated
  using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));
create policy "public reads live products" on public.products for select to anon, authenticated
  using (status <> 'draft' or public.is_staff(auth.uid()));
create policy "super admin writes products" on public.products for all to authenticated
  using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));
create policy "staff or owner reads orders" on public.orders for select to authenticated
  using (public.is_staff(auth.uid()) or customer_id = auth.uid());
create policy "super admin updates orders" on public.orders for update to authenticated
  using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));
create policy "super admin deletes orders" on public.orders for delete to authenticated
  using (public.has_role(auth.uid(),'super_admin'));
create policy "staff or owner reads items" on public.order_items for select to authenticated
  using (public.is_staff(auth.uid()) or exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()));
create policy "super admin writes items" on public.order_items for all to authenticated
  using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));
create policy "public reads content" on public.site_content for select to anon, authenticated using (true);
create policy "super admin writes content" on public.site_content for all to authenticated
  using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));
create policy "public reads settings" on public.store_settings for select to anon, authenticated using (true);
create policy "super admin writes settings" on public.store_settings for all to authenticated
  using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));
create policy "staff reads audit" on public.audit_logs for select to authenticated using (public.is_staff(auth.uid()));

-- Orders: placed through a function that prices items server-side and reduces stock
create or replace function public.place_order(_name text, _phone text, _email text, _address text, _notes text, _items jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare _order uuid; _item jsonb; _p public.products; _qty int; _total numeric := 0;
begin
  if coalesce(trim(_name),'') = '' or coalesce(trim(_phone),'') = '' or coalesce(trim(_address),'') = '' then
    raise exception 'Name, phone and address are required';
  end if;
  if jsonb_array_length(_items) = 0 or jsonb_array_length(_items) > 50 then raise exception 'Invalid items'; end if;
  insert into public.orders (customer_id, customer_name, customer_email, customer_phone, address, notes)
    values (auth.uid(), left(_name,120), left(_email,200), left(_phone,40), left(_address,500), left(_notes,1000)) returning id into _order;
  for _item in select * from jsonb_array_elements(_items) loop
    _qty := greatest(1, least(20, (_item->>'quantity')::int));
    select * into _p from public.products where id = (_item->>'product_id')::uuid and status = 'active' for update;
    if not found then raise exception 'Product unavailable'; end if;
    if _p.stock < _qty then raise exception '% is out of stock', _p.name; end if;
    update public.products set stock = stock - _qty,
      status = case when stock - _qty <= 0 then 'out_of_stock' else status end where id = _p.id;
    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity) values (_order, _p.id, _p.name, _p.price, _qty);
    _total := _total + _p.price * _qty;
  end loop;
  update public.orders set total = _total where id = _order;
  return _order;
end $$;
revoke all on function public.place_order(text,text,text,text,text,jsonb) from public;
grant execute on function public.place_order(text,text,text,text,text,jsonb) to anon, authenticated;

-- Audit log trigger
create or replace function public.write_audit()
returns trigger language plpgsql security definer set search_path = public as $$
declare _rid text; _name text;
begin
  if auth.uid() is null then return coalesce(new, old); end if;
  if tg_op = 'DELETE' then _rid := to_jsonb(old)->>tg_argv[1]; else _rid := to_jsonb(new)->>tg_argv[1]; end if;
  select coalesce(full_name, email) into _name from public.profiles where id = auth.uid();
  insert into public.audit_logs (actor_id, actor_name, action, resource_type, resource_id, details)
  values (auth.uid(), _name, case tg_op when 'INSERT' then 'CREATE' else tg_op end, tg_argv[0], _rid,
    case when tg_op = 'DELETE' then jsonb_build_object('name', to_jsonb(old)->>'name') else jsonb_build_object('name', to_jsonb(new)->>'name') end);
  return coalesce(new, old);
end $$;
create trigger audit_products after insert or update or delete on public.products for each row execute function public.write_audit('Product','id');
create trigger audit_categories after insert or update or delete on public.categories for each row execute function public.write_audit('Category','id');
create trigger audit_orders after update or delete on public.orders for each row execute function public.write_audit('Order','order_number');
create trigger audit_content after insert or update or delete on public.site_content for each row execute function public.write_audit('Content','key');
create trigger audit_settings after insert or update or delete on public.store_settings for each row execute function public.write_audit('Settings','id');
create trigger audit_roles after insert or update or delete on public.user_roles for each row execute function public.write_audit('User role','user_id');
create trigger audit_profiles after update on public.profiles for each row execute function public.write_audit('User','id');

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();

-- Seed
insert into public.categories (name, slug, display_order) values
 ('Suits','suits',1),('Dresses','dresses',2),('Loungewear','loungewear',3),('Bags','bags',4),
 ('Jewellery','jewellery',5),('Watches','watches',6),('Shoes','shoes',7),('Accessories','accessories',8);

insert into public.products (name, slug, category_id, stock, status, images, primary_image, image_alt)
select v.name, v.slug, c.id, 10, 'active', array[v.img], v.img, v.alt
from (values
 ('Embroidered Suit','embroidered-suit','suits','/__l5e/assets-v1/912372e9-c464-474c-8056-a9a67607a079/burgundy-suit.jpeg','Model wearing an ornate burgundy embroidered suit'),
 ('Black Two-Piece Suit','black-two-piece-suit','suits','/__l5e/assets-v1/d889ea1c-875c-4c0a-acf8-dece3434d95c/black-two-piece-suit.jpeg','Black embroidered shirt and matching trousers'),
 ('Burgundy Velvet Dress','burgundy-velvet-dress','dresses','/__l5e/assets-v1/2d24b5d2-ddce-45d3-b1d8-96e8fa66aed8/burgundy-velvet-dress.jpeg','Burgundy velvet long dress outdoors'),
 ('Bow-Detail Dress','bow-detail-dress','dresses','/__l5e/assets-v1/6c2031a5-b0eb-4d86-ad7f-976fbbaf0f2f/bow-detail-dress.jpeg','Black and white long dress with bow details'),
 ('Black Layered Dress','black-layered-dress','dresses','/__l5e/assets-v1/4029ada2-4391-4229-a107-e0c699da557f/black-layered-dress.jpeg','Black long dress with cropped jacket'),
 ('Navy Layered Dress','navy-layered-dress','dresses','/__l5e/assets-v1/12e65953-3500-43e6-86a4-806310839741/navy-layered-dress.jpeg','Navy blue long dress with matching jacket'),
 ('Satin Loungewear Set','satin-loungewear-set','loungewear','/__l5e/assets-v1/87946c71-c0c6-4a4b-a2f5-1498164beb9e/satin-loungewear.jpeg','Black satin loungewear with white piping'),
 ('Classic Handbag','classic-handbag','bags','/__l5e/assets-v1/09f6bbe5-dc7d-4f8c-82f1-3f744a24fc69/black-handbag.jpeg','Structured black handbag'),
 ('Chain-Detail Handbag','chain-detail-handbag','bags','/__l5e/assets-v1/feaf5e50-0fc6-4f18-9b84-f8c486fd576c/white-chain-handbag.jpeg','White handbag with a decorative chain strap'),
 ('Mini Handbag Collection','mini-handbag-collection','bags','/__l5e/assets-v1/72a775e6-5f03-4cfd-a87d-4a728e2e3fe1/mini-handbags.jpeg','Collection of mini handbags in several colours'),
 ('Pearl Jewellery Set','pearl-jewellery-set','jewellery','/__l5e/assets-v1/378df351-5cf1-45b2-9536-969ebf2a09f4/pearl-jewellery.jpeg','Pearl necklace and matching jewellery set'),
 ('Watch Collection','watch-collection','watches','/__l5e/assets-v1/db848354-a8be-4c01-9bdf-42c68f9a2fd1/watch-collection.jpeg','Assorted watches arranged in a presentation box'),
 ('Luxury Watch Set','luxury-watch-set','watches','/__l5e/assets-v1/3f23b0dd-8ada-4f66-bfb1-336ac5792968/luxury-watch-set.jpeg','Four luxury wristwatches in an illuminated presentation box'),
 ('Smartwatch Bundle','smartwatch-bundle','watches','/__l5e/assets-v1/9bbb94e9-a899-4329-ba27-6ff66957d117/smartwatch-bundle.jpeg','Smartwatch with wireless earbuds and interchangeable straps'),
 ('Pearl Bow Heels','pearl-bow-heels','shoes','/__l5e/assets-v1/1c9dd0f3-4b56-454c-bd41-3451690b4c4c/pearl-bow-heels.jpeg','Pointed slingback heels with pearl bows'),
 ('Everyday Wallet','everyday-wallet','accessories','/__l5e/assets-v1/18fd6909-4eb4-4db6-8d6f-843029b77f6d/wallet.jpeg','Black patterned wallet')
) as v(name, slug, cat, img, alt) join public.categories c on c.slug = v.cat;

insert into public.site_content (key, value) values
 ('home', '{"eyebrow":"Style for every side of you","headline":"U M Collection","subheadline":"Beautiful suits. Thoughtful details. A collection to make your own.","cta_text":"Explore suits","cta_link":"/suits","background_image":"","featured_categories":["suits","bags"]}'),
 ('about', '{"title":"About U M Collection","body":"U M Collection brings together women''s suits, dresses and the finishing touches that make an outfit feel yours.\n\nFrom embroidered occasion wear to everyday clothing, discover our collection alongside handbags, jewellery, shoes and watches."}');
insert into public.store_settings (id, data) values (1, '{"store_name":"U M Collection","contact_email":"","phone":"","address":"","logo_url":"","flat_rate":0,"free_shipping_threshold":0,"delivery_time":"3-5 working days"}');
