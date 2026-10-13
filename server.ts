import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  buildAntiochSiegeDocumentary,
  buildTeutonicLakePeipusDocumentary,
  buildUniversalHistoricalDocumentary
} from './src/data/historicalChronicles';
import { INITIAL_FLOW_DOC } from './src/data/mockTemplates';
import { translateTextToCinematicEnglishFallback } from './src/utils/translator.js';
import {
  generateCoherent9MinuteDocumentary,
  buildIntelligentTopicDocumentary,
  enforce10SecondVoiceover
} from './server/documentaryEngine.js';
import {
  loadMembershipDb,
  saveMembershipDb,
  getOrCreateUser,
  activateKeyForUser,
  generateKeys,
  adminUpdateUser,
  adminDeleteUser,
  adminDeleteKey,
  getQrSettings,
  updateQrSettings,
  getPendingPayments,
  createPaymentNotification,
  approvePaymentNotification,
  rejectPaymentNotification,
  getUserSavedProjects,
  saveUserProject,
  deleteUserProject
} from './server/membershipStore.js';
import { ADMIN_EMAIL } from './src/types/membership.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Dynamically obtain GoogleGenAI client with the active key
export function getAiClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  return apiKey ? new GoogleGenAI({ apiKey }) : new GoogleGenAI();
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '20mb' }));

// Helper to safely parse JSON from Gemini text response
function safeParseJson(text: string | null | undefined, fallback: any) {
  if (!text) return fallback;
  try {
    const cleaned = text
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '');
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn('JSON parse failed, attempting regex extraction:', e);
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch (e2) {
      console.warn('Regex JSON extraction also failed:', e2);
    }
    return fallback;
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!getGeminiApiKey(),
    creator: 'Olvis Bolt',
    time: new Date().toISOString(),
  });
});

// Smart Search Suggestions endpoint
app.post('/api/search-suggestions', async (req, res) => {
  try {
    const { query, type = 'content' } = req.body;
    if (!query) {
      return res.json({ suggestions: [] });
    }

    if (!getGeminiApiKey()) {
      return res.json({ suggestions: getDynamicSuggestions(query, type) });
    }

    const prompt = `
Eres un analista de tendencias virales para el creador "Olvis Bolt" (YouTube y Facebook).
El creador busca sobre: "${query}" para el formato: "${type === 'documentary' ? 'Historias y Documentales de 10 minutos (10 actos de 60s)' : type === 'pov' ? 'Historias Cortas (Shorts) POV de 20-30s' : 'Gaming / Vlogs / Tendencias'}".

Genera exactamente 5 sugerencias de títulos/ideas ultra llamativas y específicas que nadie más esté haciendo basadas ESTRICTAMENTE en la palabra clave: "${query}".
REGLAS:
- Si la búsqueda es de shooters o Fortnite, habla EXCLUSIVAMENTE de shooters, FPS, puntería y trucos de juego. ¡NUNCA menciones comprar jugadores, fútbol o FC Mobile!
- Si la búsqueda es de viajes, habla de rutas, mochileros y lugares secretos.
- Si es de documentales medievales o misterios antiguos, habla de enigmas históricos reales poco conocidos.
- Responde únicamente con un array JSON de 5 strings cortos:
["Idea 1", "Idea 2", "Idea 3", "Idea 4", "Idea 5"]
`;

    const response = await getAiClient().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const parsed = safeParseJson(response.text, getDynamicSuggestions(query, type));
    res.json({ suggestions: Array.isArray(parsed) ? parsed : getDynamicSuggestions(query, type) });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.json({ suggestions: getDynamicSuggestions(req.body?.query, req.body?.type) });
  }
});

// Endpoint 1: Content Strategy Generator (Truly Dynamic from scratch)
app.post('/api/generate-content-strategy', async (req, res) => {
  try {
    const { customTopic, category } = req.body;
    const topicToAnalyze = (customTopic || category || 'Gaming y estrategias').trim();

    const prompt = `
Eres el estratega principal de contenidos para YouTube y Facebook del canal "Olvis Bolt".
Olvis sube gameplays en PC (Fortnite, shooters, etc.), juegos en su Super Tablet de alta gama (FC Mobile, emuladores), vlogs y viajes.

ANALIZA Y CREA UNA ESTRATEGIA COMPLETA Y ORIGINAL PARA ESTE TEMA EXACTO: "${topicToAnalyze}".

REGLAS OBLIGATORIAS:
1. TODO el contenido (título, gancho, técnica de retención, etiquetas, miniaturas, roles de tablet y pc) DEBE SER 100% COHERENTE CON: "${topicToAnalyze}".
2. Si el tema es FORTNITE o shooters, habla ÚNICAMENTE de Fortnite (armas, modos, FPS, modo rendimiento, mallas, victorias). ¡ESTÁ ESTRICTAMENTE PROHIBIDO hablar de comprar jugadores, fútbol, plantillas o FC Mobile!
3. Si el tema es VIAJES o VLOGS, habla de viajes, rutas, comida local y mochilero.
4. Si el tema es FC MOBILE, habla de tácticas, regates y modo Cara a Cara.
5. NO uses textos fijos ni hables de inversiones de dinero a menos que sea el tema exacto.
6. Genera "dynamicRelatedTopics": exactamente 5 NUEVOS botones/ideas que se deriven directamente de "${topicToAnalyze}" para que los botones de la interfaz se renueven por completo.

Responde estrictamente en formato JSON:
{
  "title": "Título llamativo acorde al tema",
  "hook": "Gancho demoledor de 3 a 5 segundos acorde al tema",
  "contentCategory": "${category || 'Gaming'}",
  "recommendedFormat": "Video Largo (8-10 min) + 2 Shorts",
  "dynamicRelatedTopics": [
    { "label": "Botón relacionado 1", "prompt": "Prompt completo 1", "category": "${category || 'Gaming'}" },
    { "label": "Botón relacionado 2", "prompt": "Prompt completo 2", "category": "${category || 'Gaming'}" },
    { "label": "Botón relacionado 3", "prompt": "Prompt completo 3", "category": "${category || 'Gaming'}" },
    { "label": "Botón relacionado 4", "prompt": "Prompt completo 4", "category": "${category || 'Gaming'}" },
    { "label": "Botón relacionado 5", "prompt": "Prompt completo 5", "category": "${category || 'Gaming'}" }
  ],
  "youtubeStrategy": {
    "titleIdea": "Título con alto CTR para YouTube",
    "thumbnailIdea": "Idea de miniatura visual específica para este tema",
    "seoTags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"],
    "descriptionTemplate": "Descripción optimizada para YouTube con llamado a la acción",
    "retentionTechnique": "Técnica de retención para mantener a la audiencia hasta el final"
  },
  "facebookStrategy": {
    "titleIdea": "Título para Facebook que motive a comentar y compartir",
    "hookStyle": "Gancho silencioso y visual para el feed de Facebook",
    "viralShareTrigger": "Razón psicológica por la que se compartirá masivamente en grupos",
    "monetizationTip": "Consejo para monetización In-Stream de Facebook (video mayor a 3 min)"
  },
  "theMissingGap": {
    "whatCompetitorsDo": "Qué contenido repetitivo están haciendo los demás creadores en este tema",
    "whatNobodyHasUploaded": "Qué todavía NADIE ha subido en YouTube/Facebook sobre este tema",
    "fusionOrImprovementAngle": "Ángulo de fusión o mejora para monopolizar las búsquedas"
  },
  "zeroBudgetProduction": {
    "tabletRole": "Rol de la Super Tablet para este video (pantalla, captura o edición en CapCut)",
    "pcRole": "Rol de la PC (juego, captura OBS o grabación de voz)",
    "freeTools": ["Herramienta 1", "Herramienta 2", "Herramienta 3"],
    "stepByStepGuide": [
      "Paso 1: ...",
      "Paso 2: ...",
      "Paso 3: ..."
    ]
  },
  "alternativeNiches": [
    { "nicheName": "Nicho complementario 1", "whyItWorks": "Por qué tiene audiencia", "device": "Tablet o PC" },
    { "nicheName": "Nicho complementario 2", "whyItWorks": "Por qué tiene audiencia", "device": "Tablet o PC" }
  ]
}
`;

    if (!getGeminiApiKey()) {
      return res.status(200).json(buildDynamicStrategyFallback(topicToAnalyze, category));
    }

    const response = await getAiClient().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const parsed = safeParseJson(response.text, buildDynamicStrategyFallback(topicToAnalyze, category));
    res.json(parsed);
  } catch (error: any) {
    console.error('Error generating content strategy:', error);
    res.status(200).json(buildDynamicStrategyFallback(req.body?.customTopic || 'Gaming', req.body?.category));
  }
});

