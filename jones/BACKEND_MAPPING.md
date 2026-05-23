# Backend → Frontend Mapping: jones/

> Companion doc for wiring the `jones/` frontend to the Django backend.
> The old `frontend/` already consumes these APIs — this doc maps what
> `jones/` needs to replicate / adapt.

---

## 1. Backend Base URL

```ts
// jones/src/lib/config.ts  (update this)
export const DJANGO_BASE_URL =
  process.env.NEXT_PUBLIC_DJANGO_BASE_URL || "https://api.jones.com";
```

---

## 2. API Endpoints (from old frontend → jones/)

### 2.1 Products (Public — no auth)

| Old API File | Endpoint | Method | Purpose | jones/ Status |
|---|---|---|---|---|
| `productsApi.ts` | `/api/shop/category-product-list/?slug=&page=` | GET | Products by category | ❌ Not implemented |
| `productsApi.ts` | `/api/shop/brand-product-list/?slug=&page=` | GET | Products by brand | ❌ Not implemented |
| `productsApi.ts` | `/api/shop/tag-product-list/?slug=&page=` | GET | Products by tag | ❌ Not implemented |
| `productsApi.ts` | `/api/shop/product-detail/?slug=` | GET | Product detail | ❌ Not implemented |
| `productsApi.ts` | `/api/shop/best-selling-products/` | GET | Best sellers | ❌ Not implemented |
| `productsApi.ts` | `/api/shop/latest-products/` | GET | New arrivals | ❌ Not implemented |
| `productsApi.ts` | `/api/shop/weekly-bestsellers/` | GET | Weekly best sellers | ❌ Not implemented |
| `productsApi.ts` | `/api/shop/featured-products/` | GET | Featured products | ❌ Not implemented |
| `productsApi.ts` | `/api/shop/product-review/?product_slug=` | GET | Reviews for product | ❌ Not implemented |
| `productsApi.ts` | `/api/shop/sitemap-products/` | GET | Sitemap data | ❌ Not implemented |
| `productsApi.ts` | `/api/shop/search-products/?q=` | GET | Search | ❌ Not implemented |

### 2.2 Catalog Meta (Public)

| Old API File | Endpoint | Method | Purpose | jones/ Status |
|---|---|---|---|---|
| `brandsApi.ts` | `/api/shop/brands-list/` | GET | All brands | ❌ Not implemented |
| `brandGroupsApi.ts` | `/api/shop/brand-groups/` | GET | Brands grouped by league | ❌ Not implemented |
| `categoryApi.ts` | `/shop/categories-list/` | GET | All categories | ❌ Not implemented |
| `tagsProductApi.ts` | `/api/shop/tags-list/` | GET | All product tags | ❌ Not implemented |

### 2.3 Articles / Blog (Public)

| Old API File | Endpoint | Method | Purpose | jones/ Status |
|---|---|---|---|---|
| `articlesApi.ts` | `/api/articles/listing/` | GET | Article list | ❌ Not implemented |
| `articlesApi.ts` | `/api/articles/detail/?slug=` | GET | Article detail | ❌ Not implemented |
| `articlesApi.ts` | `/api/articles/featured/` | GET | Featured article | ❌ Not implemented |
| `articlesApi.ts` | `/api/articles/category/?slug=` | GET | Articles by category | ❌ Not implemented |
| `articlesApi.ts` | `/api/articles/category-list/` | GET | Article categories | ❌ Not implemented |
| `tagsArticlesApi.ts` | `/articles/tag-list/` | GET | Article tags | ❌ Not implemented |
| `tagsArticlesApi.ts` | `/articles/tag/?slug=` | GET | Articles by tag | ❌ Not implemented |

### 2.4 Utils / CMS (Public)

| Old API File | Endpoint | Method | Purpose | jones/ Status |
|---|---|---|---|---|
| `menuApi.ts` | `/api/utils/main-menus/` | GET | Main navigation | ❌ Not implemented |
| `footerApi.ts` | `/api/utils/footer-menus/` | GET | Footer links | ❌ Not implemented |
| `heroSliderApi.ts` | `/api/utils/sliders/` | GET | Hero banners | ❌ Not implemented |
| `pagesApi.ts` | `/api/utils/static-pages/?slug=` | GET | CMS pages | ❌ Not implemented |
| `searchApi.ts` | `/api/utils/search/?q=` | GET | Global search | ❌ Not implemented |

### 2.5 Cart (Auth required)

