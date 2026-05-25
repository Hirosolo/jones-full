import { useEffect, useState } from "react";

import { getDefaultBrandGroups, getResolvedBrandGroups } from "@Lib/api/catalog";

export default function useBrandGroups() {
  const [brandGroups, setBrandGroups] = useState<Record<string, string[]>>(
    getDefaultBrandGroups()
  );

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