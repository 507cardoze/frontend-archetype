# Despliegue en AWS (S3 + CloudFront)

El arquetipo trae todo lo necesario para publicar la app, aislado del código para que un proyecto que despliegue distinto lo pueda borrar:

| Pieza | Dónde | Qué hace |
|---|---|---|
| Infraestructura | `infra/` (Terraform) | Bucket privado, CloudFront, cabeceras de seguridad, ruteo SPA y, opcionalmente, el rol de despliegue |
| Despliegue | `scripts/deploy.ts` → `pnpm deploy:s3` | Sube el build y renueva `index.html`. Igual en local y en cualquier CI |
| GitHub Actions | `.github/workflows/deploy.yml` | Despliega después de que el quality gate pasa en `main` |
| Azure DevOps | `ci/azure-pipelines.yml` | Plantilla equivalente: los mismos comandos |

## Cómo queda

```
navegador ──HTTPS──▶ CloudFront ──▶ S3 privado (OAC)       la app
                         │
                         └── /api/* ──▶ BFF                mismo origen, sin CORS (opcional)
```

- **Bucket privado:** sin acceso público; solo CloudFront lo lee (Origin Access Control). Cifrado y versionado, así que un release malo se revierte.
- **Cabeceras de seguridad** en cada respuesta: CSP, HSTS, `nosniff`, `frame-ancestors 'none'` y referrer policy. La CSP se ajusta con la variable `content_security_policy`.
- **Ruteo SPA:** una CloudFront Function devuelve `index.html` en las rutas sin extensión, así que recargar `/usuarios/42` funciona. No se usan las páginas de error de CloudFront, porque convertirían los 404 del BFF en 200.
- **Caché:** `assets/` (nombres con hash) se guarda un año como `immutable`; `index.html` se revalida siempre y se invalida en cada despliegue.
- **Releases sin cortes:** los assets viejos no se borran, así una pestaña abierta con el release anterior sigue cargando sus chunks. Si aun así falta uno, la app se recarga una vez (`vite:preloadError`); si vuelve a fallar enseguida, muestra el error en vez de recargar sin fin.
- **WAF opcional** (`web_acl_arn`), por ejemplo para limitar una app interna a las IPs corporativas.

## Paso a paso

