import { FlowChapter, FlowClip, FlowDocumentary, ShotBreakdown } from '../types/content';
import { translateTextToCinematicEnglishFallback } from '../utils/translator';
import { cleanStoryVoiceover } from '../utils/textCleaning';

// Helper to format time ranges
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Helper to assemble Google Flow Prompt
function assembleFlowPrompt(
  clipNumber: number,
  actNumber: number,
  chapterTitle: string,
  sceneTitle: string,
  topic: string,
  shots: { shot1: string; shot2: string; shot3: string; shot4: string; shot5: string },
  voiceover: string = ''
): string {
  const cleanVoice = cleanStoryVoiceover(voiceover);
  const voiceProfileLine = `\nVOICE PROFILE / NARRATOR TONE: 50-year-old male narrator, deep, mature, resonant and raspy voice. Mysterious and cinematic BBC documentary tone.`;
  const narrationLine = cleanVoice
    ? `\nSYNCHRONIZED VOICEOVER NARRATION (Audio for this 10s Clip):\n"${cleanVoice}"\nSCENE VISUAL SYNC: The 5 motion shots below directly illustrate this precise moment of the chronicle.`
    : '';
  return `Documentary motion collage / animated newspaper collage sequence, exactly 10 seconds, 16:9, 24fps. Continuous clip ${clipNumber} of 60 (Act ${actNumber}: ${chapterTitle} — Scene: "${sceneTitle}").${voiceProfileLine}${narrationLine}
GLOBAL VISUAL STYLE: dark premium folklore documentary aesthetic, near-monochrome noir grade, deep black backgrounds, bone-white and aged sepia paper tones, single saturated blood-red accent colour. Heavy halftone print-dot texture, subtle pulsing film grain, scratched archival paper, rough torn newspaper edges, historical engravings of ${topic}, antique maps, archaeological chronicles. Fast aggressive lateral slides, hard graphic cuts, locked-off camera with dramatic push-ins. Snappy percussive editing rhythm.
SHOT 1 — 0.0–2.0s: ${shots.shot1}
SHOT 2 — 2.0–4.5s: ${shots.shot2}
SHOT 3 — 4.5–6.5s: ${shots.shot3}
SHOT 4 — 6.5–8.2s: ${shots.shot4}
SHOT 5 — 8.2–10.0s: ${shots.shot5}`;
}

interface RawClipDef {
  sceneTitle: string;
  voiceover: string;
  sound: string;
  shot1: string;
  shot2: string;
  shot3: string;
  shot4: string;
  shot5: string;
}

interface RawActDef {
  title: string;
  historicalContext: string;
  clips: RawClipDef[];
}

function compileDocumentary(
  title: string,
  topic: string,
  fullScript: string,
  relatedTopics: Array<{ label: string; topic: string }>,
  acts: RawActDef[]
): FlowDocumentary {
  let globalClipIndex = 1;

  const chapters: FlowChapter[] = acts.map((act, actIndex) => {
    const actNumber = actIndex + 1;
    const startSec = actIndex * 60;
    const endSec = (actIndex + 1) * 60;

    const clips: FlowClip[] = act.clips.slice(0, 6).map((rawClip, cIdx) => {
      const clipStart = startSec + cIdx * 10;
      const clipEnd = clipStart + 10;
      const timeRange = `${formatTime(clipStart)} - ${formatTime(clipEnd)}`;

      const shotsBreakdown: ShotBreakdown[] = [
        { shotId: 'SHOT 1', seconds: '0.0–2.0s', visualAction: rawClip.shot1, narrationSnippet: rawClip.voiceover.slice(0, 32) + '...' },
        { shotId: 'SHOT 2', seconds: '2.0–4.5s', visualAction: rawClip.shot2, narrationSnippet: '...' },
        { shotId: 'SHOT 3', seconds: '4.5–6.5s', visualAction: rawClip.shot3, narrationSnippet: '...' },
        { shotId: 'SHOT 4', seconds: '6.5–8.2s', visualAction: rawClip.shot4, narrationSnippet: '...' },
        { shotId: 'SHOT 5', seconds: '8.2–10.0s', visualAction: rawClip.shot5, narrationSnippet: '[Impacto percusivo de tambor]' }
      ];

      const flowPrompt = assembleFlowPrompt(
        globalClipIndex,
        actNumber,
        act.title,
        rawClip.sceneTitle,
        topic,
        rawClip,
        rawClip.voiceover
      );

      const clip: FlowClip = {
        clipNumber: globalClipIndex,
        timeRange,
        sceneTitle: rawClip.sceneTitle,
        sceneTitleEnglish: translateTextToCinematicEnglishFallback(rawClip.sceneTitle),
        googleFlowPrompt: flowPrompt,
        voiceoverSegmentSpanish: cleanStoryVoiceover(rawClip.voiceover),
        shots: shotsBreakdown,
        soundEffects: rawClip.sound
      };

      globalClipIndex++;
      return clip;
    });

    return {
      chapterNumber: actNumber,
      chapterTitle: act.title,
      chapterTitleEnglish: `Act ${actNumber}: ${translateTextToCinematicEnglishFallback(act.title.replace(/^Acto \d+:\s*/i, ''))}`,
      timestamp: `${formatTime(startSec)} - ${formatTime(endSec)}`,
      clips
    };
  });

  const totalClipsCount = chapters.reduce((acc, ch) => acc + ch.clips.length, 0);
  const totalMinutes = chapters.length;

  return {
    documentaryTitle: title,
    documentaryTitleEnglish: translateTextToCinematicEnglishFallback(title),
    historicalTopic: topic,
    estimatedDuration: `${totalMinutes} Minutos (${totalMinutes} Actos de 60s)`,
    fullScriptCastilian: fullScript,
    fullScriptEnglish: translateTextToCinematicEnglishFallback(fullScript),
    totalClips: totalClipsCount,
    dynamicRelatedTopics: relatedTopics,
    chapters
  };
}

