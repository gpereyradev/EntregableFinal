# Diseño de interfaz y temas

La interfaz utiliza una identidad de botica moderna y cercana: títulos redondeados, superficies claras, azul suave y acentos teal. La jerarquía del inicio toma como referencia las composiciones de hero de [Supahero](https://supahero.io/), adaptadas a una aplicación de inventario. La ilustración vectorial de la botica es propia y no se reutilizan imágenes de la galería.

## Tipografía y color

- **Plus Jakarta Sans Variable:** títulos, logotipo e indicadores principales. Sin serifas ni cursivas editoriales.
- **DM Sans Variable:** navegación, tablas, precios y formularios; lectura clara a tamaños pequeños.
- Tema claro: fondos blancos y azul muy suave, texto azul profundo, acciones teal.
- Tema oscuro: azul noche, superficies navy, texto claro y acentos menta.
- Bordes suaves y radios consistentes para paneles, campos y botones. Los estados conservan verde, ámbar y rojo con significado funcional.
- Fuentes servidas desde la propia aplicación con Fontsource; no se consulta Google Fonts en tiempo de ejecución.

## Implementación del tema

`frontend/src/theme.tsx` contiene el contexto y el selector accesible. Tres opciones: claro, oscuro y sistema. La preferencia se guarda como `nova-salud-theme` en localStorage; no contiene información de la cuenta. La selección automática escucha `prefers-color-scheme`, y el evento de storage sincroniza pestañas del mismo origen.

`frontend/public/theme-init.js` aplica la preferencia antes de cargar los estilos para evitar el destello del tema contrario. Vite sirve este recurso como `/app/theme-init.js`, compatible con la política de scripts del servidor.

Los colores están centralizados en `:root` y `:root[data-theme="dark"]`. Gráficos y tooltips comparten esas variables. Para ampliar la interfaz, usar `--panel`, `--ink`, `--muted`, `--line` y los colores semánticos de estado, evitando blancos fijos.

Los estilos de impresión fuerzan papel blanco y texto oscuro en ambos temas. Se respeta `prefers-reduced-motion`.

## Verificación

La compilación TypeScript/Vite y las pruebas existentes del frontend pasan. El flujo de GitHub Actions conserva también las pruebas PostgreSQL del backend. En la URL pública se verifican los controles de tema en la entrada y su persistencia al recargar. La revisión visual de esta actualización se realiza sobre la pantalla de acceso; las pantallas privadas conservan sus componentes funcionales y reciben los estilos compartidos.
