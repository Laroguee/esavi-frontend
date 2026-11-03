import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore, type Role } from '../../store/useAuthStore';

interface RoleProtectedRouteProps {
  allowedRoles: Role[];
  redirectPath?: string;
}

/**
 * Guardián de Rutas basado en Roles (RBAC).
 * Verifica que el usuario esté autenticado y que su rol coincida
 * con los roles autorizados para la vista.
 */
export default function RoleProtectedRoute({
  allowedRoles,
  redirectPath = '/'
}: RoleProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentRole = useAuthStore((state) => state.currentRole);

  // 1. Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Si el rol del usuario no está dentro de los permitidos, redirigir con restricción
  if (!currentRole || !allowedRoles.includes(currentRole)) {
    console.warn(`[Seguridad RBAC] Acceso denegado a ruta protegida. Rol actual: '${currentRole}', Roles requeridos: ${JSON.stringify(allowedRoles)}`);
    return <Navigate to={redirectPath} replace />;
  }

  // 3. Acceso autorizado: renderizar componente hijo
  return <Outlet />;
}

