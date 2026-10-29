export interface ItemInventario {
  descripcion: string;
  cantidad: string;
  unidad: string;
}

export interface GrupoInventario {
  id: "herramientas" | "insumos";
  titulo: string;
  items: ItemInventario[];
}

export const INVENTARIO_MANTENIMIENTO: GrupoInventario[] = [
  {
    "id": "herramientas",
    "titulo": "Herramientas",
    "items": [
      {
        "descripcion": "ALICATE DE 8 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "ATORNILLADOR DE ESTRIA",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "ATORNILLADOR DE PALA",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA 35/64 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 1\"",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 1/4",
        "cantidad": "5",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 1/64 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 1/8",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 10 mm",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 11 mm",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 12 mm",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 12 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 13 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 13,4 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 16,5 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 17 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 18 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 18/64 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 3/16",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 3/8",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 4 mm",
        "cantidad": "3",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 5 mm",
        "cantidad": "4",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 5/16",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 6 mm",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 7 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 7,4 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 7/16",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 7/64 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 8 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 8,7 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 8/16",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 9 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 9/16",
        "cantidad": "3",
        "unidad": "UND"
      },
      {
        "descripcion": "BURIL TUNGSTENO DERECHO DE 3/8",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "CALIBRADOR PIE DE REY DE 8 PULGADAS DIGITAL",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "CAUTIN RO 7372B",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "CERRUCHO",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "COMPARADOR DE CARATULA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "CORTA FRIO",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "DECAMETRO",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "ESCARIADOR DE 1\"",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "ESCARIADOR DE 1/2",
        "cantidad": "3",
        "unidad": "UND"
      },
      {
        "descripcion": "ESCARIADOR DE 19",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "ESCARIADOR DE 20",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "ESCARIADOR DE 3/8",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "ESCARIADOR DE 7/8",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "ESCUADRA METLICA DE 90 GRADOS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "EXTRACTOR DE BALINERAS DE 100 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "FLEXOMETRO DE 5 METROS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "FUENTE DE PODER REGLETA AC",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "FUENTE DE PODER TAXUN PS-100200",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "GAFAS CON LENTE DE EXPANSION Y LINTERNA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "GONIOMETRO",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "GRASERA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "HOMBRE SOLO DE 6 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "HOMBRE SOLO EN C DE 6 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE LIMAS JUNIOR",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS 1/2 13NC",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS 1/4 X 20NF",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS 1/8 40NC",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS 3/8 16NC",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS 5/16 18NC",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS 5/32 X 32",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS 5/8 11NC",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS 7/16 20NF",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS M10 X 1",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS M10 X 1.5",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS M14 X 1,5",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS M14 X 2,0",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS M16 X 2",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS M20 X 2,5",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS M3 X 0,5",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS M4 X 0,78",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS M5 X 0,3",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS M8 36\" UNF",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LIMA PLANA FINA DE 8 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LIMA PLANA MEDIA DE 8 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE ALLEN DE 1/16",
        "cantidad": "3",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE ALLEN DE 1/4",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE ALLEN DE 10mm",
        "cantidad": "5",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE ALLEN DE 12mm",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE ALLEN DE 14mm",
        "cantidad": "4",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE ALLEN DE 2,5mm",
        "cantidad": "3",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE ALLEN DE 2mm",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE ALLEN DE 3/16",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE ALLEN DE 5mm",
        "cantidad": "8",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE ALLEN DE 6mm",
        "cantidad": "3",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE ALLEN DE 8mm",
        "cantidad": "4",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE BOCAFIJA DE 1 3/16",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE BOCAFIJA DE 1\"",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE BOCAFIJA DE 10",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE BOCAFIJA DE 13",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE BOCAFIJA DE 14",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE BOCAFIJA DE 15/16",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE BOCAFIJA DE 16",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE BOCAFIJA DE 17",
        "cantidad": "3",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE BOCAFIJA DE 19",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE BOCAFIJA DE 26",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE BOCAFIJA DE 3/4",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE BOCAFIJA DE 30",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE BOCAFIJA DE 5/8",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE DE ESTRIA 29 X 26",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE DE ESTRIA 7/8 X 1\"",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE DE EXPANSION DE 12 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE DE EXPANSION DE 15 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE MORDAZA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE PARA TUBO DE 12 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE PARA TUBO DE 8 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "MARCO DE SEGUETA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "MARCO DE SEGUETA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "MARTILLO DE UÑA DE 11 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "MARTILLO DE UÑA DE 12 PULGADAS",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "MOTORTOLL NEUMATICO DE 1/8",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "NIVEL DE GOTA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "NIVEL DE GOTA DE ALUMINIO 3 BURBUJAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PALA HOYADORA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PALENDRA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PALIN",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PINZA PARA ANILLOS DE SEGURIDAD",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PISTOLA DE CALOR STANLEY STXH 2000-83",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PISTOLA PARA SILICONA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PISTOLA PARA SILICONA 240V 40W",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PLOMADA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PONCHADORA DE CABLE UTP DE 8 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PORRA DE 2 LIBRAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PORRA DE CAUCHO",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PORTATERRAJA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PORTATERRAJA DE M25 A 1\"",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PULIDORA ELECTRICA DE 180 MM",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PULIDORA ELECTRICA DE 180 MM STANLEY JLG",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "REMACHADORA POP MR 77 DE 11 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "RIMA CONICA # 3",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "RIMA CONICA # 5",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "SERRUCHO DE 23 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "SOPLADORA PARA TARJETAS ELECTRONICAS KH8255",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "TALADRO MANUAL (MARCA Y DIAMETRO)",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "TALADRO PERCUTOR",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "TIJERAS PARA METAL",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "VOLVEDOR DE",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "VOLVEDOR DE",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "VOLVEDOR DE 1/8 A 3/16",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA DE 1/2 PARA MADERA",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "Varilla Roscada 1/2\" Pulgada x 3 mts Zincada",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "ARANDELA, TUERCAS 1/2\" (100 CADA UNA ESTO VIENE CON LA VARILLA)",
        "cantidad": "100",
        "unidad": "UND"
      },
      {
        "descripcion": "TALADRO DWALT",
        "cantidad": "1",
        "unidad": "UND"
      }
    ]
  },
  {
    "id": "insumos",
    "titulo": "Insumos y repuestos",
    "items": [
      {
        "descripcion": "ABRAZADERA PARA TUBO DOBLE ALA DE 3/8 GALVANIZADA",
        "cantidad": "28",
        "unidad": "UND"
      },
      {
        "descripcion": "ABRAZADERA PARA TUBO DOBLE ALA DE 1/2 GALVANIZADA",
        "cantidad": "64",
        "unidad": "UND"
      },
      {
        "descripcion": "ABRAZADERA PARA TUBO DOBLE ALA DE 3/4 GALVANIZADA",
        "cantidad": "88",
        "unidad": "UND"
      },
      {
        "descripcion": "ABRAZADERA PARA TUBO UNA ALA DE 1/2",
        "cantidad": "20",
        "unidad": "UND"
      },
      {
        "descripcion": "ABRAZADERA PARA TUBO UNA ALA DE 3/4",
        "cantidad": "31",
        "unidad": "UND"
      },
      {
        "descripcion": "ADAPTADOR MACHO PVC PRESION DE 1/2 PULGADA",
        "cantidad": "4",
        "unidad": "UND"
      },
      {
        "descripcion": "ADAPTADOR MACHO PVC PRESION DE 3/4 DE PULGADA",
        "cantidad": "4",
        "unidad": "UND"
      },
      {
        "descripcion": "AEROSOL DESENGRASANTE DESINFECTANTE",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "AEROSOL MULTIUSOS LUBRICANTE WD40",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "ALICATE DE 8 PULGADAS",
        "cantidad": "1",
        "unidad": "MILILITROS"
      },
      {
        "descripcion": "ALICATE ELECTRICISTA 8\" PULGADAS",
        "cantidad": "",
        "unidad": "GALON"
      },
      {
        "descripcion": "ALICATE UNIVERSAL 8\" PULGADAS",
        "cantidad": "1",
        "unidad": "CUÑETE"
      },
      {
        "descripcion": "ALICATES PARA ANILLO X 5",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "AMARRA PARA TEJAS 26mm",
        "cantidad": "100",
        "unidad": "UND"
      },
      {
        "descripcion": "AMARRA PLASTICA DE 3,6 X 300",
        "cantidad": "15",
        "unidad": "UND"
      },
      {
        "descripcion": "AMONIO CUATERNARIO",
        "cantidad": "400",
        "unidad": "UND"
      },
      {
        "descripcion": "ANTICORROSIVO GRIS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "ANTICORROSIVO NEGRO",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "ARANDELA PLANA DE 3/8",
        "cantidad": "70",
        "unidad": "UND"
      },
      {
        "descripcion": "ATORNILLADOR DE ESTRIA",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "ATORNILLADOR DE ESTRIA 21mm 1/4 X 6 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "ATORNILLADOR DE ESTRIA 3/16 X 6 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "ATORNILLADOR DE PALA",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "ATORNILLADOR DE PALA 1/4 X 6 PULGADAS",
        "cantidad": "1",
        "unidad": "METROS"
      },
      {
        "descripcion": "ATORNILLADOR DE PALA 1/4 X 8 PULGADAS",
        "cantidad": "1",
        "unidad": "METROS"
      },
      {
        "descripcion": "ATORNILLADOR DE PALA 3/16 X 6 PULGADAS",
        "cantidad": "1",
        "unidad": "METROS"
      },
      {
        "descripcion": "BOMBA TIPO SPRAY DE 2,1 LITROS",
        "cantidad": "1",
        "unidad": "METROS"
      },
      {
        "descripcion": "BORNERA ELECTRICA TRIFASICO 6 X 4 Cm",
        "cantidad": "2",
        "unidad": "METROS"
      },
      {
        "descripcion": "BOTA PARA CONECTOR RJ45 UTP",
        "cantidad": "28",
        "unidad": "METROS"
      },
      {
        "descripcion": "BROCA 35/64 mm",
        "cantidad": "1",
        "unidad": "METROS"
      },
      {
        "descripcion": "BROCA CONCRETO 1/4 X 6",
        "cantidad": "1",
        "unidad": "METROS"
      },
      {
        "descripcion": "BROCA CONCRETO 3/8 X 6",
        "cantidad": "1",
        "unidad": "METROS"
      },
      {
        "descripcion": "BROCA HSS 1\"",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 1/4",
        "cantidad": "5",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 1/64 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 1/8",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 10 mm",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 11 mm",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 12 mm",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 12 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 13 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 13,4 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 16,5 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 17 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 18 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 18/64 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 3/16",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 3/8",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 4 mm",
        "cantidad": "3",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 5 mm",
        "cantidad": "4",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 5/16",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 6 mm",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 7 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 7,4 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 7/16",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 7/64 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 8 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 8,7 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 8/16",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 9 mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA HSS 9/16",
        "cantidad": "3",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCA LAMINA 3/16",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "BROCHA DE 3 PULGADAS",
        "cantidad": "1",
        "unidad": "METROS"
      },
      {
        "descripcion": "BROCHA DE 4 PULGADAS",
        "cantidad": "1",
        "unidad": "METROS"
      },
      {
        "descripcion": "BURIL TUNGSTENO DERECHO DE 3/8",
        "cantidad": "2",
        "unidad": "CUÑETE"
      },
      {
        "descripcion": "CABLE CALIBRE 10 NEGRO",
        "cantidad": "40",
        "unidad": "UND"
      },
      {
        "descripcion": "CABLE CALIBRE 12 BLANCO",
        "cantidad": "50",
        "unidad": "UND"
      },
      {
        "descripcion": "CABLE CALIBRE 12 ROJO",
        "cantidad": "100",
        "unidad": "UND"
      },
      {
        "descripcion": "CABLE CALIBRE 14 AMARILLO",
        "cantidad": "100",
        "unidad": "UND"
      },
      {
        "descripcion": "CABLE CALIBRE 14 BLANCO",
        "cantidad": "35",
        "unidad": "UND"
      },
      {
        "descripcion": "CABLE CALIBRE 14 ROJO",
        "cantidad": "30",
        "unidad": "UND"
      },
      {
        "descripcion": "CABLE CALIBRE 16 AZUL",
        "cantidad": "50",
        "unidad": "UND"
      },
      {
        "descripcion": "CABLE CALIBRE 16 BLANCO",
        "cantidad": "30",
        "unidad": "UND"
      },
      {
        "descripcion": "CABLE CALIBRE 16 VERDE",
        "cantidad": "20",
        "unidad": "UND"
      },
      {
        "descripcion": "CABLE ENCAUCHETADO 4 X 10 AWG",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "CABLE ENCAUCHETADO 4 X 10 AWG",
        "cantidad": "18",
        "unidad": "UND"
      },
      {
        "descripcion": "CABLE ENCAUCHETADO 4 X 8 AWG",
        "cantidad": "7.6",
        "unidad": "UND"
      },
      {
        "descripcion": "CABLE UTP 6 24 AWG",
        "cantidad": "150",
        "unidad": "UND"
      },
      {
        "descripcion": "CAJA DE PASO GALVANIZADA 2X2 TIPO USA",
        "cantidad": "5",
        "unidad": "UND"
      },
      {
        "descripcion": "CAJA DE PASO GALVANIZADA 4X2 TIPO USA",
        "cantidad": "8",
        "unidad": "UND"
      },
      {
        "descripcion": "CAJA DE PASO GALVANIZADA 4X4 TIPO USA",
        "cantidad": "21",
        "unidad": "UND"
      },
      {
        "descripcion": "CAJA PLASTICA CON RIEL OMEGA CSP 4B 4 PUESTOS",
        "cantidad": "3",
        "unidad": "UND"
      },
      {
        "descripcion": "CAJA PLASTICA SCH40 4X2",
        "cantidad": "5",
        "unidad": "UND"
      },
      {
        "descripcion": "CALIBRADOR PIE DE REY DE 8 PULGADAS DIGITAL",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "CANALETA METALICA PARA PANEL X 3 METROS",
        "cantidad": "13",
        "unidad": "UND"
      },
      {
        "descripcion": "CANALETA PLASTICA CON ADHESIVO 1 X 1 PULGADA",
        "cantidad": "10",
        "unidad": "UND"
      },
      {
        "descripcion": "CANALETA PLASTICA CON REGILLA X 3 METROS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "CANCAMO NUMERO 12",
        "cantidad": "15",
        "unidad": "UND"
      },
      {
        "descripcion": "CARETA ESMERIL",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "CARETA PARA SOLDAR ELITE",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "CARGADOR 100 240V 0,6AMP INPUT 12V 1,25AMP",
        "cantidad": "1",
        "unidad": "METROS"
      },
      {
        "descripcion": "CARGADOR LG 100 240V 1AMP SALIDA 19V 1,3 AMP DC",
        "cantidad": "1",
        "unidad": "CUÑETE"
      },
      {
        "descripcion": "CARGADOR YN 1210 110240V SALIDA 12V 1AMP DC",
        "cantidad": "1",
        "unidad": "CUÑETE"
      },
      {
        "descripcion": "CELDA DE CARGA LEXUS 5 X 7 X 2 PULGADAS",
        "cantidad": "1",
        "unidad": "CUÑETE"
      },
      {
        "descripcion": "CEPILLO DE ACERO 6 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "CERRUCHO",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "CHAZO DE EXPANSION DE 1/2 X 6",
        "cantidad": "4",
        "unidad": "UND"
      },
      {
        "descripcion": "CHAZO DE EXPANSION DE 3/4 X 4 1/2",
        "cantidad": "4",
        "unidad": "UND"
      },
      {
        "descripcion": "CHAZO PLASTICO MARIPOSA DE 1/4",
        "cantidad": "40",
        "unidad": "GALON"
      },
      {
        "descripcion": "CHAZO PLASTICO MARIPOSA DE 5/16",
        "cantidad": "30",
        "unidad": "GALON"
      },
      {
        "descripcion": "CINTA AISLANTE SCOTCH 33",
        "cantidad": "1",
        "unidad": "CUÑETE"
      },
      {
        "descripcion": "CINTA SILICONADA PARA HORNO 6m",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "CINTA SUPER 33+ 3M BLANCA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "CINTA SUPER 33+ 3M ROJA",
        "cantidad": "1",
        "unidad": "METROS"
      },
      {
        "descripcion": "CINTA SUPER 33+ 3M VERDE",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "CINTA TEFLON DE 19mm x 15m",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "CLAVIJA HEMBRA 2 PATAS CAUCHO KONTIKY 15AMP",
        "cantidad": "6",
        "unidad": "UND"
      },
      {
        "descripcion": "CLAVO DE ACERO CAJA POR 500Gr",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "CLICERINA LIQUIDA",
        "cantidad": "200",
        "unidad": "UND"
      },
      {
        "descripcion": "CODO PVC PRESION DE 1 PULGADA",
        "cantidad": "15",
        "unidad": "UND"
      },
      {
        "descripcion": "CODO PVC PRESION DE 1/2 PULGADA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "CODO PVC PRESION DE 3/4 PULGADA",
        "cantidad": "9",
        "unidad": "UND"
      },
      {
        "descripcion": "CODO PVC SANITARIO 45 GRADOS 4 PULGADAS",
        "cantidad": "13",
        "unidad": "UND"
      },
      {
        "descripcion": "CODO PVC SANITARIO 90 GRADOS 4 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "CODO PVC SANITARIO DE 2 PULGADAS",
        "cantidad": "4",
        "unidad": "UND"
      },
      {
        "descripcion": "CODO PVC SANITARIO DE 3 PULGADAS",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "COMANDOS DE SEÑALIZACION 22mm 24V AC/DC",
        "cantidad": "11",
        "unidad": "UND"
      },
      {
        "descripcion": "COMPARADOR DE CARATULA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "CONDIT BOX T DE 1/2 PULGADA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "CONDULETA CONDIT1/2 PULGADA",
        "cantidad": "6",
        "unidad": "UND"
      },
      {
        "descripcion": "CONDULETA RAWELT OLB 306 DE 2 PULGADAS",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "CONECTOR 1 A 2 HEMBRA PARA CABLE UTP",
        "cantidad": "6",
        "unidad": "UND"
      },
      {
        "descripcion": "CONECTOR AISLADO TIPO DESVIACION 562 3M",
        "cantidad": "45",
        "unidad": "UND"
      },
      {
        "descripcion": "CONECTOR CERAMICO 2 LINEAS 10 QWG",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "CONECTOR CERAMICO 2 LINEAS 14 QWG",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "CONECTOR ELECTRICO EN PVC 3/4",
        "cantidad": "11",
        "unidad": "UND"
      },
      {
        "descripcion": "CONECTOR GALVANIZADO DE 1/2",
        "cantidad": "20",
        "unidad": "UND"
      },
      {
        "descripcion": "CONECTOR GALVANIZADO DE 3/4",
        "cantidad": "22",
        "unidad": "UND"
      },
      {
        "descripcion": "CONECTOR LINEA TELEFONICA DSL 498",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "CONECTOR LINEA TELEFONICA DSL 499",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "CONECTOR PVC DE 1/2 SC40 GRIS",
        "cantidad": "24",
        "unidad": "UND"
      },
      {
        "descripcion": "CONECTOR PVC DE 3/4 SC40 GRIS",
        "cantidad": "3",
        "unidad": "UND"
      },
      {
        "descripcion": "COPA SIERRA 8 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "CORAZA PLASTICA DE 1/2 TIPO ESPIRAL",
        "cantidad": "10",
        "unidad": "UND"
      },
      {
        "descripcion": "CORAZA PLASTICA DE 3/8 TIPO ESPIRAL",
        "cantidad": "4",
        "unidad": "UND"
      },
      {
        "descripcion": "CORREA SINCRONICA 20 X 57 Cm KAITEN 52289664",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "CORTA FRIO",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "CORTA FRIO DE 7 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "CURVA GALVANIZADA 45 GRADOS DE 1/4",
        "cantidad": "9",
        "unidad": "UND"
      },
      {
        "descripcion": "CURVA GALVANIZADA 45 GRADOS DE 3/4",
        "cantidad": "5",
        "unidad": "UND"
      },
      {
        "descripcion": "CURVA PLASTICA SCH 40 1/2",
        "cantidad": "10",
        "unidad": "UND"
      },
      {
        "descripcion": "CURVA PLASTICA SCH 40 3/4",
        "cantidad": "10",
        "unidad": "UND"
      },
      {
        "descripcion": "DISCO DE CORTE METALICO 4 1/2 PULGADA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "DISCO DE CORTE METALICO 7 PULGADAS",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "ELECTRODO DE SOLDADURA 7018 DE 1/8",
        "cantidad": "6.5",
        "unidad": "UND"
      },
      {
        "descripcion": "ESCALERA CAMASUTRA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "ESCARIADOR DE 1\"",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "ESCARIADOR DE 1/2",
        "cantidad": "3",
        "unidad": "UND"
      },
      {
        "descripcion": "ESCARIADOR DE 19",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "ESCARIADOR DE 20",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "ESCARIADOR DE 3/8",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "ESCARIADOR DE 7/8",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "ESCOBILLA PARA PULIDORA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "ESCUADRA METALICA DE 90",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "ESPATULA METALICA DE 1 PULGADA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "ESPIRAL PARA CABLE DE 12mm",
        "cantidad": "1.5",
        "unidad": "UND"
      },
      {
        "descripcion": "ESPIRAL PARA CABLE DE 15mm",
        "cantidad": "150",
        "unidad": "UND"
      },
      {
        "descripcion": "ESPIRAL PARA CABLE DE 4mm",
        "cantidad": "7",
        "unidad": "UND"
      },
      {
        "descripcion": "ESTACION DE MANDO 10A 3 PULSADORES",
        "cantidad": "EBCHQ",
        "unidad": "METROS"
      },
      {
        "descripcion": "ESTAÑO PARA SOLDAR",
        "cantidad": "1",
        "unidad": "METROS"
      },
      {
        "descripcion": "ESTUCO PLASTICO CUÑETE",
        "cantidad": "3",
        "unidad": "METROS"
      },
      {
        "descripcion": "EXTENSION ENCAUCHETADA DE 15 METROS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "FILTRO PARA COMPRESOR W 719/4",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "FINAL DE CARRERA 5PK 5A 250VAC",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "FINAL DE CARRERA T2 5A 250VAC",
        "cantidad": "7",
        "unidad": "UND"
      },
      {
        "descripcion": "FLEXOMETRO DE 5 METROS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "FUENTE EBCHQ REF: 43050 110-240VAC INPUT 0,5AMP",
        "cantidad": "4",
        "unidad": "UND"
      },
      {
        "descripcion": "FUSIBLE F 10A 250V 3 X 20 mm",
        "cantidad": "6",
        "unidad": "UND"
      },
      {
        "descripcion": "FUSIBLE F 15A 25V 6 X 30 mm",
        "cantidad": "8",
        "unidad": "UND"
      },
      {
        "descripcion": "FUSIBLE F 5A 250V 6 X 30 mm",
        "cantidad": "6",
        "unidad": "UND"
      },
      {
        "descripcion": "GANCHO LEGAJADOR PLASTICO",
        "cantidad": "40",
        "unidad": "UND"
      },
      {
        "descripcion": "GONIOMETRO",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "GRAPA 80-10 SENCO CAJA X 10000 UNDS",
        "cantidad": "9500",
        "unidad": "UND"
      },
      {
        "descripcion": "GRAPA PISA CABLE 27-18C BLANCO",
        "cantidad": "100",
        "unidad": "UND"
      },
      {
        "descripcion": "GRAPADORA SENCO GMH - 80 DE 6 A 14mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "GRASERA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "GUAYA 5/16",
        "cantidad": "100",
        "unidad": "UND"
      },
      {
        "descripcion": "HOMBRE SOLO DE 6 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "HOMBRE SOLO EN C DE 6 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "INTERRUPTOR SIMPLE",
        "cantidad": "2",
        "unidad": "METROS"
      },
      {
        "descripcion": "JUEGO DE LIMAS JUNIOR",
        "cantidad": "1",
        "unidad": "METROS"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS 1/2 13NC",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS 1/4 X 20NF",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS 1/8 40NC",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS 3/8 16NC",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS 5/16 18NC",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS 5/32 X 32",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS 5/8 11NC",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS 7/16 20NF",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS M10 X 1",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS M10 X 1.5",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS M14 X 1,5",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS M14 X 2,0",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS M16 X 2",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS M20 X 2,5",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS M3 X 0,5",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS M4 X 0,78",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS M5 X 0,3",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "JUEGO DE MACHUELOS M8 36\" UNF",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LAMPARA LES 36W DE SOBREPONER",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "LAMPARA TIPO ESPEJO",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "LIMA PLANA FINA DE 8 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LIMA PLANA MEDIA DE 8 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LIMPIADOR DE CONTACTOSWD40",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLANTAS CON FRENO ART 200 ISO 100",
        "cantidad": "4",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE ALLEN DE 1/16",
        "cantidad": "3",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE ALLEN DE 1/4",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE ALLEN DE 10mm",
        "cantidad": "5",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE ALLEN DE 12mm",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE ALLEN DE 14mm",
        "cantidad": "4",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE ALLEN DE 2,5mm",
        "cantidad": "3",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE ALLEN DE 2mm",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE ALLEN DE 3/16",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE ALLEN DE 5mm",
        "cantidad": "8",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE ALLEN DE 6mm",
        "cantidad": "3",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE ALLEN DE 8mm",
        "cantidad": "4",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE BOCAFIJA DE 1 3/16",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE BOCAFIJA DE 1\"",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE BOCAFIJA DE 10",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE BOCAFIJA DE 13",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE BOCAFIJA DE 14",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE BOCAFIJA DE 15/16",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE BOCAFIJA DE 16",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE BOCAFIJA DE 17",
        "cantidad": "3",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE BOCAFIJA DE 19",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE BOCAFIJA DE 26",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE BOCAFIJA DE 3/4",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE BOCAFIJA DE 30",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE BOCAFIJA DE 5/8",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE DE ESTRIA 29 X 26",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE DE ESTRIA 7/8 X 1\"",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE DE EXPANSION DE 12 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE DE PASO DE BOLA PVC LISA DE 3/8",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE DE PASO METALICA DE CORTINA DE 1/2 PULGADA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE DE PASO PVC DE BOLA LISA DE 1 PULGADA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE HALLEN 1/4",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE HALLEN 1/8",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE HALLEN 10mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE HALLEN 2,7mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE HALLEN 6mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE HALLEN 8mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE MIXTA STANLEY 19mm (86-864)",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE MORDAZA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE ORINAL DE 1/2",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE PARA TUBO DE 12 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "LLAVE PARA TUBO DE 8 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "MANGUERA DE 1/2 PARA AGUA X 29 METROS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "MANGUERA DUNFLEX ROJA DE 1/4",
        "cantidad": "8",
        "unidad": "UND"
      },
      {
        "descripcion": "MARCO DE SEGUETA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "MARTILLO DE UÑA DE 12 PULGADAS",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "MASILLA FLEXIBLE IMPADOC",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "MASILLA IMPADOC",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "MASILLA YIPLAST",
        "cantidad": "0.5",
        "unidad": "UND"
      },
      {
        "descripcion": "MOTORTOLL NEUMATICO DE 1/8",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "MULTIMETRO DIGITAL CLAM UNIT VT 202 20A 400A",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "NIVEL DE GOTA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PANTALLA LEXUS MATRIZ 5000 KGF 5K243733",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PERNO DE ANCLAJE M8 X 50mm",
        "cantidad": "6",
        "unidad": "UND"
      },
      {
        "descripcion": "PIN DOBLE 3/32 X 5/8",
        "cantidad": "6",
        "unidad": "UND"
      },
      {
        "descripcion": "PINTURA ACRILICO CORONA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PINTURA DE ACEITE PINTULAND",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PINTURA TRAFICO",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PINTURA VINILO GRIS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PINZA 8 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PINZA PARA ANILLOS DE SEGURIDAD",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PLATINA DE 1/2X 1/8 DE PULGADA",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "PLUG RJ45",
        "cantidad": "25",
        "unidad": "UND"
      },
      {
        "descripcion": "POLISOMBRA AZUL X 290",
        "cantidad": "3.9",
        "unidad": "UND"
      },
      {
        "descripcion": "POMADA PARA SOLDAR",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PORRA DE CAUCHO",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PORTATERRAJA DE M25 A 1\"",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PULIDORA ELECTRICA DE 1/2 PULGADA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PULSADOR AC 240V SCHEIDER ZBE-101",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PULSADOR XB2 BA31",
        "cantidad": "3",
        "unidad": "UND"
      },
      {
        "descripcion": "PULSADOR XB4 BA21",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "PULSERA DIELECTRICA COLOR AMARILLO",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PUNTA PHILLIS S2 PH2",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "PUNTILLA DE ACERO 3/4",
        "cantidad": "100",
        "unidad": "UND"
      },
      {
        "descripcion": "RACOR 90 GRADOS M5 4mm",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "RACOR RECTO M5 6mm",
        "cantidad": "4",
        "unidad": "UND"
      },
      {
        "descripcion": "REDUCCION PVC SANITARIO DE 3 X 2",
        "cantidad": "3",
        "unidad": "UND"
      },
      {
        "descripcion": "REDUCCION PVC SANITARIO DE 4 X 3",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "REGLETA 30A 380V 24 BORNERAS",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "REGLETA 45A 380V 7 BORNERAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "REMACHE POP 3/32",
        "cantidad": "100",
        "unidad": "UND"
      },
      {
        "descripcion": "RETENEDOR SF TC 17 35 7 NQK",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "RIMA CONICA # 3",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "RIMA CONICA # 5",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "RODAMIENTO 6001 JRX LLC C3",
        "cantidad": "9",
        "unidad": "UND"
      },
      {
        "descripcion": "RODAMIENTO 6005 LLU C3 / 2AS",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "RODAMIENTO 6204 2RS MARACA KMK",
        "cantidad": "4",
        "unidad": "UND"
      },
      {
        "descripcion": "RODAMIENTO 6204 2RS MARACA KMK",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "RODAMIENTO 6303 2RS C3 MARACA CJR",
        "cantidad": "3",
        "unidad": "UND"
      },
      {
        "descripcion": "RODAMIENTO 6303 2RS C3 MARACA VBF",
        "cantidad": "6",
        "unidad": "UND"
      },
      {
        "descripcion": "SENSOR DE TEMPERATURA 36/15 103 AT II CCJ",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "SIFON DE 2 PULGADAS",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "SOCKET TUBO LED",
        "cantidad": "60",
        "unidad": "UND"
      },
      {
        "descripcion": "SOPORTE PLASTICO CORTINERO DE 1/2",
        "cantidad": "15",
        "unidad": "UND"
      },
      {
        "descripcion": "TABLA DE PINO PARA CARRETO DE 40 CENTIMETROS DE DIAMETRO",
        "cantidad": "89",
        "unidad": "KILOS"
      },
      {
        "descripcion": "TABLA DE PINO PARA CARRETO DE 45 CENTIMETROS DE DIAMETRO",
        "cantidad": "11",
        "unidad": "METROS"
      },
      {
        "descripcion": "TABLERO ELECTRICO MONOFASICO 2 LINEAS",
        "cantidad": "1",
        "unidad": "METROS"
      },
      {
        "descripcion": "TALADRO MANUAL (MARCA Y DIAMETRO)",
        "cantidad": "1",
        "unidad": "METROS"
      },
      {
        "descripcion": "TAPA PARA TOMA CORRIENTE DOBLE NARANJA",
        "cantidad": "4",
        "unidad": "UND"
      },
      {
        "descripcion": "TAPON CARTER ACEITETE 19mm",
        "cantidad": "1",
        "unidad": "METROS"
      },
      {
        "descripcion": "TE PVC PRESION DE 1 PULGADA",
        "cantidad": "2",
        "unidad": "METROS"
      },
      {
        "descripcion": "TE PVC PRESION DE 1/2 PULGADA",
        "cantidad": "6",
        "unidad": "METROS"
      },
      {
        "descripcion": "TE PVC PRESION DE 3/4 PULGADA",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "TE PVC SANITARIO 4 PULADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "TERMINAL 1/0 AWG",
        "cantidad": "6",
        "unidad": "UND"
      },
      {
        "descripcion": "TERMINAL 2 PULGADAS AWG",
        "cantidad": "10",
        "unidad": "UND"
      },
      {
        "descripcion": "TERMINAL 2/0 AWG",
        "cantidad": "10",
        "unidad": "UND"
      },
      {
        "descripcion": "TERMINAL 3/0 AWG",
        "cantidad": "9",
        "unidad": "UND"
      },
      {
        "descripcion": "TERMINAL 4/0 AWG",
        "cantidad": "6",
        "unidad": "UND"
      },
      {
        "descripcion": "TESTER PARA CABLE RJ 45",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "TIJERAS PARA METAL",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "TOMA DOBLE BLANCO",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "TOMA DOBLE NARANJA",
        "cantidad": "6",
        "unidad": "UND"
      },
      {
        "descripcion": "TOMA TRIFILAR 014 20A 7500W",
        "cantidad": "6",
        "unidad": "UND"
      },
      {
        "descripcion": "TORNILLO DRYWALL 1 PULGADA",
        "cantidad": "150",
        "unidad": "UND"
      },
      {
        "descripcion": "TORNILLO DRYWALL 1/2 PULGADA",
        "cantidad": "100",
        "unidad": "UND"
      },
      {
        "descripcion": "TORNILLO DRYWALL DE 4MM X 1",
        "cantidad": "120",
        "unidad": "UND"
      },
      {
        "descripcion": "TORNILLO ESTANTERIA",
        "cantidad": "10",
        "unidad": "UND"
      },
      {
        "descripcion": "TORNILLO ESTRIA DE 3/16 X 1 1/4",
        "cantidad": "13",
        "unidad": "UND"
      },
      {
        "descripcion": "TORNILLO GOLOSO AVELLANADO ESTRIA DE 3 X25 mm",
        "cantidad": "30",
        "unidad": "UND"
      },
      {
        "descripcion": "TORNILLO GOLOSO ESTRIA DE 4 X25 mm",
        "cantidad": "60",
        "unidad": "UND"
      },
      {
        "descripcion": "TORNILLO GOLOSO ESTRIA DE 4 X25 mm INOXIDABLE",
        "cantidad": "30",
        "unidad": "UND"
      },
      {
        "descripcion": "TORNILLO HALLEN INOXIDABLE M5 X 15mm",
        "cantidad": "20",
        "unidad": "UND"
      },
      {
        "descripcion": "TORNILLO HALLEN INOXIDABLE M6 X 15mm",
        "cantidad": "150",
        "unidad": "UND"
      },
      {
        "descripcion": "TORNILLO HALLEN M12 X 150mm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "TORNILLO HALLEN M20 X 80 GRADO 8",
        "cantidad": "4",
        "unidad": "UND"
      },
      {
        "descripcion": "TORNILLO HALLEN M6 X 16",
        "cantidad": "40",
        "unidad": "UND"
      },
      {
        "descripcion": "TORNILLO HEXAGONAL 1/4 X 3 1/2 INOXIDABLE",
        "cantidad": "20",
        "unidad": "UND"
      },
      {
        "descripcion": "TORNILLO PUNTA BROCA HEXAGONAL DE 5/16 X 2 CON SELLO DE CAUCHO",
        "cantidad": "100",
        "unidad": "UND"
      },
      {
        "descripcion": "TUBO CONDUIT 1/2 PULGADA",
        "cantidad": "12",
        "unidad": "UND"
      },
      {
        "descripcion": "TUBO DE 1 X 1 PULGADA X 6 METROS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "TUBO DE 2 X 1 PULGADAS X 6 METROS",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "TUBO DE 3 X 1/2 PULGADA X 3 METROS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "TUBO DE 3 X 1/2 PULGADA X 5 METROS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "TUBO DE COBRE 5/8 65Cm",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "TUBO LED 18W",
        "cantidad": "10",
        "unidad": "UND"
      },
      {
        "descripcion": "TUBO MT DE 1/2 PULGADA",
        "cantidad": "23",
        "unidad": "MILILITROS"
      },
      {
        "descripcion": "TUBO MT DE 3/4 PULGADA",
        "cantidad": "12",
        "unidad": "1"
      },
      {
        "descripcion": "TUBO PVC 1/2 PULGADAS X 6 METROS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "TUBO PVC SANITARIO 2 PULGADAS X 6 METROS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "TUBO PVC SANITARIO 3 PULGADAS X 6 METROS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "TUBO PVC SANITARIO 4 PULGADAS X 6 METROS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "TUERCA DE SEGURIDAD 3/8",
        "cantidad": "170",
        "unidad": "UND"
      },
      {
        "descripcion": "UNION ESPINA DE PESCADO 1/4",
        "cantidad": "8",
        "unidad": "UND"
      },
      {
        "descripcion": "UNION GALVANIZADA DE 3/4",
        "cantidad": "38",
        "unidad": "UND"
      },
      {
        "descripcion": "UNION HEMBRA PVC PRESION DE 1 PULGADA",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "UNION HEMBRA PVC PRESION DE 1/2 PULGADA",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "UNION PVC PRESION LISA DE 1/2 PULGADA",
        "cantidad": "7",
        "unidad": "UND"
      },
      {
        "descripcion": "UNION PVC PRESION LISA DE 3/4 PULGADA",
        "cantidad": "9",
        "unidad": "UND"
      },
      {
        "descripcion": "VARILLA GALVANIZADA ROSCADA DE 3/8",
        "cantidad": "10",
        "unidad": "UND"
      },
      {
        "descripcion": "VENTILADOR DE TECCHO MS6LG",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "VENTILADOR DE TECHO TORMANTO IM 56 C",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "VIDEO VALUM PARES",
        "cantidad": "6",
        "unidad": "UND"
      },
      {
        "descripcion": "VOLVEDOR DE 1/8 A 3/16",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "YE PVC SANITARIO DE 3 PULGADAS",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "YE PVC SANITARIO DE 4 PULGADAS",
        "cantidad": "2",
        "unidad": "UND"
      },
      {
        "descripcion": "BREAKER SCHEIDER EZ 9F58332",
        "cantidad": "1",
        "unidad": "UND"
      },
      {
        "descripcion": "CONTACTOR SCHEIDER 1C1F18",
        "cantidad": "1",
        "unidad": "UND"
      }
    ]
  }
];
