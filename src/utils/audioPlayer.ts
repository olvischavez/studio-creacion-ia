// Audio audition and voiceover download utility with Gemini TTS and Web Speech API
import { FlowChapter, FlowDocumentary, FlowClip } from '../types/content';
import { cleanStoryVoiceover } from './textCleaning';

export type VoiceOptionId = 'male_mature' | 'female_mature' | 'young_adventurous';

export interface VoiceProfile {
  id: VoiceOptionId;
  label: string;
  shortLabel: string;
  geminiVoice: {
    es: string;
    en: string;
  };
  narrationStyle: {
    es: string;
    en: string;
  };
  browserFallback: {
    gender: 'male' | 'female';
    pitch: number;
    rate: number;
  };
}

export const VOICE_PROFILES: Record<VoiceOptionId, VoiceProfile> = {
  male_mature: {
    id: 'male_mature',
    label: 'Masculino 50 años, voz profunda, madura, resonante y rasgada. Misterioso y cinematográfico.',
    shortLabel: 'Masculino 50 años (Profunda y madura)',
    geminiVoice: {
      es: 'Charon',
      en: 'Charon',
    },
    narrationStyle: {
      es: 'Masculino 50 años, voz profunda, madura, resonante y rasgada. Misterioso y cinematográfico.',
      en: '50-year-old American male narrator, deep, mature, resonant and raspy voice. Solemn, mysterious and cinematic.',
    },
    browserFallback: {
      gender: 'male',
      pitch: 0.65,
      rate: 0.84,
    },
  },
  female_mature: {
    id: 'female_mature',
    label: 'Mujer de 50 años, voz profunda, madura, resonante y rasgada. Misterioso y cinematográfico.',
    shortLabel: 'Mujer 50 años (Profunda y rasgada)',
    geminiVoice: {
      es: 'Kore',
      en: 'Kore',
    },
    narrationStyle: {
      es: 'Mujer de 50 años, voz profunda, madura, resonante y rasgada. Misterioso y cinematográfico.',
      en: '50-year-old mature American female narrator, deep, resonant, raspy and cinematic voice.',
    },
    browserFallback: {
      gender: 'female',
      pitch: 0.70,
      rate: 0.84,
    },
  },
  young_adventurous: {
    id: 'young_adventurous',
    label: 'Joven de 25 años, con voz aventurera e interesante.',
    shortLabel: 'Joven 25 años (Aventurera e interesante)',
    geminiVoice: {
      es: 'Puck',
      en: 'Puck',
    },
    narrationStyle: {
      es: 'Joven de 25 años, hombre aventurero, dinámico, curioso y entusiasta.',
      en: '25-year-old energetic, adventurous American male narrator, youthful, curious and engaging voice.',
    },
    browserFallback: {
      gender: 'male',
      pitch: 1.05,
      rate: 1.0,
    },
  },
};

export async function playNarrationAudio(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void,
  language: 'es' | 'en' = 'es',
  voiceType: VoiceOptionId = 'male_mature'
): Promise<() => void> {
  const cleanText = cleanStoryVoiceover(text);
  let stopFn = () => {};

  const profile = VOICE_PROFILES[voiceType] || VOICE_PROFILES.male_mature;
  const chosenVoice = profile.geminiVoice[language];
  const styleDescription = profile.narrationStyle[language];

  try {
    onStart?.();
    // Try server-side Gemini TTS
    const res = await fetch('/api/generate-tts-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: cleanText, 
        voiceName: chosenVoice, 
        language,
        voiceType,
        styleDescription 
      }),
    });

    const data = await res.json();

    if (data.available && data.audioData) {
      const audio = new Audio(data.audioData);
      audio.onended = () => onEnd?.();
      audio.onerror = (e) => {
        console.warn('Audio element error, falling back to browser voice:', e);
        fallbackBrowserSpeech(text, onEnd, onError, language, voiceType);
      };
      audio.play().catch(() => {
        fallbackBrowserSpeech(text, onEnd, onError, language, voiceType);
      });

      stopFn = () => {
        audio.pause();
        audio.currentTime = 0;
      };
      return stopFn;
    } else {
      return fallbackBrowserSpeech(text, onEnd, onError, language, voiceType);
    }
  } catch (err) {
    console.warn('TTS request error, using fallback:', err);
    return fallbackBrowserSpeech(text, onEnd, onError, language, voiceType);
  }
}

