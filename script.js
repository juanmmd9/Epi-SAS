const botonesMenu = document.querySelectorAll(".menu-item[data-vista]");
const overlay = document.getElementById("overlay");
let modales = document.querySelectorAll(".modal");
const botonesCerrar = document.querySelectorAll("[data-close='true']");
const formPreventivo = document.getElementById("formPreventivo");
const areaPreventivo = document.getElementById("areaPreventivo");
const equipoPreventivo = document.getElementById("equipoPreventivo");
const listaPreventivo = document.getElementById("listaPreventivo");
const estadoPreventivo = document.getElementById("estadoPreventivo");
const exportarPreventivoBtn = document.getElementById("exportarPreventivoBtn");
const importarPreventivoBtn = document.getElementById("importarPreventivoBtn");
const archivoImportarPreventivo = document.getElementById(
  "archivoImportarPreventivo"
);
const filtroAreaPreventivo = document.getElementById("filtroAreaPreventivo");
const resumenPreventivoAreas = document.getElementById("resumenPreventivoAreas");
const filtroFechaPreventivo = document.getElementById("filtroFechaPreventivo");
const detalleArea = document.getElementById("detalleArea");
const detalleEquipo = document.getElementById("detalleEquipo");
const detalleFecha = document.getElementById("detalleFecha");
const detalleDescripcionPreventivo = document.getElementById("detalleDescripcionPreventivo");
const detalleArchivoPreventivo = document.getElementById("detalleArchivoPreventivo");
const eliminarRegistroBtn = document.getElementById("eliminarRegistroBtn");
const editarRegistroBtn = document.getElementById("editarRegistroBtn");
const guardarPreventivoBtn = document.getElementById("guardarPreventivoBtn");
const cancelarEdicionPreventivoBtn = document.getElementById("cancelarEdicionPreventivoBtn");
const archivoPreventivoNota = document.getElementById("archivoPreventivoNota");
const descripcionPreventivo = document.getElementById("descripcionPreventivo");
const formHojas = document.getElementById("formHojas");
const estadoHojas = document.getElementById("estadoHojas");
const filtroAreaHojas = document.getElementById("filtroAreaHojas");
const resumenHojasAreas = document.getElementById("resumenHojasAreas");
const filtroTextoHojas = document.getElementById("filtroTextoHojas");
const listaHojas = document.getElementById("listaHojas");
const detalleHojaArea = document.getElementById("detalleHojaArea");
const detalleHojaNombre = document.getElementById("detalleHojaNombre");
const detalleHojaCodigo = document.getElementById("detalleHojaCodigo");
const detalleHojaMarca = document.getElementById("detalleHojaMarca");
const detalleHojaModelo = document.getElementById("detalleHojaModelo");
const detalleHojaSerial = document.getElementById("detalleHojaSerial");
const detalleHojaUbicacion = document.getElementById("detalleHojaUbicacion");
const detalleHojaFrecuencia = document.getElementById("detalleHojaFrecuencia");
const detalleHojaPrimerPreventivo = document.getElementById(
  "detalleHojaPrimerPreventivo"
);
const detalleHojaFoto = document.getElementById("detalleHojaFoto");
const tablaHistorialPreventivo = document.getElementById("tablaHistorialPreventivo");
const tablaHistorialCorrectivo = document.getElementById("tablaHistorialCorrectivo");
const eliminarHojaBtn = document.getElementById("eliminarHojaBtn");
const editarHojaBtn = document.getElementById("editarHojaBtn");
const formEditarHoja = document.getElementById("formEditarHoja");
const estadoEditarHoja = document.getElementById("estadoEditarHoja");
const editFotoActualTexto = document.getElementById("editFotoActualTexto");
const cronogramaArea = document.getElementById("cronogramaArea");
const cronogramaAnio = document.getElementById("cronogramaAnio");
const estadoCronograma = document.getElementById("estadoCronograma");
const leyendaCronograma = document.getElementById("leyendaCronograma");
const calendarioCronograma = document.getElementById("calendarioCronograma");
const resumenProgramacionAnual = document.getElementById("resumenProgramacionAnual");
const imprimirCronogramaBtn = document.getElementById("imprimirCronogramaBtn");
const formImpresionCronograma = document.getElementById("formImpresionCronograma");
const impresionArea = document.getElementById("impresionArea");
const impresionAnio = document.getElementById("impresionAnio");
const impresionMes = document.getElementById("impresionMes");
const estadoImpresionCronograma = document.getElementById("estadoImpresionCronograma");
const resultadoListaMensual = document.getElementById("resultadoListaMensual");
const limpiarListaMensualBtn = document.getElementById("limpiarListaMensualBtn");
const enviarCorreoCronogramaBtn = document.getElementById("enviarCorreoCronogramaBtn");
const emailjsDestinoCronograma = document.getElementById("emailjsDestinoCronograma");
const emailjsPublicKeyCronograma = document.getElementById("emailjsPublicKeyCronograma");
const emailjsServiceIdCronograma = document.getElementById("emailjsServiceIdCronograma");
const emailjsTemplateIdCronograma = document.getElementById("emailjsTemplateIdCronograma");
const tituloDiaCronograma = document.getElementById("tituloDiaCronograma");
const resumenDiaCronograma = document.getElementById("resumenDiaCronograma");
const listaDiaCronograma = document.getElementById("listaDiaCronograma");
const agregarMaquinaDiaCronograma = document.getElementById("agregarMaquinaDiaCronograma");
const agregarMaquinaDiaBtn = document.getElementById("agregarMaquinaDiaBtn");
const estadoDiaCronograma = document.getElementById("estadoDiaCronograma");
const detalleHojaEstado = document.getElementById("detalleHojaEstado");
const detalleHojaFechaBaja = document.getElementById("detalleHojaFechaBaja");
const detalleHojaMotivoBaja = document.getElementById("detalleHojaMotivoBaja");
const filaDetalleHojaBaja = document.getElementById("filaDetalleHojaBaja");
const filaDetalleHojaMotivoBaja = document.getElementById("filaDetalleHojaMotivoBaja");
const panelBajaHoja = document.getElementById("panelBajaHoja");
const fechaBajaHoja = document.getElementById("fechaBajaHoja");
const motivoBajaHoja = document.getElementById("motivoBajaHoja");
const darBajaHojaBtn = document.getElementById("darBajaHojaBtn");
const reactivarHojaBtn = document.getElementById("reactivarHojaBtn");
const formCorrectivo = document.getElementById("formCorrectivo");
const estadoCorrectivo = document.getElementById("estadoCorrectivo");
const corrNumeroSolicitud = document.getElementById("corrNumeroSolicitud");
const corrFechaSolicitud = document.getElementById("corrFechaSolicitud");
const corrHoraSolicitud = document.getElementById("corrHoraSolicitud");
const corrHoraRespuesta = document.getElementById("corrHoraRespuesta");
const corrTiempoRespuesta = document.getElementById("corrTiempoRespuesta");
const corrMaquinaSelect = document.getElementById("corrMaquinaSelect");
const corrProceso = document.getElementById("corrProceso");
const corrMaquinaEquipo = document.getElementById("corrMaquinaEquipo");
const corrCodigoMaquina = document.getElementById("corrCodigoMaquina");
const tablaCorrectivoContenedor = document.getElementById("tablaCorrectivoContenedor");
const filtroAreaCorrectivo = document.getElementById("filtroAreaCorrectivo");
const resumenCorrectivoAreas = document.getElementById("resumenCorrectivoAreas");
const filtroTextoCorrectivo = document.getElementById("filtroTextoCorrectivo");
const exportarCorrectivoCsvBtn = document.getElementById("exportarCorrectivoCsvBtn");
const guardarCorrectivoBtn = document.getElementById("guardarCorrectivoBtn");
const cancelarEdicionCorrectivoBtn = document.getElementById("cancelarEdicionCorrectivoBtn");

const CLAVE_PREVENTIVO = "mantenimiento_preventivo_registros_v1";
const CLAVE_HOJAS = "mantenimiento_hojas_vida_v1";
const CLAVE_CORRECTIVO = "mantenimiento_correctivo_registros_v1";

const MAPA_MODAL_A_VISTA = {
  "modal-preventivo": "vista-preventivo",
  "modal-preventivo-registro": "vista-preventivo-registro",
  "modal-cronograma-preventivo": "vista-cronograma",
  "modal-correctivo": "vista-correctivo",
  "modal-hojas": "vista-hojas",
  "modal-indicadores": "vista-indicadores",
  "modal-personal": "vista-personal",
};

const VISTA_A_MENU = {
  "vista-preventivo-registro": "vista-preventivo",
  "vista-cronograma": "vista-preventivo",
};

const MODULOS_EN_MAIN = [
  "modal-preventivo",
  "modal-preventivo-registro",
  "modal-cronograma-preventivo",
  "modal-correctivo",
  "modal-hojas",
  "modal-indicadores",
  "modal-personal",
];

let vistaActual = "vista-inicio";
const CLAVE_CRONOGRAMA = "mantenimiento_cronograma_preventivo_v1";
const CLAVE_EXCEPCIONES = "mantenimiento_cronograma_excepciones_v1";
const CLAVE_EMAILJS_PUBLIC = "epi_emailjs_public_key_v1";
const CLAVE_EMAILJS_SERVICE = "epi_emailjs_service_id_v1";
const CLAVE_EMAILJS_TEMPLATE = "epi_emailjs_template_id_v1";
const CLAVE_EMAILJS_DESTINO = "epi_emailjs_destino_v1";
const EXTENSIONES_ARCHIVO_PREVENTIVO = [".pdf", ".doc", ".docx"];
const MAX_ARCHIVO_PREVENTIVO_BYTES = 5 * 1024 * 1024;
const AREAS_PANEL_INICIO = ["Laboratorio", "Confeccion", "Tejidos", "Plasticos"];
const AREAS_SISTEMA = [
  "Laboratorio",
  "Confeccion",
  "Tejidos",
  "Plasticos",
  "Locativos",
];
const NOMBRES_MESES_LARGOS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const inicioCronogramaAnio = document.getElementById("inicioCronogramaAnio");
const resumenGlobalInicio = document.getElementById("resumenGlobalInicio");
const gridVentanasCronograma = document.getElementById("gridVentanasCronograma");
let registrosPreventivo = [];
let registroSeleccionadoId = null;
let registrosHojas = [];
let hojaSeleccionadaId = null;
let registrosCorrectivo = [];
let cronogramaPreventivo = [];
let excepcionesCronograma = [];
let diaCronogramaContexto = null;
let correctivoEditandoId = null;
let preventivoEditandoId = null;

const COLUMNAS_TABLA_CORRECTIVO = [
  { clave: "numeroSolicitud", titulo: "# Solicitud" },
  { clave: "fechaSolicitud", titulo: "Fecha solicitud" },
  { clave: "horaSolicitud", titulo: "Hora solicitud" },
  { clave: "nombreSolicitante", titulo: "Nombre solicitante" },
  { clave: "horaRespuesta", titulo: "Hora respuesta" },
  { clave: "tiempoRespuesta", titulo: "Tiempo respuesta" },
  { clave: "horaInicioSolicitud", titulo: "Hora inicio" },
  { clave: "horaFinSolicitud", titulo: "Hora fin" },
  { clave: "proceso", titulo: "Area" },
  { clave: "maquinaEquipoLocacion", titulo: "Maquina-equipo-locacion" },
  { clave: "codigoMaquina", titulo: "Codigo maquina" },
  { clave: "estadoMaquina", titulo: "Estado maquina" },
  { clave: "tiposSolicitud", titulo: "Tipo solicitud" },
  { clave: "descripcionSolicitud", titulo: "Descripcion" },
  { clave: "solucionSolicitud", titulo: "Solucion" },
  { clave: "fechaCierre", titulo: "Fecha cierre" },
  { clave: "horaCierre", titulo: "Hora cierre" },
  { clave: "quienRevisa", titulo: "Quien revisa" },
];

function configurarCorreccionOrtografica() {
  const camposTexto = document.querySelectorAll("input[type='text'], textarea");
  camposTexto.forEach((campo) => {
    campo.setAttribute("lang", "es");
    campo.setAttribute("spellcheck", "true");
    campo.setAttribute("autocapitalize", "sentences");
    campo.setAttribute("autocomplete", "on");
  });
}

function configurarVistasPrincipales() {
  const main = document.querySelector(".contenido");
  if (!main) return;

  MODULOS_EN_MAIN.forEach((modalId) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const vistaId = MAPA_MODAL_A_VISTA[modalId];
    modal.id = vistaId;
    modal.classList.remove("modal");
    modal.classList.add("vista-principal");

    const contenido = modal.querySelector(".modal-contenido");
    if (contenido) {
      contenido.classList.remove("modal-contenido");
      contenido.classList.add("vista-contenido");
      contenido.querySelector(".cerrar")?.remove();
    }

    modal.querySelectorAll("[data-open-modal]").forEach((boton) => {
      const destinoModal = boton.getAttribute("data-open-modal");
      const destinoVista =
        MAPA_MODAL_A_VISTA[destinoModal] ||
        destinoModal.replace(/^modal-/, "vista-");
      boton.setAttribute("data-open-vista", destinoVista);
      boton.removeAttribute("data-open-modal");
    });

    main.appendChild(modal);
  });

  modales = document.querySelectorAll(".modal");
}

function marcarMenuActivo(idVista) {
  const menuVista = VISTA_A_MENU[idVista] || idVista;
  botonesMenu.forEach((boton) => {
    boton.classList.toggle("activo", boton.dataset.vista === menuVista);
  });
}

function cerrarModales() {
  overlay.classList.remove("activo");
  modales.forEach((modal) => modal.classList.remove("activo"));
}

function cerrarTodo() {
  cerrarModales();
}

function inicializarVista(idVista) {
  if (idVista === "vista-correctivo") {
    prepararFormularioCorrectivo();
    renderTablaCorrectivo();
  }
  if (idVista === "vista-preventivo-registro") {
    prepararFormularioPreventivo();
  }
  if (idVista === "vista-cronograma") {
    renderCronogramaPreventivo();
  }
  if (idVista === "vista-hojas") {
    renderRegistrosHojas();
  }
  if (idVista === "vista-indicadores" && typeof initModuloIndicadores === "function") {
    initModuloIndicadores();
  }
}

