# Sistema de Notificación y Gestión ESAVI - El Salvador 🇸🇻

Plataforma web para el registro, seguimiento y dictamen de Eventos Supuestamente Atribuibles a la Vacunación o Inmunización (ESAVI). El sistema está diseñado para coordinar los esfuerzos de investigación entre los diferentes niveles de salud (MINSAL, ISSS), el Secretariado Técnico (SRS) y el Comité Externo.

## 🌟 Características Principales

- **Flujo de Trabajo por Fases:** Gestión del expediente a través de 6 fases (Notificación, Riesgo, Asignación, Investigación de Campo, Control de Calidad y Dictamen).
- **Gestión de Anexos Clínicos:** Formularios digitales (Anexo III, V, VI, y VII) para la recopilación de datos logísticos, clínicos, domiciliarios y de puesto de vacunación.
- **Control de Acceso Basado en Roles (RBAC):** Permisos y vistas personalizadas según la jerarquía del usuario (Local, Institucional, Secretariado, ERR, Comité).
- **Sincronización en Tiempo Real:** Integración con Firebase Firestore para mantener el estado del expediente digital actualizado en todo momento.
- **Autenticación Segura:** Manejo de sesiones seguras por pestaña (`sessionStorage`) y validación de cuentas activas.
- **Diseño Responsivo:** Interfaz adaptada a dispositivos móviles, tablets y computadoras de escritorio.

## 🛠️ Stack Tecnológico

- **Frontend:** React 18 + TypeScript + Vite
- **UI Framework:** Material-UI (MUI) v6
- **Gestor del Estado Global:** Zustand (con middleware de persistencia)
- **Base de Datos y Autenticación:** Firebase (Firestore + Authentication)
- **Enrutamiento:** React Router DOM v6
- **Formularios y Validaciones:** React Hook Form + Zod
- **Generación de PDFs:** react-to-print (Expediente digital)

## 👥 Arquitectura de Roles

El sistema maneja un flujo descentralizado pero jerárquico:
1. **Nivel Local (Hospitales/Clínicas):** `ESAVI_LOCAL`, `INMUNO_LOCAL`, `EPIDEMIO_LOCAL`. Llenan los anexos de investigación de campo.
2. **Nivel Institucional (Sede Central MINSAL/ISSS):** `ESAVI_INSTITUCIONAL`, `INMUNO_INSTITUCIONAL`, `EPIDEMIO_INSTITUCIONAL`. Revisan los anexos y aprueban la auditoría de calidad de su institución.
3. **Nivel Regulador (SRS):** `SECRETARIADO`. Asigna a los expertos y agenda la revisión final.
4. **Equipo de Respuesta Rápida:** `ERR`. Especialistas que apoyan en la recolección de campo de casos graves.
5. **Comité Externo (CAPI):** `COMITE_EXTERNO`. Emite el dictamen final de causalidad.

## 🚀 Instalación y Ejecución Local

### Requisitos Previos
- [Node.js](https://nodejs.org/) (Versión 18 o superior)
- Git

### Pasos
1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Laroguee/esavi-frontend.git
   cd esavi-frontend
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   *La aplicación estará disponible por defecto en `http://localhost:5173/`*

## 🌐 Despliegue (Deploy)

El proyecto está configurado para desplegarse automáticamente a **GitHub Pages** mediante un script preconfigurado.

Para publicar la versión más reciente en producción, ejecuta:
```bash
npm run deploy
```
Este comando realizará el _build_ de producción y subirá el código a la rama `gh-pages`.

## 📁 Estructura del Proyecto

```text
src/
├── assets/          # Imágenes, íconos y logos
├── components/      # Componentes reutilizables (layout, alertas, botones)
├── config/          # Archivos de configuración (Firebase, Theme)
├── features/        # Módulos principales separados por dominio de negocio:
│   ├── administration/  # Creación y gestión de usuarios
│   ├── auth/            # Inicio de sesión
│   ├── cases/           # Bandeja, Expediente Digital, Visor de Anexos
│   ├── comittee/        # Módulos del Comité (Dictamen)
│   └── forms/           # Formularios divididos por fases (Fase 1 a 5)
├── services/        # Lógica de comunicación con Firebase/APIs
└── store/           # Estados globales de Zustand (Auth, Cases, Catalogos)
```

## 🔒 Seguridad
- El proyecto ignora por defecto archivos sensibles en su configuración (`.env`, scripts de población de bases de datos locales). Las contraseñas de producción se gestionan directamente desde la consola de Firebase.

---
*Desarrollado para la Dirección Nacional de Integración de Sistemas de Salud, El Salvador.*
