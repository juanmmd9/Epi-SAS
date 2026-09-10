/**
 * Convierte texto a caracteres compatibles con fuentes WinAnsi de pdf-lib (Helvetica).
 * Debe aplicarse siempre antes de widthOfTextAtSize / drawText.
 */
export function textoCompatibleWinAnsi(texto: string): string {
  return (
    String(texto ?? "")
      .replace(/≤/g, "<=")
      .replace(/≥/g, ">=")
      .replace(/≠/g, "!=")
      .replace(/≈/g, "~")
      .replace(/\u2264/g, "<=")
      .replace(/\u2265/g, ">=")
      .replace(/\u2260/g, "!=")
      .replace(/\u2248/g, "~")
      .replace(/⩽|≦|≲/g, "<=")
      .replace(/⩾|≧|≳/g, ">=")
      .replace(/\u00AB/g, '"')
      .replace(/\u00BB/g, '"')
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/\u2014/g, "-")
      .replace(/\u2013/g, "-")
      .replace(/\u2022/g, "-")
      .replace(/\u2026/g, "...")
      .replace(/\u00B7/g, " - ")
      .replace(/\u2192/g, "->")
      // Fuera de WinAnsi / Latin-1 (incluye cualquier ≤ que se haya escapado)
      .replace(/[^\t\n\r\u0020-\u007E\u00A0-\u00FF]/g, "")
  );
}
