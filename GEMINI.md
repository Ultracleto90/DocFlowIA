# GEMINI.md — Constitución del Agente para DocuFlow AI (SaaS)

## 1. Contexto del Proyecto
DocuFlow AI es una plataforma SaaS de documentación técnica automatizada para proyectos Laravel (.blade.php) bajo enfoque Human-in-the-loop.
- **Stack obligatorio:** Next.js (App Router + TypeScript estricto), Tailwind CSS, Zod, Mongoose, Docker y Nginx.
- **Base de datos:** MongoDB existente en contenedor Docker local (`DocuFlowAI`), esquema previamente aprobado e INMUTABLE en nombres de colecciones y campos base.
- **Alcance de esta iteración:** Únicamente la plataforma SaaS completa. El motor Python (SVM + Phi-3 Mini) se integra detrás de un adaptador desacoplado (`aiPipelineAdapter.ts`) que en esta fase inspecciona el `.zip` real en Node.js y genera resultados estructurados compatibles con el contrato final.

## 2. Arquitectura en Capas Estricta (Prohibido Saltarse Capas)
Flujo unidireccional obligatorio:
`src/components` -> `src/services/client/petitions.ts` -> `src/lib/http/basicGet.ts` (y `httpClient.ts`) -> `src/app/api/**/route.ts` -> `src/services/server/` -> `src/infrastructure/repositories/` -> `MongoDB`

### Reglas Inquebrantables:
1. **Aislamiento de transporte HTTP:** `src/lib/http/basicGet.ts` y `src/lib/http/httpClient.ts` son 100% genéricos. Tienen PROHIBIDO importar archivos de `src/services/`, `src/components/`, `src/core/schemas/` o lógica de negocio.
2. **Aislamiento de Frontend:** Ningún componente en `src/components/` o `src/app/(routes)/` puede invocar `fetch()` directamente; todo pasa por `src/services/client/petitions.ts`.
3. **Aislamiento de MongoDB:** ÚNICAMENTE `src/lib/db/` y `src/infrastructure/` pueden importar `mongoose`. Los repositorios SIEMPRE retornan objetos planos tipados (`.lean()`), nunca documentos Mongoose crudos.
4. **Esquema BD intacto:** Todos los modelos Mongoose deben declarar `{ collection: '<nombre_exacto>', versionKey: false }`. No renombrar colecciones ni campos aprobados (`usuario_correo`, `codigo_proyecto`, `estado_procesamiento`, etc.).
5. **Validación por contrato:** Toda entrada en `src/app/api/**/route.ts` se valida primero con Zod (`src/core/schemas/`). Cero lógica de negocio en `route.ts`.
6. **Cero credenciales hardcodeadas:** Toda URI, secreto JWT y configuración se lee de `process.env`.

## 3. Reglas de Ejecución en Docker
- NO instalar servicios de servidor en el host Debian. Todo corre dentro de los contenedores definidos en `docker-compose.yml` (`web` y `nginx`), conectados al contenedor MongoDB existente.
- Comandos de verificación obligatorios tras cada sprint:
  - `docker compose exec web npx tsc --noEmit`
  - `docker compose exec web npm run build` (antes de cerrar un sprint mayor)
- No modificar ni reiniciar el contenedor externo de MongoDB salvo para conectarlo a `docuflow_network` si se solicita.

## 4. Referencias de Especificación
Antes de implementar cualquier módulo, consulta:
- `docs/agent/01-INFRA-DOCKER-NGINX.md`
- `docs/agent/02-DATABASE-PLANS.md`
- `docs/agent/03-API-AND-LAYERS.md`
- `docs/agent/04-UI-AND-SPRINTS.md`
