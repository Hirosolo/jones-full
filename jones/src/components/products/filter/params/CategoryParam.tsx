import { useEffect, useState } from "react";

import RadioList from "@Components/formControls/RadioList";
import FilterHeaderParam from "../FilterHeaderParam";

import { useProductsState } from "@Contexts/ProductsContext";
import { getCategories } from "@Lib/api/catalog";
import { getPathString } from "src/utils";

export default function CategoryParam() {
  const { filterListings, filterState } = useProductsState();
  const [categories, setCategories] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;

    getCategories()
      .then((items) => {
        if (!active) return;

        setCategories(
          items
            .filter((category) => getPathString(category.slug || category.name) !== "all")
            .reduce<Record<string, string>>((accumulator, category) => {
              const slug = getPathString(category.slug || category.name);
              accumulator[slug] = category.name;
              return accumulator;
            }, {})
        );
      })
      .catch(() => {
        if (active) {
          setCategories({});
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (!Object.keys(categories).length) {
    return null;
  }

  return (
    <FilterHeaderParam type="Category">
      <RadioList
        name="category"
        values={categories}
        checkedItems={filterState.category ? [filterState.category] : []}
        key={`category-param-${filterState.category || "all"}`}
        onChecked={(item) => filterListings({ category: item as string })}
      />
    </FilterHeaderParam>
  );
}