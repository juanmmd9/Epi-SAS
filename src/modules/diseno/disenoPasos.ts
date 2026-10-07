export type BloqueDiseno = {
  titulo: "Formatos" | "Aprobaciones" | "Ensayos y registros";
  items: { nombre: string; detalle: string }[];
};

export type PasoDiseno = {
  id: string;
  numero: string;
  titulo: string;
  norma: string;
  resumen: string;
  puntos: string[];
  bloques: BloqueDiseno[];
};

/** Contenido exigido por ISO 9001:2015 cláusula 8.3 y por NTC 1523 / ANSI/ISEA Z89.1. */
export const PASOS_CASCO: PasoDiseno[] = [
  {
    id: "planificacion",
    numero: "1",
    titulo: "Planificación integrada",
    norma: "ISO 9001 8.3.2",
    resumen: "Ciclo del casco y tiempos del herramental, con responsables y puntos de control.",
    puntos: [
      "Definición del ciclo total: desde el concepto del casco hasta la masa.",
      "Tiempos de fabricación del herramental alineados al lanzamiento del EPI.",
    ],
    bloques: [
      {
        titulo: "Formatos",
        items: [
          {
            nombre: "Plan de diseño y desarrollo",
            detalle:
              "Naturaleza, duración y complejidad del proyecto. Etapas, hitos del molde y fecha de lanzamiento del casco.",
          },
          {
            nombre: "Matriz de responsabilidades y autoridades",
            detalle:
              "Quién planifica, diseña, revisa, verifica, valida y libera. Quién puede firmar cada etapa.",
          },
          {
            nombre: "Plan de interfaces",
            detalle:
              "Cómo se coordinan Diseño, Moldes, Plásticos, Laboratorio, Calidad y Comercial.",
          },
          {
            nombre: "Plan de recursos",
            detalle:
              "CAD, inyectora, fabricación del molde, laboratorio y competencias de quienes participan.",
          },
        ],
      },
      {
        titulo: "Aprobaciones",
        items: [
          {
            nombre: "Aprobación del plan",
            detalle:
              "Dir. Diseño y Calidad firman el plan antes de arrancar. Ahí quedan citadas las revisiones, la verificación y la validación.",
          },
          {
            nombre: "Actualización del plan",
            detalle:
              "Si cambia un plazo o una etapa, el plan se actualiza y se comunica a las áreas que intervienen.",
          },
        ],
      },
      {
        titulo: "Ensayos y registros",
        items: [
          {
            nombre: "Evidencia de cumplimiento del plan",
            detalle:
              "ISO 9001 pide conservar información documentada de que se cumplieron los requisitos del diseño. Cada hito deja acta.",
          },
        ],
      },
    ],
  },
  {
    id: "entradas",
    numero: "2",
    titulo: "Entradas críticas del producto",
    norma: "ISO 9001 8.3.3",
    resumen: "Requisitos de seguridad, normas y material, completos y sin contradicciones.",
    puntos: [
      "Requisitos de seguridad: resistencia a impactos y dieléctrica (ANSI/NTC).",
      "Requisitos del material: selección del polímero (ABS / policarbonato).",
    ],
    bloques: [
      {
        titulo: "Formatos",
        items: [
          {
            nombre: "Registro de entradas de diseño",
            detalle:
              "Función, desempeño y uso previsto del casco. Consecuencia si falla: golpe, penetración o choque eléctrico.",
          },
          {
            nombre: "Requisitos legales y normas",
            detalle:
              "NTC 1523 (clase A, B, C o D) y, si aplica, ANSI/ISEA Z89.1 (Tipo I o II; Clase G, E o C).",
          },
          {
            nombre: "Especificación de material",
            detalle: "ABS o policarbonato, con ficha del proveedor y restricciones de proceso.",
          },
          {
            nombre: "Diseños anteriores",
            detalle: "Información de cascos similares y lecciones de fallas previas.",
          },
        ],
      },
      {
        titulo: "Aprobaciones",
        items: [
          {
            nombre: "Aprobación de entradas",
            detalle:
              "Diseño y Calidad confirman que las entradas están completas. Si norma, cliente y material se contradicen, la decisión queda por escrito.",
          },
        ],
      },
      {
        titulo: "Ensayos y registros",
        items: [
          {
            nombre: "Registro conservado de entradas",
            detalle:
              "ISO 8.3.3 exige retener la información documentada de las entradas. Es la base de la verificación posterior.",
          },
        ],
      },
    ],
  },
  {
    id: "casco",
    numero: "3",
    titulo: "Diseño del casco",
    norma: "En paralelo con el herramental",
    resumen: "Geometría, visera, ergonomía y arnés, listos para fabricar el molde.",
    puntos: ["Diseño geométrico: forma del casquete, visera, ergonomía y arnés/tafilete."],
    bloques: [
      {
        titulo: "Formatos",
        items: [
          {
            nombre: "Planos del casco",
            detalle: "Casquete, visera, arnés y tafilete, con revisión y tolerancias.",
          },
          {
            nombre: "Lista de materiales y tallas",
            detalle:
              "Componentes del conjunto. El tafilete de la NTC 1523 cubre al menos de talla 6¼ a 7⅞.",
          },
          {
            nombre: "Análisis de riesgo del diseño",
            detalle:
              "Qué pasa si falla el casquete, la suspensión o el aislamiento, y qué característica del diseño lo evita.",
          },
        ],
      },
      {
        titulo: "Aprobaciones",
        items: [
          {
            nombre: "Liberación de la geometría",
            detalle:
              "Diseño, Calidad y Plásticos firman antes de pasar la forma al molde. Sin esta firma no se fabrica herramental.",
          },
        ],
      },
      {
        titulo: "Ensayos y registros",
        items: [
          {
            nombre: "Modelo 3D y criterios dimensionales",
            detalle:
              "El modelo y los criterios de aceptación son la referencia de la inspección de la pieza inyectada.",
          },
        ],
      },
    ],
  },
  {
    id: "herramental",
    numero: "3b",
    titulo: "Diseño del herramental",
    norma: "En paralelo con el casco",
    resumen: "Molde alineado a la geometría aprobada del casco.",
    puntos: ["Diseño de soporte: molde ajustado a la geometría del casco."],
    bloques: [
      {
        titulo: "Formatos",
        items: [
          {
            nombre: "Plano y lista del molde",
            detalle: "Cavidades, puntos de inyección, refrigeración y revisión ligada al plano del casco.",
          },
          {
            nombre: "Informe de simulación de llenado",
            detalle: "Llenado, uniones y zonas de esfuerzo antes de cortar el acero.",
          },
          {
            nombre: "Plan de fabricación y recepción del molde",
            detalle: "Plazo de herramental alineado al lanzamiento y lista de chequeo de recepción.",
          },
        ],
      },
      {
        titulo: "Aprobaciones",
        items: [
          {
            nombre: "Liberación para fabricar el molde",
            detalle: "Diseño y Moldes autorizan la fabricación contra el plano aprobado.",
          },
          {
            nombre: "Recepción del herramental",
            detalle: "Se recibe el molde contra plano, antes de montarlo en la inyectora para la prueba T1.",
          },
        ],
      },
      {
        titulo: "Ensayos y registros",
        items: [
          {
            nombre: "Trazabilidad molde–plano",
            detalle: "Qué revisión del casco corresponde a qué revisión del molde.",
          },
        ],
      },
    ],
  },
  {
    id: "revision",
    numero: "4.1",
    titulo: "Revisión",
    norma: "ISO 9001 8.3.4",
    resumen: "Evaluar si los resultados de la etapa pueden cumplir los requisitos.",
    puntos: [
      "Simulación virtual de llenado y análisis de puntos de esfuerzo en el casco plástico.",
    ],
    bloques: [
      {
        titulo: "Formatos",
        items: [
          {
            nombre: "Acta de revisión de diseño",
            detalle:
              "Etapa, participantes, resultados, problemas y acciones. La revisión no sustituye la verificación ni la validación.",
          },
          {
            nombre: "Informe de simulación y de esfuerzos",
            detalle: "Llenado del plástico y puntos de esfuerzo del casquete, anexos al acta.",
          },
        ],
      },
      {
        titulo: "Aprobaciones",
        items: [
          {
            nombre: "Decisión de la revisión",
            detalle: "Continuar, ajustar o detener. Firman las funciones convocadas en el plan (Diseño, Calidad y el área afectada).",
          },
        ],
      },
      {
        titulo: "Ensayos y registros",
        items: [
          {
            nombre: "Cierre de acciones",
            detalle:
              "ISO 8.3.4 pide conservar las actividades de control y las acciones tomadas sobre los problemas hallados.",
          },
        ],
      },
    ],
  },
  {
    id: "verificacion",
    numero: "4.2",
    titulo: "Verificación",
    norma: "ISO 9001 8.3.4",
    resumen: "Comprobar que la pieza y el molde cumplen los planos y las entradas.",
    puntos: [
      "Fabricación del molde y ensamble en inyectora.",
      "Prueba piloto T1: inyección de las primeras muestras del casco.",
      "Inspección dimensional de la pieza inyectada vs. planos aprobados.",
    ],
    bloques: [
      {
        titulo: "Formatos",
        items: [
          {
            nombre: "Informe de prueba piloto T1",
            detalle: "Molde ensamblado en inyectora, parámetros usados e identificación de las muestras.",
          },
          {
            nombre: "Inspección dimensional",
            detalle: "Pieza inyectada contra el plano aprobado, con criterio de aceptación y resultado.",
          },
          {
            nombre: "Lista entradas contra salidas",
            detalle:
              "La verificación demuestra que las salidas cumplen las entradas. No demuestra todavía el uso en la cabeza.",
          },
        ],
      },
      {
        titulo: "Aprobaciones",
        items: [
          {
            nombre: "Aprobación de la verificación",
            detalle:
              "Diseño y Calidad firman si cumple. Si no cumple, se abre control de cambios y no se pasa a validar.",
          },
        ],
      },
      {
        titulo: "Ensayos y registros",
        items: [
          {
            nombre: "Muestras de la T1",
            detalle: "Muestras identificadas y conservadas junto con el informe dimensional.",
          },
        ],
      },
    ],
  },
  {
    id: "validacion",
    numero: "4.3",
    titulo: "Validación",
    norma: "ISO 9001 8.3.4",
    resumen: "Comprobar que el casco protege en el uso previsto, con ensayos de laboratorio.",
    puntos: [
      "Impacto vertical y lateral (transmisión de fuerza).",
      "Resistencia a la penetración y rigidez dieléctrica (voltaje).",
      "Certificación emitida por un ente acreditado (ej. ONAC).",
    ],
    bloques: [
      {
        titulo: "Formatos",
        items: [
          {
            nombre: "Protocolo de ensayos",
            detalle: "Clase y tipo declarados, muestras, acondicionamiento y métodos de la norma aplicable.",
          },
          {
            nombre: "Informe de laboratorio",
            detalle: "Resultado de cada ensayo, con el valor medido y el límite de la norma.",
          },
          {
            nombre: "Certificado del laboratorio",
            detalle: "Informe o certificado de un laboratorio acreditado (por ejemplo ante ONAC).",
          },
        ],
      },
      {
        titulo: "Aprobaciones",
        items: [
          {
            nombre: "Aprobación de la validación",
            detalle:
              "Diseño, Laboratorio y Calidad aceptan que el casco cumple el uso previsto. El certificado no reemplaza esta firma.",
          },
        ],
      },
      {
        titulo: "Ensayos y registros",
        items: [
          {
            nombre: "Impacto (NTC 1523)",
            detalle:
              "Energía de 54,5 J. Fuerza promedio máxima 3 774,4 N y ninguna muestra por encima de 4 442,8 N. En clase B, sin contacto entre casquete y suspensión.",
          },
          {
            nombre: "Penetración (NTC 1523)",
            detalle: "Máximo 9,52 mm en clases A, B y D. Máximo 11,11 mm en clase C, incluido el espesor del casquete.",
          },
          {
            nombre: "Rigidez lateral (NTC 1523)",
            detalle: "Deformación máxima 40 mm y deformación residual máxima 15 mm.",
          },
          {
            nombre: "Aislamiento eléctrico (NTC 1523)",
            detalle:
              "Clases A y D: 2 200 V durante 1 min, fuga máxima 3 mA. Clase B: 20 000 V durante 3 min, fuga máxima 9 mA, y 30 000 V sin ruptura. La clase C no es dieléctrica.",
          },
          {
            nombre: "ANSI/ISEA Z89.1, si el casco la declara",
            detalle:
              "Tipo I protege la corona; Tipo II también el lateral, con penetración descentrada y retención del barbuquejo. Clase G: 2 200 V y fuga máxima 3 mA. Clase E: 20 000 V y fuga máxima 9 mA. Clase C: sin aislamiento.",
          },
        ],
      },
    ],
  },
  {
    id: "decision",
    numero: "5",
    titulo: "¿El casco supera las pruebas?",
    norma: "Decisión",
    resumen: "Sí libera las salidas del diseño. No abre el control de cambios.",
    puntos: [
      "Sí: pasa a las salidas del diseño.",
      "No: entra al control de cambios y vuelve a inyectar contramuestras.",
    ],
    bloques: [
      {
        titulo: "Formatos",
        items: [
          {
            nombre: "Acta de decisión",
            detalle:
              "Sí o no, con los informes de verificación y validación que la soportan. No es un comentario suelto.",
          },
        ],
      },
      {
        titulo: "Aprobaciones",
        items: [
          {
            nombre: "Firmas de la decisión",
            detalle:
              "Dir. Diseño y Calidad. Sí abre las salidas del diseño. No abre el control de cambios y una nueva inyección de contramuestras.",
          },
        ],
      },
      {
        titulo: "Ensayos y registros",
        items: [
          {
            nombre: "Vínculo con los informes",
            detalle: "El acta cita el número de informe de laboratorio y el resultado dimensional de la T1.",
          },
        ],
      },
    ],
  },
  {
    id: "cambios",
    numero: "5b",
    titulo: "Control de cambios",
    norma: "ISO 9001 8.3.6",
    resumen: "Ajustar molde o parámetros, autorizar el cambio y repetir lo que haga falta.",
    puntos: [
      "Ajuste de moldes o parámetros de inyección (T°/P).",
      "Nueva inyección de contramuestras.",
    ],
    bloques: [
      {
        titulo: "Formatos",
        items: [
          {
            nombre: "Solicitud de cambio",
            detalle: "Qué cambia: geometría, molde, temperatura, presión o material. Quién lo pide y por qué.",
          },
          {
            nombre: "Análisis de impacto",
            detalle:
              "Efecto sobre piezas ya hechas, moldes, ficha técnica, marcado y ensayos que hay que repetir.",
          },
        ],
      },
      {
        titulo: "Aprobaciones",
        items: [
          {
            nombre: "Autorización antes de implementar",
            detalle:
              "Diseño y Calidad autorizan el cambio antes de tocar el molde o la receta. Si afecta a Moldes o Plásticos, ellos también firman.",
          },
        ],
      },
      {
        titulo: "Ensayos y registros",
        items: [
          {
            nombre: "Revisión, acciones y contramuestras",
            detalle:
              "ISO 8.3.6 pide conservar el cambio, el resultado de la revisión, la autorización y las acciones para evitar efectos adversos. Luego se inyectan contramuestras y se repite la verificación o la validación que el impacto exija.",
          },
        ],
      },
    ],
  },
  {
    id: "salidas",
    numero: "6",
    titulo: "Salidas del diseño",
    norma: "ISO 9001 8.3.5",
    resumen: "Lo que recibe producción: planos, receta, criterios de aceptación y marcado.",
    puntos: [
      "Planos definitivos del casco y ficha técnica comercial.",
      "Receta y parámetros de inyección estandarizados.",
      "Marcado de trazabilidad permanente en el plástico (lote/fecha).",
    ],
    bloques: [
      {
        titulo: "Formatos",
        items: [
          {
            nombre: "Planos definitivos y ficha técnica",
            detalle: "Revisión vigente del casco y ficha comercial con la clase, el tipo y la norma declarados.",
          },
          {
            nombre: "Receta de inyección",
            detalle: "Temperaturas, presiones y tiempos estandarizados, con la revisión del molde.",
          },
          {
            nombre: "Especificación de marcado",
            detalle: "Marcado permanente de lote, fecha, clase o tipo y norma, sobre el plástico.",
          },
          {
            nombre: "Criterios para producir y medir",
            detalle:
              "ISO 8.3.5 pide que las salidas sirvan al proceso siguiente e incluyan requisitos de seguimiento, medición y aceptación, más las características esenciales para el uso seguro.",
          },
        ],
      },
      {
        titulo: "Aprobaciones",
        items: [
          {
            nombre: "Liberación de las salidas",
            detalle:
              "Diseño, Calidad y Plásticos confirman que las salidas cumplen las entradas y están listas para producir.",
          },
        ],
      },
      {
        titulo: "Ensayos y registros",
        items: [
          {
            nombre: "Paquete de transferencia",
            detalle: "Planos, receta, ficha y marcado se conservan como información documentada de las salidas.",
          },
        ],
      },
    ],
  },
  {
    id: "serie",
    numero: "Fin",
    titulo: "Producción en serie",
    norma: "Casco certificado",
    resumen: "Inicio de serie solo con diseño liberado y validación aprobada.",
    puntos: ["Inicio de producción en serie del casco certificado."],
    bloques: [
      {
        titulo: "Formatos",
        items: [
          {
            nombre: "Orden de liberación a serie",
            detalle: "Autoriza el arranque e identifica la revisión de plano y la receta que se van a usar.",
          },
          {
            nombre: "Plan de inspección de lote",
            detalle:
              "La NTC 1523 inspecciona el lote completo en visual y toma muestras para ensayos según el tamaño del lote.",
          },
          {
            nombre: "Instrucción de marcado y trazabilidad",
            detalle: "Cómo se marca lote y fecha en cada casco y cómo se archiva contra el lote de resina.",
          },
        ],
      },
      {
        titulo: "Aprobaciones",
        items: [
          {
            nombre: "Autorización de inicio de serie",
            detalle:
              "Dir. Diseño y Calidad, únicamente si las salidas están liberadas y la validación está aprobada.",
          },
        ],
      },
      {
        titulo: "Ensayos y registros",
        items: [
          {
            nombre: "Primer lote",
            detalle: "El primer lote queda identificado contra la revisión liberada, la receta y el informe de validación.",
          },
        ],
      },
    ],
  },
];

export function pasoDisenoPorId(id: string | undefined): PasoDiseno | undefined {
  return PASOS_CASCO.find((paso) => paso.id === id);
}

export function claveItemDiseno(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function itemDisenoPorClave(paso: PasoDiseno, clave: string) {
  for (const bloque of paso.bloques) {
    const item = bloque.items.find((actual) => claveItemDiseno(actual.nombre) === clave);
    if (item) return { grupo: bloque.titulo, item };
  }
  return null;
}
