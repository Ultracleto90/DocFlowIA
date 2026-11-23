# 02 — Modelo de Datos (MongoDB Aprobado) y Reglas de Planes

## 1. Colecciones Exactas en `DocuFlowAI`
Todos los modelos viven en `src/infrastructure/models/` y usan `{ versionKey: false }`.

### 1.1 `usuarios`
- `nombre`: String (required)
- `correo`: String (required, unique, lowercase, trim)
- `password_hash`: String (required, `select: false` por defecto)
- `rol`: String (enum: `'Administrador' | 'Project Manager' | 'Desarrollador' | 'Editor' | 'Revisor QA'`, default: `'Desarrollador'`)
- `plan`: Subdocumento embebido:
  - `nombre`: String (enum: `'Freemium' | 'Pro' | 'Team IA' | 'Enterprise'`, default: `'Freemium'`)
  - `precio`: Number (default: `0`)
  - `max_proyectos_mes`: Number (default: `2`)
- `is_active`: Boolean (default: `true`)
- `created_at`: Date (default: `Date.now`)
- *Campos opcionales de soporte SaaS (no rompen documentos existentes):*
  - `team_members`: Array de `{ correo: String, rol: String, invited_at: Date }` (solo Team IA / Enterprise)
  - `white_label`: `{ enabled: Boolean, brand_name: String, logo_url: String }` (solo Enterprise)
  - `api_key`: String (solo Enterprise)

### 1.2 `proyectos`
- `codigo_proyecto`: String (required, unique, ej. `PRJ-001`, autogenerado secuencial `PRJ-XXX`)
- `nombre_proyecto`: String (required)
- `usuario_correo`: String (required, indexado; enlaza con `usuarios.correo`)
- `archivo_zip`: String (required, ej. `/storage/uploads/proyecto.zip`)
- `framework`: String (required, ej. `'Laravel 11'`, `'Laravel 10'`)
- `estado_procesamiento`: String (enum: `'pendiente' | 'filtrando_svm' | 'redactando_ia' | 'completado'`, default: `'pendiente'`)
- `created_at`: Date (default: `Date.now`, usado para cuotas mensuales)
- `webhook_url`: String (opcional, Team IA / Enterprise)

### 1.3 `componentes_filtrados`
- `codigo_proyecto`: String (required, indexado)
- `archivo_blade`: String (required, ej. `resources/views/auth/login.blade.php`)
- `ruta_web`: String (required, ej. `/login` o `N/A`)
- `elementos_detectados`: Array de String
- `etiqueta_svm`: Number (enum: `0 | 1`)
- `clasificacion`: String (enum: `'Código Relevante' | 'Ruido Visual'`)

### 1.4 `documentos_generados`
- `codigo_proyecto`: String (required, indexado)
- `tipo_documento`: String (enum: `'Historias de Usuario (INVEST)' | 'Manual Técnico (IEEE 830)' | 'Manual de Usuario (ISO 26514)'`)
- `estado_auditoria`: String (enum: `'borrador_ia' | 'validado_humano'`, default: `'borrador_ia'`)
- `token_count`: Number (required)
- `modelo_ia`: String (required, ej. `'Phi-3 Mini (3.8B)'`)
- `contenido_markdown`: String (required)

### 1.5 `logs_auditoria`
- `usuario`: String (correo o nombre de cuenta BD)
- `rol_bd`: String (ej. `'worker_ia_service'`, `'auditor_qa_docuflow'`, `'admin_docuflow'`)
- `accion`: String (ej. `'LOGIN_EXITOSO'`, `'CARGA_PROYECTO_ZIP'`, `'CAMBIO_PLAN'`, `'VALIDACION_DOCUMENTO'`, `'EXPORTACION_PDF'`, `'INTENTO_ACCESO_DENEGADO'`)
- `entidad_afectada`: String
- `direccion_ip`: String
- `resultado`: String (enum: `'EXITOSO' | 'BLOQUEADO_UNAUTHORIZED'`)
- `timestamp`: Date (default: `Date.now`)

## 2. Catálogo Centralizado de Planes (`src/core/constants/plans.ts`)
Este catálogo es la fuente de verdad para el guardián de reglas (`planGuardService.ts`) y la UI:

| Plan (`nombre`) | Subtítulo | Precio MXN | `max_proyectos_mes` | Max `.zip` MB | Max Vistas `.blade.php` | Nivel IA / Modelo | Anuncios / Intersticial 15s | Entregables Desbloqueados | Exportación | Extras |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :---: | :--- | :--- | :--- |
| `Freemium` | Explorer Ad-Supported | `0` | `2` | `15` | `15` | L1 (`Phi-3 Mini 3.8B Q4`) | Sí (Banners + 15s) | Solo INVEST | `.md` con firma DocuFlow AI | 2 GB / 15 días retención, 1 usuario |
| `Pro` | Indie & Freelance | `399` | `10` | `150` | `100` | L2 (`Phi-3 Mini FP16 + Qwen 2.5 Coder 7B`) | No | Los 3 (INVEST, IEEE 830, ISO 26514) | `.md` y `.pdf` limpios | 100 GB, 1 titular + 1 invitado lectura, UML Casos de Uso |
| `Team IA` | Agencias & Startups | `999` | `30` | `500` | `300` | L3 (`Qwen 2.5 Coder 14B/32B + Llama 3.1`) | No | Los 3 + Auditoría Blade/WCAG 2.1 | `.md` y `.pdf` limpios | 1 TB, hasta 5 usuarios RBAC, Webhooks GitHub/GitLab, Secuencia/ER |
| `Enterprise` | Enterprise & Custom Cloud | `3999` | `9999` | `2048` | `2000` | L4 (`70B / Gemini API + RAG`) | No + White-Label | Todo + Plantillas CMMI/ISO 9001 + OWASP | `.md`, `.pdf` White-Label + conectores | 5 TB, usuarios ilimitados, Bitácora completa, API REST Key |

## 3. Script de Sincronización Segura (`scripts/sync-seed.ts`)
- NO borrar documentos existentes en `DocuFlowAI`.
- Solo detectar si `emiliano@docuflow.ia` o `nadia@docuflow.ia` tienen un `password_hash` no válido (que no inicie con `$2a$` o `$2b$`) y reemplazarlo por un hash `bcryptjs` real de una contraseña de desarrollo documentada (ej. `DocuFlow2026!`).
- Actualizar el precio del plan `Pro` existente de `199.99` -> `399` y `max_proyectos_mes` de `15` -> `10` para alinear con la matriz comercial vigente.
