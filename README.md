# Arquetipo Frontend · Apps internas con BFF

Arquetipo del **Chapter Frontend de Pragma** para aplicaciones internas en React que consumen un **BFF**. Es un esqueleto sin dominio: la única pantalla comprueba la conexión con el BFF y se reemplaza por la primera página del proyecto.

Trae resuelto:
- **Atomic design** con reglas de importación verificadas por Fallow.
- **Theme generado desde el Figma** (Variables → tokens).
- **Integración con el BFF:** `fetch` + TanStack Query, sesión del BFF y errores RFC 9457.
- **Quality gate configurable** (`pnpm quality`), con tests e2e y de accesibilidad.
- **Despliegue en AWS** (S3 + CloudFront) con Terraform y CI portable (GitHub Actions y Azure DevOps).

## Requisitos

- Node `>=22.18`
- pnpm 11 (versión fijada en `packageManager`)

## Inicio rápido

```bash
pnpm install
pnpm exec playwright install chromium   # una sola vez, para los tests e2e
pnpm dev:mock
```

Abre `http://localhost:5173`. Con `dev:mock`, el BFF está simulado con MSW y no hace falta backend.

Para usar un BFF real, copia `.env.example` a `.env.local`, define `API_PROXY_TARGET` y corre `pnpm dev`. Vite hace proxy de `/api` en el mismo origen, así que la cookie de sesión funciona igual que en producción.

## Variables de entorno

Ninguna `VITE_*` es secreta: terminan dentro del bundle. Se validan al arrancar; si una es inválida, la app no arranca.

| Variable | Para qué | Por defecto |
|---|---|---|
| `VITE_API_BASE_URL` | Ruta del BFF, en el mismo origen | `/api` |
| `VITE_LOGIN_URL` | Adónde ir ante un 401 (se agrega `?returnTo=`) | `/api/auth/login` |
| `VITE_API_MOCKS` | `true` levanta el BFF simulado | `false` |
| `API_PROXY_TARGET` | Solo en desarrollo: BFF real al que se hace proxy | — |

## Scripts

| Script | Qué hace |
|---|---|
| `pnpm dev` / `pnpm dev:mock` | Servidor de desarrollo contra el BFF real (proxy) o el simulado |
| `pnpm build` | Revisa los tipos y genera `dist/` (estático) |
| `pnpm test` | Tests unitarios y de páginas (Vitest + Testing Library + MSW) |
| `pnpm test:e2e` | Tests e2e y de accesibilidad sobre el build (Playwright + axe) |
| `pnpm lint` | TypeScript y Biome |
| `pnpm analyze` | Fallow: código muerto, complejidad, duplicación y arquitectura |
| `pnpm quality` | El quality gate completo; es lo que corre la CI |
| `pnpm tokens` | Regenera el theme desde `src/theme/design-tokens.json` |
| `pnpm deploy:s3` | Sube el build a S3 y renueva CloudFront (ver [despliegue](docs/deployment.md)) |

## Stack

React 19 (React Compiler) · TypeScript estricto · Vite · React Router · TanStack Query · Tailwind 4 · MSW · Vitest · Playwright · Biome · Fallow · Terraform

## Estructura

```
src/
├── app/          arranque: router, layout raíz, página de error
├── pages/        una carpeta por página (página + view model + test)
├── components/   atomic design: atoms/ molecules/ organisms/ templates/
├── api/          un archivo por recurso del BFF
├── lib/          infraestructura: env, cliente HTTP, errores, query client
├── theme/        design-tokens.json (Figma) → tokens.css
├── mocks/        BFF simulado (MSW)
└── test/         setup y utilidades de prueba
e2e/              tests e2e (Playwright)
scripts/          generador de tokens, runner del quality gate y despliegue
infra/            Terraform: S3, CloudFront y rol de despliegue
ci/               plantilla de Azure DevOps (la de GitHub está en .github/workflows)
```

## Documentación

| Documento | Contenido |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Capas view → service → adapter, atomic design y cómo agregar una funcionalidad |
| [docs/bff-integration.md](docs/bff-integration.md) | Sesión, errores, concurrencia y recetas (formularios, listados, conflictos) |
| [docs/figma-to-code.md](docs/figma-to-code.md) | Tokens en dos capas y el paso a paso al recibir un Figma |
| [docs/quality-gate.md](docs/quality-gate.md) | Qué revisa el gate, sus parámetros y cómo se prueba |
| [docs/deployment.md](docs/deployment.md) | Infraestructura, despliegue, CI portable y el contrato con el BFF |
| [docs/observability.md](docs/observability.md) | Receta para agregar observabilidad (RUM) si el proyecto la necesita |
| [docs/decisions.md](docs/decisions.md) | Por qué este stack |
