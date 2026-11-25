# Observabilidad (opcional)

El esqueleto trae un adaptador de telemetría que **no envía nada** hasta que el proyecto conecte un proveedor (Datadog, Dynatrace, New Relic, OpenTelemetry…). Si el proyecto no usa RUM, no hay que hacer nada.

## Qué viene listo

| Señal | Cómo | Dónde |
|---|---|---|
| **Vistas** | Un evento por pantalla, con el `id` de la ruta (nunca la URL, que puede llevar ids) | `app/root-layout.tsx` + `id` en `app/router.tsx` |
| **Errores** | Uno por request fallido, con clase, status y Correlation-Id (une el evento con los logs del BFF) | `lib/http/query-client.ts` |

Todo pasa por `lib/telemetry.ts`. En desarrollo, los eventos salen por consola (`main.tsx`).

## Conectar un proveedor

Se hace en un solo lugar, `main.tsx`. Por ejemplo, con Datadog RUM:

```ts
datadogRum.init({ /* … */ actionNameAttribute: 'data-track' });
setTelemetrySink((event) => {
  if (event.type === 'view') datadogRum.startView({ name: event.name });
  if (event.type === 'action') datadogRum.addAction(event.name, event.attributes);
  if (event.type === 'error') datadogRum.addError(event.name, event.attributes);
});
```

Cambiar de proveedor toca solo ese bloque.

## Si el proyecto quiere nombrar interacciones

`Button` y `TextLink` aceptan un `trackId` **opcional**, que se renderiza como `data-track`. El RUM lo usa como nombre de la acción, sin código de tracking en los handlers:

```tsx
<Button onClick={save} trackId="user-form.save">Guardar</Button>
```

Para lo que el DOM no ve (un guardado exitoso, una aprobación), se usa `telemetry.action` desde el view model:

```ts
telemetry.action('user-form.saved', { mode: 'create' });
```

### Convención

- Formato `<ámbito>.<elemento>` en kebab-case: `user-form.save`, `pagination.next`. El ámbito es la página o el componente compartido.
- **Siempre estático:** nunca se ponen ids, nombres, correos ni otros datos de la persona en un nombre o en sus atributos.
- `conventions.spec.ts` falla si un `trackId` no es un texto fijo (`trackId={…}`) o no respeta el formato.