| Old API File | Endpoint | Method | Purpose | jones/ Status |
|---|---|---|---|---|
| `cartApi.ts` | `/shop/add-to-cart/` | POST | Add item | ❌ Mock only |
| `cartApi.ts` | `/shop/cart-items/` | GET | Get cart | ❌ Mock only |
| `cartApi.ts` | `/shop/remove-cart-item/` | POST | Remove item | ❌ Mock only |
| `cartApi.ts` | `/shop/update-cart-quantity/` | POST | Update qty | ❌ Mock only |
| `cartApi.ts` | `/shop/clear-cart/` | POST | Clear cart | ❌ Mock only |
| `cartApi.ts` | `/shop/merge-cart-on-login/` | POST | Merge guest cart | ❌ Mock only |

### 2.6 Wishlist (Auth required)

| Old API File | Endpoint | Method | Purpose | jones/ Status |
|---|---|---|---|---|
| `wishlistApi.ts` | `/shop/get-wishlist/` | GET | Get wishlist | ❌ Mock only |
| `wishlistApi.ts` | `/shop/action-to-wishlist/` | POST | Add/remove | ❌ Mock only |
| `wishlistApi.ts` | `/shop/check-item-wishlist/` | GET | Check item | ❌ Mock only |

### 2.7 Orders (Auth required)

| Old API File | Endpoint | Method | Purpose | jones/ Status |
|---|---|---|---|---|
| `orderApi.ts` | `/shop/create-order/` | POST | Create order | ❌ Not implemented |
| `orderApi.ts` | `/shop/get-order-list/` | GET | Order history | ❌ Not implemented |
| `orderApi.ts` | `/shop/get-order-detail/?order_code=` | GET | Order detail | ❌ Not implemented |

### 2.8 Reviews (Mixed)

| Old API File | Endpoint | Method | Purpose | jones/ Status |
|---|---|---|---|---|
| `reviewsApi.ts` | `/shop/product-review-create/` | POST | Submit review (auth) | ❌ Not implemented |
| `reviewsApi.ts` | `/shop/product-review-list/` | GET | List reviews (public) | ❌ Not implemented |

### 2.9 Auth / User

| Old API File | Endpoint | Method | Purpose | jones/ Status |
|---|---|---|---|---|
| `authApi.ts` | `/auth/token/refresh/` | POST | JWT refresh | ❌ Not implemented |
| `authApi.ts` | `/auth/logout/` | POST | Logout | ❌ Not implemented |
| `authApi.ts` | `/auth/google/` | POST | Google OAuth | ❌ Not implemented |
| `usersApi.ts` | `/auth/user/` | GET | Current user | ❌ Not implemented |
| `usersApi.ts` | `/profiles/shipping-addresses/` | GET | Addresses | ❌ Not implemented |
| `usersApi.ts` | `/profiles/shipping-addresses/manage/` | POST | Add/update address | ❌ Not implemented |
| `usersApi.ts` | `/profiles/shipping-addresses/delete/:id` | DELETE | Delete address | ❌ Not implemented |

---

## 3. Data Model Differences

### 3.1 Product

**Backend (`pod_shop`) returns:**
```json
{
  "id": 1,
  "name": "Product Name",
  "slug": "product-name",
  "price": "29.99",
  "sale_price": "19.99",
  "status": "A",
  "brand": { "name": "Nike", "slug": "nike" },
  "category": { "name": "Shoes", "slug": "shoes" },
  "tags": [{ "name": "Running", "slug": "running" }],
  "images": [{ "image": "products/abc.jpg", "alt_text": "" }],
  "description": "...",
  "short_description": "...",
  "sku": "SKU123",
  "stock": 10,
  "available_attrs": [...],
  "review_count": 5,
  "avg_rating": "4.5"
}
```

**jones/ expects (`Product` type):**
```ts
interface Product {
  id: string;
  title: string;
  price: number;
  discount: number;
  shippingCost: number;
  mediaURLs: string[];
  gender: Gender;
  sku: string;
  details: string;
  salesCount: number;
  color: string;
  sizes: number[];
  year?: number;
  type: Category;  // HIGH / MID / LOW
}
```

**Mapping needed:**
- `name` → `title`
- `sale_price ?? price` → `price` (with `discount` calculated)
- `images[].image` → `mediaURLs` (prepend `https://storage.googleapis.com/jones-media/` or local `/media/`)
- `description` → `details`
- Backend has no `gender`, `color`, `sizes`, `year`, `type` fields directly on product — these may come from `available_attrs` or need schema extension
- `brand`, `category`, `tags` are nested objects in backend but flat references in jones/

### 3.2 Cart

**Backend:**
```json
{
  "items": [
    {
      "id": 1,
      "product": { /* full product */ },
      "quantity": 2,
      "attr_items": [{ "attr": "Size", "value": "42" }]
    }
  ],
  "total": "59.98"
}
```

