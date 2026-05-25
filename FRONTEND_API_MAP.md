# Frontend API Map

This file is the quickest way to answer:

- What frontend feature uses which API?
- Which shared wrapper or Next.js route is responsible?
- What backend route does it ultimately hit?

Use it together with [ROUTE_CONTEXT.md](ROUTE_CONTEXT.md) when you need the full frontend-to-backend-to-database path.

## How to read this

There are three kinds of frontend API usage in this repo:

- Shared wrappers in `frontend/src/apis/*`.
- Next.js proxy routes in `frontend/src/app/api/*`.
- Direct `fetch()` calls in larger UI files, especially `frontend/src/app/admin/page.tsx`.

Shared wrapper paths are written the same way the code uses them, so `/shop/...`, `/articles/...`, and `/utils/...` are resolved by `frontend/src/lib/http/fetchClient.ts` against the backend `/api` base.

## Feature Map

| Feature / component | Frontend caller(s) | API wrapper(s) | Backend route(s) | What it is for |
| --- | --- | --- | --- | --- |
| Home page hero and landing content | `frontend/src/app/(main)/page.tsx` | `heroSliderApi`, `articlesApi`, `categoryApi`, `productsApi` | `/api/utils/sliders/`, `/api/articles/featured/`, `/api/shop/categories-list/`, `/api/shop/best-selling-products/`, `/api/shop/latest-products/`, `/api/shop/weekly-bestsellers/` | Homepage banners, featured articles, category sections, and product carousels |
| Main header navigation | `frontend/src/layouts/Header/index.tsx`, `frontend/src/layouts/Header/Header.tsx`, `frontend/src/layouts/Header/NavUser.tsx` | `menuApi`, `categoryApi`, `brandsApi`, `brandGroupsApi`, `usersApi` | `/utils/main-menus/`, `/shop/categories-list/`, `/api/shop/brands-list/`, `/api/brand-groups`, `/auth/user/` | Header menus, category links, brand dropdowns, and signed-in user state |
| Header search bar | `frontend/src/layouts/Header/SearchBar.tsx`, `frontend/src/app/(main)/search/SearchContainer.tsx` | `searchApi` | `/api/search` -> `/api/shop/search-products/` | Site-wide product search |
| Footer navigation | `frontend/src/layouts/Footer/index.tsx`, `frontend/src/layouts/Footer/Footer.tsx` | `footerApi` | `/utils/footer-menus/` | Footer menu groups and links |
| Product detail page | `frontend/src/app/(main)/p/[slug]/page.tsx`, `frontend/src/app/(main)/p/[slug]/ProductDetailContainer.tsx` | `productsApi`, `wishlistApi`, `reviewsApi` | `/api/shop/product-detail/`, `/api/shop/product-slug-aliases/`, `/api/shop/check-item-wishlist/`, `/api/shop/product-review/` | Product details, slug aliases, wishlist state, and review loading |
| Product review form | `frontend/src/sections/write-review/WriteReviewContainer.tsx`, `frontend/src/sections/write-review/ReviewForm.tsx` | `productsApi`, `reviewsApi` | `/api/shop/product-review/`, `/api/shop/product-review-create/` | Listing and submitting product reviews |
| Category listing pages | `frontend/src/app/(main)/c/page.tsx`, `frontend/src/app/(main)/c/[slug]/page.tsx`, `frontend/src/app/(main)/c/[slug]/CategoryList.tsx`, `frontend/src/app/(main)/c/[slug]/ListProduct.tsx` | `categoryApi`, `productsApi`, `brandsApi` | `/shop/categories-list/`, `/api/shop/category-product-list/`, `/api/shop/brands-list/` | Category browsing and category-specific product lists |
| Brand listing pages | `frontend/src/app/(main)/b/page.tsx`, `frontend/src/app/(main)/b/[slug]/page.tsx`, `frontend/src/app/(main)/b/BrandListContainer.tsx`, `frontend/src/app/(main)/b/[slug]/ListProduct.tsx` | `brandsApi`, `brandGroupsApi`, `productsApi`, `categoryApi` | `/api/shop/brands-list/`, `/api/shop/brand-groups/`, `/api/shop/brand-product-list/`, `/api/shop/categories-list/` | Brand browsing, brand grouping, and brand-specific product lists |
| Tag listing pages for products | `frontend/src/app/(main)/t/page.tsx`, `frontend/src/app/(main)/t/[slug]/page.tsx`, `frontend/src/app/(main)/t/TagsListContainer.tsx`, `frontend/src/app/(main)/t/[slug]/ListProduct.tsx` | `tagsProductApi`, `productsApi`, `brandsApi`, `categoryApi` | `/api/shop/tags-list/`, `/api/shop/tag-product-list/`, `/api/shop/brands-list/`, `/api/shop/categories-list/` | Tag taxonomy and products filtered by tag |
| Blog listing and blog detail | `frontend/src/app/(main)/blog/page.tsx`, `frontend/src/app/(main)/blog/BlogContainer.tsx`, `frontend/src/app/(main)/blog/CategoryContainer.tsx`, `frontend/src/app/(main)/blog/[slug]/page.tsx`, `frontend/src/app/(main)/blog/[slug]/BlogByCategoryContainer.tsx` | `articlesApi`, `tagsArticlesApi` | `/api/articles/listing/`, `/api/articles/featured/`, `/api/articles/category/`, `/api/articles/tag/`, `/api/articles/author/`, `/api/articles/detail/`, `/api/articles/category-list/`, `/api/articles/tag-list/` | Blog list, featured posts, category pages, tag pages, and article detail |
| Legacy article route compatibility | `frontend/src/app/(main)/articles/[slug]/page.tsx`, `frontend/src/app/(main)/articles/[slug]/BlogDetailContainer.tsx` | `articlesApi` | `/api/articles/detail/` | Keeps old article URLs working while using the current article backend |
| Static pages | `frontend/src/app/(main)/page/[slug]/page.tsx`, `frontend/src/app/(main)/page/[slug]/PagesContainer.tsx` | `pagesApi` | `/utils/static-pages/` | CMS-driven static pages such as About, Contact, Policy pages, and track-order style content |
| Cart page | `frontend/src/app/(main)/cart/page.tsx`, `frontend/src/app/(main)/cart/CartContainer.tsx`, `frontend/src/app/(main)/cart/useMutationUpdateQuantityCart.ts`, `frontend/src/sections/cart/CartTopLogin.tsx` | `cartApi` | `/shop/cart-items/`, `/shop/add-to-cart/`, `/shop/remove-cart-item/`, `/shop/update-cart-quantity/`, `/shop/clear-cart/`, `/shop/merge-cart-on-login/` | Cart load, quantity updates, item removal, clear cart, and login merge |
| Checkout page | `frontend/src/app/(main)/checkout/page.tsx`, `frontend/src/sections/checkout/CheckoutStep.tsx`, `frontend/src/components/checkout/GetAddress.tsx` | `cartApi`, `orderApi`, `usersApi` | `/shop/cart-items/`, `/shop/create-order/`, `/shop/get-order-list/`, `/profiles/shipping-addresses/`, `/profiles/shipping-addresses/manage/` | Checkout review, order creation, and shipping address selection |
| Wishlist page and wishlist button | `frontend/src/app/(main)/wishlists/page.tsx`, `frontend/src/app/(main)/wishlists/mutations.ts`, `frontend/src/sections/wishlists/WishlistsContainer.tsx`, `frontend/src/components/commerce-ui/WishListButton.tsx` | `wishlistApi` | `/shop/get-wishlist/`, `/shop/action-to-wishlist/`, `/shop/check-item-wishlist/` | Wishlist listing, add/remove actions, and wishlist state per product |
| My account profile and address pages | `frontend/src/app/(main)/my-account/profile/page.tsx`, `frontend/src/app/(main)/my-account/address/page.tsx`, `frontend/src/sections/my-account/AddressAccount.tsx`, `frontend/src/components/checkout/GetAddress.tsx` | `usersApi` | `/auth/user/`, `/profiles/shipping-addresses/`, `/profiles/shipping-addresses/manage/`, `/profiles/shipping-addresses/delete/<pk>` | Account profile data and shipping address CRUD |
| My account orders | `frontend/src/app/(main)/my-account/orders/page.tsx`, `frontend/src/app/(main)/my-account/orders/[code]/page.tsx`, `frontend/src/sections/my-account/order/OrderAccount.tsx`, `frontend/src/app/(main)/my-account/orders/[code]/OrderDetailContainer.tsx` | `orderApi` | `/shop/get-order-list/`, `/shop/get-order-detail/`, `/shop/create-order/` | Order history and order detail views |
| Login, logout, and token refresh | `frontend/src/sections/dialog/LoginDialog.tsx`, `frontend/src/components/my-account/MyAccountSidebar.tsx` | `authApi`, `usersApi` | `/auth/token/refresh/`, `/auth/logout/`, `/auth/google/`, `/auth/user/` | Authentication flow and signed-in session management |
| Admin console content and assets | `frontend/src/app/admin/page.tsx` | direct `fetch()` calls | `/api/admin/auth`, `/api/admin/content`, `/api/admin/media`, `/api/admin/upload`, `/api/admin/revalidate` | Admin login, CMS content editing, media library, upload, and cache purge |
| Admin products | `frontend/src/app/admin/page.tsx` | direct `fetch()` calls | `/api/admin/products`, `/api/admin/products/[id]`, `/api/admin/products/options` | Admin product list, create, update, delete, and option helpers |
| Admin brands | `frontend/src/app/admin/page.tsx` | direct `fetch()` calls | `/api/admin/brands`, `/api/admin/brands/[id]` | Admin brand CRUD. Backend mapping: `GET /api/admin/brands -> /api/shop/admin-brands/`, `POST /api/admin/brands -> /api/shop/admin-brands/create/`, `GET /api/admin/brands/[id] -> /api/shop/admin-brands/<id>/`, `PUT/PATCH /api/admin/brands/[id] -> /api/shop/admin-brands/<id>/update/`, `DELETE /api/admin/brands/[id] -> /api/shop/admin-brands/<id>/delete/` |
| Admin categories | `frontend/src/app/admin/page.tsx` | direct `fetch()` calls | `/api/admin/categories`, `/api/admin/categories/[id]` | Admin category CRUD. Backend mapping: `GET /api/admin/categories -> /api/shop/admin-categories/`, `POST /api/admin/categories -> /api/shop/admin-categories/create/`, `GET /api/admin/categories/[id] -> /api/shop/admin-categories/<id>/`, `PUT/PATCH /api/admin/categories/[id] -> /api/shop/admin-categories/<id>/update/`, `DELETE /api/admin/categories/[id] -> /api/shop/admin-categories/<id>/delete/` |
| Admin tags | `frontend/src/app/admin/page.tsx` | direct `fetch()` calls | `/api/admin/tags`, `/api/admin/tags/[id]` | Admin tag CRUD |
| Admin article management | `frontend/src/app/admin/page.tsx` | direct `fetch()` calls | `/api/admin/articles`, `/api/admin/articles/[id]`, `/api/admin/articles/options`, `/api/admin/article-categories`, `/api/admin/article-categories/[id]` | Admin article and article-category CRUD |
| Admin menus | `frontend/src/app/admin/page.tsx` | direct `fetch()` calls | `/api/admin/menus`, `/api/admin/menus/[id]` | Admin menu editing |

