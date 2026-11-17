# 00 - Visión General del Sistema ESAVI (`esavi-frontend`)

> **Metodología:** Spec-Driven Development (SDD) — Lineamientos SRS (`00.00.00.HER.00000000.00`)  
> **Institución Rectora:** Superintendencia de Regulación Sanitaria (SRS), MINSAL e ISSS (El Salvador)

---

## 1. Propósito del Sistema
Plataforma institucional para la notificación, triaje de riesgo, investigación de campo, auditoría paralela de calidad, generación de informe técnico pericial y dictamen final de causalidad de **Eventos Supuestamente Atribuibles a la Vacunación o Inmunización (ESAVI)**.

---

## 2. Arquitectura Objetivo vs. Arquitectura de Transición

### 2.1. Entorno de Pruebas / Transición (Actual - GitHub Pages)
- **Frontend:** React 18 + TypeScript + Vite (`HashRouter` por compatibilidad con GitHub Pages) + Material UI v6 + React Hook Form + Zod + Zustand.
- **Almacenamiento Offline:** `IndexedDB` vía Dexie (`esavi_offline_db`) para resiliencia en trabajo de campo.
- **Persistencia Remota Temporal:** Firebase Auth + Cloud Firestore + Cloudinary (evidencias).

### 2.2. Entorno Productivo Objetivo (Infraestructura SRS / GCP)
- **Contenedores Inmutables (Stateless):**
  - `esavi-frontend`: Nginx Alpine sirviendo el bundle optimizado (`BrowserRouter`) + endpoint `GET /health` + cabeceras de seguridad HTTP.
  - `esavi-backend`: API REST (NestJS LTS o FastAPI LTS) conectada vía Cloud SQL Auth Proxy.
- **Autenticación y Autorización:** Keycloak (OIDC / JWT validado en Backend) con RBAC delegado a la base de datos de la aplicación.
- **Base de Datos:** Google Cloud SQL (PostgreSQL) con migraciones versionadas independientes del arranque web.
- **Almacenamiento de Evidencias:** Google Cloud Storage (`GCS_BUCKET_NAME`) privado con **Signed URLs** temporales emitidas por el Backend.
- **Caché, Colas y Rate Limits:** Redis gestionado vía variables de entorno (`RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_SECONDS`).
- **Secretos:** Google Secret Manager inyectado en tiempo de ejecución.
- **Observabilidad:** Logs JSON estructurados hacia `stdout` / `stderr` sin PII/PHI ni credenciales.

---

## 3. Máquina de Estados del Expediente (6 Fases Normativas)

| Fase | Estados Válidos | Responsable Principal | Descripción Operativa |
| :--- | :--- | :--- | :--- |
| **Fase 1: Notificación** | `NUEVO`, `NOTIFICADO`, `NORMAL`, `PENDIENTE_OFICIALIZAR` | `ESAVI_INSTITUCIONAL` / Notificador | Registro primario del evento (manual o lectura PDF FACEDRA) y validación de duplicidad. |
| **Fase 2: Evaluación y Triaje** | `EN_EVALUACION` | Equipo Coordinador Institucional (`ESAVI`, `INMUNO`, `EPIDEMIO_INSTITUCIONAL`) | Reunión inicial y cálculo de **Matriz de Riesgo** (`Bajo`, `Moderado`, `Alto`, `Crítico`). |
| **Fase 3: Asignación ERR** | `EN_ASIGNACION`, `ASIGNADO_A_ERR` | `ESAVI_INSTITUCIONAL` / `Secretariado Coordinador` | Designación del Equipo de Respuesta Rápida (ERR) local, apoyos (`VER`/`LLENAR`) y Sub-Equipo Regulatorio SRS en casos Alto/Crítico. |
| **Fase 4: Investigación de Campo** | `EN_INVESTIGACION`, `DEVUELTO_A_ERR`, `CORREGIDO_POR_ERR` | `ESAVI_LOCAL`, `INMUNO_LOCAL`, `EPIDEMIO_LOCAL` | Llenado de Anexo III (Logística), Anexo V (Puesto de Vacunación), Anexo VI (Domicilio), Anexo VII (Clínico) y repositorio digital (Anexo I). |
| **Fase 5: Control de Calidad** | `EN_REVISION_INSTITUCIONAL`, `DEVUELTO_A_INSTITUCIONAL`, `EN_REVISION_SECRETARIADO`, `APROBADO_PARA_COMITE` | **5.1:** Tríada Institucional (paralelo) / **5.2:** `Secretariado Coordinador` (SRS) | Auditoría paralela de anexos, visto bueno regulatorio y generación del Informe Técnico de Autoridades. |
| **Fase 6: Comité y Cierre** | `EN_EVALUACION_COMITE`, `DICTAMINADO`, `CERRADO_DICTAMINADO`, `CERRADO` | `COMITE_EXTERNO` (CNED) | Revisión independiente, clasificación de causalidad OMS y cierre oficial del expediente. |

---

## 4. Matriz de Roles (RBAC)

1. **`ESAVI_LOCAL` / `INMUNO_LOCAL` / `EPIDEMIO_LOCAL`:** Operación local de campo en casos de su establecimiento o asignados vía ERR (`Anexo VII`, `Anexo V`, `Anexo VI`, `Anexo III`).
2. **`ESAVI_INSTITUCIONAL` / `INMUNO_INSTITUCIONAL` / `EPIDEMIO_INSTITUCIONAL`:** Equipo Coordinador Institucional (triaje, matriz de riesgo, asignación ERR y auditoría paralela Fase 5.1).
3. **`SECRETARIADO` (SRS):** Autoridad reguladora nacional. En casos Alto/Crítico se subdivide en:
   - **Secretariado Coordinador:** Lidera Sub-Equipo Regulatorio, aprueba/devuelve en Fase 5.2, presenta Informe Técnico y convoca Fase 6.
   - **Secretariado Analista:** Gestión de evidencias en la carpeta `[REGULATORIO]`.
   - **Secretariado Apoyo:** Acceso estricto de solo lectura.
4. **`OBSERVADOR_EPIDEMIO` / `OBSERVADOR_INMUNO`:** Solo lectura a partir de `EN_REVISION_SECRETARIADO`.
5. **`COMITE_EXTERNO`:** Comité Nacional de Expertos (evaluación independiente y dictamen OMS en Fase 6).
6. **`ERR`:** Perfil de apoyo técnico en equipo de respuesta rápida.

---

## 5. Parámetros Operativos y Rate Limits (Objetivo Producción)

- `RATE_LIMIT_MAX_REQUESTS`: `100` peticiones por ventana (configurable por entorno).
- `RATE_LIMIT_WINDOW_SECONDS`: `60` segundos.
- **Health Check:** `GET /health` público en Frontend (Nginx) y Backend (verificando Cloud SQL + Redis).
- **Inactividad de Sesión:** Bloqueo preventivo tras **15 minutos** sin actividad con ventana de gracia de **60 segundos**.
