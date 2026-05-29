import { useCallback, useEffect, useState } from "react";

import { getBrandGroups, normalizeBrandGroups, type BrandGroupItem } from "@Lib/api/catalog";

export default function useBrandGroups() {
  const [brandGroups, setBrandGroups] = useState<Record<string, BrandGroupItem[]>>({});
  const [loading, setLoading] = useState(true);

  const refreshBrandGroups = useCallback(async (forceRefresh = false) => {
    setLoading(true);

    try {
      const response = await getBrandGroups({ forceRefresh });
      const groups = normalizeBrandGroups(response);
      setBrandGroups(groups);
    } catch {
      setBrandGroups({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshBrandGroups();
  }, [refreshBrandGroups]);

  return {
    brandGroups,
    loading,
    refreshBrandGroups,
  };
}