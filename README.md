# Arquetipo Frontend · Apps internas con BFF

Este es el arquetipo del **Chapter Frontend de Pragma** para aplicaciones internas en React que consumen un **BFF**. Con él, un proyecto arranca con cinco cosas ya resueltas:

1. **Del Figma al código sin interpretar.** Los tokens se generan desde las Variables del Figma, y cada componente del Figma tiene su par en el código con el mismo nombre.
2. **Atomic design con reglas verificadas.** Átomos, moléculas, organismos, templates y páginas, con un test que falla si alguien rompe los niveles.
3. **Integración con el BFF hecha bien desde el día uno.** Un solo cliente HTTP, la sesión la maneja el BFF, los errores se clasifican y los comandos nunca se reintentan solos.
4. **Observabilidad sin atarse a un proveedor.** Cada interacción tiene un nombre estable (`data-track`) y las vistas, los errores y los resultados de negocio pasan por un solo adaptador.
5. **Un quality gate configurable.** `pnpm quality` corre tipos, lint, tests con cobertura, análisis estático con Fallow y build, con las reglas en archivos que cada proyecto ajusta.

El ejemplo incluido (un CRUD de **Usuarios**) existe solo para mostrar los patrones. Un proyecto nuevo lo reemplaza por su propio dominio.

---

## Inicio rápido

Requisitos: Node `>=22.18` y pnpm.

```bash
pnpm install
pnpm dev:mock
```

Abre `http://localhost:5173`. El BFF está simulado con MSW, así que no hace falta backend.

Para trabajar contra un BFF real, copia `.env.example` a `.env.local`, define `API_PROXY_TARGET` y corre `pnpm dev`. Vite hace proxy de `/api` hacia ese BFF en el **mismo origen**, así que la cookie de sesión funciona igual que en producción.

| Script | Qué hace |
|---|---|
| `pnpm dev` / `dev:mock` | Servidor de desarrollo, contra el BFF real (proxy) o contra el simulado |
| `pnpm build` | Revisa los tipos y genera `dist/` (estático: S3 + CloudFront, Nginx, etc.) |
| `pnpm test` | Tests de páginas, de lógica pura y de convenciones |
| `pnpm lint` | `tsc` + Biome (formato, imports y reglas) |
| `pnpm analyze` | Fallow: código muerto, complejidad, duplicación y arquitectura |
| `pnpm quality` | **El quality gate completo** (lo mismo que corre la CI) |
| `pnpm tokens` | Regenera el theme desde `src/theme/design-tokens.json` |

---

## Estructura

```
src/
├── theme/           FIGMA → CÓDIGO
│   ├── design-tokens.json   Variables del Figma (W3C DTCG): fuente de verdad del diseño
│   ├── tokens.css           GENERADO por `pnpm tokens`; no se edita a mano
│   └── tone.ts              tonos de estado (info, success, warning, danger)
│
├── components/      ATOMIC DESIGN: solo UI, nunca llama al BFF
│   ├── atoms/         Button, Input, Select, Label, Alert, Spinner, TextLink, ButtonLink
│   ├── molecules/     FormField, SearchBox, Pagination, Loader
│   ├── organisms/     DataTable, ErrorState, QueryState, AppHeader
│   └── templates/     AppShell, PageLayout
│
├── pages/           PÁGINAS: template + organismos + datos (una carpeta por página)
│   ├── users-list/    users-list-page.tsx · use-users-list-vm.ts · spec
│   └── user-form/     user-form-page.tsx · use-user-form-vm.ts · user-form.schema.ts · specs
│
├── api/             ADAPTER del BFF: un archivo por recurso (tipos, cache keys, queries, mutations)
├── lib/             infraestructura: env validado, cliente HTTP, errores, query client, telemetría
├── app/             arranque: router, layout raíz, página de error
├── mocks/           BFF simulado (MSW), el mismo para desarrollar y para los tests
└── test/            setup, renderRoute y conventions.spec.ts (theme y track ids)

scripts/
├── build-tokens.ts  design-tokens.json → tokens.css
└── quality-gate.ts  el runner de `pnpm quality`

quality-gate.json    REGLAS DEL PROYECTO: qué pasos corren, cobertura mínima, alcance del análisis
.fallowrc.json       REGLAS DEL PROYECTO: código muerto, complejidad, duplicación, arquitectura
biome.json           REGLAS DEL PROYECTO: lint y formato
```

