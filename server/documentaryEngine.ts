import { GoogleGenAI } from '@google/genai';
import { FlowChapter, FlowClip, FlowDocumentary, ShotBreakdown } from '../src/types/content.js';
import { translateTextToCinematicEnglishFallback } from '../src/utils/translator.js';

// Helper to resolve Gemini API key from all standard environment variable names
export function getGeminiApiKey(): string {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.API_KEY ||
    ''
  ).trim();
}

// Initialize Gemini client with available key
const getAiClient = () => {
  const apiKey = getGeminiApiKey();
  return apiKey ? new GoogleGenAI({ apiKey }) : new GoogleGenAI();
};

// Candidate models supported by Gemini API
const FAST_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
];

/**
 * Robust JSON caller with multi-model fallback and retry
 */
export async function callGeminiJsonWithFallback(prompt: string, maxRetries = 2): Promise<any> {
  let lastError: any = null;

  const ai = getAiClient();
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    for (const model of FAST_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7
          }
        });

        if (response.text) {
          const cleaned = response.text
            .trim()
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '');
          return JSON.parse(cleaned);
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini Engine] Model ${model} failed on attempt ${attempt + 1}:`, err.message || err.status);
      }
    }

    if (attempt < maxRetries) {
      const waitMs = 800 * (attempt + 1);
      await new Promise(r => setTimeout(r, waitMs));
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Rigorously cleans voiceover text:
 * - Strips any "Beat 1", "Beat 2", "Paso 1", "Clip 1", etc.
 * - Strips director instructions / meta-directives ("El narrador describe...", "Se debe hacer...", "Esta escena muestra...")
 * - Ensures pure historical storytelling.
 */
export function cleanStoryVoiceover(rawText: string): string {
  if (!rawText) return '';
  let clean = rawText.trim().replace(/^["“'«»]|["”'«»]$/g, '').trim();

  // 1. Remove prefixes like "Beat 1:", "Beat 2 -", "Paso 1:", "Clip 1:", "Acto 1:", "Toma 1:", "Escena 1:"
  clean = clean.replace(/^(?:(?:beat|paso|clip|acto|toma|escena)\s*\d+[\s:.-]*)+/gi, '').trim();
  clean = clean.replace(/^(?:narrador|voz\s*en\s*off|voiceover)[\s:.-]*/gi, '').trim();

  // 2. Remove internal, parenthesized or inline beat references like "(Beat 1)", "[Beat 2]", "beat 1", "beat 2", etc.
  clean = clean.replace(/[\(\[\{]?(?:\b(?:en\s+(?:el\s+)?)?beat\s*\d+\b)[\)\]\}]?[\s:.-]*/gi, ' ').trim();
  clean = clean.replace(/[\(\[\{]?(?:\b(?:paso|clip)\s*\d+\b)[\)\]\}]?[\s:.-]*/gi, ' ').trim();

  // 3. Remove director meta-instructions and orders
  clean = clean.replace(/^(?:en\s+este\s+clip|en\s+esta\s+escena|en\s+este\s+plano)[\s,:]*/gi, '');
  clean = clean.replace(/^(?:el\s+narrador\s+(?:describe|cuenta|explica|relata|dice|muestra))[\s,:]*/gi, '');
  clean = clean.replace(/^(?:se\s+debe\s+(?:hacer|colocar|proceder|iniciar|realizar))[\s,:]*/gi, '');
  clean = clean.replace(/^(?:se\s+procede\s+a\s+(?:hacer|colocar|iniciar|realizar))[\s,:]*/gi, '');
  clean = clean.replace(/^(?:esta\s+escena\s+muestra)[\s,:]*/gi, '');
  clean = clean.replace(/^(?:el\s+cirujano\s+debe)[\s,:]*/gi, 'El cirujano ');

  // 4. Strip punctuation leftovers at the beginning
  clean = clean.replace(/^[:\s,.\-—–/]+/, '').trim();

  // 5. Clean up multiple spaces
  clean = clean.replace(/\s{2,}/g, ' ').trim();

  // 6. Capitalize first letter
  if (clean.length > 0) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  return clean;
}

/**
 * Ensures that a voiceover strictly fits into a 10-second clip (approx 15-22 words max, ~7-9s of spoken audio).
 * Prevents AI or fallback logic from generating rambling paragraphs longer than the video clip or prompt.
 */
export function enforce10SecondVoiceover(rawText: string): string {
  if (!rawText) return '';
  const clean = cleanStoryVoiceover(rawText);
  const words = clean.split(/\s+/).filter(Boolean);
  
  // If already 22 words or fewer, it's calibrated
  if (words.length <= 22) {
    return clean;
  }

  // If longer than 22 words, trim at the best punctuation boundary within 15-22 words
  for (let i = 0; i < words.length; i++) {
    const next = words[i];
    if (i >= 14 && i <= 21 && /[.!?]$/.test(next)) {
      return words.slice(0, i + 1).join(' ');
    }
  }

  // Check for comma, semicolon or colon between 14-21 words
  for (let i = 21; i >= 14; i--) {
    if (/[,;:]$/.test(words[i])) {
      return words.slice(0, i + 1).join(' ').replace(/[,;:]$/, '') + '.';
    }
  }

  // Otherwise, take exactly 20 words and terminate with a clean period
  return words.slice(0, 20).join(' ') + '.';
}

function assembleFlowPrompt(
  clipNumber: number,
  actNumber: number,
  chapterTitle: string,
  sceneTitle: string,
  topic: string,
  shots: { shot1: string; shot2: string; shot3: string; shot4: string; shot5: string },
  voiceover: string = ''
): string {
  const voiceProfileLine = `\nVOICE PROFILE / NARRATOR TONE: 50-year-old male narrator, deep, mature, resonant and raspy voice. Mysterious and cinematic BBC documentary tone.`;
  const narrationLine = voiceover ? `\nSYNCHRONIZED VOICEOVER NARRATION (Audio for this 10s Clip):\n"${voiceover}"\nSCENE VISUAL SYNC: The 5 motion shots below directly illustrate this precise moment of the chronicle.` : '';
  return `Documentary motion collage / animated newspaper collage sequence, exactly 10 seconds, 16:9, 24fps. Continuous clip ${clipNumber} of 60 (Act ${actNumber}: ${chapterTitle} — Scene: "${sceneTitle}").${voiceProfileLine}${narrationLine}
