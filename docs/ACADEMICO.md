# Sustento académico · PIAD-527

## Propuesta de solución

Nova Salud necesita sustituir el control manual por una fuente de datos central para inventario y ventas. La propuesta registra cada movimiento con actor y motivo, descuenta lotes vigentes al vender y presenta alertas calculadas desde las existencias. La interfaz organiza tareas frecuentes en pocos pasos y muestra resultados que se pueden verificar en el historial.

El objetivo del PDF es demostrar competencias frontend y backend mediante una aplicación web integral. Por eso se usa una interfaz React, una API Laravel y una base PostgreSQL relacionadas, con pruebas y despliegue. Usar varios lenguajes aporta separación de responsabilidades; no es una justificación para añadir tecnologías innecesarias.

El nombre FarmaPlus de las preguntas se interpreta como inconsistencia editorial respecto del caso Nova Salud.

## 1. Principales desafíos operativos

El registro manual retrasa la consulta de disponibilidad y facilita omisiones, duplicados y saldos que no corresponden al inventario físico. Cuando la venta y el almacén se actualizan en registros separados, una misma unidad puede parecer disponible para dos personas. La reposición reactiva aumenta la probabilidad de quedarse sin productos. Sin detalle histórico resulta difícil localizar una diferencia o atribuir una corrección. El cliente espera mientras el personal busca el producto o confirma el precio.

El caso no entrega mediciones de cuántos errores ocurren ni cuánto demora la atención. Esos datos deben obtenerse en campo antes de afirmar porcentajes de mejora.

## 2. Características necesarias

La solución debe centralizar productos, precios y existencias, registrar ventas y actualizar el saldo dentro de la misma operación. Necesita búsqueda visible, carrito sencillo, importes claros, alertas de stock y acceso desde navegador con datos protegidos. Para una implementación defendible se añaden usuarios por rol, validaciones de servidor, claves únicas y trazabilidad.

Como mejoras específicas de botica, se incorporan lotes y fechas: el sistema distingue total físico y disponible vendible, bloquea vencidos y prioriza el vencimiento más cercano. La anulación registra su causa y devuelve cada asignación una sola vez. Estas mejoras no sustituyen las obligaciones operativas y sanitarias que tendría una botica real.

## 3. Impacto esperado sobre desabastecimiento y servicio

Un saldo compartido evita depender de copias manuales. Las alertas ayudan al responsable a identificar productos por reponer antes de que lleguen a cero. El historial permite investigar diferencias, y FEFO facilita el uso de lotes cercanos al vencimiento. La búsqueda y el cálculo automático reducen pasos durante la atención.

Son mecanismos que pueden contribuir a mejores resultados, no evidencia de que los resultados ya ocurrieron. Las alertas no compran productos ni garantizan abastecimiento: una persona debe revisar demanda, plazos y disponibilidad de proveedores. La frecuencia de consulta visual es de 30 segundos; cada venta verifica el saldo actual al confirmar.

## 4. Beneficios adicionales para la competitividad

La botica obtiene visibilidad de ventas por período, productos más vendidos, medios de pago registrados y actuaciones de cada usuario. Esto puede apoyar la organización de turnos, priorización de compras y detección de operaciones excepcionales. El acceso por navegador evita instalar el programa en cada estación; el backend concentra las reglas para que todos trabajen de la misma manera.

Una API documentada permite incorporar después proveedores reales u otros servicios, con credenciales protegidas en el servidor. No se incluyen rentabilidad sin costos ni módulos externos presentados como si estuvieran listos. El diseño adaptable y los permisos pueden facilitar adopción, pero su usabilidad debe validarse con quienes atienden realmente.

## 5. Métricas para evaluar efectividad

| Métrica | Cálculo o método | Estado en la aplicación |
|---|---|---|
| Ventas e importe por día/período | COUNT y SUM de ventas confirmadas; anuladas excluidas | Calculado en ReportController |
| Ticket promedio | Importe / cantidad de ventas; cero si no hay ventas | Calculado al mostrar reportes |
| Productos por reponer | Productos activos con disponible ≤ mínimo | Calculado por el sistema |
| Agotados actuales | Productos activos con disponible = 0 | Calculado por el sistema |
| Próximos a vencer / vencidos | Lotes activos con unidades por ventana de fecha | Calculado por el sistema |
| Tiempo de atención | Mediana y p90 entre inicio de atención y cierre | Requiere observación o instrumentación adicional; no se mide actualmente |
| Tasa de diferencias de inventario | Referencias con diferencia / referencias contadas × 100 | Requiere conteos físicos y registro de resultados |
| Magnitud de diferencia | Suma de valor absoluto de unidades físicas − sistema | Requiere inventario físico; los ajustes documentan correcciones |
| Tasa de desabastecimiento | Solicitudes no atendidas por falta de stock / solicitudes totales × 100 | Requiere registrar demanda no atendida; no existe ese módulo |
| Duración del agotamiento | Horas/días desde llegar a cero hasta una nueva entrada | Puede reconstruirse parcialmente desde movimientos; no está automatizada como indicador |
| Tasa de anulaciones | Ventas anuladas / ventas registradas × 100 | Estado y fechas disponibles; porcentaje no se presenta en dashboard |

Para evaluar impacto, definir un período previo y posterior comparable, mismos productos/horarios, tamaño de muestra y condiciones de demanda. Registrar medianas y dispersión del tiempo, no solo un promedio. Comparar días equivalentes y explicar cambios externos de personal, campañas o proveedores. No se han realizado mediciones reales en una botica; los datos iniciales son ficticios.

## Competencias demostradas

| Competencia | Evidencia en el código |
|---|---|
| Componentes, estado y formularios | `frontend/src/App.tsx`: POS, Inventory, Team, Form y Modal |
| Tipado y cliente HTTP | `frontend/src/api.ts`: contratos TypeScript, ApiError, CSRF |
| Diseño adaptable y accesibilidad | `styles.css`, labels, botones semánticos, diálogo nativo y foco visible |
| Backend MVC y API REST | `backend/routes/web.php`, controladores y modelos |
| Validación y autorización | FormRequest, AdminOnly y ApiSession |
| Persistencia relacional | Migraciones con relaciones, índices, claves únicas y CHECK |
| Programación transaccional | InventoryService: once, sell, move, cancel |
| Consistencia frente a concurrencia | lockForUpdate, orden de bloqueos, clave por usuario y huella de solicitud |
| Seguridad de aplicaciones | Hash, sesión regenerada, CSRF, limitación de solicitudes, HTTPS y CSP |
| Reportes y análisis | ReportController y Recharts con datos calculados |
| Calidad y pruebas | PHPUnit funcional, prueba PostgreSQL de concurrencia y GitHub Actions |
| Despliegue reproducible | Dockerfile de varias etapas, inicio controlado y variables externas |
| Trabajo colaborativo | OpenAPI, README, guía de integraciones y Git |

## Seguridad, salud en el trabajo y ambiente

Para desarrollar y usar el sistema: organizar el puesto con altura y postura adecuadas, realizar pausas visuales y de movilidad, proteger cables y equipos y mantener accesos individuales. El programa facilita el registro digital y la impresión solo cuando se requiere; no se atribuyen ahorros de papel o energía que no se midieron.

Las alertas de vencimiento apoyan la identificación de unidades que no se deben vender, pero su retiro y disposición dependen del responsable y de la normativa aplicable. El software es una demostración académica, sin información de pacientes ni funciones de recomendación médica. Para uso real se requiere una evaluación operativa, de privacidad y regulatoria específica; este documento no certifica cumplimiento legal.
