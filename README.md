# CALE & CAEL Warranty Center
 
Shopify app for managing product warranty claims. Customers submit warranty
requests (with photos/videos) from their customer account, and the store
admin reviews and updates the status from a panel inside the app.
 
## Stack
 
| Piece | Tech |
|---|---|
| Ecommerce | Shopify |
| App backend | Node.js / React Router 7 (Shopify app template) |
| Customer-facing UI | Customer Account UI Extensions |
| Database | Supabase (PostgreSQL) |
| Photo/video storage | Cloudinary |
| Package manager | pnpm |
 
## How it fits together
 
- `extensions/warranty-requests-page` — full-page Customer Account extension.
  Shows the customer's warranty requests and a form to create a new one.
- `extensions/warranty-customer-account` — inline block on the order-status
  page in the customer account, with the "Apply Warranty" button.
- `app/routes/api.warranty-requests.tsx` — backend API the extension calls to
  read/create warranty requests (authenticated via customer session token).
- `app/routes/api.warranty-requests.upload-photo.tsx` — backend endpoint that
  uploads photos/videos to Cloudinary.
- `app/routes/app.warranty-admin.tsx` — the admin panel (inside Shopify
  Admin, under the app's own navigation) where the store owner sees every
  request and changes its status (Pending / Approved / In progress /
  Rejected / Completed).
## Local setup
 
1. Clone the repo and switch to this branch:
```
   git clone https://github.com/HelloCaleAndCael/cale-cael-warranty-center.git
   cd cale-cael-warranty-center
   git checkout warranty-requests-feature
```
2. Install dependencies:
```
   pnpm install
```
3. Ask a teammate for the `.env` file contents (not committed to git — it
   has Supabase and Cloudinary secrets) and create your own `.env` file in
   the project root with those values:
```
   SUPABASE_URL=
   SUPABASE_SERVICE_ROLE_KEY=
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=
```
4. Run the dev server:
```
   shopify app dev
```
5. **Important**: `shopify app dev` gives you a new random tunnel URL every
   time it starts (something like `https://xxxx.trycloudflare.com`). Copy
   that URL from the terminal (`app_home │ └ Using URL: ...`) and paste it
   into `API_BASE_URL` at the top of:
   - `extensions/warranty-requests-page/src/WarrantyRequestsPage.jsx`
   Only one person should run `shopify app dev` at a time, since only one
   tunnel URL is "live" at once — coordinate before starting a session.
## Deploying changes
 
`shopify app deploy` publishes the current extensions/config to **every
store the app is installed on** — there's no separate staging app. Always
test thoroughly with `shopify app dev` on the dev store first.
 
## Database
 
Table schema lives in `supabase-schema.sql` (run once, already applied).
Status values: `pending`, `approved`, `in_progress`, `rejected`, `completed`.
Once a request is `completed` it's meant to be locked — the admin panel
hides the status-change buttons for it (there's a "Reopen" override if
needed).
 
## Known limitations / next steps
 
- Backend session storage still uses local SQLite (`dev.sqlite`) — needs to
  move to a persistent database before deploying to permanent hosting.
- No permanent hosting yet (currently only runs via `shopify app dev`
  tunnel). Needed before installing on the production store
  (caleandcael.com).
- Free-tier limits to watch: Supabase (500 MB DB, pauses after 7 days of no
  traffic), Cloudinary (25 credits/month — video eats this fast).