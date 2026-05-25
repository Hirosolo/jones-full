# Route Context Map

This is the canonical handoff file for the repository.
Use it to jump from a frontend feature to the Next.js proxy layer, then to the Django route, then to the database tables.

## Mental Model

- `pod_shop` is the current storefront and CMS stack mounted at `/api/shop/`.
- `myshop` is the legacy storefront stack still mounted at `/api/products/`.
- `articles`, `profiles`, and `utils` are separate Django apps with their own API mounts.
- Frontend pages live in `frontend/src/app/...`.
- Frontend proxy routes live in `frontend/src/app/api/...`.
- Table names follow Django defaults: `<app_label>_<model_name>` unless a model sets `db_table`.

## Request Flow

Most features follow this path:

1. Frontend page in `frontend/src/app/...`.
2. Optional Next.js proxy in `frontend/src/app/api/...` if the browser must stay same-origin.
3. Django app route from `backend/jones/urls.py` and the app-level `urls.py`.
4. Database tables owned by the Django models in that app.

## Top-Level Django Mounts

From `backend/jones/urls.py`:

- `/api/products/` -> `myshop.api.urls`
- `/api/shop/` -> `pod_shop.api.urls`
- `/api/articles/` -> `articles.api.urls`
- `/api/utils/` -> `utils.api.urls`
- `/api/profiles/` -> `profiles.api.urls`
- `/api/token/`, `/api/auth/`, `/api/django/auth/` -> auth/platform flows
- `/api/schema/` and `/api/docs/` -> API docs only
- `/acp/` -> Django admin
- `/articles/<slug>/` and `/page/<slug>/` -> Django fake views for compatibility

## Fast Lookup

| Frontend feature | Frontend file(s) | Django route(s) | Main tables |
| --- | --- | --- | --- |
| Home page | `frontend/src/app/(main)/page.tsx` | `/api/shop/cms/site-content/`, `/api/shop/sliders/`, `/api/utils/main-menus/`, `/api/utils/footer-menus/` | `pod_shop_cmscontent`, `utils_homeslider`, `utils_mainmenu`, `utils_submenugroup`, `utils_submenuitem`, `utils_footermenugroup`, `utils_footermenuitem`, `pod_shop_product`, `articles_article` |
| Product detail | `frontend/src/app/(main)/p/[slug]/page.tsx` | `frontend/middleware.ts` checks `/api/shop/product-slug-aliases/`; detail data comes from `/api/shop/product-detail/` | `pod_shop_product`, `pod_shop_productvariant`, `pod_shop_productimage`, `pod_shop_productcolorimage`, `pod_shop_review`, `pod_shop_wishlist`, `pod_shop_cartitem`, `pod_shop_productslugalias` |
| Category browse | `frontend/src/app/(main)/c/page.tsx`, `frontend/src/app/(main)/c/[slug]/page.tsx` | `/api/shop/categories-list/`, `/api/shop/category-product-list/` | `pod_shop_category`, `pod_shop_product` |
| Brand browse | `frontend/src/app/(main)/b/page.tsx`, `frontend/src/app/(main)/b/[slug]/page.tsx` | `/api/shop/brands-list/`, `/api/shop/brand-product-list/`, plus admin-facing `/api/brand-groups/` and `/api/brand-leagues/` proxies | `pod_shop_brand`, `pod_shop_product` |
| Tag browse | `frontend/src/app/(main)/t/page.tsx`, `frontend/src/app/(main)/t/[slug]/page.tsx`, `frontend/src/app/(main)/tags/[slug]/page.tsx` | `/api/shop/tags-list/`, `/api/shop/tag-product-list/` | `pod_shop_tag`, `pod_shop_product` |
| Sale / featured landing | `frontend/src/app/(main)/sale/page.tsx` | `/api/shop/featured-products/`, `/api/shop/best-selling-products/`, `/api/shop/latest-products/`, `/api/shop/weekly-bestsellers/` | `pod_shop_product`, `pod_shop_productvariant` |
| Search | `frontend/src/app/(main)/search/page.tsx` | `frontend/src/app/api/search/route.ts` -> `/api/shop/search-products/` | `pod_shop_product`, `pod_shop_brand`, `pod_shop_category`, `pod_shop_tag` |
| Cart / checkout / wishlist / order success | `frontend/src/app/(main)/cart/page.tsx`, `frontend/src/app/(main)/checkout/page.tsx`, `frontend/src/app/(main)/wishlists/page.tsx`, `frontend/src/app/order-success/page.tsx` | `/api/shop/cart-items/`, `/api/shop/add-to-cart/`, `/api/shop/remove-cart-item/`, `/api/shop/update-cart-quantity/`, `/api/shop/create-order/`, `/api/shop/merge-cart-on-login/`, `/api/shop/get-wishlist/`, `/api/shop/action-to-wishlist/`, `/api/shop/check-item-wishlist/` | `pod_shop_cartitem`, `pod_shop_order`, `pod_shop_orderitem`, `pod_shop_wishlist`, `pod_shop_product`, `pod_shop_productvariant` |
| My account profile and addresses | `frontend/src/app/(main)/my-account/profile/page.tsx`, `frontend/src/app/(main)/my-account/address/page.tsx` | `/api/profiles/shipping-addresses/`, `/api/profiles/shipping-addresses/manage/`, `/api/profiles/shipping-addresses/delete/<pk>` | `profiles_profile`, `profiles_shipping`, `auth_user` |
| My account orders | `frontend/src/app/(main)/my-account/orders/page.tsx`, `frontend/src/app/(main)/my-account/orders/[code]/page.tsx` | Usually cart/order helpers under `/api/shop/get-order-list/` and `/api/shop/get-order-detail/` | `pod_shop_order`, `pod_shop_orderitem`, `pod_shop_shippingfee`, `pod_shop_ordertax` |
| Blog listing and detail | `frontend/src/app/(main)/blog/page.tsx`, `frontend/src/app/(main)/blog/[slug]/page.tsx` | `/api/articles/listing/`, `/api/articles/featured/`, `/api/articles/category/`, `/api/articles/tag/`, `/api/articles/author/`, `/api/articles/detail/` | `articles_article`, `articles_articlecategory`, `articles_articletag`, `articles_articlecomment`, `articles_timeline` |
| Legacy article compatibility | `frontend/src/app/(main)/articles/[slug]/page.tsx` | Django fake view `/articles/<slug>/` keeps old links alive | `articles_article` |
| Static pages | `frontend/src/app/(main)/page/[slug]/page.tsx` and the marketing pages under `frontend/src/app/(main)/...` | `/api/utils/static-pages/` and CMS payloads from `/api/shop/cms/site-content/` | `utils_staticpage`, `pod_shop_cmscontent` |
| Admin console | `frontend/src/app/admin/page.tsx` | Mostly proxies in `frontend/src/app/api/admin/*` to `/api/shop/*`, `/api/articles/*`, and `/api/utils/*` | Depends on the section being edited |