function mostrarVista(idVista) {
  const vista = document.getElementById(idVista);
  if (!vista) return;

  document.querySelectorAll(".vista-principal").forEach((item) => {
    item.classList.remove("activa");
  });
  vista.classList.add("activa");
  vistaActual = idVista;
  cerrarModales();
  marcarMenuActivo(idVista);
  inicializarVista(idVista);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function abrirModal(idModal) {
  const modal = document.getElementById(idModal);
  if (!modal) return;
  modales.forEach((item) => item.classList.remove("activo"));
  overlay.classList.add("activo");
  modal.classList.add("activo");
}

function cargarRegistrosPreventivo() {
  try {
    const guardados = localStorage.getItem(CLAVE_PREVENTIVO);
    registrosPreventivo = guardados ? JSON.parse(guardados) : [];
    registrosPreventivo = registrosPreventivo.map((registro) =>
      normalizarRegistroPreventivo(registro)
    );
  } catch (error) {
    registrosPreventivo = [];
    estadoPreventivo.textContent = "No fue posible leer datos guardados.";
  }
}

function guardarRegistrosPreventivo() {
  localStorage.setItem(CLAVE_PREVENTIVO, JSON.stringify(registrosPreventivo));
}

function cargarRegistrosHojas() {
  try {
    const guardados = localStorage.getItem(CLAVE_HOJAS);
    registrosHojas = guardados ? JSON.parse(guardados) : [];
    registrosHojas = registrosHojas.map((registro) => normalizarMaquinaHoja(registro));
  } catch (error) {
    registrosHojas = [];
    estadoHojas.textContent = "No fue posible leer hojas de vida guardadas.";
  }
}

function guardarRegistrosHojas() {
  localStorage.setItem(CLAVE_HOJAS, JSON.stringify(registrosHojas));
}

function cargarRegistrosCorrectivo() {
  try {
    const guardados = localStorage.getItem(CLAVE_CORRECTIVO);
    registrosCorrectivo = guardados ? JSON.parse(guardados) : [];
    registrosCorrectivo = registrosCorrectivo.map((registro) =>
      normalizarRegistroCorrectivo(registro)
    );
  } catch (error) {
    registrosCorrectivo = [];
  }
}

function normalizarRegistroCorrectivo(registro) {
  const tipos = Array.isArray(registro.tiposSolicitud)
    ? registro.tiposSolicitud
    : registro.tipoSolicitud
      ? [registro.tipoSolicitud]
      : [];
  return {
    id: registro.id || Date.now().toString(),
    numeroSolicitud: Number.parseInt(registro.numeroSolicitud, 10) || 0,
    fechaSolicitud: registro.fechaSolicitud || registro.fecha || "",
    horaSolicitud: registro.horaSolicitud || "",
    nombreSolicitante: registro.nombreSolicitante || "",
    horaRespuesta: registro.horaRespuesta || "",
    tiempoRespuesta:
      registro.tiempoRespuesta ||
      calcularTiempoRespuesta(registro.horaSolicitud, registro.horaRespuesta),
    horaInicioSolicitud: registro.horaInicioSolicitud || "",
    horaFinSolicitud: registro.horaFinSolicitud || "",
    maquinaEquipoLocacion:
      registro.maquinaEquipoLocacion || registro.equipo || registro.falla || "",
    codigoMaquina: registro.codigoMaquina || "",
    maquinaId: registro.maquinaId || "",
    estadoMaquina: registro.estadoMaquina || "",
    tiposSolicitud: tipos,
    descripcionSolicitud:
      registro.descripcionSolicitud || registro.actividad || registro.falla || "",
    solucionSolicitud: registro.solucionSolicitud || "",
    fechaCierre: registro.fechaCierre || "",
    horaCierre: registro.horaCierre || "",
    quienRevisa: registro.quienRevisa || "",
    creadoEn: registro.creadoEn || new Date().toISOString(),
    area: (registro.area || registro.proceso || "").trim(),
    proceso: (registro.proceso || registro.area || "").trim(),
  };
}

function obtenerAreaRegistroCorrectivo(registro) {
  return (registro?.area || registro?.proceso || "").trim();
}

function contarCorrectivoPorArea(lista = registrosCorrectivo) {
  const conteo = Object.fromEntries(AREAS_SISTEMA.map((area) => [area, 0]));
  conteo["Sin area"] = 0;
  lista.forEach((registro) => {
    const area = obtenerAreaRegistroCorrectivo(registro);
    if (AREAS_SISTEMA.includes(area)) {
      conteo[area] += 1;
    } else {
      conteo["Sin area"] += 1;
    }
  });
  return conteo;
}

function filtrarRegistrosCorrectivo(lista = registrosCorrectivo) {
  const textoFiltro = filtroTextoCorrectivo?.value.trim().toLowerCase() || "";
  const areaFiltro = filtroAreaCorrectivo?.value || "";

  return lista
    .filter((registro) => {
      const area = obtenerAreaRegistroCorrectivo(registro);
      if (areaFiltro === "__sin_area__") {
        if (area && AREAS_SISTEMA.includes(area)) return false;
      } else if (areaFiltro && area !== areaFiltro) {
        return false;
      }

      if (!textoFiltro) return true;
      const base = [
        registro.numeroSolicitud,
        registro.nombreSolicitante,
        registro.maquinaEquipoLocacion,
        registro.codigoMaquina,
        area,
        registro.descripcionSolicitud,
        (registro.tiposSolicitud || []).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return base.includes(textoFiltro);
    })
    .sort((a, b) => (b.numeroSolicitud || 0) - (a.numeroSolicitud || 0));
}

function minutosDesdeMedianoche(horaTexto) {
  if (!horaTexto) return null;
  const partes = horaTexto.split(":");
  const horas = Number.parseInt(partes[0], 10);
  const minutos = Number.parseInt(partes[1], 10);
  if (Number.isNaN(horas) || Number.isNaN(minutos)) return null;
  return horas * 60 + minutos;
}

function calcularTiempoRespuesta(horaInicio, horaFin) {
  const inicio = minutosDesdeMedianoche(horaInicio);
  const fin = minutosDesdeMedianoche(horaFin);
  if (inicio === null || fin === null) return "";
  let diferencia = fin - inicio;
  if (diferencia < 0) diferencia += 24 * 60;
  const horas = Math.floor(diferencia / 60);
  const mins = diferencia % 60;
  if (horas === 0) return `${mins} min`;
  return `${horas} h ${mins} min`;
}

function obtenerSiguienteNumeroSolicitud() {
  if (registrosCorrectivo.length === 0) return 1;
  const maximo = Math.max(
    ...registrosCorrectivo.map((item) => Number.parseInt(item.numeroSolicitud, 10) || 0)
  );
  return maximo + 1;
}

function actualizarTiempoRespuestaFormulario() {
  if (!corrTiempoRespuesta) return;
  corrTiempoRespuesta.value = calcularTiempoRespuesta(
    corrHoraSolicitud?.value,
    corrHoraRespuesta?.value
  );
}

function actualizarOpcionesMaquinasCorrectivo() {
  if (!corrMaquinaSelect) return;
  corrMaquinaSelect.innerHTML =
    "<option value=''>Seleccion manual abajo</option>";
  registrosHojas
    .filter((item) => item.activa !== false)
    .forEach((maquina) => {
      const opcion = document.createElement("option");
      opcion.value = maquina.id;
      opcion.textContent = `${maquina.nombre} (${maquina.codigo}) - ${maquina.area}`;
      corrMaquinaSelect.appendChild(opcion);
    });
}

function prepararFormularioCorrectivo() {
  if (!formCorrectivo) return;
  correctivoEditandoId = null;
  formCorrectivo.reset();
  const hoy = new Date();
  const fechaHoy = hoy.toISOString().slice(0, 10);
  const horaActual = hoy.toTimeString().slice(0, 5);
  if (corrFechaSolicitud) corrFechaSolicitud.value = fechaHoy;
  if (corrHoraSolicitud) corrHoraSolicitud.value = horaActual;
  if (corrNumeroSolicitud) {
    corrNumeroSolicitud.value = String(obtenerSiguienteNumeroSolicitud());
  }
  const checkCorrectivo = formCorrectivo.querySelector(
    "input[name='tipoSolicitud'][value='CORRECTIVO']"
  );
  if (checkCorrectivo instanceof HTMLInputElement) {
    checkCorrectivo.checked = true;
  }
  actualizarTiempoRespuestaFormulario();
  actualizarOpcionesMaquinasCorrectivo();
  if (guardarCorrectivoBtn) guardarCorrectivoBtn.textContent = "Guardar solicitud";
  if (cancelarEdicionCorrectivoBtn) cancelarEdicionCorrectivoBtn.hidden = true;
  if (estadoCorrectivo) estadoCorrectivo.textContent = "";
}

function actualizarModoEdicionCorrectivo(enEdicion) {
  if (guardarCorrectivoBtn) {
    guardarCorrectivoBtn.textContent = enEdicion
      ? "Guardar cambios"
      : "Guardar solicitud";
  }
  if (cancelarEdicionCorrectivoBtn) {
    cancelarEdicionCorrectivoBtn.hidden = !enEdicion;
  }
}

function llenarFormularioCorrectivo(registro) {
  if (!formCorrectivo || !registro) return;
  correctivoEditandoId = registro.id;
  corrNumeroSolicitud.value = String(registro.numeroSolicitud || "");
  corrFechaSolicitud.value = registro.fechaSolicitud || "";
  corrHoraSolicitud.value = registro.horaSolicitud || "";
  document.getElementById("corrNombreSolicitante").value =
    registro.nombreSolicitante || "";
  corrHoraRespuesta.value = registro.horaRespuesta || "";
  corrTiempoRespuesta.value = registro.tiempoRespuesta || "";
  document.getElementById("corrHoraInicio").value = registro.horaInicioSolicitud || "";
  document.getElementById("corrHoraFin").value = registro.horaFinSolicitud || "";
  corrProceso.value = registro.proceso || "";
  corrMaquinaEquipo.value = registro.maquinaEquipoLocacion || "";
  corrCodigoMaquina.value = registro.codigoMaquina || "";
  document.getElementById("corrEstadoMaquina").value = registro.estadoMaquina || "";
  document.getElementById("corrDescripcion").value = registro.descripcionSolicitud || "";
  document.getElementById("corrSolucion").value = registro.solucionSolicitud || "";
  document.getElementById("corrFechaCierre").value = registro.fechaCierre || "";
  document.getElementById("corrHoraCierre").value = registro.horaCierre || "";
  document.getElementById("corrQuienRevisa").value = registro.quienRevisa || "";
  actualizarOpcionesMaquinasCorrectivo();
  corrMaquinaSelect.value = registro.maquinaId || "";
  formCorrectivo.querySelectorAll("input[name='tipoSolicitud']").forEach((input) => {
    if (!(input instanceof HTMLInputElement)) return;
    input.checked = (registro.tiposSolicitud || []).includes(input.value);
  });
  actualizarModoEdicionCorrectivo(true);
  if (estadoCorrectivo) {
    estadoCorrectivo.textContent = `Editando solicitud #${registro.numeroSolicitud}. Corrige y pulsa Guardar cambios.`;
  }
}

function prepararFormularioPreventivo() {
  if (!formPreventivo) return;
  preventivoEditandoId = null;
  formPreventivo.reset();
  if (guardarPreventivoBtn) guardarPreventivoBtn.textContent = "Guardar registro";
  if (cancelarEdicionPreventivoBtn) cancelarEdicionPreventivoBtn.hidden = true;
  if (archivoPreventivoNota) {
    archivoPreventivoNota.textContent =
      "Obligatorio al crear. PDF, DOC o DOCX (max. 5 MB). Escribe la actividad manualmente abajo.";
  }
  if (descripcionPreventivo) descripcionPreventivo.value = "";
  actualizarOpcionesEquiposPreventivo();
}

function llenarFormularioPreventivo(registro) {
  if (!formPreventivo || !registro) return;
  preventivoEditandoId = registro.id;
  areaPreventivo.value = registro.area || "";
  actualizarOpcionesEquiposPreventivo();
  equipoPreventivo.value = registro.maquinaId || "";
  document.getElementById("fechaPreventivo").value = registro.fecha || "";
  document.getElementById("archivoPreventivo").value = "";
  if (descripcionPreventivo) {
    descripcionPreventivo.value = registro.descripcion || registro.actividad || "";
  }
  if (guardarPreventivoBtn) guardarPreventivoBtn.textContent = "Guardar cambios";
  if (cancelarEdicionPreventivoBtn) cancelarEdicionPreventivoBtn.hidden = false;
  if (archivoPreventivoNota) {
    const nombre = registro.archivoNombre || "archivo actual";
    archivoPreventivoNota.textContent = `Editando: se conserva "${nombre}" si no eliges otro archivo.`;
  }
  if (estadoPreventivo) {
    estadoPreventivo.textContent = "Modo edicion: corrige los campos y guarda los cambios.";
  }
}

function eliminarPreventivoPorId(idRegistro) {
  if (!idRegistro) return;
  if (!confirm("Eliminar este registro preventivo?")) return;
  registrosPreventivo = registrosPreventivo.filter((item) => item.id !== idRegistro);
  if (registroSeleccionadoId === idRegistro) registroSeleccionadoId = null;
  if (preventivoEditandoId === idRegistro) prepararFormularioPreventivo();
  guardarRegistrosPreventivo();
  renderRegistrosPreventivo();
  estadoPreventivo.textContent = "Registro preventivo eliminado.";
}

function eliminarHojaPorId(idRegistro) {
  if (!idRegistro) return;
  if (!confirm("Eliminar esta maquina y sus datos vinculados en el sistema?")) return;
  cronogramaPreventivo = cronogramaPreventivo.filter(
    (item) => item.maquinaId !== idRegistro
  );
  excepcionesCronograma = excepcionesCronograma.filter(
    (item) => item.maquinaId !== idRegistro
  );
  registrosPreventivo = registrosPreventivo.filter(
    (item) => item.maquinaId !== idRegistro
  );
  registrosCorrectivo = registrosCorrectivo.filter(
    (item) => item.maquinaId !== idRegistro
  );
  registrosHojas = registrosHojas.filter((item) => item.id !== idRegistro);
  if (hojaSeleccionadaId === idRegistro) hojaSeleccionadaId = null;
  guardarRegistrosHojas();
  guardarRegistrosPreventivo();
  guardarRegistrosCorrectivo();
  guardarCronogramaPreventivo();
  guardarExcepcionesCronograma();
  renderRegistrosHojas();
  actualizarOpcionesEquiposPreventivo();
  actualizarOpcionesMaquinasCorrectivo();
  actualizarProgramacionEnPantalla();
  renderTablaCorrectivo();
  estadoHojas.textContent = "Maquina eliminada.";
}

function obtenerValorCeldaCorrectivo(registro, clave) {
  if (clave === "tiposSolicitud") {
    return (registro.tiposSolicitud || []).join(", ");
  }
  return registro[clave] || "-";
}

function construirHtmlTablaCorrectivo(registros) {
  if (registros.length === 0) {
    return "<p class='ventana-cronograma__vacio'>No hay solicitudes en esta area.</p>";
  }

  const encabezados = COLUMNAS_TABLA_CORRECTIVO.map(
    (col) => `<th>${escapeHtml(col.titulo)}</th>`
  ).join("");
  const filas = registros
    .map((registro) => {
      const celdas = COLUMNAS_TABLA_CORRECTIVO.map((col) => {
        const valor = obtenerValorCeldaCorrectivo(registro, col.clave);
        const claseExtra =
          col.clave === "descripcionSolicitud" || col.clave === "solucionSolicitud"
            ? "celda-texto-largo"
            : col.clave === "tiposSolicitud"
              ? "celda-tipos"
              : "";
        return `<td class="${claseExtra}">${escapeHtml(valor)}</td>`;
      }).join("");
      return `
        <tr data-id="${registro.id}">
          ${celdas}
          <td>
            <button type="button" class="btn-tabla-accion" data-editar-correctivo="${registro.id}">Editar</button>
            <button type="button" class="btn-tabla-accion btn-tabla-accion--eliminar" data-eliminar-correctivo="${registro.id}">Eliminar</button>
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <table class="tabla-excel-correctivo">
      <thead>
        <tr>${encabezados}<th>Acciones</th></tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
  `;
}

function vincularAccionesTablaCorrectivo(contenedor) {
  if (!contenedor) return;

  contenedor.querySelectorAll("[data-editar-correctivo]").forEach((boton) => {
    boton.addEventListener("click", () => {
      const registro = registrosCorrectivo.find(
        (item) => item.id === boton.getAttribute("data-editar-correctivo")
      );
      if (!registro) return;
      llenarFormularioCorrectivo(registro);
      formCorrectivo.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  contenedor.querySelectorAll("[data-eliminar-correctivo]").forEach((boton) => {
    boton.addEventListener("click", () => {
      const id = boton.getAttribute("data-eliminar-correctivo");
      if (!id) return;
      if (!confirm("Eliminar esta solicitud de mantenimiento correctivo?")) return;
      registrosCorrectivo = registrosCorrectivo.filter((item) => item.id !== id);
      guardarRegistrosCorrectivo();
      renderTablaCorrectivo();
      prepararFormularioCorrectivo();
      if (estadoCorrectivo) estadoCorrectivo.textContent = "Solicitud eliminada.";
    });
  });
}

function renderResumenCorrectivoPorArea(conteo) {
  if (!resumenCorrectivoAreas) return;

  const areaFiltro = filtroAreaCorrectivo?.value || "";
  const total = registrosCorrectivo.length;
  const tarjetas = [
    {
      clave: "",
      titulo: "Todas",
      cantidad: total,
    },
    ...AREAS_SISTEMA.map((area) => ({
      clave: area,
      titulo: area,
      cantidad: conteo[area] || 0,
    })),
  ];

  if ((conteo["Sin area"] || 0) > 0) {
    tarjetas.push({
      clave: "__sin_area__",
      titulo: "Sin area",
      cantidad: conteo["Sin area"] || 0,
    });
  }

  resumenCorrectivoAreas.innerHTML = tarjetas
    .map((tarjeta) => {
      const activa = tarjeta.clave === areaFiltro;
      return `
        <button
          type="button"
          class="tarjeta-correctivo-area${activa ? " activa" : ""}"
          data-area-correctivo="${tarjeta.clave}"
        >
          <span class="tarjeta-correctivo-area__titulo">${escapeHtml(tarjeta.titulo)}</span>
          <strong class="tarjeta-correctivo-area__total">${tarjeta.cantidad}</strong>
          <span class="tarjeta-correctivo-area__etiqueta">solicitudes</span>
        </button>
      `;
    })
    .join("");

  resumenCorrectivoAreas.querySelectorAll("[data-area-correctivo]").forEach((boton) => {
    boton.addEventListener("click", () => {
      if (!filtroAreaCorrectivo) return;
      filtroAreaCorrectivo.value = boton.getAttribute("data-area-correctivo") || "";
      renderTablaCorrectivo();
    });
  });
}

function renderTablaCorrectivo() {
  if (!tablaCorrectivoContenedor) return;

  const conteo = contarCorrectivoPorArea();
  renderResumenCorrectivoPorArea(conteo);

  const registrosFiltrados = filtrarRegistrosCorrectivo();
  const areaFiltro = filtroAreaCorrectivo?.value || "";

  if (registrosCorrectivo.length === 0) {
    tablaCorrectivoContenedor.innerHTML =
      "<p class='ventana-cronograma__vacio'>Aun no hay solicitudes correctivas registradas.</p>";
    return;
  }

  if (registrosFiltrados.length === 0) {
    tablaCorrectivoContenedor.innerHTML =
      "<p class='ventana-cronograma__vacio'>No hay solicitudes con los filtros actuales.</p>";
    return;
  }

  if (areaFiltro) {
    const tituloArea =
      areaFiltro === "__sin_area__" ? "Sin area" : areaFiltro;
    tablaCorrectivoContenedor.innerHTML = `
      <section class="bloque-correctivo-area">
        <header class="bloque-correctivo-area__encabezado">
          <h5>${escapeHtml(tituloArea)}</h5>
          <span>${registrosFiltrados.length} solicitud(es)</span>
        </header>
        ${construirHtmlTablaCorrectivo(registrosFiltrados)}
      </section>
    `;
    vincularAccionesTablaCorrectivo(tablaCorrectivoContenedor);
    return;
  }

  const grupos = Object.fromEntries(AREAS_SISTEMA.map((area) => [area, []]));
  grupos["Sin area"] = [];

  registrosFiltrados.forEach((registro) => {
    const area = obtenerAreaRegistroCorrectivo(registro);
    if (AREAS_SISTEMA.includes(area)) {
      grupos[area].push(registro);
    } else {
      grupos["Sin area"].push(registro);
    }
  });

  const bloques = [...AREAS_SISTEMA, "Sin area"]
    .filter((area) => grupos[area].length > 0)
    .map(
      (area) => `
        <section class="bloque-correctivo-area">
          <header class="bloque-correctivo-area__encabezado">
            <h5>${escapeHtml(area)}</h5>
            <span>${grupos[area].length} solicitud(es)</span>
          </header>
          ${construirHtmlTablaCorrectivo(grupos[area])}
        </section>
      `
    )
    .join("");

  tablaCorrectivoContenedor.innerHTML = bloques;
  vincularAccionesTablaCorrectivo(tablaCorrectivoContenedor);
}

function exportarCorrectivoCsv() {
  const registrosExportar = filtrarRegistrosCorrectivo();
  if (registrosExportar.length === 0) {
    if (estadoCorrectivo) estadoCorrectivo.textContent = "No hay datos para exportar.";
    return;
  }
  const columnas = [...COLUMNAS_TABLA_CORRECTIVO];
  const encabezado = columnas.map((col) => col.titulo).join(";");
  const filas = registrosExportar.map((registro) =>
    columnas
      .map((col) => {
        const valor = obtenerValorCeldaCorrectivo(registro, col.clave);
        return `"${valor.toString().replaceAll('"', '""')}"`;
      })
      .join(";")
  );
  const areaFiltro = filtroAreaCorrectivo?.value || "";
  const sufijoArea =
    areaFiltro === "__sin_area__"
      ? "sin-area"
      : areaFiltro
        ? areaFiltro.toLowerCase().replaceAll(" ", "-")
        : "todas-areas";
  const contenido = `\uFEFF${encabezado}\n${filas.join("\n")}`;
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `solicitudes-correctivo-${sufijoArea}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  if (estadoCorrectivo) estadoCorrectivo.textContent = "Archivo CSV exportado.";
}

function guardarRegistrosCorrectivo() {
  localStorage.setItem(CLAVE_CORRECTIVO, JSON.stringify(registrosCorrectivo));
}

function cargarCronogramaPreventivo() {
  try {
    const guardados = localStorage.getItem(CLAVE_CRONOGRAMA);
    cronogramaPreventivo = guardados ? JSON.parse(guardados) : [];
  } catch (error) {
    cronogramaPreventivo = [];
    estadoCronograma.textContent = "No fue posible leer el cronograma guardado.";
  }
}

function guardarCronogramaPreventivo() {
  localStorage.setItem(CLAVE_CRONOGRAMA, JSON.stringify(cronogramaPreventivo));
}

function cargarExcepcionesCronograma() {
  try {
    const guardados = localStorage.getItem(CLAVE_EXCEPCIONES);
    excepcionesCronograma = guardados ? JSON.parse(guardados) : [];
    if (!Array.isArray(excepcionesCronograma)) {
      excepcionesCronograma = [];
    }
    excepcionesCronograma = excepcionesCronograma.map((item) => ({
      ...item,
      anio: Number.parseInt(item.anio, 10),
      mes: Number.parseInt(item.mes, 10),
      dia: Number.parseInt(item.dia, 10),
    }));
  } catch (error) {
    excepcionesCronograma = [];
  }
}

function guardarExcepcionesCronograma() {
  localStorage.setItem(CLAVE_EXCEPCIONES, JSON.stringify(excepcionesCronograma));
}

function normalizarMaquinaHoja(registro) {
  const fechaBaja =
    typeof registro.fechaBajaCirculacion === "string"
      ? registro.fechaBajaCirculacion
      : "";
  const activaExplicita = registro.activa === false ? false : true;
  return {
    ...registro,
    frecuenciaPreventivoMeses:
      Number.parseInt(registro.frecuenciaPreventivoMeses, 10) > 0
        ? Number.parseInt(registro.frecuenciaPreventivoMeses, 10)
        : 12,
    fechaPrimerPreventivo:
      typeof registro.fechaPrimerPreventivo === "string"
        ? registro.fechaPrimerPreventivo
        : "",
    activa: fechaBaja ? false : activaExplicita !== false,
    fechaBajaCirculacion: fechaBaja,
    motivoBaja:
      typeof registro.motivoBaja === "string" ? registro.motivoBaja.trim() : "",
  };
}

function fechaCalendarioAEntero(anio, mes, dia) {
  return anio * 10000 + mes * 100 + dia;
}

function fechaIsoAEntero(fechaIso) {
  if (!fechaIso || typeof fechaIso !== "string") return null;
  const partes = fechaIso.split("-");
  if (partes.length !== 3) return null;
  const anio = Number.parseInt(partes[0], 10);
  const mes = Number.parseInt(partes[1], 10);
  const dia = Number.parseInt(partes[2], 10);
  if (!anio || !mes || !dia) return null;
  return fechaCalendarioAEntero(anio, mes, dia);
}

function maquinaActivaEnFecha(maquina, anio, mes, dia) {
  if (!maquina) return false;
  if (maquina.activa === false && !maquina.fechaBajaCirculacion) return false;
  const fechaConsulta = fechaCalendarioAEntero(anio, mes, dia);
  const fechaBaja = fechaIsoAEntero(maquina.fechaBajaCirculacion);
  if (fechaBaja === null) return maquina.activa !== false;
  return fechaConsulta < fechaBaja;
}

function claveExcepcionFecha(area, anio, mes, dia, maquinaId) {
  return `${area}|${anio}|${mes}|${dia}|${maquinaId}`;
}

function estaExcluidaEnFecha(maquinaId, area, anio, mes, dia) {
  return excepcionesCronograma.some(
    (item) =>
      item.tipo === "excluir" &&
      item.area === area &&
      Number(item.anio) === anio &&
      Number(item.mes) === mes &&
      Number(item.dia) === dia &&
      item.maquinaId === maquinaId
  );
}

function agregarExclusionFecha(area, anio, mes, dia, maquinaId) {
  if (estaExcluidaEnFecha(maquinaId, area, anio, mes, dia)) return;
  excepcionesCronograma.push({
    id: Date.now().toString(),
    tipo: "excluir",
    area,
    anio,
    mes,
    dia,
    maquinaId,
    creadoEn: new Date().toISOString(),
  });
  guardarExcepcionesCronograma();
}

function agregarProgramacionPuntual(area, anio, mes, dia, maquinaId) {
  const clave = claveExcepcionFecha(area, anio, mes, dia, maquinaId);
  const yaAgregada = excepcionesCronograma.some(
    (item) =>
      item.tipo === "agregar" &&
      claveExcepcionFecha(item.area, item.anio, item.mes, item.dia, item.maquinaId) ===
        clave
  );
  if (yaAgregada) return false;
  quitarExclusionFecha(area, anio, mes, dia, maquinaId);
  excepcionesCronograma.push({
    id: `${Date.now()}-p`,
    tipo: "agregar",
    area,
    anio,
    mes,
    dia,
    maquinaId,
    creadoEn: new Date().toISOString(),
  });
  guardarExcepcionesCronograma();
  return true;
}

function quitarExclusionFecha(area, anio, mes, dia, maquinaId) {
  const clave = claveExcepcionFecha(area, anio, mes, dia, maquinaId);
  excepcionesCronograma = excepcionesCronograma.filter(
    (item) =>
      !(
        item.tipo === "excluir" &&
        claveExcepcionFecha(item.area, item.anio, item.mes, item.dia, item.maquinaId) ===
          clave
      )
  );
  guardarExcepcionesCronograma();
}

function quitarProgramacionPuntual(area, anio, mes, dia, maquinaId) {
  const clave = claveExcepcionFecha(area, anio, mes, dia, maquinaId);
  excepcionesCronograma = excepcionesCronograma.filter(
    (item) =>
      !(
        item.tipo === "agregar" &&
        claveExcepcionFecha(item.area, item.anio, item.mes, item.dia, item.maquinaId) ===
          clave
      )
  );
  guardarExcepcionesCronograma();
}

function obtenerMaquinaPorId(maquinaId) {
  return registrosHojas.find((item) => item.id === maquinaId);
}

function formatearFechaCalendario(anio, mes, dia) {
  return `${dia.toString().padStart(2, "0")}/${mes
    .toString()
    .padStart(2, "0")}/${anio}`;
}

function formatearFechaIso(fechaIso) {
  const entero = fechaIsoAEntero(fechaIso);
  if (entero === null) return fechaIso || "-";
  const dia = entero % 100;
  const mes = Math.floor((entero % 10000) / 100);
  const anio = Math.floor(entero / 10000);
  return formatearFechaCalendario(anio, mes, dia);
}

function textoEstadoMaquina(maquina) {
  if (!maquina) return "Desconocida";
  if (maquina.activa !== false && !maquina.fechaBajaCirculacion) {
    return "En circulacion";
  }
  if (maquina.fechaBajaCirculacion) {
    return `Fuera de circulacion desde ${formatearFechaIso(
      maquina.fechaBajaCirculacion
    )}`;
  }
  return "Fuera de circulacion";
}

function obtenerAreaRegistroPreventivo(registro) {
  return (registro?.area || "").trim();
}

function contarPreventivoPorArea(lista = registrosPreventivo) {
  const conteo = Object.fromEntries(AREAS_SISTEMA.map((area) => [area, 0]));
  conteo["Sin area"] = 0;
  lista.forEach((registro) => {
    const area = obtenerAreaRegistroPreventivo(registro);
    if (AREAS_SISTEMA.includes(area)) {
      conteo[area] += 1;
    } else {
      conteo["Sin area"] += 1;
    }
  });
  return conteo;
}

function filtrarRegistrosPreventivo(lista = registrosPreventivo) {
  const areaFiltro = filtroAreaPreventivo?.value || "";
  const fechaFiltro = filtroFechaPreventivo?.value || "";

  return lista
    .filter((registro) => {
      const area = obtenerAreaRegistroPreventivo(registro);
      if (areaFiltro === "__sin_area__") {
        if (area && AREAS_SISTEMA.includes(area)) return false;
      } else if (areaFiltro && area !== areaFiltro) {
        return false;
      }
      if (fechaFiltro && registro.fecha !== fechaFiltro) return false;
      return true;
    })
    .sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
}

function construirHtmlItemPreventivo(registro) {
  const areaTexto = registro.area || "Sin area";
  const archivoTexto = etiquetaArchivoPreventivo(registro);
  const descripcionTexto = (registro.descripcion || registro.actividad || "").trim();
  return `
    <article class="item-lista-registro">
      <button type="button" class="btn-registro-contenido" data-ver-preventivo="${registro.id}">
        <span class="titulo-registro">${escapeHtml(registro.equipo)}</span>
        <span class="fecha-registro">${escapeHtml(registro.fecha)}</span>
        <span class="codigo-registro">ID: ${escapeHtml(registro.maquinaId || "sin vinculo")}</span>
        <span class="area-registro">${escapeHtml(areaTexto)}</span>
        ${descripcionTexto ? `<span class="descripcion-registro">${escapeHtml(descripcionTexto.slice(0, 120))}${descripcionTexto.length > 120 ? "..." : ""}</span>` : ""}
        <span class="archivo-registro">${escapeHtml(archivoTexto)}</span>
      </button>
      <div class="acciones-lista-registro">
        <button type="button" class="btn-tabla-accion" data-editar-preventivo="${registro.id}">Editar</button>
        <button type="button" class="btn-tabla-accion btn-tabla-accion--eliminar" data-eliminar-preventivo="${registro.id}">Eliminar</button>
      </div>
    </article>
  `;
}

function renderResumenPreventivoPorArea(conteo) {
  if (!resumenPreventivoAreas) return;

  const areaFiltro = filtroAreaPreventivo?.value || "";
  const total = registrosPreventivo.length;
  const tarjetas = [
    { clave: "", titulo: "Todas", cantidad: total },
    ...AREAS_SISTEMA.map((area) => ({
      clave: area,
      titulo: area,
      cantidad: conteo[area] || 0,
    })),
  ];

  if ((conteo["Sin area"] || 0) > 0) {
    tarjetas.push({
      clave: "__sin_area__",
      titulo: "Sin area",
      cantidad: conteo["Sin area"] || 0,
    });
  }

  resumenPreventivoAreas.innerHTML = tarjetas
    .map((tarjeta) => {
      const activa = tarjeta.clave === areaFiltro;
      return `
        <button
          type="button"
          class="tarjeta-correctivo-area${activa ? " activa" : ""}"
          data-area-preventivo="${tarjeta.clave}"
        >
          <span class="tarjeta-correctivo-area__titulo">${escapeHtml(tarjeta.titulo)}</span>
          <strong class="tarjeta-correctivo-area__total">${tarjeta.cantidad}</strong>
          <span class="tarjeta-correctivo-area__etiqueta">registros</span>
        </button>
      `;
    })
    .join("");

  resumenPreventivoAreas.querySelectorAll("[data-area-preventivo]").forEach((boton) => {
    boton.addEventListener("click", () => {
      if (!filtroAreaPreventivo) return;
      filtroAreaPreventivo.value = boton.getAttribute("data-area-preventivo") || "";
      renderRegistrosPreventivo();
    });
  });
}

function renderRegistrosPreventivo() {
  if (!listaPreventivo) return;

  const conteo = contarPreventivoPorArea();
  renderResumenPreventivoPorArea(conteo);

  const registrosFiltrados = filtrarRegistrosPreventivo();
  const areaFiltro = filtroAreaPreventivo?.value || "";

  if (registrosPreventivo.length === 0) {
    listaPreventivo.innerHTML =
      "<p class='ventana-cronograma__vacio'>Aun no hay registros preventivos.</p>";
    return;
  }

  if (registrosFiltrados.length === 0) {
    listaPreventivo.innerHTML =
      "<p class='ventana-cronograma__vacio'>No hay registros con los filtros actuales.</p>";
    return;
  }

  if (areaFiltro) {
    const tituloArea = areaFiltro === "__sin_area__" ? "Sin area" : areaFiltro;
    listaPreventivo.innerHTML = `
      <section class="bloque-correctivo-area bloque-preventivo-area">
        <header class="bloque-correctivo-area__encabezado">
          <h5>${escapeHtml(tituloArea)}</h5>
          <span>${registrosFiltrados.length} registro(s)</span>
        </header>
        <div class="lista-registros-area">
          ${registrosFiltrados.map((registro) => construirHtmlItemPreventivo(registro)).join("")}
        </div>
      </section>
    `;
    return;
  }

  const grupos = Object.fromEntries(AREAS_SISTEMA.map((area) => [area, []]));
  grupos["Sin area"] = [];

  registrosFiltrados.forEach((registro) => {
    const area = obtenerAreaRegistroPreventivo(registro);
    if (AREAS_SISTEMA.includes(area)) {
      grupos[area].push(registro);
    } else {
      grupos["Sin area"].push(registro);
    }
  });

  listaPreventivo.innerHTML = [...AREAS_SISTEMA, "Sin area"]
    .filter((area) => grupos[area].length > 0)
    .map(
      (area) => `
        <section class="bloque-correctivo-area bloque-preventivo-area">
          <header class="bloque-correctivo-area__encabezado">
            <h5>${escapeHtml(area)}</h5>
            <span>${grupos[area].length} registro(s)</span>
          </header>
          <div class="lista-registros-area">
            ${grupos[area].map((registro) => construirHtmlItemPreventivo(registro)).join("")}
          </div>
        </section>
      `
    )
    .join("");
}

function leerFotoComoBase64(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = () => reject(new Error("No se pudo procesar la foto."));
    lector.readAsDataURL(archivo);
  });
}

function leerArchivoComoBase64(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = () => reject(new Error("No se pudo procesar el archivo."));
    lector.readAsDataURL(archivo);
  });
}

function esArchivoPreventivoValido(archivo) {
  if (!(archivo instanceof File) || archivo.size <= 0) return false;
  const nombre = archivo.name.toLowerCase();
  return EXTENSIONES_ARCHIVO_PREVENTIVO.some((ext) => nombre.endsWith(ext));
}

function normalizarRegistroPreventivo(registro) {
  const archivoLegacy = typeof registro.foto === "string" ? registro.foto : "";
  const archivo = registro.archivo || archivoLegacy || "";
  return {
    id: registro.id || Date.now().toString(),
    area: registro.area || "",
    maquinaId: registro.maquinaId || "",
    equipo: registro.equipo || "",
    fecha: registro.fecha || "",
    descripcion: (registro.descripcion || registro.actividad || "").trim(),
    archivo,
    archivoNombre:
      registro.archivoNombre ||
      (archivoLegacy ? "archivo-anterior" : archivo ? "documento-preventivo" : ""),
    archivoTipo: registro.archivoTipo || "",
  };
}

function obtenerDatosArchivoPreventivo(registro) {
  if (!registro) {
    return { data: "", nombre: "", tipo: "" };
  }
  return {
    data: registro.archivo || registro.foto || "",
    nombre: registro.archivoNombre || "documento-preventivo",
    tipo: registro.archivoTipo || "application/octet-stream",
  };
}

function renderDetalleArchivoPreventivo(registro) {
  if (!detalleArchivoPreventivo) return;
  detalleArchivoPreventivo.innerHTML = "";
  const { data, nombre } = obtenerDatosArchivoPreventivo(registro);
  if (!data) {
    detalleArchivoPreventivo.textContent = "Sin archivo adjunto.";
    return;
  }
  const enlace = document.createElement("a");
  enlace.href = data;
  enlace.download = nombre;
  enlace.className = "enlace-archivo-preventivo";
  enlace.textContent = `Descargar ${nombre}`;
  enlace.target = "_blank";
  enlace.rel = "noopener noreferrer";
  detalleArchivoPreventivo.appendChild(enlace);
}

function etiquetaArchivoPreventivo(registro) {
  const { data, nombre } = obtenerDatosArchivoPreventivo(registro);
  if (!data) return "Sin archivo";
  return nombre || "Adjunto";
}

function descargarJson(nombreArchivo, datos) {
  const contenido = JSON.stringify(datos, null, 2);
  const blob = new Blob([contenido], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nombreArchivo;
  link.click();
  URL.revokeObjectURL(url);
}

function construirRespaldoGeneral() {
  return {
    version: 1,
    exportadoEn: new Date().toISOString(),
    data: {
      preventivo: registrosPreventivo,
      hojasDeVida: registrosHojas,
      correctivo: registrosCorrectivo,
      cronogramaPreventivo,
      excepcionesCronograma,
      indicadores: {
        horasProgramadas:
          typeof obtenerHorasProgramadasRespaldo === "function"
            ? obtenerHorasProgramadasRespaldo()
            : {},
      },
      personal: [],
    },
  };
}

function normalizarTexto(valor) {
  return valor.toString().trim().toLowerCase();
}

function actualizarOpcionesEquiposPreventivo() {
  const areaSeleccionada = areaPreventivo.value;
  equipoPreventivo.innerHTML = "";

  if (!areaSeleccionada) {
    equipoPreventivo.innerHTML = "<option value=''>Selecciona primero un area</option>";
    return;
  }

  const maquinasArea = registrosHojas.filter(
    (item) => item.area === areaSeleccionada && item.activa !== false
  );
  if (maquinasArea.length === 0) {
    equipoPreventivo.innerHTML =
      "<option value=''>No hay maquinas en esta area</option>";
    return;
  }

  equipoPreventivo.innerHTML = "<option value=''>Selecciona una maquina</option>";
  maquinasArea.forEach((maquina) => {
    const opcion = document.createElement("option");
    opcion.value = maquina.id;
    opcion.textContent = `${maquina.nombre} (${maquina.codigo})`;
    equipoPreventivo.appendChild(opcion);
  });
}

function obtenerNombreMaquinaPorId(maquinaId) {
  const maquina = registrosHojas.find((item) => item.id === maquinaId);
  if (!maquina) return "Maquina eliminada";
  return `${maquina.nombre} (${maquina.codigo})`;
}

function esAnioBisiesto(anio) {
  return (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0;
}

function obtenerDiasEnMes(anio, mes) {
  return new Date(anio, mes, 0).getDate();
}

function ajustarDiaPorMesYAnio(dia, mes, anio) {
  const maxDia = obtenerDiasEnMes(anio, mes);
  if (mes === 2 && dia === 29 && !esAnioBisiesto(anio)) {
    return 28;
  }
  return Math.min(dia, maxDia);
}

function parseFechaPreventivo(fechaIso) {
  if (!fechaIso || typeof fechaIso !== "string") return null;
  const partes = fechaIso.trim().split("-");
  if (partes.length !== 3) return null;
  const anio = Number.parseInt(partes[0], 10);
  const mes = Number.parseInt(partes[1], 10);
  const dia = Number.parseInt(partes[2], 10);
  if (
    Number.isNaN(anio) ||
    Number.isNaN(mes) ||
    Number.isNaN(dia) ||
    mes < 1 ||
    mes > 12 ||
    dia < 1 ||
    dia > 31
  ) {
    return null;
  }
  return { anio, mes, dia };
}

function sumarMesesPreventivo(anio, mes, dia, mesesASumar) {
  const fecha = new Date(anio, mes - 1 + mesesASumar, dia);
  return {
    anio: fecha.getFullYear(),
    mes: fecha.getMonth() + 1,
    dia: fecha.getDate(),
  };
}

function fechaCalendarioAValor(anio, mes, dia) {
  return anio * 10000 + mes * 100 + dia;
}

const mapaOcurrenciasPorMaquina = new Map();

function limpiarCacheOcurrencias() {
  mapaOcurrenciasPorMaquina.clear();
}

function obtenerOcurrenciasPreventivasEnAnio(maquina, anioVista) {
  const base = parseFechaPreventivo(maquina.fechaPrimerPreventivo);
  if (!base) return [];

  const frecuencia = Number.parseInt(maquina.frecuenciaPreventivoMeses, 10) || 12;
  const diaBase = base.dia;
  const ocurrencias = [];
  const inicioAnio = fechaCalendarioAValor(anioVista, 1, 1);
  const finAnio = fechaCalendarioAValor(anioVista, 12, 31);

  let anio = base.anio;
  let mes = base.mes;
  let iteraciones = 0;
  let valorAnterior = -1;

  while (iteraciones < 600) {
    const diaAjustado = ajustarDiaPorMesYAnio(diaBase, mes, anio);
    const valorFecha = fechaCalendarioAValor(anio, mes, diaAjustado);

    if (valorFecha > finAnio) break;

    if (valorFecha >= inicioAnio && valorFecha !== valorAnterior) {
      if (maquinaActivaEnFecha(maquina, anio, mes, diaAjustado)) {
        ocurrencias.push({ anio, mes, dia: diaAjustado });
      }
    }

    valorAnterior = valorFecha;
    const siguiente = sumarMesesPreventivo(anio, mes, diaBase, frecuencia);
    if (
      siguiente.anio === anio &&
      siguiente.mes === mes &&
      fechaCalendarioAValor(siguiente.anio, siguiente.mes, siguiente.dia) === valorFecha
    ) {
      break;
    }
    anio = siguiente.anio;
    mes = siguiente.mes;
    iteraciones += 1;
  }

  return ocurrencias;
}

function obtenerOcurrenciasMaquinaEnAnio(maquina, anioVista) {
  const clave = `${maquina.id}|${anioVista}|${maquina.fechaPrimerPreventivo}|${maquina.frecuenciaPreventivoMeses}|${maquina.fechaBajaCirculacion}|${maquina.activa}`;
  if (!mapaOcurrenciasPorMaquina.has(clave)) {
    mapaOcurrenciasPorMaquina.set(
      clave,
      obtenerOcurrenciasPreventivasEnAnio(maquina, anioVista)
    );
  }
  return mapaOcurrenciasPorMaquina.get(clave);
}

function maquinaCoincideFrecuenciaPreventiva(maquina, anio, mes, dia) {
  return obtenerOcurrenciasMaquinaEnAnio(maquina, anio).some(
    (ocurrencia) => ocurrencia.mes === mes && ocurrencia.dia === dia
  );
}

function formatearOcurrenciasTexto(ocurrencias) {
  if (ocurrencias.length === 0) return "Sin fechas en este año";
  const nombresMeses = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  return ocurrencias
    .map(
      (item) =>
        `${item.dia.toString().padStart(2, "0")} ${nombresMeses[item.mes - 1]}`
    )
    .join(", ");
}

function renderResumenProgramacionAnual(area, anio) {
  if (!resumenProgramacionAnual) return;
  if (!area) {
    resumenProgramacionAnual.innerHTML = "";
    return;
  }

  const maquinas = registrosHojas
    .filter((item) => item.area === area && item.fechaPrimerPreventivo)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  if (maquinas.length === 0) {
    resumenProgramacionAnual.innerHTML =
      "<p>Registra maquinas en Hojas de vida con primer PM y frecuencia para generar el cronograma automatico.</p>";
    return;
  }

  const items = maquinas
    .map((maquina) => {
      const ocurrencias = obtenerOcurrenciasMaquinaEnAnio(maquina, anio);
      const fechasTexto = formatearOcurrenciasTexto(ocurrencias);
      const estado = textoEstadoMaquina(maquina);
      const frecuencia = maquina.frecuenciaPreventivoMeses || 12;
      return `<li><strong>${escapeHtml(maquina.nombre)}</strong> (${escapeHtml(
        maquina.codigo
      )}) — cada ${frecuencia} mes(es): ${escapeHtml(fechasTexto)}. <em>${escapeHtml(
        estado
      )}</em></li>`;
    })
    .join("");

  resumenProgramacionAnual.innerHTML = `
    <h4>Programacion automatica en ${anio} — ${escapeHtml(area)}</h4>
    <ul>${items}</ul>
  `;
}

function sincronizarVistaCronogramaConMaquina(maquina) {
  if (!maquina) return;
  cronogramaArea.value = maquina.area;
  const base = parseFechaPreventivo(maquina.fechaPrimerPreventivo);
  if (base) {
    cronogramaAnio.value = String(base.anio);
  }
  if (inicioCronogramaAnio) {
    inicioCronogramaAnio.value = String(base ? base.anio : new Date().getFullYear());
  }
}

function slugArea(area) {
  return area
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function valorFechaOcurrencia(anio, mes, dia) {
  return fechaCalendarioAValor(anio, mes, dia);
}

function obtenerDatosVentanaCronograma(area, anioVista) {
  const maquinas = registrosHojas.filter(
    (item) => item.area === area && parseFechaPreventivo(item.fechaPrimerPreventivo)
  );
  const porMes = NOMBRES_MESES_LARGOS.map((nombreMes, indice) => ({
    mes: indice + 1,
    nombreMes,
    citas: [],
  }));
  let totalCitas = 0;
  const hoy = new Date();
  const anioHoy = hoy.getFullYear();
  const mesHoy = hoy.getMonth() + 1;
  const diaHoy = hoy.getDate();
  const valorHoy =
    anioVista === anioHoy ? valorFechaOcurrencia(anioVista, mesHoy, diaHoy) : -1;

  let proximaCita = null;

  maquinas.forEach((maquina) => {
    const ocurrencias = obtenerOcurrenciasMaquinaEnAnio(maquina, anioVista);
    ocurrencias.forEach((ocurrencia) => {
      totalCitas += 1;
      const cita = {
        maquinaId: maquina.id,
        nombre: maquina.nombre,
        codigo: maquina.codigo,
        dia: ocurrencia.dia,
        frecuencia: maquina.frecuenciaPreventivoMeses || 12,
      };
      porMes[ocurrencia.mes - 1].citas.push(cita);

      const valor = valorFechaOcurrencia(anioVista, ocurrencia.mes, ocurrencia.dia);
      if (valorHoy >= 0 && valor >= valorHoy) {
        if (!proximaCita || valor < proximaCita.valor) {
          proximaCita = {
            valor,
            nombre: maquina.nombre,
            codigo: maquina.codigo,
            dia: ocurrencia.dia,
            mes: ocurrencia.mes,
            nombreMes: NOMBRES_MESES_LARGOS[ocurrencia.mes - 1],
          };
        }
      }
    });
  });

  porMes.forEach((bloque) => {
    bloque.citas.sort((a, b) => a.dia - b.dia);
  });

  const maquinasActivas = maquinas.filter(
    (item) => item.activa !== false && !item.fechaBajaCirculacion
  ).length;

  return {
    area,
    anioVista,
    totalMaquinas: maquinas.length,
    maquinasActivas,
    totalCitas,
    porMes: porMes.filter((bloque) => bloque.citas.length > 0),
    proximaCita,
    mesActual: anioVista === anioHoy ? mesHoy : null,
  };
}

function renderHtmlVentanaCronograma(datos) {
  const claseArea = `ventana-cronograma--${slugArea(datos.area)}`;
  if (datos.totalMaquinas === 0) {
    return `
      <article class="ventana-cronograma ${claseArea}">
        <div class="ventana-cronograma__cabecera">
          <h3>${escapeHtml(datos.area)}</h3>
          <div class="ventana-cronograma__stats">
            <span class="chip-stat">Sin maquinas</span>
          </div>
        </div>
        <p class="ventana-cronograma__vacio">
          Registra equipos en <strong>Hojas de vida</strong> con area
          ${escapeHtml(datos.area)}, primer PM y frecuencia en meses.
        </p>
        <div class="ventana-cronograma__pie">
          <button type="button" class="btn-ver-calendario" data-abrir-cronograma-area="${escapeHtml(datos.area)}">
            Abrir modulo y registrar
          </button>
        </div>
      </article>
    `;
  }

  const proximoHtml = datos.proximaCita
    ? `<p class="ventana-cronograma__proximo">
        <strong>Proximo PM:</strong> ${escapeHtml(datos.proximaCita.nombre)} (${escapeHtml(datos.proximaCita.codigo)}) —
        ${datos.proximaCita.dia} ${escapeHtml(datos.proximaCita.nombreMes)} ${datos.anioVista}
      </p>`
    : `<p class="ventana-cronograma__proximo">
        <strong>${datos.anioVista}:</strong> no hay PM pendientes a futuro en esta area (o el año ya paso).
      </p>`;

  const mesesHtml =
    datos.porMes.length > 0
      ? datos.porMes
          .map((bloque) => {
            const esMesActual = bloque.mes === datos.mesActual;
            const citasHtml = bloque.citas
              .map(
                (cita) => `
              <li>
                <span class="dia-pm-badge">${cita.dia}</span>
                <span class="pm-nombre">${escapeHtml(cita.nombre)}</span>
                <span class="pm-codigo">${escapeHtml(cita.codigo)} · cada ${cita.frecuencia}m</span>
              </li>
            `
              )
              .join("");
            return `
            <div class="mes-bloque-inicio ${esMesActual ? "mes-bloque-inicio--actual" : ""}">
              <div class="mes-bloque-inicio__titulo">
                <span>${escapeHtml(bloque.nombreMes)}</span>
                <span>${bloque.citas.length} PM</span>
              </div>
              <ul class="mes-bloque-inicio__lista">${citasHtml}</ul>
            </div>
          `;
          })
          .join("")
      : `<p class="ventana-cronograma__vacio">Hay maquinas pero ningun PM calculado para ${datos.anioVista}. Revisa primer PM y frecuencia.</p>`;

  return `
    <article class="ventana-cronograma ${claseArea}">
      <div class="ventana-cronograma__cabecera">
        <h3>${escapeHtml(datos.area)}</h3>
        <div class="ventana-cronograma__stats">
          <span class="chip-stat">${datos.totalMaquinas} maquina(s)</span>
          <span class="chip-stat">${datos.maquinasActivas} activa(s)</span>
          <span class="chip-stat chip-stat--pm">${datos.totalCitas} PM en ${datos.anioVista}</span>
        </div>
      </div>
      ${proximoHtml}
      <div class="ventana-cronograma__cuerpo">${mesesHtml}</div>
      <div class="ventana-cronograma__pie">
        <button type="button" class="btn-ver-calendario" data-abrir-cronograma-area="${escapeHtml(datos.area)}">
          Ver calendario completo ${datos.anioVista}
        </button>
      </div>
    </article>
  `;
}

function renderPanelCronogramaInicio() {
  if (!gridVentanasCronograma || !resumenGlobalInicio) return;

  limpiarCacheOcurrencias();
  const anio =
    Number.parseInt(inicioCronogramaAnio?.value, 10) || new Date().getFullYear();
  if (inicioCronogramaAnio) {
    inicioCronogramaAnio.value = String(anio);
  }

  let totalPmGlobal = 0;
  let totalMaquinasGlobal = 0;
  let citasMesActual = 0;
  const mesActual = new Date().getMonth() + 1;

  const ventanasHtml = AREAS_PANEL_INICIO.map((area) => {
    const datos = obtenerDatosVentanaCronograma(area, anio);
    totalPmGlobal += datos.totalCitas;
    totalMaquinasGlobal += datos.totalMaquinas;
    const bloqueMes = datos.porMes.find((item) => item.mes === mesActual);
    citasMesActual += bloqueMes ? bloqueMes.citas.length : 0;
    return renderHtmlVentanaCronograma(datos);
  }).join("");

  gridVentanasCronograma.innerHTML = ventanasHtml;

  resumenGlobalInicio.innerHTML = `
    <div class="tarjeta-resumen-global">
      <span>Maquinas registradas</span>
      <strong>${totalMaquinasGlobal}</strong>
    </div>
    <div class="tarjeta-resumen-global">
      <span>PM programados ${anio}</span>
      <strong>${totalPmGlobal}</strong>
    </div>
    <div class="tarjeta-resumen-global">
      <span>PM este mes</span>
      <strong>${citasMesActual}</strong>
    </div>
    <div class="tarjeta-resumen-global">
      <span>Areas en panel</span>
      <strong>${AREAS_PANEL_INICIO.length}</strong>
    </div>
  `;

  gridVentanasCronograma.querySelectorAll("[data-abrir-cronograma-area]").forEach((boton) => {
    boton.addEventListener("click", () => {
      const area = boton.getAttribute("data-abrir-cronograma-area");
      if (!area) return;
      cronogramaArea.value = area;
      cronogramaAnio.value = String(anio);
      mostrarVista("vista-cronograma");
    });
  });
}

function abrirCronogramaDesdeInicio(area) {
  const anio =
    Number.parseInt(inicioCronogramaAnio?.value, 10) || new Date().getFullYear();
  cronogramaArea.value = area;
  cronogramaAnio.value = String(anio);
  mostrarVista("vista-cronograma");
}

function actualizarProgramacionEnPantalla() {
  renderPanelCronogramaInicio();
  renderCronogramaPreventivo();
}

function sugerirAreaCronograma() {
  if (cronogramaArea.value) return;
  const areas = [...new Set(registrosHojas.map((item) => item.area).filter(Boolean))];
  if (areas.length === 1) {
    cronogramaArea.value = areas[0];
  }
}

function construirMapaProgramacionAutomatica(area, anioVista) {
  const mapa = new Map();
  const maquinas = registrosHojas.filter((maquina) => {
    if (maquina.area !== area) return false;
    return Boolean(parseFechaPreventivo(maquina.fechaPrimerPreventivo));
  });

  maquinas.forEach((maquina) => {
    const ocurrencias = obtenerOcurrenciasPreventivasEnAnio(maquina, anioVista);
    ocurrencias.forEach((ocurrencia) => {
      if (
        estaExcluidaEnFecha(
          maquina.id,
          area,
          anioVista,
          ocurrencia.mes,
          ocurrencia.dia
        )
      ) {
        return;
      }
      const clave = `${ocurrencia.mes}|${ocurrencia.dia}`;
      if (!mapa.has(clave)) {
        mapa.set(clave, []);
      }
      mapa.get(clave).push({
        id: `auto-${maquina.id}-${anioVista}-${ocurrencia.mes}-${ocurrencia.dia}`,
        area: maquina.area,
        maquinaId: maquina.id,
        mes: ocurrencia.mes,
        dia: ocurrencia.dia,
        anio: anioVista,
        frecuenciaMeses: maquina.frecuenciaPreventivoMeses,
        origen: "automatico",
      });
    });
  });

  return mapa;
}

function obtenerProgramacionesDelDia(area, anio, mes, dia, mapaAutomatica) {
  const mapa =
    mapaAutomatica || construirMapaProgramacionAutomatica(area, anio);
  const clave = `${mes}|${dia}`;
  const automaticas = mapa.get(clave) ? [...mapa.get(clave)] : [];
  const manuales = cronogramaPreventivo
    .filter((item) => {
      if (item.area !== area) return false;
      const maquina = obtenerMaquinaPorId(item.maquinaId);
      if (maquina && !maquinaActivaEnFecha(maquina, anio, mes, dia)) return false;
      if (estaExcluidaEnFecha(item.maquinaId, area, anio, mes, dia)) return false;
      const frecuenciaMeses =
        Number.parseInt(item.frecuenciaMeses, 10) > 0
          ? Number.parseInt(item.frecuenciaMeses, 10)
          : 12;
      const diferenciaMeses = (anio - item.anioBase) * 12 + (mes - item.mes);
      if (diferenciaMeses < 0) return false;
      if (diferenciaMeses % frecuenciaMeses !== 0) return false;
      return ajustarDiaPorMesYAnio(item.dia, mes, anio) === dia;
    })
    .map((item) => ({ ...item, origen: "manual", anio }));

  const puntuales = excepcionesCronograma
    .filter(
      (item) =>
        item.tipo === "agregar" &&
        item.area === area &&
        Number(item.anio) === anio &&
        Number(item.mes) === mes &&
        Number(item.dia) === dia
    )
    .filter((item) => {
      const maquina = obtenerMaquinaPorId(item.maquinaId);
      return maquina && maquinaActivaEnFecha(maquina, anio, mes, dia);
    })
    .map((item) => ({
      id: item.id,
      area: item.area,
      maquinaId: item.maquinaId,
      mes: item.mes,
      dia: item.dia,
      anio: item.anio,
      origen: "puntual",
    }));

  const combinadas = [...automaticas];
  const maquinasYaIncluidas = new Set(automaticas.map((item) => item.maquinaId));
  manuales.forEach((item) => {
    if (maquinasYaIncluidas.has(item.maquinaId)) return;
    maquinasYaIncluidas.add(item.maquinaId);
    combinadas.push(item);
  });
  puntuales.forEach((item) => {
    if (maquinasYaIncluidas.has(item.maquinaId)) return;
    maquinasYaIncluidas.add(item.maquinaId);
    combinadas.push(item);
  });
  return combinadas;
}

function etiquetaOrigenProgramacion(origen) {
  if (origen === "automatico") return "Automatica (hoja de vida)";
  if (origen === "manual") return "Manual recurrente";
  return "Solo esta fecha";
}

function renderEditorDiaCronograma() {
  if (!diaCronogramaContexto) return;
  const { area, anio, mes, dia } = diaCronogramaContexto;
  const programaciones = obtenerProgramacionesDelDia(area, anio, mes, dia);
  const fechaTexto = formatearFechaCalendario(anio, mes, dia);

  tituloDiaCronograma.textContent = `${area} — ${fechaTexto}`;
  resumenDiaCronograma.textContent =
    programaciones.length === 0
      ? "Sin maquinas programadas. Puedes agregar una solo para este dia."
      : `${programaciones.length} maquina(s) programada(s). Quitar en una fecha no afecta otras fechas del mismo equipo.`;

  listaDiaCronograma.innerHTML = "";
  if (programaciones.length === 0) {
    listaDiaCronograma.innerHTML =
      "<p>No hay maquinas en este dia. Usa el selector de abajo para agregar una puntual.</p>";
  } else {
    programaciones.forEach((item) => {
      const maquina = obtenerMaquinaPorId(item.maquinaId);
      const articulo = document.createElement("article");
      articulo.className = "item-dia-cronograma";
      articulo.innerHTML = `
        <h4>${escapeHtml(obtenerNombreMaquinaPorId(item.maquinaId))}</h4>
        <p class="meta-dia">${escapeHtml(etiquetaOrigenProgramacion(item.origen))}</p>
        <p class="meta-dia">Estado: ${escapeHtml(textoEstadoMaquina(maquina))}</p>
        <div class="acciones-dia-cronograma"></div>
      `;
      const acciones = articulo.querySelector(".acciones-dia-cronograma");

      const btnQuitarFecha = document.createElement("button");
      btnQuitarFecha.type = "button";
      btnQuitarFecha.className = "btn-secundario";
      btnQuitarFecha.textContent = "Quitar solo esta fecha";
      btnQuitarFecha.addEventListener("click", () => {
        if (item.origen === "puntual") {
          quitarProgramacionPuntual(area, anio, mes, dia, item.maquinaId);
        } else {
          agregarExclusionFecha(area, anio, mes, dia, item.maquinaId);
        }
        renderEditorDiaCronograma();
        renderCronogramaPreventivo();
        estadoDiaCronograma.textContent = `Se quito de ${fechaTexto} sin afectar otras fechas.`;
      });
      acciones.appendChild(btnQuitarFecha);

      if (maquina && maquinaActivaEnFecha(maquina, anio, mes, dia)) {
        const btnBaja = document.createElement("button");
        btnBaja.type = "button";
        btnBaja.className = "btn-eliminar";
        btnBaja.textContent = "Dar de baja maquina (todas las fechas futuras)";
        btnBaja.addEventListener("click", () => {
          const fechaSugerida = `${anio}-${mes.toString().padStart(2, "0")}-${dia
            .toString()
            .padStart(2, "0")}`;
          const confirmar = confirm(
            `La maquina dejara de aparecer en el cronograma desde ${formatearFechaCalendario(
              anio,
              mes,
              dia
            )} en adelante. Las fechas anteriores se conservan en el historial.`
          );
          if (!confirmar) return;
          maquina.activa = false;
          maquina.fechaBajaCirculacion = fechaSugerida;
          maquina.motivoBaja = "Baja desde cronograma";
          guardarRegistrosHojas();
          actualizarOpcionesEquiposPreventivo();
          renderRegistrosHojas();
          renderEditorDiaCronograma();
          renderCronogramaPreventivo();
          estadoDiaCronograma.textContent =
            "Maquina dada de baja. Ya no aparecera en fechas posteriores.";
        });
        acciones.appendChild(btnBaja);
      }

      listaDiaCronograma.appendChild(articulo);
    });
  }

  const programadasIds = new Set(programaciones.map((item) => item.maquinaId));
  const maquinasDisponibles = registrosHojas.filter(
    (item) =>
      item.area === area &&
      item.activa !== false &&
      maquinaActivaEnFecha(item, anio, mes, dia) &&
      !programadasIds.has(item.id)
  );

  agregarMaquinaDiaCronograma.innerHTML =
    "<option value=''>Selecciona una maquina activa</option>";
  maquinasDisponibles.forEach((maquina) => {
    const opcion = document.createElement("option");
    opcion.value = maquina.id;
    opcion.textContent = `${maquina.nombre} (${maquina.codigo})`;
    agregarMaquinaDiaCronograma.appendChild(opcion);
  });
  agregarMaquinaDiaBtn.disabled = maquinasDisponibles.length === 0;
}

function abrirEditorDiaCronograma(area, anio, mes, dia) {
  if (!area) {
    estadoCronograma.textContent = "Selecciona un area antes de editar.";
    return;
  }
  diaCronogramaContexto = { area, anio, mes, dia };
  estadoDiaCronograma.textContent = "";
  renderEditorDiaCronograma();
  abrirModal("modal-dia-cronograma");
}

function escapeHtml(texto) {
  return texto
    .toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function obtenerResumenDelMes(area, anio, mesSeleccionado) {
  const itemsMes = [];
  const diasMes = obtenerDiasEnMes(anio, mesSeleccionado);
  const mapaAutomatica = construirMapaProgramacionAutomatica(area, anio);
  for (let dia = 1; dia <= diasMes; dia += 1) {
    const programaciones = obtenerProgramacionesDelDia(
      area,
      anio,
      mesSeleccionado,
      dia,
      mapaAutomatica
    );
    if (programaciones.length === 0) continue;
    const maquinas = programaciones.map((item) => {
      const origen =
        item.origen === "automatico"
          ? "AUTO"
          : item.origen === "puntual"
            ? "PUNTUAL"
            : "MANUAL";
      return `${obtenerNombreMaquinaPorId(item.maquinaId)} [${origen}]`;
    });
    itemsMes.push({
      fecha: `${dia.toString().padStart(2, "0")}/${mesSeleccionado
        .toString()
        .padStart(2, "0")}/${anio}`,
      maquinas,
    });
  }
  return itemsMes;
}

function esTodasLasAreasImpresion(area) {
  return area === "__TODAS__";
}

function obtenerAreasParaResumenMensual(area) {
  if (esTodasLasAreasImpresion(area)) return [...AREAS_SISTEMA];
  return area ? [area] : [];
}

function construirResumenCorreoMantenimientos(area, anio, mesSeleccionado) {
  const areas = obtenerAreasParaResumenMensual(area);
  const nombreMes = NOMBRES_MESES_LARGOS[mesSeleccionado - 1] || "";
  const bloques = [];
  let totalDias = 0;

  areas.forEach((areaItem) => {
    const itemsMes = obtenerResumenDelMes(areaItem, anio, mesSeleccionado);
    if (itemsMes.length === 0) return;
    totalDias += itemsMes.length;
    bloques.push(`=== ${areaItem} ===`);
    itemsMes.forEach((item) => {
      bloques.push(`${item.fecha}: ${item.maquinas.join(", ")}`);
    });
    bloques.push("");
  });

  return {
    vacio: bloques.length === 0,
    nombreMes,
    totalDias,
    areaEtiqueta: esTodasLasAreasImpresion(area) ? "Todas las areas" : area,
    texto: bloques.join("\n").trim(),
  };
}

function obtenerConfigEmailJsCronograma() {
  try {
    return {
      publicKey: localStorage.getItem(CLAVE_EMAILJS_PUBLIC) || "",
      serviceId: localStorage.getItem(CLAVE_EMAILJS_SERVICE) || "",
      templateId: localStorage.getItem(CLAVE_EMAILJS_TEMPLATE) || "",
      destino: localStorage.getItem(CLAVE_EMAILJS_DESTINO) || "",
    };
  } catch {
    return { publicKey: "", serviceId: "", templateId: "", destino: "" };
  }
}

function guardarConfigEmailJsCronograma(config) {
  try {
    const { publicKey, serviceId, templateId, destino } = config;
    if (publicKey?.trim()) localStorage.setItem(CLAVE_EMAILJS_PUBLIC, publicKey.trim());
    else localStorage.removeItem(CLAVE_EMAILJS_PUBLIC);
    if (serviceId?.trim()) localStorage.setItem(CLAVE_EMAILJS_SERVICE, serviceId.trim());
    else localStorage.removeItem(CLAVE_EMAILJS_SERVICE);
    if (templateId?.trim()) localStorage.setItem(CLAVE_EMAILJS_TEMPLATE, templateId.trim());
    else localStorage.removeItem(CLAVE_EMAILJS_TEMPLATE);
    if (destino?.trim()) localStorage.setItem(CLAVE_EMAILJS_DESTINO, destino.trim());
    else localStorage.removeItem(CLAVE_EMAILJS_DESTINO);
  } catch {
    /* almacenamiento no disponible */
  }
}

function leerConfigEmailJsDesdeFormulario() {
  return {
    destino: emailjsDestinoCronograma?.value.trim() || "",
    publicKey: emailjsPublicKeyCronograma?.value.trim() || "",
    serviceId: emailjsServiceIdCronograma?.value.trim() || "",
    templateId: emailjsTemplateIdCronograma?.value.trim() || "",
  };
}

function cargarConfigEmailJsEnFormulario() {
  const config = obtenerConfigEmailJsCronograma();
  if (emailjsDestinoCronograma) emailjsDestinoCronograma.value = config.destino;
  if (emailjsPublicKeyCronograma) emailjsPublicKeyCronograma.value = config.publicKey;
  if (emailjsServiceIdCronograma) emailjsServiceIdCronograma.value = config.serviceId;
  if (emailjsTemplateIdCronograma) emailjsTemplateIdCronograma.value = config.templateId;
}

function validarSeleccionListaMensual(area, anio, mesSeleccionado) {
  if (!area) return "Selecciona un area.";
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) return "Selecciona un año valido.";
  if (!Number.isInteger(mesSeleccionado) || mesSeleccionado < 1 || mesSeleccionado > 12) {
    return "Selecciona un mes valido.";
  }
  return "";
}

async function enviarResumenMensualPorCorreo(area, anio, mesSeleccionado) {
  const errorSeleccion = validarSeleccionListaMensual(area, anio, mesSeleccionado);
  if (errorSeleccion) {
    estadoImpresionCronograma.textContent = errorSeleccion;
    return false;
  }

  const configFormulario = leerConfigEmailJsDesdeFormulario();
  guardarConfigEmailJsCronograma(configFormulario);

  const { publicKey, serviceId, templateId, destino } = configFormulario;
  if (!destino || !publicKey || !serviceId || !templateId) {
    estadoImpresionCronograma.textContent =
      "Completa correo destino, Public Key, Service ID y Template ID en la configuracion.";
    return false;
  }

  if (typeof emailjs === "undefined") {
    estadoImpresionCronograma.textContent =
      "No se pudo cargar EmailJS. Revisa tu conexion a internet y recarga la pagina.";
    return false;
  }

  limpiarCacheOcurrencias();
  const resumen = construirResumenCorreoMantenimientos(area, anio, mesSeleccionado);
  if (resumen.vacio) {
    estadoImpresionCronograma.textContent = "No hay mantenimientos programados para enviar.";
    return false;
  }

  const subject = `PM programados - ${resumen.nombreMes} ${anio} (${resumen.areaEtiqueta})`;
  const message = [
    "Portal Mantenimiento EPI",
    `Periodo: ${resumen.nombreMes} ${anio}`,
    `Area: ${resumen.areaEtiqueta}`,
    `Dias con actividad: ${resumen.totalDias}`,
    "",
    resumen.texto,
  ].join("\n");

  estadoImpresionCronograma.textContent = "Enviando correo...";

  try {
    emailjs.init({ publicKey });
    await emailjs.send(serviceId, templateId, {
      to_email: destino,
      subject,
      message,
      area: resumen.areaEtiqueta,
      mes: resumen.nombreMes,
      anio: String(anio),
    });
    estadoImpresionCronograma.textContent = `Correo enviado a ${destino}.`;
    return true;
  } catch (error) {
    console.warn(error);
    estadoImpresionCronograma.textContent =
      "No se pudo enviar el correo. Revisa la configuracion de EmailJS y la plantilla.";
    return false;
  }
}

function verListaMensualCronograma(area, anio, mesSeleccionado) {
  resultadoListaMensual.innerHTML = "";
  const errorSeleccion = validarSeleccionListaMensual(area, anio, mesSeleccionado);
  if (errorSeleccion) {
    estadoImpresionCronograma.textContent = errorSeleccion;
    return;
  }

  const nombreMes = NOMBRES_MESES_LARGOS[mesSeleccionado - 1];
  const areas = obtenerAreasParaResumenMensual(area);
  const encabezadoArea = esTodasLasAreasImpresion(area)
    ? "Todas las areas"
    : area;
  const encabezado = `
    <h4 class="subtitulo-tabla">Resultado: ${escapeHtml(encabezadoArea)} - ${escapeHtml(
      nombreMes
    )} ${anio}</h4>
  `;

  const filas = [];
  areas.forEach((areaItem) => {
    const resumenMes = obtenerResumenDelMes(areaItem, anio, mesSeleccionado);
    resumenMes.forEach((item) => {
      filas.push(`
        <tr>
          <td>${escapeHtml(areaItem)}</td>
          <td>${item.fecha}</td>
          <td>${escapeHtml(item.maquinas.join(", "))}</td>
        </tr>
      `);
    });
  });

  if (filas.length === 0) {
    resultadoListaMensual.innerHTML = `
      ${encabezado}
      <p>Sin actividades programadas para este mes.</p>
    `;
    estadoImpresionCronograma.textContent = "No hay registros en el mes seleccionado.";
    return;
  }

  resultadoListaMensual.innerHTML = `
    ${encabezado}
    <table class="tabla-historial">
      <thead>
        <tr>
          <th>Area</th>
          <th>Fecha</th>
          <th>Maquinas programadas</th>
        </tr>
      </thead>
      <tbody>${filas.join("")}</tbody>
    </table>
  `;
  estadoImpresionCronograma.textContent = "Lista mensual generada.";
}

function renderCronogramaPreventivo() {
  limpiarCacheOcurrencias();
  sugerirAreaCronograma();
  calendarioCronograma.innerHTML = "";
  leyendaCronograma.textContent = "";
  estadoCronograma.textContent = "";
  const area = cronogramaArea.value;
  const anio = Number.parseInt(cronogramaAnio.value, 10);

  if (!area) {
    calendarioCronograma.innerHTML = "<p>Selecciona un area para ver el cronograma.</p>";
    if (resumenProgramacionAnual) {
      resumenProgramacionAnual.innerHTML = "";
    }
    return;
  }
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) {
    calendarioCronograma.innerHTML = "<p>Selecciona un año valido.</p>";
    if (resumenProgramacionAnual) {
      resumenProgramacionAnual.innerHTML = "";
    }
    return;
  }

  renderResumenProgramacionAnual(area, anio);
  const mapaProgramacionAutomatica = construirMapaProgramacionAutomatica(area, anio);

  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const diasSemana = ["L", "M", "M", "J", "V", "S", "D"];
  let totalProgramadas = 0;

  for (let mes = 1; mes <= 12; mes += 1) {
    const primerDia = new Date(anio, mes - 1, 1);
    const diasMes = new Date(anio, mes, 0).getDate();
    const desplazamiento = (primerDia.getDay() + 6) % 7;
    const cardMes = document.createElement("article");
    cardMes.className = "mes-card";
    const grid = document.createElement("div");
    grid.className = "grid-mes";

    diasSemana.forEach((diaNombre) => {
      const celda = document.createElement("div");
      celda.className = "dia-semana";
      celda.textContent = diaNombre;
      grid.appendChild(celda);
    });

    for (let i = 0; i < desplazamiento; i += 1) {
      const vacia = document.createElement("div");
      vacia.className = "dia-celda vacio";
      grid.appendChild(vacia);
    }

    for (let dia = 1; dia <= diasMes; dia += 1) {
      const programaciones = obtenerProgramacionesDelDia(
        area,
        anio,
        mes,
        dia,
        mapaProgramacionAutomatica
      );
      totalProgramadas += programaciones.length;
      const celda = document.createElement("button");
      celda.type = "button";
      celda.className = "dia-celda";
      if (programaciones.length > 0) {
        celda.classList.add("con-plan");
      }
      const etiquetaCantidad =
        programaciones.length > 0
          ? `${programaciones.length} maq.`
          : "Libre";
      celda.innerHTML = `
        <span class="dia-numero">${dia}</span>
        <span class="dia-cantidad">${etiquetaCantidad}</span>
      `;
      if (programaciones.length > 0) {
        celda.title = programaciones
          .map((item) => obtenerNombreMaquinaPorId(item.maquinaId))
          .join(", ");
      } else {
        celda.title = "Sin maquinas programadas";
      }
      celda.addEventListener("click", () =>
        abrirEditorDiaCronograma(area, anio, mes, dia)
      );
      grid.appendChild(celda);
    }

    cardMes.innerHTML = `<h4>${meses[mes - 1]}</h4>`;
    cardMes.appendChild(grid);
    calendarioCronograma.appendChild(cardMes);
  }

  const activasArea = registrosHojas.filter(
    (item) => item.area === area && item.activa !== false
  ).length;
  const inactivasArea = registrosHojas.filter(
    (item) =>
      item.area === area &&
      (item.activa === false || item.fechaBajaCirculacion)
  ).length;
  const maquinasConPm = registrosHojas.filter(
    (item) => item.area === area && parseFechaPreventivo(item.fechaPrimerPreventivo)
  ).length;

  leyendaCronograma.textContent =
    `Amarillo: PM automatico segun Hojas de vida (primer PM + frecuencia en meses). Año ${anio}: ${totalProgramadas} cita(s). Maquinas con datos PM: ${maquinasConPm}. Activas: ${activasArea}. Fuera de circulacion: ${inactivasArea}.`;
  if (totalProgramadas === 0 && maquinasConPm > 0) {
    estadoCronograma.textContent =
      "Hay maquinas registradas pero ninguna cita en este año. Revisa el resumen de arriba: si alli aparecen fechas y el calendario no, recarga con Ctrl+F5. Si el resumen dice «Sin fechas», revisa primer PM y frecuencia en Hojas de vida.";
  }
}

function maquinaCoincideConRegistro(maquina, registro) {
  if (registro.maquinaId) {
    return registro.maquinaId === maquina.id;
  }
  const codigoRegistro = normalizarTexto(registro.codigoMaquina || registro.codigo || "");
  const codigoMaquina = normalizarTexto(maquina.codigo || "");
  if (codigoRegistro && codigoMaquina && codigoRegistro === codigoMaquina) {
    return true;
  }
  const equipo = normalizarTexto(
    registro.maquinaEquipoLocacion || registro.equipo || ""
  );
  const nombre = normalizarTexto(maquina.nombre || "");
  const codigo = normalizarTexto(maquina.codigo || "");
  return equipo === nombre || equipo.includes(nombre) || equipo === codigo;
}

function renderTablaHistorialMaquina(maquina) {
  tablaHistorialPreventivo.innerHTML = "";
  tablaHistorialCorrectivo.innerHTML = "";

  const preventivos = registrosPreventivo.filter(
    (registro) =>
      registro.area === maquina.area && maquinaCoincideConRegistro(maquina, registro)
  );

  const correctivos = registrosCorrectivo.filter(
    (registro) =>
      (registro.proceso === maquina.area || registro.area === maquina.area) &&
      maquinaCoincideConRegistro(maquina, registro)
  );

  if (preventivos.length === 0) {
    tablaHistorialPreventivo.innerHTML =
      "<tr><td colspan='3'>Sin mantenimientos preventivos registrados.</td></tr>";
  } else {
    preventivos.forEach((registro) => {
      const fila = document.createElement("tr");
      const descripcion = (registro.descripcion || registro.actividad || "").trim();
      fila.innerHTML = `
        <td>${registro.fecha || "-"}</td>
        <td>${escapeHtml(descripcion || etiquetaArchivoPreventivo(registro))}</td>
        <td>${registro.area || "-"}</td>
      `;
      tablaHistorialPreventivo.appendChild(fila);
    });
  }

  if (correctivos.length === 0) {
    tablaHistorialCorrectivo.innerHTML =
      "<tr><td colspan='3'>Sin mantenimientos correctivos registrados.</td></tr>";
  } else {
    correctivos.forEach((registro) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${registro.fechaSolicitud || registro.fecha || "-"}</td>
        <td>${registro.descripcionSolicitud || registro.actividad || registro.falla || "-"}</td>
        <td>${registro.proceso || registro.area || "-"}</td>
      `;
      tablaHistorialCorrectivo.appendChild(fila);
    });
  }
}

function obtenerAreaRegistroHoja(registro) {
  return (registro?.area || "").trim();
}

function contarHojasPorArea(lista = registrosHojas) {
  const conteo = Object.fromEntries(AREAS_SISTEMA.map((area) => [area, 0]));
  conteo["Sin area"] = 0;
  lista.forEach((registro) => {
    const area = obtenerAreaRegistroHoja(registro);
    if (AREAS_SISTEMA.includes(area)) {
      conteo[area] += 1;
    } else {
      conteo["Sin area"] += 1;
    }
  });
  return conteo;
}

function filtrarRegistrosHojas(lista = registrosHojas) {
  const areaFiltro = filtroAreaHojas?.value || "";
  const textoFiltro = filtroTextoHojas?.value.trim().toLowerCase() || "";

  return lista
    .filter((registro) => {
      const area = obtenerAreaRegistroHoja(registro);
      if (areaFiltro === "__sin_area__") {
        if (area && AREAS_SISTEMA.includes(area)) return false;
      } else if (areaFiltro && area !== areaFiltro) {
        return false;
      }
      const textoBase = `${registro.nombre} ${registro.codigo} ${registro.marca} ${registro.modelo}`.toLowerCase();
      if (textoFiltro && !textoBase.includes(textoFiltro)) return false;
      return true;
    })
    .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"));
}

function construirHtmlItemHoja(registro) {
  const fuera = registro.activa === false || registro.fechaBajaCirculacion;
  const etiquetaEstado = fuera
    ? `<span class="etiqueta-inactiva">Fuera de circulacion${
        registro.fechaBajaCirculacion
          ? ` desde ${formatearFechaIso(registro.fechaBajaCirculacion)}`
          : ""
      }</span>`
    : `<span class="etiqueta-activa">En circulacion</span>`;
  const fotoHtml = registro.foto
    ? `<img class="tarjeta-maquina__foto" src="${registro.foto}" alt="Foto de ${escapeHtml(registro.nombre)}" />`
    : `<div class="tarjeta-maquina__foto tarjeta-maquina__foto--vacia">Sin foto</div>`;

  return `
    <article class="tarjeta-maquina item-hoja${fuera ? " inactiva" : ""}">
      <button type="button" class="tarjeta-maquina__ver" data-ver-hoja="${registro.id}">
        ${fotoHtml}
        <div class="tarjeta-maquina__cuerpo">
          <div class="tarjeta-maquina__cabecera">
            <h6 class="tarjeta-maquina__nombre">${escapeHtml(registro.nombre)}</h6>
            <span class="tarjeta-maquina__codigo">${escapeHtml(registro.codigo)}</span>
          </div>
          <p class="tarjeta-maquina__dato">${escapeHtml(registro.marca)} · ${escapeHtml(registro.modelo)}</p>
          <p class="tarjeta-maquina__dato">${escapeHtml(registro.ubicacion || "-")}</p>
          <p class="tarjeta-maquina__dato tarjeta-maquina__dato--pm">
            PM cada ${registro.frecuenciaPreventivoMeses || 12} mes(es)
          </p>
          <p class="tarjeta-maquina__dato">Primer PM: ${escapeHtml(registro.fechaPrimerPreventivo || "-")}</p>
          ${etiquetaEstado}
        </div>
      </button>
      <div class="tarjeta-maquina__acciones">
        <button type="button" class="btn-tabla-accion" data-editar-hoja-lista="${registro.id}">Editar</button>
        <button type="button" class="btn-tabla-accion btn-tabla-accion--eliminar" data-eliminar-hoja-lista="${registro.id}">Eliminar</button>
      </div>
    </article>
  `;
}

function construirBloqueTarjetasHojas(area, registros) {
  return `
    <section class="bloque-area-tarjetas">
      <header class="bloque-correctivo-area__encabezado">
        <h5>${escapeHtml(area)}</h5>
        <span>${registros.length} maquina(s)</span>
      </header>
      <div class="carrusel-maquinas-area" tabindex="0" aria-label="Maquinas de ${escapeHtml(area)}">
        ${registros.map((registro) => construirHtmlItemHoja(registro)).join("")}
      </div>
    </section>
  `;
}

function renderResumenHojasPorArea(conteo) {
  if (!resumenHojasAreas) return;

  const areaFiltro = filtroAreaHojas?.value || "";
  const total = registrosHojas.length;
  const tarjetas = [
    { clave: "", titulo: "Todas", cantidad: total },
    ...AREAS_SISTEMA.map((area) => ({
      clave: area,
      titulo: area,
      cantidad: conteo[area] || 0,
    })),
  ];

  if ((conteo["Sin area"] || 0) > 0) {
    tarjetas.push({
      clave: "__sin_area__",
      titulo: "Sin area",
      cantidad: conteo["Sin area"] || 0,
    });
  }

  resumenHojasAreas.innerHTML = tarjetas
    .map((tarjeta) => {
      const activa = tarjeta.clave === areaFiltro;
      return `
        <button
          type="button"
          class="tarjeta-correctivo-area${activa ? " activa" : ""}"
          data-area-hojas="${tarjeta.clave}"
        >
          <span class="tarjeta-correctivo-area__titulo">${escapeHtml(tarjeta.titulo)}</span>
          <strong class="tarjeta-correctivo-area__total">${tarjeta.cantidad}</strong>
          <span class="tarjeta-correctivo-area__etiqueta">maquinas</span>
        </button>
      `;
    })
    .join("");

  resumenHojasAreas.querySelectorAll("[data-area-hojas]").forEach((boton) => {
    boton.addEventListener("click", () => {
      if (!filtroAreaHojas) return;
      filtroAreaHojas.value = boton.getAttribute("data-area-hojas") || "";
      renderRegistrosHojas();
    });
  });
}

function renderRegistrosHojas() {
  if (!listaHojas) return;

  const conteo = contarHojasPorArea();
  renderResumenHojasPorArea(conteo);

  const hojasFiltradas = filtrarRegistrosHojas();
  const areaFiltro = filtroAreaHojas?.value || "";

  if (registrosHojas.length === 0) {
    listaHojas.innerHTML =
      "<p class='ventana-cronograma__vacio'>Aun no hay maquinas registradas.</p>";
    return;
  }

  if (hojasFiltradas.length === 0) {
    listaHojas.innerHTML =
      "<p class='ventana-cronograma__vacio'>No hay maquinas con los filtros actuales.</p>";
    return;
  }

  if (areaFiltro) {
    const tituloArea = areaFiltro === "__sin_area__" ? "Sin area" : areaFiltro;
    listaHojas.innerHTML = construirBloqueTarjetasHojas(tituloArea, hojasFiltradas);
    return;
  }

  const grupos = Object.fromEntries(AREAS_SISTEMA.map((area) => [area, []]));
  grupos["Sin area"] = [];

  hojasFiltradas.forEach((registro) => {
    const area = obtenerAreaRegistroHoja(registro);
    if (AREAS_SISTEMA.includes(area)) {
      grupos[area].push(registro);
    } else {
      grupos["Sin area"].push(registro);
    }
  });

  listaHojas.innerHTML = [...AREAS_SISTEMA, "Sin area"]
    .filter((area) => grupos[area].length > 0)
    .map((area) => construirBloqueTarjetasHojas(area, grupos[area]))
    .join("");
}

function llenarFormularioEditarHoja(registro) {
  document.getElementById("editAreaHoja").value = registro.area || "";
  document.getElementById("editNombreMaquina").value = registro.nombre || "";
  document.getElementById("editCodigoInterno").value = registro.codigo || "";
  document.getElementById("editMarcaMaquina").value = registro.marca || "";
  document.getElementById("editModeloMaquina").value = registro.modelo || "";
  document.getElementById("editSerialMaquina").value = registro.serial || "";
  document.getElementById("editUbicacionMaquina").value = registro.ubicacion || "";
  document.getElementById("editFrecuenciaPreventivoMaquina").value = String(
    registro.frecuenciaPreventivoMeses || 12
  );
  document.getElementById("editFechaPrimerPreventivoMaquina").value =
    registro.fechaPrimerPreventivo || "";
  document.getElementById("editFotoMaquina").value = "";
  editFotoActualTexto.textContent = registro.foto
    ? "Foto actual guardada. Sube otra solo si quieres reemplazarla."
    : "Sin foto guardada.";
}

function abrirEditarHoja(idRegistro) {
  const registro = registrosHojas.find((item) => item.id === idRegistro);
  if (!registro) return;
  hojaSeleccionadaId = registro.id;
  llenarFormularioEditarHoja(registro);
  estadoEditarHoja.textContent = "";
  abrirModal("modal-editar-hoja");
}

function sincronizarPreventivoConMaquina(maquina) {
  registrosPreventivo.forEach((registro) => {
    if (registro.maquinaId !== maquina.id) return;
    registro.area = maquina.area;
    registro.equipo = maquina.nombre;
  });
  guardarRegistrosPreventivo();
}

function abrirDetalleHoja(idRegistro) {
  const registro = registrosHojas.find((item) => item.id === idRegistro);
  if (!registro) return;
  hojaSeleccionadaId = registro.id;
  detalleHojaArea.textContent = registro.area;
  detalleHojaNombre.textContent = registro.nombre;
  detalleHojaCodigo.textContent = registro.codigo;
  detalleHojaMarca.textContent = registro.marca;
  detalleHojaModelo.textContent = registro.modelo;
  detalleHojaSerial.textContent = registro.serial;
  detalleHojaUbicacion.textContent = registro.ubicacion;
  detalleHojaFrecuencia.textContent = `${
    registro.frecuenciaPreventivoMeses || 12
  } mes(es)`;
  detalleHojaPrimerPreventivo.textContent = registro.fechaPrimerPreventivo || "-";
  detalleHojaEstado.textContent = textoEstadoMaquina(registro);
  const fuera = registro.activa === false || registro.fechaBajaCirculacion;
  filaDetalleHojaBaja.hidden = !registro.fechaBajaCirculacion;
  filaDetalleHojaMotivoBaja.hidden = !registro.motivoBaja;
  detalleHojaFechaBaja.textContent = registro.fechaBajaCirculacion
    ? formatearFechaIso(registro.fechaBajaCirculacion)
    : "-";
  detalleHojaMotivoBaja.textContent = registro.motivoBaja || "-";
  panelBajaHoja.hidden = fuera;
  reactivarHojaBtn.hidden = !fuera;
  fechaBajaHoja.value = registro.fechaBajaCirculacion || "";
  motivoBajaHoja.value = registro.motivoBaja || "";
  detalleHojaFoto.src = registro.foto || "";
  detalleHojaFoto.hidden = !registro.foto;
  renderTablaHistorialMaquina(registro);
  abrirModal("modal-detalle-hojas");
}

function abrirDetalleRegistro(idRegistro) {
  const registro = registrosPreventivo.find((item) => item.id === idRegistro);
  if (!registro) return;

  registroSeleccionadoId = registro.id;
  detalleArea.textContent = registro.area || "Sin area";
  detalleEquipo.textContent = registro.equipo;
  detalleFecha.textContent = registro.fecha;
  if (detalleDescripcionPreventivo) {
    const descripcion = (registro.descripcion || registro.actividad || "").trim();
    detalleDescripcionPreventivo.textContent = descripcion || "Sin descripcion registrada.";
  }
  renderDetalleArchivoPreventivo(registro);
  abrirModal("modal-detalle-preventivo");
}

botonesMenu.forEach((boton) => {
  boton.addEventListener("click", () => {
    mostrarVista(boton.dataset.vista);
  });
});

document.addEventListener("click", (event) => {
  const objetivo = event.target;
  if (!(objetivo instanceof HTMLElement)) return;

  const btnVista = objetivo.closest("[data-open-vista]");
  if (btnVista instanceof HTMLElement) {
    const idVista = btnVista.getAttribute("data-open-vista");
    if (idVista) mostrarVista(idVista);
    return;
  }

  const btnModal = objetivo.closest("[data-open-modal]");
  if (btnModal instanceof HTMLElement) {
    const idModal = btnModal.getAttribute("data-open-modal");
    if (idModal) abrirModal(idModal);
  }
});

filtroAreaPreventivo.addEventListener("change", renderRegistrosPreventivo);
filtroFechaPreventivo.addEventListener("change", renderRegistrosPreventivo);
areaPreventivo.addEventListener("change", actualizarOpcionesEquiposPreventivo);
cronogramaArea.addEventListener("change", renderCronogramaPreventivo);
cronogramaAnio.addEventListener("change", renderCronogramaPreventivo);
cronogramaAnio.addEventListener("input", renderCronogramaPreventivo);
imprimirCronogramaBtn.addEventListener("click", () => {
  impresionArea.value = cronogramaArea.value || "__TODAS__";
  impresionAnio.value = cronogramaAnio.value || String(new Date().getFullYear());
  impresionMes.value = String(new Date().getMonth() + 1);
  estadoImpresionCronograma.textContent = "";
  resultadoListaMensual.innerHTML = "";
  cargarConfigEmailJsEnFormulario();
  abrirModal("modal-impresion-cronograma");
});
formImpresionCronograma.addEventListener("submit", (event) => {
  event.preventDefault();
  const area = impresionArea.value;
  const anio = Number(impresionAnio.value);
  const mes = Number(impresionMes.value);
  verListaMensualCronograma(area, anio, mes);
});
if (enviarCorreoCronogramaBtn) {
  enviarCorreoCronogramaBtn.addEventListener("click", async () => {
    const area = impresionArea.value;
    const anio = Number.parseInt(impresionAnio.value, 10);
    const mes = Number.parseInt(impresionMes.value, 10);
    await enviarResumenMensualPorCorreo(area, anio, mes);
  });
}
[
  emailjsDestinoCronograma,
  emailjsPublicKeyCronograma,
  emailjsServiceIdCronograma,
  emailjsTemplateIdCronograma,
].forEach((campo) => {
  if (!campo) return;
  const guardar = () => guardarConfigEmailJsCronograma(leerConfigEmailJsDesdeFormulario());
  campo.addEventListener("change", guardar);
  campo.addEventListener("blur", guardar);
});
cargarConfigEmailJsEnFormulario();
limpiarListaMensualBtn.addEventListener("click", () => {
  resultadoListaMensual.innerHTML = "";
  estadoImpresionCronograma.textContent = "";
});

exportarPreventivoBtn.addEventListener("click", () => {
  if (registrosPreventivo.length === 0 && registrosHojas.length === 0) {
    estadoPreventivo.textContent = "No hay datos para exportar.";
    return;
  }

  const fecha = new Date().toISOString().slice(0, 10);
  const respaldoGeneral = construirRespaldoGeneral();
  descargarJson(`respaldo-general-${fecha}.json`, respaldoGeneral);
  estadoPreventivo.textContent = "Respaldo general exportado correctamente.";
});

importarPreventivoBtn.addEventListener("click", () => {
  archivoImportarPreventivo.click();
});

archivoImportarPreventivo.addEventListener("change", async () => {
  const archivo = archivoImportarPreventivo.files?.[0];
  if (!archivo) return;

  try {
    const texto = await archivo.text();
    const datos = JSON.parse(texto);

    if (Array.isArray(datos)) {
      // Compatibilidad con respaldos viejos (solo preventivo)
      registrosPreventivo = datos.map((registro) => normalizarRegistroPreventivo(registro));
    } else if (datos && typeof datos === "object" && datos.data) {
      const preventivo = datos.data.preventivo;
      const hojasDeVida = datos.data.hojasDeVida;
      const correctivo = datos.data.correctivo;
      const cronograma = datos.data.cronogramaPreventivo;
      if (!Array.isArray(preventivo)) {
        estadoPreventivo.textContent =
          "El archivo no trae datos validos de preventivo.";
        return;
      }
      if (hojasDeVida !== undefined && !Array.isArray(hojasDeVida)) {
        estadoPreventivo.textContent =
          "El archivo no trae datos validos de hojas de vida.";
        return;
      }
      if (correctivo !== undefined && !Array.isArray(correctivo)) {
        estadoPreventivo.textContent =
          "El archivo no trae datos validos de correctivo.";
        return;
      }
      if (cronograma !== undefined && !Array.isArray(cronograma)) {
        estadoPreventivo.textContent =
          "El archivo no trae datos validos de cronograma preventivo.";
        return;
      }
      registrosPreventivo = preventivo.map((registro) =>
        normalizarRegistroPreventivo(registro)
      );
      registrosHojas = Array.isArray(hojasDeVida)
        ? hojasDeVida.map((registro) => normalizarMaquinaHoja(registro))
        : [];
      registrosCorrectivo = Array.isArray(correctivo)
        ? correctivo.map((registro) => normalizarRegistroCorrectivo(registro))
        : [];
      cronogramaPreventivo = Array.isArray(cronograma) ? cronograma : [];
      excepcionesCronograma = Array.isArray(datos.data.excepcionesCronograma)
        ? datos.data.excepcionesCronograma
        : [];
    } else {
      estadoPreventivo.textContent = "El archivo no tiene formato valido.";
      return;
    }

    guardarRegistrosPreventivo();
    guardarRegistrosHojas();
    guardarRegistrosCorrectivo();
    guardarCronogramaPreventivo();
    guardarExcepcionesCronograma();
    if (typeof importarHorasProgramadasDesdeRespaldo === "function" && datos.data.indicadores) {
      importarHorasProgramadasDesdeRespaldo(datos.data.indicadores);
    }
    renderRegistrosPreventivo();
    renderRegistrosHojas();
    actualizarOpcionesEquiposPreventivo();
    actualizarProgramacionEnPantalla();
    renderTablaCorrectivo();
    if (typeof renderPanelIndicadores === "function") {
      renderPanelIndicadores();
    }
    estadoPreventivo.textContent = "Respaldo general importado correctamente.";
  } catch (error) {
    estadoPreventivo.textContent = "No se pudo importar el archivo.";
  } finally {
    archivoImportarPreventivo.value = "";
  }
});

overlay.addEventListener("click", cerrarTodo);
botonesCerrar.forEach((boton) => boton.addEventListener("click", cerrarTodo));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    cerrarTodo();
  }
});

formPreventivo.addEventListener("submit", async (event) => {
  event.preventDefault();
  const datos = new FormData(formPreventivo);
  const archivoEntrada = datos.get("archivo");
  const maquinaId = datos.get("maquinaId")?.toString() || "";
  const maquina = registrosHojas.find((item) => item.id === maquinaId);

  if (!maquina) {
    estadoPreventivo.textContent =
      "Selecciona una maquina valida registrada en hojas de vida.";
    return;
  }

  const registroExistente = preventivoEditandoId
    ? registrosPreventivo.find((item) => item.id === preventivoEditandoId)
    : null;

  const archivoPrevio = obtenerDatosArchivoPreventivo(registroExistente);
  let archivoBase64 = archivoPrevio.data;
  let archivoNombre = archivoPrevio.nombre;
  let archivoTipo = archivoPrevio.tipo;
  const hayArchivoNuevo =
    archivoEntrada instanceof File && archivoEntrada.size > 0;

  if (!preventivoEditandoId && !hayArchivoNuevo) {
    estadoPreventivo.textContent = "Debes seleccionar un archivo PDF o Word.";
    return;
  }

  if (hayArchivoNuevo) {
    if (!esArchivoPreventivoValido(archivoEntrada)) {
      estadoPreventivo.textContent = "Solo se permiten archivos PDF, DOC o DOCX.";
      return;
    }
    if (archivoEntrada.size > MAX_ARCHIVO_PREVENTIVO_BYTES) {
      estadoPreventivo.textContent = "El archivo debe pesar maximo 5 MB.";
      return;
    }
    try {
      archivoBase64 = (await leerArchivoComoBase64(archivoEntrada)).toString();
      archivoNombre = archivoEntrada.name;
      archivoTipo = archivoEntrada.type || "application/octet-stream";
    } catch (error) {
      estadoPreventivo.textContent = "No fue posible guardar el archivo.";
      return;
    }
  }

  const descripcionTexto = datos.get("descripcion")?.toString().trim() || "";
  if (!descripcionTexto) {
    estadoPreventivo.textContent = "Debes escribir la actividad / descripcion.";
    descripcionPreventivo?.focus();
    return;
  }

  const registroActualizado = normalizarRegistroPreventivo({
    id: preventivoEditandoId || Date.now().toString(),
    area: maquina.area,
    maquinaId: maquina.id,
    equipo: maquina.nombre,
    fecha: datos.get("fecha").toString(),
    descripcion: descripcionTexto,
    archivo: archivoBase64,
    archivoNombre,
    archivoTipo,
  });

  if (preventivoEditandoId) {
    const indice = registrosPreventivo.findIndex(
      (item) => item.id === preventivoEditandoId
    );
    if (indice === -1) return;
    registrosPreventivo[indice] = registroActualizado;
    estadoPreventivo.textContent = "Registro actualizado correctamente.";
  } else {
    registrosPreventivo.unshift(registroActualizado);
    estadoPreventivo.textContent = "Registro guardado correctamente.";
  }

  guardarRegistrosPreventivo();
  renderRegistrosPreventivo();
  prepararFormularioPreventivo();
});

formHojas.addEventListener("submit", async (event) => {
  event.preventDefault();
  const datos = new FormData(formHojas);
  const archivoFoto = datos.get("foto");

  let fotoBase64 = "";
  if (archivoFoto instanceof File && archivoFoto.size > 0) {
    if (archivoFoto.size > 2 * 1024 * 1024) {
      estadoHojas.textContent = "La foto debe pesar maximo 2 MB.";
      return;
    }
    try {
      fotoBase64 = (await leerFotoComoBase64(archivoFoto)).toString();
    } catch (error) {
      estadoHojas.textContent = "No fue posible guardar la foto de la maquina.";
      return;
    }
  }

  const registro = {
    id: Date.now().toString(),
    area: datos.get("area").toString(),
    nombre: datos.get("nombre").toString().trim(),
    codigo: datos.get("codigo").toString().trim(),
    marca: datos.get("marca").toString().trim(),
    modelo: datos.get("modelo").toString().trim(),
    serial: datos.get("serial").toString().trim(),
    ubicacion: datos.get("ubicacion").toString().trim(),
    frecuenciaPreventivoMeses: Math.max(
      1,
      Number.parseInt(datos.get("frecuenciaPreventivoMeses").toString(), 10) || 12
    ),
    fechaPrimerPreventivo: datos.get("fechaPrimerPreventivo").toString(),
    foto: fotoBase64,
    activa: true,
    fechaBajaCirculacion: "",
    motivoBaja: "",
  };
  const maquinaGuardada = normalizarMaquinaHoja(registro);
  registrosHojas.unshift(maquinaGuardada);
  guardarRegistrosHojas();
  renderRegistrosHojas();
  actualizarOpcionesEquiposPreventivo();
  sincronizarVistaCronogramaConMaquina(maquinaGuardada);
  actualizarProgramacionEnPantalla();
  formHojas.reset();
  const base = parseFechaPreventivo(maquinaGuardada.fechaPrimerPreventivo);
  const anioInicio = base ? base.anio : new Date().getFullYear();
  estadoHojas.textContent =
    `Maquina registrada. PM automatico cada ${maquinaGuardada.frecuenciaPreventivoMeses} mes(es) desde ${formatearFechaIso(maquinaGuardada.fechaPrimerPreventivo)}. Revisa el cronograma en ${anioInicio} y cambia de año para ver el resto.`;
});

listaPreventivo.addEventListener("click", (event) => {
  const objetivo = event.target;
  if (!(objetivo instanceof HTMLElement)) return;

  const btnEditar = objetivo.closest("[data-editar-preventivo]");
  if (btnEditar instanceof HTMLElement) {
    const registro = registrosPreventivo.find(
      (item) => item.id === btnEditar.getAttribute("data-editar-preventivo")
    );
    if (!registro) return;
    llenarFormularioPreventivo(registro);
    formPreventivo.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const btnEliminar = objetivo.closest("[data-eliminar-preventivo]");
  if (btnEliminar instanceof HTMLElement) {
    eliminarPreventivoPorId(btnEliminar.getAttribute("data-eliminar-preventivo"));
    return;
  }

  const btnVer = objetivo.closest("[data-ver-preventivo]");
  if (btnVer instanceof HTMLElement) {
    abrirDetalleRegistro(btnVer.getAttribute("data-ver-preventivo"));
  }
});

if (editarRegistroBtn) {
  editarRegistroBtn.addEventListener("click", () => {
    if (!registroSeleccionadoId) return;
    const registro = registrosPreventivo.find(
      (item) => item.id === registroSeleccionadoId
    );
    if (!registro) return;
    cerrarModales();
    mostrarVista("vista-preventivo-registro");
    llenarFormularioPreventivo(registro);
  });
}

if (cancelarEdicionPreventivoBtn) {
  cancelarEdicionPreventivoBtn.addEventListener("click", () => {
    prepararFormularioPreventivo();
    estadoPreventivo.textContent = "Edicion cancelada.";
  });
}

eliminarRegistroBtn.addEventListener("click", () => {
  if (!registroSeleccionadoId) return;
  eliminarPreventivoPorId(registroSeleccionadoId);
  cerrarTodo();
});

filtroAreaHojas.addEventListener("change", renderRegistrosHojas);
filtroTextoHojas.addEventListener("input", renderRegistrosHojas);

listaHojas.addEventListener("click", (event) => {
  const objetivo = event.target;
  if (!(objetivo instanceof HTMLElement)) return;

  const btnEditar = objetivo.closest("[data-editar-hoja-lista]");
  if (btnEditar instanceof HTMLElement) {
    abrirEditarHoja(btnEditar.getAttribute("data-editar-hoja-lista"));
    return;
  }

  const btnEliminar = objetivo.closest("[data-eliminar-hoja-lista]");
  if (btnEliminar instanceof HTMLElement) {
    eliminarHojaPorId(btnEliminar.getAttribute("data-eliminar-hoja-lista"));
    cerrarTodo();
    return;
  }

  const btnVer = objetivo.closest("[data-ver-hoja]");
  if (btnVer instanceof HTMLElement) {
    abrirDetalleHoja(btnVer.getAttribute("data-ver-hoja"));
  }
});

editarHojaBtn.addEventListener("click", () => {
  if (!hojaSeleccionadaId) return;
  abrirEditarHoja(hojaSeleccionadaId);
});

formEditarHoja.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!hojaSeleccionadaId) return;

  const registro = registrosHojas.find((item) => item.id === hojaSeleccionadaId);
  if (!registro) {
    estadoEditarHoja.textContent = "No se encontro la maquina.";
    return;
  }

  const datos = new FormData(formEditarHoja);
  const archivoFoto = datos.get("foto");
  let fotoBase64 = registro.foto || "";

  if (archivoFoto instanceof File && archivoFoto.size > 0) {
    if (archivoFoto.size > 2 * 1024 * 1024) {
      estadoEditarHoja.textContent = "La foto debe pesar maximo 2 MB.";
      return;
    }
    try {
      fotoBase64 = (await leerFotoComoBase64(archivoFoto)).toString();
    } catch (error) {
      estadoEditarHoja.textContent = "No fue posible guardar la foto.";
      return;
    }
  }

  const actualizado = normalizarMaquinaHoja({
    ...registro,
    area: datos.get("area").toString(),
    nombre: datos.get("nombre").toString().trim(),
    codigo: datos.get("codigo").toString().trim(),
    marca: datos.get("marca").toString().trim(),
    modelo: datos.get("modelo").toString().trim(),
    serial: datos.get("serial").toString().trim(),
    ubicacion: datos.get("ubicacion").toString().trim(),
    frecuenciaPreventivoMeses: Math.max(
      1,
      Number.parseInt(datos.get("frecuenciaPreventivoMeses").toString(), 10) || 12
    ),
    fechaPrimerPreventivo: datos.get("fechaPrimerPreventivo").toString(),
    foto: fotoBase64,
  });

  const indice = registrosHojas.findIndex((item) => item.id === hojaSeleccionadaId);
  if (indice === -1) return;
  registrosHojas[indice] = actualizado;

  guardarRegistrosHojas();
  sincronizarPreventivoConMaquina(actualizado);
  renderRegistrosHojas();
  actualizarOpcionesEquiposPreventivo();
  sincronizarVistaCronogramaConMaquina(actualizado);
  actualizarProgramacionEnPantalla();
  estadoHojas.textContent = "Maquina actualizada correctamente.";
  estadoEditarHoja.textContent = "Cambios guardados.";
  abrirDetalleHoja(hojaSeleccionadaId);
});

