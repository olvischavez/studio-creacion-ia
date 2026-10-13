import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import {
  buildAntiochSiegeDocumentary,
  buildTeutonicLakePeipusDocumentary,
  buildUniversalHistoricalDocumentary
} from "./src/data/historicalChronicles";
import { INITIAL_FLOW_DOC } from "./src/data/mockTemplates";
import { translateTextToCinematicEnglishFallback } from "./src/utils/translator.js";
import {
  generateCoherent9MinuteDocumentary,
  buildIntelligentTopicDocumentary,
  enforce10SecondVoiceover
} from "./server/documentaryEngine.js";
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
} from "./server/membershipStore.js";
import { ADMIN_EMAIL } from "./src/types/membership.js";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function getGeminiApiKey() {
  return (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY || "").trim();
}
function getAiClient() {
  const apiKey = getGeminiApiKey();
  return apiKey ? new GoogleGenAI({ apiKey }) : new GoogleGenAI();
}
const app = express();
const PORT = Number(process.env.PORT) || 3e3;
app.use(express.json({ limit: "20mb" }));
function safeParseJson(text, fallback) {
  if (!text) return fallback;
  try {
    const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn("JSON parse failed, attempting regex extraction:", e);
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch (e2) {
      console.warn("Regex JSON extraction also failed:", e2);
    }
    return fallback;
  }
}
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!getGeminiApiKey(),
    creator: "Olvis Bolt",
    time: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post("/api/search-suggestions", async (req, res) => {
  try {
    const { query, type = "content" } = req.body;
    if (!query) {
      return res.json({ suggestions: [] });
    }
    if (!getGeminiApiKey()) {
      return res.json({ suggestions: getDynamicSuggestions(query, type) });
    }
    const prompt = `
Eres un analista de tendencias virales para el creador "Olvis Bolt" (YouTube y Facebook).
El creador busca sobre: "${query}" para el formato: "${type === "documentary" ? "Historias y Documentales de 10 minutos (10 actos de 60s)" : type === "pov" ? "Historias Cortas (Shorts) POV de 20-30s" : "Gaming / Vlogs / Tendencias"}".

Genera exactamente 5 sugerencias de t\xEDtulos/ideas ultra llamativas y espec\xEDficas que nadie m\xE1s est\xE9 haciendo basadas ESTRICTAMENTE en la palabra clave: "${query}".
REGLAS:
- Si la b\xFAsqueda es de shooters o Fortnite, habla EXCLUSIVAMENTE de shooters, FPS, punter\xEDa y trucos de juego. \xA1NUNCA menciones comprar jugadores, f\xFAtbol o FC Mobile!
- Si la b\xFAsqueda es de viajes, habla de rutas, mochileros y lugares secretos.
- Si es de documentales medievales o misterios antiguos, habla de enigmas hist\xF3ricos reales poco conocidos.
- Responde \xFAnicamente con un array JSON de 5 strings cortos:
["Idea 1", "Idea 2", "Idea 3", "Idea 4", "Idea 5"]
`;
    const response = await getAiClient().models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });
    const parsed = safeParseJson(response.text, getDynamicSuggestions(query, type));
    res.json({ suggestions: Array.isArray(parsed) ? parsed : getDynamicSuggestions(query, type) });
  } catch (error) {
    console.error("Error generating suggestions:", error);
    res.json({ suggestions: getDynamicSuggestions(req.body?.query, req.body?.type) });
  }
});
app.post("/api/generate-content-strategy", async (req, res) => {
  try {
    const { customTopic, category } = req.body;
    const topicToAnalyze = (customTopic || category || "Gaming y estrategias").trim();
    const prompt = `
Eres el estratega principal de contenidos para YouTube y Facebook del canal "Olvis Bolt".
Olvis sube gameplays en PC (Fortnite, shooters, etc.), juegos en su Super Tablet de alta gama (FC Mobile, emuladores), vlogs y viajes.

ANALIZA Y CREA UNA ESTRATEGIA COMPLETA Y ORIGINAL PARA ESTE TEMA EXACTO: "${topicToAnalyze}".

REGLAS OBLIGATORIAS:
1. TODO el contenido (t\xEDtulo, gancho, t\xE9cnica de retenci\xF3n, etiquetas, miniaturas, roles de tablet y pc) DEBE SER 100% COHERENTE CON: "${topicToAnalyze}".
2. Si el tema es FORTNITE o shooters, habla \xDANICAMENTE de Fortnite (armas, modos, FPS, modo rendimiento, mallas, victorias). \xA1EST\xC1 ESTRICTAMENTE PROHIBIDO hablar de comprar jugadores, f\xFAtbol, plantillas o FC Mobile!
3. Si el tema es VIAJES o VLOGS, habla de viajes, rutas, comida local y mochilero.
4. Si el tema es FC MOBILE, habla de t\xE1cticas, regates y modo Cara a Cara.
5. NO uses textos fijos ni hables de inversiones de dinero a menos que sea el tema exacto.
6. Genera "dynamicRelatedTopics": exactamente 5 NUEVOS botones/ideas que se deriven directamente de "${topicToAnalyze}" para que los botones de la interfaz se renueven por completo.

Responde estrictamente en formato JSON:
{
  "title": "T\xEDtulo llamativo acorde al tema",
  "hook": "Gancho demoledor de 3 a 5 segundos acorde al tema",
  "contentCategory": "${category || "Gaming"}",
  "recommendedFormat": "Video Largo (8-10 min) + 2 Shorts",
  "dynamicRelatedTopics": [
    { "label": "Bot\xF3n relacionado 1", "prompt": "Prompt completo 1", "category": "${category || "Gaming"}" },
    { "label": "Bot\xF3n relacionado 2", "prompt": "Prompt completo 2", "category": "${category || "Gaming"}" },
    { "label": "Bot\xF3n relacionado 3", "prompt": "Prompt completo 3", "category": "${category || "Gaming"}" },
    { "label": "Bot\xF3n relacionado 4", "prompt": "Prompt completo 4", "category": "${category || "Gaming"}" },
    { "label": "Bot\xF3n relacionado 5", "prompt": "Prompt completo 5", "category": "${category || "Gaming"}" }
  ],
  "youtubeStrategy": {
    "titleIdea": "T\xEDtulo con alto CTR para YouTube",
    "thumbnailIdea": "Idea de miniatura visual espec\xEDfica para este tema",
    "seoTags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"],
    "descriptionTemplate": "Descripci\xF3n optimizada para YouTube con llamado a la acci\xF3n",
    "retentionTechnique": "T\xE9cnica de retenci\xF3n para mantener a la audiencia hasta el final"
  },
  "facebookStrategy": {
    "titleIdea": "T\xEDtulo para Facebook que motive a comentar y compartir",
    "hookStyle": "Gancho silencioso y visual para el feed de Facebook",
    "viralShareTrigger": "Raz\xF3n psicol\xF3gica por la que se compartir\xE1 masivamente en grupos",
    "monetizationTip": "Consejo para monetizaci\xF3n In-Stream de Facebook (video mayor a 3 min)"
  },
  "theMissingGap": {
    "whatCompetitorsDo": "Qu\xE9 contenido repetitivo est\xE1n haciendo los dem\xE1s creadores en este tema",
    "whatNobodyHasUploaded": "Qu\xE9 todav\xEDa NADIE ha subido en YouTube/Facebook sobre este tema",
    "fusionOrImprovementAngle": "\xC1ngulo de fusi\xF3n o mejora para monopolizar las b\xFAsquedas"
  },
  "zeroBudgetProduction": {
    "tabletRole": "Rol de la Super Tablet para este video (pantalla, captura o edici\xF3n en CapCut)",
    "pcRole": "Rol de la PC (juego, captura OBS o grabaci\xF3n de voz)",
    "freeTools": ["Herramienta 1", "Herramienta 2", "Herramienta 3"],
    "stepByStepGuide": [
      "Paso 1: ...",
      "Paso 2: ...",
      "Paso 3: ..."
    ]
  },
  "alternativeNiches": [
    { "nicheName": "Nicho complementario 1", "whyItWorks": "Por qu\xE9 tiene audiencia", "device": "Tablet o PC" },
    { "nicheName": "Nicho complementario 2", "whyItWorks": "Por qu\xE9 tiene audiencia", "device": "Tablet o PC" }
  ]
}
`;
    if (!getGeminiApiKey()) {
      return res.status(200).json(buildDynamicStrategyFallback(topicToAnalyze, category));
    }
    const response = await getAiClient().models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });
    const parsed = safeParseJson(response.text, buildDynamicStrategyFallback(topicToAnalyze, category));
    res.json(parsed);
  } catch (error) {
    console.error("Error generating content strategy:", error);
    res.status(200).json(buildDynamicStrategyFallback(req.body?.customTopic || "Gaming", req.body?.category));
  }
});
app.post("/api/generate-flow-documentary", async (req, res) => {
  try {
    const { topic } = req.body;
    const requestedTopic = (topic || "C\xF3mo dorm\xEDan los soldados griegos en las guerras").trim();
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
      } catch (geminiError) {
        console.warn("[Server] Error in generateCoherent9MinuteDocumentary, falling back to intelligent generator:", geminiError?.message || geminiError);
      }
    }
    const fallbackDoc = buildIntelligentTopicDocumentary(requestedTopic);
    return res.json(fallbackDoc);
  } catch (error) {
    console.error("Error generating flow documentary:", error);
    res.status(200).json(buildIntelligentTopicDocumentary(req.body?.topic || "Historia Antigua"));
  }
});
app.post("/api/generate-pov-short", async (req, res) => {
  try {
    const { scenario } = req.body;
    const requestedScenario = (scenario || "POV: Eres el \xFAltimo guardia en los t\xFAneles de Constantinopla (1453)").trim();
    const prompt = `
Eres un director viral de YouTube Shorts y Facebook Reels del estilo de @krakenpovbo.
Tema solicitado: "${requestedScenario}".

REGLAS ESTRICTAS:
1. EXACTAMENTE 4 ESCENAS/CLIPS en total.
2. Duraci\xF3n total entre 20 y 30 segundos (ej: 25 segundos).
3. Formato vertical 9:16 en primera persona (POV).
4. El video debe culminar en la ESCENA 4 con un GIRO FINAL HORRIBLE O SINIESTRO estilo krakenpovbo (algo inesperado y aterrador que se revela en los \xFAltimos 5 segundos).
5. Incluye "dynamicRelatedTopics": 5 nuevos escenarios POV hist\xF3ricos siniestros para actualizar los botones de la interfaz.

Estructura de las 4 escenas:
- Escena 1 (0:00 - 0:06): Introducci\xF3n inmersiva en POV, antorcha o linterna, susurros o ambiente opresivo.
- Escena 2 (0:06 - 0:13): Descubrimiento inquietante o anomal\xEDa sensorial (vibraci\xF3n, huella, sonido).
- Escena 3 (0:13 - 0:20): Tensi\xF3n m\xE1xima mientras intentas escapar o avanzar.
- Escena 4 (0:20 - 0:25): EL GIRO FINAL HORRIBLE. Revelaci\xF3n espeluznante que cambia todo.

Responde estrictamente en formato JSON:
{
  "title": "T\xEDtulo corto y perturbador para el Short",
  "durationSeconds": 25,
  "concept": "Concepto del POV",
  "historicalFactBehind": "Hecho hist\xF3rico o mito de fondo",
  "twistEnding": "Explicaci\xF3n del giro final siniestro",
  "hookFirst3Sec": "Texto gigante en pantalla para los primeros 3 segundos",
  "dynamicRelatedTopics": [
    { "label": "Nuevo POV 1", "scenario": "Descripci\xF3n 1" },
    { "label": "Nuevo POV 2", "scenario": "Descripci\xF3n 2" },
    { "label": "Nuevo POV 3", "scenario": "Descripci\xF3n 3" },
    { "label": "Nuevo POV 4", "scenario": "Descripci\xF3n 4" },
    { "label": "Nuevo POV 5", "scenario": "Descripci\xF3n 5" }
  ],
  "scenes": [
    {
      "sceneNumber": 1,
      "timestamp": "0:00 - 0:06",
      "povVisual": "Descripci\xF3n visual de la toma en primera persona...",
      "googleFlowPrompt": "Prompt en ingl\xE9s para Google Flow, 9:16 vertical, cinematic dark horror POV...",
      "textOnScreen": "Texto en pantalla",
      "audioAmbience": "Efectos sonoros y respiraci\xF3n",
      "narration": "L\xEDnea de voz en off corta"
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
  "soundRecommendation": "M\xFAsica recomendada (Dark synth, slowed horror ambience)"
}
`;
    if (!getGeminiApiKey()) {
      return res.status(200).json(buildDynamicPOVFallback(requestedScenario));
    }
    const response = await getAiClient().models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });
    const parsed = safeParseJson(response.text, buildDynamicPOVFallback(requestedScenario));
    res.json(parsed);
  } catch (error) {
    console.error("Error generating POV short:", error);
    res.status(200).json(buildDynamicPOVFallback(req.body?.scenario || "Cripta Medieval"));
  }
});
app.all(["/api/tts", "/api/generate-tts-preview"], async (req, res) => {
  try {
    const { text, voiceName, language = "es", voiceType = "male_mature", styleDescription } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    if (!getGeminiApiKey()) {
      return res.json({ available: false, message: "Usando voz nativa del navegador" });
    }
    let chosenVoice = voiceName;
    let narrationStyle = styleDescription;
    if (!chosenVoice) {
      if (voiceType === "female_mature") {
        chosenVoice = "Kore";
      } else if (voiceType === "young_adventurous") {
        chosenVoice = "Zephyr";
      } else {
        chosenVoice = language === "en" ? "Fenrir" : "Charon";
      }
    }
    if (!narrationStyle) {
      if (voiceType === "female_mature") {
        narrationStyle = language === "en" ? "50-year-old female narrator, deep, mature, resonant and raspy voice. Mysterious and cinematic." : "Mujer de 50 a\xF1os, voz profunda, madura, resonante y rasgada. Misterioso y cinematogr\xE1fico.";
      } else if (voiceType === "young_adventurous") {
        narrationStyle = language === "en" ? "25-year-old youthful narrator, with adventurous and interesting voice." : "Joven de 25 a\xF1os, con voz aventurera y interesante.";
      } else {
        narrationStyle = language === "en" ? "Deep, serious, 50-year-old English male narrator, mature, resonant and raspy voice. Mysterious and cinematic." : "Masculino 50 a\xF1os, voz profunda, madura, resonante y rasgada. Misterioso y cinematogr\xE1fico.";
      }
    }
    const response = await getAiClient().models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text,
              speechMetadata: {
                style: narrationStyle
              }
            }
          ]
        }
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: chosenVoice }
          }
        }
      }
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({
        available: true,
        audioData: `data:audio/wav;base64,${base64Audio}`
      });
    } else {
      res.json({ available: false, message: "Usando voz nativa del sistema" });
    }
  } catch (err) {
    console.warn("TTS error (falling back to client voice):", err.message);
    res.json({ available: false, message: "Usando s\xEDntesis de voz local del navegador" });
  }
});
async function translateSpanishToCinematicEnglishServer(spanishText) {
  if (!spanishText || !spanishText.trim()) return "";
  const cleanInput = spanishText.trim();
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(cleanInput)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((item) => item[0]).join("").trim();
        if (translated && translated.length > 3) {
          return translated;
        }
      }
    }
  } catch {
  }
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanInput)}&langpair=es|en`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const translated = data.responseData?.translatedText?.trim();
      if (translated && !translated.toLowerCase().includes("mymemory warning") && translated.length > 3) {
        return translated;
      }
    }
  } catch {
  }
  for (const model of ["gemini-2.5-flash", "gemini-2.0-flash"]) {
    try {
      const geminiPromise = getAiClient().models.generateContent({
        model,
        contents: [
          {
            role: "user",
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
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 3e3));
      const response = await Promise.race([geminiPromise, timeoutPromise]);
      if (response && response.text) {
        const trans = response.text.trim().replace(/^["']|["']$/g, "");
        if (trans && trans.length > 3) {
          return trans;
        }
      }
    } catch {
    }
  }
  return translateTextToCinematicEnglishFallback(cleanInput);
}
app.post("/api/translate-documentary-voice", async (req, res) => {
  try {
    const { items, text } = req.body;
    if (text) {
      const translated = await translateSpanishToCinematicEnglishServer(text);
      return res.json({ translatedText: enforce10SecondVoiceover(translated) });
    }
    if (Array.isArray(items) && items.length > 0) {
      const results = await Promise.all(
        items.map(async (it) => {
          const rawText = it.text || "";
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
  } catch (error) {
    console.error("Error translating voiceover:", error);
    res.status(200).json({ error: error.message, translations: [] });
  }
});
app.post("/api/memberships/login", (req, res) => {
  try {
    const { email, name, photoURL } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email requerido" });
    }
    const cleanEmail = email.trim().toLowerCase();
    const user = getOrCreateUser(cleanEmail, name, photoURL);
    const isMasterAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();
    res.json({
      user,
      isMasterAdmin,
      adminEmail: ADMIN_EMAIL
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Error al procesar login" });
  }
});
app.post("/api/memberships/activate-key", (req, res) => {
  try {
    const { email, key } = req.body;
    if (!email || !key) {
      return res.status(400).json({ success: false, message: "Email y clave de licencia requeridos" });
    }
    const result = activateKeyForUser(email, key);
    res.json(result);
  } catch (err) {
    console.error("Key activation error:", err);
    res.status(500).json({ success: false, message: "Error interno al activar clave" });
  }
});
app.get("/api/user/saved-projects", (req, res) => {
  try {
    const email = req.query.email || "";
    if (!email) return res.json({ items: [] });
    const items = getUserSavedProjects(email);
    res.json({ items });
  } catch (err) {
    console.error("Error getting saved projects:", err);
    res.status(500).json({ error: "Error al obtener proyectos guardados" });
  }
});
app.post("/api/user/saved-projects", (req, res) => {
  try {
    const { email, item } = req.body;
    if (!email || !item) {
      return res.status(400).json({ error: "Email e \xEDtem requeridos" });
    }
    const updatedList = saveUserProject(email, item);
    res.json({ success: true, items: updatedList });
  } catch (err) {
    console.error("Error saving project:", err);
    res.status(500).json({ error: "Error al guardar proyecto" });
  }
});
app.delete("/api/user/saved-projects/:id", (req, res) => {
  try {
    const id = req.params.id;
    const email = req.query.email || req.body?.email || "";
    if (!email || !id) {
      return res.status(400).json({ error: "Email e ID requeridos" });
    }
    const updatedList = deleteUserProject(email, id);
    res.json({ success: true, items: updatedList });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ error: "Error al eliminar proyecto" });
  }
});
function verifyAdmin(req, res, next) {
  const adminEmail = req.headers["x-admin-email"] || req.body?.adminEmail || req.query?.adminEmail;
  if (!adminEmail || adminEmail.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({
      error: "Acceso denegado. Este panel es exclusivo para olvischavezmustafa@gmail.com"
    });
  }
  next();
}
app.get("/api/memberships/admin/data", verifyAdmin, (req, res) => {
  try {
    const db = loadMembershipDb();
    const usersList = Object.values(db.users);
    res.json({
      users: usersList,
      keys: db.keys,
      tierConfig: db.tierConfig,
      adminEmail: ADMIN_EMAIL
    });
  } catch (err) {
    console.error("Admin data fetch error:", err);
    res.status(500).json({ error: "Error al obtener datos administrativos" });
  }
});
app.post("/api/memberships/admin/generate-keys", verifyAdmin, (req, res) => {
  try {
    const { plan, count, notes } = req.body;
    const qty = Math.min(Math.max(Number(count) || 1, 1), 50);
    const createdKeys = generateKeys(plan || "1_month", qty, notes);
    res.json({ success: true, keys: createdKeys });
  } catch (err) {
    console.error("Error generating keys:", err);
    res.status(500).json({ error: "Error al generar claves" });
  }
});
app.post("/api/memberships/admin/update-user", verifyAdmin, (req, res) => {
  try {
    const { targetEmail, updates } = req.body;
    if (!targetEmail) {
      return res.status(400).json({ error: "targetEmail requerido" });
    }
    const updated = adminUpdateUser(targetEmail, updates || {});
    res.json({ success: true, user: updated });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});
app.post("/api/memberships/admin/delete-user", verifyAdmin, (req, res) => {
  try {
    const { targetEmail } = req.body;
    if (!targetEmail) {
      return res.status(400).json({ error: "targetEmail requerido" });
    }
    const success = adminDeleteUser(targetEmail);
    res.json({ success });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});
app.post("/api/memberships/admin/delete-key", verifyAdmin, (req, res) => {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: "Clave requerida" });
    const success = adminDeleteKey(key);
    res.json({ success });
  } catch (err) {
    console.error("Error deleting key:", err);
    res.status(500).json({ error: "Error al eliminar clave" });
  }
});
app.post("/api/memberships/admin/update-tier-config", verifyAdmin, (req, res) => {
  try {
    const { tierConfig } = req.body;
    if (!tierConfig) return res.status(400).json({ error: "tierConfig requerido" });
    const db = loadMembershipDb();
    db.tierConfig = tierConfig;
    saveMembershipDb(db);
    res.json({ success: true, tierConfig: db.tierConfig });
  } catch (err) {
    console.error("Error updating tier config:", err);
    res.status(500).json({ error: "Error al actualizar configuraci\xF3n" });
  }
});
app.get("/api/payments/qr-config", (req, res) => {
  try {
    const settings = getQrSettings();
    res.json({
      settings,
      currencyBolivia: "BOB",
      currencyBinance: "USDT"
    });
  } catch (err) {
    console.error("Error getting QR config:", err);
    res.status(500).json({ error: "Error al obtener configuraci\xF3n de pagos QR" });
  }
});
app.post("/api/payments/notify-payment", (req, res) => {
  try {
    const { email, name, plan, amount, currency, method, reference, note } = req.body;
    if (!email) {
      return res.status(400).json({ error: "El correo electr\xF3nico es obligatorio para notificar tu pago." });
    }
    const notification = createPaymentNotification({
      email,
      name,
      plan: plan || "1_month",
      amount: amount || "70 Bs",
      currency: currency || "BOB",
      method: method || "qr_bolivia",
      reference,
      note
    });
    res.json({
      success: true,
      message: "Aviso de pago registrado exitosamente. Olvis verificar\xE1 tu pago y activar\xE1 tu cuenta en breve.",
      notification
    });
  } catch (err) {
    console.error("Error creating payment notification:", err);
    res.status(500).json({ error: "Error al registrar aviso de pago" });
  }
});
app.get("/api/payments/admin/notifications", verifyAdmin, (req, res) => {
  try {
    const notifications = getPendingPayments();
    res.json({ notifications });
  } catch (err) {
    console.error("Error getting notifications:", err);
    res.status(500).json({ error: "Error al obtener avisos de pago" });
  }
});
app.post("/api/payments/admin/approve/:id", verifyAdmin, (req, res) => {
  try {
    const id = req.params.id;
    const { plan, durationDays } = req.body || {};
    const result = approvePaymentNotification(id, plan, durationDays);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error("Error approving payment:", err);
    res.status(500).json({ error: "Error al aprobar pago" });
  }
});
app.post("/api/payments/admin/reject/:id", verifyAdmin, (req, res) => {
  try {
    const id = req.params.id;
    const result = rejectPaymentNotification(id);
    res.json(result);
  } catch (err) {
    console.error("Error rejecting payment:", err);
    res.status(500).json({ error: "Error al rechazar pago" });
  }
});
app.post("/api/payments/admin/qr-settings", verifyAdmin, (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings) return res.status(400).json({ error: "Configuraci\xF3n requerida" });
    const updated = updateQrSettings(settings);
    res.json({ success: true, settings: updated });
  } catch (err) {
    console.error("Error saving QR settings:", err);
    res.status(500).json({ error: "Error al guardar configuraci\xF3n de pagos QR" });
  }
});
app.get("/api/payments/admin/qr-settings", verifyAdmin, (req, res) => {
  try {
    const settings = getQrSettings();
    res.json({ settings });
  } catch (err) {
    console.error("Error getting admin QR settings:", err);
    res.status(500).json({ error: "Error al obtener configuraci\xF3n" });
  }
});
function buildDynamicStrategyFallback(topic, category) {
  const isFortnite = /fortnite|shooter|disparos|battle royale/i.test(topic);
  const isTravel = /viaje|vlog|mochilero|turismo|país|ciudad|ruta/i.test(topic);
  const isFCMobile = /fc mobile|fifa|fútbol|futbol|jugadores|plantilla/i.test(topic);
  if (isFortnite) {
    return {
      title: `Fortnite en PC Modesta: C\xF3mo Alcanzar 120 FPS Fijos y Mejorar la Punter\xEDa`,
      hook: "Si juegas Fortnite con tirones de FPS, estos 3 ajustes ocultos de modo rendimiento duplican la fluidez sin perder nitidez visual.",
      contentCategory: "Gaming PC (Fortnite)",
      recommendedFormat: "Video Largo (8-10 min) + 2 Shorts",
      dynamicRelatedTopics: [
        { label: "\u{1F3AE} Modo Rendimiento Alpha en PC", prompt: "Fortnite: Configuraci\xF3n de mallas bajas y texturas para 120 FPS estables", category: "Gaming PC" },
        { label: "\u26A1 Reto: Victoria sin Armas M\xEDticas", prompt: "Ganando partida de Fortnite usando solo armas comunes en PC modesta", category: "Gaming PC" },
        { label: "\u{1F3C6} Ajustes de OBS para Fortnite sin Lag", prompt: "C\xF3mo grabar Fortnite a 60 FPS con OBS sin perder rendimiento", category: "Gaming PC" },
        { label: "\u{1F3AF} Gu\xEDa de Sensibilidad & Punter\xEDa", prompt: "Mejora tu punter\xEDa en Fortnite en 10 minutos con este mapa de entrenamiento", category: "Gaming PC" },
        { label: "\u{1F525} Comparativa: Fortnite PC vs Tablet", prompt: "Probando Fortnite en PC modesta frente a la Super Tablet: \xBFCu\xE1l rinde mejor?", category: "Gaming PC" }
      ],
      youtubeStrategy: {
        titleIdea: `\xA1ADI\xD3S LAG! La Configuraci\xF3n Secreta de Fortnite para PC Modesta (120 FPS Fijos)`,
        thumbnailIdea: "Comparativa en pantalla dividida: 35 FPS (en rojo) vs 120 FPS (en verde brillante), tu rostro sorprendido frente al monitor de PC.",
        seoTags: ["fortnite pc modesta", "fortnite fps", "olvis bolt fortnite", "optimizar fortnite", "como subir fps fortnite", "fortnite modo rendimiento", "fortnite sin lag"],
        descriptionTemplate: "En este video te muestro la gu\xEDa definitiva para jugar Fortnite a 120 FPS fluidos en PC de gama media-baja. \xA1Suscr\xEDbete al canal de Olvis Bolt!",
        retentionTechnique: "En el minuto 03:15 ense\xF1a la prueba de fuego: entrar a la zona final con 30 jugadores vivos sin una sola ca\xEDda de fotogramas."
      },
      facebookStrategy: {
        titleIdea: "\xBFTu PC no rinde en Fortnite? Prueba este truco antes de desinstalar el juego",
        hookStyle: "Clip inicial de 3 segundos con un enfrentamiento fluido a 120 FPS y texto gigante: 'AS\xCD CORRE FORTNITE EN PC MODESTA'",
        viralShareTrigger: "Miles de jugadores de PC buscan optimizaciones reales para jugar con amigos sin comprar tarjetas gr\xE1ficas costosas.",
        monetizationTip: "Asegura una duraci\xF3n mayor a 3 minutos para activar anuncios In-Stream con cl\xEDmax en el minuto 1:55."
      },
      theMissingGap: {
        whatCompetitorsDo: "Hacen gu\xEDas con PCs de gama ultra alta que no reflejan la realidad de los jugadores promedio.",
        whatNobodyHasUploaded: "Nadie muestra c\xF3mo jugar de manera competitiva en una PC normal combinando ajustes del juego y optimizaci\xF3n de Windows.",
        fusionOrImprovementAngle: "Fusi\xF3n: 'Optimizaci\xF3n de FPS' + 'Reto en Partida Real'. Demuestra la mejora ganando una partida en vivo."
      },
      zeroBudgetProduction: {
        tabletRole: "Usa la Super Tablet como monitor secundario para leer el chat o consultar estad\xEDsticas de la partida.",
        pcRole: "Juega y captura con OBS Studio usando el codificador ultra ligero para no saturar el procesador.",
        freeTools: ["OBS Studio", "Audacity", "CapCut", "Canva"],
        stepByStepGuide: [
          "Paso 1: Aplica los ajustes de modo rendimiento y resoluci\xF3n 3D en Fortnite.",
          "Paso 2: Graba una partida completa con OBS Studio configurado a 4500 Kbps.",
          "Paso 3: Edita los mejores momentos en CapCut recortando tiempos de espera."
        ]
      },
      alternativeNiches: [
        { nicheName: "Juegos Livianos de Disparos en PC", whyItWorks: "Comunidades masivas buscan t\xEDtulos que corran en cualquier m\xE1quina.", device: "PC Gamer" }
      ]
    };
  }
  if (isTravel) {
    return {
      title: `Vlog de Viajes: Rutas Ocultas y Secretos Locales con Tablet`,
      hook: "Todos viajan a los mismos sitios tur\xEDsticos caros... pero descubrimos este rinc\xF3n oculto donde la comida y la experiencia son diez veces m\xE1s aut\xE9nticas.",
      contentCategory: "Travel Vlogs",
      recommendedFormat: "Video Largo (8-10 min) + 2 Shorts",
      dynamicRelatedTopics: [
        { label: "\u2708\uFE0F Rutas Ocultas para Mochileros", prompt: "Los lugares secretos que los turistas ignoran y c\xF3mo visitarlos", category: "Travel Vlogs" },
        { label: "\u{1F372} Gu\xEDa de Comida Callejera Aut\xE9ntica", prompt: "Probando los platos m\xE1s ins\xF3litos y deliciosos de la regi\xF3n", category: "Travel Vlogs" },
        { label: "\u{1F4F1} Grabaci\xF3n y Edici\xF3n M\xF3vil en Ruta", prompt: "C\xF3mo grabar vlogs cinematogr\xE1ficos solo con tel\xE9fono y Super Tablet", category: "Travel Vlogs" },
        { label: "\u{1F3D5}\uFE0F Aventura de 48 Horas Desconectado", prompt: "Sobreviviendo un fin de semana en plena naturaleza: Vlog extremo", category: "Travel Vlogs" },
        { label: "\u{1F392} Qu\xE9 Llevar en la Mochila para Grabar", prompt: "Mi equipo ligero para grabar viajes con calidad profesional", category: "Travel Vlogs" }
      ],
      youtubeStrategy: {
        titleIdea: `\xA1NO VAYAS DONDE TODOS VAN! El Rinc\xF3n Oculto que Nadie Te Cuenta (Vlog de Viaje)`,
        thumbnailIdea: "Paisaje natural impactante, t\xFA en primer plano con la mochila y texto llamativo: 'EL LUGAR SECRETO'.",
        seoTags: ["vlog de viajes", "olvis bolt viajes", "mochilero", "viajes aventura", "lugares secretos", "aventura", "turismo real"],
        descriptionTemplate: "Acomp\xE1\xF1ame en esta aventura descubriendo lugares incre\xEDbles y comida local. \xA1Suscr\xEDbete a Olvis Bolt!",
        retentionTechnique: "Al inicio muestra un adelanto de 3 segundos del cl\xEDmax al final del sendero."
      },
      facebookStrategy: {
        titleIdea: "\xBFConoc\xEDas este lugar? El rinc\xF3n secreto que pocos se atreven a visitar",
        hookStyle: "Toma panor\xE1mica r\xE1pida con m\xFAsica inmersiva y texto: 'ESTO NO SALE EN LAS GU\xCDAS TUR\xCDSTICAS'",
        viralShareTrigger: "A la gente le encanta compartir lugares poco conocidos de su regi\xF3n en grupos de viajes.",
        monetizationTip: "Estructura el video en 3 paradas de 1 minuto cada una para superar los 3 minutos obligatorios."
      },
      theMissingGap: {
        whatCompetitorsDo: "Muestran hoteles caros y promociones tur\xEDsticas patrocinadas.",
        whatNobodyHasUploaded: "Vlogs aut\xE9nticos a ras de suelo mostrando la realidad del viaje sin filtros.",
        fusionOrImprovementAngle: "Fusi\xF3n: 'Aventura Real' + 'Consejos Pr\xE1cticos de Ruta'."
      },
      zeroBudgetProduction: {
        tabletRole: "Edita las tomas del d\xEDa en la Super Tablet mientras descansas usando CapCut t\xE1ctil.",
        pcRole: "Almacena los respaldos de video y gestiona la publicaci\xF3n.",
        freeTools: ["CapCut Mobile", "Canva", "Google Maps"],
        stepByStepGuide: [
          "Paso 1: Graba tomas cortas de 5 a 10 segundos en cada parada interesante.",
          "Paso 2: Une las tomas en CapCut Tablet y a\xF1ade m\xFAsica libre de derechos.",
          "Paso 3: Graba tu narraci\xF3n en off con reflexiones del viaje."
        ]
      },
      alternativeNiches: [
        { nicheName: "Micro-Aventuras Locales", whyItWorks: "Exploraci\xF3n de t\xFAneles, ruinas y pueblos cercanos.", device: "Tablet & M\xF3vil" }
      ]
    };
  }
  if (isFCMobile) {
    return {
      title: `FC Mobile: T\xE1cticas Avanzadas y Controles de Tablet para Dominar Cara a Cara`,
      hook: "Si sientes que tus rivales siempre ganan los balones divididos, este ajuste t\xE1ctico de joystick y formaci\xF3n cambia todo.",
      contentCategory: "FC Mobile",
      recommendedFormat: "Video Largo (8-10 min) + 2 Shorts",
      dynamicRelatedTopics: [
        { label: "\u26BD Bug T\xE1ctico en Cara a Cara", prompt: "El error t\xE1ctico de centros y regates en FC Mobile Cara a Cara que los top usan", category: "FC Mobile" },
        { label: "\u{1F3C6} Configuraci\xF3n de Joystick T\xE1ctil", prompt: "Mejor configuraci\xF3n de botones y sensibilidad en Super Tablet para FC Mobile", category: "FC Mobile" },
        { label: "\u{1F525} Jugando Modo Torneo sin Perder", prompt: "C\xF3mo ganar el torneo de FC Mobile en dificultad m\xE1xima", category: "FC Mobile" },
        { label: "\u26A1 Regates Imparables en 1 vs 1", prompt: "Aprende los 3 regates que los defensas no pueden frenar en FC Mobile", category: "FC Mobile" },
        { label: "\u{1F4F1} 60 FPS Fijos en FC Mobile", prompt: "Ajustes gr\xE1ficos en Super Tablet para jugar a 60 FPS sin sobrecalentamiento", category: "FC Mobile" }
      ],
      youtubeStrategy: {
        titleIdea: "\xA1EL SECRETO T\xC1CTICO! C\xF3mo Subir a Campe\xF3n FIFA en FC Mobile sin Fallar Pases",
        thumbnailIdea: "Captura de gol acrob\xE1tico en la tablet, flecha de t\xE1ctica y tu rostro reaccionando.",
        seoTags: ["fc mobile", "olvis bolt", "trucos fc mobile", "cara a cara fc mobile", "como ganar en fc mobile", "fc mobile tablet", "tacticas fc mobile"],
        descriptionTemplate: "Gu\xEDa completa de t\xE1cticas y controles para subir de rango en FC Mobile. \xA1Suscr\xEDbete a Olvis Bolt!",
        retentionTechnique: "En el minuto 2:30 anuncia el partido final contra el top del ranking."
      },
      facebookStrategy: {
        titleIdea: "\xBFPor qu\xE9 tus jugadores se quedan parados en FC Mobile? La soluci\xF3n t\xE1ctica",
        hookStyle: "Golazo de tijera en los primeros 3 segundos con texto en pantalla.",
        viralShareTrigger: "Los jugadores de grupos de f\xFAtbol m\xF3vil comparten gu\xEDas t\xE1cticas que les ayudan a ganar.",
        monetizationTip: "Duraci\xF3n de 3:15 min para monetizaci\xF3n de video con anuncios."
      },
      theMissingGap: {
        whatCompetitorsDo: "Solo abren sobres sin explicar c\xF3mo mejorar en el juego.",
        whatNobodyHasUploaded: "An\xE1lisis t\xE1ctico profundo aprovechando los controles de tablet.",
        fusionOrImprovementAngle: "Fusi\xF3n: 'Gameplay en Vivo' + 'An\xE1lisis T\xE1ctico Detallado'."
      },
      zeroBudgetProduction: {
        tabletRole: "Graba partidas a 60 FPS nativos con audio interno y edita jugadas en CapCut.",
        pcRole: "Captura tu narraci\xF3n en off en Audacity con micr\xF3fono limpio.",
        freeTools: ["CapCut Mobile", "Audacity", "Canva"],
        stepByStepGuide: [
          "Paso 1: Graba 2 partidos completos en Cara a Cara en la tablet.",
          "Paso 2: Haz cortes din\xE1micos en CapCut dejando solo las acciones de peligro.",
          "Paso 3: A\xF1ade m\xFAsica en\xE9rgica y locuci\xF3n explicativa."
        ]
      },
      alternativeNiches: [
        { nicheName: "Retos de F\xFAtbol M\xF3vil", whyItWorks: "Audiencia competitiva y masiva en Facebook.", device: "Super Tablet" }
      ]
    };
  }
  return {
    title: `Estrategia y Secretos Clave para Dominar en "${topic}"`,
    hook: `La gran mayor\xEDa no conoce este m\xE9todo en ${topic}... pero una vez que lo aplicas, tus resultados mejoran dr\xE1sticamente.`,
    contentCategory: category || "Gaming",
    recommendedFormat: "Video Largo (8-10 min) + 2 Shorts",
    dynamicRelatedTopics: [
      { label: `\u{1F3C6} Gu\xEDa Competitiva de ${topic}`, prompt: `Gu\xEDa avanzada y mejores trucos sobre ${topic}`, category: category || "Gaming" },
      { label: `\u26A1 Errores Clave en ${topic}`, prompt: `Los 5 errores que te impiden ganar en ${topic}`, category: category || "Gaming" },
      { label: `\u{1F3AE} Rendimiento \xD3ptimo para ${topic}`, prompt: `C\xF3mo configurar ${topic} para m\xE1xima fluidez y reflejos`, category: category || "Gaming" },
      { label: `\u{1F525} Reto Extremo en ${topic}`, prompt: `Reto de dificultad m\xE1xima en ${topic}`, category: category || "Gaming" },
      { label: `\u{1F4F1} Probando ${topic} en Hardware Real`, prompt: `Demostraci\xF3n de controles y rendimiento en ${topic}`, category: category || "Gaming" }
    ],
    youtubeStrategy: {
      titleIdea: `\xA1DOMINA POR COMPLETO! El Secreto de "${topic}" que Casi Nadie Conoce`,
      thumbnailIdea: `Tu rostro concentrado, elemento central de ${topic} iluminado, texto de impacto en alto contraste.`,
      seoTags: [topic.toLowerCase(), "olvis bolt", "guia", "trucos", "gameplay", "estrategia", "como mejorar"],
      descriptionTemplate: `En este video analizamos a fondo la mejor estrategia para ${topic}. \xA1Suscr\xEDbete a Olvis Bolt!`,
      retentionTechnique: "Coloca la jugada o revelaci\xF3n m\xE1s importante al minuto 3:30 para sostener la retenci\xF3n."
    },
    facebookStrategy: {
      titleIdea: `\xBFConoc\xEDas este truco en "${topic}"? La t\xE9cnica que cambiar\xE1 tus partidas`,
      hookStyle: "Momento clave de alta acci\xF3n en los primeros 3 segundos con subt\xEDtulos autom\xE1ticos.",
      viralShareTrigger: "Genera debate entre apasionados de la comunidad sobre cu\xE1l es la mejor forma de jugar.",
      monetizationTip: "Duraci\xF3n de 3:20 minutos para activar pausas publicitarias In-Stream con retenci\xF3n s\xF3lida."
    },
    theMissingGap: {
      whatCompetitorsDo: "Explicaciones gen\xE9ricas y sin demostraci\xF3n pr\xE1ctica bajo presi\xF3n.",
      whatNobodyHasUploaded: "Un paso a paso claro mostrando aciertos y errores reales.",
      fusionOrImprovementAngle: "Fusi\xF3n: Gu\xEDa Te\xF3rica + Demostraci\xF3n Pr\xE1ctica en Partida Real."
    },
    zeroBudgetProduction: {
      tabletRole: "Graba partidas a 60 FPS con audio interno en la Super Tablet o edita en CapCut t\xE1ctil.",
      pcRole: "Captura con OBS o procesa la locuci\xF3n en Audacity para m\xE1xima nitidez sonora.",
      freeTools: ["CapCut", "Audacity", "OBS Studio", "Canva"],
      stepByStepGuide: [
        "Paso 1: Graba 2 sesiones aplicando la estrategia.",
        "Paso 2: Graba tu comentario explicativo con energ\xEDa.",
        "Paso 3: Sincroniza audio y video en CapCut y a\xF1ade zoom en momentos clave."
      ]
    },
    alternativeNiches: [
      { nicheName: "An\xE1lisis Competitivo", whyItWorks: "Atrae a usuarios que buscan progresar r\xE1pidamente.", device: "Tablet o PC" }
    ]
  };
}
function buildComplete8MinuteDocumentary(topic, aiGeneratedData) {
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
    aiGeneratedData.acts.slice(0, 9).forEach((act, idx) => {
      if (doc.chapters && doc.chapters[idx] && act.chapterTitle) {
        doc.chapters[idx].chapterTitle = act.chapterTitle;
      }
    });
  }
  return doc;
}
function buildDynamicDocumentaryFallback(topic) {
  return buildComplete8MinuteDocumentary(topic);
}
function buildDynamicPOVFallback(scenario) {
  return {
    title: `POV: ${scenario}`,
    durationSeconds: 25,
    concept: "Vives en primera persona un momento hist\xF3rico de tensi\xF3n extrema con un giro aterrador en los \xFAltimos 5 segundos.",
    historicalFactBehind: "Hecho hist\xF3rico o cr\xF3nica antigua donde soldados y vig\xEDas viv\xEDan situaciones de terror psicol\xF3gico en completa oscuridad.",
    twistEnding: "Al romper la \xFAltima pared esperando enemigos humanos, descubres que la c\xE1mara subterr\xE1nea estaba sellada desde el exterior... y lo que ven\xEDa de las sombras nunca fue humano.",
    hookFirst3Sec: "POV: NUNCA DEBISTE QUEDARTE SOLO EN LA GUARDIA",
    dynamicRelatedTopics: [
      { label: "\u{1F3F0} Constantinopla: Los T\xFAneles Prohibidos", scenario: "POV: Eres el \xFAltimo guardia en los t\xFAneles subterr\xE1neos de Constantinopla, 1453" },
      { label: "\u26B0\uFE0F La Peste Negra: El Convento en Ruinas", scenario: "POV: Eres un m\xE9dico de la peste negra visitando un convento en 1348 y las monjas est\xE1n en el techo" },
      { label: "\u26F0\uFE0F Esparta: La Cueva del Monte Taigeto", scenario: "POV: Eres un guerrero espartano buscando a un ni\xF1o en las cuevas del monte Taigeto y despiertas a lo que vive all\xED" },
      { label: "\u2694\uFE0F Normand\xEDa 1066: El Pantano de la Muerte", scenario: "POV: Eres un soldado herido abandonado en el pantano tras Hastings y las criaturas despiertan" },
      { label: "\u{1F5E1}\uFE0F Los Templarios: La Cripta Maldita", scenario: "POV: Eres el novicio encargado de cerrar la cripta del templo y algo empuja la puerta desde abajo" }
    ],
    scenes: [
      {
        sceneNumber: 1,
        timestamp: "0:00 - 0:06",
        povVisual: "First person POV, 9:16 vertical, shaky camera walking down steep spiral damp stone stairs in total darkness, holding a sputtering torch.",
        googleFlowPrompt: "First person POV looking down spiraling damp stone medieval stairs, holding torch, deep shadows, 9:16 vertical ratio, cinematic dark atmosphere.",
        textOnScreen: "POV: Eres el \xFAltimo centinela en la guardia nocturna",
        audioAmbience: "Goteo constante, respiraci\xF3n agitada en primera persona, eco de pasos.",
        narration: "Nos dijeron que mantuvi\xE9ramos la antorcha encendida sin importar qu\xE9 escuch\xE1ramos..."
      },
      {
        sceneNumber: 2,
        timestamp: "0:06 - 0:13",
        povVisual: "Hand placing brass bowl of water on the damp floor. Ripples vibrate violently on the water surface.",
        googleFlowPrompt: "POV looking down at brass bowl of water on dungeon dirt floor vibrating violently with seismic waves, torchlight, 9:16 vertical.",
        textOnScreen: "El cuenco de agua no deja de vibrar...",
        audioAmbience: "Golpes secos bajo tierra: CLANG... CLANG... CLANG.",
        narration: "El agua vibraba cada tres segundos. Algo se mov\xEDa al otro lado del muro."
      },
      {
        sceneNumber: 3,
        timestamp: "0:13 - 0:20",
        povVisual: "Hands swinging iron pickaxe desperately against crumbling stone wall. Dust fills the air as a huge fissure cracks.",
        googleFlowPrompt: "POV swinging medieval heavy pickaxe smashing dark damp subterranean stone wall, stone chips flying, 9:16 ratio.",
        textOnScreen: "Rompimos la \xFAltima roca...",
        audioAmbience: "Metal contra roca desesperado, jadeos fatigados, silencio s\xFAbito.",
        narration: "Rompimos la pared... pero los ruidos se detuvieron instant\xE1neamente."
      },
      {
        sceneNumber: 4,
        timestamp: "0:20 - 0:25 (EL GIRO FINAL HORRIBLE)",
        povVisual: "Torchlight reveals dozens of tall elongated non-human silhouettes with hollow glowing sockets freezing, then sprinting directly into the camera lens.",
        googleFlowPrompt: "Horrific sudden reveal POV, torch illuminating towering shadowy elongated non-human figures in deep subterranean ancient vault turning heads toward viewer, terrifying dark folklore atmosphere, sudden motion blur, 9:16 vertical.",
        textOnScreen: "NO ERAN HERRAMIENTAS... QUER\xCDAN QUE LES ABRI\xC9RAMOS",
        audioAmbience: "Chillido desgarrador agudo, antorcha cae al barro apag\xE1ndose en negro total.",
        narration: "Los ruidos nunca fueron de excavaci\xF3n... quer\xEDan que les abri\xE9ramos."
      }
    ],
    pinnedCommentStrategy: "\xBFHabr\xEDas corrido o te habr\xEDas quedado? Deja tu respuesta y te cuento qu\xE9 dice la cr\xF3nica prohibida.",
    soundRecommendation: "Dark slowed ambience con latido de coraz\xF3n acelerado que se apaga bruscamente en el segundo 20."
  };
}
function getDynamicSuggestions(query = "", type = "content") {
  if (type === "documentary") {
    return [
      `El enigma silenciado de ${query || "los guerreros medievales"}`,
      `El castigo censurado que Roma ocult\xF3 sobre ${query || "los legionarios"}`,
      `C\xF3mo sobreviv\xEDan al fr\xEDo glacial en ${query || "los asedios antiguos"}`,
      `Los manuscritos prohibidos sobre ${query || "las fortalezas olvidadas"}`,
      `Lo que la historia jam\xE1s cont\xF3 de ${query || "los campamentos en guerra"}`
    ];
  } else if (type === "pov") {
    return [
      `POV: Eres el \xFAltimo centinela en ${query || "la torre"} y la antorcha se apaga`,
      `POV: Desciendes a la cripta de ${query || "los monjes"} y algo respira a tu lado`,
      `POV: Eres un vig\xEDa en ${query || "las murallas"} y las flechas no matan al enemigo`,
      `POV: Intentas curar la peste en ${query || "el convento"} pero los cuerpos se mueven`,
      `POV: Despiertas en el campo de batalla de ${query || "la antig\xFCedad"} y no hay supervivientes`
    ];
  } else {
    const isFortnite = /fortnite/i.test(query);
    if (isFortnite) {
      return [
        "Fortnite en PC modesta: C\xF3mo subir a 120 FPS fijos sin lag",
        "Reto Fortnite: Ganando partida usando solo armas grises",
        "Ajustes secretos de mallas bajas para eliminar el delay en Fortnite",
        "C\xF3mo grabar Fortnite con OBS Studio a 60 FPS sin tirones",
        "Fortnite Modo Rendimiento vs DirectX 12: Cu\xE1l va mejor en PC modesta"
      ];
    }
    return [
      `La gu\xEDa definitiva de ${query || "gaming"} para dominar`,
      `Errores que el 90% comete en ${query || "este juego"} y c\xF3mo ganar`,
      `El truco de configuraci\xF3n para ${query || "este t\xEDtulo"} que pocos conocen`,
      `Reto extremo en ${query || "tu partida"}`,
      `Comparativa definitiva de rendimiento para ${query || "este modo"}`
    ];
  }
}
if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
  app.use(express.static(path.resolve(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "dist", "index.html"));
  });
} else {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa"
  });
  app.use(vite.middlewares);
}
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Olvis Bolt Studio Server running on port ${PORT}`);
  });
}
var server_default = app;
export {
  server_default as default,
  getAiClient,
  getGeminiApiKey
};
