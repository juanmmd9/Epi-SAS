/**
 * Modulo Indicadores — correctivo (Excel) + preventivo (cumplimiento cronograma).
 * Depende de datos y funciones globales de script.js.
 */

const AREAS_INDICADORES = [
  "Laboratorio",
  "Confeccion",
  "Tejidos",
  "Plasticos",
  "Locativos",
  "Moldes",
];
const AREAS_INDICADORES_PM = AREAS_INDICADORES.filter((area) => area !== "Moldes");

const NOMBRES_MESES_INDICADORES = [
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

const CLAVE_HORAS_PROGRAMADAS = "indicadores_horas_programadas_v1";

let indicadoresInicializado = false;
let horasProgramadasCache = null;

function obtenerElementosIndicadores() {
  return {
    filtroArea: document.getElementById("indicadoresFiltroArea"),
    filtroMes: document.getElementById("indicadoresFiltroMes"),
    filtroAnio: document.getElementById("indicadoresFiltroAnio"),
    filtroTipo: document.getElementById("indicadoresFiltroTipo"),
    horasProgramadas: document.getElementById("indicadoresHorasProgramadas"),
    btnGuardarHoras: document.getElementById("guardarHorasProgramadasBtn"),
    btnActualizar: document.getElementById("actualizarIndicadoresBtn"),
    indicadorFinal: document.getElementById("indicadorFinalCorrectivo"),
    tablaCorrectivo: document.getElementById("tablaIndicadoresCorrectivo"),
    resumenCorrectivo: document.getElementById("resumenIndicadoresCorrectivo"),
    preventivoAreas: document.getElementById("indicadoresPreventivoAreas"),
    estado: document.getElementById("estadoIndicadores"),
  };
}

function obtenerAnioIndicadores() {
  const input = document.getElementById("indicadoresFiltroAnio");
  const anio = Number.parseInt(input?.value, 10);
  return Number.isInteger(anio) ? anio : new Date().getFullYear();
}

function obtenerMesIndicadores() {
  const input = document.getElementById("indicadoresFiltroMes");
  const mes = Number.parseInt(input?.value, 10);
  return Number.isInteger(mes) && mes >= 1 && mes <= 12
    ? mes
    : new Date().getMonth() + 1;
}

function claveHorasProgramadas(anio, mes, area) {
  return `${anio}-${String(mes).padStart(2, "0")}:${area}`;
}

function cargarHorasProgramadasStorage() {
  if (horasProgramadasCache) return horasProgramadasCache;
  try {
    const guardado = localStorage.getItem(CLAVE_HORAS_PROGRAMADAS);
    horasProgramadasCache = guardado ? JSON.parse(guardado) : {};
    if (typeof horasProgramadasCache !== "object" || horasProgramadasCache === null) {
      horasProgramadasCache = {};
    }
  } catch {
    horasProgramadasCache = {};
  }
  return horasProgramadasCache;
}

function guardarHorasProgramadasStorage(mapa) {
  horasProgramadasCache = mapa;
  localStorage.setItem(CLAVE_HORAS_PROGRAMADAS, JSON.stringify(mapa));
}

function obtenerHorasProgramadasArea(anio, mes, area) {
  const mapa = cargarHorasProgramadasStorage();
  const valor = mapa[claveHorasProgramadas(anio, mes, area)];
  return Number.isFinite(valor) && valor > 0 ? valor : null;
}

function obtenerHorasProgramadasRespaldo() {
  return cargarHorasProgramadasStorage();
}

function importarHorasProgramadasDesdeRespaldo(datos) {
  if (!datos || typeof datos !== "object") return;
  const horas = datos.horasProgramadas ?? datos;
  if (typeof horas !== "object" || horas === null) return;
  guardarHorasProgramadasStorage(horas);
}

function sincronizarInputHorasProgramadas() {
  const { filtroArea, filtroMes, horasProgramadas, estado } = obtenerElementosIndicadores();
  if (!horasProgramadas) return;
  const area = filtroArea?.value || "";
  if (!area) {
    horasProgramadas.value = "";
    horasProgramadas.placeholder = "Selecciona un area";
    horasProgramadas.disabled = true;
    return;
  }
  horasProgramadas.disabled = false;
  horasProgramadas.placeholder = "Ej. 1376";
  const valor = obtenerHorasProgramadasArea(
    obtenerAnioIndicadores(),
    obtenerMesIndicadores(),
    area
  );
  horasProgramadas.value = valor !== null ? String(valor) : "";
  if (estado && valor !== null) {
    estado.textContent = `Horas programadas cargadas para ${area}.`;
  }
}

function guardarHorasProgramadasDesdeFormulario() {
  const { filtroArea, filtroMes, horasProgramadas, estado } = obtenerElementosIndicadores();
  const area = filtroArea?.value || "";
  if (!area) {
    if (estado) estado.textContent = "Selecciona un area para guardar las horas programadas.";
    return;
  }
  const valor = Number.parseFloat(horasProgramadas?.value);
  if (!Number.isFinite(valor) || valor <= 0) {
    if (estado) estado.textContent = "Ingresa un numero valido de horas programadas.";
    return;
  }
  const mapa = cargarHorasProgramadasStorage();
  mapa[claveHorasProgramadas(obtenerAnioIndicadores(), obtenerMesIndicadores(), area)] =
    valor;
  guardarHorasProgramadasStorage(mapa);
  if (estado) {
    estado.textContent = `Horas programadas guardadas: ${valor} h (${area}).`;
  }
  renderPanelIndicadores();
}

function registroEnMes(fechaTexto, anio, mes) {
  if (!fechaTexto || typeof fechaTexto !== "string") return false;
  const partes = fechaTexto.slice(0, 10).split("-");
  if (partes.length < 2) return false;
  return (
    Number.parseInt(partes[0], 10) === anio && Number.parseInt(partes[1], 10) === mes
  );
}

function construirDateTime(fecha, hora) {
  if (!fecha || !hora) return null;
  const horaNormalizada = hora.length >= 5 ? hora.slice(0, 5) : hora;
  const dt = new Date(`${fecha}T${horaNormalizada}:00`);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function formatearNumero(valor, decimales = 2) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return Number(valor).toFixed(decimales);
}

function calcularTiemposCorrectivo(registro) {
  const solicitudDT = construirDateTime(registro.fechaSolicitud, registro.horaSolicitud);
  const respuestaDT = construirDateTime(registro.fechaSolicitud, registro.horaRespuesta);
  const entregaDT = construirDateTime(registro.fechaCierre, registro.horaCierre);

  if (!solicitudDT || !respuestaDT || !entregaDT) {
    return { g: null, h: null, i: null, valido: false };
  }

  const g = (respuestaDT - solicitudDT) / 60000;
  const h = (entregaDT - respuestaDT) / 60000;

  if (g < 0 || h < 0) {
    return { g, h, i: null, valido: false, advertencia: true };
  }

  return { g, h, i: g + h, valido: true };
}

function coincideTipoMantenimiento(registro, tipoFiltro) {
  if (!tipoFiltro) return true;
  const tipos = Array.isArray(registro.tiposSolicitud) ? registro.tiposSolicitud : [];
  return tipos.some((tipo) => tipo.toUpperCase().includes(tipoFiltro.toUpperCase()));
}

function filtrarCorrectivosIndicadores(area, mes, anio, tipoMantenimiento) {
  const lista =
    typeof registrosCorrectivo !== "undefined" ? registrosCorrectivo : [];
  return lista
    .filter((item) => {
      const areaRegistro = (item.area || item.proceso || "").trim();
      if (area && areaRegistro !== area) return false;
      if (!registroEnMes(item.fechaSolicitud, anio, mes)) return false;
      return coincideTipoMantenimiento(item, tipoMantenimiento);
    })
    .sort((a, b) => (a.numeroSolicitud || 0) - (b.numeroSolicitud || 0));
}

function calcularResumenCorrectivo(filas) {
  const validas = filas.filter((fila) => fila.tiempos.valido);
  const totalG = validas.reduce((suma, fila) => suma + fila.tiempos.g, 0);
  const totalH = validas.reduce((suma, fila) => suma + fila.tiempos.h, 0);
  const totalI = validas.reduce((suma, fila) => suma + fila.tiempos.i, 0);
  const cantidad = validas.length;
  const horas = totalI / 60;

  return {
    totalG,
    totalH,
    totalI,
    cantidad,
    promedioG: cantidad > 0 ? totalG / cantidad : 0,
    promedioH: cantidad > 0 ? totalH / cantidad : 0,
    promedioI: cantidad > 0 ? totalI / cantidad : 0,
    horas,
  };
}

function renderTarjetaIndicador(etiqueta, valor, detalle = "") {
  return `
    <article class="tarjeta-indicador">
      <span class="tarjeta-indicador__etiqueta">${etiqueta}</span>
      <strong class="tarjeta-indicador__valor">${valor}</strong>
      ${detalle ? `<span class="tarjeta-indicador__detalle">${detalle}</span>` : ""}
    </article>
  `;
}

function renderIndicadorFinalCorrectivo(resumen, horasProgramadas, area, mes, anio) {
  if (!horasProgramadas) {
    return renderTarjetaIndicador(
      "Tiempo real / horas prog.",
      "—",
      "Guarda las horas programadas del mes para calcular el indicador."
    );
  }
  const ratio = resumen.horas / horasProgramadas;
  const porcentaje = ratio * 100;
  return `
    ${renderTarjetaIndicador(
      "Total tiempo real (h)",
      formatearNumero(resumen.horas),
      `${formatearNumero(resumen.totalI, 0)} min en ${resumen.cantidad} solicitudes`
    )}
    ${renderTarjetaIndicador(
      "Horas programadas",
      String(horasProgramadas),
      `${NOMBRES_MESES_INDICADORES[mes - 1]} ${anio} — ${escapeHtml(area)}`
    )}
    ${renderTarjetaIndicador(
      "Indicador (Turnos)",
      `${formatearNumero(porcentaje)}%`,
      `Ratio ${formatearNumero(ratio, 4)} = ${formatearNumero(resumen.horas)} / ${horasProgramadas}`
    )}
  `;
}

function renderTablaCorrectivoIndicadores(area, mes, anio, tipoMantenimiento, filasPrecalculadas) {
  if (!area) {
    return {
      html: `<p class="indicadores-vacio">Selecciona un area para ver la tabla de tiempos correctivos.</p>`,
      filas: [],
    };
  }

  const filas =
    filasPrecalculadas ||
    filtrarCorrectivosIndicadores(area, mes, anio, tipoMantenimiento).map((registro) => ({
      registro,
      tiempos: calcularTiemposCorrectivo(registro),
    }));

  if (filas.length === 0) {
    return {
      html: `<p class="indicadores-vacio">No hay solicitudes correctivas en ${escapeHtml(area)} para ${NOMBRES_MESES_INDICADORES[mes - 1]} ${anio}.</p>`,
      filas: [],
    };
  }

  const filasHtml = filas
    .map(({ registro, tiempos }) => {
      const advertencia = tiempos.advertencia ? " fila-advertencia" : "";
      return `
        <tr class="${advertencia}">
          <td>${escapeHtml(registro.maquinaEquipoLocacion || "—")}</td>
          <td>${escapeHtml(registro.fechaSolicitud || "—")}</td>
          <td>${escapeHtml(registro.horaSolicitud || "—")}</td>
          <td>${escapeHtml(registro.horaRespuesta || "—")}</td>
          <td>${escapeHtml(registro.fechaCierre || "—")}</td>
          <td>${escapeHtml(registro.horaCierre || "—")}</td>
          <td>${formatearNumero(tiempos.g, tiempos.valido ? 0 : 2)}</td>
          <td>${formatearNumero(tiempos.h, tiempos.valido ? 0 : 2)}</td>
          <td class="col-tiempo-real">${formatearNumero(tiempos.i, tiempos.valido ? 0 : 2)}</td>
        </tr>
      `;
    })
    .join("");

  return {
    html: `
    <div class="tabla-indicadores-scroll">
      <table class="tabla-indicadores-excel">
        <thead>
          <tr>
            <th>Maquina</th>
            <th colspan="2">Solicitud</th>
            <th>Hora respuesta</th>
            <th colspan="2">Entrega</th>
            <th>T. respuesta (min)</th>
            <th>T. mantenimiento (min)</th>
            <th>T. real mant.</th>
          </tr>
          <tr class="subencabezado-indicadores">
            <th></th>
            <th>Fecha</th>
            <th>Hora</th>
            <th></th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>G</th>
            <th>H</th>
            <th>I</th>
          </tr>
        </thead>
        <tbody>${filasHtml}</tbody>
      </table>
    </div>
  `,
    filas,
  };
}

function renderResumenCorrectivoIndicadores(filas, horasProgramadas) {
  const resumen = calcularResumenCorrectivo(filas || []);
  if (resumen.cantidad === 0) return "";

  let filaTurnos = "";
  if (horasProgramadas) {
    const ratio = resumen.horas / horasProgramadas;
    filaTurnos = `
      <tr class="fila-resumen-indicadores fila-turnos">
        <td colspan="6"><strong>Turnos</strong> = Horas / Horas programadas</td>
        <td colspan="2">${formatearNumero(ratio, 4)} (${formatearNumero(ratio * 100)}%)</td>
        <td>${formatearNumero(resumen.horas)} / ${horasProgramadas}</td>
      </tr>
    `;
  }

  return `
    <table class="tabla-indicadores-excel tabla-resumen-indicadores">
      <tbody>
        <tr class="fila-resumen-indicadores">
          <td colspan="6"><strong>Total</strong></td>
          <td>${formatearNumero(resumen.totalG, 0)}</td>
          <td>${formatearNumero(resumen.totalH, 0)}</td>
          <td>${formatearNumero(resumen.totalI, 0)}</td>
        </tr>
        <tr class="fila-resumen-indicadores">
          <td colspan="6"><strong>Promedio</strong></td>
          <td>${formatearNumero(resumen.promedioG)}</td>
          <td>${formatearNumero(resumen.promedioH)}</td>
          <td>${formatearNumero(resumen.promedioI)}</td>
        </tr>
        <tr class="fila-resumen-indicadores">
          <td colspan="6"><strong>Horas</strong> (total I / 60)</td>
          <td colspan="3">${formatearNumero(resumen.horas)}</td>
        </tr>
        ${filaTurnos}
      </tbody>
    </table>
  `;
}

function obtenerCitasProgramadasMes(area, anio, mes) {
  if (
    typeof construirMapaProgramacionAutomatica !== "function" ||
    typeof obtenerProgramacionesDelDia !== "function" ||
    typeof obtenerDiasEnMes !== "function"
  ) {
    return [];
  }

  const mapa = construirMapaProgramacionAutomatica(area, anio);
  const diasMes = obtenerDiasEnMes(anio, mes);
  const citas = [];
  const clavesVistas = new Set();

  for (let dia = 1; dia <= diasMes; dia += 1) {
    const programaciones = obtenerProgramacionesDelDia(area, anio, mes, dia, mapa);
    programaciones.forEach((item) => {
      const clave = `${item.maquinaId}|${mes}|${dia}`;
      if (clavesVistas.has(clave)) return;
      clavesVistas.add(clave);
      citas.push({
        area,
        anio,
        mes,
        dia,
        maquinaId: item.maquinaId,
        origen: item.origen,
        fechaProgramada: `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`,
      });
    });
  }

  return citas;
}

function pmEjecutadoEnMes(maquinaId, anio, mes) {
  const lista = typeof registrosPreventivo !== "undefined" ? registrosPreventivo : [];
  return lista.find(
    (item) => item.maquinaId === maquinaId && registroEnMes(item.fecha, anio, mes)
  );
}

function obtenerMesSiguiente(anio, mes) {
  if (mes >= 12) return { anio: anio + 1, mes: 1 };
  return { anio, mes: mes + 1 };
}

function detectarReprogramacionMesSiguiente(cita) {
  const { area, anio, mes, dia, maquinaId } = cita;
  const excluida =
    typeof estaExcluidaEnFecha === "function" &&
    estaExcluidaEnFecha(maquinaId, area, anio, mes, dia);

  if (!excluida) return null;

  const { anio: anioSig, mes: mesSig } = obtenerMesSiguiente(anio, mes);
  const excepciones =
    typeof excepcionesCronograma !== "undefined" ? excepcionesCronograma : [];

  const agregada = excepciones.find(
    (item) =>
      item.tipo === "agregar" &&
      item.area === area &&
      item.maquinaId === maquinaId &&
      Number(item.anio) === anioSig &&
      Number(item.mes) === mesSig
  );

  if (agregada) {
    return {
      anio: anioSig,
      mes: mesSig,
      dia: Number(agregada.dia),
      tipo: "puntual",
    };
  }

  const citasMesSig = obtenerCitasProgramadasMes(area, anioSig, mesSig);
  const reprogramada = citasMesSig.find((item) => item.maquinaId === maquinaId);
  if (reprogramada) {
    return {
      anio: anioSig,
      mes: mesSig,
      dia: reprogramada.dia,
      tipo: "cronograma",
    };
  }

  return null;
}

function nombreMaquinaIndicador(maquinaId) {
  if (typeof obtenerNombreMaquinaPorId === "function") {
    return obtenerNombreMaquinaPorId(maquinaId);
  }
  const maquina =
    typeof registrosHojas !== "undefined"
      ? registrosHojas.find((item) => item.id === maquinaId)
      : null;
  return maquina ? `${maquina.nombre} (${maquina.codigo})` : maquinaId;
}

function clasificarCitasPreventivas(area, anio, mes) {
  const citas = obtenerCitasProgramadasMes(area, anio, mes);
  const cumplidas = [];
  const reprogramadas = [];
  const pendientes = [];

  citas.forEach((cita) => {
    const pm = pmEjecutadoEnMes(cita.maquinaId, anio, mes);
    if (pm) {
      cumplidas.push({ ...cita, fechaPm: pm.fecha });
      return;
    }

    const destino = detectarReprogramacionMesSiguiente(cita);
    if (destino) {
      reprogramadas.push({ ...cita, destino });
      return;
    }

    pendientes.push(cita);
  });

  const total = citas.length;
  const porcentaje = total > 0 ? Math.round((cumplidas.length / total) * 100) : 0;

  return { cumplidas, reprogramadas, pendientes, total, porcentaje };
}

function renderListaCitasPreventivo(items, claseEstado, vacio) {
  if (items.length === 0) {
    return `<p class="lista-preventivo-vacia">${vacio}</p>`;
  }
  const filas = items
    .map((item) => {
      const nombre = escapeHtml(nombreMaquinaIndicador(item.maquinaId));
      const fechaProg =
        typeof formatearFechaCalendario === "function"
          ? formatearFechaCalendario(item.anio, item.mes, item.dia)
          : item.fechaProgramada;
      let detalle = `Programada: ${escapeHtml(fechaProg)}`;
      if (item.fechaPm) detalle += ` — PM: ${escapeHtml(item.fechaPm)}`;
      if (item.destino) {
        const fechaDest =
          typeof formatearFechaCalendario === "function"
            ? formatearFechaCalendario(item.destino.anio, item.destino.mes, item.destino.dia)
            : `${item.destino.anio}-${item.destino.mes}-${item.destino.dia}`;
        detalle += ` → Reprogramada a ${escapeHtml(fechaDest)}`;
      }
      return `<li class="item-lista-preventivo ${claseEstado}"><strong>${nombre}</strong><span>${detalle}</span></li>`;
    })
    .join("");
  return `<ul class="lista-preventivo-indicadores">${filas}</ul>`;
}

function renderBloquePreventivoIndicadores(area, anio, mes) {
  if (area === "Moldes") {
    return `
      <section class="bloque-indicadores-area bloque-preventivo-indicadores">
        <header class="bloque-indicadores-area__encabezado">
          <h4>${escapeHtml(area)}</h4>
        </header>
        <p class="lista-preventivo-vacia">En Moldes no hay mantenimiento preventivo programado.</p>
      </section>
    `;
  }

  const datos = clasificarCitasPreventivas(area, anio, mes);
  const nombreMes = NOMBRES_MESES_INDICADORES[mes - 1];

  return `
    <section class="bloque-indicadores-area bloque-preventivo-indicadores">
      <header class="bloque-indicadores-area__encabezado">
        <h4>${escapeHtml(area)}</h4>
        <span>${nombreMes} ${anio}</span>
      </header>
      <div class="preventivo-indicadores-resumen">
        ${renderTarjetaIndicador(
          "Cumplimiento PM",
          `${datos.porcentaje}%`,
          `${datos.cumplidas.length} de ${datos.total} citas cumplidas`
        )}
        ${renderTarjetaIndicador(
          "Cumplidas",
          String(datos.cumplidas.length),
          "PM ejecutado en el mes"
        )}
        ${renderTarjetaIndicador(
          "Reprogramadas",
          String(datos.reprogramadas.length),
          "Movidas al mes siguiente"
        )}
        ${renderTarjetaIndicador(
          "Pendientes",
          String(datos.pendientes.length),
          "Sin PM ni reprogramacion"
        )}
      </div>
      <div class="preventivo-indicadores-listas">
        <div class="lista-preventivo-bloque">
          <h5>Cumplidas (${datos.cumplidas.length})</h5>
          ${renderListaCitasPreventivo(
            datos.cumplidas,
            "estado-cumplida",
            "Ninguna cita cumplida este mes."
          )}
        </div>
        <div class="lista-preventivo-bloque">
          <h5>Reprogramadas al mes siguiente (${datos.reprogramadas.length})</h5>
          ${renderListaCitasPreventivo(
            datos.reprogramadas,
            "estado-reprogramada",
            "Ninguna reprogramacion registrada."
          )}
        </div>
        <div class="lista-preventivo-bloque">
          <h5>Pendientes (${datos.pendientes.length})</h5>
          ${renderListaCitasPreventivo(
            datos.pendientes,
            "estado-pendiente",
            "Sin pendientes."
          )}
        </div>
      </div>
    </section>
  `;
}

const MESES_CORTOS_INDICADORES = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
];