## Shared API Wrappers

This section is the fastest reference when you already know the wrapper name.

### `productsApi`

Used by product pages, product detail sections, homepage product carousels, sitemap routes, and tag/category/brand pages.

Calls:

- `/api/shop/category-product-list/`
- `/api/shop/product-detail/`
- `/api/shop/brand-product-list/`
- `/api/shop/best-selling-products/`
- `/api/shop/latest-products/`
- `/api/shop/weekly-bestsellers/`
- `/api/shop/product-review/`
- `/api/shop/tag-product-list/`
- `/api/shop/sitemap-products/`

### `cartApi`

Used by the cart page, checkout step, and login merge logic.

Calls:

- `/shop/add-to-cart/`
- `/shop/cart-items/`
- `/shop/merge-cart-on-login/`
- `/shop/remove-cart-item/`
- `/shop/update-cart-quantity/`
- `/shop/clear-cart/`

### `wishlistApi`

Used by the wishlist page and the product wishlist button.

Calls:

- `/shop/get-wishlist/`
- `/shop/action-to-wishlist/`
- `/shop/check-item-wishlist/`

### `orderApi`

Used by checkout and account order history.

Calls:

- `/shop/create-order/`
- `/shop/get-order-list/`
- `/shop/get-order-detail/`

### `reviewsApi`