// Endpoint 2: Historias y Documentales (10 Actos x 6 Clips = 60 Clips / 600s)
// REAL HISTORICAL STORYTELLING + 100% CONTINUITY AND CORRELATION FOR ALL 60 CLIPS
app.post('/api/generate-flow-documentary', async (req, res) => {
  try {
    const { topic } = req.body;
    const requestedTopic = (topic || 'Cómo dormían los soldados griegos en las guerras').trim();

    // Check specific benchmark demo topics for instant response if exact match
    const isGreekDefault = /^cómo dormían los soldados griegos/i.test(requestedTopic);
    const isAntioch = /^el asedio de antioquía|^canibalismo en las cruzadas/i.test(requestedTopic);
    const isTeutonic = /^la batalla del lago helado|^peipus|^alexander nevsky/i.test(requestedTopic);

    if (isGreekDefault) {
      return res.json(INITIAL_FLOW_DOC);
    }
    if (isAntioch) {
      return res.json(buildAntiochSiegeDocumentary());
    }
    if (isTeutonic) {
      return res.json(buildTeutonicLakePeipusDocumentary());
    }

    if (getGeminiApiKey()) {
      try {
        const finalDoc = await generateCoherent9MinuteDocumentary(requestedTopic);
        return res.json(finalDoc);
      } catch (geminiError: any) {
        console.warn('[Server] Error in generateCoherent9MinuteDocumentary, falling back to intelligent generator:', geminiError?.message || geminiError);
      }
    }

    // Intelligent category-aware fallback (medical, engineering, daily life, chronicles)
    const fallbackDoc = buildIntelligentTopicDocumentary(requestedTopic);
    return res.json(fallbackDoc);
  } catch (error: any) {
    console.error('Error generating flow documentary:', error);
    res.status(200).json(buildIntelligentTopicDocumentary(req.body?.topic || 'Historia Antigua'));
  }
});

// Endpoint 3: POV Shorts with EXACTLY 4 SCENES (20-30 seconds total)
app.post('/api/generate-pov-short', async (req, res) => {
  try {
    const { scenario } = req.body;
    const requestedScenario = (scenario || 'POV: Eres el último guardia en los túneles de Constantinopla (1453)').trim();

    const prompt = `
Eres un director viral de YouTube Shorts y Facebook Reels del estilo de @krakenpovbo.
Tema solicitado: "${requestedScenario}".

REGLAS ESTRICTAS:
1. EXACTAMENTE 4 ESCENAS/CLIPS en total.
2. Duración total entre 20 y 30 segundos (ej: 25 segundos).
3. Formato vertical 9:16 en primera persona (POV).
4. El video debe culminar en la ESCENA 4 con un GIRO FINAL HORRIBLE O SINIESTRO estilo krakenpovbo (algo inesperado y aterrador que se revela en los últimos 5 segundos).
5. Incluye "dynamicRelatedTopics": 5 nuevos escenarios POV históricos siniestros para actualizar los botones de la interfaz.

Estructura de las 4 escenas:
- Escena 1 (0:00 - 0:06): Introducción inmersiva en POV, antorcha o linterna, susurros o ambiente opresivo.
- Escena 2 (0:06 - 0:13): Descubrimiento inquietante o anomalía sensorial (vibración, huella, sonido).
- Escena 3 (0:13 - 0:20): Tensión máxima mientras intentas escapar o avanzar.
- Escena 4 (0:20 - 0:25): EL GIRO FINAL HORRIBLE. Revelación espeluznante que cambia todo.

Responde estrictamente en formato JSON:
{
  "title": "Título corto y perturbador para el Short",
  "durationSeconds": 25,
  "concept": "Concepto del POV",
  "historicalFactBehind": "Hecho histórico o mito de fondo",
  "twistEnding": "Explicación del giro final siniestro",
  "hookFirst3Sec": "Texto gigante en pantalla para los primeros 3 segundos",
  "dynamicRelatedTopics": [
    { "label": "Nuevo POV 1", "scenario": "Descripción 1" },
    { "label": "Nuevo POV 2", "scenario": "Descripción 2" },
    { "label": "Nuevo POV 3", "scenario": "Descripción 3" },
    { "label": "Nuevo POV 4", "scenario": "Descripción 4" },
    { "label": "Nuevo POV 5", "scenario": "Descripción 5" }
  ],
  "scenes": [
    {
      "sceneNumber": 1,
      "timestamp": "0:00 - 0:06",
      "povVisual": "Descripción visual de la toma en primera persona...",
      "googleFlowPrompt": "Prompt en inglés para Google Flow, 9:16 vertical, cinematic dark horror POV...",
      "textOnScreen": "Texto en pantalla",
      "audioAmbience": "Efectos sonoros y respiración",
      "narration": "Línea de voz en off corta"
    },
    {
      "sceneNumber": 2,
      "timestamp": "0:06 - 0:13",
      "povVisual": "...",
      "googleFlowPrompt": "...",
      "textOnScreen": "...",
      "audioAmbience": "...",
      "narration": "..."
    },
    {
      "sceneNumber": 3,
      "timestamp": "0:13 - 0:20",
      "povVisual": "...",
      "googleFlowPrompt": "...",
      "textOnScreen": "...",
      "audioAmbience": "...",
      "narration": "..."
    },
    {
      "sceneNumber": 4,
      "timestamp": "0:20 - 0:25 (GIRO FINAL HORRIBLE)",
      "povVisual": "...",
      "googleFlowPrompt": "...",
      "textOnScreen": "...",
      "audioAmbience": "...",
      "narration": "..."
    }
  ],
  "pinnedCommentStrategy": "Pregunta para fijar en el primer comentario y generar miles de respuestas",
  "soundRecommendation": "Música recomendada (Dark synth, slowed horror ambience)"
}
`;

    if (!getGeminiApiKey()) {
      return res.status(200).json(buildDynamicPOVFallback(requestedScenario));
    }

    const response = await getAiClient().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const parsed = safeParseJson(response.text, buildDynamicPOVFallback(requestedScenario));
    res.json(parsed);
  } catch (error: any) {
    console.error('Error generating POV short:', error);
    res.status(200).json(buildDynamicPOVFallback(req.body?.scenario || 'Cripta Medieval'));
  }
});

