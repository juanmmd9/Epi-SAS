/**
 * Modulo Formatos de mantenimiento — GC-RE-009 No conformidades.
 */
const CLAVE_NO_CONFORMIDADES = "formatos_no_conformidades_v1";
const CLAVE_CONTADOR_NC = "formatos_contador_nc_v1";
const PLANTILLA_PDF_GCRE009 = "templates/GC-RE-009-v2.pdf";

const ORIGENES_NC = [
  { clave: "auditoria", etiqueta: "Auditoria" },
  { clave: "queja", etiqueta: "Queja de Cliente" },
  { clave: "producto", etiqueta: "Producto No Conforme" },
  { clave: "indicador", etiqueta: "Indicador" },
  { clave: "proceso", etiqueta: "Proceso Interno" },
];

let registrosNoConformidad = [];
let ncEditandoId = null;
let ncPendientePrefill = null;
let formatosInicializado = false;

function escapeHtmlFormatos(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function marcarOrigenEnHtml(origen) {
  return ORIGENES_NC.map((item) => {
    const marcado = item.clave === origen ? "(X)" : "( )";
    return `${marcado} ${item.etiqueta}`;
  }).join(" | ");
}

function marcarSiNo(valor) {
  if (valor === "si") return "(X) SI | ( ) NO";
  if (valor === "no") return "( ) SI | (X) NO";
  return "( ) SI | ( ) NO";
}

function obtenerSiguienteNumeroNc() {
  const actual = Number.parseInt(localStorage.getItem(CLAVE_CONTADOR_NC) || "0", 10);
  const siguiente = Number.isFinite(actual) ? actual + 1 : 1;
  localStorage.setItem(CLAVE_CONTADOR_NC, String(siguiente));
  return siguiente;
}

function sincronizarContadorNc(registros) {
  const maxNumero = registros.reduce(
    (max, item) => Math.max(max, Number.parseInt(item.numero, 10) || 0),
    0
  );
  const guardado = Number.parseInt(localStorage.getItem(CLAVE_CONTADOR_NC) || "0", 10);
  if (maxNumero > guardado) {
    localStorage.setItem(CLAVE_CONTADOR_NC, String(maxNumero));
  }
}

function cargarNoConformidades() {
  try {
    const guardados = localStorage.getItem(CLAVE_NO_CONFORMIDADES);
    registrosNoConformidad = guardados ? JSON.parse(guardados) : [];
    if (!Array.isArray(registrosNoConformidad)) registrosNoConformidad = [];
    sincronizarContadorNc(registrosNoConformidad);
  } catch (error) {
    registrosNoConformidad = [];
  }
}

function guardarNoConformidades() {
  localStorage.setItem(CLAVE_NO_CONFORMIDADES, JSON.stringify(registrosNoConformidad));
}

function obtenerNoConformidadesRespaldo() {
  return registrosNoConformidad;
}

function importarNoConformidadesDesdeRespaldo(lista) {
  if (!Array.isArray(lista)) return;
  registrosNoConformidad = lista.map((item) => normalizarRegistroNc(item));
  sincronizarContadorNc(registrosNoConformidad);
  guardarNoConformidades();
}

function filaPlanAccionVacia() {
  return { actividad: "", responsable: "", fechaEntrega: "", evidencia: "" };
}

function filaSeguimientoVacia() {
  return { actividad: "", cumplido: "", fueEficaz: "", porque: "" };
}

function normalizarRegistroNc(registro) {
  return {
    id: registro.id || Date.now().toString(),
    numero: String(registro.numero || ""),
    area: registro.area || "",
    fechaDeteccion: registro.fechaDeteccion || "",
    origen: registro.origen || "proceso",
    origenIndicador: registro.origenIndicador || null,
    descripcion: registro.descripcion || "",
    detectadaPorNombre: registro.detectadaPorNombre || "",
    detectadaPorCargo: registro.detectadaPorCargo || "",
    tratamientoInmediato: registro.tratamientoInmediato || "",
    tratamientoInmediatoPor: registro.tratamientoInmediatoPor || "",
    tratamientoInmediatoFecha: registro.tratamientoInmediatoFecha || "",
    herramientaCausa: registro.herramientaCausa || "",
    resumenCausa: registro.resumenCausa || "",
    analisisPor: registro.analisisPor || "",
    analisisFecha: registro.analisisFecha || "",
    requiereAccionFormal: registro.requiereAccionFormal || "",
    planAccion: Array.isArray(registro.planAccion) && registro.planAccion.length
      ? registro.planAccion
      : [filaPlanAccionVacia(), filaPlanAccionVacia()],
    seguimientoCumplimiento: registro.seguimientoCumplimiento || "",
    seguimientoEficacia: registro.seguimientoEficacia || "",
    seguimientoFilas: Array.isArray(registro.seguimientoFilas) && registro.seguimientoFilas.length
      ? registro.seguimientoFilas
      : [filaSeguimientoVacia(), filaSeguimientoVacia()],
    verificadoPorNombre: registro.verificadoPorNombre || "",
    verificadoPorCargo: registro.verificadoPorCargo || "",
    tratamientoEficaz: registro.tratamientoEficaz || "",
    tratamientoEficazPorque: registro.tratamientoEficazPorque || "",
    pdfEnIdb: Boolean(registro.pdfEnIdb),
    creadoEn: registro.creadoEn || new Date().toISOString(),
  };
}

function obtenerFormGcRe009() {
  return document.getElementById("formGcRe009");
}

function leerFilasPlanAccion() {
  return [...document.querySelectorAll("#tablaPlanAccionGcRe009 tbody tr")].map((fila) => ({
    actividad: fila.querySelector("[data-plan-actividad]")?.value.trim() || "",
    responsable: fila.querySelector("[data-plan-responsable]")?.value.trim() || "",
    fechaEntrega: fila.querySelector("[data-plan-fecha]")?.value || "",
    evidencia: fila.querySelector("[data-plan-evidencia]")?.value.trim() || "",
  }));
}

function leerFilasSeguimiento() {
  return [...document.querySelectorAll("#tablaSeguimientoGcRe009 tbody tr")].map((fila) => ({
    actividad: fila.querySelector("[data-seg-actividad]")?.value.trim() || "",
    cumplido: fila.querySelector("[data-seg-cumplido]")?.value || "",
    fueEficaz: fila.querySelector("[data-seg-eficaz]")?.value || "",
    porque: fila.querySelector("[data-seg-porque]")?.value.trim() || "",
  }));
}

function leerFormularioGcRe009() {
  const form = obtenerFormGcRe009();
  if (!form) return null;
  const datos = new FormData(form);
  return normalizarRegistroNc({
    id: ncEditandoId || Date.now().toString(),
    numero: document.getElementById("ncNumero")?.value || "",
    area: datos.get("area")?.toString() || "",
    fechaDeteccion: datos.get("fechaDeteccion")?.toString() || "",
    origen: datos.get("origen")?.toString() || "proceso",
    descripcion: datos.get("descripcion")?.toString().trim() || "",
    detectadaPorNombre: datos.get("detectadaPorNombre")?.toString().trim() || "",
    detectadaPorCargo: datos.get("detectadaPorCargo")?.toString().trim() || "",
    tratamientoInmediato: datos.get("tratamientoInmediato")?.toString().trim() || "",
    tratamientoInmediatoPor: datos.get("tratamientoInmediatoPor")?.toString().trim() || "",
    tratamientoInmediatoFecha: datos.get("tratamientoInmediatoFecha")?.toString() || "",
    herramientaCausa: datos.get("herramientaCausa")?.toString().trim() || "",
    resumenCausa: datos.get("resumenCausa")?.toString().trim() || "",
    analisisPor: datos.get("analisisPor")?.toString().trim() || "",
    analisisFecha: datos.get("analisisFecha")?.toString() || "",
    requiereAccionFormal: datos.get("requiereAccionFormal")?.toString() || "",
    planAccion: leerFilasPlanAccion(),
    seguimientoCumplimiento: datos.get("seguimientoCumplimiento")?.toString().trim() || "",
    seguimientoEficacia: datos.get("seguimientoEficacia")?.toString().trim() || "",
    seguimientoFilas: leerFilasSeguimiento(),
    verificadoPorNombre: datos.get("verificadoPorNombre")?.toString().trim() || "",
    verificadoPorCargo: datos.get("verificadoPorCargo")?.toString().trim() || "",
    tratamientoEficaz: datos.get("tratamientoEficaz")?.toString() || "",
    tratamientoEficazPorque: datos.get("tratamientoEficazPorque")?.toString().trim() || "",
    origenIndicador: ncPendientePrefill?.origenIndicador || null,
  });
}

function renderFilasPlanAccion(filas) {
  const tbody = document.querySelector("#tablaPlanAccionGcRe009 tbody");
  if (!tbody) return;
  const lista = filas?.length ? filas : [filaPlanAccionVacia(), filaPlanAccionVacia()];
  tbody.innerHTML = lista
    .map(
      (fila) => `
    <tr>
      <td><input data-plan-actividad type="text" value="${escapeHtmlFormatos(fila.actividad)}" /></td>
      <td><input data-plan-responsable type="text" value="${escapeHtmlFormatos(fila.responsable)}" /></td>
      <td><input data-plan-fecha type="date" value="${escapeHtmlFormatos(fila.fechaEntrega)}" /></td>
      <td><input data-plan-evidencia type="text" value="${escapeHtmlFormatos(fila.evidencia)}" /></td>
    </tr>
  `
    )
    .join("");
}

function renderFilasSeguimiento(filas) {
  const tbody = document.querySelector("#tablaSeguimientoGcRe009 tbody");
  if (!tbody) return;
  const lista = filas?.length ? filas : [filaSeguimientoVacia(), filaSeguimientoVacia()];
  tbody.innerHTML = lista
    .map(
      (fila) => `
    <tr>
      <td><input data-seg-actividad type="text" value="${escapeHtmlFormatos(fila.actividad)}" /></td>
      <td>
        <select data-seg-cumplido>
          <option value="">—</option>
          <option value="si" ${fila.cumplido === "si" ? "selected" : ""}>SI</option>
          <option value="no" ${fila.cumplido === "no" ? "selected" : ""}>NO</option>
        </select>
      </td>
      <td>
        <select data-seg-eficaz>
          <option value="">—</option>
          <option value="si" ${fila.fueEficaz === "si" ? "selected" : ""}>SI</option>
          <option value="no" ${fila.fueEficaz === "no" ? "selected" : ""}>NO</option>
        </select>
      </td>
      <td><input data-seg-porque type="text" value="${escapeHtmlFormatos(fila.porque)}" /></td>
    </tr>
  `
    )
    .join("");
}

function llenarFormularioGcRe009(registro) {
  const form = obtenerFormGcRe009();
  if (!form || !registro) return;
  ncEditandoId = registro.id;
  document.getElementById("ncNumero").value = registro.numero || "";
  form.area.value = registro.area || "";
  form.fechaDeteccion.value = registro.fechaDeteccion || "";
  const origenInput = form.querySelector(`input[name="origen"][value="${registro.origen}"]`);
  if (origenInput) origenInput.checked = true;
  form.descripcion.value = registro.descripcion || "";
  form.detectadaPorNombre.value = registro.detectadaPorNombre || "";
  form.detectadaPorCargo.value = registro.detectadaPorCargo || "";
  form.tratamientoInmediato.value = registro.tratamientoInmediato || "";
  form.tratamientoInmediatoPor.value = registro.tratamientoInmediatoPor || "";
  form.tratamientoInmediatoFecha.value = registro.tratamientoInmediatoFecha || "";
  form.herramientaCausa.value = registro.herramientaCausa || "";
  form.resumenCausa.value = registro.resumenCausa || "";
  form.analisisPor.value = registro.analisisPor || "";
  form.analisisFecha.value = registro.analisisFecha || "";
  const req = form.querySelector(
    `input[name="requiereAccionFormal"][value="${registro.requiereAccionFormal}"]`
  );
  if (req) req.checked = true;
  form.seguimientoCumplimiento.value = registro.seguimientoCumplimiento || "";
  form.seguimientoEficacia.value = registro.seguimientoEficacia || "";
  form.verificadoPorNombre.value = registro.verificadoPorNombre || "";
  form.verificadoPorCargo.value = registro.verificadoPorCargo || "";
  const ef = form.querySelector(`input[name="tratamientoEficaz"][value="${registro.tratamientoEficaz}"]`);
  if (ef) ef.checked = true;
  form.tratamientoEficazPorque.value = registro.tratamientoEficazPorque || "";
  renderFilasPlanAccion(registro.planAccion);
  renderFilasSeguimiento(registro.seguimientoFilas);
  const aviso = document.getElementById("ncAvisoIndicador");
  if (aviso) {
    if (registro.origenIndicador) {
      const ref = registro.origenIndicador;
      aviso.hidden = false;
      aviso.textContent = `Vinculado a indicador: ${ref.indicador} (${ref.mes}/${ref.anio}) — meta ${ref.meta}, valor ${ref.valor}.`;
    } else {
      aviso.hidden = true;
      aviso.textContent = "";
    }
  }
}

function prepararFormularioGcRe009Nuevo() {
  ncEditandoId = null;
  const form = obtenerFormGcRe009();
  if (!form) return;
  form.reset();
  document.getElementById("ncNumero").value = String(obtenerSiguienteNumeroNc());
  renderFilasPlanAccion();
  renderFilasSeguimiento();
  const aviso = document.getElementById("ncAvisoIndicador");
  if (aviso) {
    aviso.hidden = true;
    aviso.textContent = "";
  }
  if (ncPendientePrefill) {
    llenarFormularioGcRe009(
      normalizarRegistroNc({
        ...ncPendientePrefill,
        numero: document.getElementById("ncNumero").value,
      })
    );
    ncPendientePrefill = null;
  }
}

async function mostrarPdfGcRe009(registro) {
  const estado = document.getElementById("estadoFormatoGcRe009");
  try {
    if (estado) estado.textContent = "Generando PDF sobre la plantilla oficial...";
    const pdfBytes = await obtenerPdfGcRe009Registro(registro);
    mostrarPdfGcRe009EnIframe(pdfBytes);
    abrirPdfGcRe009EnNavegador(pdfBytes, registro);
    if (estado) estado.textContent = `PDF No. ${registro.numero} listo. Tambien visible abajo en la vista previa.`;
  } catch (error) {
    console.warn(error);
    if (estado) estado.textContent = `No se pudo generar el PDF: ${error.message}`;
    alert(`No se pudo generar el PDF: ${error.message}`);
  }
}

async function descargarPdfGcRe009(registro) {
  const pdfBytes = await obtenerPdfGcRe009Registro(registro);
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nombreArchivoPdfGcRe009(registro);
  link.click();
  URL.revokeObjectURL(url);
}

function renderListaNcEnContenedor(contenedor) {
  if (!contenedor) return;
  if (registrosNoConformidad.length === 0) {
    contenedor.innerHTML = "<p class='indicadores-vacio'>Aun no hay registros GC-RE-009.</p>";
    return;
  }
  contenedor.innerHTML = [...registrosNoConformidad]
    .sort((a, b) => (b.numero || "").localeCompare(a.numero || ""))
    .map(
      (registro) => `
      <article class="item-nc-guardada">
        <div class="item-nc-guardada__titulo">No. ${escapeHtmlFormatos(registro.numero)} — ${escapeHtmlFormatos(registro.area)}</div>
        <div class="item-nc-guardada__meta">${escapeHtmlFormatos(registro.fechaDeteccion)} · ${escapeHtmlFormatos(registro.origen)} · ${escapeHtmlFormatos(registro.descripcion.slice(0, 90))}${registro.descripcion.length > 90 ? "..." : ""}</div>
        <div class="item-nc-guardada__acciones">
          <button type="button" class="btn-tabla-accion" data-ver-nc="${registro.id}">Ver PDF</button>
          <button type="button" class="btn-tabla-accion" data-descargar-nc="${registro.id}">Descargar</button>
          <button type="button" class="btn-tabla-accion" data-editar-nc="${registro.id}">Editar</button>
          <button type="button" class="btn-tabla-accion btn-tabla-accion--eliminar" data-eliminar-nc="${registro.id}">Eliminar</button>
        </div>
      </article>
    `
    )
    .join("");
}

function vincularAccionesListaNc(contenedor) {
  if (!contenedor) return;
  contenedor.querySelectorAll("[data-ver-nc]").forEach((boton) => {
    boton.addEventListener("click", async () => {
      const registro = registrosNoConformidad.find((item) => item.id === boton.getAttribute("data-ver-nc"));
      if (registro) await mostrarPdfGcRe009(registro);
    });
  });
  contenedor.querySelectorAll("[data-descargar-nc]").forEach((boton) => {
    boton.addEventListener("click", async () => {
      const registro = registrosNoConformidad.find(
        (item) => item.id === boton.getAttribute("data-descargar-nc")
      );
      if (!registro) return;
      try {
        await descargarPdfGcRe009(registro);
      } catch (error) {
        alert(`No se pudo descargar el PDF: ${error.message}`);
      }
    });
  });
  contenedor.querySelectorAll("[data-editar-nc]").forEach((boton) => {
    boton.addEventListener("click", () => {
      const registro = registrosNoConformidad.find((item) => item.id === boton.getAttribute("data-editar-nc"));
      if (!registro) return;
      ncPendientePrefill = null;
      llenarFormularioGcRe009(registro);
      if (typeof mostrarVista === "function") mostrarVista("vista-formato-gcre009");
    });
  });
  contenedor.querySelectorAll("[data-eliminar-nc]").forEach((boton) => {
    boton.addEventListener("click", async () => {
      const id = boton.getAttribute("data-eliminar-nc");
      if (!id || !confirm("Eliminar este registro GC-RE-009?")) return;
      registrosNoConformidad = registrosNoConformidad.filter((item) => item.id !== id);
      if (typeof eliminarPdfGcRe009DeIdb === "function") {
        await eliminarPdfGcRe009DeIdb(id);
      }
      guardarNoConformidades();
      renderListaNcGuardadas();
    });
  });
}

function renderListaNcGuardadas() {
  const lista = document.getElementById("listaNcGuardadas");
  const listaFormulario = document.getElementById("listaNcGuardadasFormulario");
  renderListaNcEnContenedor(lista);
  renderListaNcEnContenedor(listaFormulario);
  vincularAccionesListaNc(lista);
  vincularAccionesListaNc(listaFormulario);
}

async function guardarRegistroGcRe009(mostrarPdf = true) {
  const registro = leerFormularioGcRe009();
  if (!registro) return false;
  if (!registro.area || !registro.fechaDeteccion || !registro.descripcion.trim()) {
    const estado = document.getElementById("estadoFormatoGcRe009");
    if (estado) estado.textContent = "Completa area, fecha de deteccion y descripcion.";
    return false;
  }

  const estado = document.getElementById("estadoFormatoGcRe009");
  if (estado) estado.textContent = "Guardando registro y generando PDF sobre la plantilla...";

  let pdfBytes;
  try {
    pdfBytes = await generarPdfGcRe009(registro);
    if (typeof guardarPdfGcRe009EnIdb === "function") {
      await guardarPdfGcRe009EnIdb(registro.id, pdfBytes);
    }
    registro.pdfEnIdb = true;
  } catch (error) {
    console.warn(error);
    if (estado) estado.textContent = `Registro no guardado: ${error.message}`;
    alert(`No se pudo generar el PDF oficial: ${error.message}`);
    return false;
  }

  if (ncEditandoId) {
    const indice = registrosNoConformidad.findIndex((item) => item.id === ncEditandoId);
    if (indice >= 0) registrosNoConformidad[indice] = registro;
  } else {
    registrosNoConformidad.unshift(registro);
  }

  guardarNoConformidades();
  renderListaNcGuardadas();
  if (estado) estado.textContent = `Registro No. ${registro.numero} guardado con PDF en el navegador.`;

  if (mostrarPdf) {
    mostrarPdfGcRe009EnIframe(pdfBytes);
    abrirPdfGcRe009EnNavegador(pdfBytes, registro);
  }

  prepararFormularioGcRe009Nuevo();
  return true;
}

function abrirFormatoGcRe009DesdeIndicador(datos) {
  ncPendientePrefill = {
    origen: "indicador",
    area: datos.area || "",
    fechaDeteccion: new Date().toISOString().slice(0, 10),
    descripcion:
      datos.descripcion ||
      `Indicador "${datos.indicador}" no cumple la meta (${datos.meta}). Valor obtenido: ${datos.valor}. Periodo: ${datos.mes}/${datos.anio}.`,
    origenIndicador: {
      anio: datos.anio,
      mes: datos.mes,
      area: datos.area,
      indicador: datos.indicador,
      meta: datos.meta,
      valor: datos.valor,
    },
  };
  if (typeof mostrarVista === "function") {
    mostrarVista("vista-formato-gcre009");
  }
}

function abrirFormatoGcRe009DesdeCorrectivo(registroCorrectivo) {
  if (!registroCorrectivo) return;
  ncPendientePrefill = {
    origen: "proceso",
    area: registroCorrectivo.proceso || registroCorrectivo.area || "",
    fechaDeteccion: registroCorrectivo.fechaSolicitud || new Date().toISOString().slice(0, 10),
    descripcion: `Solicitud correctiva No. ${registroCorrectivo.numeroSolicitud || ""}: ${registroCorrectivo.descripcionSolicitud || ""}`,
    tratamientoInmediato: registroCorrectivo.solucionSolicitud || "",
  };
  if (typeof mostrarVista === "function") {
    mostrarVista("vista-formato-gcre009");
  }
}

function initModuloFormatos() {
  if (formatosInicializado) {
    renderListaNcGuardadas();
    return;
  }

  cargarNoConformidades();
  renderFilasPlanAccion();
  renderFilasSeguimiento();
  renderListaNcGuardadas();

  document.getElementById("abrirGcRe009Btn")?.addEventListener("click", () => {
    ncPendientePrefill = null;
    ncEditandoId = null;
    if (typeof mostrarVista === "function") mostrarVista("vista-formato-gcre009");
  });

  document.getElementById("nuevoGcRe009Btn")?.addEventListener("click", () => {
    prepararFormularioGcRe009Nuevo();
  });

  document.getElementById("agregarFilaPlanBtn")?.addEventListener("click", () => {
    renderFilasPlanAccion([...leerFilasPlanAccion(), filaPlanAccionVacia()]);
  });

  document.getElementById("agregarFilaSeguimientoBtn")?.addEventListener("click", () => {
    renderFilasSeguimiento([...leerFilasSeguimiento(), filaSeguimientoVacia()]);
  });

  obtenerFormGcRe009()?.addEventListener("submit", (event) => {
    event.preventDefault();
    guardarRegistroGcRe009(true);
  });

  document.getElementById("soloGuardarGcRe009Btn")?.addEventListener("click", () => {
    guardarRegistroGcRe009(false);
  });

  formatosInicializado = true;
}

function prepararVistaFormatoGcRe009() {
  initModuloFormatos();
  if (ncEditandoId) return;
  prepararFormularioGcRe009Nuevo();
}

window.abrirFormatoGcRe009DesdeIndicador = abrirFormatoGcRe009DesdeIndicador;
window.abrirFormatoGcRe009DesdeCorrectivo = abrirFormatoGcRe009DesdeCorrectivo;
window.obtenerNoConformidadesRespaldo = obtenerNoConformidadesRespaldo;
window.importarNoConformidadesDesdeRespaldo = importarNoConformidadesDesdeRespaldo;

cargarNoConformidades();
