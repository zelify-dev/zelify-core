export const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const orgId = typeof window !== "undefined" ? localStorage.getItem("organization_id") || "" : "";
  const userName = typeof window !== "undefined" ? localStorage.getItem("full_name") || "" : "";

  // 2. Preparamos las cabeceras
  const headers = new Headers(init?.headers);
  
  // 3. Inyectamos las cabeceras extra para la trazabilidad del backend
  if (orgId) {
    headers.set('x-org-id', orgId);
  }
  if (userName) {
    headers.set('x-user-name', userName);
  }

  // 4. Retornamos la llamada fetch original, pero con nuestras cabeceras inyectadas
  return fetch(input, {
    ...init,
    headers,
  });
};
