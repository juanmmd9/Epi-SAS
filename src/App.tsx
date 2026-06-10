import { Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import InicioPage from "./modules/inicio/InicioPage";
import PreventivoPage from "./modules/preventivo/PreventivoPage";
import CronogramaPage from "./modules/cronograma/CronogramaPage";
import CorrectivoPage from "./modules/correctivo/CorrectivoPage";
import HojasPage from "./modules/hojas/HojasPage";
import IndicadoresPage from "./modules/indicadores/IndicadoresPage";
import FormatosPage from "./modules/formatos/FormatosPage";
import Gcre009Page from "./modules/formatos/Gcre009Page";
import PersonalPage from "./modules/personal/PersonalPage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<InicioPage />} />
        <Route path="preventivo" element={<PreventivoPage />} />
        <Route path="preventivo/cronograma" element={<CronogramaPage />} />
        <Route path="correctivo" element={<CorrectivoPage />} />
        <Route path="hojas-de-vida" element={<HojasPage />} />
        <Route path="indicadores" element={<IndicadoresPage />} />
        <Route path="formatos" element={<FormatosPage />} />
        <Route path="formatos/gc-re-009" element={<Gcre009Page />} />
        <Route path="personal" element={<PersonalPage />} />
      </Route>
    </Routes>
  );
}

export default App;
