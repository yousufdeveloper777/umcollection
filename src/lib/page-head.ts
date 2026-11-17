export const SITE_ORIGIN = "https://umcollection.lovable.app";
export function pageHead(path: string, title: string, description: string) {
  const full = `${title} | U M Collection`;
  return { meta: [{ title: full }, { name: "description", content: description }, { property: "og:title", content: full }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { property: "og:url", content: SITE_ORIGIN + path }, { name: "twitter:card", content: "summary_large_image" }], links: [{ rel: "canonical", href: SITE_ORIGIN + path }] };
}