function fallbackBrowserSpeech(
  text: string,
  onEnd?: () => void,
  onError?: (err: any) => void,
  language: 'es' | 'en' = 'es',
  voiceType: VoiceOptionId = 'male_mature'
): () => void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onError?.('Síntesis de voz no disponible en este navegador');
    onEnd?.();
    return () => {};
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === 'en' ? 'en-US' : 'es-ES';

  const profile = VOICE_PROFILES[voiceType] || VOICE_PROFILES.male_mature;
  utterance.rate = profile.browserFallback.rate;
  utterance.pitch = profile.browserFallback.pitch;

  const assignVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;

    const isFemale = profile.browserFallback.gender === 'female';

    let targetVoice: SpeechSynthesisVoice | undefined;

    if (language === 'en') {
      // Prioritize strict American English (en-US) voices
      const usVoices = voices.filter(v => 
        v.lang === 'en-US' || 
        v.lang === 'en_US' || 
        v.name.toLowerCase().includes('united states') || 
        v.name.toLowerCase().includes('us')
      );
      const enPool = usVoices.length > 0 ? usVoices : voices.filter(v => v.lang.startsWith('en'));

      if (isFemale) {
        // 50-year-old mature female American voice
        targetVoice = enPool.find(v => 
          v.name.includes('Aria') || 
          v.name.includes('Jenny') || 
          v.name.includes('Zira') || 
          v.name.includes('Samantha') || 
          v.name.includes('Natural') ||
          v.name.toLowerCase().includes('female')
        ) || enPool[0];
      } else {
        if (voiceType === 'male_mature') {
          // 50-year-old deep raspy male American voice
          targetVoice = enPool.find(v => 
            v.name.includes('David') || 
            v.name.includes('Mark') || 
            v.name.includes('Guy') || 
            v.name.toLowerCase().includes('male') ||
            v.name.includes('Google US English')
          ) || enPool[0];
        } else {
          // 25-year-old adventurous young American male voice
          targetVoice = enPool.find(v => 
            v.name.includes('Guy') || 
            v.name.includes('Natural') || 
            v.name.includes('Mark') || 
            v.name.includes('David') || 
            v.name.includes('Google US English')
          ) || enPool[0];
        }
      }
    } else {
      // Spanish voices (prioritize es-ES, es-MX, es-US)
      const esVoices = voices.filter(v => v.lang.startsWith('es'));

      if (isFemale) {
        targetVoice = esVoices.find(v => 
          v.name.includes('Helena') || 
          v.name.includes('Monica') || 
          v.name.includes('Mónica') || 
          v.name.includes('Sabina') || 
          v.name.includes('Laura') || 
          v.name.includes('Paulina') || 
          v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('mujer')
        ) || esVoices[0];
      } else {
        targetVoice = esVoices.find(v => 
          v.name.includes('Jorge') || 
          v.name.includes('Pablo') || 
          v.name.includes('Alonso') || 
          v.name.includes('Diego') || 
          v.name.includes('Castellano') || 
          v.name.toLowerCase().includes('male') ||
          v.name.toLowerCase().includes('hombre')
        ) || esVoices[0];
      }
    }

    if (targetVoice) {
      utterance.voice = targetVoice;
    }
  };

  assignVoice();

  // If voices were not loaded yet, assign when ready
  if (!utterance.voice && window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      assignVoice();
    };
  }

  utterance.onend = () => onEnd?.();
  utterance.onerror = (e) => {
    console.warn('SpeechSynthesis error:', e);
    onError?.(e);
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);

  return () => {
    window.speechSynthesis.cancel();
  };
}

// Download a string as a file
export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Convert base64 data to Blob URL for fast and reliable file download in all browsers
function base64ToBlobUrl(base64Data: string, mimeType: string = 'audio/wav'): string {
  try {
    const base64WithoutHeader = base64Data.replace(/^data:[^;]+;base64,/, '');
    const byteCharacters = atob(base64WithoutHeader);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (e) {
    return base64Data;
  }
}

// Download voiceover audio (.wav) via server TTS (Spanish or English)
export async function downloadVoiceAudio(
  text: string,
  filename: string,
  fallbackTextContent?: string,
  language: 'es' | 'en' = 'es',
  voiceType: VoiceOptionId = 'male_mature'
): Promise<{ success: boolean; isAudio: boolean; message: string }> {
  try {
    const cleanText = cleanStoryVoiceover(text);
    const profile = VOICE_PROFILES[voiceType] || VOICE_PROFILES.male_mature;
    const chosenVoice = profile.geminiVoice[language];
    const styleDescription = profile.narrationStyle[language];

    const res = await fetch('/api/generate-tts-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: cleanText, 
        voiceName: chosenVoice, 
        language,
        voiceType,
        styleDescription 
      }),
    });

    const data = await res.json();

    if (data.available && data.audioData) {
      const blobUrl = base64ToBlobUrl(data.audioData);
      const link = document.createElement('a');
      link.href = blobUrl;
      const cleanFilename = filename.endsWith('.wav') ? filename : `${filename}.wav`;
      link.download = cleanFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (blobUrl.startsWith('blob:')) {
        setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
      }
      return { 
        success: true, 
        isAudio: true, 
        message: `Audio WAV en ${language === 'en' ? 'Inglés' : 'Español'} (${cleanFilename}) descargado con éxito` 
      };
    } else {
      // Fallback: download the text script
      const txtFilename = filename.replace(/\.(wav|mp3)$/i, '') + '.txt';
      downloadTextFile(txtFilename, fallbackTextContent || cleanText);
      return { success: true, isAudio: false, message: `Guion de locución descargado en formato ${txtFilename}` };
    }
  } catch (err: any) {
    console.warn('Error downloading voice audio, falling back to text:', err);
    const cleanText = cleanStoryVoiceover(text);
    const txtFilename = filename.replace(/\.(wav|mp3)$/i, '') + '.txt';
    downloadTextFile(txtFilename, fallbackTextContent || cleanText);
    return { success: true, isAudio: false, message: `Guion descargado en formato ${txtFilename}` };
  }
}

