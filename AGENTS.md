<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project architecture

- Use `/` for the store introduction and one route per product category (`/suits`, `/dresses`, `/loungewear`, `/bags`, `/jewellery`, `/watches`, `/shoes`, `/accessories`) sharing the same catalog component, because the owner wants each category browsable on its own page.
- Keep imported product photography in Lovable Assets and generated editorial imagery separate from catalog data, because inspiration must not be confused with available products.
- Share product data and catalog controls across collection pages, because search and favourites should behave consistently.

- Products, categories, homepage content, settings and orders live in Lovable Cloud tables; the public site and `/admin` read the same data, so never reintroduce static product lists.
- Admin access is restricted to active super admins by the route gate and RLS; roles live in `user_roles`, changes use an atomic guarded RPC, and serialized first-signup assignment uses existing profiles to prevent re-bootstrap. Frontend `useRole` is only a UI hint.
- Product images go to the private `product-images` bucket and are stored as long-lived signed URLs, because public buckets are blocked in this workspace.
- Cart lives in localStorage; guest wishlist in localStorage and merges into the `wishlists` table on sign-in. Checkout goes through the `checkout` RPC, which reprices items, applies coupons and shipping server-side, because browser totals cannot be trusted.

- Inventory CSV imports use Papa Parse and an admin-only atomic RPC so invalid rows never partially update stock.
- Admin exports neutralize spreadsheet formulas; audit triggers retain old/new values and logs remain read-only.
