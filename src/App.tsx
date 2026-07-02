import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './features/cases/Dashboard';
import FormularioApertura from './features/forms/Fase1_Apertura/FormularioApertura';
import CaseDetail from './features/cases/CaseDetail';
import MatrizRiesgo from './features/forms/Fase2_Riesgo/MatrizRiesgo';
import AnexoVII_Clinico from './features/forms/Fase4_Investigacion/AnexoVII_Clinico';

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
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;