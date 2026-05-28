import Link from "next/link";
import { getPathString } from "src/utils";

const CategoriesData = require("@Data/CategoriesData.json");

export interface CategoryMenuItem {
  name: string;
  slug?: string;
}

// ── BRANDS raw data (for dynamic rendering in Header & Sidebar) ─────────────
export const brandsData: Record<string, string[]> = CategoriesData.brands;

// ── CATEGORIES ──────────────────────────────────────────────────────────────
export const categories: string[] = CategoriesData.categories;

export function buildCategoriesList(categoryItems: CategoryMenuItem[]) {
  return [
  ...categoryItems
    .filter((category) => (category.slug || getPathString(category.name)) !== "all")
    .map((category) => (
      <li key={category.slug || category.name} className="sidebar__links-item sidebar__links-accordion">
        <Link href={"/category/" + (category.slug || getPathString(category.name))}>
          <a className="sidebar__anchor" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {category.name}
          </a>
        </Link>
      </li>
    )),
  <li key="view-all" className="sidebar__links-item sidebar__links-accordion">
    <Link href="/category/all">
      <a className="sidebar__anchor" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        VIEW ALL
      </a>
    </Link>
  </li>,
  ];
}
