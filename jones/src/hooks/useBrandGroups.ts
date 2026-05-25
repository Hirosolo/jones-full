import { useEffect, useState } from "react";

import {
  getDefaultBrandGroups,
  getResolvedBrandGroups,
  type BrandGroupsMap,
} from "@Lib/api/catalog";

export default function useBrandGroups(): BrandGroupsMap {
  const [brandGroups, setBrandGroups] = useState<BrandGroupsMap>(getDefaultBrandGroups());

  useEffect(() => {
    let active = true;

    getResolvedBrandGroups()
      .then((groups) => {
        if (active) {
          setBrandGroups(groups);
        }
      })
      .catch(() => {
        if (active) {
          setBrandGroups(getDefaultBrandGroups());
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return brandGroups;
}