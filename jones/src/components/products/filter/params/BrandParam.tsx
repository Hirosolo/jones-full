import { useEffect, useState } from "react";

import FilterHeaderParam from "../FilterHeaderParam";

import { useProductsState } from "@Contexts/ProductsContext";
import { getResolvedBrandGroups, type BrandGroupItem } from "@Lib/api/catalog";

export default function BrandParam() {
  const { filterListings, filterState } = useProductsState();
  const [brandGroups, setBrandGroups] = useState<Record<string, BrandGroupItem[]>>({});
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getResolvedBrandGroups()
      .then((groups) => {
        if (!active) return;

        setBrandGroups(groups);
        const firstGroup = Object.keys(groups)[0] || null;
        setActiveGroup((currentGroup) => currentGroup || firstGroup);
      })
      .catch(() => {
        if (active) {
          setBrandGroups({});
          setActiveGroup(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (!Object.keys(brandGroups).length) {
    return null;
  }

  return (
    <FilterHeaderParam type="Brand">
      <div className="filter-param__grouped-list">
        {Object.entries(brandGroups).map(([groupName, brands]) => {
          const isOpen = activeGroup === groupName;

          return (
            <div key={groupName} className="filter-param__group">
              <button
                type="button"
                className={
                  "filter-param__group-title" +
                  (isOpen ? " filter-param__group-title--active" : "")
                }
                onClick={() => setActiveGroup(isOpen ? null : groupName)}
              >
                <span>{groupName}</span>
                <span>{isOpen ? "-" : "+"}</span>
              </button>

              {isOpen ? (
                <div className="filter-param__group-items">
                  {brands.map((brand) => {
                    const active = filterState.brand === brand.slug;

                    return (
                      <button
                        key={brand.slug}
                        type="button"
                        className={
                          "filter-param__option filter-param__option--button" +
                          (active ? " filter-param__option--checked" : "")
                        }
                        onClick={() => filterListings({ brand: brand.slug })}
                      >
                        {brand.name}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </FilterHeaderParam>
  );
}