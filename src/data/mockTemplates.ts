import { StrategyAnalysis, FlowDocumentary, POVShort, FlowChapter, FlowClip } from '../types/content';

export const INITIAL_STRATEGY: StrategyAnalysis = {
  title: "FC Mobile: Guía Táctica y Controles para Dominar el Modo Cara a Cara",
  hook: "Si sientes que tus rivales siempre ganan los balones divididos y no puedes salir jugando, este ajuste de joystick y formación táctica cambia el ritmo por completo.",
  contentCategory: "Gaming FC Mobile & Tablet",
  recommendedFormat: "Video Largo (8 a 10 min) + 2 Shorts de mejores momentos",
  dynamicRelatedTopics: [
    { label: "⚽ Bug Táctico Cara a Cara", prompt: "El error táctico de centros y regates en FC Mobile Cara a Cara que los top usan", category: "FC Mobile" },
    { label: "🎮 Fortnite PC: 120 FPS sin Caídas", prompt: "Fortnite en PC modesta: Modo rendimiento extremo y cómo jugar sin lag", category: "Gaming PC" },
    { label: "📱 Emuladores de PS2 en Super Tablet", prompt: "Juegos de PS2 a 60 FPS en tu nueva tablet con gráficos mejorados", category: "Nuevos Nichos" },
    { label: "✈️ Vlog de Viajes: Mochilero con Tablet", prompt: "Viajando por lugares insólitos con poco equipaje y editando todo en el camino", category: "Travel Vlogs" },
    { label: "🏆 FC Mobile: Configuración de Joystick", prompt: "Ajuste de sensibilidad táctil en pantalla de tablet para regates precisos", category: "FC Mobile" }
  ],
  youtubeStrategy: {
    titleIdea: "¡EL SECRETO TÁCTICO! Cómo Subir a Campeón FIFA en FC Mobile sin Fallar Pases",
    thumbnailIdea: "Foto tuya con la nueva tablet en mano con gesto de sorpresa, flecha indicando el ajuste clave del joystick, fondo con iluminación de contraste y logo de FC Mobile.",
    seoTags: [
      "fc mobile", "olvis bolt", "trucos fc mobile", "cara a cara fc mobile",
      "como subir a campeon fc mobile", "tactica fc mobile", "fc mobile tablet gameplay",
      "mejores regates fc mobile", "configuracion joystick fc mobile"
    ],
    descriptionTemplate: "En este video te muestro la configuración táctica que estoy usando en la Super Tablet para ganar partidos en Modo Cara a Cara en FC Mobile. ¡Suscríbete al canal de Olvis Bolt para más gameplays, vlogs y trucos!",
    retentionTechnique: "En el minuto 02:40 anuncia: 'Al final del video voy a jugar contra el rival número 1 del ranking usando esta formación... miren la remontada en el minuto 88'. Mantén el suspenso constante."
  },
  facebookStrategy: {
    titleIdea: "¿Tus jugadores se quedan parados en FC Mobile? Esta es la solución táctica",
    hookStyle: "Clip vertiginoso de 3 segundos grabado en la tablet con un gol acrobático, texto gigante: 'AJUSTE TÁCTICO PARA GANAR EN CARA A CARA'",
    viralShareTrigger: "La comunidad de FC Mobile en Facebook busca trucos reales para ganar partidos difíciles sin frustrarse.",
    monetizationTip: "Alcanza los 3:15 minutos de duración exacta para calificar a pausas publicitarias In-Stream de Facebook. Coloca el momento de mayor tensión en el minuto 1:50."
  },
  theMissingGap: {
    whatCompetitorsDo: "Los creadores grandes solo hacen aperturas de sobres costosas sin enseñar cómo jugar y defender en partidos reales.",
    whatNobodyHasUploaded: "Nadie ha hecho una guía táctica práctica aprovechando la fluidez y controles avanzados de una Tablet de alta gama para demostrar el control de campo.",
    fusionOrImprovementAngle: "Fusión: Reto Gaming + Análisis de Controles. '¿Tener una buena tablet realmente te da ventaja en FC Mobile? Probando la formación en vivo'."
  },
  zeroBudgetProduction: {
    tabletRole: "Grabar la pantalla a 1080p 60fps con la grabadora interna del sistema (con audio del juego capturado en alta fidelidad). Usar CapCut en la pantalla táctil para cortar tiempos muertos y dejar solo la acción.",
    pcRole: "Usar Audacity en la PC para grabar tu voz con el micrófono de tus auriculares, aplicando los efectos 'Reducción de ruido' y 'Compresor' para que suene como locutor profesional.",
    freeTools: [
      "CapCut Mobile / Tablet (Editor de video con subtítulos automáticos)",
      "Audacity en PC (Grabador y limpiador de voz profesional)",
      "Canva (Diseño de miniaturas de YouTube)",
      "OBS Studio (Para streaming o captura si juegas en PC)"
    ],
    stepByStepGuide: [
      "Paso 1: Configura la grabación de pantalla de tu tablet a 60fps y juega 2 partidos en Cara a Cara de FC Mobile.",
      "Paso 2: Abre Audacity en la PC para grabar tu narración energética y comentarios en off.",
      "Paso 3: En CapCut Tablet, une el gameplay y el audio, agrega zoom táctil en las jugadas épicas y exporta en 1080p.",
      "Paso 4: Crea la miniatura en Canva con bordes llamativos y publica en YouTube y Facebook con las etiquetas generadas."
    ]
  },
  alternativeNiches: [
    {
      nicheName: "Gaming Low-Spec: '¿Corre en PC Modesta?'",
      whyItWorks: "Millones de jugadores en Latinoamérica tienen PCs normales y buscan cómo optimizar Fortnite y juegos livianos a 120 FPS.",
      device: "PC Gamer Modesta"
    },
    {
      nicheName: "Emuladores y Juegos de Consola en Super Tablet",
      whyItWorks: "Muestra cómo jugar títulos de PS2, PSP y consolas clásicas en tu tablet con gráficos escalados a 60fps.",
      device: "Super Tablet"
    },
    {
      nicheName: "Vlogs de Viaje & Mochilero",
      whyItWorks: "Muestra comidas callejeras, rutas secretas y cómo viajar de forma aventurera editando todo en el camino.",
      device: "Tablet / Teléfono móvil"
    }
  ]
};

