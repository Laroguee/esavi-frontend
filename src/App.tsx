import { HashRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './features/cases/Dashboard';
import FormularioApertura from './features/forms/Fase1_Apertura/FormularioApertura';
import CaseDetail from './features/cases/CaseDetail';
import MatrizRiesgo from './features/forms/Fase2_Riesgo/MatrizRiesgo';
import AnexoVII_Clinico from './features/forms/Fase4_Investigacion/AnexoVII_Clinico';
import AnexoV_PuestoVacuna from './features/forms/Fase4_Investigacion/AnexoV_PuestoVacuna';
import AnexoVI_Domicilio from './features/forms/Fase4_Investigacion/AnexoVI_Domicilio';
import DictamenCausalidad from './features/comittee/DictamenCausalidad';
import NotificacionInicial from './features/forms/Fase1_Notificacion/NotificacionInicial';
import AsignacionERR from './features/forms/Fase3_Asignacion/AsignacionERR';
import AnexoIII_Logistica from './features/forms/Fase4_Investigacion/AnexoIII_Logistica';
import Login from './features/auth/Login';
import ProtectedRoute from './components/layout/ProtectedRoute';
import TrabajoCampo from './features/cases/TrabajoCampo';
import BandejaComite from './features/comittee/BandejaComite';
import ModuloAdministracion from './features/administration/ModuloAdministracion';
import ExpedienteDigital from './features/cases/ExpedienteDigital';

export default function App() {
  return (
    // TODO (Deploy): Cambiar a BrowserRouter para producción
    <HashRouter>
      <Routes>
        {/* RUTA PÚBLICA */}
        <Route path="/login" element={<Login />} />

        {/* RUTAS PROTEGIDAS */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="nuevo-caso" element={<FormularioApertura />} />
            <Route path="caso/:id" element={<CaseDetail />} />
            <Route path="matriz-riesgo/:id" element={<MatrizRiesgo />} />
            <Route path="anexo-clinico/:id" element={<AnexoVII_Clinico />} />
            <Route path="anexo-puesto/:id" element={<AnexoV_PuestoVacuna />} />
            <Route path="anexo-domicilio/:id" element={<AnexoVI_Domicilio />} />
            <Route path="comite-causalidad" element={<DictamenCausalidad />} />
            <Route path="notificacion-inicial" element={<NotificacionInicial />} />
            <Route path="asignar-equipo/:id" element={<AsignacionERR />} />
            <Route path="anexo-logistica/:id" element={<AnexoIII_Logistica />} />
            <Route path="dictamen/:id" element={<DictamenCausalidad />} />
            <Route path="trabajo-campo" element={<TrabajoCampo />} />
            <Route path="bandeja-comite" element={<BandejaComite />} />
            <Route path="administracion" element={<ModuloAdministracion />} />
            <Route path="caso/:id/expediente" element={<ExpedienteDigital />} />
          </Route>
        </Route>
      </Routes>
    </HashRouter>
  );
}