// -------------------------------------------------------------
// 1. EL ASEDIO DE ANTIOQUÍA (1097-1098) - 48 CLIPS TOTALMENTE ÚNICOS
// -------------------------------------------------------------
export function buildAntiochSiegeDocumentary(): FlowDocumentary {
  const acts: RawActDef[] = [
    {
      title: "Acto 1: El Cerco a las Murallas Inexpugnables de Antioquía",
      historicalContext: "Octubre de 1097: Cien mil peregrinos y caballeros cruzados llegan ante 400 torres de piedra bizantina.",
      clips: [
        {
          sceneTitle: "Las Cuatrocientas Torres del Monte Silpio",
          voiceover: "En octubre de 1097, la vanguardia de la Primera Cruzada quedó petrificada ante doce kilómetros de muralla que jamás habían caído por asalto.",
          sound: "Viento sordo sobre el valle del Orontes, entrechoque de cotas de malla, relincho lejano",
          shot1: "Archival engraving of Mount Silpius with 400 stone towers violently sliding into frame over dark halftone canvas.",
          shot2: "Antique Syrian topographic map with blood-red directional arrows showing crusader encamping sectors.",
          shot3: "Torn monochrome sketch of massive stone masonry walls with crenellated battlements.",
          shot4: "Macro inspection of Latin chronicle excerpt from Gesta Francorum describing the sheer scale.",
          shot5: "Bone-white paper strip stamps: 'ANTIOQUÍA 1097'. Percussive cut to black."
        },
        {
          sceneTitle: "El Foso Cenagoso del Río Orontes",
          voiceover: "El río Orontes actuaba como una fosa natural traicionera: las primeras carretas de bueyes quedaron atascadas en el fango negruzco.",
          sound: "Chapoteo pesado en lodo denso, madera crujiendo bajo peso, gritos de boyeros",
          shot1: "Engraving of heavy supply wagons sinking into deep muddy riverbank with print-dot texture.",
          shot2: "Torn aerial diagram of the defensive water moat system engineered during Justinian's reign.",
          shot3: "Silhouette of Norman soldiers struggling to pull an overturned cart in cold drizzle.",
          shot4: "Close-up of ox hooves slipping and churning black Syrian mud.",
          shot5: "Title fragment stamps: 'EL FANGO DEL ORONTES'. Sharp drum strike."
        },
        {
          sceneTitle: "La Llegada del Invierno Sirio",
          voiceover: "Nadie había previsto la crudeza del invierno en el Levante: a mediados de noviembre, lluvias torrenciales empaparon los campamentos.",
          sound: "Tormenta de lluvia golpeando lonas de tiendas, truenos lejanos, viento gélido",
          shot1: "Dark moody engraving of crusader camp flooded by torrential storm waters sliding in from top.",
          shot2: "Antique weather chart showing dramatic Mediterranean winter temperature drops in northern Syria.",
          shot3: "Monochrome drawing of soaked knights shivering inside unheated cloth pavilions.",
          shot4: "Torn manuscript detail from Raymond of Aguilers recounting the perpetual dampness.",
          shot5: "Graphic stamp over dark paper texture: 'INVIERNO DE HIERRO'. Hard cut."
        },
        {
          sceneTitle: "La Pudrición de los Granos en las Carretas",
          voiceover: "En menos de tres semanas, la humedad pudrió los sacos de cebada y trigo; un moho negro y fétido inutilizó las reservas de harina.",
          sound: "Saco de cáñamo desgarrándose, grano mohoso derramándose con chasquido húmedo",
          shot1: "High-contrast sketch of rotting sacks of grain infested with mold and weevils entering frame.",
          shot2: "Macro engraving of spoiled black wheat ears contrasting against antique sepia paper.",
          shot3: "Silhouette of a monk inspecting blackened flour with trembling hands under lantern light.",
          shot4: "Crimson highlight marker crossing out supply line routes from the port of Saint Symeon.",
          shot5: "Bone-white paper strip stamps: 'EL GRANO CORRUPTO'. Snappy cut to black."
        },
        {
          sceneTitle: "El Consejo de Guerra de Bohemundo de Tarento",
          voiceover: "Bohemundo de Tarento y Raimundo de Tolosa comprendieron que la ciudad no se rendiría: comenzaba una carrera contra el hambre.",
          sound: "Murmullos acalorados en francés y provenzal antiguo, puñetazo sobre mesa de madera",
          shot1: "Archival engraving of Norman and Provençal lords quarreling around a war council table.",
          shot2: "Torn architectural plan of Antioch's six fortified gates and primary choke points.",
          shot3: "Close-up of Bohemundo's gaunt, ruthless face illuminated by torchlight.",
          shot4: "Wax seal impression displaying the Norman ducal coat of arms in dull crimson ink.",
          shot5: "Panel slams off-screen left. Title stamp: 'EL PACTO DE LOS SEÑORES'. Percussive cut."
        },
        {
          sceneTitle: "El Primer Destello de los Estandartes Selyúcidas",
          voiceover: "Sobre las almenas de Antioquía, los arqueros turcos de Yaghi-Siyan enarbolaron estandartes de media luna, desafiando a los sitiadores.",
          sound: "Silbido de flecha compuesta cortando el aire, choque de hierro contra piedra, alarido en turco",
          shot1: "Silhouettes of Seljuk composite archers on high stone battlements against darkening sky.",
          shot2: "Torn engraving of black silk banners adorned with crescent moon insignia fluttering in gale.",
          shot3: "Composite bow drawing back to full draw in extreme macro close-up.",
          shot4: "Archival sketch of an iron bodkin arrow tip lodged deep into a crusader shield.",
          shot5: "Graphic impact stamp: 'EL DESAFÍO TURCO'. Heavy percussive drop."
        }
      ]
    },
    {
      title: "Acto 2: La Muerte Masiva de los Caballos y el Colapso Físico",
      historicalContext: "Diciembre 1097 - Enero 1098: De setenta mil monturas apenas quedan setecientos corceles esqueléticos.",
      clips: [
        {
          sceneTitle: "La Agonía de los Corceles de Guerra",
          voiceover: "Sin forraje ni grano seco, los orgullosos caballos de guerra europeos comenzaron a desplomarse sobre el fango helado.",
          sound: "Relincho quebrado y agónico de caballo, quejido gutural de animal exhausto, lluvia constante",
          shot1: "Archival engraving of emaciated warhorses collapsing beneath unstrapped wooden saddles.",
          shot2: "Torn logistical tally comparing the 70,000 horses at Nicaea with less than 700 alive at Antioch.",
          shot3: "Silhouette of a knight kneeling beside his dying destrier, holding the animal's muzzle.",
          shot4: "Macro sketch of exposed horse ribs showing through raw scraped hide.",
          shot5: "Bone-white paper strip stamps: 'SETENTA MIL A SETECIENTOS'. Hard cut."
        },
        {
          sceneTitle: "El Precio Insensato de una Cabeza de Buey",
          voiceover: "En el mercado negro del campamento, una cabeza de buey podrida llegó a cotizarse en cincuenta monedas de plata pura.",
          sound: "Monedas de plata tintineando sobre madera mugrienta, regateo desesperado en voz ronca",
          shot1: "Monochrome sketch of a severed, fly-blown ox head placed upon a butcher's wooden block.",
          shot2: "Antique silver deniers of the County of Toulouse sliding into frame with sharp metal ring.",
          shot3: "Torn chronicle page from Albert of Aachen describing knights selling heirloom swords for a crust of bread.",
          shot4: "Close-up of hollow, starved eyes of a young squire staring at a bone.",
          shot5: "Graphic stamp over parchment: 'CINCUENTA MONEDAS'. Percussive cut."
        },
        {
          sceneTitle: "La Caza de Espinas, Cardos y Raíces Amargas",
          voiceover: "Nobleza y campesinos se arrodillaban en las laderas arrancando cardos espinosos y raíces silvestres para engañar al estómago.",
          sound: "Espinas desgarrando piel de dedos desnudos, masticación dura y correosa",
          shot1: "Engraving of armored men on hands and knees digging up wild desert thistles with daggers.",
          shot2: "Botanical archival illustration of Levantine wild weeds and toxic roots consumed by the army.",
          shot3: "Torn manuscript detail describing stomach convulsions caused by eating raw poisonous tubers.",
          shot4: "Close-up of bleeding fingertips clutching a handful of dirt and bitter roots.",
          shot5: "Title fragment stamps: 'RAÍCES Y ESPINAS'. Sharp drum impact."
        },
        {
          sceneTitle: "El Sacrificio Clandestino de las Monturas",
          voiceover: "A pesar de las prohibiciones eclesiásticas, los soldados degollaban monturas en la penumbra para beber la sangre tibia.",
          sound: "Corte seco de cuchillo en yugular equina, gorgoteo de sangre en cuenco de estaño",
          shot1: "Torn engraving of hooded figures clustered around a slaughtered horse in secret shadow.",
          shot2: "Monochrome sketch of a soldier pressing his lips to a wooden bowl of dark steaming blood.",
          shot3: "Decree scroll from the papal legate Adhemar of Le Puy forbidding the slaughter of breeding stock.",
          shot4: "Crimson splatter pattern expanding across weathered parchment texture.",
          shot5: "Bone-white paper strip stamps: 'SANGRE TIBIA'. Snappy cut to black."
        },
        {
          sceneTitle: "La Epidemia de Tifus y la Debilidad Extrema",
          voiceover: "El agua contaminada del Orontes desató una peste de disentería y fiebres que mataba a cientos de hombres en sus jergones.",
          sound: "Tos seca y cavernosa, gemidos de enfermos en tiendas comunales, lluvia interminable",
          shot1: "Archival medical sketch of field hospital trenches filled with fever-stricken crusaders.",
          shot2: "Anatomical drawing of intestinal dysentery inflammation from 12th century medical manuscripts.",
          shot3: "Torn camp roster showing entire contingents from Flanders wiped out without drawing a sword.",
          shot4: "Silhouette of priests administering extreme unction by candlelight.",
          shot5: "Title stamp over dark textured background: 'EL AGUA INFECTA'. Hard cut."
        },
        {
          sceneTitle: "Las Primeras Deserciones en la Noche",
          voiceover: "Pedro el Ermitaño y Guillermo de Carpentras intentaron huir en secreto, avergonzando a una cruzada al borde del colapso.",
          sound: "Pisadas cautelosas en la maleza húmeda, caballo sin herraduras trotando en el lodo",
          shot1: "Torn engraving of deserters creeping away from perimeter pickets into darkness.",
          shot2: "Archival portrait sketch of Peter the Hermit captured and brought back in disgrace by Tancred.",
          shot3: "Latin chronicle quote highlighting the humiliation of leadership fleeing the holy host.",
          shot4: "Silhouette of armed Norman sentries blocking the mountain pass to Cilicia.",
          shot5: "Graphic stamp over bone-white card: 'LA FUGA DE LOS SANTOS'. Drum strike."
        }
      ]
    },
    {
      title: "Acto 3: La Comida Prohibida y el Hervidero de Escudos",
      historicalContext: "Enero - Febrero 1098: El racionamiento extremo obliga a hervir cuero y masticar correas de armadura.",
      clips: [
        {
          sceneTitle: "El Raspado de las Pieles de Escudo",
          voiceover: "Con todas las provisiones agotadas, los escuderos comenzaron a raspar el cuero de buey endurecido de los escudos militares.",
          sound: "Cuchillo raspando cuero seco con chillido áspero, desprendimiento de fibras curtidas",
          shot1: "Macro archival view of a heavy Norman kite shield having its leather facing scraped with iron blade.",
          shot2: "Cross-section technical diagram of medieval laminated wood and rawhide shield construction.",
          shot3: "Torn engraving of starving warriors peeling dry leather strips from battle-scarred pavises.",
          shot4: "Fragments of dried animal hide piling into a dented bronze cooking pot.",
          shot5: "Bone-white paper strip stamps: 'EL CUERO DEL ASPIS'. Percussive cut."
        },
        {
          sceneTitle: "Tres Días Hirviendo Correas de Estribo",
          voiceover: "Hervían cinchas, correas de estribo y viejas suelas de cuero durante setenta y dos horas hasta extraer una pasta gomosa y amarga.",
          sound: "Gorgoteo espeso de olla al fuego, leña húmeda crepitando, vapor sulfuroso",
          shot1: "Engraving of an iron cauldron bubbling with dark murky liquid over a low smoky camp fire.",
          shot2: "Close-up of boiled leather strips softening into gelatinous, unpalatable mulch.",
          shot3: "Torn chronicle excerpt from Raymond of Aguilers: 'Men ate straps, shoes, and old skins...'.",
          shot4: "Monochrome sketch of a knight chewing rubbery hide with broken teeth.",
          shot5: "Title fragment stamps: 'GELATINA AMARGA'. Hard cut to black."
        },
        {
          sceneTitle: "La Prohibición de Robar Raciones bajo Pena de Muerte",
          voiceover: "El obispo Adhemar ordenó ahorcar en el acto a cualquier soldado que robara un mendrugo o grano a sus camaradas.",
          sound: "Crujido de cuerda de cáñamo tensada en horca improvisada, viento helado",
          shot1: "Archival sketch of camp gallows erected on the crest of a barren Syrian hill.",
          shot2: "Torn manuscript of military ordinances establishing death penalty for looting bread from tents.",
          shot3: "Silhouette of a condemned man hanging against the cold grey twilight sky.",
          shot4: "Officers standing motionless in chainmail, enforcing iron silence among the onlookers.",
          shot5: "Graphic stamp over dark paper: 'LEY DE LA HORCA'. Heavy drum hit."
        },
        {
          sceneTitle: "El Desfallecimiento de los Centinelas",
          voiceover: "En las empalizadas exteriores, los vigías se desmayaban de inanición sobre sus lanzas, incapaces de sostener el escudo.",
          sound: "Cuerpo con cota de malla desplomándose pesadamente sobre estacas de madera",
          shot1: "Engraving of a mailed crusader guard slumping forward over wooden parapet.",
          shot2: "Torn topographic survey of the perimeter redoubts known as Malregard and La Mahomerie.",
          shot3: "Detail of an iron spear shaft slipping from numb, frostbitten gauntleted fingers.",
          shot4: "Close-up of sunken cheeks and pale, starved lips of a young French sentry.",
          shot5: "Bone-white paper strip stamps: 'VIGILANTES SIN FUERZA'. Sharp cut."
        },
        {
          sceneTitle: "Incursiones Nocturnas desde las Almenas",
          voiceover: "Los sitiados realizaban salidas nocturnas sorpresa, degollando a los piquetes exhaustos y arrojando cabezas decapitadas con catapultas.",
          sound: "Chillidos salvajes en la penumbra, impacto húmedo de objeto pesado lanzado por catapulta",
          shot1: "Torn engraving of Turkish cavalry sortie bursting through city postern gate under torchlight.",
          shot2: "Monochrome sketch of catapult hurling severed heads over crusader ditch fortifications.",
          shot3: "Crimson splashes landing across antique Latin parchment text.",
          shot4: "Silhouette of terrified crusaders scrambling blindly for weapons in pitch darkness.",
          shot5: "Title fragment stamps: 'TERROR NOCTURNO'. Percussive drum beat."
        },
        {
          sceneTitle: "La Impotencia de las Máquinas de Asedio",
          voiceover: "Las torres de madera y catapultas francas ardían consumidas por fuego griego arrojado desde las colosales murallas turcas.",
          sound: "Siseo rugiente de fuego griego, madera ardiendo con estrépito, vigas colapsando",
          shot1: "Dramatic engraving of massive siege belfry engulfed in chemical green and crimson flames.",
          shot2: "Technical diagram of medieval siege mangonel collapsing under flaming oil pots.",
          shot3: "Torn chronicle page describing the catastrophic destruction of Bohemond's wooden engines.",
          shot4: "Monochrome close-up of blackened timber smoking against the dark Syrian night.",
          shot5: "Graphic stamp over charred card: 'MÁQUINAS EN LLAMAS'. Sudden cut to black."
        }
      ]
    },
    {
      title: "Acto 4: Los Tafures y el Tabú Más Oscuro en Ma'arra",
      historicalContext: "Febrero - Marzo 1098: La leyenda silenciada de los Tafures y las crónicas censuradas de supervivencia extrema.",
      clips: [
        {
          sceneTitle: "El Ejército de los Mendigos: Los Tafures",
          voiceover: "En el barro nació una casta temible: los Tafures, mendigos descalzos armados con hoces, hachas y cuchillos de carnicero.",
          sound: "Hoces raspando piedras de afilar con chirrido metálico, risotadas roncas de hombres hambrientos",
          shot1: "Engraving of ragged, feral Tafur warriors cloaked in animal skins brandishing curved scythes.",
          shot2: "Torn chronicle portrait of King Tafur, a disinherited Norman knight walking barefoot among his followers.",
          shot3: "Silhouette of a ragged mob marching outside conventional feudal command structures.",
          shot4: "Close-up of a serrated sickle blade stained with dried dark rust.",
          shot5: "Bone-white paper strip stamps: 'LOS TAFURES'. Percussive drum strike."
        },
        {
          sceneTitle: "El Terror Psicológico Inculcado al Enemigo",
          voiceover: "Los propios comandantes turcos sentían pavor hacia los Tafures: combatían sin armadura y parecían inmunes al dolor del hambre.",
          sound: "Alarido tribal gutural resonando en el valle, crujido de maderas quebradas",
          shot1: "Torn sketch of Turkish scouts on hilltop recoiling in horror from the screaming Tafur vanguard.",
          shot2: "Historical chronicle quote from Guibert of Nogent detailing the savage reputation of the Tafurs.",
          shot3: "Monochrome drawing of Tafurs charging bare-chested through thorn thickets.",
          shot4: "Crimson wash spilling across Arabic script from contemporary chronicler Ibn al-Athir.",
          shot5: "Title fragment stamps: 'EL PAVOR DE LA HORDAS'. Hard cut."
        },
        {
          sceneTitle: "El Asedio a la Ciudadela de Ma'arra",
          voiceover: "Tras tomar la fortaleza vecina de Ma'arra, la hambruna alcanzó un nivel de desesperación que la historia oficial intentó borrar.",
          sound: "Piedras colapsando bajo fuego de artillería de asedio, gritos de asalto en la brecha",
          shot1: "Archival engraving of the stone battlements of Ma'arra falling to crusader assault.",
          shot2: "Torn Syrian regional map showing the supply road between Antioch and Ma'arra an-Nu'man.",
          shot3: "Monochrome sketch of exhausted victors finding empty granaries inside the captured fortress.",
          shot4: "Detail of broken ceramic storage amphorae containing only dry dust and sand.",
          shot5: "Bone-white paper strip stamps: 'MA'ARRA 1098'. Sharp cut to black."
        },
        {
          sceneTitle: "La Crónica Censurada de Radulfo de Caen",
          voiceover: "El cronista Radulfo de Caen anotó con horror cómo los hombres más hambrientos hirvieron carne de los caídos ensartada en estacas.",
          sound: "Gorgoteo sordo sobre brasas en la oscuridad, silencio culpable, viento susurrando",
          shot1: "Latin manuscript folio from Radulph of Caen with highlighted lines describing the forbidden feast.",
          shot2: "Dark engraving of shadowy silhouettes crouched around a fire pit in the ruins of Ma'arra.",
          shot3: "Torn parchment excerpt: 'Our men boiled pagan adults in pots; they impaled children on spits...'.",
          shot4: "Crimson highlight bar stamping across the censored Latin text lines.",
          shot5: "Graphic stamp over dark paper texture: 'LA CRÓNICA PROHIBIDA'. Heavy drum hit."
        },
        {
          sceneTitle: "La Herejía Encubierta por los Clérigos",
          voiceover: "Los capellanes papales miraron hacia otro lado: sabían que si castigaban a los soldados, el ejército cruzado se desintegraría.",
          sound: "Susurros conspirativos en latín eclesiástico, crujido de rosario de madera, silencio cómplice",
          shot1: "Engraving of church prelates conferring in a closed tent with lowered hoods and grim expressions.",
          shot2: "Torn papal letter fragment addressed to Pope Urban II omitting specific details of the famine.",
          shot3: "Silhouette of a bishop holding a gold crucifix over a dark camp where fires smolder.",
          shot4: "Monochrome sketch of closed tent flaps concealing what occurred inside the perimeter.",
          shot5: "Bone-white paper strip stamps: 'EL SILENCIO PAPAL'. Snappy cut."
        },
        {
          sceneTitle: "La Verdad Desenterrada por la Bioarqueología",
          voiceover: "Excavaciones modernas en el norte de Siria hallaron huesos humanos con marcas inequívocas de corte y fuego fechados en 1098.",
          sound: "Raspado de brocha arqueológica sobre hueso seco, chasquido de medición científica",
          shot1: "Archaeological forensic photograph fragment of human femur bone displaying butchery cut-marks.",
          shot2: "Microscopic analysis diagram highlighting heat discoloration consistent with boiling.",
          shot3: "Scientific paper excerpt from historical anthropology journals validating the medieval chroniclers.",
          shot4: "Timeline correlation between extreme famine peaks and mass burial strata.",
          shot5: "Panel slams away laterally. Title stamp: 'EVIDENCIA EN EL HUESO'. Hard cut to black."
        }
      ]
    },
    {
      title: "Acto 5: El Delirio Místico y el Cerrojo de Kerbogha",
      historicalContext: "Abril - Mayo 1098: La llegada del gigantesco ejército de socorro de Kerbogha de Mosul.",
      clips: [
        {
          sceneTitle: "El Polvo en el Horizonte de Mosul",
          voiceover: "A finales de mayo, una colosal nube de polvo anunció la llegada de Kerbogha de Mosul con setenta mil jinetes turcos.",
          sound: "Retumbo subterráneo de miles de cascos de caballería, tambores de guerra orientales",
          shot1: "Panoramic engraving of vast desert horizon obscured by towering clouds of dust sliding into frame.",
          shot2: "Torn strategic map showing Kerbogha's advance cutting off crusader supply corridors from the sea.",
          shot3: "Monochrome sketch of lookout sentries staring in horror from the foothills.",
          shot4: "Crimson tactical vectors surrounding the besiegers' camp, locking them into a fatal trap.",
          shot5: "Bone-white paper strip stamps: 'EL EJÉRCITO DE MOSUL'. Percussive drum roll."
        },
        {
          sceneTitle: "Sitiadores Convertidos en Sitiados",
          voiceover: "De la noche a la mañana, los cruzados quedaron atrapados: los turcos de Antioquía frente a ellos y Kerbogha a sus espaldas.",
          sound: "Sonido de cerrojo de hierro cerrándose, viento que azota las carpas desvencijadas",
          shot1: "Diagrammatic tactical map of double-ring siege: Antioch's inner walls and Kerbogha's outer encirclement.",
          shot2: "Engraving of crusaders trapped in a narrow valley between two hostile forces.",
          shot3: "Torn chronicle detail describing panic spreading through the Norman and Provençal ranks.",
          shot4: "Silhouette of soldiers looking in both directions with weapons trembling.",
          shot5: "Title fragment stamps: 'LA TRAMPA PERFECTA'. Heavy drum beat."
        },
        {
          sceneTitle: "La Fiebre y las Visiones en la Catedral",
          voiceover: "En las tiendas azotadas por la fiebre, los soldados juraban ver al apóstol San Andrés caminando entre los moribundos.",
          sound: "Murmullo místico delirante, respiración agitada de enfermo febril, campanadas lejanas",
          shot1: "Dark stylized engraving of saintly apparitions glowing with faint crimson halo in misty tent.",
          shot2: "Torn manuscript of visionary testimonies recorded by medieval chroniclers during the siege.",
          shot3: "Monochrome sketch of emaciated warrior reaching out with clawed fingers toward empty air.",
          shot4: "Flickering candle casting distorted shadows against rough canvas walls.",
          shot5: "Bone-white paper strip stamps: 'DELIRIO MÍSTICO'. Sharp cut to black."
        },
        {
          sceneTitle: "El Campesino Pedro Bartolomé",
          voiceover: "Un humilde sirviente provenzal llamado Pedro Bartolomé afirmó que San Andrés le había revelado dónde estaba la Santa Lanza.",
          sound: "Voz ronca proclamando profecía en provenzal antiguo, murmullos de escepticismo y esperanza",
          shot1: "Archival portrait engraving of Peter Bartholomew, wild-eyed with ragged beard and tunic.",
          shot2: "Torn chronicle page from Raymond of Aguilers supporting the validity of Bartholomew's revelation.",
          shot3: "Bohemond and Adhemar listening with folded arms and doubtful expressions.",
          shot4: "Macro sketch of a peasant's dirt-encrusted hands gesturing toward the earth.",
          shot5: "Title fragment stamps: 'LA PROFECÍA DEL SIERVO'. Percussive cut."
        },
        {
          sceneTitle: "La Decisión Desesperada de Bohemundo",
          voiceover: "Bohemundo sabía que quedaban provisiones para menos de cinco días: solo un milagro o una traición abriría las puertas.",
          sound: "Pasos pesados de botas de hierro en tienda solitaria, respiración contenida, reloj de arena",
          shot1: "Torn engraving of Bohemond pacing in his command pavilion with unclasped sword belt.",
          shot2: "Hourglass illustration with red sand trickling down into the lower bulb.",
          shot3: "Secret message scroll rolled tightly and tied with black silk cord.",
          shot4: "Close-up of Bohemond's hand sliding a pouch of gold coins into an emissary's palm.",
          shot5: "Graphic stamp over parchment: 'CINCO DÍAS DE VIDA'. Heavy drum strike."
        },
        {
          sceneTitle: "El Mensajero Clandestino de la Torre",
          voiceover: "En la medianoche del primero de junio, una sombra descendió por las almenas de Antioquía portando un mensaje crucial.",
          sound: "Cuerda de cáñamo rozando piedra sillar en la oscuridad, susurro furtivo en siríaco",
          shot1: "Engraving of hooded figure sliding down the vertical stone wall of Antioch on a thin cord.",
          shot2: "Torn map indicating the exact location of the Tower of the Two Sisters on the southern wall.",
          shot3: "Silhouette of Norman scouts intercepting the messenger in olive grove shadows.",
          shot4: "Macro view of written message sealed with the private signet of an armorer.",
          shot5: "Bone-white paper strip stamps: 'LA SOMBRA EN EL MURO'. Sudden cut to black."
        }
      ]
    },
    {
      title: "Acto 6: La Traición de la Torre de las Dos Hermanas",
      historicalContext: "Noche del 2 al 3 de Junio 1098: La conspiración de Firuz que abrió la puerta de Antioquía.",
      clips: [
        {
          sceneTitle: "Firuz: El Fabricante de Cotas de Malla",
          voiceover: "El comandante de la Torre de las Dos Hermanas era Firuz, un armero armenio resentido con el gobernador turco Yaghi-Siyan.",
          sound: "Martillazo de herrero sobre remache de cota de malla, chispa sobre yunque en penumbra",
          shot1: "Archival engraving of Armenian armorer Firuz examining chainmail links in a stone workshop.",
          shot2: "Torn Byzantine chronicle detailing Firuz's secret negotiations with Bohemond of Taranto.",
          shot3: "Architectural cross-section of the fortified Three-Level Tower of the Two Sisters.",
          shot4: "Close-up of Firuz's determined expression peering down through arrow slit into the night.",
          shot5: "Bone-white paper strip stamps: 'EL ARMAS Y LA TRAICIÓN'. Percussive cut."
        },
        {
          sceneTitle: "La Cuerda Arrojada en Plena Tormenta",
          voiceover: "Bajo una tormenta eléctrica torrencial que amortiguaba los ruidos, Firuz arrojó una soga trenzada desde lo alto de la almena.",
          sound: "Trueno atronador, viento huracanado, cuerda de cuero golpeando contra roca mojada",
          shot1: "Violent graphic slide of thick braided hemp rope uncoiling down towering dark stone wall.",
          shot2: "Engraving of lightning bolt briefly illuminating the sixty-foot drop to the ditch.",
          shot3: "Silhouette of Norman knights waiting drenched in rain at the base of the wall.",
          shot4: "Close-up of a mailed hand gripping the wet rough hemp fibers.",
          shot5: "Title fragment stamps: 'LA SOGA EN LA ALMENA'. Sharp drum hit."
        },
        {
          sceneTitle: "La Escalada de los Sesenta Caballeros",
          voiceover: "Sesenta caballeros escogidos treparon uno a uno por la soga; si la cuerda cedía, la caída sobre las rocas era fatal.",
          sound: "Cuerda crujiendo bajo peso de sesenta kilos de hierro, respiración sofocada por el esfuerzo",
          shot1: "Dramatic vertical tracking sketch of mailed warriors ascending vertical stone facade.",
          shot2: "Torn manuscript detail describing the terrifying sway of the rope in high winds.",
          shot3: "Silhouette of first knight pulling himself through narrow second-story window embrasure.",
          shot4: "Monochrome sketch of Firuz extending a hand to haul the Norman vanguard inside.",
          shot5: "Bone-white paper strip stamps: 'SESENTA HOMBRES'. Hard cut to black."
        },
        {
          sceneTitle: "El Degüello de la Guardia de la Torre",
          voiceover: "En un silencio escalofriante, los cruzados degollaron a los centinelas dormidos en la cámara superior sin que dieran la alarma.",
          sound: "Corte sordo de daga en garganta, quejido ahogado en tela, caída blanda sobre estera de paja",
          shot1: "Dark engraving of dagger strike silencing sleeping guard in vaulted stone chamber.",
          shot2: "Torn floorplan of the tower guardrooms with crimson markers indicating silenced posts.",
          shot3: "Silhouette of Norman soldier gently setting a fallen helmet onto straw to prevent metallic noise.",
          shot4: "Close-up of blood pooling across medieval ceramic floor tiles.",
          shot5: "Graphic stamp over dark paper: 'SILENCIO DE MUERTE'. Percussive drum beat."
        },
        {
          sceneTitle: "La Apertura de la Puerta de San Jorge",
          voiceover: "Descendiendo por la rampa interior, rompieron los cerrojos de hierro de la Puerta de San Jorge abriendo paso al ejército.",
          sound: "Hierro forjado crujiendo bajo palanca, bisagras gigantescas rechinando pesadamente",
          shot1: "Torn engraving of massive oak and iron-studded city gates being forced open from within.",
          shot2: "Monochrome sketch of crusader army outside surging forward like a dark human tidal wave.",
          shot3: "Detail of broken iron crossbars and shattered bronze padlock mechanisms.",
          shot4: "Silhouette of vanguard knights holding torches aloft as signal to Bohemond.",
          shot5: "Bone-white paper strip stamps: 'LA PUERTA ABIERTA'. Sharp cut."
        },
        {
          sceneTitle: "El Clamor ¡Deus Vult! en las Calles de Antioquía",
          voiceover: "Al despuntar el 3 de junio, miles de cruzados irrumpieron en la ciudad al grito ensordecedor de ¡Dios lo quiere!",
          sound: "Alarido colosal de miles de gargantas: ¡DEUS VULT! ¡DEUS VULT!, cuernos de guerra sonando",
          shot1: "Violent graphic slide of crusader cavalry and infantry flooding through opened gates.",
          shot2: "Engraving of chaotic street battles in narrow Syrian alleys under dawn twilight.",
          shot3: "Crimson banner of Bohemond of Taranto being planted atop the highest captured parapet.",
          shot4: "Torn chronicle quote from Gesta Francorum describing the overwhelming fury of the assault.",
          shot5: "Heavy graphic impact stamp: '¡DEUS VULT!'. Deep percussive slam."
        }
      ]
    },
    {
      title: "Acto 7: El Hallazgo de la Santa Lanza en la Catedral",
      historicalContext: "Junio de 1098: Sitiados dentro de Antioquía por Kerbogha, la excavación en San Pedro cambia la moral.",
      clips: [
        {
          sceneTitle: "La Desesperación Dentro de los Muros Conquistados",
          voiceover: "La alegría duró poco: la ciudad estaba desprovista de alimentos y el inmenso ejército de Kerbogha cercó las murallas al día siguiente.",
          sound: "Viento desolado en calles vacías de Antioquía, relincho distante del campamento exterior turco",
          shot1: "Engraving of empty food stalls and deserted market squares inside captured Antioch.",
          shot2: "Torn panoramic sketch showing Kerbogha's siege pavilions encircling the city walls.",
          shot3: "Monochrome drawing of weary crusader veterans leaning on dented shields in exhaustion.",
          shot4: "Close-up of a mother hugging an emaciated child against cold stone foundation.",
          shot5: "Bone-white paper strip stamps: 'LA CIUDAD VACÍA'. Hard cut."
        },
        {
          sceneTitle: "La Excavación Bajo el Suelo de San Pedro",
          voiceover: "El 14 de junio, Pedro Bartolomé y doce caballeros comenzaron a cavar bajo el suelo sagrado de la basílica de San Pedro.",
          sound: "Picos de hierro golpeando losas de piedra y tierra compacta, jadeos en recinto cerrado",
          shot1: "Archival architectural engraving of Saint Peter's Basilica in Antioch lit by flickering torchlight.",
          shot2: "Torn drawing of men digging a deep rectangular trench into the stone nave floor.",
          shot3: "Silhouette of Peter Bartholomew descending into the excavated pit with bare torso.",
          shot4: "Macro view of soil and ancient mortar rubble being hauled up in woven baskets.",
          shot5: "Title fragment stamps: 'LA FOSA SAGRADA'. Percussive drum strike."
        },
        {
          sceneTitle: "El Hierro Ennegrecido: La Santa Lanza",
          voiceover: "Tras horas de búsqueda estéril, Bartolomé se arrojó al pozo y extrajo un trozo de hierro ennegrecido: la lanza que atravesó a Cristo.",
          sound: "Grito de júbilo ahogado en la cripta, metal antiguo vibrando con resonancia hueca",
          shot1: "Extreme macro close-up of a rusted, archaic iron spearhead emerging from dark excavated earth.",
          shot2: "Torn manuscript illustration of Raymond of Aguilers weeping and kissing the relic.",
          shot3: "Shaft of golden light illuminating the corroded point amidst dark smoky church interior.",
          shot4: "Latin chronicle inscription describing the sudden transformation of morale across the camp.",
          shot5: "Bone-white paper strip stamps: 'LA SANTA LANZA'. Sharp cut to black."
        },
        {
          sceneTitle: "La Explosión de Fervor y la Supresión del Miedo",
          voiceover: "La noticia corrió por las calles como un relámpago: hombres que horas antes esperaban la muerte exigían salir a presentar batalla.",
          sound: "Cántico coral eclesiástico masivo resonando en la catedral, espadas desenvainadas al unísono",
          shot1: "Engraving of thousands of crusaders kneeling in prayer and lifting weapons to the sky.",
          shot2: "Torn chronicle page recounting how the fear of death was completely erased by religious fervor.",
          shot3: "Silhouette of priests anointing rusted swords with holy water amidst burning incense.",
          shot4: "Close-up of tears streaming down grim, scarred Norman faces.",
          shot5: "Graphic stamp over parchment: 'FE EN EL ABISMO'. Heavy drum hit."
        },
        {
          sceneTitle: "El Plan Táctico de Bohemundo: La Carga en Doce Columnas",
          voiceover: "Bohemundo organizó a los supervivientes en doce columnas compactas: romperían el cerco a pie, pues casi no quedaban caballos.",
          sound: "Voz firme de mando trazando directrices, tiza raspando plano de batalla en pizarra",
          shot1: "Tactical battle plan diagram illustrating the twelve infantry columns deploying across the Bridge Gate.",
          shot2: "Torn military sketch of Bohemond forming heavy shield walls to repel mounted horse archers.",
          shot3: "Silhouette of archers and crossbowmen placed between front-line spearmen.",
          shot4: "Wax seal of the Principality of Antioch stamped firmly at bottom of the map.",
          shot5: "Bone-white paper strip stamps: 'DOCE COLUMNAS'. Snappy cut."
        },
        {
          sceneTitle: "La Última Noche de Vigilia y Comunión",
          voiceover: "La noche del 27 de junio de 1098, todo el ejército comulgó y perdonó sus deudas; al amanecer, vencerían o serían aniquilados.",
          sound: "Murmullo solemne de confesión general en latín, hostia consagrada partida en dos, silencio absoluto",
          shot1: "Engraving of thousands of warriors receiving the Eucharist under starlight outside church doors.",
          shot2: "Monochrome sketch of knights embracing each other in farewell before the morning clash.",
          shot3: "Torn chronicle excerpt: 'Each man prepared his soul, knowing tomorrow would decide all...'.",
          shot4: "Candles flickering on stone altars slowly burning down to the socket.",
          shot5: "Title fragment stamps: 'LA VÍSPERA DEL JUICIO'. Deep percussive cut to black."
        }
      ]
    },
    {
      title: "Acto 8: La Salida Desesperada y el Veredicto de la Historia",
      historicalContext: "28 de Junio de 1098: La batalla final contra Kerbogha y el legado forense del asedio.",
      clips: [
        {
          sceneTitle: "La Apertura de la Puerta del Puente (28 de Junio)",
          voiceover: "Al amanecer del 28 de junio de 1098, las pesadas puertas del puente se abrieron y las doce columnas marcharon hacia la llanura.",
          sound: "Puertas colosales de roble abriéndose con estruendo, pasos rítmicos de miles de botas en tierra seca",
          shot1: "Archival engraving of Bridge Gate of Antioch swinging wide open under pale dawn sky.",
          shot2: "Torn panorama sketch of crusader infantry advancing across the stone bridge in tight formation.",
          shot3: "Silhouette of Raymond of Aguilers riding in the front rank holding the Holy Lance upright.",
          shot4: "Crimson highlight line tracking the steady advance of the forward echelon.",
          shot5: "Bone-white paper strip stamps: '28 DE JUNIO 1098'. Percussive drum roll."
        },
        {
          sceneTitle: "La Lluvia de Flechas Selyúcidas",
          voiceover: "Los arqueros a caballo de Kerbogha oscurecieron el cielo con miles de flechas, pero el muro de escudos francos resistió sin vacilar.",
          sound: "Zumbido ensordecedor de miles de flechas clavándose en madera y hierro: TUC, TUC, TUC",
          shot1: "Violent graphic animation of dense black arrow storm plunging into tight interlocking shield wall.",
          shot2: "Engraving of Turkish light cavalry wheeling and firing backwards in Parthian shot maneuver.",
          shot3: "Monochrome sketch of crusaders stepping over fallen comrades, closing the ranks immediately.",
          shot4: "Close-up of bodkin point penetrating outer shield layer without piercing body armor.",
          shot5: "Title fragment stamps: 'EL MURO DE ESCUDOS'. Sharp drum impact."
        },
        {
          sceneTitle: "El Pánico en el Campamento de Kerbogha",
          voiceover: "Al ver avanzar a un ejército de espectros hambrientos que cantaban y no se detenían, el pánico cundió entre los emires de Kerbogha.",
          sound: "Gritos de confusión en campamento turco, órdenes contradictorias, toque desordenado de cuernos",
          shot1: "Engraving of Turkish emirs arguing and deserting their positions on the flanks.",
          shot2: "Torn manuscript detail describing the psychological terror caused by the relentless crusader advance.",
          shot3: "Silhouette of Kerbogha's tent pavilions falling as baggage handlers flee in disarray.",
          shot4: "Monochrome sketch of thousands of mounted warriors breaking formation in retreat.",
          shot5: "Bone-white paper strip stamps: 'LA DESBANDADA'. Heavy drum hit."
        },
        {
          sceneTitle: "El Colapso de las Líneas de Mosul",
          voiceover: "En menos de dos horas, el gigantesco ejército de socorro se desmoronó; los cruzados capturaron todo el campamento y sus víveres.",
          sound: "Carga final atronadora, choque masivo de infantería, gritos de victoria en latín",
          shot1: "Dynamic engraving of crusaders overrunning Kerbogha's luxury tents filled with silk and grain.",
          shot2: "Torn chronicle page from Gesta Francorum recording the capture of immense gold and food supplies.",
          shot3: "Monochrome drawing of starving soldiers finally eating fresh bread and dates amidst the plunder.",
          shot4: "Crimson wax seal stamped over the field dispatch announcing the impossible victory.",
          shot5: "Title stamp: 'EL MILAGRO DE ANTIOQUÍA'. Percussive cut."
        },
        {
          sceneTitle: "La Toma del Campamento y el Banquete de los Espectros",
          voiceover: "Hombres que días atrás comían cardos y suelas de cuero devoraron sacos de trigo, dátiles y carne asada en tiendas de seda.",
          sound: "Vítores desaforados, risas desquiciadas, platos de bronce y jarras de vino chocando",
          shot1: "Engraving of famished crusaders gorging themselves on captured provisions inside Ottoman tents.",
          shot2: "Torn manuscript detail recounting how several starving soldiers died instantly from gorging their shrunken stomachs.",
          shot3: "Monochrome sketch of piles of gold bezants and jeweled scimitars heaped on Persian carpets.",
          shot4: "Close-up of a scarred hand grasping fresh flatbread with trembling reverence.",
          shot5: "Bone-white paper strip stamps: 'EL BOTÍN DE SEDA'. Sharp cut."
        },
        {
          sceneTitle: "El Asombro y la Furia del Mundo Islámico",
          voiceover: "La caída de Kerbogha conmocionó a Damasco y Bagdad: nadie creía que un puñado de infantes harapientos pudiera quebrar a setenta mil jinetes.",
          sound: "Murmullo de consternación en mezquitas, galope urgente de jinetes mensajeros",
          shot1: "Archival Arabic manuscript illumination depicting shock in the court of the Caliph of Baghdad.",
          shot2: "Torn map showing fast courier routes spreading the news across Aleppo, Damascus, and Cairo.",
          shot3: "Silhouette of couriers dismounting in panic outside citadel gateways.",
          shot4: "Graphic red tactical arrows showing crusader corridor cemented between Syria and the Mediterranean.",
          shot5: "Title fragment stamps: 'EL SISMA ORIENTAL'. Percussive cut to black."
        }
      ]
    },
    {
      title: "Acto 9: La Ordalía del Fuego, El Camino a Jerusalén & El Veredicto Final",
      historicalContext: "Julio 1098 - 1099: La controversia de la Santa Lanza, la muerte del vidente y la verdad forense de Antioquía.",
      clips: [
        {
          sceneTitle: "La Disputa por el Trono de Antioquía",
          voiceover: "La victoria desató la codicia: Bohemundo y Raimundo rompieron su juramento disputándose cada torre al borde de una guerra civil.",
          sound: "Entrechoque de espadas entre aliados, gritos de discusión en lengua de oc y dialecto normando",
          shot1: "Archival engraving of Bohemond and Raymond of Toulouse glaring at each other across council table.",
          shot2: "Torn treaty parchment with split wax seals showing broken pledges made to the Byzantine Emperor Alexios.",
          shot3: "Silhouette of Norman and Provençal guards facing off with spears lowered at citadel crossroads.",
          shot4: "Close-up of dagger half-drawn from jeweled scabbard in tense council hall.",
          shot5: "Bone-white paper strip stamps: 'LA CODICIA DE LOS VENCEDORES'. Percussive drum roll."
        },
        {
          sceneTitle: "El Juicio de Dios de Pedro Bartolomé",
          voiceover: "Acusado de inventar la Santa Lanza para manipular a la tropa, Pedro Bartolomé exigió someterse a la ordalía del fuego.",
          sound: "Fuego colosal rugiendo, leña seca crepitando con estruendo, murmullo expectante de miles de soldados",
          shot1: "Historic engraving of two parallel four-foot walls of dry olive wood engulfed in raging flames.",
          shot2: "Torn chronicle page from Ralph of Caen expressing bitter skepticism regarding the relic.",
          shot3: "Silhouette of Peter Bartholomew standing bare-chested in linen tunic clutching the iron spearhead.",
          shot4: "Macro view of glowing red embers and heat waves warping the background screen.",
          shot5: "Title fragment stamps: 'LA ORDALÍA DEL FUEGO'. Sharp drum strike."
        },
        {
          sceneTitle: "La Marcha Entre las Brasas Ardientes",
          voiceover: "El campesino cruzó descalzo una zanja de fuego de doce metros; emergió con el cuerpo carbonizado y agonizó durante doce días.",
          sound: "Grito desgarrador entre el fuego, humo sofocante, campana doblando a muerte en la distancia",
          shot1: "Violent graphic slide of figure enveloped in towering vortex of yellow and crimson flames.",
          shot2: "Torn eyewitness account from Raymond of Aguilers recounting how the crowd mobbed the burned prophet.",
          shot3: "Engraving of physicians applying cooling unguents to blackened blistered skin in dark tent.",
          shot4: "Monochrome sketch of the corroded spearhead falling from limp hands onto bloodstained canvas.",
          shot5: "Bone-white paper strip stamps: 'DOCE DÍAS DE AGONÍA'. Heavy percussive drop."
        },
        {
          sceneTitle: "El Motín de los Soldados y la Marcha a Jerusalén",
          voiceover: "Hartos de las disputas de los barones, los soldados rasos amenazaron con quemar Antioquía si no marchaban de inmediato al sur.",
          sound: "Golpes de piquetas sobre sillares de piedra, gritos de rebelión en latín: ¡A JERUSALÉN!",
          shot1: "Archival drawing of common soldiers tearing down palace fortifications in protest against their commanders.",
          shot2: "Torn manuscript documenting the bottom-up revolution that forced the nobility to resume the crusade.",
          shot3: "Panoramic engraving of thousands of foot soldiers forming column along the southern coastal road.",
          shot4: "Dust clouds rising beneath marching boots towards the horizon of Lebanon and Judea.",
          shot5: "Title fragment stamps: 'EL MOTÍN DE LOS POBRES'. Rhythmic drum hit."
        },
        {
          sceneTitle: "El Análisis Forense de los Huesos de Ma'arra",
          voiceover: "Nueve siglos después, los bioarqueólogos confirmaron en Siria la atrocidad silenciada: huesos humanos hervidos y marcas de cuchillo.",
          sound: "Disparo sordo de cámara fotográfica forense, instrumental de laboratorio sobre hueso antiguo",
          shot1: "High-resolution forensic archaeological photograph of mass grave excavation outside Antioch walls.",
          shot2: "Anatomical bone density scan chart showing acute nutritional stress lines (Harris lines) and blade cuts.",
          shot3: "Scientific bioarchaeology report confirming extreme famine survival trauma validated in skeletal remains.",
          shot4: "Comparison between medieval chronicle casualty figures and excavated skeletal demographic data.",
          shot5: "Bone-white paper strip stamps: 'EL REGISTRO FORENSE'. Sharp rhythmic transition."
        },
        {
          sceneTitle: "El Veredicto Final: El Silencio de los Altares",
          voiceover: "Antioquía demostró que los reinos no nacen en los altares de santidad, sino en el límite más oscuro de la resistencia humana.",
          sound: "Viento solemne sobre ruinas de Antioquía, campana eclesiástica grave, percusión final",
          shot1: "Monumental composition over black background. Dark stone ramparts of Antioch centered in frame.",
          shot2: "Torn bone-white archival paper strip stamps across the center: 'EL PRECIO DE LA SUPERVIVENCIA'.",
          shot3: "Crimson wax seal stamps: 'INVESTIGACIÓN HISTÓRICA'.",
          shot4: "Camera slowly pulls back into deep black space as last torch ember smokes and extinguishes.",
          shot5: "Single deep percussive drum heartbeat. Hard cut to pure black."
        }
      ]
    },
    {
      title: "Acto 10: La Memoria Arqueológica de Ma'arra & El Veredicto de la Historia",
      historicalContext: "La excavación de las fosas comunes del siglo XI y el veredicto definitivo de la Primera Cruzada.",
      clips: [
        {
          sceneTitle: "Las Excavaciones en los Valles de Siria",
          voiceover: "Siglos después, los estratos del norte de Siria confirmaron la evidencia: cenizas de asedio, puntas de flecha y herramientas rotas.",
          sound: "Pinceles arqueológicos sobre tierra seca, viento entre los olivares, silencio de excavación",
          shot1: "High-resolution forensic macro of excavated eleventh-century crusade strata in northern Syria.",
          shot2: "Torn excavation trench map with GPS coordinates marking medieval siege ditch perimeter.",
          shot3: "Monochrome sketch of archaeological strata showing burned destruction layers.",
          shot4: "Crimson highlight marker isolating blade cuts on excavated livestock and equine bones.",
          shot5: "Bone-white paper strip stamps: 'ESTRATO ARQUEOLÓGICO'. Percussive drum roll."
        },
        {
          sceneTitle: "El Silencio de las Crónicas Eclesiásticas",
          voiceover: "Los copistas de Roma intentaron tachar los pasajes más brutales de los códices latinos para proteger el mito de la cruzada.",
          sound: "Raspar de pluma sobre vitela antigua, murmullo en scriptorium monástico",
          shot1: "Macro view of medieval chronicle folio with black ink lines crossing out uncomfortable sentences.",
          shot2: "Torn manuscript page from Albert of Aachen retaining the original unfiltered testimony.",
          shot3: "Silhouette of monk copying manuscript under lone candle illumination.",
          shot4: "Crimson highlight box framing the uncensored Latin phrases describing the famine.",
          shot5: "Title fragment stamps: 'LA CENSURA MEDIEVAL'. Sharp drum hit."
        },
        {
          sceneTitle: "Las Murallas de Antioquía Frente al Tiempo",
          voiceover: "Aún hoy, los doce kilómetros de muralla recortados contra el monte Silpio permanecen como un mudo testigo de piedra.",
          sound: "Viento solemne silbando a través de las almenas bizantinas en ruinas",
          shot1: "Atmospheric panoramic drone-style illustration of Antioch stone walls climbing steep rocky ridge.",
          shot2: "Torn historical nineteenth-century engraving comparing ancient towers with modern ruins.",
          shot3: "Close-up of weathered limestone blocks bearing stone mason marks from Justinian's era.",
          shot4: "Pulsing grain texture over deep shadow cast by the ruined parapets.",
          shot5: "Bone-white paper strip stamps: 'MURO ETERNO'. Snappy transition."
        },
        {
          sceneTitle: "El Camino Inexorable Hacia Jerusalén",
          voiceover: "Agotados y diezmados, los supervivientes de Antioquía reanudaron la marcha sabiendo que no habría retorno a Europa.",
          sound: "Pasos pesados de botas de cuero sobre calzadas romanas de Levante, entrechoque de cotas de malla",
          shot1: "Engraving of battle-worn knights and pilgrims trekking south towards the hills of Judea.",
          shot2: "Torn archaic regional map with crimson arrow pointing irrevocably toward Jerusalem.",
          shot3: "Silhouette of solitary banner bearer walking against sunset horizon.",
          shot4: "Macro view of dented iron sword pommel strapped to worn leather scabbard.",
          shot5: "Graphic stamp over dark paper: 'MARCHA HACIA EL DESTINO'. Heavy percussive drop."
        },
        {
          sceneTitle: "La Victoria de la Voluntad sobre el Abismo",
          voiceover: "La caída de Antioquía probó que los hombres desesperados son capaces de desafiar las leyes de la física y de la moral.",
          sound: "Viento solemne desvaneciéndose en el valle del Orontes, acorde profundo de cuerda antigua",
          shot1: "Majestic composition over deep black background: iron Norman battle helmet centered in dark spotlight.",
          shot2: "Torn archival manuscript excerpt from the Gesta Francorum describing the psychological turning point.",
          shot3: "Camera slowly tracks in on the iron nasal guard scarred with ancient sword notches.",
          shot4: "Crimson ink bleeding outward across antique map of northern Syria.",
          shot5: "Title fragment stamps firmly across center: 'EL LÍMITE HUMANO'. Deep drum slam."
        },
        {
          sceneTitle: "El Veredicto Final: El Precio de la Gloria",
          voiceover: "En las guerras de la fe, la santidad fue un velo; la verdadera corona se forjó en el abismo más implacable de la supervivencia.",
          sound: "Tambor ritual final rotundo, campana lejana solemne, corte seco a silencio absoluto",
          shot1: "Monumental final visual composition: dark textured background with ancient cross and crescent symbols.",
          shot2: "Torn bone-white archival paper strip stamps across the center: 'INVESTIGACIÓN HISTÓRICA'.",
          shot3: "Archival chronicle seal stamps firmly on the frame.",
          shot4: "The image slowly recedes into pure black as the last torch goes cold.",
          shot5: "Single sharp resonant bass drum strike. Snappy hard cut to black."
        }
      ]
    }
  ];

  return compileDocumentary(
    "EL ASEDIO DE ANTIOQUÍA: LA CARNE PROHIBIDA Y EL SILENCIO CRUZADO",
    "El asedio de Antioquía: Comida prohibida y supervivencia extrema",
    "En octubre de 1097, los cruzados quedaron atrapados frente a las murallas colosales de Antioquía. El invierno sirio pudrió los suministros y mató a los caballos. Los guerreros terminaron hirviendo correas de cuero y cardos amargos. En el clímax de la hambruna, los Tafures quebraron el tabú más oscuro comiendo carne enemiga en Ma'arra. La traición de la Torre de las Dos Hermanas y el delirio místico de la Santa Lanza transformaron a un ejército de espectros en conquistadores despiadados. Una crónica brutal de supervivencia que la historia oficial intentó borrar de los altares.",
    [
      { label: "🗡️ La Caída de Ma'arra: El Tabú Roto", topic: "El canibalismo desesperado en el sitio de Ma'arra durante la Primera Cruzada" },
      { label: "🏰 La Torre de las Dos Hermanas", topic: "La conspiración y traición de Firuz que abrió las puertas de Antioquía" },
      { label: "🔥 La Prueba del Fuego de Pedro Bartolomé", topic: "El juicio de Dios y la ordalía con brasas que destruyó al descubridor de la Santa Lanza" },
      { label: "🛡️ Los Tafures: El Ejército de Mendigos", topic: "El salvaje escuadrón de desheredados que aterrorizó a los selyúcidas" },
      { label: "💀 El Hambre en los Asedios Medievales", topic: "Las dietas de supervivencia extrema en las guerras santas del siglo XI" }
    ],
    acts
  );
}