### Las capas: view → service → adapter

Sigue el steering *Clean Architecture para React* del chapter:

| Capa | Dónde | Responsabilidad |
|---|---|---|
| **View** | `components/` y `*-page.tsx` | Solo renderiza. No calcula ni llama al BFF. |
| **Service** | `use-*-vm.ts` (view model) y `*.schema.ts` | El estado de la pantalla, los casos de uso y las reglas del formulario. |
| **Adapter** | `api/*.ts` y `lib/http/` | Habla con el BFF. La UI nunca ve `fetch` ni las URLs. |

La dependencia apunta siempre hacia adentro: una página usa su VM, el VM usa `api/`, y `api/` usa `lib/http`. Nunca al revés.

---

## Atomic design

Para que no haya discusiones de clasificación, cada nivel se define por **qué puede importar**. Lo verifica **Fallow** en cada import, con las zonas y reglas de `boundaries` en `.fallowrc.json`.

| Nivel | Qué es | Puede importar | Ejemplo |
|---|---|---|---|
| **Átomo** | Un elemento con estilo | Theme | `Button`, `Input`, `Alert` |
| **Molécula** | 2 o más átomos con un solo propósito | Átomos | `FormField` = Label + control + error |
| **Organismo** | Una sección con sentido propio; recibe datos por props | Moléculas y átomos | `DataTable`, `ErrorState` |
| **Template** | La estructura de una página, con espacios (slots) | Organismos y menores | `PageLayout`, `AppShell` |
| **Página** | Template + organismos + datos reales | Todo, incluido `api/` vía su VM | `users-list-page.tsx` |

Además:
- Ningún componente importa `api/`, `pages/` ni `app/`: recibe los datos por props.
- `api/` y `lib/` no importan UI.
- Solo `lib/http` llama a `fetch`, y nadie usa `localStorage` ni `sessionStorage` (`boundaries.calls.forbidden`).
- Una página no importa otra página; lo compartido baja a `components/` o a `api/`. Esta regla es de revisión de código: Fallow trata `pages/` como una sola zona.

---

## Del Figma al código

| En el Figma | En el código | Cómo se traduce |
|---|---|---|
| Variables (color, espaciado, radio) | `theme/design-tokens.json` → `tokens.css` | Se exportan a JSON DTCG y se corre `pnpm tokens` |
| Estilos de texto | Tokens `typography` → `text-title`, `text-heading`, `text-body`, `text-caption` | Viajan en el mismo JSON |
| Componentes y variantes | `components/<nivel>/` con el mismo nombre; cada variante es una prop | Cada archivo indica su par (`// Figma: Button`) |
| Frames de pantalla | `pages/<página>/` | Se componen piezas de `components/`, sin estilos propios |

### Tokens en dos capas

| Colección | Ejemplo | Genera | La usan |
|---|---|---|---|
| `primitive`: valores crudos | `primitive.brand.600 = #4338ca` | `--brand-600`, **sin** clases | Solo los semánticos |
| `semantic`: el rol de cada valor | `semantic.color.primary = {primitive.brand.600}` | `--color-primary` → `bg-primary`, `text-primary` | Los componentes |

La regla de nombres es `semantic.<grupo>.<nombre>` → `--<grupo>-<nombre>` → clase `<utilidad>-<nombre>`. Por ejemplo, `semantic.radius.card` → `rounded-card`.

Si cambia el color de marca, se cambia un primitivo y todo lo hereda. Un theme por cliente o por país es otro JSON, sin tocar componentes.

**Sin escape:** `pnpm tokens` elimina la paleta y la escala de texto por defecto de Tailwind. Tailwind ignora en silencio las clases que no existen, así que `src/test/theme.spec.ts` revisa cada `.tsx` y **falla** si encuentra `bg-blue-500`, `text-sm`, `rounded-md` o un `#hex` suelto.

### Paso a paso al recibir un Figma