// Endpoint 4: Voiceover Audition & Audio Generation via Gemini TTS (Spanish & English)
app.all(['/api/tts', '/api/generate-tts-preview'], async (req, res) => {
  try {
    const { text, voiceName, language = 'es', voiceType = 'male_mature', styleDescription } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!getGeminiApiKey()) {
      return res.json({ available: false, message: 'Usando voz nativa del navegador' });
    }

    let chosenVoice = voiceName;
    let narrationStyle = styleDescription;

    if (!chosenVoice) {
      if (voiceType === 'female_mature') {
        chosenVoice = 'Kore';
      } else if (voiceType === 'young_adventurous') {
        chosenVoice = 'Zephyr';
      } else {
        chosenVoice = language === 'en' ? 'Fenrir' : 'Charon';
      }
    }

    if (!narrationStyle) {
      if (voiceType === 'female_mature') {
        narrationStyle = language === 'en'
          ? '50-year-old female narrator, deep, mature, resonant and raspy voice. Mysterious and cinematic.'
          : 'Mujer de 50 años, voz profunda, madura, resonante y rasgada. Misterioso y cinematográfico.';
      } else if (voiceType === 'young_adventurous') {
        narrationStyle = language === 'en'
          ? '25-year-old youthful narrator, with adventurous and interesting voice.'
          : 'Joven de 25 años, con voz aventurera y interesante.';
      } else {
        narrationStyle = language === 'en'
          ? 'Deep, serious, 50-year-old English male narrator, mature, resonant and raspy voice. Mysterious and cinematic.'
          : 'Masculino 50 años, voz profunda, madura, resonante y rasgada. Misterioso y cinematográfico.';
      }
    }

    const response = await getAiClient().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text,
              speechMetadata: {
                style: narrationStyle,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: chosenVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({
        available: true,
        audioData: `data:audio/wav;base64,${base64Audio}`,
      });
    } else {
      res.json({ available: false, message: 'Usando voz nativa del sistema' });
    }
  } catch (err: any) {
    console.warn('TTS error (falling back to client voice):', err.message);
    res.json({ available: false, message: 'Usando síntesis de voz local del navegador' });
  }
});

// Helper: Server-side translation with Google GTX, MyMemory, Gemini and fallback
async function translateSpanishToCinematicEnglishServer(spanishText: string): Promise<string> {
  if (!spanishText || !spanishText.trim()) return '';
  const cleanInput = spanishText.trim();

  // 1. Google Translate GTX (Fastest, ~100-300ms, extremely reliable, genuine English)
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(cleanInput)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((item: any) => item[0]).join('').trim();
        if (translated && translated.length > 3) {
          return translated;
        }
      }
    }
  } catch {
    // continue to next tier
  }

  // 2. MyMemory Translation API
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanInput)}&langpair=es|en`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const translated = data.responseData?.translatedText?.trim();
      if (translated && !translated.toLowerCase().includes('mymemory warning') && translated.length > 3) {
        return translated;
      }
    }
  } catch {
    // continue to next tier
  }

  // 3. Gemini models with quick 3s timeout
  for (const model of ['gemini-2.5-flash', 'gemini-2.0-flash']) {
    try {
      const geminiPromise = getAiClient().models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are a world-class historical documentary narrator and script translator (BBC, Dan Carlin, History Channel).
Translate the following Spanish historical narration into dramatic, solemn, poetic English for a 50-year-old male narrator with a gravelly, resonant voice.
CRITICAL CONSTRAINT FOR 10-SECOND CLIPS:
- The English translation MUST be strictly between 15 and 22 words (max 130 characters) so it can be spoken in 7 to 9 seconds.
Return ONLY the English translated narration, without quotes or additional commentary.

Spanish text:
"${cleanInput}"`
              }
            ]
          }
        ]
      });
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
      const response: any = await Promise.race([geminiPromise, timeoutPromise]);
      if (response && response.text) {
        const trans = response.text.trim().replace(/^["']|["']$/g, '');
        if (trans && trans.length > 3) {
          return trans;
        }
      }
    } catch {
      // try next
    }
  }

  // 4. Fallback dictionary
  return translateTextToCinematicEnglishFallback(cleanInput);
}

// Endpoint 5: Translate Voiceover (Spanish -> Cinematic English)
app.post('/api/translate-documentary-voice', async (req, res) => {
  try {
    const { items, text } = req.body;

    if (text) {
      const translated = await translateSpanishToCinematicEnglishServer(text);
      return res.json({ translatedText: enforce10SecondVoiceover(translated) });
    }

    if (Array.isArray(items) && items.length > 0) {
      const results = await Promise.all(
        items.map(async (it: any) => {
          const rawText = it.text || '';
          const translated = await translateSpanishToCinematicEnglishServer(rawText);
          return {
            id: it.id,
            translated: enforce10SecondVoiceover(translated)
          };
        })
      );
      return res.json({ translations: results });
    }

    res.json({ translations: [] });
  } catch (error: any) {
    console.error('Error translating voiceover:', error);
    res.status(200).json({ error: error.message, translations: [] });
  }
});