const AREAS_CORRECTIVO_TABLA = ["Confeccion", "Plasticos", "Tejidos"];

let panelIndicadoresActivo = "detalle";

function promedioValoresMensuales(valores) {
  const validos = valores.filter((valor) => valor !== null && !Number.isNaN(valor));
  if (validos.length === 0) return null;
  return validos.reduce((suma, valor) => suma + valor, 0) / validos.length;
}

function calcularCumplimientoPreventivoGlobal(anio, mes) {
  let totalCitas = 0;
  let totalCumplidas = 0;
  AREAS_INDICADORES_PM.forEach((area) => {
    const datos = clasificarCitasPreventivas(area, anio, mes);
    totalCitas += datos.total;
    totalCumplidas += datos.cumplidas.length;
  });
  if (totalCitas === 0) return null;
  return Math.round((totalCumplidas / totalCitas) * 100);
}

function calcularPromedioRespuestaCorrectivoArea(anio, mes, area, tipoMantenimiento) {
  const filas = filtrarCorrectivosIndicadores(area, mes, anio, tipoMantenimiento).map(
    (registro) => ({
      tiempos: calcularTiemposCorrectivo(registro),
    })
  );
  const resumen = calcularResumenCorrectivo(filas);
  if (resumen.cantidad === 0) return null;
  return resumen.promedioG;
}

