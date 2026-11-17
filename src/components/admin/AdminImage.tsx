import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { supabase } from "@/integrations/supabase/client";
import { productImagePath } from "@/lib/product-image";

/** Unsaved/draft previews download under the caller's current storage RLS. */
export function AdminImage({ src, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const path = productImagePath(src);
  const [preview, setPreview] = useState<{ path: string; url: string } | null>(null);
  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    let objectUrl: string | undefined;
    void supabase.storage.from("product-images").download(path).then(({ data, error }) => {
      if (cancelled || error || !data) return;
      objectUrl = URL.createObjectURL(data);
      setPreview({ path, url: objectUrl });
    });
    const { data: auth } = supabase.auth.onAuthStateChange(event => {
      if (event === "SIGNED_OUT") {
        cancelled = true;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        setPreview(null);
      }
    });
    return () => { cancelled = true; auth.subscription.unsubscribe(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [path]);
  return <img {...props} src={path ? (preview?.path === path ? preview.url : undefined) : src} />;
}