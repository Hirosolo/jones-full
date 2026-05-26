import { useCallback, useEffect, useState } from "react";

import { getBrandGroups, normalizeBrandGroups } from "@Lib/api/catalog";

export default function useBrandGroups() {
  const [brandGroups, setBrandGroups] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  const refreshBrandGroups = useCallback(async () => {
    setLoading(true);

    try {
      const response = await getBrandGroups();
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