function calcularPorcentajeHorasPerdidasArea(anio, mes, area, tipoMantenimiento) {
  const filas = filtrarCorrectivosIndicadores(area, mes, anio, tipoMantenimiento).map(
    (registro) => ({
      tiempos: calcularTiemposCorrectivo(registro),
    })
  );
  const resumen = calcularResumenCorrectivo(filas);
  const horasProgramadas = obtenerHorasProgramadasArea(anio, mes, area);
  if (!horasProgramadas || resumen.cantidad === 0) return null;
  return (resumen.horas / horasProgramadas) * 100;
}

function claseCeldaPreventivo(valor) {
  if (valor === null) return "";
  return valor >= 100 ? "celda-meta-ok" : "celda-meta-fail";
}

function claseCeldaTiempoRespuesta(valor) {
  if (valor === null) return "";
  if (valor <= 10) return "celda-meta-ok";
  if (valor <= 15) return "celda-meta-alerta";
  return "celda-meta-fail";
}

function claseCeldaHorasPerdidas(valor) {
  if (valor === null) return "";
  if (valor <= 1) return "celda-meta-ok";
  if (valor <= 2) return "celda-meta-alerta";
  return "celda-meta-fail";
}

function renderCeldasMensuales(valores, formatear, claseMeta) {
  const celdasMes = valores
    .map((valor) => {
      const texto = valor === null ? "—" : formatear(valor);
      const clase = claseMeta(valor);
      return `<td class="${clase}">${texto}</td>`;
    })
    .join("");
  const promedio = promedioValoresMensuales(valores);
  const textoPromedio = promedio === null ? "—" : formatear(promedio);
  const clasePromedio = claseMeta(promedio);
  return `${celdasMes}<td class="col-promedio ${clasePromedio}"><strong>${textoPromedio}</strong></td>`;
}