// Helper to compile all voiceovers of an Act into text
export function getActCombinedVoiceover(act: FlowChapter, language: 'es' | 'en' = 'es'): string {
  if (!act.clips || act.clips.length === 0) return '';
  return act.clips.map((c) => {
    if (language === 'en' && c.voiceoverSegmentEnglish) {
      return cleanStoryVoiceover(c.voiceoverSegmentEnglish);
    }
    return cleanStoryVoiceover(c.voiceoverSegmentSpanish);
  }).join(' ');
}

// Generate formatted script text for an individual Clip
export function generateClipScriptText(
  clip: FlowClip, 
  documentaryTitle: string, 
  language: 'es' | 'en' = 'es',
  voiceType: VoiceOptionId = 'male_mature'
): string {
  const isEn = language === 'en';
  const profile = VOICE_PROFILES[voiceType] || VOICE_PROFILES.male_mature;
  const sanitizedTitle = documentaryTitle || 'Documental';
  const voiceText = cleanStoryVoiceover((isEn && clip.voiceoverSegmentEnglish) ? clip.voiceoverSegmentEnglish : clip.voiceoverSegmentSpanish);

  let txt = `================================================================================\n`;
  txt += `CANAL OLVIS BOLT — ${isEn ? 'CLIP VOICEOVER SCRIPT' : 'GUION DE LOCUCIÓN DE CLIP'}\n`;
  txt += `DOCUMENTAL: ${sanitizedTitle.toUpperCase()}\n`;
  txt += `CLIP: ${clip.clipNumber} (${clip.timeRange})\n`;
  txt += `VOZ / VOICE PROFILE: ${profile.label}\n`;
  txt += `================================================================================\n\n`;
  txt += `${isEn ? 'VOICEOVER' : 'VOZ EN OFF'} (${isEn ? 'EN' : 'ES'}):\n"${voiceText}"\n\n`;
  txt += `${isEn ? 'SFX' : 'EFECTOS DE SONIDO'}: ${clip.soundEffects || 'Ambiente histórico'}\n`;
  return txt;
}

// Generate formatted script text for an entire Act (6 clips)
export function generateActScriptText(
  act: FlowChapter, 
  documentaryTitle: string, 
  language: 'es' | 'en' = 'es',
  voiceType: VoiceOptionId = 'male_mature'
): string {
  const combined = getActCombinedVoiceover(act, language);
  const sanitizedTitle = documentaryTitle || 'Documental';
  const isEn = language === 'en';
  const profile = VOICE_PROFILES[voiceType] || VOICE_PROFILES.male_mature;

  let txt = `================================================================================\n`;
  txt += `CANAL OLVIS BOLT — ${isEn ? 'ENGLISH VOICEOVER SCRIPT' : 'GUION DE VOZ EN OFF (LOCUCIÓN)'}\n`;
  txt += `DOCUMENTAL: ${sanitizedTitle.toUpperCase()}\n`;
  txt += `${(isEn && act.chapterTitleEnglish ? act.chapterTitleEnglish : act.chapterTitle).toUpperCase()} (TIME: ${act.timestamp})\n`;
  txt += `DURACIÓN: 60 ${isEn ? 'Seconds (6 Continuous 10s Clips)' : 'Segundos (6 Clips de 10s Continuos)'}\n`;
  txt += `VOZ SELECCIONADA / VOICE PROFILE: ${profile.label}\n`;
  txt += `================================================================================\n\n`;

  txt += `--- ${isEn ? 'CONTINUOUS ACT VOICEOVER (For TTS or live read)' : 'LOCUCIÓN CONTINUA DEL ACTO (Para leer de corrido o software TTS)'} ---\n`;
  txt += `"${combined}"\n\n`;

  txt += `--------------------------------------------------------------------------------\n`;
  txt += `${isEn ? 'CLIP BY CLIP BREAKDOWN (EXACTLY 10 SECONDS EACH):' : 'DESGLOSE CLIP POR CLIP (EXACTAMENTE 10 SEGUNDOS CADA UNO):'}\n`;
  txt += `--------------------------------------------------------------------------------\n\n`;

  act.clips.forEach((clip) => {
    txt += `[CLIP ${clip.clipNumber}] — ${clip.timeRange}\n`;
    if (isEn && clip.sceneTitleEnglish) {
      txt += `Scene: ${clip.sceneTitleEnglish}\n`;
    } else if (clip.sceneTitle) {
      txt += `Escena: ${clip.sceneTitle}\n`;
    }
    const voiceText = cleanStoryVoiceover((isEn && clip.voiceoverSegmentEnglish) ? clip.voiceoverSegmentEnglish : clip.voiceoverSegmentSpanish);
    txt += `${isEn ? 'Voiceover' : 'Voz en off'}: "${voiceText}"\n`;
    txt += `${isEn ? 'SFX' : 'Efectos sonoros'}: ${clip.soundEffects || 'War drum, distant howling wind'}\n`;
    txt += `--------------------------------------------------------------------------------\n`;
  });

  txt += `\n${isEn ? `End of Act ${act.chapterNumber}.` : `Fin del Acto ${act.chapterNumber}.`}\n`;
  return txt;
}