GLOBAL VISUAL STYLE: dark premium folklore documentary aesthetic, near-monochrome noir grade, deep black backgrounds, bone-white and aged sepia paper tones, single saturated blood-red accent colour. Heavy halftone print-dot texture, subtle pulsing film grain, scratched archival paper, rough torn newspaper edges, historical engravings and archaeological chronicles of ${topic}. Fast aggressive lateral slides, hard graphic cuts, locked-off camera with dramatic push-ins. Snappy percussive editing rhythm.
SHOT 1 — 0.0–2.0s: ${shots.shot1}
SHOT 2 — 2.0–4.5s: ${shots.shot2}
SHOT 3 — 4.5–6.5s: ${shots.shot3}
SHOT 4 — 6.5–8.2s: ${shots.shot4}
SHOT 5 — 8.2–10.0s: ${shots.shot5}`;
}

interface RawClip {
  sceneTitle: string;
  voiceover: string;
  sound: string;
  shot1: string;
  shot2: string;
  shot3: string;
  shot4: string;
  shot5: string;
}

interface RawAct {
  chapterNumber: number;
  chapterTitle: string;
  historicalContext: string;
  beats: string[];
  clips?: RawClip[];
}

/**
 * Generates 54 unique, sequential, chronologically connected narrative story lines.
 * Strictly pure historical storytelling (zero orders, zero manual instructions).
 */
export function getSequentialStoryVoiceover(
  actIdx: number,
  cIdx: number,
  cleanTopic: string,
  isMedical: boolean,
  isEngineering: boolean,
  isDailyLife: boolean
): string {
  const step = actIdx * 6 + cIdx; // 0 to 53

  if (isMedical) {
    const medicalChronicle: string[] = [
      // Acto 1: El Diagnóstico del Trauma
      `Un proyectil de honda fractura el hueso temporal del legionario Flavio durante el asedio a las murallas.`,
      `Los camilleros lo trasladan al hospital de campaña donde yace inconsciente y con respiración entrecortada.`,
      `El cirujano Celso limpia la sangre del rostro y palpa la peligrosa depresión ósea en el cráneo.`,
      `La pupila dilatada y el pulso débil confirman un hematoma interno que asfixia el cerebro del soldado.`,
      `Sin una intervención inmediata para descomprimir el cráneo, el paciente fallecerá antes del anochecer.`,
      `Celso ordena despejar la mesa de madera y calentar los calderos para esterilizar el instrumental quirúrgico.`,

      // Acto 2: El Instrumental de Bronce
      `Los ayudantes avivan los braseros para templar el instrumental en recipientes con vino puro y vinagre.`,
      `Sobre un lienzo limpio disponen escalpelos afilados, sondas exploratorias y trépanos cilíndricos de bronce forjado.`,
      `El médico inspecciona los dientes afilados de la corona del trépano para asegurar un corte homogéneo.`,
      `Preparan esponjas marinas secas y vendas de lino fino para contener las abundantes hemorragias craneales.`,
      `Afilan los elevadores curvos diseñados específicamente para desarticular los fragmentos de hueso astillados.`,
      `Con las herramientas desinfectadas y dispuestas en estricto orden de uso, traen al herido a la camilla.`,

      // Acto 3: La Sedación y Preparación
      `Inmovilizan firmemente la cabeza del legionario con correas de cuero sobre un bloque de roble cóncavo.`,
      `Suministran al paciente una infusión concentrada de mandrágora, opio y vino para mitigar el dolor extremo.`,
      `El ayudante afeita la cabellera alrededor del traumatismo con una navaja de bronce bien afilada.`,
      `Lavan el cuero cabelludo expuesto con vinagre caliente para eliminar toda partícula de polvo y sudor.`,
      `Con tinta vegetal, Celso dibuja sobre la piel la línea semicircular exacta por donde guiará el escalpelo.`,
      `El soldado entra en profundo sopor por el narcótico y el cirujano empuña el primer escalpelo.`,

      // Acto 4: La Incisión y Despeje Óseo
      `Celso presiona el escalpelo con pulso firme, trazando un corte semicircular en el cuero cabelludo.`,
      `La sangre brota de inmediato mientras los ayudantes comprimen los bordes con esponjas empapadas en agua fría.`,
      `Con un rascador de hueso despega el periostio fibroso hasta descubrir la superficie ósea limpia.`,
      `La fisura del cráneo queda al descubierto: astillas afiladas presionan peligrosamente la duramadre subyacente.`,
      `Colocan finos ganchos de bronce para retraer el colgajo de piel y mantener despejado el campo operatorio.`,
      `El cirujano marca con punzón el centro exacto donde fijará la punta guía del trépano perforador.`,

      // Acto 5: La Perforación con Trépano
      `Apoya el trépano sobre el cráneo e inicia una rotación lenta y uniforme impulsada por arco manual.`,
      `Los dientes de bronce muerden la tabla externa del cráneo desprendiendo una fina viruta de hueso blanco.`,
      `Un ayudante vierte gotas continuas de vinagre frío para refrigerar el metal y evitar quemaduras óseas.`,
      `Celso retira el instrumento periódicamente para limpiar el surco circular con plumas de ganso limpias.`,
      `El sonido del corte se vuelve sordo al penetrar el diploe esponjoso, señal de máxima proximidad a la duramadre.`,
      `Retira la punta guía central para continuar perforando únicamente con la corona cilíndrica hueca.`,

      // Acto 6: Descompresión Cerebral
      `Con suavidad extrema, el trépano desgasta los últimos milímetros de la tabla ósea interna sin rozar el cerebro.`,
      `El círculo de hueso finalmente se suelta y queda flotando sobre la membrana vascularizada de la duramadre.`,
      `Con pinzas de precisión y un elevador curvo, Celso extrae el disco óseo redondo en una sola pieza.`,
      `De inmediato, el hematoma oscuro a presión brota al exterior aliviando la compresión sobre el encéfalo.`,
      `El cerebro del soldado comienza a pulsar libremente y con ritmo regular en la cavidad abierta.`,
      `El legionario recupera un patrón respiratorio profundo y continuo al desaparecer la opresión intracraneal.`,

      // Acto 7: Hemostasia y Apósitos Antisépticos
      `Lavan con suma delicadeza la cavidad usando vino tibio para disolver coágulos residuales sin comprimir el tejido.`,
      `Sobre la duramadre expuesta colocan finas láminas de lino empapadas en aceite de rosas y miel pura.`,
      `Las propiedades antibacterianas de la miel sellan la cavidad impidiendo la proliferación de infecciones mortales.`,
      `Recolocan el colgajo de cuero cabelludo sobre la abertura sin ejercer presión sobre el lecho quirúrgico.`,
      `Suturan los bordes de la herida con hilo de lino grueso, dejando un pequeño drenaje inferior abierto.`,
      `Envuelven la cabeza del legionario con un vendaje compresivo acolchado asegurando reposo absoluto.`,

      // Acto 8: La Recuperación y Cicatrización
      `Durante los primeros días, el paciente permanece en penumbra mientras el cuerpo combate la fiebre inflamatoria.`,
      `Celso renueva diariamente las compresas de miel verificando que los bordes de la sutura cicatricen limpios.`,
      `Al séptimo día la fiebre remite por completo y el soldado recobra la lucidez y el apetito.`,
      `Bajo el cuero cabelludo, una sólida membrana fibrosa comienza a calcificarse protegiendo la zona intervenida.`,
      `El médico retira los puntos de lino constatando una unión tisular perfecta sin rastro de supuración.`,
      `El legionario se sienta por sus propios medios en el lecho ante la admiración de los facultativos.`,

      // Acto 9: El Legado de la Supervivencia
      `Un mes después de la trepanación, el soldado Flavio regresa al servicio portando una indeleble cicatriz circular.`,
      `Celso documenta detalladamente el caso en sus tratados de medicina militar como modelo de descompresión exitosa.`,
      `Décadas más tarde, Galeno retomará estas mismas técnicas consolidando la neuroanatomía en todo el Mediterráneo.`,
      `En yacimientos arqueológicos modernos, cráneos romanos excavados muestran orificios trepanados con bordes óseos redondeados y curados.`,
      `Esas evidencias de osteogénesis demuestran que numerosos pacientes vivieron largos años tras someterse a esta cirugía.`,
      `La medicina de Roma probó así que la pericia manual y el conocimiento anatómico lograron doblegar a la muerte.`,

      // Acto 10: La Huella Inmortal en la Neurocirugía Moderna
      `Las técnicas de trepanación de Roma sentaron las bases universales de la craneotomía descompresiva contemporánea.`,
      `El instrumental quirúrgico moderno conserva el principio biomecánico de las coronas cilíndricas diseñadas por Celso.`,
      `En congresos médicos internacionales, la historia de esta intervención se cita como hito fundacional de la medicina.`,
      `Cráneos de hace dos milenios conservados en museos atestiguan el asombroso triunfo del ingenio humano sobre el dolor.`,
      `Aquel legionario herido en la muralla sobrevivió gracias a manos firmes que desafiaron los límites de su siglo.`,
      `La medicina antigua demostró así que el coraje clínico y el rigor técnico lograron salvar vidas para la eternidad.`
    ];
    return medicalChronicle[step] || medicalChronicle[step % medicalChronicle.length];
  }

  if (isEngineering) {
    const engineeringChronicle: string[] = [
      // Acto 1: Exploración
      `Los agrimensores imperiales clavan jalones de madera a lo largo del árido desfiladero rocoso.`,
      `Con el chorobates de agua calibran una pendiente constante de apenas un palmo por cada cien pasos.`,
      `El arquitecto jefe desenrolla pergaminos encerados para trazar los cimientos sobre la roca viva.`,
      `Centenares de legionarios desbrozan la maleza y marcan las líneas perimetrales con estacas clavadas.`,
      `Calculan la altura requerida para que el canal salve el desnivel sin perder presión hidrostática.`,
      `Con el trazado topográfico sellado por los magistrados, ordenan abrir los primeros caminos de acceso.`,

      // Acto 2: Canteras
      `En las canteras de granito, cuadrillas de canteros hunden cuñas de hierro en las fallas de la piedra.`,
      `Mazas pesadas golpean las cuñas hasta que gigantescos sillares se desprenden con un estruendo ensordecedor.`,
      `Con cinceles y escuadras de bronce labran las caras de cada bloque para asegurar un encaje hermético.`,
      `Bancarrotas y rodillos de encina trasladan los colosales bloques hacia la ribera del barranco.`,
      `Bueyes uncidos tiran con esfuerzo sostenido levantando densas polvaredas en los caminos de tierra.`,
      `Los canteros marcan en cada sillar el sello de la cantera para guiar a los montadores en la obra.`,

      // Acto 3: El Mortero de Puzolana
      `Hornea piedra caliza en hornos cilíndricos a temperaturas extremas para obtener cal viva incandescente.`,
      `Apagan la cal con agua pura en fosas comunales produciendo un hervidero blanco espeso y cáustico.`,
      `Mezclan la cal apagada con ceniza volcánica de puzolana traída directamente de las laderas del Vesubio.`,
      `Añaden arena volcánica y grava seleccionada formando un hormigón hidráulico capaz de fraguar bajo el agua.`,
      `Los obreros apisonan la mezcla en el interior de encofrados de madera con pisones de roble pesado.`,
      `El mortero fragua adquiriendo una dureza superior a la propia roca natural circundante.`,

      // Acto 4: Las Grúas Polispastos
      `Carpinteros alzan enormes grúas polispastos reforzadas con vigas maestras de abeto y tirantes de cuerda.`,
      `Obreros caminan en el interior de la rueda de pisar multiplicando la fuerza humana por cincuenta veces.`,
      `Garras de hierro muerden los orificios labrados en los sillares y los elevan lentamente por el aire.`,
      `Los maestros albañiles reciben el bloque en la cima ajustando su posición con barras de bronce.`,
      `Comprueban la verticalidad de cada pilar con plomadas de plomo suspendidas de hilos encerados.`,
      `Pilar tras pilar, las gigantescas columnas de piedra crecen sobre el fondo escarpado del barranco.`,

      // Acto 5: Las Cimbras y Arcos
      `Sobre los pilares ensamblan cimbras de madera curva que servirán de armazón provisional para los arcos.`,
      `Los albañiles colocan las dovelas cuneiformes en ambos extremos del arco avanzando hacia el centro.`,
      `Con mazas de madera encajan la dovela clave central sellando la estructura con presión pura.`,
      `Descienden suavemente las cimbras de madera comprobando que el arco sostiene su propio peso sin ceder.`,
      `Los arcos de medio punto distribuyen las cargas gravitatorias de forma perfecta hacia los pilares.`,
      `La hilera de arcadas monumentales queda completada uniendo ambos lados del precipicio rocoso.`,

      // Acto 6: Nivelación
      `En la cota más alta, los topógrafos vuelven a montar el chorobates para afinar la pendiente del canal.`,
      `Viértenos agua en la regleta comprobando que el nivel marque exactamente un grado de inclinación continua.`,
      `Los albañiles corrigen cualquier imperfección del lecho con una capa milimétrica de mortero fino.`,
      `Instalan placas de plomo en las juntas de dilatación para absorber las tensiones térmicas del estío.`,
      `Verifican con esferas de bronce que el rodaje sea homogéneo sin estancamientos a lo largo del tramo.`,
      `La pendiente perfecta garantiza que el flujo de agua jamás se detenga ni erosione la estructura.`,

      // Acto 7: El Canal Specus
      `Sobre la cima de las arcadas superiores construyen las paredes del canal cubierto de agua o specus.`,
      `Revisten el interior con opus signinum, mortero impermeable de cal mezclado con polvo de tejas machacadas.`,
      `Redondean los ángulos interiores con medias cañas para facilitar el flujo continuo y evitar sedimentos.`,
      `Colocan pesadas losas de piedra a dos aguas sobre el canal para proteger el agua del sol y el polvo.`,
      `Instalan respiraderos verticales cada cien pasos para que el aire circule y mantenga el agua fresca.`,
      `El cauce artificial queda completado a lo largo de decenas de leguas desde los manantiales de montaña.`,

      // Acto 8: Llegada del Agua
      `En los manantiales de la cumbre abren las compuertas de bronce liberando el torrente de agua cristalina.`,
      `El caudal avanza a velocidad constante guiado por la suave pendiente milimétrica de los ingenieros.`,
      `El agua entra en las arquerías del puente elevado cruzando el abismo con un rumor continuo y limpio.`,
      `Los inspectores del agua recorren los arcos comprobando que no exista ni una sola fuga en la cantería.`,
      `El torrente alcanza las afueras de la urbe entrando en el gran depósito distribuidor de castellum divisorium.`,
      `Válvulas de plomo canalizan el agua hacia termas, fuentes públicas y talleres de toda la metrópoli.`,

      // Acto 9: El Triunfo de la Urbe
      `Las fuentes de la ciudad manan a borbotones agua pura de montaña transformando la vida de la población.`,
      `Los ciudadanos celebran la magna obra con ofrendas a las ninfas de las aguas y a los arquitectos.`,
      `El senado manda inscribir en el arco triunfal central el nombre de los artífices de la infraestructura.`,
      `Generación tras generación, el acueducto suministra millones de litros diarios sin detener su pulso.`,
      `Dos milenios más tarde, las ciclópeas arcadas de piedra continúan en pie desafiando al paso del tiempo.`,
      `La obra permanece como testimonio imborrable del genio civil de Roma y de su dominio sobre la naturaleza.`,

      // Acto 10: El Legado Monumental de la Ingeniería Eterna
      `Veinte siglos después, las ciclópeas arcadas romanas continúan desafiando a los elementos y a la gravedad.`,
      `Ingenieros modernos siguen estudiando el hormigón puzolánico romano por su asombrosa capacidad de autorreparación química.`,
      `Las canalizaciones y sifones ideados por Roma transformaron la civilización urbana en tres continentes.`,
      `Millones de visitantes contemplan hoy los acueductos en pie como monumentos imperecederos del cálculo humano.`,
      `El agua que fluyó por aquellas piedras forjó imperios y demostró el dominio del hombre sobre la naturaleza.`,
      `Aquella colosal hazaña de piedra y cálculo permanece grabada para siempre en la memoria de la humanidad.`
    ];
    return engineeringChronicle[step] || engineeringChronicle[step % engineeringChronicle.length];
  }

  if (isDailyLife) {
    const dailyChronicle: string[] = [
      // Acto 1: Alba
      `Antes del amanecer, los esclavos encienden las primeras lucernas de barro en la penumbra de la ínsula.`,
      `El padre de familia se calza las sandalias de cuero y moja un trozo de pan de espelta en aceite.`,
      `Los clientes pobres esperan en el zaguán de la domus patricia para recibir la canasta diaria de alimentos.`,
      `Los vendedores de leche y verdura recorren los callejones empedrados empujando sus carretas con chirridos.`,
      `Los niños de familias acomodadas parten hacia la escuela acompañados por el pedagogo que carga sus tablillas.`,
      `La ciudad despierta con el estruendo de puertas de madera abriéndose y el olor a humo de fogones.`,

      // Acto 2: Mercado
      `En el foro boario, los carniceros cuelgan cuartos de cerdo salado bajo toldos de lino polvorientos.`,
      `Las matronas examinan racimos de uvas y cestas de higos negociando el precio en monedas de cobre.`,
      `En las tabernas de la esquina hierven ollas de lentejas con tocino y sirven vino caliente con especias.`,
      `Escribas públicos redactan cartas y contratos sobre pergaminos para ciudadanos analfabetos en los pórticos.`,
      `Los cambistas pesan monedas de plata sobre balanzas de bronce detectando piezas falsificadas o limadas.`,
      `El bullicio de pregones y discusiones comerciales inunda las plazas bajo el sol implacable de la mañana.`,

      // Acto 3: Talleres
      `En la herrería, los fuelles avivan el carbón mientras el herrero forja clavos y rejas de arado.`,
      `Los tejedores mueven las lanzaderas de madera en los telares produciendo túnicas de lana basta.`,
      `En la panadería del molino, asnos ciegos giran las piedras de basalto moliendo grano día y noche.`,
      `Los alfareros moldean ánforas de barro rojizo destinadas a almacenar el vino y el garo de Hispania.`,
      `Carpinteros ensamblan lechos y taburetes encajando las piezas de madera con clavijas de olivo.`,
      `El sudor y el serrín cubren a los operarios en los abarrotados talleres de los barrios bajos.`,

      // Acto 4: Termas
      `Hacia la hora sexta, el tañido de una campana de bronce anuncia la apertura de las termas públicas.`,
      `Ciudadanos de toda condición descienden a los vestuarios despojándose de sus túnicas sudadas de trabajo.`,
      `Entran al caldarium donde el vapor caliente del hipocausto abre los poros y relaja los músculos fatigados.`,
      `Los esclavos frotan la piel de los bañistas con aceite de oliva y retiran el sudor usando el estrígilo.`,
      `Se zambullen en la piscina helada del frigidarium produciendo una sensación de vigor instantáneo.`,
      `En los jardines exteriores de las termas juegan a la pelota y debaten sobre política y juegos de arena.`,

      // Acto 5: Tarde
      `Al declinar la tarde, las familias se reúnen en las tabernas para jugar a los dados sobre mesas de piedra.`,
      `Poetas callejeros recitan versos burlescos mientras los comensales beben vino rebajado con agua tibia.`,
      `En las cocinas de las casas patricias preparan faisanes rellenos y fuentes de marisco para el banquete.`,
      `En los pisos superiores de las ínsulas, las familias humildes cenan gachas de cebada a la luz de una vela.`,
      `Los magistrados cierran las basílicas de justicia y los soldados de guardia relevan a los centinelas.`,
      `El sol tiñe de púrpura los tejados de terracota mientras las sombras se alargan sobre los templos.`,

      // Acto 6: Noche
      `Cae la noche cerrada y las puertas de las murallas se cierran con pesados cerrojos de hierro.`,
      `Entran en la ciudad los carros pesados de mercancías que tienen prohibido circular durante el día.`,
      `El ruido ensordecedor de ruedas con aros de hierro sobre el empedrado impide el sueño en las ínsulas.`,
      `Los vigiles nocturnos patrullan las esquinas oscuras armados con cubos de agua y hachas de bombero.`,
      `En las azoteas, los gatos callejeros merodean mientras el silencio se impone en las villas privadas.`,
      `Roma duerme bajo el cielo estrellado preparándose para repetir su ciclo vital al nuevo amanecer.`,

      // Acto 7: Secretos Domésticos
      `En el larario de la casa, el páter familias vierte vino y espigas de trigo honrando a los antepasados.`,
      `Los esclavos recogen las cenizas de los braseros y aseguran los pestillos de madera en las ventanas.`,
      `Madres cantan nanas arcaicas a sus hijos mientras el aceite de las lucernas se extingue gota a gota.`,
      `Jóvenes amantes intercambian notas breves escritas sobre tablillas de cera ocultas bajo tejas sueltas.`,
      `El médico de barrio atiende fiebres nocturnas aplicando cataplasmas de mostaza y vinagre de manzana.`,
      `En las sombras del callejón, el silencio solo se quiebra por el rumor distante de las patrullas legionarias.`,

      // Acto 8: Rituales de Protección
      `Bajo el dintel de las puertas se clavan clavos de hierro para alejar maleficios y espíritus errantes.`,
      `Sacerdotisas encienden incienso en pequeños altares de terracota implorando protección para el hogar.`,
      `Comerciantes cuentan los sestercios acumulados en cofres de roble reforzados con bandas de bronce.`,
      `El panadero prepara la masa fermentada que reposará durante la madrugada para abastecer a la urbe.`,
      `En las cuadras, los mozos limpian el sudor de los caballos y reparten heno fresco traído del campo.`,
      `La urbe respira en una tensa calma antes de que el primer gallo anuncie el renacer de la jornada.`,

      // Acto 9: La Memoria Silenciosa
      `Poco a poco, las generaciones se suceden dejando grabados sus nombres en estelas funerarias sencillas.`,
      `Aquéllos que no fueron cónsules ni generales construyeron la vida real que sostuvo a un imperio colosal.`,
      `Objetos cotidianos de bronce, peines de hueso y dados de arcilla sobreviven hoy en el estrato arqueológico.`,
      `La escritura en las paredes de Pompeya devuelve la voz a taberneros, gladiadores y enamorados anónimos.`,
      `La historia humana no solo se libró en campos de batalla, sino en el latido humilde de cada hogar antiguo.`,
      `Sus rutinas, miedos y esperanzas quedaron grabados en las piedras que aún podemos contemplar y tocar.`,

      // Acto 10: El Veredicto Eterno de la Vida Cotidiana
      `Dos mil años después, los vestigios desenterrados confirman que sus anhelos eran idénticos a los nuestros.`,
      `En museos de todo el mundo, vajillas y calzados gastados recuerdan el pulso incansable de la gente común.`,
      `Las crónicas modernas rescatan por fin la memoria de quienes madrugaron para encender el fuego del mundo.`,
      `Cada sillar desgastado y cada ánfora sellada atestiguan una civilización viva que nunca se apagó.`,
      `El eco de sus pasos sobre las calzadas de piedra resuena hoy como testimonio de supervivencia eterna.`,
      `La verdadera grandeza de la historia reside en quienes vivieron con dignidad cada segundo de su siglo.`
    ];
    return dailyChronicle[step] || dailyChronicle[step % dailyChronicle.length];
  }

  // Universal: 10 Actos x 6 Beats = 60 Beats
  const universalChronicle: string[] = [
    // Acto 1 (0-5)
    `Un suceso imprevisto estalla alterando por completo la tranquilidad cotidiana de los habitantes del lugar.`,
    `Los mensajeros parten a galope tendido para llevar las primeras noticias a los líderes y magistrados.`,
    `La multitud se congrega en la plaza pública murmurando con inquietud ante los rumores crecientes.`,
    `Las autoridades convocan una asamblea de urgencia para evaluar la magnitud del acontecimiento desatado.`,
    `Se emiten órdenes perentorias y los encargados comienzan a movilizar recursos materiales y humanos.`,
    `Con el plan de acción trazado, los protagonistas se disponen a enfrentar la prueba definitiva que se avecina.`,

    // Acto 2 (6-11)
    `Las cuadrillas de avanzada llegan al lugar del hecho constatando la gravedad de la situación real.`,
    `Se establecen los primeros perímetros de seguridad mientras inspeccionan las defensas y materiales.`,
    `Los expertos de la época consultan registros históricos para determinar la estrategia más adecuada.`,
    `Transportan herramientas pesadas y provisiones en carretas que avanzan con lentitud por caminos de tierra.`,
    `La tensión aumenta al comprobarse que las fuerzas y medios disponibles resultan apenas suficientes.`,
    `Con el anochecer encima, los centinelas redoblan la vigilancia ante el riesgo de un colapso inminente.`,

    // Acto 3 (12-17)
    `Al amanecer, se inician las maniobras decisivas bajo la mirada atenta de los mandos superiores.`,
    `Cada integrante del equipo asume su posición asignada con férrea disciplina y sin emitir una queja.`,
    `Un obstáculo inesperado amenaza con desbaratar las horas de preparación acumuladas hasta ese instante.`,
    `Los responsables toman una determinación arriesgada para sortear el peligro y mantener el avance.`,
    `El esfuerzo coordinado de decenas de hombres logra estabilizar la situación en el momento más crítico.`,
    `Superada la primera crisis, el contingente consolida sus posiciones con renovada determinación.`,

    // Acto 4 (18-23)
    `Aparecen los primeros indicios materiales que confirman las sospechas iniciales de los investigadores.`,
    `Documentos sellados y testimonios directos arrojan luz sobre los factores ocultos del acontecimiento.`,
    `Se adoptan medidas extraordinarias para impedir que la información comprometedora salga a la luz.`,
    `Los testigos directos relatan la angustia vivida durante las horas en que el destino pendía de un hilo.`,
    `Las crónicas contemporáneas recogen con asombro la firmeza demostrada por quienes resistieron la prueba.`,
    `El avance continúa a paso firme a pesar de las adversidades climáticas y la fatiga acumulada.`,

    // Acto 5 (24-29)
    `Se alcanza el punto de inflexión donde cualquier error humano acarreará consecuencias irreparables.`,
    `Los protagonistas concentran toda su pericia técnica para ejecutar la fase más compleja de la misión.`,
    `Un clamor de expectación recorre a los presentes al advertirse que la maniobra entra en su fase cumbre.`,
    `Los materiales resisten las tensiones extremas gracias a la calidad de su factura artesanal original.`,
    `Un suspiro colectivo de alivio confirma que la prueba más peligrosa ha sido superada con éxito.`,
    `Se imparten nuevas directrices para asegurar el resultado obtenido y prevenir cualquier recaída.`,

    // Acto 6 (30-35)
    `Comienza la fase de consolidación y balance tras el esfuerzo descomunal desplegado en el terreno.`,
    `Los heridos reciben atención inmediata mientras se cuantifican los recursos consumidos en la jornada.`,
    `Los cronistas oficiales toman nota minuciosa de cada detalle para remitir el informe a las cortes.`,
    `Se distribuyen raciones especiales para reponer las fuerzas de quienes sostuvieron la primera línea.`,
    `El rumor del triunfo se propaga con rapidez entre las poblaciones vecinas desatando el júbilo.`,
    `Las guardias nocturnas mantienen el estado de alerta para evitar cualquier sorpresa de última hora.`,

    // Acto 7 (36-41)
    `El amanecer siguiente revela la magnitud del cambio operado en el paisaje y en las vidas del lugar.`,
    `Delegaciones extranjeras acuden a verificar con sus propios ojos el alcance de la hazaña culminada.`,
    `Se inicia la redacción de los tratados y pactos que regirán el nuevo orden establecido tras el suceso.`,
    `Los artífices principales son convocados para rendir testimonio formal ante las máximas instancias.`,
    `Se rinden honores a los caídos erigiendo monumentos conmemorativos que perdurarán por centurias.`,
    `La calma regresa progresivamente al enclave a medida que se reanudan las actividades cotidianas.`,

    // Acto 8 (42-47)
    `Con el paso de las décadas, la crónica original se enriquece con relatos orales transmitidos de viva voz.`,
    `Investigadores posteriores cotejan las fuentes escritas detectando discrepancias y añadidos legendarios.`,
    `Yacimientos arqueológicos modernos comienzan a desenterrar los primeros vestigios del episodio real.`,
    `Técnicas científicas de datación corroboran la autenticidad de los materiales y herramientas halladas.`,
    `Los datos empíricos permiten reconstruir con asombrosa precisión cada minuto del desarrollo histórico.`,
    `El mito cede su lugar a la evidencia tangible de una civilización tenaz y rigurosa en sus empresas.`,

    // Acto 9 (48-53)
    `Los tratados académicos modernos dedican monografías completas al análisis de este hecho singular.`,
    `Se descubren paralelismos fascinantes entre las soluciones antiguas y los desafíos de nuestra era.`,
    `El testimonio de aquellos pioneros inspira a nuevas generaciones de estudiosos y creadores de todo el orbe.`,
    `Las huellas en la piedra y en los manuscritos preservan la memoria viva de un tiempo irrepetible.`,
    `El veredicto de los siglos ensalza la perseverancia de quienes afrontaron el reto sin dar un paso atrás.`,
    `La lección histórica trasciende las fronteras de su época convirtiéndose en patrimonio universal.`,

    // Acto 10 (54-59)
    `En el presente, la arqueología y la ciencia documental confirman la trascendencia definitiva del suceso.`,
    `Las piezas conservadas en museos nacionales dan fe del ingenio desplegado ante la adversidad extrema.`,
    `La investigación rigurosa permite devolver la voz a protagonistas olvidados por las narrativas oficiales.`,
    `Cada estrato excavado confirma que la realidad histórica superó con creces a la más audaz leyenda.`,
    `Aquellos diez actos de esfuerzo supremo constituyen un testimonio indeleble del espíritu humano.`,
    `El veredicto de la historia sella para siempre la memoria de una gesta que jamás será olvidada.`
  ];
  return universalChronicle[step] || universalChronicle[step % universalChronicle.length];
}

/**
 * Generates an end-to-end, 100% coherent 10-minute documentary (10 Acts x 6 Clips = 60 Clips)
 * strictly focused on the user's specific topic with continuous correlation from Act 1 Clip 1 to Act 10 Clip 6.
 */
export async function generateCoherent9MinuteDocumentary(topic: string): Promise<FlowDocumentary> {
  const cleanTopic = topic.trim();
  const isMedical = /cirug|craneo|medicin|trepan|herida|galeno|celso|salud|enferm|cuerpo|anatom/i.test(cleanTopic);
  const isEngineering = /construc|acueduct|colise|piramid|murall|arquitect|ingenier|puente|camin/i.test(cleanTopic);
  const isDailyLife = /dorm|comid|pan|vino|vida|baño|termas|ropa|familia|esclavo/i.test(cleanTopic);

  console.log(`[Documentary Engine] Starting coherent 10-minute documentary generation (10 Acts x 6 Clips = 60 Clips) for: "${cleanTopic}"`);

  // STEP 1: Generate Master Chronological Arc with 10 Acts & 6 sequential beats per Act
  const outlinePrompt = `