function renderFilaIndicadorTabla(fila) {
  const celdasMes = renderCeldasMensuales(fila.valores, fila.formatear, fila.claseMeta);
  return `
    <tr>
      <td class="col-objetivo">${fila.objetivo ? escapeHtml(fila.objetivo) : ""}</td>
      <td class="col-indicador">${escapeHtml(fila.indicador)}</td>
      <td class="col-meta">${escapeHtml(fila.meta)}</td>
      <td class="col-frecuencia">${escapeHtml(fila.frecuencia)}</td>
      ${celdasMes}
    </tr>
  `;
}

function renderFilaAreaTabla(nombreArea) {
  return `
    <tr class="fila-area-indicadores">
      <td colspan="${16}" class="col-area-etiqueta">${escapeHtml(nombreArea)}</td>
    </tr>
  `;
}

function renderTablaResumenIndicadoresAnual(anio, tipoMantenimiento) {
  const valoresPreventivo = [];
  for (let mes = 1; mes <= 12; mes += 1) {
    valoresPreventivo.push(calcularCumplimientoPreventivoGlobal(anio, mes));
  }

  const filas = [
    renderFilaIndicadorTabla({
      objetivo: "MEJORAR CONTINUAMENTE LOS PROCESOS",
      indicador: "CUMPLIMIENTO A MANTENIMIENTOS PREVENTIVOS",
      meta: "100%",
      frecuencia: "MENSUAL",
      valores: valoresPreventivo,
      formatear: (valor) => `${valor}%`,
      claseMeta: claseCeldaPreventivo,
    }),
  ];

  AREAS_CORRECTIVO_TABLA.forEach((area) => {
    const valoresRespuesta = [];
    const valoresHoras = [];
    for (let mes = 1; mes <= 12; mes += 1) {
      valoresRespuesta.push(
        calcularPromedioRespuestaCorrectivoArea(anio, mes, area, tipoMantenimiento)
      );
      valoresHoras.push(
        calcularPorcentajeHorasPerdidasArea(anio, mes, area, tipoMantenimiento)
      );
    }

    filas.push(renderFilaAreaTabla(area));
    filas.push(
      renderFilaIndicadorTabla({
        objetivo: "",
        indicador: `TIEMPO DE RESPUESTA PROMEDIO DEL SERVICIO DE MANTENIMIENTO CORRECTIVO (${area.toUpperCase()})`,
        meta: "10 MINUTOS",
        frecuencia: "MENSUAL",
        valores: valoresRespuesta,
        formatear: (valor) => formatearNumero(valor),
        claseMeta: claseCeldaTiempoRespuesta,
      })
    );
    filas.push(
      renderFilaIndicadorTabla({
        objetivo: "",
        indicador: `PORCENTAJE DE HORAS PERDIDAS POR MANTENIMIENTO CORRECTIVO (${area.toUpperCase()})`,
        meta: "1%",
        frecuencia: "MENSUAL",
        valores: valoresHoras,
        formatear: (valor) => `${formatearNumero(valor)}%`,
        claseMeta: claseCeldaHorasPerdidas,
      })
    );
  });

  const encabezadoMeses = MESES_CORTOS_INDICADORES.map(
    (mes) => `<th>${mes}</th>`
  ).join("");

  return `
    <div class="tabla-indicadores-scroll">
      <table class="tabla-indicadores-excel tabla-indicadores-anual">
        <thead>
          <tr class="fila-titulo-indicadores">
            <th colspan="${16}">INDICADORES ${anio}</th>
          </tr>
          <tr>
            <th>OBJETIVOS DE CALIDAD</th>
            <th>INDICADORES</th>
            <th>META</th>
            <th>FRECUENCIA</th>
            ${encabezadoMeses}
            <th>PROMEDIO</th>
          </tr>
        </thead>
        <tbody>${filas.join("")}</tbody>
      </table>
    </div>
    <p class="leyenda-tabla-indicadores">
      <span class="leyenda-item leyenda-ok">Verde</span> cumple meta —
      <span class="leyenda-item leyenda-alerta">Amarillo</span> cerca del limite —
      <span class="leyenda-item leyenda-fail">Rojo</span> fuera de meta.
      Horas perdidas requieren horas programadas guardadas por area y mes.
    </p>
  `;
}

