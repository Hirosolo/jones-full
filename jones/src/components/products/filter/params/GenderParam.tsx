import Link from "next/link";

import FilterHeaderParam from "../FilterHeaderParam";

import { useProductsState } from "@Contexts/ProductsContext";
import { buildProductListingHref } from "src/utils";

export default function GenderParam() {
  const { filterListings, filterState } = useProductsState();

  return (
    <FilterHeaderParam type="Gender">
      {["men", "women", "kids", "baby", "unisex"].map((gender) => (
        <p
          className={
            "filter-param__link" +
            (gender == filterState.gender.toLowerCase()
              ? " filter-param__link--active"
              : "")
          }
          key={gender}
        >
          <Link href={buildProductListingHref({ gender: gender.toUpperCase() })}>
            <a
              onClick={(e) => {
                e.preventDefault();
                filterListings({ gender: gender.toUpperCase() });
              }}
            >
              {gender.toUpperCase()}
            </a>
          </Link>
        </p>
      ))}
    </FilterHeaderParam>
  );
}
