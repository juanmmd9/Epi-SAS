import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { SoloConPermiso } from "../auth/SoloConPermiso";
import {
  actualizarComputador,
  crearComputador,
  eliminarComputador,
  importarComputadores,
  listarComputadores,
  listarPiezasTodas,
  reemplazarInventario,
} from "./computadoresService";
import { esErrorTablaComputadores, SQL_MIGRACION_COMPUTADORES } from "./computadoresSetup";
import {
  SEMILLA_COMPUTADORES,
  compararCodigoPc,
  normalizarTipoComputador,
  parseFechaExcel,
  pmProximoEnDias,
  pmVencido,
} from "./computadoresUtil";
import {
  ETIQUETAS_TIPO_COMPUTADOR,
  TIPOS_COMPUTADOR,
  type Computador,
  type ComputadorInput,
  type TipoComputador,
} from "./types";
import "./computadores.css";

function AvisoSetupComputadores() {
  const projectRef =
    import.meta.env.VITE_SUPABASE_URL?.match(/https:\/\/([^.]+)\./)?.[1] ?? "_";
  const urlSql = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  function copiarSql() {
    void navigator.clipboard.writeText(SQL_MIGRACION_COMPUTADORES);
  }

  return (
    <aside className="aviso-setup-personal">
      <h3>Falta crear las tablas de Computadores en Supabase</h3>
      <p>Ejecuta este script en SQL Editor y recarga la página.</p>
      <div className="aviso-setup-personal__acciones">
        <button type="button" className="btn" onClick={copiarSql}>
          Copiar script SQL
        </button>
        <a className="btn btn--primario" href={urlSql} target="_blank" rel="noreferrer">
          Abrir SQL Editor
        </a>
      </div>
      <pre>{SQL_MIGRACION_COMPUTADORES}</pre>
    </aside>
  );
}

const formularioVacio: ComputadorInput = {
  codigo: "",
  ubicacion: "",
  tipo: "escritorio",
  usuario_asignado: "",
  frecuencia_pm_meses: 6,
  ultimo_pm: null,
  proximo_pm: null,
  datos: {
    marca: "",
    modelo: "",
    serial: "",
    sistemaOperativo: "",
    ip: "",
    observaciones: "",
  },
};