// ==========================================
// MEMBERSHIP & ADMIN ACCESS CONTROL ROUTES
// ==========================================

// Endpoint: User Login / Session Refresh
app.post('/api/memberships/login', (req, res) => {
  try {
    const { email, name, photoURL } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email requerido' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = getOrCreateUser(cleanEmail, name, photoURL);
    const isMasterAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();

    res.json({
      user,
      isMasterAdmin,
      adminEmail: ADMIN_EMAIL,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error al procesar login' });
  }
});

// Endpoint: Activate Membership with License Key
app.post('/api/memberships/activate-key', (req, res) => {
  try {
    const { email, key } = req.body;
    if (!email || !key) {
      return res.status(400).json({ success: false, message: 'Email y clave de licencia requeridos' });
    }

    const result = activateKeyForUser(email, key);
    res.json(result);
  } catch (err: any) {
    console.error('Key activation error:', err);
    res.status(500).json({ success: false, message: 'Error interno al activar clave' });
  }
});

// Endpoint: Get user saved projects from persistent database
app.get('/api/user/saved-projects', (req, res) => {
  try {
    const email = (req.query.email as string) || '';
    if (!email) return res.json({ items: [] });
    const items = getUserSavedProjects(email);
    res.json({ items });
  } catch (err: any) {
    console.error('Error getting saved projects:', err);
    res.status(500).json({ error: 'Error al obtener proyectos guardados' });
  }
});

// Endpoint: Save user project to persistent database
app.post('/api/user/saved-projects', (req, res) => {
  try {
    const { email, item } = req.body;
    if (!email || !item) {
      return res.status(400).json({ error: 'Email e ítem requeridos' });
    }
    const updatedList = saveUserProject(email, item);
    res.json({ success: true, items: updatedList });
  } catch (err: any) {
    console.error('Error saving project:', err);
    res.status(500).json({ error: 'Error al guardar proyecto' });
  }
});

// Endpoint: Delete user project from persistent database
app.delete('/api/user/saved-projects/:id', (req, res) => {
  try {
    const id = req.params.id;
    const email = (req.query.email as string) || (req.body?.email as string) || '';
    if (!email || !id) {
      return res.status(400).json({ error: 'Email e ID requeridos' });
    }
    const updatedList = deleteUserProject(email, id);
    res.json({ success: true, items: updatedList });
  } catch (err: any) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: 'Error al eliminar proyecto' });
  }
});

// Middleware helper to check Olvis admin access
function verifyAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const adminEmail = (req.headers['x-admin-email'] || req.body?.adminEmail || req.query?.adminEmail) as string;
  if (!adminEmail || adminEmail.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({ 
      error: 'Acceso denegado. Este panel es exclusivo para olvischavezmustafa@gmail.com' 
    });
  }
  next();
}

// Endpoint: Get Admin Dashboard Data (Users, Keys, Settings)
app.get('/api/memberships/admin/data', verifyAdmin, (req, res) => {
  try {
    const db = loadMembershipDb();
    const usersList = Object.values(db.users);
    res.json({
      users: usersList,
      keys: db.keys,
      tierConfig: db.tierConfig,
      adminEmail: ADMIN_EMAIL,
    });
  } catch (err: any) {
    console.error('Admin data fetch error:', err);
    res.status(500).json({ error: 'Error al obtener datos administrativos' });
  }
});

// Endpoint: Admin Generate New License Keys
app.post('/api/memberships/admin/generate-keys', verifyAdmin, (req, res) => {
  try {
    const { plan, count, notes } = req.body;
    const qty = Math.min(Math.max(Number(count) || 1, 1), 50);
    const createdKeys = generateKeys(plan || '1_month', qty, notes);
    res.json({ success: true, keys: createdKeys });
  } catch (err: any) {
    console.error('Error generating keys:', err);
    res.status(500).json({ error: 'Error al generar claves' });
  }
});

// Endpoint: Admin Update User Permissions / Plan
app.post('/api/memberships/admin/update-user', verifyAdmin, (req, res) => {
  try {
    const { targetEmail, updates } = req.body;
    if (!targetEmail) {
      return res.status(400).json({ error: 'targetEmail requerido' });
    }
    const updated = adminUpdateUser(targetEmail, updates || {});
    res.json({ success: true, user: updated });
  } catch (err: any) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// Endpoint: Admin Delete User
app.post('/api/memberships/admin/delete-user', verifyAdmin, (req, res) => {
  try {
    const { targetEmail } = req.body;
    if (!targetEmail) {
      return res.status(400).json({ error: 'targetEmail requerido' });
    }
    const success = adminDeleteUser(targetEmail);
    res.json({ success });
  } catch (err: any) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// Endpoint: Admin Delete License Key
app.post('/api/memberships/admin/delete-key', verifyAdmin, (req, res) => {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'Clave requerida' });
    const success = adminDeleteKey(key);
    res.json({ success });
  } catch (err: any) {
    console.error('Error deleting key:', err);
    res.status(500).json({ error: 'Error al eliminar clave' });
  }
});

// Endpoint: Admin Update Global Tier Configuration
app.post('/api/memberships/admin/update-tier-config', verifyAdmin, (req, res) => {
  try {
    const { tierConfig } = req.body;
    if (!tierConfig) return res.status(400).json({ error: 'tierConfig requerido' });
    const db = loadMembershipDb();
    db.tierConfig = tierConfig;
    saveMembershipDb(db);
    res.json({ success: true, tierConfig: db.tierConfig });
  } catch (err: any) {
    console.error('Error updating tier config:', err);
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
});

// ==========================================
// QR PAYMENTS: BOLIVIA SIMPLE QR & BINANCE
// ==========================================

// Endpoint: Get Public QR Settings & Pricing
app.get('/api/payments/qr-config', (req, res) => {
  try {
    const settings = getQrSettings();
    res.json({
      settings,
      currencyBolivia: 'BOB',
      currencyBinance: 'USDT',
    });
  } catch (err: any) {
    console.error('Error getting QR config:', err);
    res.status(500).json({ error: 'Error al obtener configuración de pagos QR' });
  }
});

// Endpoint: User notifies payment with email & receipt
app.post('/api/payments/notify-payment', (req, res) => {
  try {
    const { email, name, plan, amount, currency, method, reference, note } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'El correo electrónico es obligatorio para notificar tu pago.' });
    }

    const notification = createPaymentNotification({
      email,
      name,
      plan: plan || '1_month',
      amount: amount || '70 Bs',
      currency: currency || 'BOB',
      method: method || 'qr_bolivia',
      reference,
      note,
    });

    res.json({
      success: true,
      message: 'Aviso de pago registrado exitosamente. Olvis verificará tu pago y activará tu cuenta en breve.',
      notification,
    });
  } catch (err: any) {
    console.error('Error creating payment notification:', err);
    res.status(500).json({ error: 'Error al registrar aviso de pago' });
  }
});

