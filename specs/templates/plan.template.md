# Plan Técnico de Implementación: [XXX-nombre-funcionalidad]

> **Spec Asociada:** `specs/features/XXX-nombre-funcionalidad/spec.md`

---

## 1. Impacto en Componentes y Contratos
- **Frontend (`src/`):** Vistas, formularios (RHF + Zod) y stores afectados.
- **Contratos API (`openapi.yaml`):** Endpoints nuevos o modificados.
- **Persistencia (`data-model.md`):** Tablas, índices o migraciones retrocompatibles requeridas.

## 2. Variables de Entorno y Secretos
| Variable | Entorno (Local / Dev / Prod) | Origen (`.env` / Secret Manager) |
| :--- | :--- | :--- |
| `EJEMPLO_VAR` | Todos | Secret Manager |

## 3. Seguridad y Observabilidad
- Validación de autorización en Backend antes de ejecutar la acción.
- Sanitización de logs `stdout`/`stderr` (sin DUI, nombres, tokens ni claves).

## 4. Plan de Pruebas (`/tests`)
- [ ] Pruebas unitarias de lógica/esquemas Zod.
- [ ] Pruebas de integración / autorización RBAC.
- [ ] Verificación de compilación (`tsc -b && vite build`).
