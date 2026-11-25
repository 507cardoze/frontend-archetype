/**
 * Vendor-neutral telemetry (adapter layer). Components never call a vendor SDK:
 * - interactions: interactive atoms render `data-track="<scope>.<element>"`, which RUM tools
 *   (Datadog, Dynatrace, New Relic, OpenTelemetry) read as the action name;
 * - views, errors and business outcomes go through `telemetry`, and main.tsx plugs the sink.
 * By default nothing is sent. Names are static identifiers: never put user data in them.
 */

/** `<scope>.<element>` in kebab-case, e.g. `user-form.save`. Static, never user data. */
export type TrackId = `${string}.${string}`;

type Attributes = Record<string, string | number | boolean>;

type TelemetryEvent =
  | { type: 'view'; name: string }
  | { type: 'action'; name: TrackId; attributes?: Attributes | undefined }
  | { type: 'error'; name: string; attributes: Attributes };

let sink: (event: TelemetryEvent) => void = () => {};

/** Wire the vendor here (main.tsx). The function receives every telemetry event. */
export const setTelemetrySink = (next: (event: TelemetryEvent) => void) => {
  sink = next;
};

export const telemetry = {
  /** A business outcome the DOM cannot see (saved, approved). Clicks are tagged, not tracked. */
  action: (name: TrackId, attributes?: Attributes) => sink({ attributes, name, type: 'action' }),
  /** Errors carry the correlation id so the front event joins the BFF logs. */
  error: (name: string, attributes: Attributes) => sink({ attributes, name, type: 'error' }),
  /** A screen, by route id (never the URL: it can carry ids). */
  view: (name: string) => sink({ name, type: 'view' }),
};