Used by the review form and product detail review section.

Calls:

- `/shop/product-review-create/`
- `/shop/product-review-list/`

### `categoryApi`

Used by the header, homepage, category pages, brand pages, tag pages, and category sitemap.

Calls:

- `/shop/categories-list/`

### `brandsApi`

Used by the header, brand pages, category pages, tag pages, and brand sitemap.

Calls:

- `/api/shop/brands-list/`

### `brandGroupsApi`

Used by the header and brand list pages.

Calls:

- `/api/shop/brand-groups/`
- `/api/brand-groups` through the Next.js proxy when running in the browser

### `tagsProductApi`

Used by the product tag listing page, the tag listing container, and the product tags sitemap.

Calls:

- `/api/shop/tags-list/`

### `tagsArticlesApi`

Used by blog tag pages and tag listing containers.

Calls:

- `/articles/tag-list/`
- `/articles/tag/`

### `articlesApi`

Used by the homepage, blog pages, article detail pages, article tag/category pages, and the article sitemap.

Calls:

- `/api/articles/listing/`
- `/api/articles/detail/`
- `/api/articles/featured/`
- `/api/articles/category/`
- `/api/articles/category-list/`

### `pagesApi`

Used by the CMS static page route.

Calls:

- `/utils/static-pages/`

### `heroSliderApi`

