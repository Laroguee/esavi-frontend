import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import CierreYDictamen from './features/comittee/CierreYDictamen';
import Login from './features/auth/Login';
import ProtectedRoute from './components/layout/ProtectedRoute';
import TrabajoCampo from './features/cases/TrabajoCampo';
import BandejaComite from './features/comittee/BandejaComite';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* RUTA PÚBLICA */}
        <Route path="/login" element={<Login />} />

        {/* RUTAS PROTEGIDAS */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="nuevo-caso" element={<FormularioApertura />} />
            <Route path="caso/:id" element={<CaseDetail />} />
            <Route path="matriz-riesgo" element={<MatrizRiesgo />} />
            <Route path="anexo-clinico" element={<AnexoVII_Clinico />} />
            <Route path="anexo-puesto" element={<AnexoV_PuestoVacuna />} />
            <Route path="anexo-domicilio" element={<AnexoVI_Domicilio />} />
            <Route path="comite-causalidad" element={<DictamenCausalidad />} />
            <Route path="notificacion-inicial" element={<NotificacionInicial />} />
            <Route path="asignar-equipo/:id" element={<AsignacionERR />} />
            <Route path="anexo-logistica/:id" element={<AnexoIII_Logistica />} />
            <Route path="dictamen/:id" element={<CierreYDictamen />} />
            <Route path="trabajo-campo" element={<TrabajoCampo />} />
            <Route path="bandeja-comite" element={<BandejaComite />} />
          </Route>
        </Route> {/* <-- Esta es la etiqueta de cierre que faltaba */}
      </Routes>
    </BrowserRouter>
  );
}