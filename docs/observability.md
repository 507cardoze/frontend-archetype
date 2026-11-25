# Receta: observabilidad

El esqueleto **no trae telemetría**. Esta receta es para el proyecto que necesite RUM (Datadog, Dynatrace, New Relic, OpenTelemetry…) y quiera hacerlo sin atar el código al proveedor.

## La idea

| Señal | Cómo | Dónde |
|---|---|---|
| **Vistas** | Un evento por pantalla, con el `id` de la ruta (nunca la URL, que puede llevar ids) | Layout raíz + `id` en cada ruta |
| **Errores** | Uno por request fallido, con su clase y status | `onError` del query client |
| **Interacciones** | Atributo `data-track` en botones y enlaces; el RUM lo usa como nombre de la acción | Átomos interactivos |
| **Resultados de negocio** | Lo que el DOM no ve (un guardado, una aprobación) | View models |

Todo pasa por un adaptador. Cambiar de proveedor toca un solo archivo.

## 1. El adaptador

```ts
// src/lib/telemetry.ts
type Attributes = Record<string, string | number | boolean>;
type TelemetryEvent =
  | { type: 'view'; name: string }
  | { type: 'action'; name: string; attributes?: Attributes }
  | { type: 'error'; name: string; attributes: Attributes };

let sink: (event: TelemetryEvent) => void = () => {};

export const setTelemetrySink = (next: (event: TelemetryEvent) => void) => {
  sink = next;
};

export const telemetry = {
  action: (name: string, attributes?: Attributes) => sink({ attributes, name, type: 'action' }),
  error: (name: string, attributes: Attributes) => sink({ attributes, name, type: 'error' }),
  view: (name: string) => sink({ name, type: 'view' }),
};
```

## 2. Conectar el proveedor (`main.tsx`)

```ts
datadogRum.init({ /* … */ actionNameAttribute: 'data-track' });
setTelemetrySink((event) => {
  if (event.type === 'view') datadogRum.startView({ name: event.name });
  if (event.type === 'action') datadogRum.addAction(event.name, event.attributes);
  if (event.type === 'error') datadogRum.addError(event.name, event.attributes);
});
```

## 3. Vistas y errores automáticos

```ts
// app/router.tsx: cada ruta con un id → { id: 'user-form', path: ..., lazy: ... }

// app/root-layout.tsx
const routeId = useMatches().at(-1)?.id;
useEffect(() => {
  if (routeId) telemetry.view(routeId);
}, [routeId]);

// lib/http/query-client.ts, dentro de onError
if (error instanceof ProblemError) {
  telemetry.error('http', { errorClass: error.errorClass, status: error.status });
}
```

## 4. Interacciones y resultados

Se agrega un `trackId` opcional a `Button` y `TextLink`, y se renderiza como `data-track`:

```tsx
<Button onClick={save} trackId="user-form.save">Guardar</Button>
```

Lo que el DOM no ve se reporta desde el view model:

```ts
telemetry.action('user-form.saved', { mode: 'create' });
```

## Convención y datos sensibles

- Formato `<ámbito>.<elemento>` en kebab-case: `user-form.save`, `pagination.next`. El ámbito es la página o el componente compartido.
- **Siempre estático:** nunca se ponen ids, nombres, correos ni otros datos de la persona en un nombre o en sus atributos.
- Si el RUM graba sesiones, se enmascaran todos los campos de formulario por defecto.
- Para trazar un request de punta a punta (front → BFF), se usa el estándar W3C Trace Context (`traceparent`), que ya agregan OpenTelemetry y la mayoría de los RUM. No hace falta un header propio.