eliminarHojaBtn.addEventListener("click", () => {
  if (!hojaSeleccionadaId) return;
  eliminarHojaPorId(hojaSeleccionadaId);
  cerrarTodo();
});

agregarMaquinaDiaBtn.addEventListener("click", () => {
  if (!diaCronogramaContexto) return;
  const { area, anio, mes, dia } = diaCronogramaContexto;
  const maquinaId = agregarMaquinaDiaCronograma.value;
  if (!maquinaId) {
    estadoDiaCronograma.textContent = "Selecciona una maquina.";
    return;
  }
  const programaciones = obtenerProgramacionesDelDia(area, anio, mes, dia);
  if (programaciones.some((item) => item.maquinaId === maquinaId)) {
    estadoDiaCronograma.textContent = "Esa maquina ya esta en este dia.";
    return;
  }
  const maquina = obtenerMaquinaPorId(maquinaId);
  if (
    maquina &&
    maquinaCoincideFrecuenciaPreventiva(maquina, anio, mes, dia) &&
    !estaExcluidaEnFecha(maquinaId, area, anio, mes, dia)
  ) {
    estadoDiaCronograma.textContent =
      "Esa maquina ya esta programada automaticamente este dia.";
    return;
  }
  agregarProgramacionPuntual(area, anio, mes, dia, maquinaId);
  renderEditorDiaCronograma();
  renderCronogramaPreventivo();
  estadoDiaCronograma.textContent = "Maquina agregada solo para esta fecha.";
});

