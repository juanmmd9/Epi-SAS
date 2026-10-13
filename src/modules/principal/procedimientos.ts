export interface ProcedimientoPortal {
  codigo: string;
  titulo: string;
  version: string;
  archivo: string;
  resumen: string;
}

/** Procedimientos de mantenimiento ya actualizados para el portal. */
export const PROCEDIMIENTOS_REALIZADOS: ProcedimientoPortal[] = [
  {
    codigo: "MT-PR-001",
    titulo: "Mantenimiento preventivo",
    version: "6",
    archivo: "/procedimientos/MT-PR-001-mantenimiento-preventivo-v6.docx",
    resumen:
      "Programar la cita, asignar al operario, ejecutar el preventivo y dejar el MT-RE-045 para la firma del líder.",
  },
  {
    codigo: "MT-PR-002",
    titulo: "Mantenimiento correctivo",
    version: "5",
    archivo: "/procedimientos/MT-PR-002-mantenimiento-correctivo-v5.docx",
    resumen:
      "Recibir la solicitud, atender la falla, registrar el correctivo y cerrar cuando el equipo queda operando.",
  },
];
