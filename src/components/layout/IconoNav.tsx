import type { IconoNav } from "./navConfig";

/** Iconos SVG simples (stroke) para la barra inferior y la rejilla Más. */
function IconoNavSvg({ nombre }: { nombre: IconoNav }) {
  const props = {
    viewBox: "0 0 24 24",
    width: 22,
    height: 22,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (nombre) {
    case "inicio":
      return (
        <svg {...props}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
        </svg>
      );
    case "preventivo":
      return (
        <svg {...props}>
          <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.1 2.1-1.9-1.9 2-2.1Z" />
        </svg>
      );
    case "aprobar":
      return (
        <svg {...props}>
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case "correctivo":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      );
    case "solicitudes":
      return (
        <svg {...props}>
          <path d="M8 6h11a2 2 0 0 1 2 2v12H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
          <path d="M6 8H5a2 2 0 0 0-2 2v10" />
          <path d="M11 11h6M11 15h4" />
        </svg>
      );
    case "hojas":
      return (
        <svg {...props}>
          <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
          <path d="M14 3v5h5M9 13h6M9 17h4" />
        </svg>
      );
    case "computadores":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8M12 16v4" />
        </svg>
      );
    case "indicadores":
      return (
        <svg {...props}>
          <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
        </svg>
      );
    case "formatos":
      return (
        <svg {...props}>
          <path d="M8 3h6l4 4v14H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
          <path d="M14 3v4h4M10 12h6M10 16h4" />
        </svg>
      );
    case "personal":
      return (
        <svg {...props}>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M3 20c0-3 2.5-5 6-5s6 2 6 5M14 20c.3-2 1.8-3.5 4-3.5 1.5 0 2.7.7 3.4 1.7" />
        </svg>
      );
    case "usuarios":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
        </svg>
      );
    case "permisos":
      return (
        <svg {...props}>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      );
    case "matriz":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "mas":
    default:
      return (
        <svg {...props}>
          <circle cx="6" cy="12" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="18" cy="12" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}

export default IconoNavSvg;