## Next.js Proxy Routes

These routes sit in front of Django to keep the browser same-origin and to centralize admin logic.

| Next.js route | Target |
| --- | --- |
| `/api/search` | `/api/shop/search-products/` |
| `/api/brand-groups` | `/api/shop/brand-groups/` |
| `/api/brand-leagues` | `/api/shop/admin-brands/` |
| `/api/admin/auth` | Next-only auth cookie handler, no Django call |
| `/api/admin/content` | `pod_shop_cmscontent` via `frontend/src/lib/contentStorage.ts` |
| `/api/admin/products` and `/api/admin/products/[id]` | `/api/shop/admin-products/` |
| `/api/admin/products/options` | `/api/shop/admin-products/options/` |
| `/api/admin/brands` | `GET -> /api/shop/admin-brands/`, `POST -> /api/shop/admin-brands/create/` |
| `/api/admin/brands/[id]` | `GET -> /api/shop/admin-brands/<id>/`, `PUT/PATCH -> /api/shop/admin-brands/<id>/update/`, `DELETE -> /api/shop/admin-brands/<id>/delete/` |
| `/api/admin/categories` | `GET -> /api/shop/admin-categories/`, `POST -> /api/shop/admin-categories/create/` |
| `/api/admin/categories/[id]` | `GET -> /api/shop/admin-categories/<id>/`, `PUT/PATCH -> /api/shop/admin-categories/<id>/update/`, `DELETE -> /api/shop/admin-categories/<id>/delete/` |
| `/api/admin/tags` and `/api/admin/tags/[id]` | `/api/shop/admin-tags/` |
| `/api/admin/articles` and `/api/admin/articles/[id]` | `/api/articles/admin-articles/` |
| `/api/admin/article-categories` and `/api/admin/article-categories/[id]` | `/api/articles/admin-article-categories/` |
| `/api/admin/menus` and `/api/admin/menus/[id]` | Django menu endpoints under `/api/utils/` |
| `/api/admin/media` and `/api/admin/upload` | Media upload and proxy helpers used by the admin UI |
| `/media/[...path]` | Proxies Django media files from `/media/` |

## Table Families By App

### Storefront / shop (`pod_shop`)

Main tables:

- `pod_shop_brand`
- `pod_shop_category`
- `pod_shop_tag`
- `pod_shop_product`
- `pod_shop_productvariant`
- `pod_shop_productimage`
- `pod_shop_productcolor`
- `pod_shop_productsize`
- `pod_shop_productcolorimage`
- `pod_shop_productattr`
- `pod_shop_productattritem`
- `pod_shop_productslugalias`
- `pod_shop_review`
- `pod_shop_bulkreview`
- `pod_shop_wishlist`
- `pod_shop_cartitem`
- `pod_shop_ordertax`
- `pod_shop_shippingfee`
- `pod_shop_order`
- `pod_shop_orderitem`

Route families:

- Catalog and filtering: `/api/shop/categories-list/`, `/api/shop/brands-list/`, `/api/shop/tags-list/`
- Product lists: `/api/shop/featured-products/`, `/api/shop/best-selling-products/`, `/api/shop/latest-products/`, `/api/shop/weekly-bestsellers/`, `/api/shop/search-products/`
- Product detail: `/api/shop/product-detail/`, `/api/shop/product-slug-aliases/`
- Cart and checkout: `/api/shop/cart-items/`, `/api/shop/add-to-cart/`, `/api/shop/create-order/`
- Wishlist: `/api/shop/get-wishlist/`, `/api/shop/action-to-wishlist/`
- Admin CRUD: `/api/shop/admin-products/` + `/api/shop/admin-products/<id>/`, `/api/shop/admin-brands/` + `/api/shop/admin-brands/<id>/`, `/api/shop/admin-categories/` + `/api/shop/admin-categories/<id>/`, `/api/shop/admin-tags/`

### Legacy shop (`myshop`)

This stack still exists under `/api/products/` and the Django `myshop` app.

Main tables:

- `myshop_brand`
- `myshop_category`
- `myshop_tag`
- `myshop_product`
- `myshop_productcolor`
- `myshop_productsize`
- `myshop_productcolorimage`
- `myshop_productvariant`
- `myshop_productimage`
- `myshop_productattr`
- `myshop_productattritem`
- `myshop_productslugalias`
- `myshop_review`
- `myshop_wishlist`
- `myshop_cartitem`
- `myshop_ordertax`
- `myshop_shippingfee`
- `myshop_order`
- `myshop_orderitem`

Route families:

- `/api/products/` product listing and detail routes
- `/api/products/cart-*` cart operations
- `/api/products/product-review*` review operations
- `/api/products/get-wishlist/`, `/api/products/action-to-wishlist/`

### Articles / blog (`articles`)

Main tables:

- `articles_articlecategory`
- `articles_articletag`
- `articles_article`
- `articles_articlecomment`
- `articles_timeline`

Route families:

- Public listing: `/api/articles/listing/`, `/api/articles/featured/`, `/api/articles/category/`, `/api/articles/tag/`, `/api/articles/author/`, `/api/articles/detail/`
- Admin CRUD: `/api/articles/admin-articles/`, `/api/articles/admin-article-categories/`

### CMS / menus / static pages (`utils` + `pod_shop` CMS content)

Main tables:

- `utils_homeslider`
- `utils_mainmenu`
- `utils_submenugroup`
- `utils_submenuitem`
- `utils_footermenugroup`
- `utils_footermenuitem`
- `utils_staticpage`
- `pod_shop_cmscontent`

Route families:

- `/api/utils/sliders/`
- `/api/utils/main-menus/`
- `/api/utils/footer-menus/`
- `/api/utils/search/`
- `/api/utils/static-pages/`
- `/api/shop/cms/site-content/`
- `/api/shop/cms/site-content/save/`

### Profiles / account (`profiles`)

Main tables:

- `profiles_profile`
- `profiles_shipping`

Route families:

- `/api/profiles/shipping-addresses/`
- `/api/profiles/shipping-addresses/manage/`
- `/api/profiles/shipping-addresses/delete/<pk>`

### Auth / platform

Tables:

- Django auth tables such as `auth_user`

Route families:

- `/api/token/`, `/api/token/refresh/`, `/api/token/verify/`, `/api/token/blacklist/`
- `/api/auth/`, `/api/auth/google/`, `/api/auth/registration/`
- `/api/django/auth/`
- `/api/utils/django/auth/next/jwt/`, `/api/utils/django/auth/next/session/`, `/api/utils/django/auth/next/logout/`

## Practical Shortcut

If you are trying to understand a feature quickly, use this order:

1. Find the frontend page in `frontend/src/app/.../page.tsx`.
2. Check whether it calls a local handler in `frontend/src/app/api/...` or hits Django directly through `frontend/src/lib/http/fetchClient.ts`.
3. Match the Django path to the owning app in `backend/*/urls.py`.
4. Use the app model list to jump to the database tables.