Eres un historiador de élite y director principal de documentales cinematográficos para el canal "Olvis Bolt" (estilo BBC, History Channel y Netflix).
Tema histórico solicitado: "${cleanTopic}".

REGLAS DE ORO DE COHERENCIA Y CONTINUIDAD:
1. Enfoque 100% estricto en el tema "${cleanTopic}".
   - Si el tema es médico, quirúrgico o anatómico: habla exclusivamente de cirugías reales, herramientas de la época (nombres exactos: trépanos, sierras, escalpelos de bronce, etc.), preparación, anestesias arcaicas (opio, mandrágora, vino), técnicas paso a paso, riesgos, dolor, testimonios de médicos antiguos (Celso, Galeno) y pruebas arqueológicas de supervivencia.
   - Si el tema es de ingeniería o construcción: habla de canteras, grúas, mortero romano, obreros, cálculos.
   - Si el tema es de la vida cotidiana o alimentación: habla de mercados, ingredientes, hornos, recetas.
   - NUNCA te desvíes a batallas o guerras genéricas salvo que el tema sea explícitamente una guerra.
2. CONTINUIDAD DE LA HISTORIA: Los 10 actos deben ser una narración cronológica fluida y completa desde el inicio hasta el veredicto histórico final, con correlación continua desde el Acto 1 Clip 1 hasta el Acto 10 Clip 6.
3. EXACTAMENTE 10 ACTOS (Acto 1 al 10, 1 minuto por acto).
4. EXACTAMENTE 6 BEATS o micropasos consecutivos por acto (total 60 beats). Cada beat describe lo que sucede en esa ventana exacta de 10 segundos.

