DROP POLICY IF EXISTS "public reads settings" ON public.store_settings;
CREATE POLICY "public reads settings" ON public.store_settings FOR SELECT TO anon, authenticated USING (id = 1);
DROP POLICY IF EXISTS "public reads content" ON public.site_content;
CREATE POLICY "public reads content" ON public.site_content FOR SELECT TO anon, authenticated USING (key IN ('home','about') OR public.is_staff(auth.uid()));