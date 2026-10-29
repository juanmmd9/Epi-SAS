# -*- coding: utf-8 -*-
"""Actualiza MT-PR-001 al flujo del Portal de Mantenimiento EPI (GC-RE-027)."""
from __future__ import annotations

from copy import deepcopy
from pathlib import Path

from docx import Document
from docx.oxml.ns import qn
from docx.text.paragraph import Paragraph

ORIGEN = Path(
    r"C:\Users\Ing. Mecanico\Desktop\MANTENIMIENTO\PROCEDIMIENTOS E INSTRUCTIVOS"
    r"\PROCEDIMIENTOS\MT-PR-001 procedimiento mantenimiento preventivo. V4_.docx"
)
DESTINO = ORIGEN.with_name(
    "MT-PR-001 procedimiento mantenimiento preventivo. V6.docx"
)


def set_cell_text(cell, text: str) -> None:
    """Reemplaza el texto de la celda conservando el estilo del primer párrafo."""
    paragraphs = cell.paragraphs
    if not paragraphs:
        cell.add_paragraph(text)
        return
    first = paragraphs[0]
    # Vaciar runs del primer párrafo
    for run in list(first.runs):
        run._element.getparent().remove(run._element)
    if first.runs:
        first.runs[0].text = text
    else:
        first.add_run(text)
    # Eliminar párrafos extra
    for para in paragraphs[1:]:
        p = para._element
        p.getparent().remove(p)


def replace_paragraph_text(paragraph: Paragraph, nuevo: str) -> None:
    if not paragraph.runs:
        paragraph.add_run(nuevo)
        return
    paragraph.runs[0].text = nuevo
    for run in paragraph.runs[1:]:
        run.text = ""


def insert_paragraph_after(paragraph: Paragraph, text: str) -> Paragraph:
    new_p = deepcopy(paragraph._element)
    # limpiar runs
    for child in list(new_p):
        if child.tag == qn("w:r"):
            new_p.remove(child)
    paragraph._element.addnext(new_p)
    nuevo = Paragraph(new_p, paragraph._parent)
    nuevo.add_run(text)
    return nuevo