// Endpoint: Admin get all payment notifications
app.get('/api/payments/admin/notifications', verifyAdmin, (req, res) => {
  try {
    const notifications = getPendingPayments();
    res.json({ notifications });
  } catch (err: any) {
    console.error('Error getting notifications:', err);
    res.status(500).json({ error: 'Error al obtener avisos de pago' });
  }
});

// Endpoint: Admin approve payment and activate user
app.post('/api/payments/admin/approve/:id', verifyAdmin, (req, res) => {
  try {
    const id = req.params.id;
    const { plan, durationDays } = req.body || {};
    const result = approvePaymentNotification(id, plan, durationDays);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err: any) {
    console.error('Error approving payment:', err);
    res.status(500).json({ error: 'Error al aprobar pago' });
  }
});

// Endpoint: Admin reject payment
app.post('/api/payments/admin/reject/:id', verifyAdmin, (req, res) => {
  try {
    const id = req.params.id;
    const result = rejectPaymentNotification(id);
    res.json(result);
  } catch (err: any) {
    console.error('Error rejecting payment:', err);
    res.status(500).json({ error: 'Error al rechazar pago' });
  }
});

// Endpoint: Admin Save QR Settings
app.post('/api/payments/admin/qr-settings', verifyAdmin, (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings) return res.status(400).json({ error: 'Configuración requerida' });
    const updated = updateQrSettings(settings);
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    console.error('Error saving QR settings:', err);
    res.status(500).json({ error: 'Error al guardar configuración de pagos QR' });
  }
});