1. **Revisar las Variables con el diseñador:** dos colecciones (`primitive`, `semantic`), y los semánticos nombrados por rol (`primary`, `danger`, `surface`), no por apariencia.
2. **Exportarlas a JSON DTCG** (con la exportación de Figma o con un plugin como Tokens Studio), reemplazar `design-tokens.json`, correr `pnpm tokens` y revisar el diff.
3. **Hacer el inventario de componentes:** cada componente del Figma se mapea a uno de `components/` con el mismo nombre. Los que falten se crean en el nivel que corresponde.
4. **Construir las páginas** componiendo esas piezas.
5. **Correr `pnpm test`**, que verifica el theme y la arquitectura, y hacer una revisión visual contra el Figma.

> **Opcional:** Figma Code Connect enlaza cada componente del Figma con su archivo, para que Dev Mode muestre el código real. Si se usa IA (por ejemplo, el MCP de Figma), se necesita la autorización del cliente.

---

## Integración con el BFF

**Sesión.** El BFF es dueño de la sesión, con una cookie HttpOnly en el mismo origen. El front no maneja tokens. Si el BFF responde **401**, la app redirige a `VITE_LOGIN_URL?returnTo=<ruta actual>`. Funciona con cualquier BFF, sin importar el proveedor de identidad que haya detrás.

**Un solo cliente HTTP** (`lib/http/client.ts`). Solo lo usa `api/`. Envía un `X-Correlation-Id` en cada llamada y convierte cualquier falla en un `ProblemError`.

**Errores por clase, no por código HTTP** (`lib/http/problem.ts`):

| Status | Clase | ¿Se reintenta solo? | Qué ve el usuario |
|---|---|---|---|
| 401 | `unauthenticated` | — | Lo redirige al login del BFF |
| 403 | `forbidden` | No | "No tienes permiso…" |
| 404 | `not-found` | No | "No encontramos lo que buscas…" |
| 409 | `conflict` | No | "Los datos cambiaron…" y botón **Recargar** |
| 422 | `business` | No | El `detail` que envía el BFF |
| 423, 429 | `temporary` | Sí | "Servicio ocupado" y botón **Reintentar** |
| 503, o 5xx/red en una lectura | `availability` | Sí | "No se pudo conectar" y botón **Reintentar** |
| 5xx o red en un **comando** | `uncertain` | **Nunca** | "No sabemos si se aplicó. Verifica antes de repetir" |

La última fila evita duplicados: si guardar devuelve 500 o se corta la red, el BFF pudo haberlo aplicado. Cada error muestra el **código de seguimiento**, para que soporte encuentre el request en los logs del BFF.

**Concurrencia.** Las actualizaciones envían la `version` del registro. Si otra persona lo cambió, el BFF responde 409 y la pantalla ofrece recargar, sin reenviar nada.

**Estado del servidor.** Vive en TanStack Query, en memoria. No se guarda nada en localStorage ni en sessionStorage. Los filtros de los listados van en la URL.

---

## Observabilidad

La estrategia separa **qué hizo la persona** de **qué pasó en el sistema**, y en ninguno de los dos casos el código conoce al proveedor (Datadog, Dynatrace, New Relic, OpenTelemetry…).

| Señal | Cómo se captura | Dónde vive |
|---|---|---|
| **Interacciones** (clics) | Atributo `data-track` en el DOM. El RUM lo lee como nombre de la acción; no hay código de tracking en los handlers. | Átomos interactivos: `Button`, `ButtonLink`, `TextLink` |
| **Vistas** | Un evento por pantalla, con el **id de la ruta** (nunca la URL, que puede llevar ids) | `app/root-layout.tsx` + `id` en `app/router.tsx` |
| **Errores** | Uno por request fallido, con clase, status y **Correlation-Id** (une el evento con los logs del BFF) | `lib/http/query-client.ts` |
| **Resultados de negocio** | Lo que el DOM no ve (guardado, aprobado): `telemetry.action('user-form.saved')` | Los view models (capa service) |

### Convención de nombres

`<ámbito>.<elemento>` en kebab-case: `users-list.new-user`, `user-form.save`, `pagination.next`.
- **Ámbito** = la página o el componente compartido que lo contiene. Un componente compartido usa su propio nombre (`search-box.submit`), y el RUM agrega la vista en la que ocurrió.
- **Siempre estático.** Nunca se ponen ids, correos ni datos de la persona en un nombre ni en sus atributos.

