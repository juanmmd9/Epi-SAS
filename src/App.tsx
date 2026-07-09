import { Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { AuthProvider } from "./modules/auth/AuthContext";
import LoginPage from "./modules/auth/LoginPage";
import RequireAuth from "./modules/auth/RequireAuth";
import InicioPage from "./modules/inicio/InicioPage";
import PreventivoPage from "./modules/preventivo/PreventivoPage";
import CronogramaPage from "./modules/cronograma/CronogramaPage";
import CorrectivoPage from "./modules/correctivo/CorrectivoPage";
import SolicitudesPage from "./modules/solicitudes/SolicitudesPage";
import SolicitudesAreaPage from "./modules/solicitudes/SolicitudesAreaPage";
import HojasPage from "./modules/hojas/HojasPage";
import HojaDetallePage from "./modules/hojas/HojaDetallePage";
import IndicadoresPage from "./modules/indicadores/IndicadoresPage";
import FormatosPage from "./modules/formatos/FormatosPage";
import Gcre001Page from "./modules/formatos/Gcre001Page";
import Gcre009Page from "./modules/formatos/Gcre009Page";
import Gcre027Page from "./modules/formatos/Gcre027Page";
import Ghre030Page from "./modules/formatos/Ghre030Page";
import Mtre045Page from "./modules/formatos/Mtre045Page";
import PersonalPage from "./modules/personal/PersonalPage";
import UsuariosPage from "./modules/auth/UsuariosPage";
import MatrizPage from "./modules/matriz/MatrizPage";
import PermisosPage from "./modules/permisos/PermisosPage";
import HorarioLaboralPage from "./modules/permisos/HorarioLaboralPage";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route index element={<InicioPage />} />
            <Route path="preventivo" element={<PreventivoPage />} />
            <Route path="preventivo/cronograma" element={<CronogramaPage />} />
            <Route path="correctivo" element={<CorrectivoPage />} />
            <Route path="solicitudes" element={<SolicitudesPage />} />
            <Route path="solicitudes/area/:area" element={<SolicitudesAreaPage />} />
            <Route path="hojas-de-vida" element={<HojasPage />} />
            <Route path="hojas-de-vida/:id" element={<HojaDetallePage />} />
            <Route path="indicadores" element={<IndicadoresPage />} />
            <Route path="formatos" element={<FormatosPage />} />
            <Route path="formatos/gc-re-001" element={<Gcre001Page />} />
            <Route path="formatos/gc-re-009" element={<Gcre009Page />} />
            <Route path="formatos/gc-re-027" element={<Gcre027Page />} />
            <Route path="formatos/gh-re-030" element={<Ghre030Page />} />
            <Route path="formatos/mt-re-045" element={<Mtre045Page />} />
            <Route path="personal" element={<PersonalPage />} />
            <Route path="personal/usuarios" element={<UsuariosPage />} />
            <Route path="personal/matriz" element={<MatrizPage />} />
            <Route path="personal/permisos" element={<PermisosPage />} />
            <Route path="personal/horario" element={<HorarioLaboralPage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
