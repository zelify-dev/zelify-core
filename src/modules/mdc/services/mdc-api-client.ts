export const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  // 1. Obtén el org_id y user_name de donde los tengas guardados en tu frontend.
  // Usualmente esto está en el localStorage, sessionStorage o en un estado global.
  // Aquí asumo localStorage como ejemplo:
  const orgId = localStorage.getItem('organization_id') || ""; 
  const userName = localStorage.getItem('full_name') || "";

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
