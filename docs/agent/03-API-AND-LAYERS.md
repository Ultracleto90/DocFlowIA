# 03 — Contratos de Capas, Transporte HTTP y Endpoints REST

## 1. Capa de Transporte Base (Cliente — Totalmente Agnóstica)

### `src/lib/http/basicGet.ts`
- Exporta `basicGet<TResponse>(url: string, options?: HttpRequestOptions): Promise<TResponse>`.
- Maneja: `credentials: 'include'`, headers por defecto (`Accept: application/json`), manejo de `AbortSignal`/timeout y parseo estandarizado de errores mediante una clase `HttpError(status, message, details)`.
- **Regla estricta:** Jamás menciona rutas `/api/...` ni tipos de negocio (`Project`, `User`, etc.).

### `src/lib/http/httpClient.ts`
- Exporta `basicPost<TRes, TBody>`, `basicPut<TRes, TBody>`, `basicPatch<TRes, TBody>`, `basicDelete<TRes>`, `basicUpload<TRes>(url, formData)` y `basicDownload(url, filename)`.
- Misma regla de aislamiento absoluto que `basicGet.ts`.

### `src/services/client/petitions.ts`
- Único archivo del frontend que conoce los endpoints `/api/...` y los DTOs de `src/core/types/`.
- Agrupa llamadas en namespaces claros:
  - `authPetitions`: `login`, `register`, `logout`, `me`
  - `projectPetitions`: `list`, `getByCode`, `uploadZip`, `delete`, `getComponents`, `saveWebhook`
  - `documentPetitions`: `listByProject`, `updateContent`, `validateDocument`, `exportMarkdown`, `exportPdf`
  - `billingPetitions`: `getPlans`, `upgradePlan`, `updateWhiteLabel`, `generateApiKey`, `manageTeam`
  - `auditPetitions`: `listLogs`, `getMetrics`

## 2. Endpoints REST (`src/app/api/`)

### Salud e Infraestructura
- `GET /api/health` -> Verifica conexión `readWrite` y `read` con MongoDB.

### Autenticación (`src/app/api/auth/`)
- `POST /api/auth/register` -> Crea usuario en `Freemium` (password con `bcryptjs`), registra `logs_auditoria`, emite cookie `HttpOnly` JWT.
- `POST /api/auth/login` -> Valida credenciales, registra `logs_auditoria` (`EXITOSO` o `BLOQUEADO_UNAUTHORIZED`), emite cookie `HttpOnly` JWT.
- `POST /api/auth/logout` -> Limpia cookie JWT.
- `GET /api/auth/me` -> Retorna perfil del usuario autenticado + metadatos completos de su plan desde `plans.ts` + uso mensual actual.

### Proyectos e Ingesta `.zip` (`src/app/api/projects/`)
- `GET /api/projects` -> Lista proyectos del usuario (o todos si `rol === 'Administrador'`).
- `POST /api/projects` -> `multipart/form-data` (`nombre_proyecto`, `framework`, `file`).
  1. Valida cuota mensual (`planGuardService.checkMonthlyQuota`).
  2. Valida extensión `.zip`, tamaño máximo según plan y protección Zip Slip (prohibir entradas con `..` o rutas absolutas).
  3. Guarda archivo en `UPLOADS_DIR` (`/storage/uploads/<codigo>_<timestamp>.zip`).
  4. Crea registro en `proyectos` (`estado_procesamiento: 'pendiente'`).
  5. Ejecuta `aiPipelineAdapter.processProjectZip(...)`:
     - Inspecciona el `.zip` real con `adm-zip`.
     - Cuenta vistas `.blade.php` y valida el límite del plan (`15`, `100`, `300`, `2000`). Si excede, devuelve `403` limpio y limpia el archivo.
     - Analiza etiquetas HTML/Blade reales (`<form`, `<input`, `<button`, `<table`, `<select`, `@csrf`, `route(`, etc.) para clasificar cada vista en `componentes_filtrados` como `etiqueta_svm: 1` (`Código Relevante`) o `0` (`Ruido Visual`, ej. layouts/footers/headers estáticos).
     - Actualiza estado `filtrando_svm` -> `redactando_ia` -> `completado`.
     - Genera los borradores en `documentos_generados` según los entregables desbloqueados por el plan (INVEST siempre; IEEE 830 e ISO 26514 desde Pro en adelante) incorporando las vistas reales detectadas en el `.zip`.
     - Si el plan es `Team IA` o `Enterprise`, añade sección de auditoría Blade/Tailwind/WCAG 2.1 (y OWASP en Enterprise).
  6. Registra evento en `logs_auditoria`.
- `GET /api/projects/[codigo]` -> Ficha del proyecto + `componentes_filtrados` + `documentos_generados`.
- `DELETE /api/projects/[codigo]` -> Elimina proyecto y sus componentes/documentos asociados + log de auditoría.

### Documentación y Exportación (`src/app/api/documents/`)
- `PATCH /api/documents/[id]` -> Guarda edición manual (`contenido_markdown`) y/o cambia `estado_auditoria` (`borrador_ia` -> `validado_humano`) + log.
- `GET /api/documents/[id]/export?format=md|pdf` ->
  - Valida permisos de plan (PDF bloqueado en `Freemium` -> `403`).
  - Si es `Freemium` + `md`: añade pie de firma automático `\n---\n*Generado con DocuFlow AI (Plan Freemium Explorer)*`.
  - Si es `Enterprise` con `white_label.enabled`: renderiza encabezado corporativo personalizado en PDF/MD.
  - Genera PDF real server-side (ej. `pdfkit` o `md-to-pdf` / librería ligera sin Chromium pesado en Alpine).

### Facturación, Equipo y Auditoría
- `GET /api/billing/plans` -> Devuelve catálogo de los 4 planes.
- `POST /api/billing/subscribe` -> Simula cambio de plan inmediato actualizando `usuarios.plan` en MongoDB + log `CAMBIO_PLAN`.
- `PATCH /api/billing/enterprise` -> Configura White-Label y genera/rota API Key (solo `Enterprise`).
- `POST /api/team/invite` -> Agrega/edita miembros del equipo con RBAC (hasta 1 invitado solo lectura en `Pro`, 5 en `Team IA`, ilimitados en `Enterprise`).
- `GET /api/admin/audit` -> Usa la conexión **SOLO LECTURA (`MONGO_URI_READONLY` / `auditor_qa_docuflow`)** para consultar `logs_auditoria` y métricas de tokens (`token_count > 1200`, etc.). Restringido a `Administrador` o plan `Enterprise`.