### 1. Crear la infraestructura

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # proyecto, ambiente, BFF, dominio, repositorio
terraform init
terraform plan
terraform apply
```

Por defecto el estado es local. Para un ambiente compartido, se configura el backend S3 que está comentado en `versions.tf`.

`terraform test` valida la configuración con un provider de AWS simulado, sin cuenta ni credenciales, y lo corre la CI en cada PR.

### 2. Configurar el repositorio

Con las salidas de `terraform apply`, en GitHub → Settings → Environments → `production` → Variables:

| Variable | Valor |
|---|---|
| `AWS_DEPLOY_ROLE_ARN` | Salida `deploy_role_arn` (requiere `github_repository` en `terraform.tfvars`) |
| `AWS_REGION` | La región del bucket |
| `DEPLOY_BUCKET` | Salida `bucket_name` |
| `CLOUDFRONT_DISTRIBUTION_ID` | Salida `distribution_id` |
| `VITE_API_BASE_URL`, `VITE_LOGIN_URL` | Opcionales; por defecto `/api` y `/api/auth/login` |

En el environment `production`:
- **Required reviewers:** recomendado; nada llega a producción sin una aprobación.
- **Deployment branches:** solo `main`.

El rol solo confía en jobs de este repositorio que corren en ese environment (OIDC: credenciales temporales, sin llaves guardadas).

Por último, en Settings → Secrets and variables → Actions → **Variables** (de repositorio, no del environment), se crea `DEPLOY_ENABLED` = `true`. Es el interruptor: mientras no exista, el workflow de despliegue no hace nada. Va en el repositorio porque las variables del environment todavía no existen cuando GitHub decide si el job corre.

El despliegue automático solo corre tras un **push a `main` de este mismo repositorio**; un PR, aunque venga de un fork con una rama llamada `main`, nunca despliega.

### 3. Desplegar

- **Automático:** cada vez que el quality gate pasa en `main`.
- **A mano:** Actions → Deploy → Run workflow.
- **Desde tu máquina,** con tu sesión de AWS: `pnpm build && DEPLOY_BUCKET=… CLOUDFRONT_DISTRIBUTION_ID=… pnpm deploy:s3`. Con `--dry-run` muestra lo que haría, sin cambiar nada.

### 4. Verificar el primer despliegue

```bash
curl -I https://<dominio>/                    # 200, cabeceras de seguridad, Cache-Control: no-cache
curl -I https://<dominio>/ruta/profunda       # 200 con index.html (ruteo SPA)
curl -I https://<dominio>/assets/<archivo>.js # Cache-Control: public,max-age=31536000,immutable
curl -I https://<dominio>/assets/no-existe.js # 403/404 real, no index.html
```

## Azure DevOps

`ci/azure-pipelines.yml` corre los mismos comandos (`pnpm quality` y `pnpm deploy:s3`). Por proyecto hay que crear:
- el **variable group** `frontend-deploy`;
- una **service connection de AWS** (AWS Toolkit for Azure DevOps) que asuma el rol de despliegue con OIDC;
- el **environment** `production`, con sus aprobaciones.

El Terraform de este repo solo crea el rol para GitHub. El rol para Azure DevOps lo crea la infraestructura del proyecto, con los mismos permisos (`deploy-role.tf`).

En **GitLab** o **Bitbucket** el patrón es el mismo: instalar, `pnpm quality`, iniciar sesión en AWS con OIDC y `pnpm deploy:s3`.

## El BFF: mismo origen o subdominio

**Recomendado: mismo origen.** Con `bff_origin_domain`, CloudFront envía `/api/*` al BFF. El navegador ve un solo origen, así que la cookie de sesión es propia y no hace falta CORS. Es el modo que asume el código (`VITE_API_BASE_URL=/api`).

**Si el BFF debe vivir en su propio subdominio** (`app.empresa.com` y `bff.empresa.com`), funciona, pero cuesta más:

| Lado | Qué cambia |
|---|---|
| App | `VITE_API_BASE_URL` pasa a ser una URL absoluta (hoy `lib/env.ts` lo rechaza a propósito) y `client.ts` usa `credentials: 'include'` |
| CSP | `connect-src` debe permitir el dominio del BFF |
| BFF | `Access-Control-Allow-Origin` con el origen exacto (nunca `*`), `Access-Control-Allow-Credentials: true`, `Access-Control-Max-Age` alto (cada POST con JSON hace un preflight) |

Con **dominios distintos** (no subdominios del mismo dominio), la cookie es de terceros: Safari y Firefox la bloquean y la sesión deja de funcionar. Ese caso no se soporta.

### Contrato de seguridad con el BFF (en ambos modos)

| Requisito | Valor |
|---|---|
| Cookie de sesión | `__Host-` + `Secure` + `HttpOnly` + `SameSite=Lax` (o `Strict`), sin `Domain` |
| CSRF | Validar `Origin` contra la lista permitida en cada request que modifica datos |
| `returnTo` del login | Solo rutas relativas de la app (evita un open redirect) |
| Errores | Problem details (RFC 9457): `application/problem+json` con `title` y `detail` |

## Limitaciones conocidas

- **Un build por ambiente:** las `VITE_*` quedan fijas al compilar. Para compilar una vez y promover el mismo artefacto de dev a prod, hace falta leer la configuración en runtime (un `config.json`). Se agrega cuando un proyecto lo necesite.
- **Los assets viejos se acumulan** en el bucket (no se borran para no cortar pestañas abiertas). Si pesan, se limpian a mano o con una regla de lifecycle por antigüedad.