def main() -> None:
    doc = Document(str(ORIGEN))

    # --- Párrafos de responsabilidades ---
    for para in doc.paragraphs:
        t = para.text.strip()
        if t.startswith("Coordinador de Mantenimiento:"):
            replace_paragraph_text(
                para,
                "Coordinador de Mantenimiento: Planificación general del mantenimiento "
                "preventivo en el Portal de Mantenimiento EPI (cronograma / Inicio), "
                "asignación de PM, control de registros digitales, usuarios/roles del "
                "portal y aseguramiento del cumplimiento.",
            )
        elif t.startswith("Auxiliares operativos:"):
            replace_paragraph_text(
                para,
                "Auxiliares / operadores de mantenimiento: Ejecución del mantenimiento "
                "programado, registro del PM en el módulo Preventivo del Portal "
                "(actividad, repuestos, verificación) y firma como responsable de "
                "mantenimiento en el MT-RE-045.",
            )

    # Insertar responsabilidad del líder tras auxiliares
    for para in list(doc.paragraphs):
        if "Auxiliares / operadores de mantenimiento:" in para.text:
            insert_paragraph_after(
                para,
                "Líder de área (usuario portal): Verifica el equipo tras el PM; registra "
                "inspección visual y pruebas de funcionamiento (A/NA) en el Portal; "
                "firma y aprueba el MT-RE-045. Solo con esta aprobación el cronograma "
                "cuenta el PM como cumplido.",
            )
            break

    # --- Documentos a consultar / diligenciar ---
    for para in doc.paragraphs:
        t = para.text.strip()
        if t == "Programa de mantenimiento MT-RE-025 V 02":
            replace_paragraph_text(
                para,
                "Portal de Mantenimiento EPI (cronograma / Inicio — fuente oficial del programa PM)",
            )
        elif t.startswith("Ficha técnica"):
            # insertar docs de consulta adicionales antes de ficha
            insert_paragraph_after(
                para,
                "GC-RE-027 Gestión del cambio (implementación del Portal)",
            )
            break

    # Re-scan for diligenciar list
    for i, para in enumerate(doc.paragraphs):
        if para.text.strip() == "MT-RE-044 Hoja de vida de maquina o equipo":
            replace_paragraph_text(
                para,
                "Portal de Mantenimiento EPI — módulo Hojas de vida (fuente oficial) / MT-RE-044",
            )
        elif para.text.strip() == "MT-RE-045 Formato de Mantenimiento":
            replace_paragraph_text(
                para,
                "MT-RE-045 Reporte de mantenimiento preventivo (generado y firmado en el Portal)",
            )
        elif para.text.strip() == "MT-RE-025 programa de mantenimiento preventivo.":
            replace_paragraph_text(
                para,
                "Cronograma PM del Portal (Inicio). MT-RE-025 queda como referencia histórica/respaldo si aplica.",
            )

    # --- Tabla 0: Planificación ---
    t0 = doc.tables[0]
    set_cell_text(
        t0.rows[1].cells[1],
        "Realización y/o actualización de las Hojas de Vida de los equipos en el "
        "Portal de Mantenimiento EPI (módulo Hojas de vida).",
    )
    set_cell_text(
        t0.rows[1].cells[3],
        "Se recopila y actualiza en el Portal la información de equipos, instrumentos "
        "e infraestructura que requieren mantenimiento. Las fotos y datos técnicos "
        "quedan centralizados en la nube.",
    )
    set_cell_text(
        t0.rows[1].cells[4],
        "Portal — Hojas de vida\n"
        "MT-RE-044 (impresión/respaldo)\n\n"
        "Laboratorio:\nLA-RE-015. Hoja de vida de equipamiento",
    )

    set_cell_text(
        t0.rows[2].cells[1],
        "Elaborar / actualizar el programa de mantenimiento preventivo en el Portal "
        "(cronograma por área: frecuencia, fecha de PM y próximo PM).",
    )
    set_cell_text(
        t0.rows[2].cells[3],
        "Se organiza el mantenimiento en el tiempo desde el Portal: listado de equipos "
        "a intervenir, cuándo y con qué frecuencia, con base en manuales, criticidad "
        "o histórico. El Portal es la fuente oficial del programa (corte respecto a "
        "Excel/papel según GC-RE-027).",
    )
    set_cell_text(
        t0.rows[2].cells[4],
        "Portal — Inicio / Cronograma PM\n"
        "MT-RE-025 (referencia histórica si aplica)",
    )

    set_cell_text(
        t0.rows[3].cells[1],
        "Divulgación del programa de mantenimiento preventivo a cada área",
    )
    set_cell_text(
        t0.rows[3].cells[3],
        "Cada área consulta su programa en el Portal (Inicio / cronograma). "
        "Adicionalmente se puede reforzar por correo electrónico con confirmación "
        "de recibido, o de forma impresa al coordinador del proceso.",
    )
    set_cell_text(
        t0.rows[3].cells[4],
        "Portal — Inicio / Cronograma\n"
        "Mensaje de correo electrónico (si aplica)\n"
        "Matriz de divulgación (si aplica)",
    )

    # --- Tabla 1: Ejecución PM ---
    t1 = doc.tables[1]
    set_cell_text(
        t1.rows[1].cells[1],
        "Al inicio de cada mes, asegurar la visibilidad de los equipos y fechas de PM "
        "del mes en el Portal (Inicio) y, si aplica, recordar al líder de área.",
    )
    set_cell_text(
        t1.rows[1].cells[2],
        "Coordinador de mantenimiento",
    )
    set_cell_text(
        t1.rows[1].cells[3],
        "El Portal muestra el PM del mes por área para disponer el equipo sin afectar "
        "la operación.\n\n"
        "Laboratorio:\n"
        "El mantenimiento debe realizarse y finalizarse al menos un día antes de la "
        "fecha de próximo mantenimiento.",
    )
    set_cell_text(
        t1.rows[1].cells[4],
        "Portal — Inicio (PM del mes)\n"
        "Asignación de PM (si aplica)",
    )

    set_cell_text(
        t1.rows[2].cells[1],
        "Ejecutar el mantenimiento programado y registrarlo en el módulo Preventivo "
        "del Portal.",
    )
    set_cell_text(
        t1.rows[2].cells[2],
        "Auxiliares / operadores de mantenimiento",
    )
    set_cell_text(
        t1.rows[2].cells[3],
        "Ejecución:\n"
        "Se realiza el mantenimiento según lista de chequeo (manual o documento) y se "
        "registra en el Portal (actividad realizada, técnicos, fecha).\n\n"
        "NOTA: Colocar identificador al equipo indicando fuera de servicio o en "
        "mantenimiento para evitar su uso.",
    )
    set_cell_text(
        t1.rows[2].cells[4],
        "Portal — Preventivo\n"
        "MT-RE-045 (borrador vinculado)",
    )

    set_cell_text(
        t1.rows[3].cells[1],
        "Reportar las novedades encontradas y los ajustes realizados en el Portal / "
        "MT-RE-045.",
    )
    set_cell_text(
        t1.rows[3].cells[2],
        "Coordinador / Auxiliar de mantenimiento",
    )
    set_cell_text(
        t1.rows[3].cells[3],
        "Dejar por escrito en el Portal los eventos encontrados durante el "
        "mantenimiento. El operador firma el MT-RE-045 como responsable de "
        "mantenimiento y envía a aprobación del líder de área.",
    )
    set_cell_text(
        t1.rows[3].cells[4],
        "Portal — Preventivo\n"
        "MT-RE-045 Formato de Mantenimiento",
    )

    set_cell_text(
        t1.rows[4].cells[3],
        "Registrar en el MT-RE-045 del Portal los repuestos, aceite, insumos y "
        "consumibles cambiados (una línea por ítem).",
    )
    set_cell_text(
        t1.rows[4].cells[4],
        "Portal — MT-RE-045\nFormato de Mantenimiento",
    )

    set_cell_text(
        t1.rows[7].cells[1],
        "Realizar pruebas de funcionamiento e inspección visual; el líder de área "
        "registra el resultado (A/NA) al aprobar en el Portal.",
    )
    set_cell_text(
        t1.rows[7].cells[2],
        "Auxiliar de mantenimiento y líder de área",
    )
    set_cell_text(
        t1.rows[7].cells[3],
        "Las pruebas e inspección visual se realizan cuantas veces sea necesario. "
        "El líder describe qué inspeccionó/probó, marca A (aprobado) o NA (no "
        "aprobado) y firma la verificación en el Portal antes de liberar el equipo.",
    )
    set_cell_text(
        t1.rows[7].cells[4],
        "Portal — Aprobación PM\n"
        "MT-RE-045 (inspección visual / pruebas)",
    )

    set_cell_text(
        t1.rows[8].cells[1],
        "Liberar el equipo: el líder aprueba y firma en el Portal; el PM queda "
        "cumplido en el cronograma.",
    )
    set_cell_text(
        t1.rows[8].cells[2],
        "Líder de área / Coordinador de mantenimiento",
    )
    set_cell_text(
        t1.rows[8].cells[3],
        "Se entrega el equipo funcionando a satisfacción con el MT-RE-045 firmado "
        "(mantenimiento + verificación). Sin aprobación del líder en el Portal, el "
        "cronograma no marca el PM como cumplido.",
    )
    set_cell_text(
        t1.rows[8].cells[4],
        "Portal — Aprobación PM\n"
        "MT-RE-045 Formato de Mantenimiento",
    )

    set_cell_text(
        t1.rows[9].cells[3],
        "Registrar el mantenimiento en la matriz de equipamiento del Laboratorio y "
        "actualizar la hoja de vida correspondiente (Portal / formatos de laboratorio).",
    )
    set_cell_text(
        t1.rows[9].cells[4],
        "LA-RE-055 listado de equipos e instrumentos\n"
        "LA-RE-015 hoja de vida de equipamiento\n"
        "Portal — Hojas / Preventivo (si aplica)",
    )

    # --- Historial versión 6 ---
    ver = doc.tables[3]
    # última fila es versión 6 vacía
    ultima = ver.rows[-1]
    set_cell_text(ultima.cells[0], "6")
    set_cell_text(ultima.cells[1], "Septiembre 2026")
    set_cell_text(
        ultima.cells[2],
        "Se alinea el procedimiento al Portal de Mantenimiento EPI (GC-RE-027): el "
        "Portal pasa a ser la fuente oficial para hojas de vida, cronograma/programa "
        "PM, registro del preventivo y generación/firma del MT-RE-045. Se incorpora "
        "la aprobación del líder de área (inspección visual, pruebas A/NA y firma de "
        "verificación) como requisito para marcar el PM cumplido. Se actualizan "
        "responsabilidades, registros y documentos a consultar/diligenciar.",
    )

    DESTINO.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(DESTINO))
    print(f"OK -> {DESTINO}")


if __name__ == "__main__":
    main()
