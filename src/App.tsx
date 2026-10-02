import { Route, Routes } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/layout/Layout";
import { AuthProvider } from "./modules/auth/AuthContext";
import LoginPage from "./modules/auth/LoginPage";
import RegistroPage from "./modules/auth/RegistroPage";
import RequireAuth from "./modules/auth/RequireAuth";
import InicioPage from "./modules/inicio/InicioPage";
import AreaMenuPage from "./modules/inicio/AreaMenuPage";
import InicioDisenoDetallePage from "./modules/inicio/InicioDisenoDetallePage";
import InicioDisenoItemPage from "./modules/inicio/InicioDisenoItemPage";
import EquipoPage from "./modules/inicio/EquipoPage";
import EquipoEtapasPage from "./modules/inicio/EquipoEtapasPage";
import EquipoPersonaPage from "./modules/inicio/EquipoPersonaPage";
import InicioLiderPage from "./modules/inicio/InicioLiderPage";
import GerenciaPage from "./modules/gerencia/GerenciaPage";
import PedirGerenciaPage from "./modules/gerencia/PedirGerenciaPage";
import PreventivoPage from "./modules/preventivo/PreventivoPage";
import AprobacionPmPage from "./modules/preventivo/AprobacionPmPage";
import CronogramaPage from "./modules/cronograma/CronogramaPage";
import CorrectivoPage from "./modules/correctivo/CorrectivoPage";
import SolicitudesPage from "./modules/solicitudes/SolicitudesPage";
import SolicitudesAreaPage from "./modules/solicitudes/SolicitudesAreaPage";
import HojasPage from "./modules/hojas/HojasPage";
import HojaDetallePage from "./modules/hojas/HojaDetallePage";
import ComputadoresPage from "./modules/computadores/ComputadoresPage";
import ComputadorDetallePage from "./modules/computadores/ComputadorDetallePage";
import IndicadoresPage from "./modules/indicadores/IndicadoresPage";
import FormatosPage from "./modules/formatos/FormatosPage";
import Gcre001Page from "./modules/formatos/Gcre001Page";
import Gcre009Page from "./modules/formatos/Gcre009Page";
import Gcre027Page from "./modules/formatos/Gcre027Page";
import Ghre030Page from "./modules/formatos/Ghre030Page";
import Mtre045Page from "./modules/formatos/Mtre045Page";
import FormatosTejidosPage from "./modules/tejidos/FormatosTejidosPage";
import ReporteProduccionPage from "./modules/tejidos/ReporteProduccionPage";
import PersonalPage from "./modules/personal/PersonalPage";
import UsuariosPage from "./modules/auth/UsuariosPage";
import MatrizPage from "./modules/matriz/MatrizPage";
import PermisosPage from "./modules/permisos/PermisosPage";
import HorarioLaboralPage from "./modules/permisos/HorarioLaboralPage";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegistroPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route index element={<InicioPage />} />
            <Route path="diseno/areas/:areaNombre" element={<AreaMenuPage />} />
            <Route path="diseno/:pasoId/item/:itemId" element={<InicioDisenoItemPage />} />
            <Route path="diseno/:pasoId" element={<InicioDisenoDetallePage />} />
            <Route path="equipo" element={<EquipoPage />} />
            <Route path="equipo/usuario/:usuarioId" element={<EquipoEtapasPage />} />
            <Route path="equipo/:personaId" element={<EquipoPersonaPage />} />
            <Route path="tablero" element={<InicioLiderPage />} />
            <Route path="preventivo/aprobaciones/imprimir" element={<Mtre045Page />} />
            <Route path="gerencia" element={<GerenciaPage />} />
            <Route path="gerencia/pedir" element={<PedirGerenciaPage />} />
            <Route path="preventivo" element={<PreventivoPage />} />
            <Route path="preventivo/aprobaciones" element={<AprobacionPmPage />} />
            <Route path="preventivo/cronograma" element={<CronogramaPage />} />
            <Route path="correctivo" element={<CorrectivoPage />} />
            <Route path="solicitudes" element={<SolicitudesPage />} />
            <Route path="solicitudes/area/:area" element={<SolicitudesAreaPage />} />
            <Route path="hojas-de-vida" element={<HojasPage />} />
            <Route path="hojas-de-vida/:id" element={<HojaDetallePage />} />
            <Route path="computadores" element={<ComputadoresPage />} />
            <Route path="computadores/:id" element={<ComputadorDetallePage />} />
            <Route path="indicadores" element={<IndicadoresPage />} />
            <Route path="formatos" element={<FormatosPage />} />
            <Route path="tejidos/formatos" element={<FormatosTejidosPage />} />
            <Route path="tejidos/formatos/reporte-produccion" element={<ReporteProduccionPage />} />
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
    </ErrorBoundary>
  );
}

export default App;
