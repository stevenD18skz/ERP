// Configuración de la tienda: leer y guardar contra /api/settings.

export async function getSettings() {
  const response = await fetch("/api/settings", {
    headers: { Accept: "application/json" },
  });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      body?.error?.message || "No se pudo cargar la configuración",
    );
  }

  return body?.data ?? null;
}

export async function updateSettings(patch) {
  const response = await fetch("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      body?.error?.message || "No se pudo guardar la configuración",
    );
  }

  return body?.data ?? null;
}
