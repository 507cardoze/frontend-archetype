# Decisiones

| Decisión | Por qué |
|---|---|
| Vite + React 19 (con React Compiler) + TypeScript estricto | Una app interna no necesita SSR ni SEO. Memoización automática |
| TanStack Query | El estado vive en el BFF; Query maneja caché, reintentos y concurrencia. No hace falta un store global |
| zod (y react-hook-form con el primer formulario) | Variables de entorno validadas; formularios grandes sin re-render por tecla, con reglas testeables |
| Tailwind 4 con tokens desde el Figma | Los tokens son variables CSS que genera el JSON del Figma. No hay un theme duplicado en TypeScript |
| Controles nativos envueltos en átomos propios | Accesibilidad y teclado del navegador; el aspecto lo pone el Figma del proyecto, no una librería de UI |
| Cookie del BFF, sin tokens en el navegador | Un XSS no puede robar la sesión, y el front no depende del proveedor de identidad |
| MSW | El mismo mock para desarrollar y para probar, a nivel de red. El código de producción no sabe que está simulado |
| Biome | Lint y formato en una sola herramienta rápida |
| Fallow | Analiza el proyecto completo: código muerto, ciclos, CRAP con cobertura real, duplicación y las reglas de atomic design como `boundaries` |
| Telemetría por adaptador, opcional | El proveedor se cambia en un archivo, y un proyecto sin RUM no paga nada |
| Un runner propio para el gate | Un solo comando para el desarrollador y la CI, con las reglas en archivos de configuración |
| Esqueleto sin dominio | El proyecto empieza con su propia página y no tiene que borrar un ejemplo. Las recetas viven en `docs/` |