darBajaHojaBtn.addEventListener("click", () => {
  if (!hojaSeleccionadaId) return;
  const registro = registrosHojas.find((item) => item.id === hojaSeleccionadaId);
  if (!registro) return;
  const fecha = fechaBajaHoja.value;
  if (!fecha) {
    estadoHojas.textContent = "Indica la fecha de salida de circulacion.";
    return;
  }
  registro.activa = false;
  registro.fechaBajaCirculacion = fecha;
  registro.motivoBaja = motivoBajaHoja.value.trim();
  guardarRegistrosHojas();
  renderRegistrosHojas();
  actualizarOpcionesEquiposPreventivo();
  actualizarProgramacionEnPantalla();
  if (diaCronogramaContexto) renderEditorDiaCronograma();
  abrirDetalleHoja(hojaSeleccionadaId);
  estadoHojas.textContent =
    "Salida registrada. La maquina deja de aparecer en el cronograma desde esa fecha.";
});

reactivarHojaBtn.addEventListener("click", () => {
  if (!hojaSeleccionadaId) return;
  const registro = registrosHojas.find((item) => item.id === hojaSeleccionadaId);
  if (!registro) return;
  registro.activa = true;
  registro.fechaBajaCirculacion = "";
  registro.motivoBaja = "";
  guardarRegistrosHojas();
  renderRegistrosHojas();
  actualizarOpcionesEquiposPreventivo();
  actualizarProgramacionEnPantalla();
  if (diaCronogramaContexto) renderEditorDiaCronograma();
  abrirDetalleHoja(hojaSeleccionadaId);
  estadoHojas.textContent = "Maquina reactivada en el cronograma.";
});

