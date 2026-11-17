# Lineamientos Técnicos, de Arquitectura y Configuración (SRS)

> **Institución:** Superintendencia de Regulación Sanitaria (SRS)  
> **Documento Base:** `00.00.00.HER.00000000.00` (Versión No. xx) — *Blv. Merliot y Av. Jayaque, Edif. SRS, Urb. Jardines del Volcán, Santa Tecla, La Libertad Sur, La Libertad* (`https://www.srs.gob.sv`)  
> **Aplicación Evaluada:** Plataforma ESAVI (`esavi-frontend`)  
> **Propósito del Archivo:** Versión viva y verificable en Markdown para auditar y dar seguimiento al cumplimiento arquitectónico y de ciberseguridad previo al paso a pruebas (`www.dev.srs.gob.sv`) y producción en Google Cloud Platform (GCP).

---

## 1. Propósito

El presente documento establece los lineamientos técnicos, de arquitectura y configuración que toda nueva aplicación deberá cumplir desde el inicio de su desarrollo para garantizar despliegues ágiles, seguros, escalables y estandarizados dentro de la infraestructura de **Google Cloud Platform (GCP)**.

---

## 2. Metodología para la construcción de la aplicación

Para cada nuevo desarrollo, microservicio o funcionalidad se sugiere utilizar la metodología **Spec-Driven Development (SDD)**.

Bajo este paradigma, la especificación es la fuente de verdad y precede la escritura de código fuente. Las especificaciones deberán almacenarse y versionarse junto con el código fuente en el directorio raíz `/specs` del repositorio.

### Estructura sugerida para la carpeta del proyecto

```text
nombre-del-repositorio/
├── specs/                          # Fuente de verdad (Spec-Driven Development)
│   ├── 00-system-overview.md       # Contexto, arquitectura, recursos GCP, SA y Rate Limits
│   ├── contracts/                  # Contratos de comunicación (API-First)
│   │   ├── openapi.yaml            # Contrato REST (Frontend <-> Backend)
│   │   └── queues-and-jobs.md      # Payloads de colas (Redis) y tareas de Scheduler
│   ├── data/                       # Especificación de persistencia
│   │   └── data-model.md           # Diagrama ER (Mermaid), tablas, índices y uso de Redis/GCS
│   ├── features/                   # Especificaciones por funcionalidad (secuenciales)
│   │   ├── 001-auth-keycloak/
│   │   │   ├── spec.md             # Reglas de negocio, flujos y criterios de aceptación
│   │   │   ├── plan.md             # Diseño técnico, variables .env/Secrets e impacto
│   │   │   └── tasks.md            # Desglose de tareas de implementación y pruebas
│   │   └── 002-procesamiento-gemini/
│   │       ├── spec.md
│   │       ├── plan.md
│   │       └── tasks.md
│   └── templates/                  # Plantillas base para nuevas funcionalidades
│       ├── spec.template.md
│       └── plan.template.md
├── docker/                         # Configuraciones operativas del contenedor
│   ├── supervisord.conf            # Definición de procesos (nginx/apache, workers, scheduler)
│   └── nginx.conf
├── src/                            # Código fuente de la aplicación
├── tests/                          # Pruebas automatizadas (validadas contra /specs)
├── .env.example                    # Variables de entorno y listado de Secrets (APP_KEY, etc.)
├── .gitignore                      # Exclusión de .env, archivos locales y artefactos de build
├── Dockerfile                      # Construcción Multi-stage (deps -> build -> production)
└── README.md                       # Guía operativa, migraciones, comandos y permisos de SA
```

> **Nota de la SRS:** Esta metodología es la sugerida en el caso de que el desarrollo sea guiado por Inteligencia Artificial en su totalidad. Para otros escenarios el uso de esta u otras metodologías es a criterio del desarrollador de la aplicación. El uso de una metodología es opcional, pero facilita el futuro mantenimiento de la aplicación.