Responde estrictamente en formato JSON con esta estructura exacta:
{
  "documentaryTitle": "Título cinematográfico impactante para el documental de 10 minutos",
  "historicalTopic": "${cleanTopic}",
  "fullScriptCastilian": "Resumen narrativo maestro de 10 minutos en español formal y elegante...",
  "dynamicRelatedTopics": [
    { "label": "Tema Relacionado 1", "topic": "Descripción breve y llamativa" },
    { "label": "Tema Relacionado 2", "topic": "Descripción breve y llamativa" },
    { "label": "Tema Relacionado 3", "topic": "Descripción breve y llamativa" },
    { "label": "Tema Relacionado 4", "topic": "Descripción breve y llamativa" },
    { "label": "Tema Relacionado 5", "topic": "Descripción breve y llamativa" }
  ],
  "acts": [
    {
      "chapterNumber": 1,
      "chapterTitle": "Acto 1: Título evocador",
      "historicalContext": "Explicación del contexto histórico y técnico de este minuto...",
      "beats": [
        "El cirujano palpa la depresión ósea en el cráneo y comprueba la pérdida de consciencia.",
        "Los ayudantes hierven vinagre de vino y calientan los calderos para desinfectar.",
        "Sobre un lienzo limpio disponen escalpelos de bronce forjado y trépanos cilíndricos.",
        "Con una navaja afilada afeitan la cabellera alrededor del traumatismo craneal.",
        "Inmovilizan la cabeza del legionario con correas sobre un bloque cóncavo de madera.",
        "El médico sumerge el escalpelo en aceite e inicia la incisión semicircular en la piel."
      ]
    }
  ]
}