if (corrHoraSolicitud) {
  corrHoraSolicitud.addEventListener("change", actualizarTiempoRespuestaFormulario);
}
if (corrHoraRespuesta) {
  corrHoraRespuesta.addEventListener("change", actualizarTiempoRespuestaFormulario);
}
if (corrMaquinaSelect) {
  corrMaquinaSelect.addEventListener("change", () => {
    const maquina = registrosHojas.find((item) => item.id === corrMaquinaSelect.value);
    if (!maquina) return;
    corrProceso.value = maquina.area;
    corrMaquinaEquipo.value = `${maquina.nombre} - ${maquina.ubicacion}`;
    corrCodigoMaquina.value = maquina.codigo;
  });
}
if (filtroTextoCorrectivo) {
  filtroTextoCorrectivo.addEventListener("input", renderTablaCorrectivo);
}
if (filtroAreaCorrectivo) {
  filtroAreaCorrectivo.addEventListener("change", renderTablaCorrectivo);
}
if (exportarCorrectivoCsvBtn) {
  exportarCorrectivoCsvBtn.addEventListener("click", exportarCorrectivoCsv);
}
if (cancelarEdicionCorrectivoBtn) {
  cancelarEdicionCorrectivoBtn.addEventListener("click", () => {
    prepararFormularioCorrectivo();
    if (estadoCorrectivo) estadoCorrectivo.textContent = "Edicion cancelada.";
  });
}
if (formCorrectivo) {
  formCorrectivo.addEventListener("submit", (event) => {
    event.preventDefault();
    const datos = new FormData(formCorrectivo);
    const tiposSolicitud = datos.getAll("tipoSolicitud").map((item) => item.toString());
    if (tiposSolicitud.length === 0) {
      if (estadoCorrectivo) {
        estadoCorrectivo.textContent = "Selecciona al menos un tipo de solicitud.";
      }
      return;
    }
    const maquinaId = corrMaquinaSelect?.value || "";
    const registroBase = {
      numeroSolicitud:
        Number.parseInt(datos.get("numeroSolicitud")?.toString(), 10) ||
        obtenerSiguienteNumeroSolicitud(),
      fechaSolicitud: datos.get("fechaSolicitud").toString(),
      horaSolicitud: datos.get("horaSolicitud").toString(),
      nombreSolicitante: datos.get("nombreSolicitante").toString().trim(),
      horaRespuesta: datos.get("horaRespuesta")?.toString() || "",
      tiempoRespuesta: calcularTiempoRespuesta(
        datos.get("horaSolicitud")?.toString(),
        datos.get("horaRespuesta")?.toString()
      ),
      horaInicioSolicitud: datos.get("horaInicioSolicitud")?.toString() || "",
      horaFinSolicitud: datos.get("horaFinSolicitud")?.toString() || "",
      proceso: datos.get("proceso").toString(),
      area: datos.get("proceso").toString(),
      maquinaEquipoLocacion: datos.get("maquinaEquipoLocacion").toString().trim(),
      codigoMaquina: datos.get("codigoMaquina").toString().trim(),
      maquinaId,
      estadoMaquina: datos.get("estadoMaquina").toString(),
      tiposSolicitud,
      descripcionSolicitud: datos.get("descripcionSolicitud").toString().trim(),
      solucionSolicitud: datos.get("solucionSolicitud")?.toString().trim() || "",
      fechaCierre: datos.get("fechaCierre")?.toString() || "",
      horaCierre: datos.get("horaCierre")?.toString() || "",
      quienRevisa: datos.get("quienRevisa")?.toString().trim() || "",
    };

    if (correctivoEditandoId) {
      const indice = registrosCorrectivo.findIndex(
        (item) => item.id === correctivoEditandoId
      );
      if (indice === -1) return;
      registrosCorrectivo[indice] = normalizarRegistroCorrectivo({
        ...registrosCorrectivo[indice],
        ...registroBase,
      });
      if (estadoCorrectivo) {
        estadoCorrectivo.textContent = "Solicitud actualizada correctamente.";
      }
    } else {
      registrosCorrectivo.unshift(
        normalizarRegistroCorrectivo({
          id: Date.now().toString(),
          creadoEn: new Date().toISOString(),
          ...registroBase,
        })
      );
      if (estadoCorrectivo) {
        estadoCorrectivo.textContent = "Solicitud registrada correctamente.";
      }
    }

    guardarRegistrosCorrectivo();
    renderTablaCorrectivo();
    prepararFormularioCorrectivo();
  });
}

if (inicioCronogramaAnio) {
  inicioCronogramaAnio.addEventListener("change", renderPanelCronogramaInicio);
  inicioCronogramaAnio.addEventListener("input", renderPanelCronogramaInicio);
}

cargarRegistrosPreventivo();
cargarRegistrosHojas();
cargarRegistrosCorrectivo();
cargarCronogramaPreventivo();
cargarExcepcionesCronograma();
configurarVistasPrincipales();
configurarCorreccionOrtografica();
if (formEditarHoja) {
  formEditarHoja.querySelectorAll("input[type='text']").forEach((campo) => {
    campo.setAttribute("lang", "es");
    campo.setAttribute("spellcheck", "true");
  });
}
const anioActualSistema = new Date().getFullYear();
cronogramaAnio.value = String(anioActualSistema);
if (inicioCronogramaAnio) {
  inicioCronogramaAnio.value = String(anioActualSistema);
}
actualizarOpcionesEquiposPreventivo();
renderRegistrosPreventivo();
renderRegistrosHojas();
actualizarProgramacionEnPantalla();
renderTablaCorrectivo();