function cambiarPanelIndicadores(panel) {
  panelIndicadoresActivo = panel;
  const panelDetalle = document.getElementById("panelIndicadoresDetalle");
  const panelTabla = document.getElementById("panelIndicadoresTabla");
  document.querySelectorAll("[data-panel-indicadores]").forEach((boton) => {
    const activo = boton.getAttribute("data-panel-indicadores") === panel;
    boton.classList.toggle("indicadores-pestaña--activa", activo);
  });
  if (panelDetalle) panelDetalle.hidden = panel !== "detalle";
  if (panelTabla) panelTabla.hidden = panel !== "tabla";
  renderPanelIndicadores();
}

function renderPanelIndicadores() {
  const elementos = obtenerElementosIndicadores();
  const {
    filtroArea,
    indicadorFinal,
    tablaCorrectivo,
    resumenCorrectivo,
    preventivoAreas,
    estado,
  } = elementos;

  const areaFiltro = filtroArea?.value || "";
  const mes = obtenerMesIndicadores();
  const anio = obtenerAnioIndicadores();
  const tipoMantenimiento = document.getElementById("indicadoresFiltroTipo")?.value || "";

  sincronizarInputHorasProgramadas();

  const horasProgramadas = areaFiltro
    ? obtenerHorasProgramadasArea(anio, mes, areaFiltro)
    : null;

  let filas = [];

  if (tablaCorrectivo) {
    const resultadoTabla = renderTablaCorrectivoIndicadores(
      areaFiltro,
      mes,
      anio,
      tipoMantenimiento
    );
    tablaCorrectivo.innerHTML = resultadoTabla.html;
    filas = resultadoTabla.filas;
  }

  if (indicadorFinal) {
    const resumen = calcularResumenCorrectivo(filas);
    indicadorFinal.innerHTML =
      areaFiltro && resumen.cantidad > 0
        ? renderIndicadorFinalCorrectivo(resumen, horasProgramadas, areaFiltro, mes, anio)
        : "";
  }

  if (resumenCorrectivo) {
    resumenCorrectivo.innerHTML =
      areaFiltro && filas.length > 0
        ? renderResumenCorrectivoIndicadores(filas, horasProgramadas)
        : "";
  }

  if (preventivoAreas) {
    if (areaFiltro) {
      preventivoAreas.innerHTML = renderBloquePreventivoIndicadores(areaFiltro, anio, mes);
    } else {
      preventivoAreas.innerHTML = AREAS_INDICADORES_PM.map((area) =>
        renderBloquePreventivoIndicadores(area, anio, mes)
      ).join("");
    }
  }

  const tablaAnual = document.getElementById("tablaResumenIndicadoresAnual");
  if (tablaAnual) {
    tablaAnual.innerHTML = renderTablaResumenIndicadoresAnual(anio, tipoMantenimiento);
  }

  if (estado) {
    const nombreMes = NOMBRES_MESES_INDICADORES[mes - 1];
    if (panelIndicadoresActivo === "tabla") {
      estado.textContent = `Tabla de indicadores — año ${anio}. Preventivo y correctivo por mes.`;
    } else {
      estado.textContent = `Indicadores actualizados — ${areaFiltro || "todas las areas"}, ${nombreMes} ${anio}.`;
    }
  }
}