NOTA OBLIGATORIA: PROHIBIDO incluir la palabra 'Beat' o prefijos como 'Beat 1', 'Beat 2', 'Paso 1' en los beats o en los textos. Cada elemento del array 'beats' debe ser una frase narrativa pura que cuente el suceso histórico real de esa ventana de 10 segundos.
`;

  const outline = await callGeminiJsonWithFallback(outlinePrompt);

  if (!outline?.acts || !Array.isArray(outline.acts) || outline.acts.length === 0) {
    throw new Error('Failed to generate documentary outline');
  }

  // Ensure we have exactly 10 acts
  const rawActsList: RawAct[] = outline.acts.slice(0, 10);
  while (rawActsList.length < 10) {
    const actNum = rawActsList.length + 1;
    rawActsList.push({
      chapterNumber: actNum,
      chapterTitle: `Acto ${actNum}: Continuación de la crónica de ${cleanTopic}`,
      historicalContext: `Fase avanzada del análisis histórico sobre ${cleanTopic}.`,
      beats: Array.from({ length: 6 }, (_, bIdx) => 
        getSequentialStoryVoiceover(actNum - 1, bIdx, cleanTopic, isMedical, isEngineering, isDailyLife)
      )
    });
  }

  // STEP 2: Parallel expansion of each Act into 6 detailed clips (total 60 clips)
  console.log(`[Documentary Engine] Outline created with ${rawActsList.length} acts. Generating all 60 clips in parallel with continuous correlation...`);

  const actsWithClipsPromises = rawActsList.map(async (act, actIdx) => {
    const actNumber = actIdx + 1;
    const actTitle = act.chapterTitle || `Acto ${actNumber}`;
    const actBeats = act.beats && act.beats.length >= 6 
      ? act.beats.slice(0, 6).map(b => cleanStoryVoiceover(b))
      : Array.from({ length: 6 }, (_, bIdx) => 
          getSequentialStoryVoiceover(actIdx, bIdx, cleanTopic, isMedical, isEngineering, isDailyLife)
        );

    const prevActTitle = actIdx > 0 ? (rawActsList[actIdx - 1]?.chapterTitle || `Acto ${actIdx}`) : '';
    const prevActLastBeat = actIdx > 0 ? cleanStoryVoiceover(rawActsList[actIdx - 1]?.beats?.slice(-1)[0] || '') : '';
    const nextActTitle = actIdx < rawActsList.length - 1 ? (rawActsList[actIdx + 1]?.chapterTitle || `Acto ${actNumber + 1}`) : '';
    const nextActFirstBeat = actIdx < rawActsList.length - 1 ? cleanStoryVoiceover(rawActsList[actIdx + 1]?.beats?.[0] || '') : '';

    const continuityContext = actIdx > 0
      ? `CONTEXTO PREVIO OBLIGATORIO: El Acto ${actIdx} ("${prevActTitle}") finalizó con: "${prevActLastBeat}". El Clip 1 de este Acto ${actNumber} DEBE conectar de inmediato con ese hecho, manteniendo continuidad temporal directa sin saltos.`
      : `INICIO DEL DOCUMENTAL: Este es el Acto 1. El Clip 1 abre la historia cinematográfica presentando el escenario histórico de "${cleanTopic}".`;

    const nextLinkContext = actIdx < rawActsList.length - 1
      ? `ENLACE AL SIGUIENTE ACTO: El Clip 6 de este Acto ${actNumber} debe dejar el gancho narrativo que dé paso natural a "${nextActTitle}" ("${nextActFirstBeat}").`
      : `CULMINACIÓN: Este es el Acto final 10. El Clip 6 cierra con el impacto, veredicto y legado histórico duradero de "${cleanTopic}".`;

    const actClipsPrompt = `