// Generate master script text for the entire 10-minute documentary (60 clips)
export function generateMasterDocumentaryScript(
  doc: FlowDocumentary, 
  language: 'es' | 'en' = 'es',
  voiceType: VoiceOptionId = 'male_mature'
): string {
  const isEn = language === 'en';
  const title = (isEn && doc.documentaryTitleEnglish ? doc.documentaryTitleEnglish : doc.documentaryTitle) || 'Historias y Documentales';
  const fullScript = (isEn && doc.fullScriptEnglish ? doc.fullScriptEnglish : doc.fullScriptCastilian);
  const profile = VOICE_PROFILES[voiceType] || VOICE_PROFILES.male_mature;
  
  let txt = `================================================================================\n`;
  txt += `CANAL OLVIS BOLT — ${isEn ? 'MASTER 10-MINUTE VOICEOVER SCRIPT (ENGLISH)' : 'GUION MAESTRO COMPLETO DE VOZ EN OFF (10 MINUTOS)'}\n`;
  txt += `DOCUMENTAL: ${title.toUpperCase()}\n`;
  txt += `TOPIC / TEMÁTICA: ${doc.historicalTopic}\n`;
  txt += `DURATION: 10 Minutes (10 Acts • 60 Clips of 10s • 600 Seconds)\n`;
  txt += `VOICE PROFILE / VOZ SELECCIONADA: ${profile.label}\n`;
  txt += `STYLE: ${isEn ? 'Cinematic English Historical Narration' : 'Narración Histórica Cinematográfica en Español'}\n`;
  txt += `================================================================================\n\n`;

  txt += `=== ${isEn ? 'MASTER CONTINUOUS SCRIPT (10 FULL MINUTES)' : 'GUION MAESTRO CONTINUO (10 MINUTOS COMPLETOS)'} ===\n`;
  txt += `"${fullScript}"\n\n`;
  txt += `================================================================================\n`;
  txt += `${isEn ? 'STRUCTURE OF THE 10 ACTS AND 60 NUMBERED CLIPS:' : 'ESTRUCTURA DE LOS 10 ACTOS Y 60 CLIPS NUMERADOS:'}\n`;
  txt += `================================================================================\n\n`;

  if (doc.chapters && doc.chapters.length > 0) {
    doc.chapters.forEach((chapter) => {
      const actTitle = (isEn && chapter.chapterTitleEnglish ? chapter.chapterTitleEnglish : chapter.chapterTitle);
      txt += `\n################################################################################\n`;
      txt += `ACT ${chapter.chapterNumber}: ${actTitle.toUpperCase()} (${chapter.timestamp})\n`;
      txt += `################################################################################\n\n`;

      chapter.clips.forEach((clip) => {
        const sceneTitle = isEn && clip.sceneTitleEnglish ? clip.sceneTitleEnglish : clip.sceneTitle;
        const voiceText = isEn && clip.voiceoverSegmentEnglish ? clip.voiceoverSegmentEnglish : clip.voiceoverSegmentSpanish;
        txt += `[CLIP ${clip.clipNumber} • ${clip.timeRange}] ${sceneTitle ? `— ${sceneTitle}` : ''}\n`;
        txt += `${isEn ? 'Voice' : 'Locución'}: "${voiceText}"\n`;
        txt += `${isEn ? 'Sound' : 'Sonido'}: ${clip.soundEffects}\n\n`;
      });
    });
  }

  txt += `================================================================================\n`;
  txt += `${isEn ? 'End of master English script. Produced for Olvis Bolt channel.' : 'Fin del guion maestro. Producido para el canal Olvis Bolt.'}\n`;
  return txt;
}
