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
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="nuevo-caso" element={<FormularioApertura />} />
          <Route path="caso/:id" element={<CaseDetail />} />
          <Route path="matriz-riesgo" element={<MatrizRiesgo />} />
          
          {/* AQUÍ DEBE ESTAR LA RUTA DEL ANEXO CLÍNICO */}
          <Route path="anexo-clinico" element={<AnexoVII_Clinico />} />
          <Route path="anexo-puesto" element={<AnexoV_PuestoVacuna />} />
          <Route path="anexo-domicilio" element={<AnexoVI_Domicilio />} />
          <Route path="comite-causalidad" element={<DictamenCausalidad />} />
          <Route path="notificacion-inicial" element={<NotificacionInicial />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;