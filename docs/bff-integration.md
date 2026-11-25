# Integración con el BFF

## Sesión

El BFF es dueño de la sesión, con una cookie HttpOnly en el mismo origen. El front no maneja tokens. Si el BFF responde **401**, la app redirige a `VITE_LOGIN_URL?returnTo=<ruta actual>` (`lib/http/query-client.ts`). Funciona con cualquier BFF, sin importar el proveedor de identidad que tenga detrás.

Si el proyecto no tiene login propio (por ejemplo, se abre desde otro sistema), se cambia el `onUnauthorized` de `createQueryClient` por un mensaje que explique cómo volver a entrar.

## Un solo cliente HTTP

`lib/http/client.ts` es un `fetch` mínimo, y solo lo usa `api/`:
- llama al BFF en el mismo origen, con `credentials: 'same-origin'`;
- envía y recibe JSON;
- corta a los 15 s (`timeoutMs`), para que un BFF que no responde no deje un spinner eterno;
- convierte cualquier falla en un `ProblemError`: respuesta no 2xx, red caída, timeout o un 2xx que no es JSON (por ejemplo, el HTML de un proxy).

Las queries y mutations se arman con TanStack Query en `api/` (ver `api/health.ts`).

## Errores por clase, no por código HTTP

`lib/http/problem.ts` clasifica cada error (el BFF responde *problem details*, RFC 9457) y `ErrorState` muestra el mensaje:

| Status | Clase | ¿Se reintenta solo? | Qué ve el usuario |
|---|---|---|---|
| 401 | `unauthenticated` | — | Lo redirige al login del BFF |
| 403 | `forbidden` | No | "No tienes permiso…" |
| 404 | `not-found` | No | "No encontramos lo que buscas…" |
| 409 | `conflict` | No | "Los datos cambiaron…" y botón **Recargar** |
| 422 | `business` | No | El `detail` que envía el BFF |
| 423, 429 | `temporary` | Sí | "Servicio ocupado" y botón **Reintentar** |
| 503, o 5xx/red/timeout en una lectura | `availability` | Sí | "No se pudo conectar" y botón **Reintentar** |
| 5xx/red/timeout en un **comando** | `uncertain` | **Nunca** | "No sabemos si se aplicó. Verifica antes de repetir" |

La última fila evita duplicados: si guardar devuelve 500 o se corta la red, el BFF pudo haberlo aplicado.

## Seguridad

Lo que el BFF debe cumplir (cookie `__Host-`, CSRF, `returnTo`) y cómo trabajar con un BFF en otro subdominio está en [deployment.md](deployment.md#el-bff-mismo-origen-o-subdominio).

## Estado del servidor

Vive en TanStack Query, en memoria. Las lecturas se reintentan solo si el error es transitorio; los comandos (mutations) nunca se reintentan solos. No se guarda nada en localStorage ni en sessionStorage.

## Recetas

### Formulario con validación

Para formularios se recomienda react-hook-form con zod. Se instalan con el primer formulario:

```bash
pnpm add react-hook-form @hookform/resolvers zod
```

Las reglas van en un schema puro, con su propio test:

```ts
// pages/user-form/user-form.schema.ts
export const userFormSchema = z
  .object({
    email: z.email({ error: 'Ingresa un correo válido.' }),
    role: z.enum(['ADMIN', 'AGENT'], { error: 'Selecciona un rol.' }),
    team: z.string().optional(),
  })
  // Un campo condicional: solo se exige cuando aplica.
  .refine((v) => v.role !== 'AGENT' || Boolean(v.team?.trim()), {
    error: 'Ingresa el equipo.',
    path: ['team'],
  });
```

El view model arma el formulario y llama al adapter:

```ts
// pages/user-form/use-user-form-vm.ts
const form = useForm({ resolver: zodResolver(userFormSchema) });
const save = useSaveUser(user?.id);
const submit = form.handleSubmit((input) =>
  save.mutate({ input, version: user?.version }, { onSuccess: () => navigate('/usuarios') }),
);
```

### Conflicto de versión (409)

Las actualizaciones envían la `version` del registro. Si otra persona lo cambió, el BFF responde 409. `ErrorState` ofrece **Recargar**, que trae la versión actual y nunca reenvía:

```ts
const retrySave = () => (isConflict(save.error) ? reload() : submit());

const reload = async () => {
  save.reset();
  const { data } = await refetch(); // la versión actual del BFF
  if (data) form.reset(toFormValues(data));
};
```

### Listado con filtros en la URL

Los filtros van en la URL: se pueden compartir y el botón "atrás" funciona. `keepPreviousData` deja la página actual en pantalla mientras carga la siguiente.

```ts
const [params, setParams] = useSearchParams();
const filters = { page: Number(params.get('page')) || 1, search: params.get('search') ?? '' };

useQuery({
  placeholderData: keepPreviousData,
  queryFn: ({ signal }) => http<Page<User>>(`/users?${new URLSearchParams(...)}`, { signal }),
  queryKey: ['users', 'list', filters],
});
```

### Respuestas asíncronas (polling)

Si el BFF responde algo que se resuelve después (una aprobación, un proceso largo), se consulta con `refetchInterval` solo mientras el estado sea de espera:

```ts
useQuery({
  queryFn: ...,
  queryKey: ...,
  refetchInterval: (query) => (isWaiting(query.state.data?.status) ? 15_000 : false),
});
```