Esto se hace cumplir así:
- `trackId` es **obligatorio** en los átomos interactivos, así que no compila un botón sin nombre.
- Su tipo exige el formato `x.y`.
- `conventions.spec.ts` falla si un `trackId` no es un texto fijo (`trackId={…}`) o si no respeta el formato.

### Conectar el proveedor

`lib/telemetry.ts` es el único adaptador. En `main.tsx` se conecta el proveedor con `setTelemetrySink`; por defecto no se envía nada, y en desarrollo los eventos salen por consola. Un ejemplo con Datadog RUM:

```ts
datadogRum.init({ /* … */ actionNameAttribute: 'data-track' }); // los clics usan nuestros nombres
setTelemetrySink((event) => {
  if (event.type === 'view') datadogRum.startView({ name: event.name });
  if (event.type === 'action') datadogRum.addAction(event.name, event.attributes);
  if (event.type === 'error') datadogRum.addError(event.name, event.attributes);
});
```

Con OpenTelemetry, el sink crea spans o logs. Cambiar de proveedor toca un solo archivo.

---

## Quality gate

`pnpm quality` corre todos los pasos aunque alguno falle, para que una sola corrida muestre todo lo que hay que arreglar. Al final imprime el resumen y sale con código 1 si algo falló. La CI corre **el mismo comando**:

```bash
pnpm install --frozen-lockfile && pnpm quality
```

| Paso | Herramienta | Falla si… |
|---|---|---|
| Tipos | `tsc -b` | hay errores de TypeScript (modo estricto) |
| Lint y formato | `biome ci` | hay reglas rotas o código sin formatear |
| Tests y cobertura | `vitest --coverage` | falla un test o la cobertura queda bajo el mínimo |
| Análisis estático | **Fallow** | hay código muerto, dependencias sin uso, ciclos, complejidad o CRAP sobre el umbral, duplicación o violaciones de arquitectura |
| Build | `vite build` | el build de producción no compila |

### Las reglas del proyecto (todo parametrizable)

Cada proyecto ajusta **tres archivos**; el runner no se toca.

**`quality-gate.json`**: qué corre y con qué mínimos.

| Clave | Qué controla | Por defecto |
|---|---|---|
| `steps.<paso>` | Activa o desactiva `typecheck`, `lint`, `test`, `staticAnalysis` y `build` | todos `true` |
| `coverage.lines` / `statements` / `functions` / `branches` | Cobertura mínima en % (Vitest la usa como `thresholds`) | 80 / 80 / 80 / 70 |
| `staticAnalysis.scope` | `project`: analiza todo · `changes`: solo lo que cambia frente a `base` | `project` |
| `staticAnalysis.base` | Rama de comparación cuando `scope` es `changes` | `origin/main` |

**`.fallowrc.json`**: las reglas de análisis estático. Tiene autocompletado por su `$schema`.

| Sección | Qué controla |
|---|---|
| `rules` | La severidad (`error`, `warn` u `off`) de cada tipo de hallazgo: exports sin uso, ciclos, `boundary-violation`, etc. |
| `health` | Umbrales por función: `maxCyclomatic`, `maxCognitive`, `maxCrap` (complejidad × falta de tests), `maxUnitSize`, `maxFileLines` |
| `duplicates` | Qué cuenta como duplicado (`minLines`) y el % máximo permitido (`threshold`) |
| `boundaries` | Las zonas de atomic design y de capas, qué puede importar cada una, y las llamadas prohibidas (`fetch`, `localStorage`) |
| `dynamicallyLoaded`, `ignoreExports`, `ignoreDependencies` | Falsos positivos **confirmados** (por ejemplo, las páginas lazy) |

**`biome.json`**: las reglas de lint y el formato.

### Adoptarlo en un proyecto con deuda

En un repositorio existente, `"scope": "changes"` hace que Fallow solo falle por lo que **introduce** la rama, no por la deuda anterior. La deuda vieja se ve, pero no bloquea el merge, y se va bajando con PRs pequeñas. Para comparar contra la rama base, la CI necesita el historial completo (`fetch-depth: 0` o equivalente).

