# Quality gate

`pnpm quality` corre todos los pasos aunque alguno falle, para que una sola corrida muestre todo lo que hay que arreglar. Al final imprime un resumen y sale con código 1 si algo falló. La CI corre el mismo comando (`.github/workflows/quality.yml`):

```bash
pnpm install --frozen-lockfile && pnpm quality
```

| Paso | Herramienta | Falla si… |
|---|---|---|
| Tipos | `tsc -b` | hay errores de TypeScript (modo estricto) |
| Lint y formato | `biome ci` | hay reglas rotas o código sin formatear |
| Tests y cobertura | `vitest --coverage` | falla un test o la cobertura queda bajo el mínimo |
| Análisis estático | Fallow | hay código muerto, dependencias sin uso, ciclos, complejidad o CRAP sobre el umbral, duplicación o violaciones de arquitectura |
| Build | `vite build` | el build de producción no compila |
| E2E y accesibilidad | Playwright + axe | la app no arranca sobre el build real, una ruta profunda no carga o hay violaciones de accesibilidad |

La CI corre además un job `infra`: `terraform fmt`, `validate` y `test` (con AWS simulado) sobre `infra/`.

## Parámetros

Cada proyecto ajusta tres archivos; el runner (`scripts/quality-gate.ts`) no se toca.

**`quality-gate.json`**

| Clave | Qué controla | Por defecto |
|---|---|---|
| `steps.<paso>` | Activa o desactiva `typecheck`, `lint`, `test`, `staticAnalysis`, `build` y `e2e` | todos `true` |
| `coverage.lines` / `statements` / `functions` / `branches` | Cobertura mínima en % | 80 / 80 / 80 / 70 |
| `staticAnalysis.scope` | `project` analiza todo; `changes` solo lo que cambia frente a `base` | `project` |
| `staticAnalysis.base` | Rama de comparación cuando `scope` es `changes` | `origin/main` |

**`.fallowrc.json`** (con autocompletado por su `$schema`)

| Sección | Qué controla |
|---|---|
| `rules` | La severidad (`error`, `warn`, `off`) de cada tipo de hallazgo |
| `health` | Umbrales por función: `maxCyclomatic`, `maxCognitive`, `maxCrap` (complejidad × falta de tests), `maxUnitSize`, `maxFileLines` |
| `duplicates` | Qué cuenta como duplicado y el % máximo permitido |
| `boundaries` | Las zonas de atomic design y de capas, y las llamadas prohibidas |
| `dynamicallyLoaded`, `ignoreExports`, `ignoreDependencies` | Solo falsos positivos **confirmados** |

**`biome.json`**: lint y formato.

## Adoptarlo en un proyecto con deuda

Con `"scope": "changes"`, Fallow solo falla por lo que **introduce** la rama. La deuda anterior se ve, pero no bloquea el merge. La CI necesita el historial completo (`fetch-depth: 0` o equivalente).

Corrige, no suprimas: un hallazgo de Fallow es una señal, y los `ignore*` son solo para falsos positivos confirmados.

## Pruebas

- Las **páginas** se prueban como las usa una persona: `renderRoute` monta las rutas reales y se consulta por rol o por label, lo que además valida la accesibilidad básica.
- El BFF lo simula **MSW** con los mismos handlers de `dev:mock`. Un request sin handler hace fallar el test; cada caso puede sobrescribir uno con `server.use(...)`.
- La **lógica pura** (errores, cliente HTTP, schemas, scripts) tiene tests unitarios. Si no los tiene, Fallow la marca por CRAP.
- `conventions.spec.ts` protege lo que ningún linter ve: que los componentes usen solo tokens del theme.
- Los **e2e** (`e2e/`) corren en Chromium sobre el build de producción en modo mock: la app compilada, sin backend. Antes de la primera vez: `pnpm exec playwright install chromium`.

## Dependencias

- **Dependabot** (`.github/dependabot.yml`) propone actualizaciones semanales de npm, GitHub Actions y Terraform, y espera 14 días antes de proponer una versión nueva.
- **pnpm** solo permite scripts de instalación a los paquetes listados en `allowBuilds`, y con `trustPolicy: no-downgrade` rechaza una versión publicada con menos garantías de origen que la anterior.
