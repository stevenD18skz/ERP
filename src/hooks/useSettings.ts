"use client";

// Configuración de la tienda, cacheada con SWR igual que useSession — la
// misma caché persistida en localStorage la respalda entre recargas, y
// useSession.logout() la limpia junto con el resto para que la tienda
// siguiente que inicie sesión en este aparato no la herede.
import { useCallback } from "react";
import useSWR from "swr";

import { getSettings, updateSettings } from "@/services/settings.service";
import { DEFAULT_SETTINGS, mergeSettings, type BoxesSettings } from "@/lib/settings";
import { useIsClient } from "@/hooks/useIsClient";

const SETTINGS_KEY = "/api/settings";

export function useSettings() {
  const isClient = useIsClient();
  const { data, isLoading, mutate } = useSWR<BoxesSettings>(
    isClient ? SETTINGS_KEY : null,
    getSettings,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    },
  );

  const settings = data ?? DEFAULT_SETTINGS;

  const update = useCallback(
    async (patch: Partial<BoxesSettings>) => {
      const optimistic = mergeSettings({ ...settings, ...patch });
      await mutate(() => updateSettings(patch), {
        optimisticData: optimistic,
        rollbackOnError: true,
        revalidate: false,
      });
    },
    [mutate, settings],
  );

  return { settings, loading: !isClient || isLoading, update };
}
