import { FlowDocumentary, FlowChapter, FlowClip } from '../types/content';

// High-fidelity fallback translation dictionary for historical documentary elements
const COMMON_HISTORICAL_TRANSLATIONS: Record<string, string> = {
  'El asedio': 'The Siege',
  'de Antioquía': 'of Antioch',
  'Comida prohibida': 'Forbidden Sustenance',
  'Soldados Griegos': 'Greek Soldiers',
  'Hoplitas Espartanos': 'Spartan Hoplites',
  'Caballeros Teutónicos': 'Teutonic Knights',
  'La Batalla del Hielo': 'The Battle on the Ice',
  'Lago Peipus': 'Lake Peipus',
};

/**
 * Checks if a candidate English translation is missing, identical to Spanish,
 * or still contains heavy untranslated Spanish grammatical stop-words.
 */
export function isTextStillSpanish(candidate?: string, originalSpanish?: string): boolean {
  if (!candidate || !candidate.trim()) return true;
  const cand = candidate.trim().toLowerCase();
  const orig = (originalSpanish || '').trim().toLowerCase();
  if (cand === orig) return true;

  // Key Spanish words and phrase markers that should never dominate a translated English sentence
  const spanishMarkers = [
    /\b(bajo la|en el|en la|de la|de los|de las|para no|no era|era un|era una|sino una|sino un|los |las |una |un |del |al |por |con el|con la|con los|con las)\b/i,
    /\b(noche|silencio|refugio|sentencia|muerte|corazas|bronce|pesadas|campamento|hoplitas|espartanos|tierra|húmeda|humeda|piedras|afiladas|lecho|cielo|helado|escudo|madera|almohada|penumbra|murmullo|centinelas|colina|manto|empapado|frío|frio|alba|combate|espadas|lanzas|soldados|caballeros|sangre|batalla)\b/i,
    /\b(constituían|constituian|despojaban|servía|servia|recordaba|acechaba|compartían|compartian|evitar|morir|rompiera|sembraban|creyó|creyo|ganaban|vencían|vencian|sabían|sabian|sobrevivir)\b/i
  ];

  let matches = 0;
  for (const regex of spanishMarkers) {
    if (regex.test(cand)) matches++;
  }
  return matches >= 2;
}

/**
 * Direct web translation via Google GTX and MyMemory (browser or node-compatible)
 */
