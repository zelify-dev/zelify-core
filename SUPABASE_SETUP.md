# Integracion Supabase - Zelify Core

## 1) Variables de entorno

Crear archivo `.env.local` en la raiz del proyecto:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<tu-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<tu publishable key>
SUPABASE_SERVICE_ROLE_KEY=<tu service role key>
```

## 2) Crear esquema y datos iniciales

1. Abrir Supabase Dashboard -> SQL Editor.
2. Ejecutar los archivos en este orden:
   - `supabase/migrations/20260428_zelify_core_init.sql`
   - `supabase/migrations/20260428_zelify_core_seed_dashboard.sql`

Esto crea:
- `customers`
- `groups`
- `group_members`
- `group_roles`
- indices y trigger para `members_count`.

Y ademas carga datos iniciales visibles en el Dashboard (Table Editor).

## 2.1) Volver a cargar datos de demo cuando quieras

Puedes volver a ejecutar solo:

- `supabase/migrations/20260428_zelify_core_seed_dashboard.sql`

Es idempotente: actualiza registros existentes por `id` y agrega nuevos sin romper los ya creados.

## 3) Modulos conectados a BD real

Ya quedan conectados por API Routes:
- `GET/POST /api/customers`
- `GET/POST/DELETE /api/groups`

Pantallas con persistencia:
- `Clientes`: listado + crear cliente.
- `Grupos`: listado + crear/editar + eliminar grupo.

## 4) Notas de seguridad

- Nunca subir `SUPABASE_SERVICE_ROLE_KEY` al repositorio.
- Si una llave ya fue compartida en texto plano, rotarla en Supabase.