function configurarEventosIndicadores() {
  if (indicadoresInicializado) return;

  const {
    filtroArea,
    filtroMes,
    filtroAnio,
    filtroTipo,
    btnGuardarHoras,
    btnActualizar,
  } = obtenerElementosIndicadores();

  const ahora = new Date();
  if (filtroAnio && !filtroAnio.value) {
    filtroAnio.value = String(ahora.getFullYear());
  }
  if (filtroMes && !filtroMes.value) {
    filtroMes.value = String(ahora.getMonth() + 1);
  }

  filtroArea?.addEventListener("change", () => {
    sincronizarInputHorasProgramadas();
    renderPanelIndicadores();
  });
  filtroMes?.addEventListener("change", () => {
    sincronizarInputHorasProgramadas();
    renderPanelIndicadores();
  });
  filtroAnio?.addEventListener("change", renderPanelIndicadores);
  filtroAnio?.addEventListener("input", renderPanelIndicadores);
  filtroTipo?.addEventListener("change", renderPanelIndicadores);
  btnGuardarHoras?.addEventListener("click", guardarHorasProgramadasDesdeFormulario);
  btnActualizar?.addEventListener("click", renderPanelIndicadores);

  document.querySelectorAll("[data-panel-indicadores]").forEach((boton) => {
    boton.addEventListener("click", () => {
      const panel = boton.getAttribute("data-panel-indicadores");
      if (panel) cambiarPanelIndicadores(panel);
    });
  });

  cargarHorasProgramadasStorage();
  indicadoresInicializado = true;
}

function initModuloIndicadores() {
  configurarEventosIndicadores();
  sincronizarInputHorasProgramadas();
  renderPanelIndicadores();
}