**jones/ expects:**
```ts
interface CartItem {
  cartId: number;
  productId: string;
  size: number;
  quantity: number;
  total: number;
}
```

### 3.3 User / Auth

**Backend JWT payload:**
```json
{ "user_id": 1, "username": "john", "email": "john@example.com" }
```

**jones/ expects:**
```ts
interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  avatarURL?: string;
}
```

---

## 4. Route Mapping

| Old Frontend Route | New jones Route | Page Component | Backend APIs Needed |
|---|---|---|---|
| `/` | `/` | `index.tsx` | `best-selling-products`, `latest-products`, `featured-products`, `sliders` |
| `/p/[slug]` | `/product/[productSlug]` | `product/[productSlug].tsx` | `product-detail`, `product-review` |
| `/c/[slug]` | `/category/[...categoryId]` | `category/[...categoryId].tsx` | `category-product-list`, `categories-list` |
| `/b/[slug]` | *(none)* | — | `brand-product-list` |
| `/t/[slug]` | *(none)* | — | `tag-product-list` |
| `/search` | `/search` | `search.tsx` | `search-products` |
| `/cart` | *(in Cart modal)* | `Cart.tsx` | `cart-items`, `add-to-cart`, etc. |
| `/checkout` | *(none)* | — | `create-order` |
| `/my-account/*` | *(none)* | — | `auth/user`, `shipping-addresses` |
| `/wishlists` | *(in AuthContext)* | — | `get-wishlist` |
| `/blog` | *(none)* | — | `articles/listing` |
| `/articles/[slug]` | *(none)* | — | `articles/detail` |
| `/page/[slug]` | *(none)* | — | `static-pages` |

---

## 5. Implementation Priority

### P0 — Must have for MVP
1. **HTTP client** — adapt `fetchClient.ts` from `frontend/` or create new
2. **Product listing** — `category-product-list`, `best-selling-products`, `latest-products`
3. **Product detail** — `product-detail` + `product-review`
4. **Catalog meta** — `brands-list`, `categories-list`, `tags-list`
5. **Search** — `search-products`

### P1 — Core UX
6. **Cart** — wire mock → real APIs (`cart-items`, `add-to-cart`, etc.)
7. **Auth** — JWT login/register (`token/`, `token/refresh/`, `auth/google/`)
8. **Wishlist** — wire mock → real APIs
9. **User profile** — `auth/user`, `shipping-addresses`

### P2 — Content
10. **Articles** — `articles/listing`, `articles/detail`
11. **CMS** — `static-pages`, `main-menus`, `footer-menus`, `sliders`
12. **Orders** — `create-order`, `get-order-list`

### P3 — Admin
13. **Admin CRUD** — `admin-products`, `admin-brands`, etc.

---

## 6. Key Files to Create / Modify in jones/

```
jones/src/
├── lib/
│   ├── apiClient.ts          ← NEW: HTTP client (based on fetchClient.ts)
│   └── config.ts             ← UPDATE: add DJANGO_BASE_URL
├── types/
│   ├── backend.ts            ← NEW: backend response types
│   └── shared.ts             ← UPDATE: extend Product/User if needed
├── contexts/
│   ├── AuthContext/
│   │   └── api.ts            ← UPDATE: replace mocks with real calls
│   └── ProductsContext.tsx   ← UPDATE: fetch from backend instead of mock
├── hooks/
│   └── useProducts.ts        ← NEW: data fetching hook
└── pages/
    ├── index.tsx             ← UPDATE: fetch real data
    ├── product/[productSlug].tsx  ← UPDATE: fetch real data
    └── category/[...categoryId].tsx ← UPDATE: fetch real data
```

---

## 7. Notes

- **jones/ uses Pages Router** (`pages/`), not App Router — data fetching via `getServerSideProps` or `getStaticProps` + `getStaticPaths`.
- **Old frontend uses App Router** (`app/`) with RSC + `fetch()` with `revalidate`.
- **Auth pattern differs:**
  - Old: JWT in cookies (`js-cookie`), `fetchClient` auto-refreshes
  - jones: Mock auth in `AuthContext`, no real token handling
- **Image hosting:**
  - Old: GCS bucket (`https://storage.googleapis.com/jones-media/`)
  - jones: Cloudinary (hardcoded in `lib/config.ts`)
  - **Decision needed:** Keep GCS or migrate images to Cloudinary / local?
- **Cart pattern:**
  - Old: Dual-mode (localStorage guest + server cart for logged-in)
  - jones: Context-only, no localStorage persistence for guest cart