function ComputadoresPage() {
  const { puede } = useAuth();
  const navigate = useNavigate();
  const inputExcel = useRef<HTMLInputElement>(null);

  const [lista, setLista] = useState<Computador[]>([]);
  const [piezasMes, setPiezasMes] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [faltaTabla, setFaltaTabla] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<Computador | null>(null);
  const [campos, setCampos] = useState<ComputadorInput>(formularioVacio);

  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroUbicacion, setFiltroUbicacion] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "activos" | "baja" | "vencidos">(
    "activos",
  );

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const [pcs, piezas] = await Promise.all([listarComputadores(), listarPiezasTodas()]);
      setLista(pcs);
      setFaltaTabla(false);
      const ahora = new Date();
      const anio = ahora.getFullYear();
      const mes = ahora.getMonth() + 1;
      setPiezasMes(
        piezas.filter((p) => {
          const [y, m] = p.fecha.split("-").map(Number);
          return y === anio && m === mes;
        }).length,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al cargar";
      if (esErrorTablaComputadores(msg)) {
        setFaltaTabla(true);
        setLista([]);
      } else {
        setError(msg);
      }
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  const ubicaciones = useMemo(() => {
    const set = new Set(lista.map((p) => p.ubicacion).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, "es"));
  }, [lista]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return lista
      .filter((pc) => {
        if (filtroTipo && pc.tipo !== filtroTipo) return false;
        if (filtroUbicacion && pc.ubicacion !== filtroUbicacion) return false;
        if (filtroEstado === "activos" && !pc.activa) return false;
        if (filtroEstado === "baja" && pc.activa) return false;
        if (filtroEstado === "vencidos" && (!pc.activa || !pmVencido(pc.proximo_pm))) return false;
        if (!q) return true;
        const hay = `${pc.codigo} ${pc.ubicacion} ${pc.usuario_asignado} ${pc.datos.serial ?? ""}`
          .toLowerCase()
          .includes(q);
        return hay;
      })
      .sort((a, b) => compararCodigoPc(a.codigo, b.codigo));
  }, [lista, busqueda, filtroTipo, filtroUbicacion, filtroEstado]);

  const stats = useMemo(() => {
    const activos = lista.filter((p) => p.activa);
    return {
      total: activos.length,
      vencidos: activos.filter((p) => pmVencido(p.proximo_pm)).length,
      proximos: activos.filter((p) => pmProximoEnDias(p.proximo_pm, 30)).length,
      piezasMes,
    };
  }, [lista, piezasMes]);

  function abrirNuevo() {
    setEditando(null);
    setCampos(formularioVacio);
    setMostrarForm(true);
  }

  function abrirEditar(pc: Computador) {
    setEditando(pc);
    setCampos({
      codigo: pc.codigo,
      ubicacion: pc.ubicacion,
      tipo: pc.tipo,
      usuario_asignado: pc.usuario_asignado,
      frecuencia_pm_meses: pc.frecuencia_pm_meses,
      ultimo_pm: pc.ultimo_pm,
      proximo_pm: pc.proximo_pm,
      datos: {
        marca: pc.datos.marca ?? "",
        modelo: pc.datos.modelo ?? "",
        serial: pc.datos.serial ?? "",
        sistemaOperativo: pc.datos.sistemaOperativo ?? "",
        ip: pc.datos.ip ?? "",
        observaciones: pc.datos.observaciones ?? "",
      },
    });
    setMostrarForm(true);
  }

  async function manejarGuardar(evento: FormEvent) {
    evento.preventDefault();
    if (!campos.ubicacion.trim()) {
      setError("La ubicación es obligatoria.");
      return;
    }
    setGuardando(true);
    setError(null);
    setMensaje(null);
    try {
      if (editando) {
        const actualizado = await actualizarComputador(editando.id, campos);
        setLista((prev) => prev.map((p) => (p.id === actualizado.id ? actualizado : p)));
        setMensaje(`Computador ${actualizado.codigo || actualizado.ubicacion} actualizado.`);
      } else {
        const creado = await crearComputador(campos);
        setLista((prev) => [...prev, creado]);
        setMensaje(`Computador ${creado.codigo || creado.ubicacion} registrado.`);
      }
      setMostrarForm(false);
      setEditando(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al guardar";
      if (esErrorTablaComputadores(msg)) setFaltaTabla(true);
      setError(msg);
    } finally {
      setGuardando(false);
    }
  }

  async function manejarEliminar(pc: Computador) {
    if (!window.confirm(`¿Eliminar ${pc.codigo || pc.ubicacion}?`)) return;
    try {
      await eliminarComputador(pc.id);
      setLista((prev) => prev.filter((p) => p.id !== pc.id));
      setMensaje("Computador eliminado.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar");
    }
  }

  async function cargarSemilla() {
    const aviso =
      lista.length > 0
        ? `Se reemplazarán los ${lista.length} computadores actuales por la lista oficial del Excel (51 equipos). ¿Continuar?`
        : "Se cargarán los 51 computadores de la lista oficial del Excel. ¿Continuar?";
    if (!window.confirm(aviso)) return;

    setGuardando(true);
    setError(null);
    try {
      const { creados } = await reemplazarInventario(SEMILLA_COMPUTADORES);
      setMensaje(`Lista actualizada: ${creados} computadores cargados desde el Excel oficial.`);
      await cargar();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al importar";
      if (esErrorTablaComputadores(msg)) setFaltaTabla(true);
      setError(msg);
    } finally {
      setGuardando(false);
    }
  }

  async function importarExcel(archivo: File) {
    setGuardando(true);
    setError(null);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const buffer = await archivo.arrayBuffer();
      const libro = new ExcelJS.Workbook();
      await libro.xlsx.load(buffer);
      const hoja = libro.worksheets[0];
      if (!hoja) throw new Error("El Excel no tiene hojas.");

      function textoCelda(
        fila: { getCell: (col: number) => { value: unknown; text?: string } },
        col: number,
      ): string {
        const c = fila.getCell(col);
        if (c.value instanceof Date) return parseFechaExcel(c.value) ?? "";
        if (c.value && typeof c.value === "object" && "result" in c.value) {
          return String((c.value as { result?: unknown }).result ?? "").trim();
        }
        return String(c.text ?? c.value ?? "").trim();
      }

      const items: ComputadorInput[] = [];
      hoja.eachRow((fila, numero) => {
        if (numero <= 2) return;
        const item = textoCelda(fila, 1);
        if (!/^\d+$/.test(item)) return;

        const ubicacion = textoCelda(fila, 2).replace(/\s+/g, " ").trim();
        const tipoRaw = textoCelda(fila, 3);
        const usuario = textoCelda(fila, 4).replace(/\s+/g, " ").trim();
        const compra = textoCelda(fila, 5);
        const ultimo = parseFechaExcel(fila.getCell(6).value) ?? parseFechaExcel(textoCelda(fila, 6));
        const proximo =
          parseFechaExcel(fila.getCell(7).value) ?? parseFechaExcel(textoCelda(fila, 7));
        const obs = textoCelda(fila, 8);
        const siesa = textoCelda(fila, 9).toUpperCase();
        if (!ubicacion && !usuario) return;

        items.push({
          codigo: `PC ${String(item).padStart(2, "0")}`,
          ubicacion: ubicacion || "SIN UBICACIÓN",
          tipo: normalizarTipoComputador(tipoRaw),
          usuario_asignado: usuario,
          frecuencia_pm_meses: 12,
          ultimo_pm: ultimo,
          proximo_pm: proximo,
          datos: {
            ...(obs ? { observaciones: obs } : {}),
            ...(siesa ? { siesa } : {}),
            ...(compra ? { compra } : {}),
            ...(tipoRaw ? { tipoDetalle: tipoRaw } : {}),
          },
        });
      });

      if (items.length === 0) {
        throw new Error(
          "No se encontraron equipos. El Excel debe tener columnas: ITEM, UBICACIÓN, TIPO, USUARIO…",
        );
      }

      const reemplazar =
        lista.length === 0 ||
        window.confirm(
          `Se leyeron ${items.length} equipos. ¿Reemplazar la lista actual (${lista.length})?`,
        );
      const { creados } = reemplazar
        ? await reemplazarInventario(items)
        : await importarComputadores(items);
      setMensaje(`Importados ${creados} equipos desde ${archivo.name}.`);
      await cargar();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al leer Excel";
      if (esErrorTablaComputadores(msg)) setFaltaTabla(true);
      setError(msg);
    } finally {
      setGuardando(false);
      if (inputExcel.current) inputExcel.current.value = "";
    }
  }

  function etiquetaProximo(pc: Computador): { texto: string; clase: string } {
    if (!pc.proximo_pm) return { texto: "Sin programar", clase: "pc-badge" };
    if (pmVencido(pc.proximo_pm)) {
      return { texto: `${pc.proximo_pm} · Vencido`, clase: "pc-badge pc-badge--vencido" };
    }
    if (pmProximoEnDias(pc.proximo_pm, 30)) {
      return { texto: `${pc.proximo_pm} · Próximo`, clase: "pc-badge pc-badge--proximo" };
    }
    return { texto: pc.proximo_pm, clase: "pc-badge pc-badge--ok" };
  }

  return (
    <section className="computadores">
      <div className="computadores__cabecera">
        <div>
          <h1>Computadores</h1>
          <p className="computadores__descripcion">
            Inventario IT, mantenimiento preventivo y control de piezas cambiadas.
          </p>
        </div>
        <SoloConPermiso permiso="editar.computadores">
          <div className="computadores__acciones">
            <button type="button" className="btn" onClick={() => void cargarSemilla()} disabled={guardando || faltaTabla}>
              Cargar lista Excel
            </button>
            <button
              type="button"
              className="btn"
              disabled={guardando || faltaTabla}
              onClick={() => inputExcel.current?.click()}
            >
              Importar archivo
            </button>
            <input
              ref={inputExcel}
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importarExcel(file);
              }}
            />
            <button type="button" className="btn btn--primario" onClick={abrirNuevo} disabled={faltaTabla}>
              + Nuevo PC
            </button>
          </div>
        </SoloConPermiso>
      </div>

      {faltaTabla && <AvisoSetupComputadores />}

      <div className="computadores__stats">
        <div className="computadores__stat computadores__stat--info">
          <span>Activos</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="computadores__stat computadores__stat--alerta">
          <span>PM vencidos</span>
          <strong>{stats.vencidos}</strong>
        </div>
        <div className="computadores__stat">
          <span>PM próximos (30 d)</span>
          <strong>{stats.proximos}</strong>
        </div>
        <div className="computadores__stat computadores__stat--ok">
          <span>Piezas este mes</span>
          <strong>{stats.piezasMes}</strong>
        </div>
      </div>

      {mensaje && <p className="computadores__mensaje computadores__mensaje--ok">{mensaje}</p>}
      {error && <p className="computadores__mensaje computadores__mensaje--error">{error}</p>}

      {mostrarForm && puede("editar.computadores") && (
        <form className="pc-form" onSubmit={manejarGuardar}>
          <h2>{editando ? "Editar computador" : "Nuevo computador"}</h2>
          <div className="pc-form__grid">
            <label>
              Código
              <input
                value={campos.codigo}
                onChange={(e) => setCampos((c) => ({ ...c, codigo: e.target.value }))}
                placeholder="PC 04"
              />
            </label>
            <label>
              Ubicación *
              <input
                required
                value={campos.ubicacion}
                onChange={(e) => setCampos((c) => ({ ...c, ubicacion: e.target.value }))}
              />
            </label>
            <label>
              Tipo
              <select
                value={campos.tipo}
                onChange={(e) =>
                  setCampos((c) => ({ ...c, tipo: e.target.value as TipoComputador }))
                }
              >
                {TIPOS_COMPUTADOR.map((t) => (
                  <option key={t} value={t}>
                    {ETIQUETAS_TIPO_COMPUTADOR[t]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Usuario asignado
              <input
                value={campos.usuario_asignado}
                onChange={(e) => setCampos((c) => ({ ...c, usuario_asignado: e.target.value }))}
              />
            </label>
            <label>
              Frecuencia PM (meses)
              <input
                type="number"
                min={1}
                value={campos.frecuencia_pm_meses}
                onChange={(e) =>
                  setCampos((c) => ({
                    ...c,
                    frecuencia_pm_meses: Number(e.target.value) || 6,
                  }))
                }
              />
            </label>
            <label>
              Último PM
              <input
                type="date"
                value={campos.ultimo_pm ?? ""}
                onChange={(e) =>
                  setCampos((c) => ({ ...c, ultimo_pm: e.target.value || null }))
                }
              />
            </label>
            <label>
              Marca
              <input
                value={campos.datos.marca ?? ""}
                onChange={(e) =>
                  setCampos((c) => ({ ...c, datos: { ...c.datos, marca: e.target.value } }))
                }
              />
            </label>
            <label>
              Modelo
              <input
                value={campos.datos.modelo ?? ""}
                onChange={(e) =>
                  setCampos((c) => ({ ...c, datos: { ...c.datos, modelo: e.target.value } }))
                }
              />
            </label>
            <label>
              Serial
              <input
                value={campos.datos.serial ?? ""}
                onChange={(e) =>
                  setCampos((c) => ({ ...c, datos: { ...c.datos, serial: e.target.value } }))
                }
              />
            </label>
            <label>
              Sistema operativo
              <input
                value={campos.datos.sistemaOperativo ?? ""}
                onChange={(e) =>
                  setCampos((c) => ({
                    ...c,
                    datos: { ...c.datos, sistemaOperativo: e.target.value },
                  }))
                }
              />
            </label>
            <label>
              IP
              <input
                value={campos.datos.ip ?? ""}
                onChange={(e) =>
                  setCampos((c) => ({ ...c, datos: { ...c.datos, ip: e.target.value } }))
                }
              />
            </label>
          </div>
          <label>
            Observaciones
            <textarea
              value={campos.datos.observaciones ?? ""}
              onChange={(e) =>
                setCampos((c) => ({
                  ...c,
                  datos: { ...c.datos, observaciones: e.target.value },
                }))
              }
            />
          </label>
          <div className="pc-form__acciones">
            <button type="submit" className="btn btn--primario" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setMostrarForm(false);
                setEditando(null);
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="computadores__filtros">
        <input
          placeholder="Buscar código, usuario, ubicación…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {TIPOS_COMPUTADOR.map((t) => (
            <option key={t} value={t}>
              {ETIQUETAS_TIPO_COMPUTADOR[t]}
            </option>
          ))}
        </select>
        <select value={filtroUbicacion} onChange={(e) => setFiltroUbicacion(e.target.value)}>
          <option value="">Todas las ubicaciones</option>
          {ubicaciones.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <select
          value={filtroEstado}
          onChange={(e) =>
            setFiltroEstado(e.target.value as "todos" | "activos" | "baja" | "vencidos")
          }
        >
          <option value="activos">Activos</option>
          <option value="vencidos">PM vencidos</option>
          <option value="baja">Fuera de servicio</option>
          <option value="todos">Todos</option>
        </select>
      </div>

      {cargando && <p>Cargando inventario...</p>}

      {!cargando && !faltaTabla && filtrados.length === 0 && (
        <p className="computadores__vacio">
          No hay computadores para mostrar. Usa “Cargar lista Excel” o “+ Nuevo PC”.
        </p>
      )}

      {filtrados.length > 0 && (
        <div className="computadores__tabla-wrap">
          <table className="computadores__tabla">
            <thead>
              <tr>
                <th>Código</th>
                <th>Ubicación</th>
                <th>Tipo</th>
                <th>Usuario</th>
                <th>SIESA</th>
                <th>Último PM</th>
                <th>Próximo PM</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((pc) => {
                const prox = etiquetaProximo(pc);
                return (
                  <tr key={pc.id} onClick={() => navigate(`/computadores/${pc.id}`)}>
                    <td>
                      <strong>{pc.codigo || "—"}</strong>
                    </td>
                    <td>{pc.ubicacion}</td>
                    <td>{ETIQUETAS_TIPO_COMPUTADOR[pc.tipo]}</td>
                    <td>{pc.usuario_asignado || "—"}</td>
                    <td>{pc.datos.siesa || "—"}</td>
                    <td>{pc.ultimo_pm || "—"}</td>
                    <td>
                      <span className={prox.clase}>{prox.texto}</span>
                    </td>
                    <td>
                      <span className={pc.activa ? "pc-badge pc-badge--activo" : "pc-badge pc-badge--baja"}>
                        {pc.activa ? "Activo" : "Baja"}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <SoloConPermiso permiso="editar.computadores">
                        <button type="button" className="btn" onClick={() => abrirEditar(pc)}>
                          Editar
                        </button>
                      </SoloConPermiso>
                      <SoloConPermiso permiso="eliminar.registros">
                        <button
                          type="button"
                          className="btn btn--peligro"
                          onClick={() => void manejarEliminar(pc)}
                        >
                          Eliminar
                        </button>
                      </SoloConPermiso>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default ComputadoresPage;