Eres el guionista y narrador cinematográfico principal para 'Olvis Bolt'.
Documental: "${outline.documentaryTitle || cleanTopic}".
Tema: "${cleanTopic}".
Estás escribiendo el ACTO ${actNumber} de 10: "${actTitle}".
Contexto narrativo de este minuto: "${act.historicalContext || ''}".
${continuityContext}
${nextLinkContext}

Los 6 eventos narrativos consecutivos de este acto son:
1. ${actBeats[0]}
2. ${actBeats[1]}
3. ${actBeats[2]}
4. ${actBeats[3]}
5. ${actBeats[4]}
6. ${actBeats[5]}

Genera los 6 clips cronológicos de 10 segundos para este acto con continuidad total y correlación entre clips.

REGLAS INFLEXIBLES DE NARRACIÓN (HISTORIA PURA, CERO ÓRDENES, CERO MANUALES):
1. LA VOZ EN OFF ('voiceover') VA CONTANDO PARTE DE LA HISTORIA DEL PROMPT DE ESE CLIP PRECISO EN 10 SEGUNDOS:
   - PROHIBIDO TERMINANTEMENTE incluir textos que digan 'beat 1', 'beat 2', 'paso 1', 'clip 1', 'narrador:', etc. Todo texto de voz en off debe ser únicamente la historia viva.
   - PROHIBIDO PONER ÓRDENES O INSTRUCCIONES de lo que se tiene que hacer ("se debe hacer...", "el cirujano debe...", "se procede a...", "en este clip vemos...").
   - La voz en off narra directamente la historia viva de la escena con acción y drama ("Celso presiona el escalpelo sobre la piel...", "El trépano muerde el hueso con rotación lenta...", "La sangre brota aliviando la compresión cerebral...", "El soldado recobra el aliento...").
2. CONTINUIDAD Y CORRELACIÓN TOTAL CON EL SIGUIENTE CLIP:
   - Cada voz en off debe enlazar cronológica y causalmente con la siguiente: lo que se narra en el clip 1 detona lo que ocurre en el clip 2, y así sucesivamente desde el clip 1 hasta el clip 6.
3. DURACIÓN EXACTA DE 10 SEGUNDOS:
   - Cada locución ('voiceover') debe tener ENTRE 15 Y 22 PALABRAS (máximo 130 caracteres). Equivale exactamente a 7-9 segundos de locución hablada.