// -------------------------------------------------------------
// 2. ARMADURAS TEUTÓNICAS EN EL LAGO PEIPUS (1242) - 48 CLIPS ÚNICOS
// -------------------------------------------------------------
export function buildTeutonicLakePeipusDocumentary(): FlowDocumentary {
  const acts: RawActDef[] = [
    {
      title: "Acto 1: La Cruzada del Báltico y la Orden de Livonia",
      historicalContext: "Primavera de 1242: Los caballeros teutónicos avanzan con cotas de malla y corceles acorazados hacia Nóvgorod.",
      clips: [
        {
          sceneTitle: "La Cruz Negra en la Nieve Báltica",
          voiceover: "En abril de 1242, la Orden Teutónica desplegó su vanguardia de hierro con la misión papal de someter a la República de Nóvgorod.",
          sound: "Viento polar sordo sobre taiga congelada, entrechoque de armaduras de placas",
          shot1: "Archival engraving of towering Teutonic knights bearing black crosses over white surcoats sliding in from left.",
          shot2: "Medieval Baltic regional map with crimson borders marking Novgorod and Livonian territories.",
          shot3: "Torn manuscript folio from the Livonian Rhymed Chronicle detailing the crusade proclamation.",
          shot4: "Macro view of heavy iron great helm with narrow vision slit.",
          shot5: "Bone-white paper strip stamps: 'PEIPUS 1242'. Percussive cut to black."
        },
        {
          sceneTitle: "El Cuña de Hierro: La Táctica del Schweinkopf",
          voiceover: "Formaban en la temida punta de lanza triangular llamada cabeza de cerdo: una masa acorazada diseñada para partir en dos cualquier línea.",
          sound: "Trote acompasado de corceles pesados, tintineo rítmico de estribos y lanzas",
          shot1: "Tactical tactical diagram of the Schweinkopf triangular wedge formation sliding into center frame.",
          shot2: "Torn engraving of front-line knight bannerets interlocking shields and lances.",
          shot3: "Monochrome sketch of dense cavalry mass advancing across barren snowy plain.",
          shot4: "Crimson directional vectors demonstrating the kinetic impact of the wedge apex.",
          shot5: "Title fragment stamps: 'CABEZA DE CERDO'. Sharp drum strike."
        },
        {
          sceneTitle: "El Peso del Caballero: Treinta y Cinco Kilos de Metal",
          voiceover: "Cota de malla doble, sobrevesta, yelmo de cubo y barda de caballo: cada jinete teutónico pesaba más de media tonelada con su montura.",
          sound: "Crujido de cuero bajo tensión, respiración trabajosa de caballo de tiro pesado",
          shot1: "Anatomical breakdown diagram of 13th-century knight armor weighing 35 kilograms.",
          shot2: "Technical illustration of iron barding covering the warhorse's chest and flanks.",
          shot3: "Torn archival ledger calculating total kinetic tonnage of three hundred charging knights.",
          shot4: "Close-up of massive iron stirrup and rowel spur caked in frozen mud.",
          shot5: "Graphic stamp over dark paper texture: 'MEDIA TONELADA'. Hard cut."
        },
        {
          sceneTitle: "El Deshielo Prematuro de la Primavera Báltica",
          voiceover: "A comienzos de abril, las temperaturas subieron repentinamente; la superficie del lago Peipus comenzó a reblandecerse por debajo.",
          sound: "Goteo continuo de agua de deshielo, siseo de nieve húmeda derritiéndose",
          shot1: "Topographic map overlay of Lake Peipus (Chudskoye) showing thermal current variations.",
          shot2: "Engraving of thin treacherous crust covering dark subaquatic deep channels.",
          shot3: "Torn chronicle detail describing early thawing known as the spring raspútitsa.",
          shot4: "Monochrome sketch of dark slush water seeping into wagon wheel ruts.",
          shot5: "Bone-white paper strip stamps: 'HIELO TRAIDOR'. Snappy cut to black."
        },
        {
          sceneTitle: "Los Exploradores de Alexander Nevsky",
          voiceover: "El joven príncipe Alexander Nevsky envió exploradores a medir con pértigas el grosor de las placas heladas frente a la roca Cuervo.",
          sound: "Pértiga de madera golpeando hielo hueco, susurros en eslavo antiguo sobre la bruma",
          shot1: "Engraving of Russian light scouts kneeling on lake ice with sounding rods.",
          shot2: "Torn sketch of the landmark Raven Rock (Vorony Kamen) rising above the snowy shore.",
          shot3: "Cross-section chart comparing 20cm surface ice strength against varying load weights.",
          shot4: "Silhouette of Alexander Nevsky studying lake sounding reports inside wooden command tent.",
          shot5: "Title fragment stamps: 'LA ROCA CUERVO'. Percussive drum hit."
        },
        {
          sceneTitle: "La Trampa Táctica de Nóvgorod",
          voiceover: "Nevsky sabía que el hielo soportaba infantería ligera descalza, pero colapsaría si atraía la carga teutónica hacia las aguas profundas.",
          sound: "Viento silbando monótono sobre carrizales nevados, tambor distante",
          shot1: "Tactical map showing Russian infantry deployment backed against the rocky shoreline.",
          shot2: "Archival portrait engraving of Prince Alexander Nevsky in mail coif and nasal helmet.",
          shot3: "Torn chronicle excerpt from the Novgorod First Chronicle outlining the strategic trap.",
          shot4: "Crimson highlight indicator over the thermal deep-water zone of the lake.",
          shot5: "Graphic stamp over parchment: 'LA EMBOSCADA LÍQUIDA'. Sudden cut to black."
        }
      ]
    },
    {
      title: "Acto 2: El Choque Inicial y la Resistencia de las Picas",
      historicalContext: "5 de Abril de 1242: La cuña teutónica arremete contra las líneas de arqueros y piqueros rusos.",
      clips: [
        {
          sceneTitle: "La Señal del Cuerno Teutónico",
          voiceover: "Al amanecer del 5 de abril, el cuerno de guerra de la Orden de Livonia bramó sobre la superficie blanca y desolada.",
          sound: "Bramido profundo de gran cuerno de guerra metálico con eco prolongado sobre el hielo",
          shot1: "Engraving of Teutonic herald blowing long bronze horn with white banner unfurled.",
          shot2: "Torn panorama sketch of Lake Peipus shrouded in cold blue morning mist.",
          shot3: "Silhouette of hundreds of armored horsemen lowering lances in unison.",
          shot4: "Macro view of ash-wood lance tip glinting with cold frost crystals.",
          shot5: "Bone-white paper strip stamps: 'EL ALBA BLANCA'. Percussive cut."
        },
        {
          sceneTitle: "El Galope de Cincuenta Mil Kilos de Hierro",
          voiceover: "Los corceles pesados rompieron al galope: las vibraciones rítmicas hicieron temblar las profundidades oscuras del lago.",
          sound: "Estruendo sordo de cascos herrados golpeando hielo a toda velocidad: TUM-TUM-TUM",
          shot1: "Violent graphic slide of charging heavy cavalry seen from low camera angle.",
          shot2: "Torn sketch of ice surface vibrating with concentric acoustic shockwaves.",
          shot3: "Monochrome engraving of armored horses kicking up plumes of frozen spray.",
          shot4: "Macro close-up of iron horse shoe studded with winter ice-calks.",
          shot5: "Title fragment stamps: 'VIBRACIÓN SÍSMICA'. Sharp drum strike."
        },
        {
          sceneTitle: "La Lluvia de Flechas de Nóvgorod",
          voiceover: "Miles de arqueros de Nóvgorod dispararon proyectiles con puntas de cincel para perforar la malla de los caballos.",
          sound: "Silbido masivo de flechas oscureciendo el cielo, chasquido de puntas contra corazas",
          shot1: "Archival engraving of Russian archers loosing black-fletched arrows in high parabolic arc.",
          shot2: "Torn tactical sketch showing arrow saturation zone in front of the Russian battle line.",
          shot3: "Silhouette of charging warhorses rearing as arrows pierce unprotected necks.",
          shot4: "Close-up of medieval bodkin arrowhead lodged between iron mail rings.",
          shot5: "Graphic stamp over dark paper: 'FLECHAS DE CINCEL'. Heavy drum hit."
        },
        {
          sceneTitle: "El Impacto contra el Muro de Picas",
          voiceover: "La cuña teutónica perforó la primera línea de arqueros, pero quedó clavada en un denso erizo de picas de fresno de tres metros.",
          sound: "Estruendo brutal de madera quebrando contra corazas de hierro: CRASH, gritos de combate",
          shot1: "Engraving of teutonic knights crashing into dense hedgehog of Russian infantry spears.",
          shot2: "Torn manuscript detail describing the momentum of the charge stalling against the pikes.",
          shot3: "Monochrome sketch of spearmen bracing spear butts against boulders on the shore.",
          shot4: "Crimson splatters sliding across sepia paper texture as the front ranks collide.",
          shot5: "Bone-white paper strip stamps: 'EL ERIZO DE FRESNO'. Hard cut to black."
        },
        {
          sceneTitle: "El Combate Ciego Cuerpo a Cuerpo",
          voiceover: "Incapaces de maniobrar sobre el terreno resbaladizo, los caballeros luchaban con espadas pesadas contra hachas de dos manos.",
          sound: "Hierro chocando violentamente contra hierro, jadeos sordos dentro de yelmos cerrados",
          shot1: "High-contrast drawing of vicious hand-to-hand melee between knight and Russian druzhina.",
          shot2: "Torn engraving of broad axes cleaving through iron shoulder pauldrons.",
          shot3: "Detail of a sword blade shattering against a bronze-reinforced shield boss.",
          shot4: "Silhouette of warriors slipping and grappling in blood-stained slush.",
          shot5: "Title fragment stamps: 'BATALLA EN EL FANGO'. Percussive cut."
        },
        {
          sceneTitle: "El Apiñamiento Fatal en el Centro del Lago",
          voiceover: "La presión de los flancos rusos empujó a la caballería teutónica hacia el centro del lago, donde el hielo era más delgado.",
          sound: "Ruido sordo de compresión de masa humana y equina, relinchos desesperados",
          shot1: "Tactical map showing Russian pincers encircling the teutonic wedge and forcing it outward.",
          shot2: "Engraving of cavalry tightly packed shoulder-to-shoulder with nowhere to turn.",
          shot3: "Torn chronicle quote: 'They were compressed like grain in a millstone...'.",
          shot4: "Crimson pressure arrows concentrating hundreds of tons onto a single ice sheet.",
          shot5: "Graphic stamp over parchment: 'EL ENCIERRO'. Heavy drum impact."
        }
      ]
    },
    {
      title: "Acto 3: La Señal del Cuerno Teutónico & El Galope Sísmico sobre el Hielo",
      historicalContext: "Alba del 5 de abril de 1242: La caballería pesada de Livonia rompe al galope sobre la superficie congelada.",
      clips: [
        {
          sceneTitle: "La Señal del Cuerno Teutónico",
          voiceover: "Al amanecer del 5 de abril, el cuerno de guerra de la Orden de Livonia bramó sobre la superficie blanca y desolada.",
          sound: "Bramido profundo de gran cuerno de guerra metálico con eco prolongado sobre el hielo",
          shot1: "Engraving of Teutonic herald blowing long bronze horn with white banner unfurled.",
          shot2: "Torn panorama sketch of Lake Peipus shrouded in cold blue morning mist.",
          shot3: "Silhouette of hundreds of armored horsemen lowering lances in unison.",
          shot4: "Macro view of ash-wood lance tip glinting with cold frost crystals.",
          shot5: "Bone-white paper strip stamps: 'EL ALBA BLANCA'. Percussive cut."
        },
        {
          sceneTitle: "El Galope de Cincuenta Mil Kilos de Hierro",
          voiceover: "Los corceles pesados rompieron al galope: las vibraciones rítmicas hicieron temblar las profundidades oscuras del lago.",
          sound: "Estruendo sordo de cascos herrados golpeando hielo a toda velocidad: TUM-TUM-TUM",
          shot1: "Violent graphic slide of charging heavy cavalry seen from low camera angle.",
          shot2: "Torn sketch of ice surface vibrating with concentric acoustic shockwaves.",
          shot3: "Monochrome engraving of armored horses kicking up plumes of frozen spray.",
          shot4: "Macro close-up of iron horse shoe studded with winter ice-calks.",
          shot5: "Title fragment stamps: 'VIBRACIÓN SÍSMICA'. Sharp drum strike."
        },
        {
          sceneTitle: "El Vaho Helado de las Monturas",
          voiceover: "Doscientos caballos exhalaron densas nubes de vapor en el aire gélido, cegando a los jinetes de la segunda línea de ataque.",
          sound: "Resoplidos agitados de corceles a galope, tintineo acelerado de bocados y frenos",
          shot1: "Extreme macro of steaming horse nostrils flared in high exertion over frosted ground.",
          shot2: "Torn chronicle detail describing the dense condensation cloud formed by the charging cavalry.",
          shot3: "Silhouette of knights leaning forward in high-backed wooden saddles.",
          shot4: "Close-up of leather reins stiffened by morning frost.",
          shot5: "Bone-white paper strip stamps: 'NIEBLA DE ACERO'. Snappy cut."
        },
        {
          sceneTitle: "El Reflejo de las Cruces Negras en el Hielo",
          voiceover: "Bajo los cascos, la superficie pulida por el viento invernal devolvía el reflejo nítido de las cruces negras de Livonia.",
          sound: "Deslizamiento sibilante de cuchillas y herrajes sobre hielo cristalino",
          shot1: "High-contrast dynamic reflection shot showing knights riding over mirror-like black ice.",
          shot2: "Archival heraldic engraving of the Sword Brothers insignia and the black cross of Jerusalem.",
          shot3: "Torn sketch of wind blowing snow crystals across the glossy frozen plain.",
          shot4: "Crimson vector tracking cavalry acceleration across the open kilometer.",
          shot5: "Graphic stamp over parchment: 'REFLEJO DE GUERRA'. Heavy drum hit."
        },
        {
          sceneTitle: "La Reducción del Espacio de Frenado",
          voiceover: "Al superar los treinta kilómetros por hora, la masa montada perdió toda capacidad de detenerse o rectificar el rumbo.",
          sound: "Crujido de hielo raspado por herraduras intentando afianzarse sin fricción",
          shot1: "Technical physics diagram showing kinetic inertia of half a ton moving at speed on low-friction ice.",
          shot2: "Torn manuscript warning on the extreme hazard of cavalry charges over frozen lakes.",
          shot3: "Monochrome engraving of lead horse stumbling and regaining balance by inches.",
          shot4: "Silhouette of the front line locking lances into horizontal attack position.",
          shot5: "Title fragment stamps: 'SIN RETORNO'. Sharp percussion strike."
        },
        {
          sceneTitle: "El Grito de Guerra de la Orden",
          voiceover: "El clamor en latín de los caballeros resonó en las orillas de roca, anunciando la embestida contra las líneas de Nóvgorod.",
          sound: "Cántico marcial gutural en latín de cientos de caballeros, entrechoque de escudos",
          shot1: "Engraving of knights shouting through open great helms with raised broadswords.",
          shot2: "Torn battle dispatch recording the war cry echoing off Vorony Kamen cliff.",
          shot3: "Dynamic tracking slide following the lance points as they level at chest height.",
          shot4: "Crimson flag whipping in the freezing wind.",
          shot5: "Bone-white paper strip stamps: 'EL CLAMOR DE LIVONIA'. Hard cut to black."
        }
      ]
    },
    {
      title: "Acto 4: La Lluvia de Flechas de Nóvgorod & El Muro de Picas de Fresno",
      historicalContext: "La vanguardia rusa aguarda a pie firme: Arqueros y piqueros absorben la carga de hierro.",
      clips: [
        {
          sceneTitle: "La Lluvia de Flechas de Nóvgorod",
          voiceover: "Miles de arqueros de Nóvgorod dispararon proyectiles con puntas de cincel para perforar la malla de los caballos.",
          sound: "Silbido masivo de flechas oscureciendo el cielo, chasquido de puntas contra corazas",
          shot1: "Archival engraving of Russian archers loosing black-fletched arrows in high parabolic arc.",
          shot2: "Torn tactical sketch showing arrow saturation zone in front of the Russian battle line.",
          shot3: "Silhouette of charging warhorses rearing as arrows pierce unprotected necks.",
          shot4: "Close-up of medieval bodkin arrowhead lodged between iron mail rings.",
          shot5: "Graphic stamp over dark paper: 'FLECHAS DE CINCEL'. Heavy drum hit."
        },
        {
          sceneTitle: "El Impacto contra el Muro de Picas",
          voiceover: "La cuña teutónica perforó la primera línea de arqueros, pero quedó clavada en un denso erizo de picas de fresno de tres metros.",
          sound: "Estruendo brutal de madera quebrando contra corazas de hierro: CRASH, gritos de combate",
          shot1: "Engraving of teutonic knights crashing into dense hedgehog of Russian infantry spears.",
          shot2: "Torn manuscript detail describing the momentum of the charge stalling against the pikes.",
          shot3: "Monochrome sketch of spearmen bracing spear butts against boulders on the shore.",
          shot4: "Crimson splatters sliding across sepia paper texture as the front ranks collide.",
          shot5: "Bone-white paper strip stamps: 'EL ERIZO DE FRESNO'. Hard cut to black."
        },
        {
          sceneTitle: "El Desenganche de los Jinetes",
          voiceover: "Los soldados rusos usaron ganchos de asedio y hachas danesas para descabalgar a los nobles caballeros derribándolos al hielo.",
          sound: "Garra de hierro raspando armadura, golpe sordo de cuerpo en cota de malla cayendo al suelo",
          shot1: "Archival drawing of Russian infantry hooking armor belts and dragging knights from high saddles.",
          shot2: "Torn weapon roster illustrating traditional billhooks and curved boarding axes used at Peipus.",
          shot3: "Monochrome sketch of dismounted knight struggling to stand on slick ice.",
          shot4: "Close-up of heavy broadaxe blade splintering a knightly shield.",
          shot5: "Title fragment stamps: 'DERRIBO EN EL HIELO'. Percussive cut."
        },
        {
          sceneTitle: "El Combate Ciego Cuerpo a Cuerpo",
          voiceover: "Incapaces de maniobrar sobre el terreno resbaladizo, los caballeros luchaban con espadas pesadas contra hachas de dos manos.",
          sound: "Hierro chocando violentamente contra hierro, jadeos sordos dentro de yelmos cerrados",
          shot1: "High-contrast drawing of vicious hand-to-hand melee between knight and Russian druzhina.",
          shot2: "Torn engraving of broad axes cleaving through iron shoulder pauldrons.",
          shot3: "Detail of a sword blade shattering against a bronze-reinforced shield boss.",
          shot4: "Silhouette of warriors slipping and grappling in blood-stained slush.",
          shot5: "Title fragment stamps: 'BATALLA EN EL FANGO'. Percussive cut."
        },
        {
          sceneTitle: "El Flanco de la Druzhina de Alexander",
          voiceover: "Alexander Nevsky lanzó entonces a su caballería de élite por los flancos cerrando la tenaza sobre las fuerzas germánicas.",
          sound: "Cuerno eslavo de guerra respondiendo, galope veloz por la orilla rocosa",
          shot1: "Tactical map showing the Russian princely druzhina sweeping around the teutonic flanks.",
          shot2: "Engraving of Alexander leading mounted druzhinniki with sabers and lances.",
          shot3: "Torn dispatch detailing the surprise encirclement of the Bishop of Dorpat's troops.",
          shot4: "Crimson pincer vectors snapping shut behind the teutonic wedge.",
          shot5: "Bone-white paper strip stamps: 'LA TENAZA DE NEVSKY'. Heavy drum strike."
        },
        {
          sceneTitle: "El Apiñamiento Fatal en el Centro del Lago",
          voiceover: "La presión de los flancos rusos empujó a la caballería teutónica hacia el centro del lago, donde el hielo era más delgado.",
          sound: "Ruido sordo de compresión de masa humana y equina, relinchos desesperados",
          shot1: "Tactical map showing Russian pincers encircling the teutonic wedge and forcing it outward.",
          shot2: "Engraving of cavalry tightly packed shoulder-to-shoulder with nowhere to turn.",
          shot3: "Torn chronicle quote: 'They were compressed like grain in a millstone...'.",
          shot4: "Crimson pressure arrows concentrating hundreds of tons onto a single ice sheet.",
          shot5: "Graphic stamp over parchment: 'EL ENCIERRO'. Heavy drum impact."
        }
      ]
    },
    {
      title: "Acto 5: La Fractura del Hielo: El Rugido Sísmico Bajo los Cascos",
      historicalContext: "El punto de ruptura estructural: La sobrecarga de metal supera la resistencia de la placa.",
      clips: [
        {
          sceneTitle: "El Primer Crujido Sordo",
          voiceover: "Un chasquido ensordecedor, como un trueno subterráneo, partió la superficie blanca: una fisura negra se abrió de golpe.",
          sound: "Sonido seco, profundo y aterrador de hielo gordo fracturándose: CRRAAAACKK",
          shot1: "Macro high-speed simulation of jagged black fissure tearing across pure white ice sheet.",
          shot2: "Torn aerial view illustration showing crack zig-zagging between horses' hooves.",
          shot3: "Engraving of knights looking down in sudden horror as dark water gushes over their boots.",
          shot4: "Close-up of ice plate tilting downward beneath the weight of three barded horses.",
          shot5: "Bone-white paper strip stamps: 'EL CRUJIDO FATAL'. Percussive drum roll."
        },
        {
          sceneTitle: "La Salmuera Oscura Brota a la Superficie",
          voiceover: "Bajo la presión extrema, el agua negra del lago comenzó a brotar a borbotones por las grietas, convirtiendo la nieve en un lodazal helado.",
          sound: "Gorgoteo violento de agua a presión saliendo de grietas, chasquido de placas que vibran",
          shot1: "Close-up simulation of dark lake water surging through ice fissures onto pristine white snow.",
          shot2: "Torn sketch of warhorses losing their footing in the expanding freezing slush.",
          shot3: "Monochrome engraving of soldiers trying to jump across rapidly widening water channels.",
          shot4: "Crimson highlight bar marking water depth beneath the fracturing ice zone.",
          shot5: "Graphic stamp over dark parchment: 'AGUAS NEGRAS'. Sharp percussive cut."
        },
        {
          sceneTitle: "El Pánico en las Filas de la Retaguardia",
          voiceover: "Al percibir el hundimiento, los escuderos y auxiliares daneses de la retaguardia intentaron huir pisoteándose unos a otros.",
          sound: "Gritos desesperados de huida, cascos resbalando sin control, chillidos de auxilio",
          shot1: "Dynamic panorama of panic spreading through the rear ranks of the crusader host.",
          shot2: "Torn chronicle passage from Livonia: 'Each man sought only his own escape without regard for the cross'.",
          shot3: "Silhouette of soldiers dropping shields and crossbows to run toward the western bank.",
          shot4: "Macro view of discarded cross pendant half-submerged in freezing water.",
          shot5: "Bone-white paper strip stamps: 'PÁNICO EN LA RETAGUARDIA'. Heavy drum hit."
        },
        {
          sceneTitle: "La Fractura en Red de Todo el Sector Central",
          voiceover: "Las fisuras se unieron formando una gigantesca red que aisló bloques enteros de hielo a la deriva con decenas de hombres encima.",
          sound: "Estrépito continuo de témpanos chocando entre sí en agua agitada, viento rugiente",
          shot1: "Overhead diagram showing structural spiderweb crack pattern spreading across 500 meters.",
          shot2: "Engraving of floating ice floes tilting and dumping armored soldiers into open water.",
          shot3: "Torn eyewitness quote recording the catastrophic speed of the ice failure.",
          shot4: "Monochrome sketch of horses swimming frantically in black water with heavy bards.",
          shot5: "Title fragment stamps: 'LA RED DE HIELO'. Sharp rhythmic transition."
        },
        {
          sceneTitle: "El Vuelco de las Placas Gigantes",
          voiceover: "Placas de hielo de tres toneladas volcaron en vertical bajo el peso asimétrico, catapultando a los caballeros al fondo del lago.",
          sound: "Estruendo masivo de bloques de hielo chocando en agua gélida, grito ahogado colectivo",
          shot1: "Violent graphic slide of massive ice blocks flipping vertically into dark lake depths.",
          shot2: "Torn sketch of armored horse and rider plunging headfirst into freezing dark water.",
          shot3: "Monochrome engraving of splashing foam and floating wooden shield fragments.",
          shot4: "Crimson accent lines tracing men clawing desperately at slippery ice edges.",
          shot5: "Title fragment stamps: 'EL ABISMO LÍQUIDO'. Hard cut to black."
        },
        {
          sceneTitle: "La Pérdida del Estandarte de la Orden",
          voiceover: "El estandarte principal de la Orden Teutónica cayó al agua helada, marcando el fin de la autoridad germánica en la batalla.",
          sound: "Paño mojado hundiéndose en silencio, eco apagado de tambores",
          shot1: "Underwater slow-motion illustration of silk knight banner with black cross sinking into the abyss.",
          shot2: "Torn chronicle entry mourning the capture and submersion of the grand master's insignia.",
          shot3: "Silhouette of Russian soldiers raising spears on the firm shore in triumph.",
          shot4: "Subtle dark vignette contracting around the center of the frame.",
          shot5: "Bone-white paper strip stamps: 'EL ESTANDARTE HUNDIDO'. Percussive cut."
        }
      ]
    },
    {
      title: "Acto 6: El Ancla de Metal & El Ahogamiento Silencioso en las Aguas Negras",
      historicalContext: "El costo biológico del blindaje: Cómo las armaduras de hierro impidieron cualquier intento de salvación.",
      clips: [
        {
          sceneTitle: "El Peso del Acero como Sentencia de Muerte",
          voiceover: "Los treinta y cinco kilos de metal que los hacían invencibles en tierra se convirtieron en un ancla mortal sin posibilidad de nadar.",
          sound: "Burbujas de aire subiendo a la superficie, chapoteo desesperado de manos con guanteletes de hierro",
          shot1: "Cross-section underwater drawing of armored knight sinking rapidly into pitch black depths.",
          shot2: "Technical buoyancy diagram demonstrating human body sinking at 2 meters per second in full plate.",
          shot3: "Torn manuscript detail recounting how nobles were pulled to the bottom by their own armor.",
          shot4: "Macro view of air bubbles escaping through the narrow eye slit of a sinking helm.",
          shot5: "Bone-white paper strip stamps: 'EL ANCLA DE METAL'. Sharp drum strike."
        },
        {
          sceneTitle: "Las Manos Resbalando en los Bordes Helados",
          voiceover: "Los pocos que intentaron salir descubrieron que el hielo húmedo no ofrecía agarre a los dedos enguantados en hierro.",
          sound: "Guanteletes de hierro raspando inútilmente sobre hielo liso con chirrido metálico",
          shot1: "Close-up engraving of mail-covered fingers desperately scratching smooth wet ice shelf.",
          shot2: "Silhouette of Russian soldiers with boat hooks pushing struggling knights back under.",
          shot3: "Torn chronicle page from Novgorod recording the complete impossibility of escape.",
          shot4: "Blood staining the white slush where fingertips cracked and tore.",
          shot5: "Graphic stamp over dark paper: 'SIN AGARRE'. Heavy drum hit."
        },
        {
          sceneTitle: "La Hipotermia en Menos de Sesenta Segundos",
          voiceover: "En el agua a un grado centígrado, el shock térmico paralizó los músculos antes de que pudieran desabrochar las correas del yelmo.",
          sound: "Jadeo agudo por shock térmico súbito, silencio asfixiante bajo el agua",
          shot1: "Medical forensic diagram illustrating rapid cardiac shock and peripheral muscle paralysis in sub-zero water.",
          shot2: "Torn archival study on human survival times in Baltic freezing waters.",
          shot3: "Monochrome sketch of warrior's hand relaxing limp beneath water surface.",
          shot4: "Crimson temperature gauge dropping precipitously to lethal threshold.",
          shot5: "Bone-white paper strip stamps: 'SESENTA SEGUNDOS'. Snappy transition."
        },
        {
          sceneTitle: "El Lecho de Fango Glacial",
          voiceover: "A doce metros de profundidad, una capa de limo y turba vegetal atrapó para siempre los cuerpos, preservando el hierro durante siglos.",
          sound: "Impacto amortiguado de metal pesado posándose sobre fango denso subacuático",
          shot1: "Underwater drawing of lakebed sediment engulfing swords, shields, and armored remains.",
          shot2: "Stratigraphic cross-section of Lake Peipus bottom silt showing anaerobic preservation conditions.",
          shot3: "Torn sketch of ancient vegetation covering sunken artifacts.",
          shot4: "Macro view of sword hilt resting undisturbed in gray mud.",
          shot5: "Title fragment stamps: 'EL LECHO DE LIMO'. Deep drum hit."
        },
        {
          sceneTitle: "La Pérdida de la Élite de Livonia",
          voiceover: "Veinte hermanos caballeros de rango superior y cientos de sargentos auxiliares perecieron en menos de media hora de catástrofe.",
          sound: "Campana funeraria tañendo con eco apagado, viento susurrando en la nieve",
          shot1: "Archival roster engraving listing the fallen knights of the Livonian branch of the Teutonic Order.",
          shot2: "Torn chronicle folio from Riga lamenting the irreplaceable loss of veteran commanders.",
          shot3: "Monochrome engraving of weeping monks chanting requiem in cathedral at Dorpat.",
          shot4: "Wax seals broken upon the military casualty dispatch.",
          shot5: "Bone-white paper strip stamps: 'LA ÉLITE ANULADA'. Percussive cut."
        },
        {
          sceneTitle: "El Silencio Sobre las Aguas Negras",
          voiceover: "Al caer la tarde, el lago helado quedó en completo silencio: solo flotaban mantos blancos con cruces negras sobre el agua oscura.",
          sound: "Viento polar aullando suavemente sobre el hielo desierto, silencio sepulcral",
          shot1: "Monumental composition over black background. Dark opening in the ice with floating white surcoat.",
          shot2: "Torn chronicle excerpt from the Livonian Rhymed Chronicle mourning twenty fallen Knight Brothers.",
          shot3: "Engraving of Prince Alexander Nevsky standing victorious on the snowy shore.",
          shot4: "Pale horizontal sunset gradient casting long crimson shadows across the frozen plain.",
          shot5: "Bone-white paper strip stamps: 'LA TUMBA DE HIELO'. Deep percussive cut to black."
        }
      ]
    },
    {
      title: "Acto 7: La Persecución de Siete Verstas en la Nieve & El Colapso de la Orden",
      historicalContext: "La huida desordenada hacia Dorpat: La caballería de Nóvgorod persigue a los supervivientes.",
      clips: [
        {
          sceneTitle: "La Persecución de Siete Verstas en la Nieve",
          voiceover: "Los supervivientes de la retaguardia huyeron aterrorizados; la caballería ligera rusa los persiguió durante siete verstas de masacre.",
          sound: "Galope veloz sobre nieve profunda, gritos de caza en ruso, espadazos en retirada",
          shot1: "Panoramic engraving of routed Teutonic survivors fleeing across frozen reeds toward the western shore.",
          shot2: "Torn map showing the seven-verst (8km) pursuit route marked with red skull markers.",
          shot3: "Monochrome sketch of light horsemen cutting down fleeing foot sergeants.",
          shot4: "Discarded great helms and broken swords littering the snowy trail.",
          shot5: "Title fragment stamps: 'SIETE VERSTAS'. Percussive cut."
        },
        {
          sceneTitle: "Los Prisioneros Descalzos sobre el Hielo",
          voiceover: "Cincuenta caballeros capturados fueron despojados de sus botas y conducidos a pie descalzo sobre la nieve hacia los muros de Pskov.",
          sound: "Pasos descalzos crujiendo sobre nieve endurecida, jadeos de prisioneros exhaustos",
          shot1: "Archival engraving of defeated Teutonic knights marched as captives with downcast eyes.",
          shot2: "Torn chronicle detail from Pskov describing the public entry of the prisoners.",
          shot3: "Monochrome sketch of citizens lining the fortress ramparts shouting in celebration.",
          shot4: "Close-up of frozen bare feet stained with dried blood on snow.",
          shot5: "Bone-white paper strip stamps: 'MARCHA EN PSKOV'. Heavy drum hit."
        },
        {
          sceneTitle: "El Rescate Pagado por el Obispado de Dorpat",
          voiceover: "Para recuperar a los pocos caballeros capturados, la Orden tuvo que pagar un rescate de plata y renunciar a todas sus pretensiones sobre tierras rusas.",
          sound: "Bolsas de monedas pesadas cayendo sobre mesa de roble, firma de pergamino con pluma",
          shot1: "Historic engraving of diplomatic envoys presenting tribute chests of silver coin.",
          shot2: "Torn treaty manuscript in Middle High German and Old East Slavic with dangling wax seals.",
          shot3: "Silhouette of Alexander Nevsky approving the peace terms before the boyar council.",
          shot4: "Detail of territorial concession map ceding frontier forts back to Novgorod.",
          shot5: "Title fragment stamps: 'EL RESCATE DE PLATA'. Sharp drum strike."
        },
        {
          sceneTitle: "El Voto Solemne de No Volver a Rusia",
          voiceover: "El tratado selló el juramento de la Orden: jamás volverían a cruzar con armas las fronteras de Nóvgorod ni de Pskov.",
          sound: "Juramento solemne en latín ante el altar, golpe de sello de cera caliente",
          shot1: "Engraving of Grand Master emissary placing hand upon bible to ratify the non-aggression pact.",
          shot2: "Torn chronicle excerpt: 'Let whoever comes with the sword against us, perish by the sword'.",
          shot3: "Monochrome sketch of border marker stones re-erected along the Narva river.",
          shot4: "Crimson border boundary line locking firmly in place over regional map.",
          shot5: "Bone-white paper strip stamps: 'EL PACTO DEL HIELO'. Snappy cut."
        },
        {
          sceneTitle: "El Freno Definitivo al Drang nach Osten",
          voiceover: "La Batalla del Hielo detuvo para siempre el avance de las órdenes militares germánicas hacia el este durante más de tres siglos.",
          sound: "Campanadas solemnes de catedral ortodoxa de Santa Sofía en Nóvgorod",
          shot1: "Historical geopolitical map of Eastern Europe showing the fixed border established in 1242.",
          shot2: "Torn treaty document between the Republic of Novgorod and the Bishopric of Dorpat.",
          shot3: "Engraving of Alexander Nevsky proclaimed defender of the Russian lands.",
          shot4: "Silhouette of the golden domes of Novgorod standing free from foreign dominion.",
          shot5: "Bone-white paper strip stamps: 'FRONTERA SELLADA'. Snappy cut."
        },
        {
          sceneTitle: "La Táctica Inmortal de Alexander Nevsky",
          voiceover: "Alexander comprendió el principio militar supremo: no luches contra la fuerza del enemigo; utiliza el propio peso de su armadura en su contra.",
          sound: "Viento solemne soplando sobre el monumento a Nevsky a orillas del lago Peipus",
          shot1: "Dramatic archival drawing of Alexander Nevsky looking over tactical map with strategic gaze.",
          shot2: "Torn quote from Sun Tzu and Clausewitz juxtaposed with medieval Russian warfare doctrine.",
          shot3: "Monochrome sketch of the natural topography of ice, reeds, and rock working as a single weapon.",
          shot4: "Subtle pulsing grain effect over ancient icon depicting the Prince with halo.",
          shot5: "Title fragment stamps: 'LA LECCIÓN DE HIELO'. Percussive drum roll."
        }
      ]
    },
    {
      title: "Acto 8: La Expedición Arqueológica Subacuática de 1958 & Los Hallazgos en el Lodo",
      historicalContext: "Siglo XX: La ciencia moderna explora el lecho de Peipus con magnetómetros y buzos de profundidad.",
      clips: [
        {
          sceneTitle: "La Expedición Arqueológica de la Academia Soviética",
          voiceover: "En 1958, una expedición científica de arqueología subacuática exploró el lecho del lago Peipus con magnetómetros.",
          sound: "Zumbido electrónico de sonar antiguo, respirador de buzo bajo agua turbia",
          shot1: "Archival 1958 black and white photograph of research vessel surveying Lake Peipus waters.",
          shot2: "Sonar bathymetric chart showing deep subaquatic trenches near Vorony Island.",
          shot3: "Torn scientific report from the USSR Academy of Sciences documenting metal anomalies.",
          shot4: "Monochrome diagram of divers searching thick peat sediment at 12 meters depth.",
          shot5: "Bone-white paper strip stamps: 'EXPEDICIÓN 1958'. Sharp cut."
        },
        {
          sceneTitle: "Los Restos de Hierro en el Lodo Glacial",
          voiceover: "Los buzos desenterraron espadas del siglo XIII, puntas de lanza y herraduras de combate conservadas intactas por el agua fría.",
          sound: "Brocha subacuática retirando lodo fino, tintineo metálico de espada rescatada",
          shot1: "High-resolution museum photograph of excavated 13th-century straight double-edged knightly sword.",
          shot2: "Technical metallurgical analysis showing iron preservation in low-oxygen lake bed mud.",
          shot3: "Torn sketch of stirrups and iron mail fragments recovered from underwater strata.",
          shot4: "Comparative diagram proving the battle took place exactly where the chronicles recorded.",
          shot5: "Title fragment stamps: 'HIERRO RESCATADO'. Percussive drum beat."
        },
        {
          sceneTitle: "La Datación por Radiocarbono de los Maderos de Vorony",
          voiceover: "El análisis de carbono 14 de empalizadas y restos sumergidos confirmó la ocupación militar de la orilla exacta en abril de 1242.",
          sound: "Zumbido de espectrómetro de masas en laboratorio forense, teclado de computadora",
          shot1: "Scientific carbon-14 spectrometry calibration graph showing sharp peak at mid-13th century.",
          shot2: "Photomicrograph of preserved wood fiber cells from submerged defensive stakes.",
          shot3: "Torn scientific journal publication validating chronicle topography.",
          shot4: "Diagram correlating the water level changes of Lake Peipus over 800 years.",
          shot5: "Bone-white paper strip stamps: 'DATACIÓN CONFIRMADA'. Sharp transition."
        },
        {
          sceneTitle: "La Dispersión de las Armas en el Fondo",
          voiceover: "El mapeo con magnetómetro reveló que las armas estaban dispersas en abanico, demostrando el patrón exacto del hundimiento de la cuña.",
          sound: "Pitido rítmico de sensor magnético marino con gradiente de intensidad acústica",
          shot1: "High-contrast digital heatmap of magnetic anomalies on Lake Peipus lakebed.",
          shot2: "Overlay comparing the archaeological artifact scatter plot with the historical wedge charge route.",
          shot3: "Torn survey drawing showing cluster of heavy iron objects at the break point.",
          shot4: "Monochrome 3D bathymetric mesh of the underwater trench near Raven Rock.",
          shot5: "Title fragment stamps: 'EL MAPA MAGNÉTICO'. Percussive cut."
        },
        {
          sceneTitle: "El Límite Físico de la Recuperación",
          voiceover: "Muchos de los caballeros permanecen enterrados bajo más de tres metros de turba impenetrable que actúa como una cápsula del tiempo sellada.",
          sound: "Burbujeo denso de lodo que se reacomoda en oscuridad abisal, silencio submarino",
          shot1: "Subaquatic camera footage of deep untouched silt layer at Lake Peipus floor.",
          shot2: "Cross-section geotechnical profile showing three meters of post-glacial mud accumulation.",
          shot3: "Torn diary entry of 1958 lead diver describing total zero-visibility conditions in deep mud.",
          shot4: "Silhouette of ancient mail link half-exposed in dark silt matrix.",
          shot5: "Bone-white paper strip stamps: 'LA CÁPSULA DE LODO'. Heavy drum strike."
        },
        {
          sceneTitle: "El Veredicto de la Arqueología de Guerra",
          voiceover: "La evidencia material moderna cerró las dudas: la batalla del lago Peipus fue una realidad histórica y no un simple mito de propaganda.",
          sound: "Disparo sordo de cámara fotográfica forense, instrumental de laboratorio sobre metal antiguo",
          shot1: "Museum display case showing reconstructed armor fragments and weapons from Lake Peipus.",
          shot2: "Torn academic monograph from the Institute of Archaeology concluding field investigations.",
          shot3: "Comparison chart between literary chronicle claims and verified physical artifacts.",
          shot4: "Close-up of battle-notched sword blade on white velvet background.",
          shot5: "Title fragment stamps: 'VEREDICTO FORENSE'. Rhythmic transition."
        }
      ]
    },
    {
      title: "Acto 9: El Mito de Eisenstein, La Verdad de las Crónicas & El Veredicto Final",
      historicalContext: "De la crónica medieval al cine del siglo XX: Cómo la leyenda transformó la Batalla del Hielo en un icono universal.",
      clips: [
        {
          sceneTitle: "El Mito Romántico y la Realidad Táctica",
          voiceover: "Aunque el cine exageró el número de ahogados, las crónicas alemanas reconocen que la élite de la Orden fue aniquilada en el hielo.",
          sound: "Pasar de páginas de manuscrito medieval alemán en silencio de biblioteca",
          shot1: "Archival folio comparison between Sergei Eisenstein's 1938 film storyboard and original chronicles.",
          shot2: "Torn German chronicle text: 'Twenty Brothers of the Sword fell, and six were taken prisoner...'.",
          shot3: "Historical casualty demographic chart contrasting knight losses with hundreds of auxiliary infantry.",
          shot4: "Monochrome engraving of the solemn prisoner march through the streets of Pskov.",
          shot5: "Graphic stamp over textured card: 'CRÓNICA VS MITO'. Heavy drum hit."
        },
        {
          sceneTitle: "La Sinfonía de Prokofiev y el Cine de 1938",
          voiceover: "En 1938, Sergei Eisenstein y Sergei Prokofiev inmortalizaron el choque en una obra maestra cinematográfica que definió el mito visual de la batalla.",
          sound: "Acorde orquestal imponente de cuerdas y metales de Prokofiev, estruendo de campanas",
          shot1: "Archival black and white film frame of charging knights with horn helmets from the 1938 film.",
          shot2: "Torn musical score page of Prokofiev's cantata 'Alexander Nevsky' with frantic tempo markings.",
          shot3: "Monochrome sketch of Eisenstein directing the ice battle sequence in winter exterior.",
          shot4: "Graphic waveform of the iconic battle score pulsing over dark halftone background.",
          shot5: "Bone-white paper strip stamps: 'EL MITO CINEMATOGRÁFICO'. Percussive cut."
        },
        {
          sceneTitle: "La Crónica Rimada de Livonia sin Censura",
          voiceover: "La Crónica Rimada alemana admitió la humillación: 'Los hermanos cayeron en la hierba helada; por cada alemán había sesenta rusos'.",
          sound: "Pluma de ganso raspando vitela a gran velocidad en abadía teutónica",
          shot1: "High-resolution manuscript scan of the 13th-century Livonian Rhymed Chronicle in Middle High German.",
          shot2: "Torn translation fragment highlighting the frank admission of total tactical catastrophe.",
          shot3: "Monochrome engraving of solitary mourning knight praying before stone altar in Marienburg.",
          shot4: "Black wax seal impressed onto the bottom of the archival page.",
          shot5: "Title fragment stamps: 'EL DUELO DE LIVONIA'. Heavy drum hit."
        },
        {
          sceneTitle: "La Memoria Viva en las Orillas del Lago",
          voiceover: "Hoy en día, las orillas de Peipus permanecen desiertas; solo el graznido de las aves migratorias rompe el viento sobre el agua frontera.",
          sound: "Viento suave soplando sobre carrizales nevados, graznido lejano de gaviotas sobre aguas tranquilas",
          shot1: "Wide panoramic composition of Lake Peipus shoreline under soft twilight sky.",
          shot2: "Silhouette of the colossal bronze monument to Alexander Nevsky standing on the hill at Kobyliye.",
          shot3: "Torn photograph of modern fishing boats crossing the calm border waters between Estonia and Russia.",
          shot4: "Subtle slow-motion ripples expanding on the dark surface of the lake.",
          shot5: "Bone-white paper strip stamps: 'LA ORILLA DEL SILENCIO'. Snappy transition."
        },
        {
          sceneTitle: "La Lección Táctica Inmortal",
          voiceover: "La historia creyó que estas guerras se decidían por el grosor de las corazas; pero vencían porque sabían usar el peso del enemigo en su contra.",
          sound: "Eco marcial de campana lejana desvaneciéndose en el viento gélido",
          shot1: "Slow motion collage of the iron wedge dissolving into an antique tactical parchment map.",
          shot2: "Torn philosophical quote from military treatises on the principle of turning mass into vulnerability.",
          shot3: "Engraving of an aged Russian warrior standing victorious amidst blowing snow.",
          shot4: "Subtle pulsing film grain over ancient stone relief.",
          shot5: "Title fragment stamps: 'EL ARTE DEL HIELO'. Sharp rhythmic transition."
        },
        {
          sceneTitle: "El Veredicto Final: El Acero que se Hundió en el Silencio",
          voiceover: "Bajo las aguas oscuras de Peipus no solo se hundieron caballeros: allí se demostró que el hierro más pesado siempre cae ante la mente más lúcida.",
          sound: "Viento gélido que se apaga lentamente, acorde solemne de campana, silencio reverente",
          shot1: "Monumental composition over black background. Dark frozen lake surface with single sword thrust into ice.",
          shot2: "Torn bone-white archival paper strip stamps firmly across the center: 'EL LAGO DE SANGRE'.",
          shot3: "Crimson wax seal stamps: 'INVESTIGACIÓN HISTÓRICA'.",
          shot4: "Camera slowly pulls back into total blackness as the cold wind ceases.",
          shot5: "Single sharp percussive drum heartbeat. Hard cut to pure black."
        }
      ]
    },
    {
      title: "Acto 10: Las Expediciones Subacuáticas Modernas & El Juicio Eterno del Lago Peipus",
      historicalContext: "La arqueología subacuática moderna explorando el lecho limoso de Peipus y la confirmación científica.",
      clips: [
        {
          sceneTitle: "Las Batimetrías de la Expedición Soviética de 1958",
          voiceover: "En 1958, el Instituto de Arqueología de Moscú empleó magnetómetros marinos para escanear el lecho cenagoso del lago Peipus.",
          sound: "Zumbido sordo de sónar subacuático en cabina de barco, eco metálico rítmico",
          shot1: "Archival 1958 monochrome photograph of research vessel surveying frozen surface of Lake Peipus.",
          shot2: "Torn sonar acoustic map indicating metal anomalies resting under two meters of silt.",
          shot3: "Technical diagram of diver entering subzero murky water with vintage diving gear.",
          shot4: "Crimson outline tracing the submerged Sigovitsa sandstone geological elevation.",
          shot5: "Bone-white paper strip stamps: 'EXPEDICIÓN SUBACUÁTICA'. Percussive drum roll."
        },
        {
          sceneTitle: "El Lodo que Selló las Armaduras del Siglo XIII",
          voiceover: "Las perforaciones geológicas demostraron que el cieno anaeróbico preservó fragmentos de hierro y estacas de madera durante ocho siglos.",
          sound: "Burbujas subacuáticas lentas en aguas turbias, fango moviéndose bajo reflectores",
          shot1: "Submarine exploration footage style illustration of muddy lakebed under beam of diving lantern.",
          shot2: "Torn laboratory soil core analysis report demonstrating oxygen-free conservation conditions.",
          shot3: "Monochrome sketch of heavily corroded iron ring mail fragment extracted from bottom sediment.",
          shot4: "Microscopic magnification of peat fibers adhering to ancient forged iron nails.",
          shot5: "Title fragment stamps: 'EL FONDO ANAERÓBICO'. Sharp drum hit."
        },
        {
          sceneTitle: "El Mito de Eisenstein Confrontado con las Crónicas",
          voiceover: "La Crónica Rimada de Livonia reveló que la batalla no fue un film propagandístico, sino un combate desesperado cuerpo a cuerpo.",
          sound: "Pasar de folios de pergamino medieval en biblioteca silenciosa, murmullo académico",
          shot1: "Archival split screen comparing Sergei Eisenstein's 1938 film stills with authentic Livonian Chronicle manuscript.",
          shot2: "Torn parchment excerpt with Middle High German verses detailing the death of twenty Knights brothers.",
          shot3: "Close-up of gothic script translation analyzing casualty demographics.",
          shot4: "Crimson comparison graph contrasting cinematic dramatization with rigorous bioarchaeology.",
          shot5: "Bone-white paper strip stamps: 'VERDAD HISTÓRICA'. Snappy transition."
        },
        {
          sceneTitle: "El Monumento en las Colinas de Nóvgorod",
          voiceover: "Sobre las colinas nevadas que dominan el lago, un túmulo monumental conmemora a las milicias campesinas que frenaron la orden.",
          sound: "Viento invernal silbando a través de abedules congelados, tañido solemne de campana ortodoxa",
          shot1: "Atmospheric wide landscape engraving of snow-covered birch forest on the eastern shore of Lake Peipus.",
          shot2: "Torn nineteenth-century architectural drawing of the bronze monument dedicated to the Battle on the Ice.",
          shot3: "Silhouette of ancient wooden chapel standing against white snowstorm skyline.",
          shot4: "Pulsing grain effect across ice-encrusted limestone commemorative plaque.",
          shot5: "Graphic stamp over dark paper: 'MEMORIA DE LA NIEVE'. Heavy percussive drop."
        },
        {
          sceneTitle: "La Tragedia del Hierro Atrapado en el Frío",
          voiceover: "Aquella jornada demostró que ninguna tecnología militar es invencible cuando la geografía y el clima imponen sus leyes.",
          sound: "Viento gélido desvaneciéndose en la estepa nevada, acorde grave de violonchelo",
          shot1: "Majestic composition over deep black background: heavy Great Helm (Spangenhelm) half-buried in dark ice.",
          shot2: "Torn military treatise page highlighting the fundamental tactical rule of ground-bearing load limits.",
          shot3: "Camera slowly tracks in on the frozen blackened iron eye-slits of the knightly helmet.",
          shot4: "Crimson ink bleeding outward across antique map of Livonia and Pskov.",
          shot5: "Title fragment stamps firmly across center: 'LA LEY DEL TERRENO'. Deep drum slam."
        },
        {
          sceneTitle: "El Veredicto Final: El Hielo que Recordó",
          voiceover: "En el lago Peipus, el orgullo de las cruzadas aprendió su lección más amarga: bajo el invierno, hasta el acero más noble se arrodilla.",
          sound: "Tambor ritual final rotundo, campana lejana solemne, corte seco a silencio absoluto",
          shot1: "Monumental final visual composition: dark frozen expanse with black cross symbol fading beneath deep ice.",
          shot2: "Torn bone-white archival paper strip stamps across the center: 'INVESTIGACIÓN HISTÓRICA'.",
          shot3: "Archival chronicle seal stamps firmly on the frame.",
          shot4: "The image slowly recedes into pure black as the cold wind ceases.",
          shot5: "Single sharp resonant bass drum strike. Snappy hard cut to black."
        }
      ]
    }
  ];

  return compileDocumentary(
    "EL LAGO DE SANGRE: LAS ARMADURAS TEUTÓNICAS BAJO EL HIELO DE PEIPUS",
    "Armaduras teutónicas en el lago helado de Peipus (1242)",
    "El 5 de abril de 1242, la poderosa cuña blindada de la Orden Teutónica avanzó sobre la superficie congelada del lago Peipus. Alexander Nevsky conocía el secreto del hielo primaveral: soportaba hombres a pie, pero colapsaría bajo toneladas de corceles y placas de hierro. Cuando las líneas rusas resistieron el primer embate, las placas de hielo cedieron con un estruendo sísmico. Cientos de nobles caballeros fueron arrastrados al abismo oscuro de las aguas nórdicas. Una investigación cronológica completa de diez minutos dividida en diez actos de tensión pura, desglosando segundo a segundo lo que realmente ocurrió cuando el hierro más pesado se hundió en el silencio.",
    [
      { label: "⚔️ La Táctica de la Cuña de Hierro", topic: "La formación en punta 'Schweinkopf' de los caballeros teutónicos" },
      { label: "❄️ Alexander Nevsky y la Estrategia del Hielo", topic: "Cómo los exploradores rusos midieron el grosor del lago antes de la batalla" },
      { label: "🛡️ El Peso de la Barda Medieval", topic: "El lastre de las armaduras completas para caballo y jinete en el siglo XIII" },
      { label: "📜 La Crónica Rimada de Livonia", topic: "El texto medieval alemán que reconoció la pérdida de veinte dignatarios de la Orden" },
      { label: "💀 Arqueología Subacuática en Peipus", topic: "Las expediciones modernas que buscaron las corazas sumergidas en el lodo del lago" }
    ],
    acts
  );
}

