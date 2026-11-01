# Diseño de interfaz y temas

La segunda versión adopta una dirección editorial inspirada en la jerarquía tipográfica y las composiciones de hero de [Supahero](https://supahero.io/), en particular la referencia de [IntegratedBio](https://supahero.io/hero/integratedbio). La composición, el símbolo de cruz y los textos de Nova Salud son propios; no se reutilizan imágenes de esa página.

## Sistema visual

- Manrope Variable para navegación, tablas y formularios; Instrument Serif para acentos editoriales en la entrada y el resumen.
- Fondo marfil y verde bosque en claro; carbón verdoso y acentos lima en oscuro.
- Superficies planas, bordes discretos y esquinas de 3–7 px. Se elimina el sistema anterior de iconos pastel por categoría y tarjetas decorativas.
- El hero del resumen combina la identidad con un bloque de reposición calculado desde datos reales. Las pantallas operativas mantienen búsqueda, disponibilidad, totales y acciones visibles.
- Fuentes servidas desde la propia aplicación mediante paquetes Fontsource; no se solicita Google Fonts en tiempo de ejecución.

## Implementación del tema

`frontend/src/theme.tsx` contiene el contexto y el selector accesible. Tres opciones: claro, oscuro y sistema. La preferencia se guarda como `nova-salud-theme` en localStorage; no se almacena información de la cuenta. La selección automática escucha cambios de `prefers-color-scheme`, y un evento de storage sincroniza pestañas del mismo origen.

`frontend/public/theme-init.js` aplica la preferencia antes de cargar los estilos, evitando el destello del tema contrario al abrir. Vite transforma la ruta pública para servirla desde `/app/theme-init.js`, compatible con la política de scripts del servidor.

Los colores están centralizados en variables CSS en `:root` y `:root[data-theme="dark"]`. Gráficos y tooltips usan esas mismas variables. No añadir colores blancos fijos al crear formularios nuevos: usar `--panel`, `--ink`, `--muted`, `--line` y los colores semánticos de estado.

Los estilos de impresión fuerzan papel blanco y texto oscuro, aunque la pantalla use modo oscuro. Se respeta `prefers-reduced-motion`.

## Verificación de esta actualización

La compilación TypeScript/Vite y las tres pruebas existentes del frontend pasan. El flujo de GitHub Actions mantiene también las pruebas PostgreSQL del backend. En la URL pública se comprobaron ambos temas en la entrada, el selector accesible y que la elección oscura se conserva tras recargar. La revisión visual de esta actualización se hizo sobre la pantalla de acceso; las pantallas privadas conservan sus componentes funcionales y reciben el nuevo sistema de estilos compartido.
