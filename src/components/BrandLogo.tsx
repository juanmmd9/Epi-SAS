import logoEpi from "../assets/epi-logo.png";

interface Props {
  className?: string;
  width?: number;
  height?: number;
}

/** Logo EPI empaquetado por Vite (ruta correcta en local, Pages y APK). */
function BrandLogo({ className, width = 240, height = 76 }: Props) {
  return (
    <img
      className={className}
      src={logoEpi}
      alt="EPI — Empresa de Producción Industrial"
      width={width}
      height={height}
      decoding="async"
    />
  );
}

export default BrandLogo;