// Builder for Greek Soldiers 8-Minute Mock with 48 UNIQUE historical sequences and prompts
function createGreekSoldiers8MinDoc(): FlowDocumentary {
  const actDefinitions = [
    {
      title: "Acto 1: El Ocaso en el Campamento y la Ley de Licurgo",
      clips: [
        {
          sceneTitle: "El Alto en Laconia y la Ley Marcial",
          narration: "Bajo la noche del Peloponeso, el silencio no era un refugio, sino una sentencia de muerte.",
          soundEffects: "Impacto sordo de escudos contra la tierra, viento gélido en los riscos",
          shot1: "Begin on black. Blood-red rectangular panel violently slides in from right over satellite terrain map of ancient Laconia.",
          shot2: "Torn parchment fragment slides left displaying the martial code of Lycurgus prohibiting comfortable bivouacs.",
          shot3: "Panoramic engraving of marching Spartan column halting at dusk assembles from ripped monochrome strips.",
          shot4: "Close-up of a damaged Corinthian helmet half-buried in clay with blood-red directional indicator.",
          shot5: "Title fragment stamps on aged bone-white paper strip: 'EL ALTO PROHIBIDO'. Percussive cut to black."
        },
        {
          sceneTitle: "Despeje del Terreno sin Descalzarse",
          narration: "Los hoplitas espartanos jamás se despojaban de sus pesadas corazas de bronce para descansar en campaña militar.",
          soundEffects: "Crujido de piedras afiladas, jadeo contenido, chirrido metálico de correas",
          shot1: "Archival engraving of Greek warriors clearing thorns slides from bottom to center with heavy halftone grain.",
          shot2: "Rapid zoom into soldier boots bound with raw rawhide straps, unable to unlace under severe penalty.",
          shot3: "Torn architectural floorplan of rough military perimeter slides sideways over dark textured canvas.",
          shot4: "Monochrome sketch of stone clearing tools clashing against limestone rocks in dim twilight.",
          shot5: "Crimson wax seal stamps forcefully onto screen corner reading 'ORDEN DE VIGILIA'. Hard graphic cut."
        },
        {
          sceneTitle: "Los Óstrakon de la Guardia Nocturna",
          narration: "La tierra húmeda y las piedras afiladas constituían su único lecho bajo un cielo completamente helado.",
          soundEffects: "Chocar de tiestos cerámicos inscritos, murmullo tenso en griego antiguo",
          shot1: "Black screen violently pierced by aged ceramic pottery shards (ostraka) inscribed with Greek guard rosters.",
          shot2: "Overhead drawing of watch shifts sliding diagonally across rough textured parchment.",
          shot3: "Stylized engraving of two sentries drawing shards from an inverted bronze helmet.",
          shot4: "Archaic Greek lettering 'PHYLAKE' (guard duty) glowing briefly in dull crimson ink.",
          shot5: "Entire composition slams off-screen left, leaving a lone flickering lantern silhouette. Hard cut."
        },
        {
          sceneTitle: "El Aspis como Cúpula Terrestre",
          narration: "El escudo aspis de madera y bronce servía como improvisada y dolorosa almohada durante la noche.",
          soundEffects: "Resonancia metálica hueca, respiración condensada, goteo de rocío",
          shot1: "High-contrast technical cross-section diagram of an 8-layer wood and ox-hide Spartan shield sliding into frame.",
          shot2: "Torn archival engraving of a hoplite curling underneath the concave rim of his shield on damp soil.",
          shot3: "Crimson alignment lines highlight the vulnerable neck gap between helmet rim and shield edge.",
          shot4: "Historical museum photograph fragment of excavated bronze shield plating with battle dent marks.",
          shot5: "Bone-white paper strip stamps: 'LA CÚPULA DE MADERA'. Snappy cut to black."
        },
        {
          sceneTitle: "La Formación del Hexagrama Nocturno",
          narration: "En la penumbra, el murmullo de los centinelas recordaba que la muerte acechaba tras cada colina.",
          soundEffects: "Pisadas cautelosas en la maleza, chasquido de astas de fresno",
          shot1: "Military tactical diagram sliding from left illustrating the hexagram defensive sleeping formation.",
          shot2: "Silhouettes of five hoplites sitting back-to-back facing outwards into the dark wild valley.",
          shot3: "Torn topographic survey of mountain passes surrounding the ancient encampment.",
          shot4: "Engraving of an ancient Greek sentry staring into fog with dory spear held vertical.",
          shot5: "Sudden camera push-in towards the outer perimeter darkness, punctuated by a deep drum impact."
        },
        {
          sceneTitle: "La Prohibición Absoluta del Fuego",
          narration: "Cenaban grano seco y cebolla amarga en tinieblas para no revelar la posición con una sola chispa.",
          soundEffects: "Masticación en silencio, viento nocturno susurrando en el olivar",
          shot1: "Dense black screen. A solitary crimson spark flickers and is violently extinguished by a leather palm.",
          shot2: "Engraving of soldiers sharing dry barley cakes (maza) in complete shadow, faces barely visible.",
          shot3: "Torn archival text fragment from Xenophon's Anabasis describing cold night rations.",
          shot4: "Monochrome sketch of a soldier chewing raw garlic to stimulate heart rate against freezing temperatures.",
          shot5: "Graphic stamp over dark paper texture: 'SILENCIO DE BRUMA'. Percussive cut."
        }
      ]
    },
    {
      title: "Acto 2: El Suplicio de las Armaduras y la Condensación Helada",
      clips: [
        {
          sceneTitle: "La Coraza Musculada y la Asfixia",
          narration: "El bronce helado de las corazas musculadas oprimía la caja torácica impidiendo una respiración profunda.",
          soundEffects: "Crujido de placas de bronce bajo presión corporal, respiración forzada",
          shot1: "Detailed archaeological engraving of a 5th century BC bronze bell cuirass violently slamming into frame.",
          shot2: "Anatomical cross-section diagram showing chest compression when lying supine wearing 25kg of bronze.",
          shot3: "Torn archival manuscript explaining Spartan military law forbidding loosening cuirass clasps.",
          shot4: "Crimson indicator lines tracking pressure points on clavicles and spine.",
          shot5: "Panel slams away laterally. Bone-white paper stamp: 'EL METAL OPRESOR'. Hard cut."
        },
        {
          sceneTitle: "La Condensación y la Escarcha Interna",
          narration: "El sudor acumulado durante la marcha se condensaba con la escarcha nocturna, empapando las túnicas interiores.",
          soundEffects: "Viento helado filtrándose entre junturas de metal, tiritona involuntaria",
          shot1: "Torn engraving of cold mountain dew sliding across antique paper textured with halftone print dots.",
          shot2: "Close-up sketch of linen linothorax layers saturated with freezing perspiration.",
          shot3: "Silhouette of warrior shivering under heavy woolen himation mantle.",
          shot4: "Archaic temperature chart comparing day heat in southern Greece with freezing night valley inversions.",
          shot5: "Violent graphic slide off-screen left, leaving a dark frost-crusted metal texture. Hard cut."
        },
        {
          sceneTitle: "Las Grebas de Bronce Mordiendo los Huesos",
          narration: "Las grebas de bronce ajustadas a presión mordían las tibias hinchadas tras horas de marcha sin descanso.",
          soundEffects: "Fricción de metal raspando hueso, quejido sordo ahogado por la mordaza de cuero",
          shot1: "Engraving of Spartan anatomical bronze shin-guards (knemides) sliding aggressively from bottom right.",
          shot2: "Medical archival sketch demonstrating severe leg edema and tissue necrosis inside unpadded greaves.",
          shot3: "Torn papyrus scroll detailing medical treatments applied by camp physicians after forced marches.",
          shot4: "Monochrome close-up of scarred shins bound with rough linen wraps under bronze casing.",
          shot5: "Title fragment stamps: 'HERIDAS DE BRONCE'. Sharp rhythmic drum strike."
        },
        {
          sceneTitle: "El Casco Corintio y la Ceguera Nocturna",
          narration: "Dormir con el casco corintio cegaba la visión periférica, sumergiendo al hoplita en una trampa de penumbra.",
          soundEffects: "Respiración hueca amplificada dentro de la cámara del casco, chasquido de ramas",
          shot1: "Frontal macro engraving of a bronze Corinthian helmet with pitch-black eye sockets entering frame.",
          shot2: "POV simulation looking through narrow eye slits showing restricted 30-degree field of vision.",
          shot3: "Diagram comparing daytime combat awareness with nocturnal auditory disorientation.",
          shot4: "Archival sketch of cheekpieces clamping down on inflamed jaw muscles.",
          shot5: "Slamming graphic transition to black screen with single crimson horizontal accent line."
        },
        {
          sceneTitle: "El Apiñamiento en Filas de Cinco",
          narration: "Para no morir congelados, los guerreros más jóvenes quedaban en el centro, compartiendo calor corporal.",
          soundEffects: "Murmullos entrecortados de soldados tiritando, roce pesado de capas de lana",
          shot1: "Tactical map overlay illustrating soldiers compressed into tight clusters of five men for heat retention.",
          shot2: "Engraving of young Spartan ephebes huddled in the center of veteran hoplite rows.",
          shot3: "Torn archival document on Spartan brotherhood and the communal bond forged in freezing bivouacs.",
          shot4: "Crimson highlight mapping thermal loss on the exposed outer soldiers facing the frost.",
          shot5: "Text stamp over torn aged card: 'EL NÚCLEO VITAL'. Percussive cut to black."
        },
        {
          sceneTitle: "El Entumecimiento de los Músculos",
          narration: "Muchos despertaban con los dedos agarrotados, temiendo no poder empuñar la lanza si sonaba la alarma.",
          soundEffects: "Crujido de articulaciones agarrotadas, tintineo de puntas de lanza de hierro",
          shot1: "Monochrome sketch of a soldier's calloused hand desperately flexing stiff frozen fingers around spear shaft.",
          shot2: "Torn engraving of the ash-wood dory spear upright in the frozen mud.",
          shot3: "Historical text fragment describing finger frostbite during the winter campaigns in Thessaly.",
          shot4: "Graphic animation of crimson pulses radiating along forearm tendons to restore grip reflexes.",
          shot5: "Entire collage snaps violently off-screen. Title stamp: 'RIGIDEZ MORTAL'. Hard cut."
        }
      ]
    },
    {
      title: "Acto 3: La Ley del Centinela y la Ejecución Sumaria",
      clips: [
        {
          sceneTitle: "La Ronda de los Polemarcos",
          narration: "Los polemarcos espartanos recorrían las líneas arrojando guijarros en silencio para verificar los reflejos.",
          soundEffects: "Guijarro rodando sobre bronce, paso amortiguado sobre musgo, alerta instantánea",
          shot1: "Dark moody engraving of Spartan high officer cloaked in crimson inspecting silent guard perimeter.",
          shot2: "Close-up of a small polished river pebble thrown through the dark bouncing off a hoplite's shield rim.",
          shot3: "Topographic camp blueprint with red patrol routes tracking sentry inspection circuits.",
          shot4: "Silhouette of a sentry snapping his spear to defensive position within half a second of impact.",
          shot5: "Bone-white paper strip stamps: 'LA PRUEBA DEL GUIJARRO'. Sudden cut to black."
        },
        {
          sceneTitle: "La Sentencia Inapelable por Dormir",
          narration: "Un vigía sorprendido sentado o con los ojos cerrados era ejecutado en ese mismo instante sin juicio previo.",
          soundEffects: "Corte seco de hoja de hierro, caída pesada en el barro, silencio absoluto",
          shot1: "Archaic Spartan legal tablet engraved in bronze outlining summary capital punishment for sleeping guards.",
          shot2: "Engraving of an officer's hand resting on the hilt of a curved kopis sword.",
          shot3: "Torn archival manuscript from Plutarch's Moralia regarding unbending Lycurgan discipline.",
          shot4: "Monochrome sketch of a fallen sentry helmet resting in dark pooled water.",
          shot5: "Heavy graphic impact stamp: 'LEY SIN CLEMENCIA'. Percussive drum beat."
        },
        {
          sceneTitle: "El Poste de los Azotes en el Centro del Campamento",
          narration: "En el centro del campamento, el poste de flagelación recordaba a todos el precio de la vacilación.",
          soundEffects: "Silbido de látigo de cuero crudo en la noche, crujido de cuerdas tensadas",
          shot1: "Archival architectural sketch of the central Spartan military camp square with wooden execution post.",
          shot2: "Torn engraving of leather scourges weighted with bronze knucklebones (astragaloi).",
          shot3: "Crimson wash spreading over ancient parchment floorplan of the encampment.",
          shot4: "Silhouette of tied condemned soldier standing erect to maintain Spartan composure.",
          shot5: "Panel slams away in reverse directions. Title stamp: 'EL PRECIO DEL SUEÑO'. Hard cut."
        },
        {
          sceneTitle: "La Contraseña Secreta del Ágora Nocturna",
          narration: "La contraseña militar cambiaba tres veces por noche; un solo error de pronunciación costaba la vida.",
          soundEffects: "Susurro ronco en dialecto dórico, clic metálico de lanza preparada para ensartar",
          shot1: "Macro view of wax tablet (pinax) with stylus marks recording coded Greek night passwords (synthema).",
          shot2: "Torn engraving of two sentries confronting each other at two paces with spear points leveled.",
          shot3: "Phonetic diagram of Doric dialect variations used to expose foreign infiltrators.",
          shot4: "Dark archival portrait of Spartan warrior glaring through helmet nasal bar.",
          shot5: "Graphic stamp over parchment: 'SÍLABA DE MUERTE'. Sharp cut to black."
        },
        {
          sceneTitle: "La Paranoia Entre Filas Hermanas",
          narration: "El miedo constante a ser degollado por la espalda sembraba una paranoia ciega entre camaradas.",
          soundEffects: "Goteo incesante, respiración agitada en la penumbra, ojos abriéndose de golpe",
          shot1: "Engraving of wide terrified eyes reflected in polished bronze shield face in total darkness.",
          shot2: "Torn manuscript fragment from Thucydides describing friendly-fire incidents during night deployments.",
          shot3: "Dark landscape of clustered tents with flickering shadow movement between wooden stakes.",
          shot4: "Monochrome sketch of a hand tightly clenching sword grip under cloak while pretending to rest.",
          shot5: "Title fragment stamps: 'PARANOIA EN FILAS'. Percussive drum impact."
        },
        {
          sceneTitle: "Cuatro Horas de Tensión Inmóvil",
          narration: "Cuatro horas de guardia en completa inmovilidad dejaban a los hombres con la mente al borde del colapso.",
          soundEffects: "Viento silbando monótono, latido acelerado de corazón, respiración contenida",
          shot1: "Sand timer / water clock (clepsydra) illustration sliding into frame with water droplets counting seconds.",
          shot2: "Archival engraving of sentry frozen in place against rock wall while rain begins to fall.",
          shot3: "Diagram of sensory deprivation and exhaustion effects on visual acuity during ancient night vigils.",
          shot4: "Close-up of bloodshot eyes straining against impenetrable pitch-black forest background.",
          shot5: "Panel slams left. Bone-white stamp: 'LA VIGILIA INFINITA'. Hard cut."
        }
      ]
    },
    {
      title: "Acto 4: Incursiones en las Sombras y el Fuego Amigo",
      clips: [
        {
          sceneTitle: "Los Hostigadores Tracios y el Asalto Descalzo",
          narration: "Hostigadores tracios y arqueros persas avanzaban descalzos sobre la hierba húmeda degollando sin ruido.",
          soundEffects: "Hierba aplastada con sigilo, silbido sordo de daga curva, caída de cuerpo",
          shot1: "Archival engraving of feral Thracian peltasts creeping through pine trees with crescent pelte shields.",
          shot2: "Torn sketch of curved sickle-like rhomphaia weapon cutting through tent ropes in darkness.",
          shot3: "Map of the Balkan and Greek borderlands where night ambushes wiped out entire garrisons.",
          shot4: "Crimson splatters sliding across sepia paper texture as camp sentry is overwhelmed.",
          shot5: "Graphic stamp over dark paper: 'ASALTO DESCALZO'. Snappy cut to black."
        },
        {
          sceneTitle: "La Alarma Mutilada Antes del Grito",
          narration: "A menudo el centinela moría asfixiado con lazos de cuero antes de poder dar la primera voz de alarma.",
          soundEffects: "Ahogo contenido, correa de cuero estrangulando, armadura chocando contra el lodo",
          shot1: "Engraving of leather garrote wire sliding into frame over dark halftone texture.",
          shot2: "Silhouette of sentry falling backward with outstretched hand dropping bronze torch into mud.",
          shot3: "Torn manuscript detail describing Persian nocturnal infiltration tactics recorded by Herodotus.",
          shot4: "Monochrome drawing of extinguished embers sizzling in wet peat.",
          shot5: "Bone-white paper strip stamps: 'EL GRITO SILENCIADO'. Rhythmic drum hit."
        },
        {
          sceneTitle: "El Pánico Ciego en el Campamento",
          narration: "Al sonar el primer entrechoque de hierro, cientos de hombres despertaban ensartando a ciegas en la oscuridad.",
          soundEffects: "Gritos desesperados, metal chocando contra metal sin ritmo, alboroto ciego",
          shot1: "Violent graphic slide of chaotic battle sketch with tangled spears, swords, and bodies in pitch black.",
          shot2: "Archival engraving of hoplites waking in panic and thrusting spears through tent canvas.",
          shot3: "Topographic camp diagram showing choke points where panicked soldiers crushed each other.",
          shot4: "Crimson splashes accenting the monochrome lines of terrified Greek faces.",
          shot5: "Title fragment stamps: 'CAOS EN PENUMBRA'. Heavy percussive cut."
        },
        {
          sceneTitle: "La Tragedia del Fuego Amigo",
          narration: "Más de una vez, hermanos de falange se degollaron mutuamente antes de descubrir que vestían la misma túnica.",
          soundEffects: "Lamento amargo al reconocer rostro hermano, espada cayendo al suelo",
          shot1: "Dramatic archival drawing of a hoplite holding torch over a dying comrade bearing the same shield crest.",
          shot2: "Torn chronicle page from Diodorus Siculus recording the catastrophic night skirmish of Syracuse.",
          shot3: "Monochrome sketch of two identical Spartan lambda shields splattered with fratricidal blood.",
          shot4: "Close-up of tear running down soot-covered Greek warrior face.",
          shot5: "Graphic stamp over bone-white paper: 'SANGRE HERMANA'. Sharp cut to black."
        },
        {
          sceneTitle: "La Empalizada de Carretas Volcadas",
          narration: "Para evitar masacres nocturnas, rodeaban el campamento con carretas volcadas y fosos llenos de estacas.",
          soundEffects: "Madera crujiendo al volcarse, estacas clavadas en tierra con mazas",
          shot1: "Archaeological reconstruction blueprint of ancient Greek field fortification (charax).",
          shot2: "Engraving of heavy supply wagons turned sideways with interlocking wheels creating barrier.",
          shot3: "Detail sketch of sharpened oak stakes (triboloi) planted in concealed ditches around perimeter.",
          shot4: "Cross-section showing defensive depth preventing cavalry and skirmisher sudden incursions.",
          shot5: "Title stamps: 'EL MURO IMPROVISADO'. Drum strike."
        },
        {
          sceneTitle: "El Recuento de Cadáveres a las Tres de la Mañana",
          narration: "A las tres de la madrugada, el recuento en voz baja revelaba camaradas caídos sin haber visto al enemigo.",
          soundEffects: "Nombres susurrados en lista militar, silencio tras ausencias definitivas",
          shot1: "Torn parchment roster with Greek names crossed out with heavy crimson brush strokes.",
          shot2: "Engraving of soldiers standing around covered stretchers in the cold drizzle.",
          shot3: "Silhouette of camp physician checking pulses by torchlight with somber shake of head.",
          shot4: "Monochrome sketch of soldiers quietly picking up the weapons of fallen tent-mates.",
          shot5: "Panel slams away. Stamp reads: 'AUSENCIAS EN LA NIEBLA'. Hard cut."
        }
      ]
    },
    {
      title: "Acto 5: La Privación Sensorial y los Delirios de Hades",
      clips: [
        {
          sceneTitle: "El Quiebre Neurológico tras Cinco Días",
          narration: "Tras cinco días con apenas noventa minutos de sueño diario, la mente hoplita comenzaba a desmoronarse.",
          soundEffects: "Zumbido sordo en los oídos, latidos distorsionados, respiración irregular",
          shot1: "Medical historical illustration of brain fatigue and psychotic breakdown caused by extreme military sleep deprivation.",
          shot2: "Torn engraving of warrior staring blankly ahead, pupils dilated with trembling hands.",
          shot3: "Timeline infographic showing progressive sensory collapse: tremors at 48 hours, hallucinations at 96 hours.",
          shot4: "Monochrome sketch of soldier chewing leather strap to suppress delirious mutterings.",
          shot5: "Bone-white paper strip stamps: 'MENTES QUEBRADAS'. Percussive cut to black."
        },
        {
          sceneTitle: "Los Tambores Alucinados de Hades",
          narration: "Muchos juraban escuchar en la bruma los tambores de Hades y los susurros de antepasados muertos en combate.",
          soundEffects: "Tambor lejano distorsionado con eco fantasmal, susurros guturales que se desvanecen",
          shot1: "Dark stylized engraving of mythological Underworld figures emerging from misty Peloponnesian forest.",
          shot2: "Torn manuscript of ancient Greek soldier superstitions recorded in folk battlefield chronicles.",
          shot3: "Monochrome sketch of hoplite covering ears with greaved hands to drown out phantom voices.",
          shot4: "Crimson shadow silhouettes marching across jagged rocky outcrop in eerie atmospheric light.",
          shot5: "Graphic stamp over textured paper: 'VOCES DEL INFRAMUNDO'. Heavy drum strike."
        },
        {
          sceneTitle: "Los Amuletos de Plomo Enterrados (Katadesmoi)",
          narration: "Enterraban pequeñas tablillas de plomo con inscripciones mágicas para que los dioses guardaran su alma al dormir.",
          soundEffects: "Tierra removida con la punta de una daga, raspado de metal sobre plomo blando",
          shot1: "Archaeological excavation photograph fragment of an authentic Greek curse and protection lead tablet (katadesmos).",
          shot2: "Macro view of scratched cursive Greek letters invoking Ares and Hermes Chthonios for nocturnal survival.",
          shot3: "Engraving of soldier burying the folded lead sheet under his shield before lying down.",
          shot4: "Topographic map indicating real archaeological sites where such military amulets were unearthed.",
          shot5: "Title fragment stamps: 'TABLILLAS DE PLOMO'. Snappy cut to black."
        },
        {
          sceneTitle: "El Cántico Gutural de los Veteranos",
          narration: "Los veteranos entonaban cánticos rítmicos en voz baja para evitar que los novatos cayeran en letargo mortal.",
          soundEffects: "Murmullo coral en tono grave, respiración acompasada, viento amortiguado",
          shot1: "Engraving of grizzled veteran hoplite leaning close to young recruit with encouraging hand on bronze shoulder.",
          shot2: "Torn musical papyrus showing ancient Greek rhythmic notations and war pean meters.",
          shot3: "Silhouette of ranks swaying gently in unison to maintain muscle blood flow without breaking formation.",
          shot4: "Monochrome sketch of rhythmic foot-tapping keeping circulation alive in numb toes.",
          shot5: "Bone-white paper strip stamps: 'EL CANTO DE RESISTENCIA'. Hard cut."
        },
        {
          sceneTitle: "La Parálisis del Sueño Atrapados en Bronce",
          narration: "Inmovilizados por el barro y las armaduras rígidas, sufrían parálisis del sueño sin poder moverse ni gritar.",
          soundEffects: "Jadeo agónico desesperado de quien no puede mover los pulmones, crujido de bronce inamovible",
          shot1: "High-contrast clinical drawing illustrating sleep paralysis exacerbated by heavy metallic body armor.",
          shot2: "Torn engraving of warrior pinned to mud by his own shield, eyes wide open in waking nightmare.",
          shot3: "Dark shadow figure towering over the helpless immobilized soldier in the pouring rain.",
          shot4: "Medical diagram showing diaphragm constriction under 30kg of bronze plate when muscle tone drops.",
          shot5: "Title fragment stamps: 'PESADILLA DE METAL'. Rhythmic impact."
        },
        {
          sceneTitle: "El Viento en los Escudos como Aullido de Guerra",
          narration: "El viento nocturno filtrado por las empuñaduras de bronce sonaba idéntico a las trompetas del ejército enemigo.",
          soundEffects: "Aullido agudo de viento atravesando orificios metálicos, sobresalto instantáneo",
          shot1: "Close-up macro illustration of the porpax and antilabe bronze shield fittings with wind vector arrows.",
          shot2: "Torn engraving of dozens of hoplites bolting upright simultaneously, hands instantly on spear shafts.",
          shot3: "Atmospheric landscape of bent olive trees whipping in cold gale under moonless night sky.",
          shot4: "Monochrome sketch of trembling spear tips trembling in the sentries' hands.",
          shot5: "Panel slams away. Stamp reads: 'ALARMA EN FALSO'. Hard cut to black."
        }
      ]
    },
    {
      title: "Acto 6: Ritos de Supervivencia y Juramentos de Sangre",
      clips: [
        {
          sceneTitle: "La Inspección de las Correas (Porpax)",
          narration: "Antes de tenderse sobre la tierra, cada soldado aceitaba las correas de cuero para que no se partieran.",
          soundEffects: "Cuero frotado con aceite de oliva, olor acre de grasa animal, tintineo de hebillas",
          shot1: "Engraving of hoplite applying olive oil from a clay alabastron to shield leather forearm bands (porpax).",
          shot2: "Technical diagram of the double-grip shield system that revolutionized Greek phalanx defense.",
          shot3: "Torn papyrus fragment describing military equipment maintenance regulations in classical Sparta.",
          shot4: "Close-up of stitched rawhide seams reinforced with bronze rivets.",
          shot5: "Title fragment stamps: 'EL LAZO DEL ESCUDO'. Sharp cut to black."
        },
        {
          sceneTitle: "El Juramento de Sangre del Protostates",
          narration: "El jefe de fila hacía jurar a sus hombres que, si moría durante la noche, otro empuñaría su aspis al alba.",
          soundEffects: "Juramento solemne en dórico, apretón de antebrazos con guanteletes de cuero",
          shot1: "Archival engraving of hoplite file leader (protostates) clasping forearms with second-rank warrior.",
          shot2: "Torn manuscript fragment of the Ephebic Oath adapted for front-line military survival.",
          shot3: "Monochrome sketch of blood drawn from palm and smeared onto the rim of the unit's lead shield.",
          shot4: "Silhouette of eight warriors standing in line with heads bowed in sacred covenant.",
          shot5: "Bone-white paper strip stamps: 'JURAMENTO AL ASPIS'. Rhythmic drum strike."
        },
        {
          sceneTitle: "El Sacrificio de la Cabra Negra a Medianoche",
          narration: "Los adivinos inspeccionaban hígados de cabras negras a la luz de brasas ocultas buscando augurios nocturnos.",
          soundEffects: "Balido breve apagado, brasas chisporroteando bajo ceniza, susurro sacerdotal",
          shot1: "Engraving of ancient Spartan mantis (seer) examining sacrificial liver (hieroskopia) over concealed brazier.",
          shot2: "Anatomical drawing of liver lobes with crimson annotations indicating military omens of disaster.",
          shot3: "Torn historical chronicle recounting the Spartan refusal to advance when nocturnal omens were unfavorable.",
          shot4: "Monochrome sketch of dark blood poured silently into trench dug between tent rows.",
          shot5: "Graphic stamp over dark paper: 'AUGURIO DE SANGRE'. Heavy cut."
        },
        {
          sceneTitle: "Aceite Animal en las Puntas de Hierro",
          narration: "Untaban grasa de cerdo en las puntas de las lanzas para que el rocío de la madrugada no oxidara el hierro.",
          soundEffects: "Fricción de trapo untando grasa sobre metal, filo raspando piedra de afilar",
          shot1: "Macro close-up of iron dory spearhead gleaming under dim lantern reflection with grease coating.",
          shot2: "Cross-section comparison of oxidized brittle iron versus protected tempered steel tips.",
          shot3: "Torn engraving of camp blacksmiths repairing bronze counterweights (sauroter) at edge of camp.",
          shot4: "Historical museum artifact photo fragment of 4th century BC spear socket with preserved wood shaft.",
          shot5: "Title fragment stamps: 'HIERRO ACEITADO'. Sharp cut to black."
        },
        {
          sceneTitle: "El Racionamiento de la Hydria de Bronce",
          narration: "El agua era racionada a dos sorbos por hombre; derramar una gota en el barro se castigaba con el látigo.",
          soundEffects: "Agua vertida en copa de barro gota a gota, trago seco y anhelado en garganta seca",
          shot1: "Archival engraving of heavy bronze hydria water vessel with measuring ladle sliding into frame.",
          shot2: "Monochrome sketch of parched hoplites waiting in silent queue, eyes fixed on the water measure.",
          shot3: "Torn chronicle detail regarding water scarcity during the siege of Pylos and Sphacteria.",
          shot4: "Close-up of cracked lips kissing the rim of terracotta drinking kylix.",
          shot5: "Bone-white paper strip stamps: 'DOS SORBOS DE VIDA'. Percussive cut."
        },
        {
          sceneTitle: "El Lazo Entre Muñecas: El Pacto de la Vigilia",
          narration: "Ataban una cuerda entre las muñecas de dos compañeros: el menor temblor despertaba al compañero al instante.",
          soundEffects: "Tirón seco de cuerda de cáñamo, respiración que se alerta, mirada cómplice en la oscuridad",
          shot1: "Macro drawing of coarse hemp rope binding the wrists of two sleeping soldiers resting side-by-side.",
          shot2: "Engraving of one soldier jolting awake as the cord twitches from an approaching footstep.",
          shot3: "Torn archival text fragment celebrating the sacred brotherhood of the Spartan military mess (syssitia).",
          shot4: "Silhouette of two hoplites standing back-to-back in united defensive stance.",
          shot5: "Panel slams away. Stamp reads: 'EL PACTO DE LA CUERDA'. Hard cut to black."
        }
      ]
    },
    {
      title: "Acto 7: La Hora Más Fría Antes del Alba",
      clips: [
        {
          sceneTitle: "El Desplome Térmico de las Cuatro de la Madrugada",
          narration: "Hacia las cuatro y media de la madrugada, la temperatura tocaba fondo helando el rocío sobre las corazas.",
          soundEffects: "Viento glacial cortante, escarcha resquebrajándose sobre metal, castañeo de dientes",
          shot1: "Topographic landscape of Greek mountain valley engulfed in thick freezing white mist sliding into frame.",
          shot2: "Engraving of hoplites covered in thin film of white hoarfrost across their cloaks and bronze greaves.",
          shot3: "Ancient weather record correlation with hypothermia casualties in Peloponnesian winter wars.",
          shot4: "Close-up of frost crystals forming on the horsehair crest of an officer's helmet.",
          shot5: "Bone-white paper strip stamps: 'EL DESCENSO TÉRMICO'. Sharp rhythmic cut."
        },
        {
          sceneTitle: "La Niebla como Manto de Infiltración",
          narration: "La bruma espesa borraba las siluetas de las colinas, el momento predilecto para los arqueros enemigos.",
          soundEffects: "Silbido de flecha invisible cortando la niebla, chasquido sordo al clavarse en madera de escudo",
          shot1: "Dense white mist particle animation rolling across near-monochrome paper background.",
          shot2: "Engraving of Persian composite archers loosing black-fletched arrows blindly into the fog-shrouded camp.",
          shot3: "Torn tactical plan showing how terrain depression trapped fog directly inside Greek positions.",
          shot4: "Monochrome sketch of arrows protruding at steep angles from overturned wagons and dirt ramparts.",
          shot5: "Title fragment stamps: 'FLECHAS EN LA BRUMA'. Percussive drum beat."
        },
        {
          sceneTitle: "El Crujido de las Articulaciones Agarrotadas",
          narration: "Al intentar incorporarse, las articulaciones crujían ruidosamente tras ocho horas inmóviles sobre roca pura.",
          soundEffects: "Crujido óseo sordo, gemido contenido de dolor articular, fricción de bronce",
          shot1: "Anatomical engraving of knee and hip joints locked in extreme rigidity after overnight hypothermia.",
          shot2: "Torn manuscript of Greek military surgeons treating acute muscular sprains before battle.",
          shot3: "Silhouette of hoplites helping each other up by pulling on shield rims and spear hafts.",
          shot4: "Crimson highlighting tracking pain receptors along the lumbar spine and cervical vertebrae.",
          shot5: "Graphic stamp over parchment: 'HUESOS DE PIEDRA'. Snappy cut to black."
        },
        {
          sceneTitle: "El Raspado de la Escarcha en la Letra Lambda",
          narration: "Raspaban con la daga la escarcha sobre la letra Lambda del escudo para que el enemigo viera a quién enfrentaba.",
          soundEffects: "Hoja de hierro raspando hielo sobre bronce, sonido metálico agudo",
          shot1: "Dramatic macro close-up of Spartan scarlet Lambda symbol (Λ) covered in white ice crystals.",
          shot2: "Dagger blade violently scraping frost away to reveal the gleaming blood-red lacquer on bronze.",
          shot3: "Historical museum artifact photograph of genuine Spartan shield with stamped Greek identification marks.",
          shot4: "Engraving of proud veteran wiping the shield clean with his woollen sleeve.",
          shot5: "Bone-white paper strip stamps: 'LA LAMBDA DE ESPARTA'. Heavy drum strike."
        },
        {
          sceneTitle: "El Primer Claror en el Horizonte Oriental",
          narration: "El cielo oriental comenzaba a teñirse de gris pálido; los centinelas sabían que la vigilia había terminado.",
          soundEffects: "Canto lejano de ave rapaz, cese repentino del viento helado, respiración de alivio",
          shot1: "Engraving of distant horizon through Greek mountain peaks with pale horizontal dawn gradient.",
          shot2: "Torn chronicle excerpt from Xenophon describing the immense psychological relief of morning twilight.",
          shot3: "Silhouettes of sentries lowering their dory spears from ready position to upright rest.",
          shot4: "Monochrome sketch of soldiers exhaling steam plumes in the freezing morning light.",
          shot5: "Title fragment stamps: 'EL FIN DE LA NOCHE'. Sharp rhythmic transition."
        },
        {
          sceneTitle: "El Trompeteo Lejano del Cuerno Enemigo",
          narration: "Pero antes de que pudieran respirar, el cuerno de guerra enemigo bramó en el desfiladero anunciando el choque.",
          soundEffects: "Bramido profundo y ensordecedor de cuerno de guerra en el cañón, eco prolongado",
          shot1: "Violent graphic slide of an ancient curved bronze carnyx / war horn echoing in mountain pass.",
          shot2: "Torn map showing enemy vanguard deploying across the plain two stadia away from camp.",
          shot3: "Engraving of Greek soldiers snapping their heads in unison toward the sound of battle.",
          shot4: "Crimson shockwaves pulsing across the screen with each blast of the war trumpet.",
          shot5: "Screen slams into black with single bone-white strip: 'EL CLAMOR DE GUERRA'. Heavy cut."
        }
      ]
    },
    {
      title: "Acto 8: El Despertar de la Falange y el Veredicto Histórico",
      clips: [
        {
          sceneTitle: "La Salpinx de Bronce y la Alarma General",
          narration: "El toque estridente de la salpinx quebró el alba: noventa segundos para formar la falange completa.",
          soundEffects: "Toque agudo y penetrante de trompeta salpinx griega, estruendo de armaduras en movimiento",
          shot1: "Engraving of Spartan trumpeter holding long straight bronze salpinx with flaring bell to the sky.",
          shot2: "Massive dynamic animation of soldiers leaping from the dirt and grabbing weapons in coordinated frenzy.",
          shot3: "Torn tactical drill manual from Spartan training schools prescribing instant phalanx assembly.",
          shot4: "Close-up of leather greave buckles snapped tight in rapid motion.",
          shot5: "Bone-white paper strip stamps: 'NOVENTA SEGUNDOS'. Fast percussive cut."
        },
        {
          sceneTitle: "El Encaje de los Escudos: El Muro de Bronce",
          narration: "Hombro con hombro, ochocientos escudos de bronce encajaron formando una muralla impenetrable.",
          soundEffects: "Estruendo masivo de bronce chocando con bronce: CLANG, CLANG, CLANG",
          shot1: "Overhead view illustration of the dense hoplite phalanx locking shields with half-overlap (synaspismos).",
          shot2: "Engraving of front-rank spears dropping forward into horizontal bristling hedgehog formation.",
          shot3: "Tactical depth diagram showing eight solid ranks pressing forward with shields behind shields.",
          shot4: "Crimson highlight bar representing the kinetic mass of the Greek battle line.",
          shot5: "Heavy graphic impact stamp: 'LA MURALLA DE BRONCE'. Deep drum slam."
        },
        {
          sceneTitle: "La Evidencia Forense de Queronea",
          narration: "Los esqueletos hallados en Queronea muestran vértebras comprimidas por dormir con armadura durante campañas enteras.",
          soundEffects: "Crujido forense de hueso antiguo, cámara fotográfica arqueológica disparando",
          shot1: "High-resolution archaeological forensic excavation photograph of hoplite skeleton in mass grave.",
          shot2: "Medical anatomical diagram highlighting severe compression fractures in lumbar and cervical vertebrae.",
          shot3: "Torn scientific report from the British School at Athens detailing physical trauma of Greek soldiers.",
          shot4: "Comparison sketch between modern human spine and the hypertrophied, damaged bones of ancient hoplites.",
          shot5: "Title fragment stamps: 'EVIDENCIA EN EL HUESO'. Sharp cut to black."
        },
        {
          sceneTitle: "El Cántico del Peán Reemplazando el Agotamiento",
          narration: "El peán a Apolo resonó en miles de gargantas: la adrenalina borró semanas de agotamiento en un segundo.",
          soundEffects: "Cántico coral masivo de guerra en griego antiguo: ¡ELELEU! ¡ELELEU! ¡PEÁN!",
          shot1: "Engraving of hundreds of hoplites chanting with open mouths, eyes blazing with combat frenzy.",
          shot2: "Torn manuscript fragment of the ancient battle hymn chanted before the clash at Marathon.",
          shot3: "Dynamic camera track along the front rank as spears shake in rhythm with the stomping feet.",
          shot4: "Crimson banners whipping violently in the morning wind.",
          shot5: "Bone-white paper strip stamps: 'EL HIMNO DE SANGRE'. Rhythmic drum roll."
        },
        {
          sceneTitle: "La Persecución en los Olivares",
          narration: "Al ceder la vanguardia enemiga, los hoplitas avanzaron al trote asegurando el paso montañoso antes del mediodía.",
          soundEffects: "Sandalias de cuero corriendo sobre piedras calizas, lanzas golpeando escudos en señal de triunfo",
          shot1: "Dynamic tracking shot of Greek infantry column advancing through sunlit olive groves.",
          shot2: "Torn tactical survey showing retreating Persian detachments scattering into the foothills.",
          shot3: "Monochrome sketch of hoplite scouts climbing high boulders to signal clear path to the main host.",
          shot4: "Crimson directional arrows sweeping across ancient topographical map of Boeotia.",
          shot5: "Bone-white paper strip stamps: 'EL AVANCE TOTAL'. Fast percussive cut."
        },
        {
          sceneTitle: "El Veredicto de la Arqueología de Esparta",
          narration: "Las fosas excavadas en Laconia revelan el precio biológico: fémures hipertrofiados y fracturas por estrés crónico de vigilia.",
          soundEffects: "Disparo de cámara fotográfica forense, raspado de instrumental en laboratorio",
          shot1: "High-resolution archaeological forensic excavation photograph of Spartan hoplite grave.",
          shot2: "Medical diagram showing bone remodeling (Wolff's law) caused by continuous load-bearing.",
          shot3: "Torn scientific bioarchaeology report validating Xenophon's accounts of severe physical toll.",
          shot4: "Comparison between civic Athenian skeletal remains and the militarized Spartan bone density.",
          shot5: "Title fragment stamps: 'REGISTRO FORENSE'. Sharp drum hit."
        }
      ]
    },
    {
      title: "Acto 9: La Paz en las Sombras, La Leyenda de Laconia & El Juicio de la Historia",
      clips: [
        {
          sceneTitle: "El Retorno a las Cenizas del Campamento",
          narration: "Al caer la tarde posterior al combate, los supervivientes regresaban al campamento para despojar a sus camaradas caídos.",
          soundEffects: "Viento solemne agitando telas de carpas rasgadas, pasos pesados de botas en tierra seca",
          shot1: "Wide atmospheric engraving of deserted military camp at dusk with smoke rising from extinguished hearths.",
          shot2: "Torn manuscript fragment detailing the Spartan law on returning shields to families: 'With it or on it'.",
          shot3: "Silhouette of veteran hoplite collecting bronze greaves and helmet of fallen tent-mate.",
          shot4: "Macro view of bloodstained linen tunic folded with Spartan military precision.",
          shot5: "Bone-white paper strip stamps: 'EL RETORNO AL BIVUAC'. Percussive drum roll."
        },
        {
          sceneTitle: "El Reparto del Botín de Hierro y Bronce",
          narration: "Las armas capturadas se consagran en Delfos y Olimpia; el hierro del invasor se fundía para forjar nuevos trípodes sagrados.",
          soundEffects: "Martillazo de herrero en forja lejana, bronce fundido siseando en moldes de arcilla",
          shot1: "Archival engraving of ancient Greek sanctuary at Delphi with bronze trophies hung along temple walls.",
          shot2: "Torn dedicatory inscription in archaic Doric Greek dedicating enemy armaments to Apollo.",
          shot3: "Monochrome drawing of blacksmiths smelting captured swords into votive offerings.",
          shot4: "Close-up of commemorative bronze plaque with incised battle dates.",
          shot5: "Title fragment stamps: 'EL BRONCE CONSAGRADO'. Sharp drum strike."
        },
        {
          sceneTitle: "La Marca Psicológica de la Guerra Antigua",
          narration: "Años después del combate, los veteranos seguían despertando sobresaltados en medio de la noche buscando sus lanzas en la oscuridad.",
          soundEffects: "Respiración agitada de anciano despertando en tinieblas, mano temblorosa tanteando la pared",
          shot1: "Medical illustration on historical post-traumatic stress in ancient Greek hoplite literature.",
          shot2: "Torn chronicle page from Herodotus recording blindness and hallucinations suffered by Marathon veterans.",
          shot3: "Monochrome sketch of an aged Greek warrior staring into fireplace with distant haunted gaze.",
          shot4: "Close-up of scarred weathered hand gripping a staff as if it were a dory spear.",
          shot5: "Graphic stamp over dark paper: 'LA SOMBRA DEL COMBATE'. Heavy percussive drop."
        },
        {
          sceneTitle: "La Tumba de los Espartanos en el Paso",
          narration: "Sobre los túmulos funerarios no se escribían lamentos: solo el epitafio sobrio recordando que cumplieron la ley hasta el final.",
          soundEffects: "Viento silbando sobre estela de piedra en la montaña, silencio reverente",
          shot1: "High-contrast photograph of excavated stone monument at ancient mountain pass.",
          shot2: "Torn epigram of Simonides incised in ancient stone: 'Go tell the Spartans, passerby...'.",
          shot3: "Silhouette of single olive branch resting upon sun-warmed limestone slab.",
          shot4: "Subtle pulsing grain effect over Greek marble funerary stele.",
          shot5: "Bone-white paper strip stamps: 'LA LEY CUMPLIDA'. Snappy transition."
        },
        {
          sceneTitle: "La Victoria Decidida en la Noche",
          narration: "La historia creyó que ganaban por la fuerza de sus lanzas, pero vencían porque sabían sobrevivir a la noche.",
          soundEffects: "Eco de batalla que se desvanece lentamente en el viento, campanada lejana",
          shot1: "Slow motion collage of charging phalanx dissolving into antique monochrome map of ancient battlefields.",
          shot2: "Torn philosophical quote from Thucydides about the true nature of Spartan military endurance.",
          shot3: "Engraving of an aged hoplite standing victorious amidst dust with dented shield resting on the ground.",
          shot4: "Subtle pulsing grain effect over antique marble statue of King Leonidas.",
          shot5: "Crimson text stamp: 'LA BATALLA INVISIBLE'. Heavy drum strike."
        },
        {
          sceneTitle: "El Veredicto Final: El Arte de No Dormir",
          narration: "Para los guerreros de Grecia, dormir no era descansar: era ganar la batalla más silenciosa de la guerra.",
          soundEffects: "Viento solemne en el valle desierto, tambor ritual final, silencio reverente",
          shot1: "Monumental final composition over deep black background. Aged bronze shield centered in frame.",
          shot2: "Torn bone-white archival paper strip stamps firmly across the center: 'EL ARTE DE NO DORMIR'.",
          shot3: "Crimson wax seal stamps: 'INVESTIGACIÓN HISTÓRICA'.",
          shot4: "Camera slowly pulls back into total blackness as the last candle wick smokes and extinguishes.",
          shot5: "Single sharp percussive drum heartbeat. Hard cut to pure black."
        }
      ]
    },
    {
      title: "Acto 10: La Evidencia Arqueológica y el Juicio Inmortal de la Historia",
      clips: [
        {
          sceneTitle: "Las Excavaciones Forenses en Queronea y Laconia",
          narration: "En el siglo XXI, antropólogos forenses desentierran esqueletos hoplitas revelando microtraumas vertebrales por vigilia extrema.",
          soundEffects: "Pinceles arqueológicos barriendo tierra seca sobre hueso antiguo, cámara fotográfica disparando",
          shot1: "High-resolution forensic macro of ancient hoplite spinal vertebrae displaying chronic sleep-deprivation trauma.",
          shot2: "Torn scientific bioarchaeology report from the British School at Athens validating ancient military texts.",
          shot3: "Monochrome sketch comparing normal civilian bone structure with hypertrophied Spartan warrior remains.",
          shot4: "Crimson highlight box framing the radiographic evidence of bone remodeling under heavy armor load.",
          shot5: "Bone-white paper strip stamps: 'EVIDENCIA EN EL HUESO'. Percussive drum roll."
        },
        {
          sceneTitle: "El Escudo de Bronce en las Vitrinas del Mundo",
          narration: "Los escudos de tres capas reposan en vitrinas de museos, conservando las abolladuras de noches enteras en campaña.",
          soundEffects: "Ambiente solemne de museo con eco de pasos lentos sobre mármol pulido",
          shot1: "Slow tracking shot of museum glass case displaying authentic excavated Spartan bronze aspis with deep dents.",
          shot2: "Torn museum catalogue document describing the wood, rawhide and bronze laminate engineering.",
          shot3: "Macro view of oxidized verdigris bronze bearing scratches from iron blades and gravelly soil.",
          shot4: "Monochrome photograph of archaeologists measuring the exact convex curvature of the shield.",
          shot5: "Title fragment stamps: 'EL BRONCE IMPERECEDERO'. Sharp drum hit."
        },
        {
          sceneTitle: "La Tumba Monumental en el Paso de las Termópilas",
          narration: "Sobre la roca viva del paso montañoso, la famosa inscripción recuerda que aquellos hombres cumplieron su ley militar sin dudar.",
          soundEffects: "Viento solemne silbando a través del desfiladero rocoso, silencio reverente",
          shot1: "Atmospheric wide engraving of the mountain pass at Thermopylae with morning light cutting through mist.",
          shot2: "Torn Greek epigram stone rubbing of Simonides: 'Caminante, ve a decir a los espartanos...'.",
          shot3: "Silhouette of a solitary olive tree standing steadfast on the limestone ridge against the clouds.",
          shot4: "Pulsing archival film grain texture across weathered marble commemorative stele.",
          shot5: "Bone-white paper strip stamps: 'LA LEY CUMPLIDA'. Snappy rhythmic cut."
        },
        {
          sceneTitle: "La Doctrina Militar Heredada por los Siglos",
          narration: "Desde las legiones romanas hasta las fuerzas especiales modernas, la resistencia nocturna de Grecia moldeó la táctica universal.",
          soundEffects: "Eco de marcha rítmica que se funde en la distancia temporal, redoble de tambor",
          shot1: "Dynamic split montage comparing Spartan phalanx sentry discipline with subsequent historical military doctrines.",
          shot2: "Torn manual excerpts from Roman military treatises adopting hoplite bivouac alert rules.",
          shot3: "Engraving of tactical commanders throughout history studying the psychological stamina of ancient infantry.",
          shot4: "Crimson timeline arrows sweeping from 480 BC to modern military academies.",
          shot5: "Graphic stamp over dark paper: 'LECCIÓN UNIVERSAL'. Heavy percussive drop."
        },
        {
          sceneTitle: "El Silencio que Decidió las Guerras",
          narration: "La gloria de Esparta no residía en la furia de sus lanzas, sino en su capacidad sobrehumana de soportar la noche de pie.",
          soundEffects: "Viento desvaneciéndose en el valle del Peloponeso, sonido profundo de cuerno solemne",
          shot1: "Majestic composition over deep black halftone: bronze Spartan helmet centered under dramatic key light.",
          shot2: "Torn archival manuscript page of Thucydides highlighting the quiet endurance that won the campaign.",
          shot3: "Camera slowly tracks in on the aged crest of horsehair and bronze battered in battle.",
          shot4: "Crimson ink bleed radiating outward across authentic ancient cartography of the Peloponnese.",
          shot5: "Title fragment stamps firmly across center: 'EL VIGILANTE ETERNO'. Deep drum slam."
        },
        {
          sceneTitle: "El Veredicto Final: La Victoria de la Noche",
          narration: "Para los soldados de la antigüedad, dormir no era rendirse al descanso: era dominar la prueba más despiadada de la historia.",
          soundEffects: "Tambor ritual final rotundo, campana lejana solemne, corte seco a silencio absoluto",
          shot1: "Monumental final visual composition: dark textured background with Spartan Lambda symbol gleaming in crimson.",
          shot2: "Torn bone-white archival paper strip stamps across the center: 'INVESTIGACIÓN HISTÓRICA'.",
          shot3: "Archival chronicle seal stamps firmly on the frame.",
          shot4: "The image slowly recedes into pure black as the last ember in the military hearth goes cold.",
          shot5: "Single sharp resonant bass drum strike. Snappy hard cut to black."
        }
      ]
    }
  ];

  let clipCounter = 1;
  const chapters: FlowChapter[] = actDefinitions.map((actDef, actIndex) => {
    const actNumber = actIndex + 1;
    const startMin = actIndex;
    const endMin = actIndex + 1;

    const clips: FlowClip[] = actDef.clips.map((clipData) => {
      const clipStartSec = startMin * 60 + (clipCounter - 1 - actIndex * 6) * 10;
      const clipEndSec = clipStartSec + 10;
      const formatTime = (s: number) => {
        const m = Math.floor(s / 60).toString().padStart(2, '0');
        const sec = (s % 60).toString().padStart(2, '0');
        return `${m}:${sec}`;
      };
      const timeRange = `${formatTime(clipStartSec)} - ${formatTime(clipEndSec)}`;

      const flowPrompt = `Documentary motion collage / animated newspaper collage sequence, exactly 10 seconds, 16:9, 24fps. Continuous clip ${clipCounter} of 60 (Act ${actNumber}: ${actDef.title} — Scene: "${clipData.sceneTitle}").\nVOICE PROFILE / NARRATOR TONE: 50-year-old male narrator, deep, mature, resonant and raspy voice. Mysterious and cinematic BBC documentary tone.\nSYNCHRONIZED VOICEOVER NARRATION (Audio for this 10s Clip):\n"${clipData.narration}"\nSCENE VISUAL SYNC: The 5 motion shots below directly illustrate this precise moment of the chronicle.\nGLOBAL VISUAL STYLE: dark premium folklore documentary aesthetic, near-monochrome noir grade, deep black backgrounds, bone-white and aged sepia paper tones, single saturated blood-red accent colour. Heavy halftone print-dot texture, subtle pulsing film grain, scratched archival paper, rough torn newspaper edges, historical Greek engravings, antique Mediterranean terrain maps, archaeological documents. Fast aggressive lateral slides, hard graphic cuts, locked-off camera with dramatic push-ins. Snappy percussive editing rhythm.\nSHOT 1 — 0.0–2.0s: ${clipData.shot1}\nSHOT 2 — 2.0–4.5s: ${clipData.shot2}\nSHOT 3 — 4.5–6.5s: ${clipData.shot3}\nSHOT 4 — 6.5–8.2s: ${clipData.shot4}\nSHOT 5 — 8.2–10.0s: ${clipData.shot5}`;

      const clipObj: FlowClip = {
        clipNumber: clipCounter,
        timeRange: timeRange,
        googleFlowPrompt: flowPrompt,
        voiceoverSegmentSpanish: clipData.narration,
        shots: [
          { shotId: "SHOT 1", seconds: "0.0–2.0s", visualAction: clipData.shot1, narrationSnippet: clipData.narration.slice(0, 30) + "..." },
          { shotId: "SHOT 2", seconds: "2.0–4.5s", visualAction: clipData.shot2, narrationSnippet: "..." },
          { shotId: "SHOT 3", seconds: "4.5–6.5s", visualAction: clipData.shot3, narrationSnippet: "..." },
          { shotId: "SHOT 4", seconds: "6.5–8.2s", visualAction: clipData.shot4, narrationSnippet: "..." },
          { shotId: "SHOT 5", seconds: "8.2–10.0s", visualAction: clipData.shot5, narrationSnippet: "[Impacto percusivo de tambor]" }
        ],
        soundEffects: clipData.soundEffects
      };
      clipCounter++;
      return clipObj;
    });

    return {
      chapterNumber: actNumber,
      chapterTitle: actDef.title,
      timestamp: `${startMin < 10 ? '0' : ''}${startMin}:00 - ${endMin < 10 ? '0' : ''}${endMin}:00`,
      clips: clips
    };
  });

  return {
    documentaryTitle: "EL REPOSO DE LOS GUERREROS: CÓMO DORMÍAN LOS SOLDADOS GRIEGOS",
    historicalTopic: "Cómo dormían los soldados griegos en las guerras de la antigüedad",
    estimatedDuration: "10 Minutos (10 Actos de 60s)",
    fullScriptCastilian: "Bajo la noche del Peloponeso, el silencio no era un refugio, sino una sentencia de muerte. Los hoplitas espartanos jamás se despojaban de sus corazas de bronce para descansar en campaña militar. La tierra húmeda y las piedras afiladas constituían su único lecho bajo el cielo helado, con el aspis de madera como improvisada almohada. Para no morir de hipotermia, se agrupaban en filas de cinco hombres compartiendo mantos empapados, mientras los centinelas vigilaban bajo pena de muerte inmediata si cerraban los ojos. El terror a las incursiones nocturnas y el combate ciego entre hermanos sembraban una tensión intolerable antes del amanecer. La historia creyó que ganaban por la fuerza de sus lanzas, pero vencían porque sabían sobrevivir a la propia noche.",
    totalClips: 60,
    dynamicRelatedTopics: [
      { label: "🥩 Asedio de Antioquía: Comida Prohibida", topic: "La comida de pesadilla y canibalismo silenciado de los cruzados en el asedio de Antioquía" },
      { label: "❄️ Armaduras Teutónicas en el Hielo", topic: "El peso y ahogamiento de los caballeros teutónicos bajo el lago helado de Peipus" },
      { label: "💀 Cirugía de Cráneo en Roma Antigua", topic: "La trepanación y cirugías sin anestesia en los campamentos de legionarios romanos" },
      { label: "🗡️ Guardia Varega y sus Castigos", topic: "Los rituales secretos de castigo y sangre de la guardia varega en Constantinopla" },
      { label: "🛡️ Escudos de Piel y Sangre Espartana", topic: "Los secretos oscuros de fabricación de los aspis espartanos con capas de piel animal y bronce" }
    ],
    chapters: chapters
  };
}

