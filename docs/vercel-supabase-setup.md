# Vercel + Supabase

## 1. Crear tablas en Supabase

1. abrir el SQL editor de Supabase
2. pegar el contenido de `docs/supabase-schema.sql`
3. ejecutar el script

## 2. Variables para Vercel

Cargar estas variables en el proyecto:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Tambien podes usarlas localmente copiando `.env.example` a `.env.local`.

## 3. Como decide el backend

- si encuentra `SUPABASE_URL` y una key, usa Supabase
- si no, sigue usando `data/tracker-store.json`

Eso te deja probar local sin romper nada y pasar a Vercel cuando quieras.

## 4. Deploy

1. subir el repo a GitHub
2. importar el repo en Vercel
3. agregar las variables de entorno
4. desplegar

## 5. Nota

La app movil no cambia: sigue consumiendo la misma API de Next.js.
