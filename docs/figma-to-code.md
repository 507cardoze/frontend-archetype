# Del Figma al código

Cada cosa del Figma tiene un único lugar en el código, con el mismo nombre.

| En el Figma | En el código | Cómo se traduce |
|---|---|---|
| Variables (color, espaciado, radio, sombra) | `src/theme/design-tokens.json` → `tokens.css` | Se exportan a JSON DTCG y se corre `pnpm tokens` |
| Estilos de texto | Tokens `typography` → `text-title`, `text-heading`, `text-body`, `text-caption` | Van en el mismo JSON |
| Componentes y variantes | `components/<nivel>/` con el mismo nombre; cada variante es una prop | Cada archivo indica su par (`// Figma: Button`) |
| Frames de pantalla | `pages/<página>/` | Se componen piezas de `components/`, sin estilos propios |

## Tokens en dos capas

| Colección | Ejemplo | Genera | La usan |
|---|---|---|---|
| `primitive`: valores crudos | `primitive.brand.600 = #4338ca` | `--brand-600`, **sin** clases | Solo los semánticos |
| `semantic`: el rol de cada valor | `semantic.color.primary = {primitive.brand.600}` | `--color-primary` → `bg-primary`, `text-primary` | Los componentes |

Regla de nombres: `semantic.<grupo>.<nombre>` → `--<grupo>-<nombre>` → clase `<utilidad>-<nombre>`. Por ejemplo, `semantic.radius.card` → `rounded-card`.

Si cambia el color de marca, se cambia un primitivo y todo lo hereda. Un theme por cliente o por país es otro JSON, sin tocar componentes.

`pnpm tokens` elimina la paleta y la escala de texto por defecto de Tailwind. Como Tailwind ignora en silencio las clases que no existen, `src/test/conventions.spec.ts` revisa cada `.tsx` y **falla** si encuentra `bg-blue-500`, `text-sm`, `rounded-md` o un `#hex` suelto.

## Paso a paso al recibir un Figma

1. **Revisar las Variables con el diseñador:** dos colecciones (`primitive` y `semantic`), con los semánticos nombrados por rol (`primary`, `danger`, `surface`) y no por apariencia.
2. **Exportarlas a JSON DTCG** (con la exportación de Figma o con un plugin como Tokens Studio), reemplazar `design-tokens.json`, correr `pnpm tokens` y revisar el diff.
3. **Hacer el inventario de componentes:** cada componente del Figma se mapea a uno de `components/` con el mismo nombre. Los que falten se crean en su nivel.
4. **Construir las páginas** componiendo esas piezas.
5. **Verificar** con `pnpm quality` y con una revisión visual contra el Figma.

> **Opcional:** Figma Code Connect enlaza cada componente del Figma con su archivo, para que Dev Mode muestre el código real. Si se usa IA (por ejemplo, el MCP de Figma), se necesita la autorización del cliente.