// Endpoint: Admin Get Full QR Settings
app.get('/api/payments/admin/qr-settings', verifyAdmin, (req, res) => {
  try {
    const settings = getQrSettings();
    res.json({ settings });
  } catch (err: any) {
    console.error('Error getting admin QR settings:', err);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

// Fallback builder for content strategy
function buildDynamicStrategyFallback(topic: string, category?: string) {
  const isFortnite = /fortnite|shooter|disparos|battle royale/i.test(topic);
  const isTravel = /viaje|vlog|mochilero|turismo|país|ciudad|ruta/i.test(topic);
  const isFCMobile = /fc mobile|fifa|fútbol|futbol|jugadores|plantilla/i.test(topic);

  if (isFortnite) {
    return {
      title: `Fortnite en PC Modesta: Cómo Alcanzar 120 FPS Fijos y Mejorar la Puntería`,
      hook: "Si juegas Fortnite con tirones de FPS, estos 3 ajustes ocultos de modo rendimiento duplican la fluidez sin perder nitidez visual.",
      contentCategory: "Gaming PC (Fortnite)",
      recommendedFormat: "Video Largo (8-10 min) + 2 Shorts",
      dynamicRelatedTopics: [
        { label: "🎮 Modo Rendimiento Alpha en PC", prompt: "Fortnite: Configuración de mallas bajas y texturas para 120 FPS estables", category: "Gaming PC" },
        { label: "⚡ Reto: Victoria sin Armas Míticas", prompt: "Ganando partida de Fortnite usando solo armas comunes en PC modesta", category: "Gaming PC" },
        { label: "🏆 Ajustes de OBS para Fortnite sin Lag", prompt: "Cómo grabar Fortnite a 60 FPS con OBS sin perder rendimiento", category: "Gaming PC" },
        { label: "🎯 Guía de Sensibilidad & Puntería", prompt: "Mejora tu puntería en Fortnite en 10 minutos con este mapa de entrenamiento", category: "Gaming PC" },
        { label: "🔥 Comparativa: Fortnite PC vs Tablet", prompt: "Probando Fortnite en PC modesta frente a la Super Tablet: ¿Cuál rinde mejor?", category: "Gaming PC" }
      ],
      youtubeStrategy: {
        titleIdea: `¡ADIÓS LAG! La Configuración Secreta de Fortnite para PC Modesta (120 FPS Fijos)`,
        thumbnailIdea: "Comparativa en pantalla dividida: 35 FPS (en rojo) vs 120 FPS (en verde brillante), tu rostro sorprendido frente al monitor de PC.",
        seoTags: ["fortnite pc modesta", "fortnite fps", "olvis bolt fortnite", "optimizar fortnite", "como subir fps fortnite", "fortnite modo rendimiento", "fortnite sin lag"],
        descriptionTemplate: "En este video te muestro la guía definitiva para jugar Fortnite a 120 FPS fluidos en PC de gama media-baja. ¡Suscríbete al canal de Olvis Bolt!",
        retentionTechnique: "En el minuto 03:15 enseña la prueba de fuego: entrar a la zona final con 30 jugadores vivos sin una sola caída de fotogramas."
      },
      facebookStrategy: {
        titleIdea: "¿Tu PC no rinde en Fortnite? Prueba este truco antes de desinstalar el juego",
        hookStyle: "Clip inicial de 3 segundos con un enfrentamiento fluido a 120 FPS y texto gigante: 'ASÍ CORRE FORTNITE EN PC MODESTA'",
        viralShareTrigger: "Miles de jugadores de PC buscan optimizaciones reales para jugar con amigos sin comprar tarjetas gráficas costosas.",
        monetizationTip: "Asegura una duración mayor a 3 minutos para activar anuncios In-Stream con clímax en el minuto 1:55."
      },
      theMissingGap: {
        whatCompetitorsDo: "Hacen guías con PCs de gama ultra alta que no reflejan la realidad de los jugadores promedio.",
        whatNobodyHasUploaded: "Nadie muestra cómo jugar de manera competitiva en una PC normal combinando ajustes del juego y optimización de Windows.",
        fusionOrImprovementAngle: "Fusión: 'Optimización de FPS' + 'Reto en Partida Real'. Demuestra la mejora ganando una partida en vivo."
      },
      zeroBudgetProduction: {
        tabletRole: "Usa la Super Tablet como monitor secundario para leer el chat o consultar estadísticas de la partida.",
        pcRole: "Juega y captura con OBS Studio usando el codificador ultra ligero para no saturar el procesador.",
        freeTools: ["OBS Studio", "Audacity", "CapCut", "Canva"],
        stepByStepGuide: [
          "Paso 1: Aplica los ajustes de modo rendimiento y resolución 3D en Fortnite.",
          "Paso 2: Graba una partida completa con OBS Studio configurado a 4500 Kbps.",
          "Paso 3: Edita los mejores momentos en CapCut recortando tiempos de espera."
        ]
      },
      alternativeNiches: [
        { nicheName: "Juegos Livianos de Disparos en PC", whyItWorks: "Comunidades masivas buscan títulos que corran en cualquier máquina.", device: "PC Gamer" }
      ]
    };
  }

  if (isTravel) {
    return {
      title: `Vlog de Viajes: Rutas Ocultas y Secretos Locales con Tablet`,
      hook: "Todos viajan a los mismos sitios turísticos caros... pero descubrimos este rincón oculto donde la comida y la experiencia son diez veces más auténticas.",
      contentCategory: "Travel Vlogs",
      recommendedFormat: "Video Largo (8-10 min) + 2 Shorts",
      dynamicRelatedTopics: [
        { label: "✈️ Rutas Ocultas para Mochileros", prompt: "Los lugares secretos que los turistas ignoran y cómo visitarlos", category: "Travel Vlogs" },
        { label: "🍲 Guía de Comida Callejera Auténtica", prompt: "Probando los platos más insólitos y deliciosos de la región", category: "Travel Vlogs" },
        { label: "📱 Grabación y Edición Móvil en Ruta", prompt: "Cómo grabar vlogs cinematográficos solo con teléfono y Super Tablet", category: "Travel Vlogs" },
        { label: "🏕️ Aventura de 48 Horas Desconectado", prompt: "Sobreviviendo un fin de semana en plena naturaleza: Vlog extremo", category: "Travel Vlogs" },
        { label: "🎒 Qué Llevar en la Mochila para Grabar", prompt: "Mi equipo ligero para grabar viajes con calidad profesional", category: "Travel Vlogs" }
      ],
      youtubeStrategy: {
        titleIdea: `¡NO VAYAS DONDE TODOS VAN! El Rincón Oculto que Nadie Te Cuenta (Vlog de Viaje)`,
        thumbnailIdea: "Paisaje natural impactante, tú en primer plano con la mochila y texto llamativo: 'EL LUGAR SECRETO'.",
        seoTags: ["vlog de viajes", "olvis bolt viajes", "mochilero", "viajes aventura", "lugares secretos", "aventura", "turismo real"],
        descriptionTemplate: "Acompáñame en esta aventura descubriendo lugares increíbles y comida local. ¡Suscríbete a Olvis Bolt!",
        retentionTechnique: "Al inicio muestra un adelanto de 3 segundos del clímax al final del sendero."
      },
      facebookStrategy: {
        titleIdea: "¿Conocías este lugar? El rincón secreto que pocos se atreven a visitar",
        hookStyle: "Toma panorámica rápida con música inmersiva y texto: 'ESTO NO SALE EN LAS GUÍAS TURÍSTICAS'",
        viralShareTrigger: "A la gente le encanta compartir lugares poco conocidos de su región en grupos de viajes.",
        monetizationTip: "Estructura el video en 3 paradas de 1 minuto cada una para superar los 3 minutos obligatorios."
      },
      theMissingGap: {
        whatCompetitorsDo: "Muestran hoteles caros y promociones turísticas patrocinadas.",
        whatNobodyHasUploaded: "Vlogs auténticos a ras de suelo mostrando la realidad del viaje sin filtros.",
        fusionOrImprovementAngle: "Fusión: 'Aventura Real' + 'Consejos Prácticos de Ruta'."
      },
      zeroBudgetProduction: {
        tabletRole: "Edita las tomas del día en la Super Tablet mientras descansas usando CapCut táctil.",
        pcRole: "Almacena los respaldos de video y gestiona la publicación.",
        freeTools: ["CapCut Mobile", "Canva", "Google Maps"],
        stepByStepGuide: [
          "Paso 1: Graba tomas cortas de 5 a 10 segundos en cada parada interesante.",
          "Paso 2: Une las tomas en CapCut Tablet y añade música libre de derechos.",
          "Paso 3: Graba tu narración en off con reflexiones del viaje."
        ]
      },
      alternativeNiches: [
        { nicheName: "Micro-Aventuras Locales", whyItWorks: "Exploración de túneles, ruinas y pueblos cercanos.", device: "Tablet & Móvil" }
      ]
    };
  }

  if (isFCMobile) {
    return {
      title: `FC Mobile: Tácticas Avanzadas y Controles de Tablet para Dominar Cara a Cara`,
      hook: "Si sientes que tus rivales siempre ganan los balones divididos, este ajuste táctico de joystick y formación cambia todo.",
      contentCategory: "FC Mobile",
      recommendedFormat: "Video Largo (8-10 min) + 2 Shorts",
      dynamicRelatedTopics: [
        { label: "⚽ Bug Táctico en Cara a Cara", prompt: "El error táctico de centros y regates en FC Mobile Cara a Cara que los top usan", category: "FC Mobile" },
        { label: "🏆 Configuración de Joystick Táctil", prompt: "Mejor configuración de botones y sensibilidad en Super Tablet para FC Mobile", category: "FC Mobile" },
        { label: "🔥 Jugando Modo Torneo sin Perder", prompt: "Cómo ganar el torneo de FC Mobile en dificultad máxima", category: "FC Mobile" },
        { label: "⚡ Regates Imparables en 1 vs 1", prompt: "Aprende los 3 regates que los defensas no pueden frenar en FC Mobile", category: "FC Mobile" },
        { label: "📱 60 FPS Fijos en FC Mobile", prompt: "Ajustes gráficos en Super Tablet para jugar a 60 FPS sin sobrecalentamiento", category: "FC Mobile" }
      ],
      youtubeStrategy: {
        titleIdea: "¡EL SECRETO TÁCTICO! Cómo Subir a Campeón FIFA en FC Mobile sin Fallar Pases",
        thumbnailIdea: "Captura de gol acrobático en la tablet, flecha de táctica y tu rostro reaccionando.",
        seoTags: ["fc mobile", "olvis bolt", "trucos fc mobile", "cara a cara fc mobile", "como ganar en fc mobile", "fc mobile tablet", "tacticas fc mobile"],
        descriptionTemplate: "Guía completa de tácticas y controles para subir de rango en FC Mobile. ¡Suscríbete a Olvis Bolt!",
        retentionTechnique: "En el minuto 2:30 anuncia el partido final contra el top del ranking."
      },
      facebookStrategy: {
        titleIdea: "¿Por qué tus jugadores se quedan parados en FC Mobile? La solución táctica",
        hookStyle: "Golazo de tijera en los primeros 3 segundos con texto en pantalla.",
        viralShareTrigger: "Los jugadores de grupos de fútbol móvil comparten guías tácticas que les ayudan a ganar.",
        monetizationTip: "Duración de 3:15 min para monetización de video con anuncios."
      },
      theMissingGap: {
        whatCompetitorsDo: "Solo abren sobres sin explicar cómo mejorar en el juego.",
        whatNobodyHasUploaded: "Análisis táctico profundo aprovechando los controles de tablet.",
        fusionOrImprovementAngle: "Fusión: 'Gameplay en Vivo' + 'Análisis Táctico Detallado'."
      },
      zeroBudgetProduction: {
        tabletRole: "Graba partidas a 60 FPS nativos con audio interno y edita jugadas en CapCut.",
        pcRole: "Captura tu narración en off en Audacity con micrófono limpio.",
        freeTools: ["CapCut Mobile", "Audacity", "Canva"],
        stepByStepGuide: [
          "Paso 1: Graba 2 partidos completos en Cara a Cara en la tablet.",
          "Paso 2: Haz cortes dinámicos en CapCut dejando solo las acciones de peligro.",
          "Paso 3: Añade música enérgica y locución explicativa."
        ]
      },
      alternativeNiches: [
        { nicheName: "Retos de Fútbol Móvil", whyItWorks: "Audiencia competitiva y masiva en Facebook.", device: "Super Tablet" }
      ]
    };
  }

  // Any other topic / game
  return {
    title: `Estrategia y Secretos Clave para Dominar en "${topic}"`,
    hook: `La gran mayoría no conoce este método en ${topic}... pero una vez que lo aplicas, tus resultados mejoran drásticamente.`,
    contentCategory: category || "Gaming",
    recommendedFormat: "Video Largo (8-10 min) + 2 Shorts",
    dynamicRelatedTopics: [
      { label: `🏆 Guía Competitiva de ${topic}`, prompt: `Guía avanzada y mejores trucos sobre ${topic}`, category: category || "Gaming" },
      { label: `⚡ Errores Clave en ${topic}`, prompt: `Los 5 errores que te impiden ganar en ${topic}`, category: category || "Gaming" },
      { label: `🎮 Rendimiento Óptimo para ${topic}`, prompt: `Cómo configurar ${topic} para máxima fluidez y reflejos`, category: category || "Gaming" },
      { label: `🔥 Reto Extremo en ${topic}`, prompt: `Reto de dificultad máxima en ${topic}`, category: category || "Gaming" },
      { label: `📱 Probando ${topic} en Hardware Real`, prompt: `Demostración de controles y rendimiento en ${topic}`, category: category || "Gaming" }
    ],
    youtubeStrategy: {
      titleIdea: `¡DOMINA POR COMPLETO! El Secreto de "${topic}" que Casi Nadie Conoce`,
      thumbnailIdea: `Tu rostro concentrado, elemento central de ${topic} iluminado, texto de impacto en alto contraste.`,
      seoTags: [topic.toLowerCase(), "olvis bolt", "guia", "trucos", "gameplay", "estrategia", "como mejorar"],
      descriptionTemplate: `En este video analizamos a fondo la mejor estrategia para ${topic}. ¡Suscríbete a Olvis Bolt!`,
      retentionTechnique: "Coloca la jugada o revelación más importante al minuto 3:30 para sostener la retención."
    },
    facebookStrategy: {
      titleIdea: `¿Conocías este truco en "${topic}"? La técnica que cambiará tus partidas`,
      hookStyle: "Momento clave de alta acción en los primeros 3 segundos con subtítulos automáticos.",
      viralShareTrigger: "Genera debate entre apasionados de la comunidad sobre cuál es la mejor forma de jugar.",
      monetizationTip: "Duración de 3:20 minutos para activar pausas publicitarias In-Stream con retención sólida."
    },
    theMissingGap: {
      whatCompetitorsDo: "Explicaciones genéricas y sin demostración práctica bajo presión.",
      whatNobodyHasUploaded: "Un paso a paso claro mostrando aciertos y errores reales.",
      fusionOrImprovementAngle: "Fusión: Guía Teórica + Demostración Práctica en Partida Real."
    },
    zeroBudgetProduction: {
      tabletRole: "Graba partidas a 60 FPS con audio interno en la Super Tablet o edita en CapCut táctil.",
      pcRole: "Captura con OBS o procesa la locución en Audacity para máxima nitidez sonora.",
      freeTools: ["CapCut", "Audacity", "OBS Studio", "Canva"],
      stepByStepGuide: [
        "Paso 1: Graba 2 sesiones aplicando la estrategia.",
        "Paso 2: Graba tu comentario explicativo con energía.",
        "Paso 3: Sincroniza audio y video en CapCut y añade zoom en momentos clave."
      ]
    },
    alternativeNiches: [
      { nicheName: "Análisis Competitivo", whyItWorks: "Atrae a usuarios que buscan progresar rápidamente.", device: "Tablet o PC" }
    ]
  };
}

// Complete 8-Minute Documentary Builder: Exactly 8 Acts of 1 min each = 48 Clips of 10s = 480 seconds!
// REAL HISTORICAL SEQUENCES WITHOUT REPEATED BOILERPLATE
function buildComplete8MinuteDocumentary(topic: string, aiGeneratedData?: any) {
  const isGreekSoldiers = /griego|esparta|hoplita|dorm|guerra antigua/i.test(topic);
  const isAntioch = /antioqu|canibal|cruzad|asedio|comida prohibida/i.test(topic);
  const isTeutonic = /teuton|peipus|lago helad|nevsky|rusia medieval/i.test(topic);

  if (isGreekSoldiers) {
    return INITIAL_FLOW_DOC;
  }
  if (isAntioch) {
    return buildAntiochSiegeDocumentary();
  }
  if (isTeutonic) {
    return buildTeutonicLakePeipusDocumentary();
  }

  // Universal dynamic documentary for any topic with 48 completely unique clips
  const doc = buildUniversalHistoricalDocumentary(topic);
  if (aiGeneratedData?.documentaryTitle) {
    doc.documentaryTitle = aiGeneratedData.documentaryTitle;
  }
  if (aiGeneratedData?.fullScriptCastilian) {
    doc.fullScriptCastilian = aiGeneratedData.fullScriptCastilian;
  }
  if (aiGeneratedData?.dynamicRelatedTopics && Array.isArray(aiGeneratedData.dynamicRelatedTopics)) {
    doc.dynamicRelatedTopics = aiGeneratedData.dynamicRelatedTopics;
  }
  if (aiGeneratedData?.acts && Array.isArray(aiGeneratedData.acts)) {
    aiGeneratedData.acts.slice(0, 9).forEach((act: any, idx: number) => {
      if (doc.chapters && doc.chapters[idx] && act.chapterTitle) {
        doc.chapters[idx].chapterTitle = act.chapterTitle;
      }
    });
  }
  return doc;
}

// Fallback for Dynamic Documentary
function buildDynamicDocumentaryFallback(topic: string) {
  return buildComplete8MinuteDocumentary(topic);
}

// 4-Scene POV Fallback (20-30s)
function buildDynamicPOVFallback(scenario: string) {
  return {
    title: `POV: ${scenario}`,
    durationSeconds: 25,
    concept: "Vives en primera persona un momento histórico de tensión extrema con un giro aterrador en los últimos 5 segundos.",
    historicalFactBehind: "Hecho histórico o crónica antigua donde soldados y vigías vivían situaciones de terror psicológico en completa oscuridad.",
    twistEnding: "Al romper la última pared esperando enemigos humanos, descubres que la cámara subterránea estaba sellada desde el exterior... y lo que venía de las sombras nunca fue humano.",
    hookFirst3Sec: "POV: NUNCA DEBISTE QUEDARTE SOLO EN LA GUARDIA",
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
        povVisual: "First person POV, 9:16 vertical, shaky camera walking down steep spiral damp stone stairs in total darkness, holding a sputtering torch.",
        googleFlowPrompt: "First person POV looking down spiraling damp stone medieval stairs, holding torch, deep shadows, 9:16 vertical ratio, cinematic dark atmosphere.",
        textOnScreen: "POV: Eres el último centinela en la guardia nocturna",
        audioAmbience: "Goteo constante, respiración agitada en primera persona, eco de pasos.",
        narration: "Nos dijeron que mantuviéramos la antorcha encendida sin importar qué escucháramos..."
      },
      {
        sceneNumber: 2,
        timestamp: "0:06 - 0:13",
        povVisual: "Hand placing brass bowl of water on the damp floor. Ripples vibrate violently on the water surface.",
        googleFlowPrompt: "POV looking down at brass bowl of water on dungeon dirt floor vibrating violently with seismic waves, torchlight, 9:16 vertical.",
        textOnScreen: "El cuenco de agua no deja de vibrar...",
        audioAmbience: "Golpes secos bajo tierra: CLANG... CLANG... CLANG.",
        narration: "El agua vibraba cada tres segundos. Algo se movía al otro lado del muro."
      },
      {
        sceneNumber: 3,
        timestamp: "0:13 - 0:20",
        povVisual: "Hands swinging iron pickaxe desperately against crumbling stone wall. Dust fills the air as a huge fissure cracks.",
        googleFlowPrompt: "POV swinging medieval heavy pickaxe smashing dark damp subterranean stone wall, stone chips flying, 9:16 ratio.",
        textOnScreen: "Rompimos la última roca...",
        audioAmbience: "Metal contra roca desesperado, jadeos fatigados, silencio súbito.",
        narration: "Rompimos la pared... pero los ruidos se detuvieron instantáneamente."
      },
      {
        sceneNumber: 4,
        timestamp: "0:20 - 0:25 (EL GIRO FINAL HORRIBLE)",
        povVisual: "Torchlight reveals dozens of tall elongated non-human silhouettes with hollow glowing sockets freezing, then sprinting directly into the camera lens.",
        googleFlowPrompt: "Horrific sudden reveal POV, torch illuminating towering shadowy elongated non-human figures in deep subterranean ancient vault turning heads toward viewer, terrifying dark folklore atmosphere, sudden motion blur, 9:16 vertical.",
        textOnScreen: "NO ERAN HERRAMIENTAS... QUERÍAN QUE LES ABRIÉRAMOS",
        audioAmbience: "Chillido desgarrador agudo, antorcha cae al barro apagándose en negro total.",
        narration: "Los ruidos nunca fueron de excavación... querían que les abriéramos."
      }
    ],
    pinnedCommentStrategy: "¿Habrías corrido o te habrías quedado? Deja tu respuesta y te cuento qué dice la crónica prohibida.",
    soundRecommendation: "Dark slowed ambience con latido de corazón acelerado que se apaga bruscamente en el segundo 20."
  };
}

function getDynamicSuggestions(query: string = '', type: string = 'content') {
  if (type === 'documentary') {
    return [
      `El enigma silenciado de ${query || 'los guerreros medievales'}`,
      `El castigo censurado que Roma ocultó sobre ${query || 'los legionarios'}`,
      `Cómo sobrevivían al frío glacial en ${query || 'los asedios antiguos'}`,
      `Los manuscritos prohibidos sobre ${query || 'las fortalezas olvidadas'}`,
      `Lo que la historia jamás contó de ${query || 'los campamentos en guerra'}`
    ];
  } else if (type === 'pov') {
    return [
      `POV: Eres el último centinela en ${query || 'la torre'} y la antorcha se apaga`,
      `POV: Desciendes a la cripta de ${query || 'los monjes'} y algo respira a tu lado`,
      `POV: Eres un vigía en ${query || 'las murallas'} y las flechas no matan al enemigo`,
      `POV: Intentas curar la peste en ${query || 'el convento'} pero los cuerpos se mueven`,
      `POV: Despiertas en el campo de batalla de ${query || 'la antigüedad'} y no hay supervivientes`
    ];
  } else {
    const isFortnite = /fortnite/i.test(query);
    if (isFortnite) {
      return [
        "Fortnite en PC modesta: Cómo subir a 120 FPS fijos sin lag",
        "Reto Fortnite: Ganando partida usando solo armas grises",
        "Ajustes secretos de mallas bajas para eliminar el delay en Fortnite",
        "Cómo grabar Fortnite con OBS Studio a 60 FPS sin tirones",
        "Fortnite Modo Rendimiento vs DirectX 12: Cuál va mejor en PC modesta"
      ];
    }
    return [
      `La guía definitiva de ${query || 'gaming'} para dominar`,
      `Errores que el 90% comete en ${query || 'este juego'} y cómo ganar`,
      `El truco de configuración para ${query || 'este título'} que pocos conocen`,
      `Reto extremo en ${query || 'tu partida'}`,
      `Comparativa definitiva de rendimiento para ${query || 'este modo'}`
    ];
  }
}

// In production or Vercel, serve built static files; in local dev, mount Vite middleware
if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

// Start listener for local dev / Docker / Cloud Run (do not bind port inside Vercel serverless functions)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Olvis Bolt Studio Server running on port ${PORT}`);
  });
}

export default app;