Used by the homepage hero section.

Calls:

- `/utils/sliders/`

### `footerApi`

Used by the footer layout.

Calls:

- `/utils/footer-menus/`

### `menuApi`

Used by the header layout.

Calls:

- `/utils/main-menus/`

### `searchApi`

Used by the search bar and the dedicated search page.

Calls:

- `/api/search` -> `/api/shop/search-products/`

### `authApi`

Used by the login dialog and account sidebar.

Calls:

- `/auth/token/refresh/`
- `/auth/logout/`
- `/auth/google/`

### `usersApi`

Used by the account sidebar, login dialog, address page, and checkout address picker.

Calls:

- `/auth/user/`
- `/profiles/shipping-addresses/`
- `/profiles/shipping-addresses/manage/`
- `/profiles/shipping-addresses/delete/<pk>`

## Route-Level API Files

These are the Next.js routes that exist mainly to hide Django behind same-origin browser calls.

- `frontend/src/app/api/search/route.ts` -> `/api/shop/search-products/`
- `frontend/src/app/api/brand-groups/route.ts` -> `/api/shop/brand-groups/`
- `frontend/src/app/api/brand-leagues/route.ts` -> `/api/shop/admin-brands/`
- `frontend/src/app/api/admin/auth/route.ts` -> local auth cookie handler
- `frontend/src/app/api/admin/content/route.ts` -> CMS content storage
- `frontend/src/app/api/admin/products/route.ts` and `frontend/src/app/api/admin/products/[id]/route.ts` -> `/api/shop/admin-products/`
- `frontend/src/app/api/admin/products/options/route.ts` -> `/api/shop/admin-products/options/`
- `frontend/src/app/api/admin/brands/route.ts` -> `GET /api/shop/admin-brands/`, `POST /api/shop/admin-brands/create/`
- `frontend/src/app/api/admin/brands/[id]/route.ts` -> `GET /api/shop/admin-brands/<id>/`, `PUT/PATCH /api/shop/admin-brands/<id>/update/`, `DELETE /api/shop/admin-brands/<id>/delete/`
- `frontend/src/app/api/admin/categories/route.ts` -> `GET /api/shop/admin-categories/`, `POST /api/shop/admin-categories/create/`
- `frontend/src/app/api/admin/categories/[id]/route.ts` -> `GET /api/shop/admin-categories/<id>/`, `PUT/PATCH /api/shop/admin-categories/<id>/update/`, `DELETE /api/shop/admin-categories/<id>/delete/`
- `frontend/src/app/api/admin/tags/route.ts` and `frontend/src/app/api/admin/tags/[id]/route.ts` -> `/api/shop/admin-tags/`
- `frontend/src/app/api/admin/articles/route.ts` and `frontend/src/app/api/admin/articles/[id]/route.ts` -> `/api/articles/admin-articles/`
- `frontend/src/app/api/admin/article-categories/route.ts` and `frontend/src/app/api/admin/article-categories/[id]/route.ts` -> `/api/articles/admin-article-categories/`
- `frontend/src/app/api/admin/menus/route.ts` and `frontend/src/app/api/admin/menus/[id]/route.ts` -> `/api/utils/main-menus/` and admin menu endpoints
- `frontend/src/app/api/admin/media/route.ts` and `frontend/src/app/api/admin/upload/route.ts` -> media library and upload helpers
- `frontend/src/app/api/admin/revalidate/route.ts` -> Next.js cache invalidation after admin edits

## SEO and Sitemap Routes

These routes are used for build-time or server-generated XML and do not usually correspond to a visible UI page.

- `frontend/src/app/product-sitemap.xml/route.ts` -> `productsApi.getSitemapProducts()`
- `frontend/src/app/categories-sitemap.xml/route.ts` -> `categoryApi.getCategories()`
- `frontend/src/app/brand-sitemap.xml/route.ts` -> `brandsApi.getBrands()`
- `frontend/src/app/articles-sitemap.xml/route.ts` -> `articlesApi.getCategories()` and article data generation

## Practical Shortcut

If you need to trace a feature fast:

1. Find the page or component in `frontend/src/app/...`, `frontend/src/layouts/...`, or `frontend/src/sections/...`.
2. Check which wrapper it imports from `frontend/src/apis/*`.
3. Follow the wrapper to the Django route or Next.js proxy route.
4. Jump back to [ROUTE_CONTEXT.md](ROUTE_CONTEXT.md) when you need the database-table side of the map.