// -------------------------------------------------------------
// 3. UNIVERSAL DYNAMIC HISTORICAL CHRONICLER FOR ANY TOPIC
// -------------------------------------------------------------
export function buildUniversalHistoricalDocumentary(topic: string): FlowDocumentary {
  const cleanTopic = topic.trim();

  const acts: RawActDef[] = [
    {
      title: `Acto 1: El Prólogo Olvidado & Las Fuentes Primarias de ${cleanTopic}`,
      historicalContext: `Las crónicas de la época, los manuscritos censurados y el enigma inicial que la historia oficial intentó ocultar.`,
      clips: [
        {
          sceneTitle: `El Manuscrito Desenterrado en los Archivos`,
          voiceover: `En los archivos olvidados de la época, una crónica inédita sobre ${cleanTopic} revela el primer testimonio que los historiadores modernos ignoraron por completo.`,
          sound: "Crujido de pergamino antiguo al abrirse, polvo soplado, silencio de biblioteca claustral",
          shot1: `Archival engraving representing the primary sources of ${cleanTopic} sliding into frame over dark halftone canvas.`,
          shot2: `Antique regional map with crimson territorial routes and tactical notations.`,
          shot3: `Torn monochrome parchment fragment displaying authentic archaic calligraphy.`,
          shot4: `Macro inspection of historical seal and ink corrosion on ancient paper.`,
          shot5: `Bone-white paper strip stamps: '${cleanTopic.slice(0, 18).toUpperCase()}'. Percussive cut to black.`
        },
        {
          sceneTitle: `La Cartografía Territorial del Conflicto`,
          voiceover: `Los mapas militares trazados a mano demuestran que los protagonistas de ${cleanTopic} quedaron completamente aislados sin posibilidad de auxilio exterior.`,
          sound: "Lápiz de plomo raspando sobre vitela, viento en el exterior, susurros estratégicos",
          shot1: `Torn topographic terrain survey of the operational zone sliding upward with crimson border lines.`,
          shot2: `Engraving of expedition commanders analyzing terrain elevation and hostile choke points.`,
          shot3: `Monochrome sketch of natural barriers and river crossings cutting off escape routes.`,
          shot4: `Detail of archaic compass rose with cardinal directional pointers.`,
          shot5: `Title fragment stamps: 'TERRITORIO HOSTIL'. Sharp drum strike.`
        },
        {
          sceneTitle: `La Orden Secreta del Alto Mando`,
          voiceover: `Una directiva redactada con tinta de hierro advertía que cualquier vacilación en el cumplimiento de las órdenes se castigaría con la muerte inmediata.`,
          sound: "Sello de cera caliente aplastado con anillo signatario, chasquido de hierro",
          shot1: `Macro view of wax seal melting onto parchment document bearing official authority mark.`,
          shot2: `Torn manuscript excerpt highlighting the strict penalty clauses imposed on the ranks.`,
          shot3: `Silhouette of senior commander delivering sealed orders to trusted courier.`,
          shot4: `Crimson highlight marker underlining the non-negotiable clauses.`,
          shot5: `Graphic stamp over dark paper texture: 'ORDEN SIN RETORNO'. Hard cut.`
        },
        {
          sceneTitle: `El Despliegue Hacia la Zona de Operaciones`,
          voiceover: `Bajo un clima implacable, las columnas de marcha avanzaron hacia el epicentro del suceso sin sospechar la magnitud del desafío.`,
          sound: "Pasos rítmicos de cientos de hombres sobre terreno pedregoso, entrechoque de equipo",
          shot1: `Archival engraving of armed formation moving through rugged wilderness landscape.`,
          shot2: `Torn sketch of pack animals struggling under heavy logistical burdens.`,
          shot3: `Monochrome panoramic view of the ominous terrain looming in the distance.`,
          shot4: `Close-up of weathered boots and calloused hands gripping equipment hafts.`,
          shot5: `Bone-white paper strip stamps: 'LA MARCHA INICIAL'. Snappy cut to black.`
        },
        {
          sceneTitle: `El Primer Asentamiento al Caer la Noche`,
          voiceover: `Al ponerse el sol, el campamento se levantó en medio de una tensión silenciosa: las primeras señales de alarma no tardaron en manifestarse.`,
          sound: "Estacas de madera clavadas en tierra con mazas, viento nocturno comenzando a aullar",
          shot1: `Engraving of defensive encampment being fortified with ditch and wooden stakes.`,
          shot2: `Torn blueprint of perimeter watch posts and sentry sectors.`,
          shot3: `Silhouette of soldiers huddled around low, concealed fires in the twilight.`,
          shot4: `Detail of sentry staring out into the pitch-black perimeter void.`,
          shot5: `Title fragment stamps: 'CAÍDA DE LA NOCHE'. Percussive drum hit.`
        },
        {
          sceneTitle: `El Primer Enigma que Desafió a la Lógica`,
          voiceover: `Antes de que concluyera la primera vigilia sobre ${cleanTopic}, un suceso inesperado rompió la calma y obligó a activar las defensas.`,
          sound: "Alerta súbita en voz baja, clic metálico de arma amartillada, respiración contenida",
          shot1: `High-contrast monochrome sketch of sentry snapping to defensive readiness.`,
          shot2: `Torn chronicle page recording the inexplicable anomaly witnessed on the perimeter.`,
          shot3: `Dark shadow movement briefly crossing the outer edge of lantern illumination.`,
          shot4: `Macro inspection of an unusual artifact or footprint discovered on the damp ground.`,
          shot5: `Graphic stamp over parchment: 'PRIMERA ALERTA'. Sudden cut to black.`
        }
      ]
    },
    {
      title: `Acto 2: El Escenario Físico & El Equipamiento Extremo de ${cleanTopic}`,
      historicalContext: `El terreno hostil, el peso del metal y las condiciones fisiológicas al borde del colapso humano.`,
      clips: [
        {
          sceneTitle: `La Inspección del Armamento y las Corazas`,
          voiceover: `Los artefactos conservados en museos demuestran que el equipo utilizado en ${cleanTopic} imponía un castigo físico implacable sobre el cuerpo.`,
          sound: "Fricción metálica de placas raspando contra hueso, respiración forzada",
          shot1: `Detailed technical engraving of the authentic weaponry and armor used in ${cleanTopic}.`,
          shot2: `Anatomical cross-section diagram tracking heavy pressure points across shoulders and spine.`,
          shot3: `Torn archival inventory listing individual gear specifications and weights.`,
          shot4: `Close-up of scarred leather straps and hand-forged iron rivets.`,
          shot5: `Bone-white paper strip stamps: 'EL PESO DEL METAL'. Percussive cut.`
        },
        {
          sceneTitle: `El Terreno Hostil y la Falta de Refugio`,
          voiceover: `Sin edificaciones ni cobijo natural, la tierra húmeda y las rocas desnudas constituían el único lecho posible bajo un cielo helado.`,
          sound: "Viento gélido filtrándose entre rocas, crujido de ramas secas, tiritona involuntaria",
          shot1: `Topographic landscape engraving showing jagged rocky terrain exposed to elements.`,
          shot2: `Torn sketch of soldiers curling under woolen mantles directly on muddy soil.`,
          shot3: `Antique temperature and precipitation records confirming extreme weather conditions.`,
          shot4: `Monochrome close-up of frost forming on metal gear buckles.`,
          shot5: `Title fragment stamps: 'SUELO DE ROCA'. Sharp drum impact.`
        },
        {
          sceneTitle: `El Racionamiento Estricto de los Suministros`,
          voiceover: `El agua y las raciones fueron racionadas al mínimo vital; un solo sorbo de más ponía en riesgo la supervivencia de la unidad.`,
          sound: "Agua vertida gota a gota en cuenco de estaño, trago seco y anhelado",
          shot1: `Archival drawing of measured food rations and water containers under guard.`,
          shot2: `Torn logbook showing progressive daily calorie reductions per man.`,
          shot3: `Monochrome sketch of parched men staring in disciplined silence at the distribution.`,
          shot4: `Detail of dried, hardened bread and salted meat rations.`,
          shot5: `Graphic stamp over dark paper: 'RACIÓN DE HAMBRE'. Heavy drum hit.`
        },
        {
          sceneTitle: `Las Primeras Heridas y la Falta de Higiene`,
          voiceover: `Las ampollas reventadas y el roce continuo del metal contra la piel provocaban infecciones tempranas que mermaban la fuerza operativa.`,
          sound: "Quejido sordo contenido, tela áspera vendando herida en penumbra",
          shot1: `Historical medical sketch demonstrating acute skin ulceration caused by unpadded armor.`,
          shot2: `Torn papyrus or manuscript excerpt describing field surgical dressings with vinegar and wine.`,
          shot3: `Silhouette of camp physician examining an inflamed wound by candle flame.`,
          shot4: `Macro view of coarse linen bandages bound around swollen joints.`,
          shot5: `Bone-white paper strip stamps: 'HERIDAS DE CAMPAÑA'. Snappy cut.`
        },
        {
          sceneTitle: `El Suplicio de Dormir con el Acero Encima`,
          voiceover: `La orden militar prohibía despojarse de las armas para dormir: el tórax oprimido impedía alcanzar el sueño profundo reparador.`,
          sound: "Crujido de placas bajo peso corporal al tumbarse, jadeo sofocado",
          shot1: `Engraving of fully geared warriors lying back-to-back in rigid immobility.`,
          shot2: `Clinical anatomical chart demonstrating diaphragm compression in recumbent position with armor.`,
          shot3: `Torn regulation document forbidding the unbuckling of combat belts during watch.`,
          shot4: `Monochrome close-up of sleepless, bloodshot eyes staring into the dark.`,
          shot5: `Title fragment stamps: 'SUEÑO OPRIMIDO'. Percussive cut to black.`
        },
        {
          sceneTitle: `Las Grietas en la Moral Colectiva`,
          voiceover: `Al finalizar la segunda jornada, los murmullos de descontento comenzaron a filtrarse en las tiendas: la realidad superaba cualquier promesa.`,
          sound: "Murmullos apagados y tensos en la oscuridad, queja reprimida al pasar un oficial",
          shot1: `Torn sketch of small groups of soldiers conferring in shadow with grim faces.`,
          shot2: `Archival chronicle quote recounting the sudden decline in combat enthusiasm.`,
          shot3: `Silhouette of watch officer lingering silently in the background, listening to the complaints.`,
          shot4: `Monochrome drawing of a fist clenching a weapon grip in suppressed frustration.`,
          shot5: `Graphic stamp over textured paper: 'MURMULLOS EN LA SOMBRA'. Sudden cut to black.`
        }
      ]
    },
    {
      title: `Acto 3: La Primera Gran Prueba & Las Leyes Inapelables de Supervivencia`,
      historicalContext: `La disciplina de hierro, la ejecución sumaria por negligencia y el choque con las primeras bajas.`,
      clips: [
        {
          sceneTitle: `La Ley del Centinela Inmóvil`,
          voiceover: `Las ordenanzas militares de ${cleanTopic} establecían que cualquier vigía sorprendido durmiendo sería ejecutado en el acto sin juicio previo.`,
          sound: "Paso amortiguado de oficial de guardia, crujido sordo de hoja de hierro al desenvainar",
          shot1: `Archival engraving of execution post and military justice ordinances inscribed in bronze or parchment.`,
          shot2: `Torn sketch of an officer checking sentry alertness by casting small stones against shields.`,
          shot3: `Silhouette of lone sentry standing completely rigid on exposed rock outcrop.`,
          shot4: `Detail of unbending legal text specifying summary capital punishment.`,
          shot5: `Bone-white paper strip stamps: 'LEY SIN JUICIO'. Sharp drum strike.`
        },
        {
          sceneTitle: `La Prohibición Absoluta del Fuego`,
          voiceover: `Cualquier chispa o fuego visible en la noche delataba la posición: comían en crudo y en tinieblas para evitar proyectiles enemigos.`,
          sound: "Chispa apagada violentamente con la palma de cuero, silencio absoluto",
          shot1: `Dense black composition pierced by single glowing spark extinguished instantly.`,
          shot2: `Engraving of soldiers consuming cold rations in total shadow without lantern light.`,
          shot3: `Torn tactical manual explaining thermal and light discipline in hostile territory.`,
          shot4: `Monochrome view of dark silhouettes merging into impenetrable forest background.`,
          shot5: `Title fragment stamps: 'DISCIPLINA DE SOMBRA'. Hard cut.`
        },
        {
          sceneTitle: `El Primer Hostigamiento en la Penumbra`,
          voiceover: `Desde las colinas cercanas cayeron los primeros proyectiles furtivos, cobrándose vidas antes de que nadie pudiera identificar al enemigo.`,
          sound: "Silbido de proyectil cortando la niebla, chasquido sordo al impactar en madera y carne",
          shot1: `Violent graphic slide of arrow or sling projectile entering frame with motion blur.`,
          shot2: `Engraving of sentry knocked backward by surprise impact during the third watch.`,
          shot3: `Torn topographic diagram marking enemy ambush sectors on high ground.`,
          shot4: `Crimson splash accents highlighting the first casualty recorded on the roster.`,
          shot5: `Graphic stamp over dark parchment: 'EL ATAQUE INVISIBLE'. Heavy drum hit.`
        },
        {
          sceneTitle: `La Formación del Muro Defensivo Nocturno`,
          voiceover: `Sin tiempo para el pánico, los veteranos encajaron sus defensas hombro con hombro, levantando un muro impenetrable en plena oscuridad.`,
          sound: "Estruendo masivo de escudos y corazas encajando con sonido metálico: CLANG",
          shot1: `Overhead diagram of tactical hedgehog or interlocking shield circle sliding into frame.`,
          shot2: `Engraving of front-rank warriors locking bronze and wood rims in synchronized motion.`,
          shot3: `Torn manuscript detail describing the drill rehearsals executed until automatic.`,
          shot4: `Silhouette of spearmen bristling outwards like an iron barrier against the wild.`,
          shot5: `Bone-white paper strip stamps: 'EL MURO DE HIERRO'. Snappy cut.`
        },
        {
          sceneTitle: `El Recuento de Bajas en la Madrugada`,
          voiceover: `A las tres de la mañana, el recuento en voz baja confirmó camaradas caídos sin haber podido intercambiar un solo golpe directo.`,
          sound: "Nombres susurrados en lista de combate, silencio prolongado tras nombres sin respuesta",
          shot1: `Torn personnel roster with names struck through with heavy dark ink strokes.`,
          shot2: `Monochrome sketch of covered stretchers resting in cold drizzle behind the line.`,
          shot3: `Silhouette of tent-mates retrieving the fallen comrade's weapons and identification tags.`,
          shot4: `Close-up of bloodied insignia placed into an officer's hand.`,
          shot5: `Title fragment stamps: 'AUSENCIAS EN LA BRUMA'. Percussive cut.`
        },
        {
          sceneTitle: `El Juramento de Sangre entre Sobrevivientes`,
          voiceover: `Los supervivientes comprendieron que solo su lealtad mutua los mantendría con vida: sellaron un pacto de no abandonar jamás la línea.`,
          sound: "Apretón solemne de antebrazos con guanteletes de hierro, juramento en voz baja",
          shot1: `Archival engraving of two warriors clasping forearms over an upturned shield boss.`,
          shot2: `Torn chronicle excerpt recounting the sacred brotherhood forged under night bombardment.`,
          shot3: `Monochrome sketch of unit banner raised defiantly against dark horizon.`,
          shot4: `Detail of blood drawn from palms smeared onto the central standard.`,
          shot5: `Graphic stamp over dark paper: 'PACTO DE HERMANDAD'. Sudden cut to black.`
        }
      ]
    },
    {
      title: `Acto 4: Prácticas Prohibidas & Evidencia Histórica Censurada`,
      historicalContext: `Los hechos que los cronistas oficiales silenciaron: el mercado negro, la deserción y las medidas extremas.`,
      clips: [
        {
          sceneTitle: `Los Relatos Borrados de las Crónicas Oficiales`,
          voiceover: `Las historias oficiales ensalzaron la gloria militar, pero las notas marginales conservadas en abadías revelan la cara más cruda de ${cleanTopic}.`,
          sound: "Raspado de pluma sobre pergamino, tinta tachando frases en latín, susurro cómplice",
          shot1: `Macro view of medieval chronicle folio displaying heavily redacted and crossed-out paragraphs.`,
          shot2: `Torn comparative layout contrasting official propaganda verses with censored private diaries.`,
          shot3: `Silhouette of archivist holding magnifying glass over faded erased ink (palimpsest).`,
          shot4: `Crimson highlight revealing the suppressed underlying words describing the crisis.`,
          shot5: `Bone-white paper strip stamps: 'LAS LÍNEAS BORRADAS'. Percussive cut.`
        },
        {
          sceneTitle: `El Mercado Negro de Raciones en la Penumbra`,
          voiceover: `En los rincones más oscuros del campamento floreció el trueque desesperado: armas de familia y joyas cambiadas por un puñado de grano seco.`,
          sound: "Monedas tintineando en secreto dentro de una bota, susurros de regateo urgente",
          shot1: `Monochrome sketch of hooded figures exchanging silver ornaments for small bags of flour.`,
          shot2: `Torn ledger detailing inflated black-market prices recorded by contemporary merchants.`,
          shot3: `Silhouette of provost marshals patrolling the perimeter alleys with lanterns.`,
          shot4: `Close-up of a desperate soldier hiding a stolen crust of bread inside his tunic.`,
          shot5: `Title fragment stamps: 'TRUEQUE CLANDESTINO'. Sharp drum hit.`
        },
        {
          sceneTitle: `El Uso de Brebajes Estimulantes Prohibidos`,
          voiceover: `Para no caer rendidos por el sueño, recurrían a raíces amargas y preparados de hierbas que producían taquicardia y alucinaciones.`,
          sound: "Mortero de piedra machacando raíces secas con ritmo monótono, trago amargo",
          shot1: `Botanical engraving of stimulant and psychoactive battlefield plants used in ancient warfare.`,
          shot2: `Torn medical treatise on the severe cardiovascular consequences of toxic herbal stimulants.`,
          shot3: `Monochrome sketch of a soldier chewing raw bitter roots with trembling jaw.`,
          shot4: `Detail of dilated pupils reflecting the dim glow of embers.`,
          shot5: `Graphic stamp over dark paper: 'RAÍCES DEL DESVELO'. Heavy drum strike.`
        },
        {
          sceneTitle: `Los Castigos Sumarios a Puerta Cerrada`,
          voiceover: `Cualquier síntoma de insubordinación era castigado en el acto: azotes de cuero y mutilaciones ejemplares para disuadir el pánico.`,
          sound: "Silbido seco de látigo en la noche, crujido de cuerdas tensadas, silencio general",
          shot1: `Archival engraving of military discipline post in the center square of encampment.`,
          shot2: `Torn manuscript illustration of leather scourges and penal instruments.`,
          shot3: `Officers standing in chainmail forming an impassive ring around the execution post.`,
          shot4: `Silhouette of condemned soldier bearing punishment without breaking silence.`,
          shot5: `Bone-white paper strip stamps: 'DISCIPLINA DE SANGRE'. Snappy cut.`
        },
        {
          sceneTitle: `El Silencio Impuesto a los Testigos`,
          voiceover: `A los clérigos y escribas se les prohibió anotar los nombres de los caídos por suicidio o colapso nervioso en los registros formales.`,
          sound: "Tapa de libro de registro cerrándose con golpe seco, candado de hierro echado",
          shot1: `Heavy leather-bound register book slamming shut with dust plume sliding into frame.`,
          shot2: `Torn decree scroll bearing official seal demanding absolute confidentiality from scribes.`,
          shot3: `Monochrome sketch of a monk staring conflictedly at a blank parchment page.`,
          shot4: `Close-up of an extinguished candle wick trailing white smoke.`,
          shot5: `Title fragment stamps: 'REGISTROS MUTILADOS'. Hard cut to black.`
        },
        {
          sceneTitle: `La Evidencia Forense Innegable`,
          voiceover: `Siglos después, la bioarqueología desenterró la verdad: esqueletos con signos inequívocos de desnutrición severa y traumas brutales.`,
          sound: "Raspado de espátula arqueológica sobre hueso seco en laboratorio, cámara fotográfica",
          shot1: `High-resolution archaeological forensic excavation photograph of battlefield burial pit.`,
          shot2: `Anatomical bone scan highlighting stress fractures and unhealed combat blade marks.`,
          shot3: `Scientific paper excerpt confirming acute systemic malnutrition in the recovered remains.`,
          shot4: `Comparative diagram contrasting historical claims with forensic reality.`,
          shot5: `Graphic stamp over parchment: 'EL HUESO NO MIENTE'. Sudden cut to black.`
        }
      ]
    },
    {
      title: `Acto 5: El Colapso Psicológico & El Terror Nocturno en ${cleanTopic}`,
      historicalContext: `La privación sensorial extrema, los delirios febriles y la paranoia destructiva entre camaradas.`,
      clips: [
        {
          sceneTitle: `El Quiebre Neurológico tras Días sin Dormir`,
          voiceover: `Tras setenta y dos horas sin apenas descanso, la mente de los combatientes comenzó a fracturarse bajo el peso de la vigilia continua.`,
          sound: "Zumbido sordo en los oídos, latidos cardíacos distorsionados, respiración irregular",
          shot1: `Medical illustration of brain exhaustion and sensory distortion caused by acute sleep deprivation.`,
          shot2: `Torn engraving of warrior staring vacant and unblinking into the dark with trembling fingers.`,
          shot3: `Timeline infographic showing sensory decay: auditory hallucinations at 48 hours, paranoia at 72.`,
          shot4: `Monochrome sketch of soldier biting leather strap to suppress delirious mutterings.`,
          shot5: `Bone-white paper strip stamps: 'MENTES QUEBRADAS'. Percussive drum roll.`
        },
        {
          sceneTitle: `Los Ruidos Fantasma en la Bruma`,
          voiceover: `En la niebla, el viento entre los árboles sonaba idéntico a las trompetas del enemigo: alarmas en falso que agotaban los nervios.`,
          sound: "Aullido agudo de viento filtrado por ramas y corazas, sobresalto instantáneo",
          shot1: `Atmospheric landscape of dense swirling white mist engulfing dark pine forest.`,
          shot2: `Engraving of sentries jolting upright with spears thrust forward in alarm.`,
          shot3: `Torn chronicle excerpt recounting panic false alarms triggered by nocturnal wildlife.`,
          shot4: `Silhouette of soldiers peering desperately into empty impenetrable fog.`,
          shot5: `Title fragment stamps: 'ALARMAS EN FALSO'. Sharp drum strike.`
        },
        {
          sceneTitle: `Los Amuletos de Plomo y la Fe Desesperada`,
          voiceover: `Para conjurar a los demonios de la noche, enterraban pequeñas tablillas con oraciones grabadas bajo la tierra donde reposaban.`,
          sound: "Punta de daga raspando sobre lámina de plomo blando, tierra removida con las manos",
          shot1: `Macro museum photograph of authentic lead curse or protection tablet inscribed with archaic script.`,
          shot2: `Torn archaeological field report indicating discovery locations under soldier tent sites.`,
          shot3: `Monochrome drawing of warrior burying folded lead sheet beneath his shield before resting.`,
          shot4: `Detail of scratched symbols invoking ancient protective deities.`,
          shot5: `Graphic stamp over dark paper: 'TABLILLAS DE PLOMO'. Heavy drum hit.`
        },
        {
          sceneTitle: `La Parálisis del Cuerpo Atrapado en el Fango`,
          voiceover: `Inmovilizados por el barro y las armaduras rígidas, muchos sufrían parálisis del sueño: despiertos pero incapaces de mover un solo músculo.`,
          sound: "Jadeo agónico desesperado de quien no puede respirar, crujido de placas inamovibles",
          shot1: `Clinical drawing illustrating sleep paralysis combined with heavy armored immobilization.`,
          shot2: `Torn engraving of warrior pinned to wet soil, eyes wide in waking nightmare.`,
          shot3: `Dark shadowy silhouette towering over the helpless immobilized soldier.`,
          shot4: `Medical diagram of diaphragm constriction under extreme metallic load.`,
          shot5: `Bone-white paper strip stamps: 'PESADILLA DE METAL'. Snappy cut.`
        },
        {
          sceneTitle: `La Paranoia Entre Camaradas de Fila`,
          voiceover: `El miedo a ser degollado por un infiltrado sembró una desconfianza ciega: nadie se atrevía a cerrar los ojos de espaldas al compañero.`,
          sound: "Miradas furtivas en la penumbra, clic de cuchillo desenvainado bajo la manta",
          shot1: `Engraving of wide terrified eyes reflecting in polished metal shield in pitch black.`,
          shot2: `Torn manuscript page describing friendly-fire skirmishes triggered by nervous sentries.`,
          shot3: `Silhouette of soldier clutching sword hilt under his cloak while pretending to rest.`,
          shot4: `Close-up of tense jaw muscles clenched in perpetual suspicion.`,
          shot5: `Title fragment stamps: 'PARANOIA EN FILAS'. Percussive cut.`
        },
        {
          sceneTitle: `El Cántico Gutural para No Caer en Letargo`,
          voiceover: `Los veteranos entonaban cánticos rítmicos en voz baja para mantener despiertos a los más jóvenes y evitar el coma por congelación.`,
          sound: "Murmullo coral en tono grave, respiración acompasada, viento que silba fuera",
          shot1: `Engraving of grizzled veteran whispering steady cadences to young recruit shivering beside him.`,
          shot2: `Torn musical notation fragment showing rhythmic meters used in ancient military chants.`,
          shot3: `Silhouette of soldiers swaying gently in unison to sustain blood circulation in numb limbs.`,
          shot4: `Detail of rhythmic foot-tapping keeping toes from freezing.`,
          shot5: `Graphic stamp over dark paper: 'EL CANTO DE VIGILIA'. Sudden cut to black.`
        }
      ]
    },
    {
      title: `Acto 6: Ritos de Sangre, Pactos & El Momento de Quiebre en ${cleanTopic}`,
      historicalContext: `El sacrificio decisivo, el incidente que cambió el rumbo y la determinación irrevocable de resistir.`,
      clips: [
        {
          sceneTitle: `El Aceitado de las Correas y las Armas`,
          voiceover: `Antes de la medianoche decisiva, cada hombre aceitó las correas de cuero y afiló las puntas de hierro con piedra arenisca.`,
          sound: "Fricción de trapo con grasa animal sobre metal, filo raspando piedra con sonido agudo",
          shot1: `Macro engraving of soldier applying oil to shield leather forearm bands and sword blades.`,
          shot2: `Technical cross-section diagram of tempered weapon edge geometry.`,
          shot3: `Torn maintenance regulation detailing penalties for rusted or neglected armament.`,
          shot4: `Close-up of iron spearhead gleaming under dim lantern reflection.`,
          shot5: `Bone-white paper strip stamps: 'HIERRO Y ACEITE'. Percussive drum roll.`
        },
        {
          sceneTitle: `El Rito del Juramento al Estandarte`,
          voiceover: `En torno al estandarte de la unidad, los oficiales hicieron jurar a la tropa que la posición se mantendría hasta la última gota de sangre.`,
          sound: "Juramento solemne al unísono con voces roncas, puños de hierro golpeando pechos acorazados",
          shot1: `Archival engraving of warriors surrounding the battle standard with raised daggers.`,
          shot2: `Torn military oath text preserved in state archives.`,
          shot3: `Monochrome sketch of blood drawn from thumbs smeared onto the wooden standard pole.`,
          shot4: `Silhouette of the unit emblem waving against the starless night sky.`,
          shot5: `Title fragment stamps: 'JURAMENTO AL GUION'. Sharp drum strike.`
        },
        {
          sceneTitle: `La Detección del Movimiento Envolvente`,
          voiceover: `Los vigías de avanzada regresaron con noticias demoledoras: el adversario maniobraba para cerrar la última vía de escape.`,
          sound: "Pasos apresurados en la maleza, informe urgente susurrado al oído del comandante",
          shot1: `Tactical map displaying enemy pincer maneuver closing around the camp perimeter.`,
          shot2: `Torn sketch of scouts reporting with rapid hand gestures over terrain sand-table.`,
          shot3: `Monochrome drawing of the commander's face hardening into cold resolve.`,
          shot4: `Crimson arrows sealing the final mountain pass or bridgehead.`,
          shot5: `Graphic stamp over dark paper: 'EL CERCO TOTAL'. Heavy drum hit.`
        },
        {
          sceneTitle: `El Sacrificio de la Retaguardia`,
          voiceover: `Un pelotón voluntario aceptó ocupar el puesto avanzado más expuesto sabiendo que su única misión era ganar tiempo para los demás.`,
          sound: "Abrazo silencioso entre compañeros, empuñadura de espada ajustada con firmeza",
          shot1: `Engraving of small detachment marching forward into the outer fog to hold the choke point.`,
          shot2: `Torn chronicle quote honoring the sacrifice of the forward guard.`,
          shot3: `Silhouette of lone warriors taking position behind overturned supply carts.`,
          shot4: `Detail of grim, calm expressions in men who have accepted their fate.`,
          shot5: `Bone-white paper strip stamps: 'LA GUARDIA DE SACRIFICIO'. Snappy cut.`
        },
        {
          sceneTitle: `La Destrucción de los Puentes a las Espaldas`,
          voiceover: `Para eliminar cualquier tentación de retirada, el comandante ordenó destruir los puentes y quemar las carretas de bagajes.`,
          sound: "Madera ardiendo con estruendo, vigas de puente colapsando en el río con sordo chapoteo",
          shot1: `Dramatic engraving of bridge timbers collapsing into raging water under fire.`,
          shot2: `Torn sketch of supply wagons burning to prevent their use by advancing enemy.`,
          shot3: `Silhouette of soldiers watching their only retreat route turn to ashes.`,
          shot4: `Monochrome drawing of iron axes cutting through the last support cables.`,
          shot5: `Title fragment stamps: 'PUENTES ROTOS'. Percussive cut.`
        },
        {
          sceneTitle: `La Calma de los Condenados`,
          voiceover: `Al no quedar salida posible, la tensión se disipó: un silencio sepulcral se apoderó de hombres que solo esperaban el choque final.`,
          sound: "Cese repentino del viento, respiración tranquila y profunda de hombres resueltos",
          shot1: `High-contrast composition of motionless warriors standing in rank, weapons lowered to rest.`,
          shot2: `Torn philosophical quote from ancient chronicler on the strange peace of desperate men.`,
          shot3: `Monochrome sketch of an aged soldier calmly adjusting the strap of his helmet.`,
          shot4: `Close-up of steady hands without a single tremor.`,
          shot5: `Graphic stamp over parchment: 'LA PAZ DEL GUERRERO'. Sudden cut to black.`
        }
      ]
    },
    {
      title: `Acto 7: La Hora Más Fría Antes del Alba en ${cleanTopic}`,
      historicalContext: `El desplome térmico de las cuatro de la madrugada, la niebla espesa y la tensión previa al desenlace.`,
      clips: [
        {
          sceneTitle: `El Descenso Térmico más Brutal de la Noche`,
          voiceover: `Hacia las cuatro y media de la madrugada, la temperatura tocó fondo: la escarcha cubrió de blanco las corazas y las hojas de hierro.`,
          sound: "Viento glacial cortante, crujido de escarcha rompiéndose sobre metal, castañeo de dientes",
          shot1: `Topographic valley engulfed in thick freezing white mist sliding into frame.`,
          shot2: `Engraving of soldiers covered in a thin film of white hoarfrost across their mantles.`,
          shot3: `Close-up of frost crystals forming on weapon hilts and spear sockets.`,
          shot4: `Thermal chart showing lowest temperature dip occurring sixty minutes before sunrise.`,
          shot5: `Bone-white paper strip stamps: 'EL DESCENSO TÉRMICO'. Percussive drum roll.`
        },
        {
          sceneTitle: `La Niebla como Manto de Infiltración`,
          voiceover: `La bruma espesa borró las siluetas del terreno: los exploradores enemigos avanzaban a gatas buscando abrir una brecha sin ruido.`,
          sound: "Hierba aplastada con sigilo milimétrico, respiración contenida a dos metros",
          shot1: `Dense white fog animation rolling across near-monochrome textured background.`,
          shot2: `Engraving of stealth skirmishers creeping through reeds with drawn daggers.`,
          shot3: `Torn tactical blueprint showing how fog filled the natural depressions in front of the camp.`,
          shot4: `Monochrome sketch of sentry spear tip barely visible five feet ahead.`,
          shot5: `Title fragment stamps: 'PASOS EN LA BRUMA'. Sharp drum strike.`
        },
        {
          sceneTitle: `El Raspado del Escudo para Revelar el Emblema`,
          voiceover: `Con la punta de la daga, los soldados rasparon el hielo sobre sus escudos para que el enemigo reconociera a qué unidad se enfrentaba.`,
          sound: "Punta de hierro raspando hielo sobre madera pintada con sonido agudo",
          shot1: `Extreme macro close-up of dagger blade violently scraping frost away from shield emblem.`,
          shot2: `Torn archival photograph of excavated shield boss showing preserved painted pigments.`,
          shot3: `Engraving of proud veteran blowing ice shavings away to expose the unit crest.`,
          shot4: `Crimson and gold insignia gleaming fiercely under dim morning gradient.`,
          shot5: `Bone-white paper strip stamps: 'EL EMBLEMA DESNUDO'. Heavy drum hit.`
        },
        {
          sceneTitle: `El Crujido de las Articulaciones Agarrotadas`,
          voiceover: `Al incorporarse para formar, los cuerpos crujieron con dolor: horas de inmovilidad sobre la roca dejaron los músculos casi paralizados.`,
          sound: "Crujido óseo sordo, quejido reprimido, fricción de bronce y hierro",
          shot1: `Anatomical drawing of knee and spinal joints locked in hypothermic rigidity.`,
          shot2: `Torn manuscript of ancient surgeons treating acute muscular cramps in the field.`,
          shot3: `Silhouette of soldiers helping each other up by pulling on shield rims and spear shafts.`,
          shot4: `Crimson indicator lines mapping pain receptors along the lumbar vertebrae.`,
          shot5: `Graphic stamp over dark paper: 'HUESOS DE PIEDRA'. Snappy cut.`
        },
        {
          sceneTitle: `El Primer Claror Gris en el Horizonte Oriental`,
          voiceover: `Una franja gris pálido comenzó a recortar las cumbres lejanas: la larga vigilia nocturna tocaba a su fin.`,
          sound: "Canto lejano de ave rapaz, cese repentino del viento helado, respiración de alivio",
          shot1: `Engraving of distant horizon through mountain peaks with pale horizontal dawn gradient.`,
          shot2: `Torn chronicle quote describing the immense psychological release when twilight broke.`,
          shot3: `Silhouettes of sentries lowering their weapons from high ready to rested position.`,
          shot4: `Monochrome sketch of soldiers exhaling steam plumes in the freezing morning light.`,
          shot5: `Title fragment stamps: 'EL FIN DE LA NOCHE'. Percussive cut.`
        },
        {
          sceneTitle: `El Clamor del Cuerno que Anuncia el Choque`,
          voiceover: `Pero antes de que pudieran respirar, el cuerno de guerra enemigo bramó en el valle anunciando el asalto general.`,
          sound: "Bramido profundo, ensordecedor y prolongado de cuerno de guerra, eco en las rocas",
          shot1: `Violent graphic slide of an ancient curved war horn echoing in mountain pass.`,
          shot2: `Torn tactical map showing enemy battle lines deploying across the plain.`,
          shot3: `Engraving of soldiers snapping their heads in unison toward the sound of battle.`,
          shot4: `Crimson shockwaves pulsing across the screen with each blast of the war trumpet.`,
          shot5: `Graphic stamp over bone-white strip: 'EL CLAMOR DE GUERRA'. Sudden cut to black.`
        }
      ]
    },
    {
      title: `Acto 8: El Choque Final & La Revelación Forense de ${cleanTopic}`,
      historicalContext: `La colisión decisiva, el veredicto de la historia y los hallazgos bioarqueológicos modernos.`,
      clips: [
        {
          sceneTitle: `La Formación Instantánea de la Falange`,
          voiceover: `En noventa segundos de precisión matemática, las filas encajaron formando una muralla de escudos inexpugnable.`,
          sound: "Estruendo masivo de metal chocando con metal, trompeta militar sonando la carga",
          shot1: `Engraving of trumpeter sounding battle assembly as ranks lock in synchronized drill.`,
          shot2: `Overhead diagram of tactical deployment with interlocking shield wall.`,
          shot3: `Torn drill manual outlining phalanx assembly speed requirements.`,
          shot4: `Close-up of leather buckles cinched tight in rapid motion.`,
          shot5: `Bone-white paper strip stamps: 'NOVENTA SEGUNDOS'. Percussive drum roll.`
        },
        {
          sceneTitle: `La Colisión Brutal de las Primeras Líneas`,
          voiceover: `El impacto de las masas acorazadas sacudió el valle: una colisión violenta donde solo la disciplina sostuvo a los hombres en pie.`,
          sound: "Impacto colosal de dos ejércitos chocando a la carrera: CRASH, estrépito de hierro y lanzas",
          shot1: `Dynamic high-speed illustration of two battle lines colliding at full momentum.`,
          shot2: `Torn chronicle excerpt from contemporary historian describing the seismic shock.`,
          shot3: `Monochrome sketch of front-rank spears shattering against heavy bronze and wood shields.`,
          shot4: `Crimson highlight bar representing the immense kinetic energy of the clash.`,
          shot5: `Title fragment stamps: 'EL CHOQUE TOTAL'. Sharp drum strike.`
        },
        {
          sceneTitle: `La Evidencia en los Esqueletos Desenterrados`,
          voiceover: `Los bioarqueólogos modernos hallaron en los restos óseos huellas inequívocas: vértebras comprimidas por dormir con armadura y heridas curadas en campaña.`,
          sound: "Disparo sordo de cámara forense, raspado de instrumental en laboratorio antropológico",
          shot1: `High-resolution archaeological forensic photograph of excavated warrior skeleton.`,
          shot2: `Anatomical diagram highlighting severe compression trauma in cervical and lumbar spine.`,
          shot3: `Scientific report excerpt from historical anthropology journals validating chronicle records.`,
          shot4: `Comparison chart between normal human bone and the hypertrophied skeleton of these soldiers.`,
          shot5: `Bone-white paper strip stamps: 'EVIDENCIA EN EL HUESO'. Heavy drum hit.`
        },
        {
          sceneTitle: `El Himno de Combate Borrando el Agotamiento`,
          voiceover: `El cántico guerrero resonó en miles de gargantas: la adrenalina borró semanas de agotamiento en un instante definitivo.`,
          sound: "Cántico coral masivo de guerra con eco colosal, percusión de escudos con las lanzas",
          shot1: `Engraving of hundreds of warriors chanting with open mouths, eyes blazing with combat fervor.`,
          shot2: `Torn manuscript fragment of the ancient battle hymn chanted before the decisive clash.`,
          shot3: `Dynamic camera track along front rank as spears shake in rhythm with stomping boots.`,
          shot4: `Crimson banners whipping violently in the morning wind.`,
          shot5: `Title fragment stamps: 'EL HIMNO DE GUERRA'. Percussive cut.`
        },
        {
          sceneTitle: `La Persecución y el Colapso de la Vanguardia Enemiga`,
          voiceover: `Al quebrar la línea adversaria, la persecución se extendió por leguas enteras asegurando la supremacía táctica del terreno.`,
          sound: "Cascos de caballos a galope tendido, gritos lejanos de retirada, polvo arremolinado",
          shot1: `Dynamic panorama of retreating enemy units dispersing into broken gullies and woods.`,
          shot2: `Torn battle dispatch recording the collapse of hostile resistance along the river.`,
          shot3: `Monochrome sketch of cavalry pursuing disorganized hostile elements across the ridge.`,
          shot4: `Crimson vector arrows tracking the decisive rout across topographical parchment.`,
          shot5: `Bone-white paper strip stamps: 'LA RUPTURA TOTAL'. Snappy drum impact.`
        },
        {
          sceneTitle: `El Aseguramiento de los Pasos y el Alto de Combate`,
          voiceover: `Antes del anochecer, las avanzadillas sellaron los desfiladeros estratégicos: la victoria militar sobre el terreno era total e indiscutible.`,
          sound: "Trompeta militar sonando el alto al fuego, silbido de viento en las cumbres rocosas",
          shot1: `Wide panoramic engraving of mountain pass fortified with timber barricades at dusk.`,
          shot2: `Torn tactical summary recording the complete cessation of hostilities in the sector.`,
          shot3: `Silhouettes of sentinels planting unit guidons along the high ridge against twilight glow.`,
          shot4: `Close-up of weathered hands binding a wounded comrade's shoulder with linen strips.`,
          shot5: `Bone-white paper strip stamps: 'EL PASO SELLADO'. Sharp percussive cut.`
        }
      ]
    },
    {
      title: `Acto 9: El Epílogo en las Sombras, La Memoria Censurada & El Veredicto Final en ${cleanTopic}`,
      historicalContext: `Las consecuencias silenciadas, el registro bioarqueológico moderno y el juicio definitivo de los siglos.`,
      clips: [
        {
          sceneTitle: `El Silencio en el Campo de Cadáveres`,
          voiceover: `Tras el estruendo de las armas, una calma fantasmal descendió sobre el valle cubierto de armas rotas y mantos rasgados.`,
          sound: "Viento sordo que agita banderas caídas, graznido de cuervos en la distancia, respiración pesada",
          shot1: `Wide atmospheric engraving of smoke drifting low over deserted battle plain at noon.`,
          shot2: `Torn medical diary describing the horrific aftermath and salvage of armor from the field.`,
          shot3: `Silhouette of lone survivors walking among dented shields searching for comrades.`,
          shot4: `Macro close-up of bloodied bronze spearhead resting in dried gray mud.`,
          shot5: `Bone-white paper strip stamps: 'LA HORA DEL SILENCIO'. Percussive drum roll.`
        },
        {
          sceneTitle: `El Saqueo y la Distribución del Botín Sagrado`,
          voiceover: `En los campamentos improvisados, los vencedores inventariaron armas, monedas y grano para asegurar los meses venideros.`,
          sound: "Monedas de plata tintineando sobre madera de barril, cuchillos desengarzando joyas de vainas",
          shot1: `Engraving of soldiers piling captured swords and helmets around the unit commander's tent.`,
          shot2: `Torn inventory roster recording tribute, captured livestock, and rations distributed to veterans.`,
          shot3: `Monochrome sketch of wounded soldiers sharing wine skins and binding gashes with linen.`,
          shot4: `Wax seal stamped firmly upon the victory proclamation dispatch.`,
          shot5: `Title fragment stamps: 'EL BOTÍN DE SANGRE'. Sharp drum hit.`
        },
        {
          sceneTitle: `La Censura en las Crónicas de los Escribas`,
          voiceover: `Los escribas oficiales embellecieron los relatos: borraron las deserciones, el canibalismo y el pánico ciego para crear héroes inmaculados.`,
          sound: "Pluma de ganso raspando pergamino a gran velocidad, mancha de tinta negra ocultando una línea",
          shot1: `Extreme macro close-up of monastic or royal scribe scratching out text with an iron penknife.`,
          shot2: `Torn palimpsest manuscript showing the redacted original layer beneath the sanitized Latin chronicle.`,
          shot3: `Comparative analysis highlighting suppressed casualty numbers vs official court propaganda.`,
          shot4: `Detail of wax seals covering sensitive military disclosures.`,
          shot5: `Graphic stamp over dark paper: 'LA HISTORIA MUTILADA'. Deep percussive cut.`
        },
        {
          sceneTitle: `El Dictamen de la Antropología Forense Moderna`,
          voiceover: `Los bioarqueólogos modernos desenterraron la verdad física: lesiones de sobreesfuerzo, hipocrecimiento infantil y cicatrices de espada.`,
          sound: "Disparo sordo de cámara forense, zumbido de escáner tomográfico en laboratorio",
          shot1: `High-resolution archaeological forensic photograph of excavated warrior mass grave.`,
          shot2: `3D volumetric CT scan reconstruction of shattered cranial bone with healed metallic trauma.`,
          shot3: `Isotopic bone collagen report documenting extreme nutritional deficits suffered in youth.`,
          shot4: `Diagram correlating chronic spinal arthritis directly to decades of sleeping in armor.`,
          shot5: `Bone-white paper strip stamps: 'EL REGISTRO DEL HUESO'. Snappy transition.`
        },
        {
          sceneTitle: `La Victoria Decidida en la Resistencia`,
          voiceover: `La historia creyó que estos conflictos se decidían por la fuerza de las espadas; pero vencían porque sabían sobrevivir a la propia noche.`,
          sound: "Eco de combate desvaneciéndose lentamente en el viento sobre la llanura",
          shot1: `Slow motion collage of battle line dissolving into antique monochrome terrain map.`,
          shot2: `Torn philosophical quote from classic historian about the endurance of disciplined soldiers.`,
          shot3: `Engraving of victorious veteran standing amidst dust with dented shield resting on ground.`,
          shot4: `Subtle pulsing film grain over ancient marble monument.`,
          shot5: `Bone-white paper strip stamps: 'LA BATALLA INVISIBLE'. Sharp rhythmic transition.`
        },
        {
          sceneTitle: `El Cierre de las Hostilidades y el Veredicto Inmediato`,
          voiceover: `Para los protagonistas de ${cleanTopic}, sobrevivir a esa jornada constituyó una victoria más implacable que cualquier trofeo terrenal.`,
          sound: "Viento solemne en el valle desierto, campana lejana, silencio reverente",
          shot1: `Monumental composition over deep black background. Ancient battered artifact centered in frame.`,
          shot2: `Torn bone-white archival paper strip stamps firmly across center: '${cleanTopic.toUpperCase()}'.`,
          shot3: `Crimson wax seal stamps: 'INVESTIGACIÓN HISTÓRICA'.`,
          shot4: `Camera slowly pulls back as dusk settles over the historical site.`,
          shot5: `Single resonant percussive drum heartbeat. Snappy cut to black.`
        }
      ]
    },
    {
      title: `Acto 10: La Evidencia Arqueológica y el Juicio Inmortal de ${cleanTopic}`,
      historicalContext: `Las excavaciones modernas, los análisis de laboratorio y el veredicto definitivo de la historia sobre ${cleanTopic}.`,
      clips: [
        {
          sceneTitle: `Las Excavaciones Estratigráficas del Siglo XXI`,
          voiceover: `En yacimientos arqueológicos contemporáneos, los científicos desenterraron los estratos intactos que documentan la verdad material de ${cleanTopic}.`,
          sound: "Pinceles arqueológicos barriendo tierra seca, zumbido de escáner tridimensional, silencio de excavación",
          shot1: `High-resolution macro view of archaeological stratigraphic trench with labeled chronological layers of ${cleanTopic}.`,
          shot2: `Torn technical excavation report with radiometric carbon-14 dating tables confirming timeline.`,
          shot3: `Monochrome architectural drawing of excavated foundations and material structural remains.`,
          shot4: `Crimson highlight box framing genuine metallic and ceramic artifacts discovered in situ.`,
          shot5: `Bone-white paper strip stamps: 'ESTRATO CIENTÍFICO'. Percussive drum roll.`
        },
        {
          sceneTitle: `Los Hallazgos de Laboratorio y Análisis Metalúrgico`,
          voiceover: `La espectrometría de masas reveló la composición exacta de las herramientas y aleaciones empleadas durante los sucesos de ${cleanTopic}.`,
          sound: "Bip suave de instrumental de laboratorio, zumbido de espectrómetro, ambiente estéril",
          shot1: `Macro inspection of ancient metal surface showing crystalline microstructure under metallurgical microscope.`,
          shot2: `Torn scientific chemical assay page with elemental breakdown charts of copper, iron, and tin.`,
          shot3: `Photograph of conservation specialist applying chemical stabilizer to fragile artifact surface.`,
          shot4: `Digital graph comparing raw ore origins with antique trade routes across continents.`,
          shot5: `Title fragment stamps: 'ANÁLISIS METALÚRGICO'. Sharp drum hit.`
        },
        {
          sceneTitle: `La Confrontación de las Fuentes Primarias`,
          voiceover: `Al comparar las crónicas de la época con la evidencia física, los historiadores desmontaron siglos de exageraciones y mitos infundados.`,
          sound: "Pasar de páginas de pergamino antiguo en archivo histórico, susurro de investigadores",
          shot1: `Side-by-side archival split comparing archaic manuscript illumination with physical excavated evidence.`,
          shot2: `Torn palimpsest folio with magnifying lens hovering over restored original text.`,
          shot3: `Comparative demographic table displaying real numbers versus propagandistic official chronicles.`,
          shot4: `Pulsing archival film grain over high-contrast photograph of historical treaty documents.`,
          shot5: `Bone-white paper strip stamps: 'RIGOR DOCUMENTAL'. Snappy transition.`
        },
        {
          sceneTitle: `El Testimonio en los Museos del Mundo`,
          voiceover: `Las vitrinas de las principales instituciones preservan hoy los objetos cotidianos y bélicos que protagonizaron la epopeya de ${cleanTopic}.`,
          sound: "Ambiente solemne de sala de museo, eco de pasos lentos sobre piso de granito",
          shot1: "Slow tracking camera along museum glass display case featuring genuine excavated relics.",
          shot2: `Torn museum collection catalogue description explaining historical significance of ${cleanTopic}.`,
          shot3: `Macro shot of museum spotlight reflecting softly off weathered patina of ancient bronze and stone.`,
          shot4: `Visitor silhouettes observing commemorative inscription with deep respect.`,
          shot5: `Graphic stamp over dark paper: 'PATRIMONIO UNIVERSAL'. Heavy percussive drop.`
        },
        {
          sceneTitle: `La Trascendencia Cultural a Través de los Siglos`,
          voiceover: `Aquellos sucesos transformaron para siempre la mentalidad colectiva, dejando una huella indeleble en la literatura y el arte universal.`,
          sound: "Música solemne de cuerdas antiguas en tono menor, viento suave desvaneciéndose",
          shot1: `Majestic visual composition: dramatic key light illuminating iconic symbol of ${cleanTopic} on dark slate.`,
          shot2: `Torn manuscript page from classic universal literature immortalizing the memory of the episode.`,
          shot3: `Camera tracks slowly inward across authentic ancient map highlighting cultural impact zones.`,
          shot4: `Crimson ink lines branching outward like roots across antique historical charts.`,
          shot5: `Title fragment stamps firmly across center: 'MEMORIA VIVA'. Deep drum slam.`
        },
        {
          sceneTitle: `El Veredicto Final: La Victoria de la Memoria`,
          voiceover: `La lección de ${cleanTopic} perdura intacta: frente a la adversidad extrema, la constancia humana superó todos los límites del tiempo.`,
          sound: "Tambor ritual final rotundo, campana lejana solemne, corte seco a silencio absoluto",
          shot1: `Monumental final composition over deep black background. Ancient artifact emblem centered under soft gold light.`,
          shot2: `Torn bone-white archival paper strip stamps across the center: 'INVESTIGACIÓN HISTÓRICA'.`,
          shot3: `Archival chronicle seal stamps firmly on the frame.`,
          shot4: `The image slowly recedes into pure black as the final echo of the chronicle fades.`,
          shot5: `Single sharp resonant bass drum strike. Snappy hard cut to black.`
        }
      ]
    }
  ];

  return compileDocumentary(
    `CRÓNICA HISTÓRICA: ${cleanTopic.toUpperCase()}`,
    cleanTopic,
    `A lo largo de los siglos, la historia oficial silenció los detalles más crudos sobre ${cleanTopic}. Los documentos conservados en archivos antiguos y los recientes descubrimientos arqueológicos revelan una realidad mucho más implacable de lo que se creía. Una investigación cronológica completa de diez minutos dividida en diez actos de tensión pura, desglosando segundo a segundo lo que realmente ocurrió cuando se apagaban las luces de la civilización.`,
    [
      { label: `🔍 El Manuscrito Perdido de ${cleanTopic.slice(0, 15)}`, topic: `Los testimonios censurados sobre ${cleanTopic}` },
      { label: `⚔️ Las Armas Secretas de ${cleanTopic.slice(0, 15)}`, topic: `El equipamiento y tecnología olvidada de ${cleanTopic}` },
      { label: `💀 La Evidencia Forense de ${cleanTopic.slice(0, 15)}`, topic: `Qué revelan los restos arqueológicos de ${cleanTopic}` },
      { label: `📜 El Juicio Histórico de ${cleanTopic.slice(0, 15)}`, topic: `Las crónicas de la época que contradicen la versión oficial de ${cleanTopic}` },
      { label: `🛡️ Tácticas Extremas en ${cleanTopic.slice(0, 15)}`, topic: `La estrategia de supervivencia más extrema documentada en ${cleanTopic}` }
    ],
    acts
  );
}