### Checklist de Verificación (Sección 2)
- [x] Se cuenta con documentación OpenSpec inicial (`.openspec.md`) y diagramas Mermaid (`diagrama-esavi.mmd`, `arquitectura-docker-cloudsql.mmd`).
- [x] Reorganizar la documentación en la estructura estándar `/specs` (`00-system-overview.md`, `/contracts/openapi.yaml`, `/data/data-model.md`, `/templates/*`; pendiente desglose por funcionalidad en `/features/*`).
- [ ] Crear directorio `/tests` con pruebas automatizadas validadas contra `/specs`.
- [x] Crear directorio `/docker` con `nginx.conf` (y `supervisord.conf` si aplica al backend).
- [ ] Actualizar `README.md` con guía operativa, migraciones, comandos y permisos de Service Account (SA).

---

## 3. Arquitectura y Ciclo de Vida

### 3.1. Definición de arquitectura
Uno de los primeros pasos a la hora de construir aplicaciones es definir el diagrama de arquitectura de la aplicación y los servicios a utilizar (Redis, Databases, Servicios de Google Cloud, etc.).

Este punto es importante para el mantenimiento de la aplicación y, en caso de ser necesario, el equipo **DevOps** y el equipo **Senior de Desarrollo de UTIC** pueden apoyar en esta actividad.

### 3.2. Principio de Inmutabilidad y Escalabilidad
Toda aplicación deberá ser diseñada asumiendo su ejecución en múltiples contenedores simultáneos que se crean y se destruyen dinámicamente en función de la demanda:

- **Inmutabilidad (Stateless):** La aplicación no deberá almacenar estado, sesiones ni archivos en el disco local del contenedor.
- **Escalabilidad Horizontal:** La arquitectura de la aplicación deberá soportar el aumento o disminución automática de réplicas según el volumen de usuarios y carga de trabajo.

### Checklist de Verificación (Sección 3)
- [x] Existe diagrama de arquitectura objetivo (`arquitectura-docker-cloudsql.mmd`) con Nginx, Frontend, Backend API, Cloud SQL Proxy y GCS.
- [ ] Validar el diagrama de arquitectura actualizado (incluyendo **Keycloak** y **Redis**) con el equipo DevOps / UTIC.
- [ ] Garantizar que la app opere 100% *Stateless* en servidores/contenedores (sin archivos o sesiones en disco del contenedor).

---

## 4. Estándares de diseño

### 4.1. Frameworks sugeridos
Con el objetivo de mantener la compatibilidad con los despliegues automáticos y el soporte de seguridad, se sugiere el uso de los siguientes frameworks en sus versiones **LTS (Long-Term Support)** activas:

| Capa | Frameworks Sugeridos (LTS) |
| :--- | :--- |
| **Frontend** | Angular, NextJS, Vue |
| **Backend / APIs** | Laravel, NestJS, FastAPI, NextJS |

#### Checklist de Verificación (Sección 4.1)
- [ ] Definir con UTIC/DevOps si el Frontend actual (**React 18 + Vite + TypeScript**) se despliega empacado en contenedor `Nginx` o se migra a **NextJS LTS**.
- [ ] Implementar el **Backend / API REST** pendiente usando un framework LTS aprobado (**NestJS** o **FastAPI** recomendados).

---

### 4.2. Almacenamiento de archivos
Dado que los contenedores operan bajo el principio de inmutabilidad, cualquier archivo escrito en directorios locales del contenedor (ej. `/uploads`, `/storage`, `/tmp`) se perderá al reiniciar o escalar el servicio.

Lo ideal es utilizar un framework que soporte diferentes tipos de *filesystem* para no depender de la integración directa y poder intercambiar entre Google Cloud Storage, S3, NAS u otro almacenamiento de archivos.

- **Alternativa recomendada:** Integrar el SDK o driver oficial de **Google Cloud Storage** para la lectura, escritura y generación de **URLs firmadas (Signed URLs)**, parametrizando el nombre del bucket mediante variables de entorno (ej. `GCS_BUCKET_NAME`).
- **Alternativa menos recomendada:** Utilizar una carpeta para el almacenamiento de archivos (ej. `/uploads`) integrada a un almacenamiento externo persistente.

