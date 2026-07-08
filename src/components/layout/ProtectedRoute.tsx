import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from "../../store/useAuthStore";

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Si no está autenticado, lo enviamos al login y reemplazamos el historial
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, renderizamos la pantalla hija (Outlet)
  return <Outlet />;
}