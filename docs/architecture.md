# Arquitectura

## Capas: view → service → adapter

Sigue el steering *Clean Architecture para React* del chapter.

| Capa | Dónde | Responsabilidad |
|---|---|---|
| **View** | `components/` y `pages/*/*-page.tsx` | Solo renderiza. No calcula ni llama al BFF |
| **Service** | `pages/*/use-*-vm.ts` (view model) y `*.schema.ts` | Estado de la pantalla, casos de uso y reglas del formulario |
| **Adapter** | `api/*.ts` y `lib/http/` | Habla con el BFF. La UI nunca ve `fetch` ni las URLs |

La dependencia siempre apunta hacia adentro: la página usa su view model, el view model usa `api/`, y `api/` usa `lib/http`.

Si una página solo muestra datos, puede usar el hook de `api/` directamente (como `pages/home`). El view model aparece cuando la página tiene estado o lógica propia.

## Atomic design

Cada nivel se define por **qué puede importar**. Fallow lo verifica en cada import, con las zonas de `boundaries` en `.fallowrc.json`.

| Nivel | Qué es | Puede importar | En el esqueleto |
|---|---|---|---|
| **Átomo** | Un elemento con estilo | Theme | `Button`, `TextLink`, `Alert`, `Spinner` |
| **Molécula** | 2 o más átomos con un solo propósito | Átomos | `Loader` (Spinner + texto) |
| **Organismo** | Una sección con sentido propio; recibe los datos por props | Moléculas y átomos | `ErrorState`, `QueryState`, `AppHeader` |
| **Template** | La estructura de una página, con espacios (slots) | Organismos y menores | `AppShell`, `PageLayout` |
| **Página** | Template + organismos + datos reales | Todo, incluido `api/` | `pages/home` |

Además:
- Ningún componente importa `api/`, `pages/` ni `app/`.
- `api/` y `lib/` no importan UI.
- Solo `lib/http` llama a `fetch`, y nadie usa `localStorage` ni `sessionStorage` (`boundaries.calls.forbidden`).
- Una página no importa otra página; lo compartido baja a `components/` o a `api/`. Esta regla es de revisión de código, porque Fallow trata `pages/` como una sola zona.

Los componentes del esqueleto son la base mínima. El resto llega con el Figma de cada proyecto, en el nivel que corresponda y con el mismo nombre ([figma-to-code.md](figma-to-code.md)).

## Cómo agregar una funcionalidad

1. **Adapter:** `api/<recurso>.ts` con los tipos, las cache keys, las queries y las mutations (ver `api/health.ts`).
2. **Mock:** los endpoints en `mocks/handlers.ts`, respondiendo como el BFF real.
3. **Página:** `pages/<página>/` con `<página>-page.tsx` (solo composición) y, si hace falta, `use-<página>-vm.ts` y `<página>.schema.ts`.
4. **Componentes:** lo que traiga el Figma, en su nivel.
5. **Ruta:** una entrada lazy en `app/router.tsx`.
6. **Test:** `<página>-page.spec.tsx` con `renderRoute` (ver [quality-gate.md](quality-gate.md#pruebas)).
7. **Gate:** `pnpm quality` en verde antes de abrir el PR.

Para formularios, listados y conflictos de versión, ver las recetas de [bff-integration.md](bff-integration.md#recetas).
