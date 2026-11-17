# Modelo de Datos y Arquitectura de Persistencia

> **Fuente:** Consolidación de [`diagrama-esavi.mmd`](../../diagrama-esavi.mmd) y [`arquitectura-docker-cloudsql.mmd`](../../arquitectura-docker-cloudsql.mmd) bajo el estándar SDD (`/specs/data`).

---

## 1. Arquitectura de Contenedores y Servicios GCP

```mermaid
flowchart TB
    subgraph Clientes ["1. Capa de Clientes (Navegadores Web / PWA)"]
        direction LR
        U1["Personal Clínico / ESAVI Local"]
        U2["Epidemiología / Inmunizaciones"]
        U3["Jefaturas / Comité Externo"]
    end

    subgraph ServidorHost ["2. Infraestructura Contenerizada (GCP Cloud Run / GKE / Docker)"]
        direction TB
        Nginx["Contenedor: Reverse Proxy / Frontend Nginx<br/><b>Puertos: 80 / 443 + GET /health</b>"]
        AppBack["Contenedor: Backend API (NestJS / FastAPI)<br/><b>Lógica ESAVI + RBAC + Validación JWT Keycloak</b>"]
        SQLProxy["Contenedor: Cloud SQL Auth Proxy<br/><b>Túnel IAM a GCP</b>"]
    end

    subgraph GCP ["3. Servicios Gestionados"]
        CloudSQL[("Google Cloud SQL (PostgreSQL)<br/>Expedientes, Anexos, Auditoría")]
        GCS[("Google Cloud Storage (GCS_BUCKET_NAME)<br/>Evidencias privadas + Signed URLs")]
        Redis[("Redis<br/>Rate Limiting, Caché, Locks Correlativo, Colas")]
        Keycloak["Keycloak (SSO Institucional)"]
    end

    U1 & U2 & U3 -->|HTTPS TLS + JWT| Nginx
    Nginx -->|/* Estáticos React| Clientes
    Nginx -->|/api/*| AppBack
    AppBack -->|Valida JWT| Keycloak
    AppBack -->|127.0.0.1:5432| SQLProxy
    SQLProxy -->|mTLS| CloudSQL
    AppBack -->|Signed URLs / SDK| GCS
    AppBack -->|Caché / Locks / Rate Limit| Redis
```

---

## 2. Flujo Funcional del Caso ESAVI

```mermaid
flowchart TD
    F1["Fase 1: Notificación Inicial (FACEDRA / Anexo I)"] --> F2["Fase 2: Evaluación y Matriz de Riesgo"]
    F2 --> F3["Fase 3: Asignación ERR y Sub-Equipo Regulatorio SRS"]
    F3 --> F4["Fase 4: Investigación de Campo (Anexos III, V, VI, VII + Evidencias)"]
    F4 --> F51["Fase 5.1: Auditoría Paralela Institucional"]
    F51 -->|Observaciones| F4
    F51 -->|Aprobación Unánime| F52["Fase 5.2: Auditoría Secretariado SRS"]
    F52 -->|Observaciones| F51
    F52 -->|Aprobado + Informe Técnico| F6["Fase 6: Comité Externo CNED y Dictamen OMS"]
```

---

## 3. Diccionario de Entidades Principales (Transición Firestore -> PostgreSQL)

| Entidad / Colección | Identificador Primario | Campos Clave y Propósito |
| :--- | :--- | :--- |
| **`casos` (`expedientes`)** | `id_caso` (`ESAVI-YYYY-XXX`) | Metadatos de trazabilidad, `id_creador`, `establecimiento_notificador`, `id_establecimiento`, `riesgo`, `estado_flujo`, `datos_fase1_json`, `medicamentos_concomitantes_json`, `equipo_err_json`, `equipo_regulatorio_json`, `dictamen_data`, banderas `anexoIII/V/VI/VII`, `archivosAdjuntos`. |
| **`ANEXO_III_LOGISTICA`** | `id_caso` | Requerimientos logísticos, transporte, bioseguridad y cadena de custodia previo al despliegue de campo. |
| **`ANEXO_V_PUESTO`** | `id_caso` | Evaluación de cadena de frío, manipulacion de diluyentes/jeringas, otros vacunados con mismo lote y entrevista al vacunador. |
| **`ANEXO_VI_DOMICILIO`** | `id_caso` | Condiciones de vivienda, búsqueda comunitaria de casos similares y entrevista familiar domiciliaria. |
| **`ANEXO_VII_CLINICO`** | `id_caso` | Anamnesis detallada, cronología de eventos clínicos, paraclínicos, hallazgos de autopsia, datos obstétricos y miembros del ERR. |
| **`MATRIZ_RIESGO`** | `id_caso` | Criterios de gravedad y ponderación de riesgo (`Bajo`, `Moderado`, `Alto`, `Crítico`). |
| **`ASIGNACIONES_ERR`** | `id_caso` | Miembros locales, auditores institucionales, referentes SRS y apoyos (`VER` / `LLENAR`). |
| **`AUDITORIAS_CALIDAD`** | `id_auditoria` | Evaluaciones parciales por anexo en Fase 5.1 (`aprobado` / `observado`) y resoluciones de Fase 5.2. |
| **`historial_cambios`** | `id_log` | Bitácora inmutable de auditoría (`fecha`, `usuario`, `rol`, `accion`, `id_caso`). |
| **`usuarios`** | `email` | Perfil institucional, rol RBAC, establecimiento asignado (`id_establecimiento`), `institucionMacro`, estado `activo`. |
| **`establecimientos`** | `id` | Catálogo oficial de USSF / Hospitales MINSAL e ISSS, departamento, municipio y SIBASI. |

---

## 4. Repositorio Digital de Evidencias (5 Categorías Oficiales)

Las evidencias adjuntas en el Anexo I se clasifican obligatoriamente en cinco particiones lógicas:
1. `clinica`: Historia clínica, epicrisis, exámenes de laboratorio, necropsia/autopsia.
2. `pni`: Carné de vacunación, registros del puesto, control de temperatura y cadena de frío.
3. `epidemiologica`: Fichas de investigación comunitaria, mapas epidemiológicos, entrevistas de campo.
4. `general`: Documento de identidad (DUI/pasaporte) y documentación administrativa.
5. `regulatorio` (`[REGULATORIO]`): Habilitado exclusivamente para casos **Alto/Crítico**; escritura reservada al **Secretariado Analista** / **Coordinador**.

---

## 5. Caché Offline Local (`IndexedDB` / Dexie: `esavi_offline_db`)

| Tabla Local | Propósito | Regla de Seguridad en `logout()` |
| :--- | :--- | :--- |
| `casosCache` | Copia de solo lectura para consulta sin internet. | **Se purga por completo** al cerrar sesión. |
| `anexosLocales` | Borradores (`BORRADOR`) y envíos en cola (`PENDIENTE_SYNC`). | Se eliminan registros `SINCRONIZADO`; se preservan borradores/pendientes sin sincronizar. |
| `evidenciasLocales` | Archivos binarios (`Blob`) capturados en campo offline. | Se eliminan registros `SINCRONIZADO`; se preservan pendientes de subir. |
| `colaSincronizacion` | Outbox priorizado (`1: Archivos`, `2: Anexos`). | Se conserva intacto hasta completar sincronización exitosa. |