export const INITIAL_FLOW_DOC: FlowDocumentary = createGreekSoldiers8MinDoc();

export const INITIAL_POV_SHORT: POVShort = {
  title: "POV: Eres el último guardia en los túneles subterráneos de Constantinopla (1453)",
  durationSeconds: 25,
  concept: "Durante el asedio final de Constantinopla en 1453, bajas solo a los túneles subterráneos para escuchar si los zapadores otomanos están cavando... pero descubres algo mucho peor.",
  historicalFactBehind: "En el asedio de 1453, los bizantinos usaban cuencos de agua colocados en el suelo para detectar las vibraciones de los zapadores enemigos excavando bajo las murallas.",
  twistEnding: "Al romper la última roca esperando soldados enemigos con picos, descubres una cámara sellada hace mil años... y las siluetas en la penumbra no son humanas, estaban arañando para salir.",
  hookFirst3Sec: "POV: NUNCA DEBISTE QUEDARTE SOLO EN LA GUARDIA SUBTERRÁNEA",
  dynamicRelatedTopics: [
    { label: "🏰 Constantinopla: Los Túneles Prohibidos", scenario: "POV: Eres el último guardia en los túneles subterráneos de Constantinopla, 1453" },
    { label: "⚰️ La Peste Negra: El Convento en Ruinas", scenario: "POV: Eres un médico de la peste negra visitando un convento en 1348 y las monjas están en el techo" },
    { label: "⛰️ Esparta: La Cueva del Monte Taigeto", scenario: "POV: Eres un guerrero espartano buscando a un niño en las cuevas del monte Taigeto y despiertas a lo que vive allí" },
    { label: "⚔️ Normandía 1066: El Pantano de la Muerte", scenario: "POV: Eres un soldado herido abandonado en el pantano tras Hastings y las criaturas despiertan" },
    { label: "🗡️ Los Templarios: La Cripta Maldita", scenario: "POV: Eres el novicio encargado de cerrar la cripta del templo y algo empuja la puerta desde abajo" }
  ],
  scenes: [
    {
      sceneNumber: 1,
      timestamp: "0:00 - 0:06",
      povVisual: "First person POV vertical 9:16, cámara en mano temblorosa bajando una angosta escalera de caracol de piedra húmeda iluminada solo por una antorcha chisporroteante.",
      googleFlowPrompt: "First person POV looking down spiraling damp stone medieval stairs, holding torch, deep shadows, 9:16 vertical ratio, cinematic dark atmosphere, camera shake.",
      textOnScreen: "POV: Eres el último vigía en los túneles de Constantinopla (1453)",
      audioAmbience: "Goteo de agua continuo, respiración jadeante del protagonista, eco de pasos sobre piedra.",
      narration: "Nos dijeron que bajáramos a comprobar si los zapadores cavaban bajo la muralla..."
    },
    {
      sceneNumber: 2,
      timestamp: "0:06 - 0:13",
      povVisual: "Mano temblorosa apoyando un cuenco de bronce lleno de agua sobre la tierra mojada. Ondas concéntricas vibran con violencia cada pocos segundos.",
      googleFlowPrompt: "POV looking down at brass bowl of water on dungeon dirt floor vibrating violently with seismic waves, torchlight, 9:16 vertical ratio, hyper-realistic dark texture.",
      textOnScreen: "El cuenco no deja de vibrar...",
      audioAmbience: "Golpes secos y metálicos que retumban en la pared de roca: CLANG... CLANG...",
      narration: "El cuenco vibraba cada tres segundos. Pero los golpes no venían de enfrente... venían de adentro del muro."
    },
    {
      sceneNumber: 3,
      timestamp: "0:13 - 0:20",
      povVisual: "Brazos en primera persona balanceando un pico de hierro con desesperación contra una fisura en el muro de mampostería. Piedras caen al suelo en una nube de polvo.",
      googleFlowPrompt: "POV swinging medieval heavy iron pickaxe smashing dark damp subterranean stone wall, stone chips flying, torch illumination, dramatic shadows, 9:16 vertical.",
      textOnScreen: "Rompimos la última roca...",
      audioAmbience: "Impacto metálico brutal contra piedra, respiración sofocada, polvo cayendo, silencio absoluto y repentino.",
      narration: "Rompimos la pared para sorprenderlos... pero el ruido se detuvo en seco."
    },
    {
      sceneNumber: 4,
      timestamp: "0:20 - 0:25 (EL GIRO FINAL HORRIBLE)",
      povVisual: "La luz de la antorcha revela una inmensa catacumba sellada desde el exterior. Docenas de figuras humanoides alargadas, sin ojos y con piel apergaminada, giran la cabeza hacia la cámara y corren desquiciadas contra la pantalla.",
      googleFlowPrompt: "Horrific sudden reveal POV, torch illuminating towering shadowy elongated non-human figures in deep subterranean ancient vault turning heads toward viewer, terrifying dark folklore atmosphere, sudden motion blur sprint towards lens, 9:16 vertical ratio.",
      textOnScreen: "NO ERAN HERRAMIENTAS... ERAN ARAÑAZOS PARA SALIR",
      audioAmbience: "Chillido agudo desgarrador, antorcha cae al barro con siseo apagándose en negro total.",
      narration: "No eran soldados cavando para entrar... querían que les abriéramos desde afuera."
    }
  ],
  pinnedCommentStrategy: "¿Habrías corrido o te habrías quedado a sellar la pared? Deja tu comentario y te cuento qué dice la crónica secreta de 1453.",
  soundRecommendation: "Dark slowed ambience con latido de corazón acelerado que se apaga bruscamente en el segundo 20 con un screamer sordo."
};
