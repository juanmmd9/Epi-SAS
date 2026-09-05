/**
 * Convierte texto a caracteres compatibles con fuentes WinAnsi de pdf-lib (Helvetica).
 */
export function textoCompatibleWinAnsi(texto: string): string {
  return (
    String(texto ?? "")
      .replace(/\u2265/g, ">=")
      .replace(/\u2264/g, "<=")
      .replace(/\u2260/g, "!=")
      .replace(/\u00AB/g, '"')
      .replace(/\u00BB/g, '"')
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/\u2014/g, "-")
      .replace(/\u2013/g, "-")
      .replace(/\u2026/g, "...")
      .replace(/\u00B7/g, " - ")
      .replace(/\u2192/g, "->")
      .replace(/[^\t\n\r\u0020-\u007E\u00A0-\u00FF]/g, "")
  );
}