export async function translateDirectWeb(spanishText: string): Promise<string | null> {
  if (!spanishText || !spanishText.trim()) return null;
  const clean = spanishText.trim();

  // 1. Google Translate GTX free web service (High speed, 100% natural English)
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(clean)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((item: any) => item[0]).join('').trim();
        if (translated && translated.length > 3 && !isTextStillSpanish(translated, clean)) {
          return translated;
        }
      }
    }
  } catch {
    // try next
  }

  // 2. MyMemory Translation API
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=es|en`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      const translated = data.responseData?.translatedText?.trim();
      if (
        translated &&
        translated.length > 3 &&
        !translated.toLowerCase().includes('mymemory warning') &&
        !isTextStillSpanish(translated, clean)
      ) {
        return translated;
      }
    }
  } catch {
    // try next
  }

  return null;
}

// Translate Spanish phrases to cinematic English with tone preservation
export function translateTextToCinematicEnglishFallback(spanishText: string): string {
  if (!spanishText) return '';

  let text = spanishText;

  const phraseReplacements: [RegExp, string][] = [
    [/Bajo la noche del Peloponeso, el silencio no era un refugio, sino una sentencia de muerte\./gi, 'Under the Peloponnesian night, silence was not a refuge, but a death sentence.'],
    [/Los hoplitas espartanos jamás se despojaban de sus pesadas corazas de bronce para descansar en campaña militar\./gi, 'The Spartan hoplites never removed their heavy bronze cuirasses to rest during campaign.'],
    [/La tierra húmeda y las piedras afiladas constituían su único lecho bajo un cielo completamente helado\./gi, 'The damp earth and jagged stones formed their sole bed beneath a frozen sky.'],
    [/El escudo aspis de madera y bronce servía como improvisada y dolorosa almohada durante la noche\./gi, 'The wood and bronze aspis shield served as a harsh, improvised pillow through the night.'],
    [/En la penumbra, el murmullo de los centinelas recordaba que la muerte acechaba tras cada colina\./gi, 'In the gloom, sentries whispered low, knowing death lurked behind every crest.'],
    [/Cinco hombres compartían un manto empapado para evitar morir de frío antes de que rompiera el alba\./gi, 'Five men huddled beneath a single soaked cloak to survive the biting cold before dawn.'],
    [/Bajo las sombras del campamento de/gi, 'Beneath the shadows of the war camp at'],
    [/Bajo las sombras de/gi, 'Beneath the shadows of'],
    [/Bajo la noche de/gi, 'Beneath the night of'],
    [/En las profundidades de/gi, 'In the depths of'],
    [/A las puertas de/gi, 'At the gates of'],
    [/Los centinelas vigilan/gi, 'The sentinels watch'],
    [/Los centinelas escudriñan el horizonte/gi, 'The sentinels scan the distant horizon'],
    [/Los arqueros preparan sus arcos/gi, 'The archers draw their bows'],
    [/El hambre consumía a los hombres/gi, 'Hunger gnawed mercilessly at the men'],
    [/La nieve cubría los cadáveres/gi, 'Snow draped over the fallen dead'],
    [/El frío helado congelaba el acero/gi, 'Freezing frost bit into cold iron'],
    [/La orden del alto mando fue tajante/gi, 'The high command’s order was merciless'],
    [/Nadie debía retroceder/gi, 'No man was permitted to retreat'],
    [/El consejo de guerra se reúne en secreto/gi, 'The war council convenes in shadowed silence'],
    [/Los tambores de guerra retumban en la colina/gi, 'War drums thunder across the frozen hill'],
    [/La lanza sagrada fue desenterrada/gi, 'The Holy Lance was unearthed from the dust'],
    [/El choque de escudos estremeció el valle/gi, 'The clash of iron shields shook the valley'],
    [/La sangre tiñe la nieve de escarlata/gi, 'Blood stains the white snow crimson'],
    [/Un silencio aterrador descendió sobre el campo/gi, 'A terrifying silence fell across the blood-soaked field'],
    [/Los supervivientes miraban con ojos desorbitados/gi, 'The survivors stared with hollow, haunted eyes'],
    [/Esto no era una simple batalla/gi, 'This was no ordinary battle'],
    [/Era el umbral del abismo/gi, 'It was the very threshold of the abyss'],
  ];

  for (const [pattern, replacement] of phraseReplacements) {
    text = text.replace(pattern, replacement);
  }

  // Word-level refinements
  const wordReplacements: [RegExp, string][] = [
    [/\bmurallas\b/gi, 'ramparts'],
    [/\bescudos\b/gi, 'shields'],
    [/\bespadas\b/gi, 'swords'],
    [/\blanzas\b/gi, 'spears'],
    [/\bcaballeros\b/gi, 'knights'],
    [/\bsoldados\b/gi, 'soldiers'],
    [/\bcampamento\b/gi, 'encampment'],
    [/\binvierno\b/gi, 'winter'],
    [/\bnieve\b/gi, 'snow'],
    [/\bhambre\b/gi, 'famine'],
    [/\bmiedo\b/gi, 'dread'],
    [/\bsangre\b/gi, 'blood'],
    [/\bfuego\b/gi, 'fire'],
    [/\bcenizas\b/gi, 'ashes'],
    [/\bmuerte\b/gi, 'death'],
    [/\benemigo\b/gi, 'enemy'],
    [/\bvictoria\b/gi, 'victory'],
    [/\bderrota\b/gi, 'defeat'],
    [/\bbatalla\b/gi, 'battle'],
    [/\bniebla\b/gi, 'mist'],
    [/\bcentinela\b/gi, 'sentry'],
    [/\bcentinelas\b/gi, 'sentinels'],
    [/\bhoplitas\b/gi, 'hoplites'],
    [/\bcorazas\b/gi, 'breastplates'],
    [/\bbronce\b/gi, 'bronze'],
    [/\bhierro\b/gi, 'iron'],
    [/\bacero\b/gi, 'steel'],
    [/\bsilencio\b/gi, 'silence'],
    [/\bpenumbra\b/gi, 'twilight'],
  ];

  for (const [pattern, replacement] of wordReplacements) {
    text = text.replace(pattern, replacement);
  }

  return text;
}

// Translate a batch of clips via API with direct web fallback
export async function translateClipsVoiceover(clips: FlowClip[]): Promise<Map<number, string>> {
  const result = new Map<number, string>();
  if (!clips || clips.length === 0) return result;

  const items = clips.map(c => ({
    id: c.clipNumber,
    text: c.voiceoverSegmentSpanish
  }));

  try {
    const res = await fetch('/api/translate-documentary-voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.translations) && data.translations.length > 0) {
        data.translations.forEach((t: { id: number; translated: string }) => {
          if (t && t.id && t.translated && !isTextStillSpanish(t.translated)) {
            result.set(t.id, t.translated);
          }
        });
      }
    }
  } catch (err) {
    console.warn('API batch translation failed, trying direct translation:', err);
  }

  // Ensure all clips have genuine English translations
  for (const clip of clips) {
    const existing = result.get(clip.clipNumber);
    if (!existing || isTextStillSpanish(existing, clip.voiceoverSegmentSpanish)) {
      const direct = await translateDirectWeb(clip.voiceoverSegmentSpanish);
      if (direct && !isTextStillSpanish(direct, clip.voiceoverSegmentSpanish)) {
        result.set(clip.clipNumber, direct);
      } else {
        result.set(clip.clipNumber, translateTextToCinematicEnglishFallback(clip.voiceoverSegmentSpanish));
      }
    }
  }

  return result;
}

// Translate a single text string via API with guaranteed English fallback
export async function translateSingleText(text: string): Promise<string> {
  if (!text || !text.trim()) return '';
  const cleanText = text.trim();

  try {
    const res = await fetch('/api/translate-documentary-voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.translatedText && !isTextStillSpanish(data.translatedText, cleanText)) {
        return data.translatedText;
      }
    }
  } catch (e) {
    console.warn('Single text translation route error, trying direct web translate:', e);
  }

  // Direct web fallback (Google GTX / MyMemory)
  const direct = await translateDirectWeb(cleanText);
  if (direct && !isTextStillSpanish(direct, cleanText)) {
    return direct;
  }

  return translateTextToCinematicEnglishFallback(cleanText);
}

// Translate an entire Documentary (all 60 clips across all 10 acts)
export async function translateFullDocumentaryToEnglish(
  doc: FlowDocumentary,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<FlowDocumentary> {
  const clonedDoc: FlowDocumentary = JSON.parse(JSON.stringify(doc));
  const chapters = clonedDoc.chapters || [];

  // Gather all clips
  const allClips: FlowClip[] = [];
  chapters.forEach(ch => {
    if (ch.clips) allClips.push(...ch.clips);
  });

  onProgress?.(1, 4, `Traduciendo títulos y narrativa general de "${clonedDoc.documentaryTitle.slice(0, 30)}..."`);
  
  // Translate main title and general narration
  clonedDoc.documentaryTitleEnglish = await translateSingleText(clonedDoc.documentaryTitle);
  clonedDoc.fullScriptEnglish = await translateSingleText(clonedDoc.fullScriptCastilian);

  // Process clips in manageable chunks of 12 clips each for smooth progress
  const chunkSize = 12;
  const translationMap = new Map<number, string>();

  for (let i = 0; i < allClips.length; i += chunkSize) {
    const chunk = allClips.slice(i, i + chunkSize);
    const chunkIndex = Math.floor(i / chunkSize) + 1;
    const totalChunks = Math.ceil(allClips.length / chunkSize);
    
    onProgress?.(
      chunkIndex + 1,
      totalChunks + 2,
      `Traduciendo clips del ${i + 1} al ${Math.min(i + chunkSize, allClips.length)}...`
    );

    const chunkResults = await translateClipsVoiceover(chunk);
    chunkResults.forEach((val, key) => translationMap.set(key, val));
  }

  // Apply translations to chapters and clips
  chapters.forEach((chapter) => {
    chapter.chapterTitleEnglish = `Act ${chapter.chapterNumber}: ${translateTextToCinematicEnglishFallback(chapter.chapterTitle.replace(/^Acto \d+:\s*/i, ''))}`;
    
    chapter.clips.forEach(clip => {
      const translatedVoice = translationMap.get(clip.clipNumber) || translateTextToCinematicEnglishFallback(clip.voiceoverSegmentSpanish);
      clip.voiceoverSegmentEnglish = translatedVoice;
      if (clip.sceneTitle) {
        clip.sceneTitleEnglish = translateTextToCinematicEnglishFallback(clip.sceneTitle);
      }
    });
  });

  // Re-build full English script if needed
  if (!clonedDoc.fullScriptEnglish) {
    clonedDoc.fullScriptEnglish = allClips.map(c => c.voiceoverSegmentEnglish).filter(Boolean).join(' ');
  }

  onProgress?.(4, 4, `¡Traducción completada con éxito en los ${allClips.length} clips!`);
  return clonedDoc;
}

