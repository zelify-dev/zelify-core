# Zelify Core

Base inicial para una plataforma de core banking SaaS.

## Stack inicial

- Next.js 16 con App Router
- Tamagui para sistema visual y componentes
- TypeScript
- ESLint

## Scripts

- `npm run dev`: entorno local
- `npm run build`: build de produccion
- `npm run lint`: validacion de lint
- `npm run tamagui:css`: genera `public/tamagui.generated.css` sin transformar `src`
- `npm run tamagui:build`: alias de compatibilidad para generar el CSS

## Estado actual

- Proyecto Next inicializado en la raiz del repo
- Tamagui configurado y conectado al layout principal
- Pantalla inicial reemplazada por una base alineada al producto
- El flujo de desarrollo evita transformar archivos dentro de `src` para no ensuciar el editor

## Arquitectura

- La guia oficial de estructura y reglas del repo vive en [ARCHITECTURE.md](/Users/vicente/Documents/GitHub/zelify-core/ARCHITECTURE.md)
