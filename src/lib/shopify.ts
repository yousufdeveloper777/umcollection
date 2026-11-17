import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

export const SHOPIFY_DOMAIN = "umcollection-3849v-3v71smej.myshopify.com";
const TOKEN = "4af7671c81fb4fd63374f1f421546f05"; // Public Storefront token, not Admin API credentials.
export type ShopifyVariant = { id: string; title: string; availableForSale: boolean; price: { amount: string; currencyCode: string }; selectedOptions: { name: string; value: string }[] };
export type ShopifyProduct = { id: string; title: string; description: string; handle: string; productType: string; images: { edges: { node: { url: string; altText: string | null } }[] }; variants: { edges: { node: ShopifyVariant }[] }; options: { name: string; values: string[] }[] };
export async function storefrontApiRequest<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(`https://${SHOPIFY_DOMAIN}/api/2026-10/graphql.json`, {
    method: "POST", headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": TOKEN }, body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error("Shopify is unavailable. Please try again shortly.");
  const result = await response.json() as { data: T; errors?: { message: string }[] };
  if (result.errors?.length) throw new Error("Unable to load the Shopify store. Please try again.");
  return result.data;
}
export const shopifyProductsQuery = queryOptions({ queryKey: ["shopify", "products"], queryFn: async () => {
  const data = await storefrontApiRequest<{ products: { edges: { node: ShopifyProduct }[] } }>(`query { products(first: 100) { edges { node { id title description handle productType images(first: 10) { edges { node { url altText } } } variants(first: 100) { edges { node { id title availableForSale price { amount currencyCode } selectedOptions { name value } } } } options { name values } } } } }`);
  return data.products.edges.map(edge => edge.node);
} });
export const cartLineSchema = z.object({ merchandiseId: z.string().regex(/^gid:\/\/shopify\/ProductVariant\/\d+$/), quantity: z.number().int().min(1).max(20) });
export function formatCheckoutUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !(url.hostname === SHOPIFY_DOMAIN || url.hostname === "checkout.shopify.com" || url.hostname === "shopify.com")) throw new Error("Invalid checkout address");
  url.searchParams.set("channel", "online_store");
  return url.toString();
}
export type ShopifyCart = { id: string; checkoutUrl: string; totalQuantity: number; lines: { edges: { node: { id: string; quantity: number; merchandise: ShopifyVariant & { product: { id: string; title: string; handle: string; featuredImage: { url: string } | null } } } }[] } };
const CART_FIELDS = `id checkoutUrl totalQuantity lines(first: 100) { edges { node { id quantity merchandise { ... on ProductVariant { id title availableForSale price { amount currencyCode } selectedOptions { name value } product { id title handle featuredImage { url } } } } } } }`;
export async function mutateShopifyCart(operation: "cartCreate" | "cartLinesAdd" | "cartLinesUpdate" | "cartLinesRemove", variables: Record<string, unknown>) {
  const definitions = { cartCreate: "$input: CartInput!", cartLinesAdd: "$cartId: ID!, $lines: [CartLineInput!]!", cartLinesUpdate: "$cartId: ID!, $lines: [CartLineUpdateInput!]!", cartLinesRemove: "$cartId: ID!, $lineIds: [ID!]!" };
  const args = { cartCreate: "input: $input", cartLinesAdd: "cartId: $cartId, lines: $lines", cartLinesUpdate: "cartId: $cartId, lines: $lines", cartLinesRemove: "cartId: $cartId, lineIds: $lineIds" };
  const data = await storefrontApiRequest<Record<string, { cart: ShopifyCart | null; userErrors: { message: string }[] }>>(`mutation (${definitions[operation]}) { ${operation}(${args[operation]}) { cart { ${CART_FIELDS} } userErrors { message } } }`, variables);
  const result = data[operation];
  if (!result || result.userErrors.length || !result.cart) throw new Error(result?.userErrors[0]?.message ?? "Unable to update your cart");
  return result.cart;
}
export async function readShopifyCart(id: string) {
  return (await storefrontApiRequest<{ cart: ShopifyCart | null }>(`query ($id: ID!) { cart(id: $id) { ${CART_FIELDS} } }`, { id })).cart;
}