**Corrige, no suprimas:** un hallazgo de Fallow es una señal. Solo se agregan a los `ignore*` los falsos positivos confirmados, nunca para callar el gate.

---

## El ejemplo: Usuarios

| Si necesitas… | Míralo en |
|---|---|
| Un listado con búsqueda, paginación y estado vacío | `pages/users-list/` |
| Filtros en la URL (se comparten y funcionan con "atrás") | `use-users-list-vm.ts` |
| Un formulario de crear y editar con validación | `pages/user-form/` |
| Nombrar interacciones y reportar un resultado de negocio | `trackId` en las páginas · `telemetry.action` en `use-user-form-vm.ts` |
| Un campo que aparece según otro (y no se valida si está oculto) | `user-form.schema.ts` → `team` |
| Reglas de formulario como lógica pura, con test | `user-form.schema.ts` + su `.spec.ts` |
| Un adapter de recurso del BFF | `api/users.ts` |
| Los estados cargando, error y datos en una sola línea | `organisms/query-state.tsx` |
| Recargar ante un 409 y reintentar solo lo seguro | `use-user-form-vm.ts` → `retrySave` |
| Probar una página completa contra el BFF simulado | `*-page.spec.tsx` con `renderRoute` |

### Para agregar una funcionalidad

1. **Adapter:** `api/<recurso>.ts` con los tipos, las cache keys, las queries y las mutations.
2. **Mock:** los endpoints en `mocks/handlers.ts`, respondiendo como el BFF real.
3. **Página:** `pages/<página>/` con `*-page.tsx` (solo composición), `use-*-vm.ts` y, si hay formulario, `*.schema.ts`.
4. **Componentes:** si el Figma trae algo nuevo, se agrega a `components/` en su nivel.
5. **Ruta:** una entrada lazy en `app/router.tsx`.
6. **Test:** `*-page.spec.tsx` con `renderRoute`. Como mínimo: datos, validación, guardado y un error.
7. **Gate:** `pnpm quality` en verde antes de abrir el PR.

---

## Pruebas

- Se prueban las **páginas como las usa una persona**: se renderizan las rutas reales y se consulta por rol o por label, lo que de paso valida la accesibilidad básica.
- El BFF lo simula **MSW** con los mismos handlers de `dev:mock`. Un request sin handler hace fallar el test.
- La lógica pura (clasificación de errores, schemas, generador de tokens, runner del gate) tiene tests unitarios. Si no los tiene, Fallow la marca por CRAP.
- `conventions.spec.ts` protege lo que ningún linter ve (tokens del theme y track ids); Fallow protege la arquitectura.

---

## Decisiones

| Decisión | Por qué |
|---|---|
| Vite + React 19 (con React Compiler) + TypeScript estricto | SPA interna: no necesita SSR ni SEO. Memoización automática. |
| TanStack Query | El estado vive en el BFF; Query maneja caché, reintentos y concurrencia. No hace falta un store global. |
| react-hook-form + zod | Formularios grandes sin re-render por tecla; las reglas quedan como datos testeables. |
| Tailwind 4 con tokens desde Figma | Los tokens son variables CSS que genera el JSON del Figma. No hay objeto de theme duplicado en TypeScript. |
| Controles nativos envueltos en átomos propios | Accesibilidad y teclado del navegador; el aspecto lo pone el Figma del proyecto, no una librería de UI. |
| Cookie del BFF, sin tokens en el navegador | Un XSS no puede robar la sesión, y el front no depende del proveedor de identidad. |
| MSW | El mismo mock para desarrollar y para probar, a nivel de red. El código de producción no sabe que está simulado. |
| Biome | Lint y formato en una sola herramienta rápida. |
| Fallow | Ve el proyecto completo (no archivo por archivo): código muerto, ciclos, CRAP con cobertura real, duplicación y las reglas de atomic design como `boundaries`. Un solo análisis reemplaza varios scripts caseros. |
| Telemetría por adaptador + `data-track` | Los clics se nombran en el DOM y no ensucian los handlers. El proveedor se cambia en un archivo. |
| Un runner propio para el gate | Un solo comando para el desarrollador y la CI, con las reglas en archivos de configuración. |