#### Checklist de Verificación (Sección 4.2)
- [ ] Eliminar la carga directa desde navegador hacia Cloudinary (`src/services/firebaseService.ts`).
- [ ] Implementar en el Backend la subida, validación de tipo/tamaño y generación de **Signed URLs** sobre Google Cloud Storage (`GCS_BUCKET_NAME`).

---

### 4.3. Caché, Sesiones y Colas: Redis
En el caso de las aplicaciones que manejan sesiones, caché y/o colas se debe evitar que estas sean almacenadas en la memoria interna de la aplicación debido a que se perderán al reiniciar o escalar el servicio.

Para ello se brinda la posibilidad de utilizar **Redis** para la gestión de caché, sesiones, *locks* y colas de procesamiento, configurando su conexión vía variables de entorno.

#### Checklist de Verificación (Sección 4.3)
- [ ] Configurar instancia/servicio de **Redis** en el entorno Backend vía variables de entorno (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`).
- [ ] Migrar bloqueos atómicos (ej. generación de correlativo `ESAVI-YYYY-XXX`), caché de catálogos y cola de notificaciones asíncronas a Redis.

---

### 4.4. Autenticación y Autorización
Actualmente las iniciativas contemplan el uso de **Keycloak** como único proveedor de identidad, por lo que se sugiere que la autenticación se maneje con Keycloak.

- El **backend deberá validar los tokens JWT emitidos por Keycloak**.
- **El manejo de roles/permisos se delega a la aplicación** y no es manejado por Keycloak.

#### Checklist de Verificación (Sección 4.4)
- [ ] Integrar flujo OIDC/OAuth2 con **Keycloak** en el Frontend (reemplazando Firebase Auth).
- [ ] Validar la firma criptográfica, emisor (`iss`) y expiración (`exp`) de los JWT de Keycloak en cada endpoint del Backend.
- [ ] Mantener el control granular de los roles ESAVI (`ESAVI_LOCAL`, `SECRETARIADO`, `COMITE_EXTERNO`, etc.) y permisos por expediente en el Backend/BD institucional (no confiar en roles almacenados en `sessionStorage`).

---

### 4.5. Rate Limits
Para resguardar la estabilidad de los servicios ante picos de tráfico, intentos de fuerza bruta o uso excesivo de recursos se deben implementar *middlewares* de **Rate Limiting**, los cuales deberán ser configurados a través de variables de entorno:

- `RATE_LIMIT_MAX_REQUESTS`
- `RATE_LIMIT_WINDOW_SECONDS`

#### Checklist de Verificación (Sección 4.5)
- [ ] Implementar middleware de Rate Limiting en el Backend parametrizado por `RATE_LIMIT_MAX_REQUESTS` y `RATE_LIMIT_WINDOW_SECONDS` (apoyado en Redis para entornos multi-réplica).

---

### 4.6. Configuraciones, Secretos y Service Accounts

#### 4.6.1. Variables Sensibles
- Ninguna credencial, llave o URL de servicio deberá encontrarse fija (*hardcodeada*) dentro del código fuente; para ello se sugiere el uso de un archivo `.env`.
- El repositorio deberá incluir y mantener actualizado un archivo `.env.example` que contenga la totalidad de las variables requeridas por la aplicación, acompañadas de valores de ejemplo.

#### 4.6.2. Gestión de Secretos
- En los ambientes productivos las variables sensibles se resguardan en **Google Secret Manager** y son inyectadas de forma segura como variables de entorno durante la ejecución del contenedor.
- Existe la alternativa de integrar de forma nativa el soporte para obtener a demanda los secretos a través del SDK disponible de Google para Secret Manager.
- De lo contrario, los secretos serán configurados referenciando su variable de entorno correspondiente durante el despliegue.

#### Checklist de Verificación (Sección 4.6)
- [x] Existe `.env.example` y `.gitignore` excluye `.env` y `.env.*`.
- [x] Eliminar valores por defecto/URLs *hardcodeadas* en el código fuente (`dowejnpvd`, `esavi_docs`, URLs directas en `firebaseService.ts`, `Login.tsx` y `NotificacionInicial.tsx`).
- [x] Actualizar `.env.example` con las nuevas variables de arquitectura (`API_BASE_URL`, `KEYCLOAK_*`, `GCS_BUCKET_NAME`, `REDIS_*`, `RATE_LIMIT_*`, `GCP_PROJECT_ID`, `GCP_REGION`).
- [ ] Configurar integración con **Google Secret Manager** para entornos de pruebas y producción.

---

### 4.7. Health Endpoint
Toda aplicación o servicio web deberá exponer un endpoint `GET /health` **sin requerir autenticación**.

- **HTTP 200 OK:** Cuando la aplicación se encuentre operativa.
- **HTTP 503 Service Unavailable:** En caso de presentar fallos en dependencias críticas (Base de Datos, Redis, etc.).

Ejemplo de respuesta esperada:

```json
{
  "status": "ok",
  "service": "orders-api",
  "timestamp": "2026-10-26T15:00:00Z"
}
```

#### Checklist de Verificación (Sección 4.7)
- [x] Exponer `GET /health` público en el contenedor Frontend (Nginx) devolviendo `HTTP 200 OK` JSON.
- [ ] Exponer `GET /health` público en el Backend validando conectividad real con Cloud SQL y Redis (`200` / `503`).

---

### 4.8. Uso de contenedores
La contenerización de las aplicaciones se estructurará mediante **Multi-Stage Builds**, dividiendo el proceso en etapas claramente definidas:

1. **Stage de Instalación de Dependencias:** Determinista en relación a las librerías a partir de los archivos de *lock* (`package-lock.json`, `composer.lock`, `requirements.txt`, etc.), los cuales deberán estar versionados en Git.
2. **Stage de Build:** Compilación de código fuente, generación de artefactos y empaquetado de assets.
3. **Stage de Ejecución (Runtime):** Imagen final ligera e inmutable que contiene exclusivamente los binarios y dependencias de producción necesarios para ejecutar la aplicación.

#### Checklist de Verificación (Sección 4.8)
- [x] `package-lock.json` está versionado en Git.
- [x] Crear `Dockerfile` Multi-Stage para Frontend (Node `npm ci` -> `npm run build` -> Nginx Alpine ligero con cabeceras de seguridad) y `.dockerignore`.
- [ ] Crear `Dockerfile` Multi-Stage para Backend.
- [x] Cambiar `<HashRouter>` a `<BrowserRouter>` en `src/App.tsx` al migrar de GitHub Pages a Nginx/GCP *(modo dual por `VITE_ROUTER_MODE=browser` manteniendo `HashRouter` por defecto para GitHub Pages)*.

---

### 4.9. Migraciones de Base de Datos
- Toda alteración al esquema de base de datos deberá gestionarse mediante **archivos de migración versionados** en el repositorio.
- Las migraciones deberán ser **retrocompatibles** con la versión en ejecución durante el despliegue, evitando renombrar o eliminar columnas en el mismo paso en que se modifica el código.
- La ejecución de las migraciones deberá mantenerse **independiente del arranque del servidor web** para permitir que se ejecute como un paso controlado dentro del flujo de despliegue y no afecte el tiempo en que inicia la aplicación.

#### Checklist de Verificación (Sección 4.9)
- [ ] Definir esquema relacional en PostgreSQL/MySQL (Cloud SQL) en reemplazo de Firestore NoSQL.
- [ ] Configurar herramienta de migraciones versionadas en el Backend (ej. Prisma Migrate, TypeORM Migrations o Alembic) separada del entrypoint del servidor.

---

## 5. Uso de Agent Platform

Para el uso de **Gemini Enterprise Agent Platform** (anteriormente conocido como Vertex AI) en las aplicaciones:

- Se debe realizar haciendo uso del **SDK oficial** que Google provee de acuerdo con el lenguaje de programación utilizado.
- La autenticación en producción se debe realizar mediante **Service Account (SA)**; **no se deben emplear API KEYS estáticas** dentro de la aplicación.
- Para desarrollo local, se debe contar con acceso a los roles **Agent Platform** y **Service Usage Consumer**.

### Autenticación en máquina local
Ejecutar en terminal con cuenta de usuario institucional para generar las credenciales predeterminadas:

```bash
gcloud auth application-default login
```

Esto abrirá el navegador para autorizar a Google Cloud SDK y guardará las credenciales en `~/.config/gcloud/application_default_credentials.json`.

- **Repositorio de referencia SRS:** `gitlab.srs.gob.sv/examples/agent-platform`
- **Variables requeridas en el proyecto:** `GCP_PROJECT_ID` y `GCP_REGION` (y montaje de volumen de credenciales locales en `compose.yml` para pruebas en Docker local).

#### Checklist de Verificación (Sección 5)
- [ ] *(Si se incorporan capacidades de IA para triaje o resúmenes ESAVI)* Implementar únicamente en Backend usando el SDK oficial de Vertex AI / Agent Platform con Service Account (ADC en local), nunca desde el Frontend ni con API Keys estáticas.

---

## 6. Observabilidad

- **Prohibido escribir logs en archivos locales** dentro del contenedor (ej. `storage/logs/*.log`, `/var/log/app.log`), ya que comprometen el almacenamiento efímero y se pierden al reemplazar el contenedor.
- Se requiere direccionar la totalidad de los logs hacia la salida estándar **`stdout` y `stderr`**, preferiblemente en **formato JSON estructurado** para su recolección centralizada en GCP Cloud Logging.
- **Regla crítica de seguridad:** **Los logs no deberán incluir contraseñas, tokens, keys ni datos personales sensibles (PHI/PII).**

#### Checklist de Verificación (Sección 6)
- [x] Eliminar todos los `console.log` que exponen datos clínicos de pacientes o PDFs en el navegador (`NotificacionInicial.tsx`, `FormularioApertura.tsx`, `DictamenCausalidad.tsx`).
- [ ] Implementar logger JSON estructurado en `stdout`/`stderr` en el Backend con redacción (*masking*) de campos sensibles (DUI, nombres, tokens, contraseñas).

---

## 7. Git

El historial de versiones en Git deberá regirse por el estándar **Conventional Commits**, utilizando la estructura `<tipo>(alcance opcional): <descripción>`:

- **`feat`:** Incorporación de una nueva funcionalidad (ej. `feat(payments): integrar validación de comprobantes`).
- **`fix`:** Corrección de un error identificado (ej. `fix(auth): corregir lectura de tokens jwt`).

#### Checklist de Verificación (Sección 7)
- [x] El repositorio utiliza prefijos de Conventional Commits (`feat:`, etc.).
- [ ] Configurar hooks o validación en CI (`commitlint`) y usar siempre alcance opcional descriptivo (`feat(anexos): ...`, `fix(auth): ...`).

---

## 8. Repositorio de código

Para el almacenamiento del código y su versionamiento, se hará uso de **GitLab**.

- **URL:** `gitlab.srs.gob.sv`
- **Autenticación:** Credenciales de **Active Directory**.

#### Checklist de Verificación (Sección 8)
- [ ] Solicitar acceso/creación del repositorio del proyecto en `gitlab.srs.gob.sv` (Frontend y Backend).
- [ ] Migrar historial de Git desde GitHub (`Laroguee/esavi-frontend`) hacia `gitlab.srs.gob.sv` y configurar `.gitlab-ci.yml`.

---

## 9. Ambientes de desarrollo

Con el propósito de realizar pruebas previo a la implementación en producción, se cuenta con entornos dinámicos de prueba:

- **Plataforma:** `www.dev.srs.gob.sv`
- **Requisito de acceso:** Conexión mediante **VPN institucional** y coordinación previa con el equipo **DevOps**.

#### Checklist de Verificación (Sección 9)
- [ ] Solicitar acceso VPN y habilitación en `www.dev.srs.gob.sv` al equipo DevOps de la SRS.
- [ ] Realizar despliegue piloto de Frontend + Backend + BD en entorno de desarrollo antes de solicitar paso a Producción.
