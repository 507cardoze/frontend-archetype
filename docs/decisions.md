# Decisiones

| Decisión | Por qué |
|---|---|
| Vite + React 19 (con React Compiler) + TypeScript estricto | Una app interna no necesita SSR ni SEO. Memoización automática |
| TanStack Query | El estado vive en el BFF; Query maneja caché, reintentos y concurrencia. No hace falta un store global |
| react-hook-form + zod con el primer formulario | Formularios grandes sin re-render por tecla, con reglas testeables. No vienen en la base: zod pesaba el 22 % del JS inicial solo para validar el env |
| Tailwind 4 con tokens desde el Figma | Los tokens son variables CSS que genera el JSON del Figma. No hay un theme duplicado en TypeScript |
| Controles nativos envueltos en átomos propios | Accesibilidad y teclado del navegador; el aspecto lo pone el Figma del proyecto, no una librería de UI |
| Cookie del BFF, sin tokens en el navegador | Un XSS no puede robar la sesión, y el front no depende del proveedor de identidad |
| MSW | El mismo mock para desarrollar y para probar, a nivel de red. El código de producción no sabe que está simulado |
| Biome | Lint y formato en una sola herramienta rápida |
| Fallow | Analiza el proyecto completo: código muerto, ciclos, CRAP con cobertura real, duplicación y las reglas de atomic design como `boundaries` |
| Sin telemetría en la base | No todos los proyectos tienen RUM; la receta queda en `docs/observability.md` |
| Un runner propio para el gate | Un solo comando para el desarrollador y la CI, con las reglas en archivos de configuración |
| Playwright + axe sobre el build | Prueba la app compilada como la usa una persona, incluida la accesibilidad |
| Terraform + CloudFront con OAC | Bucket privado, TLS, cabeceras de seguridad y ruteo SPA reproducibles; el BFF en el mismo origen evita CORS |
| Despliegue con un script del repo y OIDC | Cualquier CI corre `pnpm deploy:s3`; sin llaves de AWS guardadas |
| Esqueleto sin dominio y patrones reconocibles | El proyecto parte de lo mínimo conocido por la industria (`fetch` + TanStack Query, RFC 9457) y no tiene que borrar ejemplos. Las recetas viven en `docs/` |