Responde estrictamente en formato JSON:
{
  "clips": [
    {
      "sceneTitle": "Título corto y preciso de la escena (10s)",
      "voiceover": "Narración viva de 15 a 22 palabras de la historia que ocurre en los 5 planos...",
      "sound": "Efectos de sonido precisos de la escena...",
      "shot1": "Action 0-2s in English (motion collage aesthetic, dark background, engravings, red accent)",
      "shot2": "Action 2-4.5s in English",
      "shot3": "Action 4.5-6.5s in English",
      "shot4": "Action 6.5-8.2s in English",
      "shot5": "Action 8.2-10s in English with snappy percussive cut"
    }
  ]
}
`;

    try {
      const actResult = await callGeminiJsonWithFallback(actClipsPrompt, 1);
      const clips: RawClip[] = Array.isArray(actResult?.clips) && actResult.clips.length >= 6
        ? actResult.clips.slice(0, 6).map((c: any, cIdx: number) => ({
            sceneTitle: (cleanStoryVoiceover(c.sceneTitle) || `Fase ${cIdx + 1}`).slice(0, 60),
            voiceover: enforce10SecondVoiceover(c.voiceover || getSequentialStoryVoiceover(actIdx, cIdx, cleanTopic, isMedical, isEngineering, isDailyLife)),
            sound: c.sound || 'Efectos de época inmersivos',
            shot1: c.shot1 || `Historical archival engraving sliding into frame`,
            shot2: c.shot2 || `Macro inspection of period artifacts and tools`,
            shot3: c.shot3 || `Torn parchment with authentic technical diagrams`,
            shot4: c.shot4 || `Crimson highlight over authentic historical text`,
            shot5: c.shot5 || `Title stamp over textured paper, snappy cut to black`
          }))
        : Array.from({ length: 6 }, (_, cIdx) => ({
            sceneTitle: `${actTitle.replace(/^Acto \d+:\s*/, '')} — Fase ${cIdx + 1}`,
            voiceover: enforce10SecondVoiceover(getSequentialStoryVoiceover(actIdx, cIdx, cleanTopic, isMedical, isEngineering, isDailyLife)),
            sound: "Sonido sordo de metal y madera antigua, respiración contenida, ambiente histórico de época",
            shot1: `Archival engraving of ancient craftsmen and practitioners performing ${cleanTopic}, sliding into dark halftone frame.`,
            shot2: `Close-up macro of authentic period bronze tools and instruments resting on textured wooden surface.`,
            shot3: `Torn monochrome parchment diagram displaying historical anatomical or technical sketches.`,
            shot4: `Dynamic slide of Latin or archaic script notations highlighted in crimson ink.`,
            shot5: `Aged bone-white paper strip stamps: 'CRÓNICA HISTÓRICA'. Snappy cut to black.`
          }));

      return {
        ...act,
        chapterNumber: actNumber,
        chapterTitle: actTitle,
        clips
      };
    } catch (e) {
      console.warn(`[Documentary Engine] Fallback used for Act ${actNumber} clips due to error:`, e);
      const fallbackClips: RawClip[] = Array.from({ length: 6 }, (_, cIdx) => ({
        sceneTitle: `${actTitle.replace(/^Acto \d+:\s*/, '')} — Fase ${cIdx + 1}`,
        voiceover: enforce10SecondVoiceover(getSequentialStoryVoiceover(actIdx, cIdx, cleanTopic, isMedical, isEngineering, isDailyLife)),
        sound: "Resonancia metálica sobre piedra antigua, silencio de concentración, susurro de pergamino",
        shot1: `Historical engraving of ${cleanTopic} sliding across deep black backdrop with high contrast halftone.`,
        shot2: `Macro inspection of genuine historical tools, bone instruments and mineral vessels.`,
        shot3: `Torn antique documentation page highlighting authenticated procedural phases.`,
        shot4: `Crimson marker tracing the exact technical steps recorded in ancient chronicles.`,
        shot5: `Graphic stamp over worn paper texture: 'MÉTODO ORIGINAL'. Sharp percussive cut.`
      }));

      return {
        ...act,
        chapterNumber: actNumber,
        chapterTitle: actTitle,
        clips: fallbackClips
      };
    }
  });

  const resolvedActs = await Promise.all(actsWithClipsPromises);

  // STEP 3: Assemble the complete FlowDocumentary with all 60 clips
  let globalClipIndex = 1;
  const chapters: FlowChapter[] = resolvedActs.map((act, actIdx) => {
    const actNumber = actIdx + 1;
    const startSec = actIdx * 60;
    const endSec = (actIdx + 1) * 60;
    const timestamp = `${formatTime(startSec)} - ${formatTime(endSec)}`;

    const clips: FlowClip[] = (act.clips || []).slice(0, 6).map((rawClip, cIdx) => {
      const clipStart = startSec + cIdx * 10;
      const clipEnd = clipStart + 10;
      const timeRange = `${formatTime(clipStart)} - ${formatTime(clipEnd)}`;

      const shotsBreakdown: ShotBreakdown[] = [
        { shotId: 'SHOT 1', seconds: '0.0–2.0s', visualAction: rawClip.shot1 || 'Historical archival engraving sliding into frame', narrationSnippet: rawClip.voiceover.slice(0, 36) + '...' },
        { shotId: 'SHOT 2', seconds: '2.0–4.5s', visualAction: rawClip.shot2 || 'Macro inspection of period tools and materials', narrationSnippet: rawClip.voiceover.slice(25, 60) + '...' },
        { shotId: 'SHOT 3', seconds: '4.5–6.5s', visualAction: rawClip.shot3 || 'Torn parchment with ancient diagrams and notations', narrationSnippet: rawClip.voiceover.slice(45, 80) + '...' },
        { shotId: 'SHOT 4', seconds: '6.5–8.2s', visualAction: rawClip.shot4 || 'Crimson highlight over authentic chronicle text', narrationSnippet: rawClip.voiceover.slice(65) || 'Foco narrativo de tensión...' },
        { shotId: 'SHOT 5', seconds: '8.2–10.0s', visualAction: rawClip.shot5 || 'Title fragment stamping over dark paper texture', narrationSnippet: '[Impacto percusivo de tambor]' }
      ];

      const flowPrompt = assembleFlowPrompt(
        globalClipIndex,
        actNumber,
        act.chapterTitle,
        rawClip.sceneTitle,
        cleanTopic,
        rawClip,
        rawClip.voiceover
      );

      const clip: FlowClip = {
        clipNumber: globalClipIndex,
        timeRange,
        sceneTitle: rawClip.sceneTitle,
        sceneTitleEnglish: translateTextToCinematicEnglishFallback(rawClip.sceneTitle),
        googleFlowPrompt: flowPrompt,
        voiceoverSegmentSpanish: rawClip.voiceover,
        shots: shotsBreakdown,
        soundEffects: rawClip.sound || 'Ambiente histórico inmersivo'
      };

      globalClipIndex++;
      return clip;
    });

    return {
      chapterNumber: actNumber,
      chapterTitle: act.chapterTitle,
      chapterTitleEnglish: translateTextToCinematicEnglishFallback(act.chapterTitle),
      timestamp,
      clips
    };
  });

  // Assemble full 10-minute continuous master narration
  const assembledFullScript = chapters
    .map(ch => `=== ${ch.chapterTitle.toUpperCase()} (${ch.timestamp}) ===\n` + ch.clips.map(c => c.voiceoverSegmentSpanish).join(' '))
    .join('\n\n');

  const finalDocumentary: FlowDocumentary = {
    documentaryTitle: outline.documentaryTitle || `Crónica Histórica: ${cleanTopic}`,
    documentaryTitleEnglish: translateTextToCinematicEnglishFallback(outline.documentaryTitle || cleanTopic),
    historicalTopic: cleanTopic,
    estimatedDuration: '10 Minutos (10 Actos de 60s)',
    totalClips: 60,
    fullScriptCastilian: outline.fullScriptCastilian || assembledFullScript,
    fullScriptEnglish: translateTextToCinematicEnglishFallback(outline.fullScriptCastilian || assembledFullScript),
    dynamicRelatedTopics: outline.dynamicRelatedTopics && outline.dynamicRelatedTopics.length > 0 
      ? outline.dynamicRelatedTopics 
      : [
          { label: `🏺 Instrumental de ${cleanTopic.slice(0, 15)}`, topic: `Herramientas reales y aleaciones metálicas empleadas en ${cleanTopic}` },
          { label: `📜 Crónicas Censuradas`, topic: `Los testimonios directos de médicos y sabios de la época sobre ${cleanTopic}` },
          { label: `💀 Casos Reales Arqueológicos`, topic: `Restos óseos y hallazgos con signos de supervivencia de ${cleanTopic}` },
          { label: `🌿 Sustancias y Anestesia`, topic: `Fórmulas de hierbas, resinas y antisépticos aplicados en ${cleanTopic}` },
          { label: `🏛️ Legado Imperial`, topic: `Cómo esta técnica influyó en la historia posterior y qué sobrevive hoy` }
        ],
    chapters
  };

  console.log(`[Documentary Engine] ✓ Documentary generated successfully! Total Acts: ${chapters.length}, Total Clips: ${globalClipIndex - 1}`);
  return finalDocumentary;
}

export const generateCoherent10MinuteDocumentary = generateCoherent9MinuteDocumentary;

/**
 * Intelligent topic-aware fallback for offline / disconnected situations
 */
export function buildIntelligentTopicDocumentary(topic: string): FlowDocumentary {
  const clean = topic.trim();
  const isMedical = /cirug|craneo|medicin|trepan|herida|galeno|celso|salud|enferm|cuerpo|anatom/i.test(clean);
  const isEngineering = /construc|acueduct|colise|piramid|murall|arquitect|ingenier|puente|camin/i.test(clean);
  const isDailyLife = /dorm|comid|pan|vino|vida|baño|termas|ropa|familia|esclavo/i.test(clean);

  const actTitles = isMedical
    ? [
        "Acto 1: El Diagnóstico del Trauma y el Paciente",
        "Acto 2: El Instrumental de Bronce y las Aleaciones",
        "Acto 3: La Preparación y las Sustancias Soporíferas",
        "Acto 4: La Incisión y el Despeje del Hueso Craneal",
        "Acto 5: La Perforación con Trépano y Protección Dural",
        "Acto 6: Extracción del Disco Óseo y Descompresión",
        "Acto 7: Hemostasia, Vinagre y Apósitos Antisépticos",
        "Acto 8: Cicatrización y Monitoreo Postoperatorio",
        "Acto 9: Evidencias Arqueológicas de Supervivencia",
        "Acto 10: La Huella Inmortal en la Neurocirugía y el Juicio Histórico"
      ]
    : isEngineering
    ? [
        "Acto 1: El Desafío Topográfico y la Planificación",
        "Acto 2: Las Canteras y la Extracción de Piedra",
        "Acto 3: La Puzolana y el Secreto del Hormigón Romano",
        "Acto 4: Las Grúas Polispastos y la Fuerza Humana",
        "Acto 5: Los Arcos y la Distribución de Tensiones",
        "Acto 6: Nivelación Hidráulica con el Chorobates",
        "Acto 7: Revestimiento Impermeabilizante de Opus Signinum",
        "Acto 8: Pruebas de Carga y Flujo Continuo",
        "Acto 9: El Triunfo del Abastecimiento en la Metrópoli",
        "Acto 10: El Legado Monumental y la Resistencia Milenaria de la Estructura"
      ]
    : isDailyLife
    ? [
        "Acto 1: El Amanecer y los Rituales Matutinos",
        "Acto 2: La Dieta y los Alimentos Cotidianos",
        "Acto 3: Los Espacios Domésticos y el Descanso",
        "Acto 4: Las Jerarquías y las Horas de Trabajo",
        "Acto 5: Los Remedios Caseros y la Higiene",
        "Acto 6: El Encuentro Social en los Espacios Públicos",
        "Acto 7: La Caída de la Tarde y la Última Comida",
        "Acto 8: Las Sombras de la Noche y la Seguridad Urbana",
        "Acto 9: El Retrato Íntimo de una Sociedad Olvidada",
        "Acto 10: El Legado Cotidiano y el Veredicto Arqueológico"
      ]
    : [
        `Acto 1: Las Fuentes Primarias sobre ${clean}`,
        `Acto 2: El Contexto Material y los Protagonistas`,
        `Acto 3: Los Preparativos y Técnicas Documentadas`,
        `Acto 4: El Momento Crítico del Acontecimiento`,
        `Acto 5: El Desafío Inesperado y la Resolución`,
        `Acto 6: Testimonios de Testigos y Cronistas`,
        `Acto 7: Las Consecuencias Inmediatas`,
        `Acto 8: Los Hallazgos Arqueológicos Confirmados`,
        `Acto 9: El Impacto Cultural y la Memoria Colectiva de ${clean}`,
        `Acto 10: La Evidencia Arqueológica y el Veredicto Final de ${clean}`
      ];

  const chapters: FlowChapter[] = actTitles.map((title, actIdx) => {
    const actNum = actIdx + 1;
    const startSec = actIdx * 60;
    const endSec = (actIdx + 1) * 60;
    const timestamp = `${formatTime(startSec)} - ${formatTime(endSec)}`;

    const clips: FlowClip[] = Array.from({ length: 6 }, (_, cIdx) => {
      const clipNumber = actIdx * 6 + cIdx + 1;
      const clipStart = startSec + cIdx * 10;
      const clipEnd = clipStart + 10;
      const timeRange = `${formatTime(clipStart)} - ${formatTime(clipEnd)}`;

      const sceneTitle = `${title.replace(/^Acto \d+:\s*/, '')} — Fase ${cIdx + 1}`;
      
      const voiceover = enforce10SecondVoiceover(getSequentialStoryVoiceover(actIdx, cIdx, clean, isMedical, isEngineering, isDailyLife));

      const shotsBreakdown: ShotBreakdown[] = [
        { shotId: 'SHOT 1', seconds: '0.0–2.0s', visualAction: `Archival engraving depicting authentic ${clean} sliding into frame.`, narrationSnippet: voiceover.slice(0, 36) + '...' },
        { shotId: 'SHOT 2', seconds: '2.0–4.5s', visualAction: `Close-up macro of historical tools and specialized artifacts.`, narrationSnippet: voiceover.slice(25, 60) + '...' },
        { shotId: 'SHOT 3', seconds: '4.5–6.5s', visualAction: `Torn monochrome parchment fragment displaying procedural diagrams.`, narrationSnippet: voiceover.slice(45, 80) + '...' },
        { shotId: 'SHOT 4', seconds: '6.5–8.2s', visualAction: `Crimson marker underlining authenticated historical records.`, narrationSnippet: voiceover.slice(65) || 'Foco narrativo de tensión...' },
        { shotId: 'SHOT 5', seconds: '8.2–10.0s', visualAction: `Graphic stamp over dark paper texture: 'REGISTRO HISTÓRICO'. Percussive cut.`, narrationSnippet: '[Impacto percusivo de tambor]' }
      ];

      const flowPrompt = assembleFlowPrompt(
        clipNumber,
        actNum,
        title,
        sceneTitle,
        clean,
        {
          shot1: shotsBreakdown[0].visualAction,
          shot2: shotsBreakdown[1].visualAction,
          shot3: shotsBreakdown[2].visualAction,
          shot4: shotsBreakdown[3].visualAction,
          shot5: shotsBreakdown[4].visualAction
        },
        voiceover
      );

      return {
        clipNumber,
        timeRange,
        sceneTitle,
        sceneTitleEnglish: translateTextToCinematicEnglishFallback(sceneTitle),
        googleFlowPrompt: flowPrompt,
        voiceoverSegmentSpanish: voiceover,
        shots: shotsBreakdown,
        soundEffects: 'Ambiente histórico fidedigno con sonidos de instrumental y materiales de época'
      };
    });

    return {
      chapterNumber: actNum,
      chapterTitle: title,
      chapterTitleEnglish: translateTextToCinematicEnglishFallback(title),
      timestamp,
      clips
    };
  });

  return {
    documentaryTitle: `Crónica Histórica Completa: ${clean}`,
    documentaryTitleEnglish: translateTextToCinematicEnglishFallback(`Crónica Histórica Completa: ${clean}`),
    historicalTopic: clean,
    estimatedDuration: '10 Minutos (10 Actos de 60s)',
    totalClips: 60,
    fullScriptCastilian: chapters.map(ch => `=== ${ch.chapterTitle} ===\n` + ch.clips.map(c => c.voiceoverSegmentSpanish).join(' ')).join('\n\n'),
    fullScriptEnglish: translateTextToCinematicEnglishFallback(chapters.map(ch => `=== ${ch.chapterTitle} ===\n` + ch.clips.map(c => c.voiceoverSegmentSpanish).join(' ')).join('\n\n')),
    dynamicRelatedTopics: [
      { label: `🏺 Instrumental y Métodos`, topic: `Herramientas e implementos históricos de ${clean}` },
      { label: `📜 Textos y Crónicas`, topic: `Fuentes manuscritas auténticas de la época sobre ${clean}` },
      { label: `💀 Restos Arqueológicos`, topic: `Yacimientos y restos materiales que documentan ${clean}` },
      { label: `🌿 Sustancias y Materiales`, topic: `Materiales orgánicos y químicos aplicados en ${clean}` },
      { label: `🏛️ Consecuencias y Legado`, topic: `Impacto y evolución a través de los siglos de ${clean}` }
    ],
    chapters
  };
}
