export function adminHead(section: string) {
  const title = `${section} | U M Collection Admin`;
  const description = `Manage ${section.toLowerCase()} for U M Collection.`;
  return { meta: [
    { title }, { name: "description", content: description },
    { property: "og:title", content: title }, { property: "og:description", content: description },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] };
}