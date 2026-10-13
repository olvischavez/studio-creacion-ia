import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Film, 
  Volume2, 
  Copy, 
  Check, 
  Play, 
  Square, 
  Eye, 
  Download, 
  Clock, 
  Layers, 
  Search, 
  ShieldAlert, 
  BookOpen, 
  Lightbulb, 
  RefreshCw, 
  Bookmark, 
  ListOrdered,
  Flame,
  FileText,
  Loader2,
  Globe,
  Languages
} from 'lucide-react';
import { FlowDocumentary, POVShort, FlowClip, FlowChapter } from '../types/content';
import { 
  playNarrationAudio,
  downloadVoiceAudio,
  downloadTextFile,
  getActCombinedVoiceover,
  generateActScriptText,
  generateMasterDocumentaryScript,
  generateClipScriptText,
  VoiceOptionId,
  VOICE_PROFILES
} from '../utils/audioPlayer';
import { AnimationStyle, applyAnimationStyle, formatClipGoogleFlowPrompt } from '../utils/promptStyles';
import { 
  translateFullDocumentaryToEnglish,
  translateSingleText,
  translateClipsVoiceover,
  translateTextToCinematicEnglishFallback,
  isTextStillSpanish
} from '../utils/translator';
import { cleanStoryVoiceover } from '../utils/textCleaning';

interface AICreationTabProps {
  documentary: FlowDocumentary;
  povShort: POVShort;
  onGenerateDocumentary: (topic: string) => Promise<void>;
  onGeneratePOV: (scenario: string) => Promise<void>;
  isLoading: boolean;
  onSave: (item: any) => void;
  isDocSaved: boolean;
  isPovSaved: boolean;
}

const DEFAULT_DOC_TOPICS = [
  { label: '🛡️ Cómo dormían los soldados griegos en campaña', topic: 'Cómo dormían los soldados griegos en las guerras de la antigüedad' },
  { label: '🥩 El asedio de Antioquía: Comida prohibida', topic: 'La comida de pesadilla y canibalismo silenciado de los cruzados en el asedio de Antioquía' },
  { label: '❄️ Armaduras teutónicas en el lago helado', topic: 'El peso y ahogamiento de los caballeros teutónicos con armaduras en el lago helado de Peipus' },
  { label: '💀 Cirugía cerebral sin anestesia en Roma', topic: 'La trepanación y cirugías de cráneo sin anestesia en los campamentos de legionarios romanos' },
  { label: '🗡️ Los rituales secretos de la Guardia Varega', topic: 'Los rituales de castigo y juramentos de sangre prohibidos de la guardia varega en Constantinopla' }
];

const DEFAULT_POV_TOPICS = [
  { label: '🏰 Constantinopla: Los ruidos en el túnel (1453)', scenario: 'POV: Eres el último guardia en los túneles subterráneos de Constantinopla, 1453' },
  { label: '⚰️ La Peste Negra: El convento abandonado (1348)', scenario: 'POV: Eres un médico de la peste negra visitando un convento en 1348 y las monjas están en el techo' },
  { label: '⛰️ Esparta: La cueva del monte Taigeto', scenario: 'POV: Eres un guerrero espartano buscando a un niño en las cuevas del monte Taigeto y despiertas a lo que vive allí' },
  { label: '⚔️ Normandía 1066: El pantano tras la batalla', scenario: 'POV: Eres un soldado herido abandonado en el pantano tras Hastings y las criaturas despiertan' },
  { label: '🗡️ Los Templarios: La Cripta Maldita', scenario: 'POV: Eres el novicio encargado de cerrar la cripta del templo y algo empuja la puerta desde abajo' }
];

export const AICreationTab: React.FC<AICreationTabProps> = ({
  documentary,
  povShort,
  onGenerateDocumentary,
  onGeneratePOV,
  isLoading,
  onSave,
  isDocSaved,
  isPovSaved
}) => {
  const [subTab, setSubTab] = useState<'documentary' | 'pov'>('documentary');
  const [customTopic, setCustomTopic] = useState('');
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [activeClipNumber, setActiveClipNumber] = useState<number>(1);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Audio state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [stopAudioFn, setStopAudioFn] = useState<(() => void) | null>(null);
  const [selectedVoiceType, setSelectedVoiceType] = useState<VoiceOptionId>('male_mature');

  // Animation style for prompts ('magazine' -> Estilo Revista | 'cyberpunk' -> Estilo Cyber punk)
  const [animationStyle, setAnimationStyle] = useState<AnimationStyle>('magazine');

  // Per-clip language mode ('es' | 'en')
  const [clipLanguageMap, setClipLanguageMap] = useState<Record<number, 'es' | 'en'>>({});

  // Documentary local state for English voiceover mutations
  const [currentDoc, setCurrentDoc] = useState<FlowDocumentary>(documentary);
  const [selectedLanguage, setSelectedLanguage] = useState<'es' | 'en'>('es');
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);
  const [translationProgress, setTranslationProgress] = useState<string | null>(null);

  // Dynamic Topics that refresh with every search!
  const [docTopics, setDocTopics] = useState(DEFAULT_DOC_TOPICS);
  const [povTopics, setPovTopics] = useState(DEFAULT_POV_TOPICS);

  // AI suggestions
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Update dynamic buttons whenever documentary changes
  useEffect(() => {
    setCurrentDoc(documentary);
    setSelectedLanguage('es');
    setClipLanguageMap({});
    if (documentary.dynamicRelatedTopics && documentary.dynamicRelatedTopics.length > 0) {
      setDocTopics(documentary.dynamicRelatedTopics);
    }
    // Reset active chapter and clip on new documentary
    setActiveChapterIndex(0);
    setActiveClipNumber(1);
  }, [documentary]);

  // Update dynamic buttons whenever POV short changes
  useEffect(() => {
    if (povShort.dynamicRelatedTopics && povShort.dynamicRelatedTopics.length > 0) {
      setPovTopics(povShort.dynamicRelatedTopics);
    }
  }, [povShort]);

  const hasEnglishTranslation = Boolean(
    currentDoc.chapters?.some(ch => ch.clips?.some(c => Boolean(c.voiceoverSegmentEnglish)))
  );

  const handleTranslateDocumentaryToEnglish = async () => {
    setIsTranslatingAll(true);
    setTranslationProgress('Iniciando traducción al inglés cinematográfico con IA...');
    setAudioFeedback('Traduciendo los 60 clips al inglés con IA (estilo narrador BBC)...');
    try {
      const translated = await translateFullDocumentaryToEnglish(currentDoc, (curr, total, msg) => {
        setTranslationProgress(`[${curr}/${total}] ${msg}`);
        setAudioFeedback(msg);
      });
      setCurrentDoc(translated);
      setSelectedLanguage('en');
      setAudioFeedback('✓ ¡Voz en off de los 60 clips traducida al inglés con éxito! Ahora puedes escucharla y descargar los audios en inglés.');
    } catch (err: any) {
      console.error('Translation error:', err);
      setAudioFeedback('Error al traducir, por favor intenta de nuevo');
    } finally {
      setIsTranslatingAll(false);
      setTranslationProgress(null);
      setTimeout(() => setAudioFeedback(null), 6000);
    }
  };

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePlayVoice = async (text: string, lang: 'es' | 'en' = selectedLanguage, voiceType: VoiceOptionId = selectedVoiceType) => {
    if (isPlayingAudio && stopAudioFn) {
      stopAudioFn();
      setIsPlayingAudio(false);
      setStopAudioFn(null);
      return;
    }

    setIsPlayingAudio(true);
    const stop = await playNarrationAudio(
      text,
      () => setIsPlayingAudio(true),
      () => {
        setIsPlayingAudio(false);
        setStopAudioFn(null);
      },
      (err) => {
        console.warn(err);
        setIsPlayingAudio(false);
        setStopAudioFn(null);
      },
      lang,
      voiceType
    );
    setStopAudioFn(() => stop);
  };

  // Voiceover download states and handlers for each Act and clips
  const [downloadingAudioAct, setDownloadingAudioAct] = useState<number | null>(null);
  const [downloadingAudioClip, setDownloadingAudioClip] = useState<number | null>(null);
  const [isDownloadingMaster, setIsDownloadingMaster] = useState(false);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [translatingActNumber, setTranslatingActNumber] = useState<number | null>(null);
  const [translatingClipNumber, setTranslatingClipNumber] = useState<number | null>(null);
  const [audioFeedback, setAudioFeedback] = useState<string | null>(null);

  // Translate a single act (all 6 clips of this act)
  const handleTranslateAct = async (act: FlowChapter) => {
    setTranslatingActNumber(act.chapterNumber);
    setAudioFeedback(`Traduciendo los ${act.clips.length} clips del Acto ${act.chapterNumber} al inglés...`);
    try {
      const translations = await translateClipsVoiceover(act.clips);
      setCurrentDoc(prev => {
        const next = { ...prev };
        if (next.chapters) {
          const target = next.chapters.find(ch => ch.chapterNumber === act.chapterNumber);
          if (target && target.clips) {
            target.chapterTitleEnglish = `Act ${target.chapterNumber}: ${translateTextToCinematicEnglishFallback(target.chapterTitle.replace(/^Acto \d+:\s*/i, ''))}`;
            target.clips.forEach(c => {
              const trans = translations.get(c.clipNumber) || translateTextToCinematicEnglishFallback(c.voiceoverSegmentSpanish);
              c.voiceoverSegmentEnglish = trans;
              if (c.sceneTitle) c.sceneTitleEnglish = translateTextToCinematicEnglishFallback(c.sceneTitle);
            });
          }
        }
        return next;
      });
      setSelectedLanguage('en');
      setAudioFeedback(`✓ ¡Voz en off del Acto ${act.chapterNumber} traducida al inglés con éxito! Ahora puedes escucharla y descargarla.`);
    } catch (e: any) {
      console.error('Error translating act:', e);
      setAudioFeedback('Error al traducir el acto, usando traducción cinemática fallback');
    } finally {
      setTranslatingActNumber(null);
      setTimeout(() => setAudioFeedback(null), 5000);
    }
  };

  // Translate an individual clip
  const handleTranslateClip = async (clip: FlowClip): Promise<string> => {
    setTranslatingClipNumber(clip.clipNumber);
    setAudioFeedback(`Traduciendo voz en off del Clip ${clip.clipNumber} al inglés...`);
    try {
      const translatedVoice = await translateSingleText(clip.voiceoverSegmentSpanish);
      clip.voiceoverSegmentEnglish = translatedVoice;
      if (clip.sceneTitle) {
        clip.sceneTitleEnglish = translateTextToCinematicEnglishFallback(clip.sceneTitle);
      }
      setCurrentDoc(prev => {
        const next = { ...prev };
        if (next.chapters) {
          next.chapters.forEach(ch => {
            const foundClip = ch.clips?.find(c => c.clipNumber === clip.clipNumber);
            if (foundClip) {
              foundClip.voiceoverSegmentEnglish = translatedVoice;
              if (foundClip.sceneTitle) {
                foundClip.sceneTitleEnglish = translateTextToCinematicEnglishFallback(foundClip.sceneTitle);
              }
            }
          });
        }
        return next;
      });
      setClipLanguageMap(prev => ({ ...prev, [clip.clipNumber]: 'en' }));
      setAudioFeedback(`✓ ¡Clip ${clip.clipNumber} traducido al inglés!`);
      return translatedVoice;
    } catch (e) {
      console.error(e);
      setAudioFeedback('Error al traducir clip');
      return '';
    } finally {
      setTranslatingClipNumber(null);
      setTimeout(() => setAudioFeedback(null), 4000);
    }
  };

  // Toggle clip language between Spanish and English
  const handleToggleClipLanguage = async (clip: FlowClip) => {
    const currentLang = clipLanguageMap[clip.clipNumber] || 'es';
    if (currentLang === 'en') {
      // Return to Spanish
      setClipLanguageMap(prev => ({ ...prev, [clip.clipNumber]: 'es' }));
      setAudioFeedback(`✓ Voz en off del Clip ${clip.clipNumber} en Español.`);
      setTimeout(() => setAudioFeedback(null), 3000);
    } else {
      // Switch to English: translate if missing or still in Spanish
      if (!clip.voiceoverSegmentEnglish || isTextStillSpanish(clip.voiceoverSegmentEnglish, clip.voiceoverSegmentSpanish)) {
        await handleTranslateClip(clip);
      } else {
        setClipLanguageMap(prev => ({ ...prev, [clip.clipNumber]: 'en' }));
        setAudioFeedback(`✓ Voz en off del Clip ${clip.clipNumber} en Inglés.`);
        setTimeout(() => setAudioFeedback(null), 3000);
      }
    }
  };

  const handleDownloadActAudio = async (act: FlowChapter, lang: 'es' | 'en' = selectedLanguage) => {
    setDownloadingAudioAct(act.chapterNumber);
    const isEn = lang === 'en';

    // Auto-translate if English requested and clips missing English
    if (isEn && act.clips.some(c => !c.voiceoverSegmentEnglish || isTextStillSpanish(c.voiceoverSegmentEnglish, c.voiceoverSegmentSpanish))) {
      setAudioFeedback(`Traduciendo clips del Acto ${act.chapterNumber} al inglés antes de descargar...`);
      const translations = await translateClipsVoiceover(act.clips);
      act.clips.forEach(c => {
        if (!c.voiceoverSegmentEnglish || isTextStillSpanish(c.voiceoverSegmentEnglish, c.voiceoverSegmentSpanish)) {
          c.voiceoverSegmentEnglish = translations.get(c.clipNumber) || translateTextToCinematicEnglishFallback(c.voiceoverSegmentSpanish);
        }
      });
    }

    setAudioFeedback(`Generando audio WAV en ${isEn ? 'Inglés' : 'Español'} de los ${act.clips?.length || 6} clips del Acto ${act.chapterNumber} (${VOICE_PROFILES[selectedVoiceType].shortLabel})...`);
    const combinedVoice = getActCombinedVoiceover(act, lang);
    const scriptTxt = generateActScriptText(act, currentDoc.documentaryTitle, lang, selectedVoiceType);
    const actTitle = isEn && act.chapterTitleEnglish ? act.chapterTitleEnglish : act.chapterTitle;
    const filename = `OlvisBolt_${isEn ? 'English' : 'Spanish'}_Voice_Act_${act.chapterNumber}_${selectedVoiceType}_${actTitle.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const result = await downloadVoiceAudio(combinedVoice, filename, scriptTxt, lang, selectedVoiceType);
    setDownloadingAudioAct(null);
    setAudioFeedback(result.message);
    setTimeout(() => setAudioFeedback(null), 5000);
  };

  const handleDownloadAllClipsIndividually = async (act: FlowChapter, lang: 'es' | 'en' = selectedLanguage) => {
    if (!act.clips || act.clips.length === 0) return;
    const isEn = lang === 'en';
    setIsBatchDownloading(true);

    if (isEn && act.clips.some(c => !c.voiceoverSegmentEnglish || isTextStillSpanish(c.voiceoverSegmentEnglish, c.voiceoverSegmentSpanish))) {
      setAudioFeedback(`Traduciendo clips del Acto ${act.chapterNumber} al inglés...`);
      const translations = await translateClipsVoiceover(act.clips);
      act.clips.forEach(c => {
        if (!c.voiceoverSegmentEnglish || isTextStillSpanish(c.voiceoverSegmentEnglish, c.voiceoverSegmentSpanish)) {
          c.voiceoverSegmentEnglish = translations.get(c.clipNumber) || translateTextToCinematicEnglishFallback(c.voiceoverSegmentSpanish);
        }
      });
    }

    setAudioFeedback(`Iniciando descarga individual en ${isEn ? 'Inglés' : 'Español'} de los ${act.clips.length} clips del Acto ${act.chapterNumber}...`);
    
    for (let i = 0; i < act.clips.length; i++) {
      const clip = act.clips[i];
      const rawVoice = isEn && clip.voiceoverSegmentEnglish ? clip.voiceoverSegmentEnglish : clip.voiceoverSegmentSpanish;
      const voiceText = cleanStoryVoiceover(rawVoice);
      setAudioFeedback(`Descargando Clip ${clip.clipNumber} en ${isEn ? 'Inglés' : 'Español'} (${i + 1}/${act.clips.length})...`);
      const scene = (isEn && clip.sceneTitleEnglish ? clip.sceneTitleEnglish : clip.sceneTitle) || 'Clip';
      const filename = `OlvisBolt_${isEn ? 'EN' : 'ES'}_Act${act.chapterNumber}_Clip${clip.clipNumber}_${selectedVoiceType}_${scene.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}`;
      await downloadVoiceAudio(voiceText, filename, undefined, lang, selectedVoiceType);
      await new Promise(r => setTimeout(r, 600));
    }
    
    setIsBatchDownloading(false);
    setAudioFeedback(`✓ ¡Descargados los ${act.clips.length} clips de audio en ${isEn ? 'Inglés' : 'Español'} del Acto ${act.chapterNumber}!`);
    setTimeout(() => setAudioFeedback(null), 5000);
  };

  const handleDownloadActScript = (act: FlowChapter, lang: 'es' | 'en' = selectedLanguage) => {
    const isEn = lang === 'en';
    const scriptTxt = generateActScriptText(act, currentDoc.documentaryTitle, lang, selectedVoiceType);
    const actTitle = isEn && act.chapterTitleEnglish ? act.chapterTitleEnglish : act.chapterTitle;
    const filename = `OlvisBolt_${isEn ? 'English' : 'Spanish'}_Guion_Acto_${act.chapterNumber}_${actTitle.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    downloadTextFile(filename, scriptTxt);
    setAudioFeedback(`Guion del Acto ${act.chapterNumber} en ${isEn ? 'Inglés' : 'Español'} descargado (.txt)`);
    setTimeout(() => setAudioFeedback(null), 3000);
  };

  const handleDownloadClipAudio = async (clip: FlowClip, lang: 'es' | 'en' = selectedLanguage) => {
    setDownloadingAudioClip(clip.clipNumber);
    const isEn = lang === 'en';

    if (isEn && (!clip.voiceoverSegmentEnglish || isTextStillSpanish(clip.voiceoverSegmentEnglish, clip.voiceoverSegmentSpanish))) {
      setAudioFeedback(`Traduciendo Clip ${clip.clipNumber} al inglés...`);
      const trans = await translateSingleText(clip.voiceoverSegmentSpanish);
      clip.voiceoverSegmentEnglish = trans;
    }

    const rawVoice = isEn && clip.voiceoverSegmentEnglish ? clip.voiceoverSegmentEnglish : clip.voiceoverSegmentSpanish;
    const voiceText = cleanStoryVoiceover(rawVoice);
    setAudioFeedback(`Generando audio del Clip ${clip.clipNumber} en ${isEn ? 'Inglés' : 'Español'} (${VOICE_PROFILES[selectedVoiceType].shortLabel})...`);
    const scene = (isEn && clip.sceneTitleEnglish ? clip.sceneTitleEnglish : clip.sceneTitle) || 'Clip';
    const filename = `OlvisBolt_${isEn ? 'EN' : 'ES'}_Clip_${clip.clipNumber}_${selectedVoiceType}_${scene.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const scriptTxt = generateClipScriptText(clip, currentDoc.documentaryTitle, lang, selectedVoiceType);
    const result = await downloadVoiceAudio(voiceText, filename, scriptTxt, lang, selectedVoiceType);
    setDownloadingAudioClip(null);
    setAudioFeedback(result.message);
    setTimeout(() => setAudioFeedback(null), 5000);
  };

  const handleDownloadClipScript = (clip: FlowClip, lang: 'es' | 'en' = selectedLanguage) => {
    const isEn = lang === 'en';
    const rawVoice = isEn && clip.voiceoverSegmentEnglish ? clip.voiceoverSegmentEnglish : clip.voiceoverSegmentSpanish;
    const voiceText = cleanStoryVoiceover(rawVoice);
    const scene = (isEn && clip.sceneTitleEnglish ? clip.sceneTitleEnglish : clip.sceneTitle) || 'Sin título';
    const styledPrompt = formatClipGoogleFlowPrompt(clip.googleFlowPrompt, animationStyle, selectedVoiceType, voiceText);
    const text = `CLIP ${clip.clipNumber} (${clip.timeRange})\n${isEn ? 'SCENE' : 'ESCENA'}: ${scene}\n${isEn ? 'VOICE PROFILE' : 'PERFIL DE VOZ'}: ${VOICE_PROFILES[selectedVoiceType].label}\n${isEn ? 'VOICEOVER' : 'VOZ EN OFF'} (${isEn ? 'EN' : 'ES'}): "${voiceText}"\n${isEn ? 'SFX' : 'EFECTOS DE SONIDO'}: ${clip.soundEffects}\nPROMPT GOOGLE FLOW (${animationStyle === 'magazine' ? 'Estilo Revista' : 'Estilo Cyber punk'}):\n${styledPrompt}\n`;
    downloadTextFile(`OlvisBolt_${isEn ? 'EN' : 'ES'}_Clip_${clip.clipNumber}.txt`, text);
    setAudioFeedback(`Texto del Clip ${clip.clipNumber} en ${isEn ? 'Inglés' : 'Español'} descargado (.txt)`);
    setTimeout(() => setAudioFeedback(null), 3000);
  };

  const handleDownloadMasterAudio = async (lang: 'es' | 'en' = selectedLanguage) => {
    setIsDownloadingMaster(true);
    const isEn = lang === 'en';

    if (isEn && !currentDoc.fullScriptEnglish) {
      setAudioFeedback('Traduciendo guion completo al inglés...');
      const transDoc = await translateFullDocumentaryToEnglish(currentDoc);
      setCurrentDoc(transDoc);
    }

    setAudioFeedback(`Generando audio completo en ${isEn ? 'Inglés' : 'Español'} (60 clips) con voz ${VOICE_PROFILES[selectedVoiceType].shortLabel}...`);
    const docTitle = isEn && currentDoc.documentaryTitleEnglish ? currentDoc.documentaryTitleEnglish : currentDoc.documentaryTitle;
    const filename = `OlvisBolt_${isEn ? 'English' : 'Spanish'}_Voz_Completa_${selectedVoiceType}_${docTitle.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const scriptTxt = generateMasterDocumentaryScript(currentDoc, lang, selectedVoiceType);
    const fullScript = isEn && currentDoc.fullScriptEnglish ? currentDoc.fullScriptEnglish : currentDoc.fullScriptCastilian;
    const result = await downloadVoiceAudio(fullScript, filename, scriptTxt, lang, selectedVoiceType);
    setIsDownloadingMaster(false);
    setAudioFeedback(result.message);
    setTimeout(() => setAudioFeedback(null), 4000);
  };

  const handleDownloadMasterScript = (lang: 'es' | 'en' = selectedLanguage) => {
    const isEn = lang === 'en';
    const scriptTxt = generateMasterDocumentaryScript(currentDoc, lang, selectedVoiceType);
    const docTitle = isEn && currentDoc.documentaryTitleEnglish ? currentDoc.documentaryTitleEnglish : currentDoc.documentaryTitle;
    const filename = `OlvisBolt_${isEn ? 'English' : 'Spanish'}_Guion_Maestro_${selectedVoiceType}_${docTitle.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    downloadTextFile(filename, scriptTxt);
    setAudioFeedback(`Guion maestro en ${isEn ? 'Inglés' : 'Español'} descargado (.txt)`);
    setTimeout(() => setAudioFeedback(null), 3000);
  };

  const handleDownloadFullProject = () => {
    let exportData = documentary;
    if (subTab === 'documentary') {
      const cloned = JSON.parse(JSON.stringify(documentary));
      if (cloned.chapters) {
        cloned.chapters.forEach((ch: any) => {
          if (ch.clips) {
            ch.clips.forEach((c: any) => {
              const cLang = clipLanguageMap[c.clipNumber] || 'es';
              const cVoice = cLang === 'en' && c.voiceoverSegmentEnglish ? c.voiceoverSegmentEnglish : c.voiceoverSegmentSpanish;
              c.googleFlowPrompt = formatClipGoogleFlowPrompt(c.googleFlowPrompt, animationStyle, selectedVoiceType, cVoice);
            });
          }
        });
      }
      exportData = cloned;
    }
    const content = subTab === 'documentary' 
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(povShort, null, 2);
    
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = subTab === 'documentary'
      ? `OlvisBolt_Documental_${(documentary.documentaryTitle || 'Doc').replace(/[^a-zA-Z0-9]/g, '_')}.json`
      : `OlvisBolt_POV_Short_${(povShort.title || 'POV').replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Real AI search suggestions
  const fetchSmartSuggestions = async () => {
    const q = customTopic || (subTab === 'documentary' ? documentary.historicalTopic : povShort.concept);
    setIsFetchingSuggestions(true);
    setShowSuggestions(true);
    try {
      const res = await fetch('/api/search-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, type: subTab === 'documentary' ? 'documentary' : 'pov' })
      });
      const data = await res.json();
      if (data.suggestions && data.suggestions.length > 0) {
        setAiSuggestions(data.suggestions);
      }
    } catch (e) {
      console.warn('Error fetching suggestions:', e);
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  const handleSelectSuggestion = (sug: string) => {
    setCustomTopic(sug);
    setShowSuggestions(false);
    if (subTab === 'documentary') {
      onGenerateDocumentary(sug);
    } else {
      onGeneratePOV(sug);
    }
  };

  // Prepare Chapters & Active Clip from local mutable documentary state (currentDoc)
  const chapters: FlowChapter[] = currentDoc.chapters && currentDoc.chapters.length > 0
    ? currentDoc.chapters
    : (documentary.chapters && documentary.chapters.length > 0 ? documentary.chapters : []);

  const currentChapter: FlowChapter | undefined = chapters[activeChapterIndex] || chapters[0];
  const allClipsInChapter: FlowClip[] = currentChapter?.clips || [];
  const currentClip: FlowClip = allClipsInChapter.find(c => c.clipNumber === activeClipNumber) || allClipsInChapter[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-red-950/60 via-zinc-900 to-amber-950/40 border border-red-900/40 p-5 sm:p-6 shadow-xl">
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-cinzel">
            Estudio de Creación con IA
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 max-w-3xl">
            Genera documentales monetizables para usar en Youtube o Facebook
          </p>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-zinc-800/80">
          <button
            onClick={() => setSubTab('documentary')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              subTab === 'documentary'
                ? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Historias y Documentales</span>
          </button>

          <button
            onClick={() => setSubTab('pov')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              subTab === 'pov'
                ? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Eye className="w-4 h-4 text-red-300" />
            <span>Historias Cortas (Shorts)</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: DOCUMENTALES DE 8 MINUTOS PARA GOOGLE FLOW */}
      {subTab === 'documentary' && (
        <div className="space-y-6">
          
          {/* Dynamic Topic Buttons & AI Search Bar */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Temas Históricos Ocultos (Se actualizan con cada búsqueda):
                </label>
                <button
                  type="button"
                  onClick={() => fetchSmartSuggestions()}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Sugerir 5 Ideas Medievales con IA</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {docTopics.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCustomTopic(item.topic);
                      onGenerateDocumentary(item.topic);
                    }}
                    disabled={isLoading}
                    className="text-xs px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700/80 transition-all text-left shadow-sm disabled:opacity-50"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom AI Search Input with suggestions */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!customTopic.trim() || isLoading) return;
                setShowSuggestions(false);
                onGenerateDocumentary(customTopic);
              }}
              className="relative space-y-2 pt-2 border-t border-zinc-800/80"
            >
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    onFocus={() => {
                      if (aiSuggestions.length > 0) setShowSuggestions(true);
                    }}
                    placeholder="Busca cualquier misterio medieval o antiguo (ej: Cómo comían los espartanos, El asedio de Antioquía, Catacumbas romanas)..."
                    className="w-full pl-9 pr-24 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  />

                  <button
                    type="button"
                    onClick={() => fetchSmartSuggestions()}
                    disabled={isFetchingSuggestions}
                    className="absolute right-2 top-2 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1 transition-all"
                  >
                    {isFetchingSuggestions ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-400" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span className="hidden sm:inline">Ideas IA</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !customTopic.trim()}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-950/40"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Armando Documental...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Buscar & Armar Documental</span>
                    </>
                  )}
                </button>
              </div>

              {/* Suggestions dropdown */}
              {showSuggestions && aiSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 z-30 p-3 rounded-xl bg-zinc-950/95 border border-zinc-700 shadow-2xl backdrop-blur-md space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-zinc-800 pb-1.5">
                    <span className="font-semibold text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> 5 Ideas Virales para Documentales:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSuggestions(false)}
                      className="text-zinc-500 hover:text-white"
                    >
                      ✕ Cerrar
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {aiSuggestions.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectSuggestion(sug)}
                        className="text-left text-xs p-2 rounded-lg bg-zinc-900 hover:bg-red-950/40 hover:text-white border border-zinc-800 text-zinc-300 transition-all flex items-center justify-between group"
                      >
                        <span className="truncate">{sug}</span>
                        <span className="text-[10px] text-red-400 opacity-0 group-hover:opacity-100 font-semibold ml-2">Armar →</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="p-6 rounded-2xl bg-zinc-900/90 border border-red-500/40 text-center space-y-2 animate-pulse">
              <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-white">Generando documental completo de 10 minutos con IA...</p>
              <p className="text-xs text-zinc-400">Distribuyendo los 10 actos de 1 minuto y los 60 clips de 10 segundos con continuidad y correlación...</p>
            </div>
          )}

          {/* Real-time Voiceover & Audio Download Notification Banner */}
          {audioFeedback && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-950 via-zinc-900 to-amber-950 border border-amber-500/60 text-amber-200 text-xs font-semibold shadow-xl flex items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{audioFeedback}</span>
              </div>
              <button
                type="button"
                onClick={() => setAudioFeedback(null)}
                className="text-zinc-400 hover:text-white px-2 py-0.5 rounded text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Documentary Master Title & Full Narration Preview */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
              <div>
                <h3 className="text-lg sm:text-2xl font-bold text-white font-cinzel leading-snug">
                  {selectedLanguage === 'en' && currentDoc.documentaryTitleEnglish
                    ? currentDoc.documentaryTitleEnglish
                    : currentDoc.documentaryTitle}
                </h3>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* 1. GUARDAR ESTA TEMÁTICA */}
                <button
                  type="button"
                  onClick={() => onSave({ type: 'flow_doc', data: currentDoc })}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
                    isDocSaved
                      ? 'bg-emerald-900/90 text-emerald-200 border-2 border-emerald-500 shadow-lg shadow-emerald-950/50'
                      : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white border border-amber-400/50 shadow-lg shadow-amber-950/40'
                  }`}
                  title="Guardar esta temática en la base de datos de tu usuario"
                >
                  {isDocSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Bookmark className="w-4 h-4 text-amber-100 fill-current" />}
                  <span>{isDocSaved ? '✓ Temática Guardada' : 'Guardar esta temática'}</span>
                </button>

                {/* 2. DESCARGAR VOZ COMPLETO ESPAÑOL */}
                <button
                  type="button"
                  onClick={() => handleDownloadMasterAudio('es')}
                  disabled={isDownloadingMaster}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-700 to-amber-700 hover:from-red-600 hover:to-amber-600 text-white border border-red-500/40 flex items-center gap-2 shadow-md shadow-red-950/40 transition-all disabled:opacity-50"
                  title="Descargar audio WAV de la voz en off completa en Español"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar voz completo español</span>
                </button>

                {/* 3. DESCARGAR VOZ COMPLETO INGLES */}
                <button
                  type="button"
                  onClick={() => handleDownloadMasterAudio('en')}
                  disabled={isDownloadingMaster}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-amber-600 hover:from-blue-600 hover:to-amber-500 text-white border border-blue-400/40 flex items-center gap-2 shadow-md shadow-blue-950/40 transition-all disabled:opacity-50"
                  title="Descargar audio WAV de la voz en off completa en Inglés"
                >
                  {isDownloadingMaster ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generando audio en inglés...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 text-blue-200" />
                      <span>Descargar voz completo ingles</span>
                    </>
                  )}
                </button>

                {/* 4. GUION COMPLETO */}
                <button
                  type="button"
                  onClick={() => handleDownloadMasterScript(selectedLanguage)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 flex items-center gap-2 transition-all"
                  title="Descargar guion completo (.txt)"
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Guión completo</span>
                </button>
              </div>
            </div>

            {/* Continuous Voiceover Full Text preview */}
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed font-serif italic max-h-32 overflow-y-auto">
              "{selectedLanguage === 'en' && currentDoc.fullScriptEnglish
                ? currentDoc.fullScriptEnglish
                : currentDoc.fullScriptCastilian}"
            </div>
          </div>

          {/* 9-MINUTE CHAPTERS SELECTOR (Actos 1 al 9 - Exactamente 1 minuto cada uno) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <ListOrdered className="w-4 h-4 text-red-400" /> Distribución del Video:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-emerald-400 font-mono font-semibold">
                  {chapters.length} Actos de 60s
                </span>
                {allClipsInChapter.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const allPrompts = allClipsInChapter.map(c => {
                        const cLang = clipLanguageMap[c.clipNumber] || 'es';
                        const cVoice = cLang === 'en' && c.voiceoverSegmentEnglish ? c.voiceoverSegmentEnglish : c.voiceoverSegmentSpanish;
                        const prompt = formatClipGoogleFlowPrompt(c.googleFlowPrompt, animationStyle, selectedVoiceType, cVoice);
                        return `=== CLIP ${c.clipNumber} (${c.timeRange}) ===\nPROMPT (${animationStyle === 'magazine' ? 'Estilo Revista' : 'Estilo Cyber punk'} - ${cLang.toUpperCase()}):\n${prompt}\nVOZ EN OFF (${cLang.toUpperCase()}):\n"${cleanStoryVoiceover(cVoice)}"\n`;
                      }).join('\n\n');
                      handleCopy(allPrompts, `act_${currentChapter?.chapterNumber}`);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center gap-1 font-semibold transition-all"
                  >
                    {copiedField === `act_${currentChapter?.chapterNumber}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiar los 6 Clips de este Acto</span>
                  </button>
                )}
              </div>
            </div>

            {/* Chapter Selection Pills for up to 10 Acts */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2">
              {chapters.map((ch, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveChapterIndex(idx);
                    if (ch.clips && ch.clips.length > 0) {
                      setActiveClipNumber(ch.clips[0].clipNumber);
                    }
                  }}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    activeChapterIndex === idx
                      ? 'bg-zinc-800 text-white border-red-500 shadow-md shadow-red-950/40 ring-1 ring-red-500'
                      : 'bg-zinc-900/70 text-zinc-400 border-zinc-800 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                    <span className="text-red-400 font-mono">Acto {ch.chapterNumber}</span>
                    <span className="font-mono text-zinc-500">{ch.timestamp}</span>
                  </div>
                  <div className="text-xs font-bold truncate text-white" title={ch.chapterTitle}>
                    {ch.chapterTitle.replace(/^Acto \d+:\s*/i, '')}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ACTIVE ACT OVERVIEW & 6 CLIPS SELECTOR */}
          {currentChapter && (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                      {currentChapter.chapterTitle} • Duración: 1 Minuto ({currentChapter.timestamp})
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono font-bold">
                      {currentChapter.clips.length} Clips (10s c/u)
                    </span>
                  </div>
                </div>

                {/* ACTION BUTTONS: ONLY THE 3 REQUESTED BUTTONS */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* 1. DESCARGAR VOZ ESPAÑOL (TODOS LOS CLIPS DEL ACTO X) */}
                  <button
                    type="button"
                    onClick={() => handleDownloadActAudio(currentChapter, 'es')}
                    disabled={downloadingAudioAct === currentChapter.chapterNumber}
                    className="text-xs px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-700 to-amber-700 hover:from-red-600 hover:to-amber-600 text-white font-bold flex items-center gap-2 shadow-md shadow-red-950/40 transition-all border border-red-500/40 disabled:opacity-50"
                    title={`Descargar voz en off en español de todos los clips del Acto ${currentChapter.chapterNumber}`}
                  >
                    {downloadingAudioAct === currentChapter.chapterNumber ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>descargar voz español (todos los clips del acto {currentChapter.chapterNumber})</span>
                  </button>

                  {/* 2. DESCARGAR VOZ INGLES TODOS LOS CLIPS (TODOS LOS CLIPS DEL ACTO X) */}
                  <button
                    type="button"
                    onClick={() => handleDownloadActAudio(currentChapter, 'en')}
                    disabled={downloadingAudioAct === currentChapter.chapterNumber}
                    className="text-xs px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-amber-600 hover:from-blue-600 hover:to-amber-500 text-white font-bold flex items-center gap-2 shadow-md shadow-blue-950/40 transition-all border border-blue-400/40 disabled:opacity-50"
                    title={`Descargar voz en off en inglés de todos los clips del Acto ${currentChapter.chapterNumber}`}
                  >
                    {downloadingAudioAct === currentChapter.chapterNumber ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Globe className="w-3.5 h-3.5 text-blue-200" />
                    )}
                    <span>descargar voz ingles todos los clips (todos los clips del acto {currentChapter.chapterNumber})</span>
                  </button>

                  {/* 3. DESCARGAR GUION ACTO X */}
                  <button
                    type="button"
                    onClick={() => handleDownloadActScript(currentChapter, 'es')}
                    className="text-xs px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 flex items-center gap-2 font-bold transition-all shadow-sm"
                    title={`Descargar guion de texto del Acto ${currentChapter.chapterNumber}`}
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>descargar guion acto {currentChapter.chapterNumber}</span>
                  </button>
                </div>
              </div>

              {/* Clip Pills for current act with direct download and preview */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {allClipsInChapter.map((clip) => {
                  const clipLang = clipLanguageMap[clip.clipNumber] || 'es';
                  const rawVoice = clipLang === 'en' && clip.voiceoverSegmentEnglish
                    ? clip.voiceoverSegmentEnglish
                    : clip.voiceoverSegmentSpanish;
                  const clipVoice = cleanStoryVoiceover(rawVoice);
                  const clipScene = clipLang === 'en' && clip.sceneTitleEnglish
                    ? clip.sceneTitleEnglish
                    : clip.sceneTitle;

                  return (
                    <div
                      key={clip.clipNumber}
                      className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                        activeClipNumber === clip.clipNumber
                          ? 'bg-red-950/80 text-white border-red-500 shadow-md shadow-red-950/40 ring-1 ring-red-500'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveClipNumber(clip.clipNumber)}
                        className="text-left w-full"
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-red-400">Clip {clip.clipNumber}</span>
                          <span className="font-mono text-zinc-500">{clip.timeRange}</span>
                        </div>
                        <div className="text-[11px] font-semibold truncate text-zinc-300 mt-1" title={clipScene}>
                          {clipScene ? clipScene.slice(0, 18) : '10s'}
                        </div>
                      </button>

                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-800/80">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayVoice(clipVoice, clipLang);
                          }}
                          className="text-[10px] text-zinc-400 hover:text-amber-300 flex items-center gap-0.5"
                          title={`Escuchar locución en ${clipLang === 'en' ? 'Inglés' : 'Español'}`}
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Oír ({clipLang === 'en' ? 'EN' : 'ES'})</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadClipAudio(clip, clipLang);
                          }}
                          disabled={downloadingAudioClip === clip.clipNumber}
                          className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-0.5 font-bold disabled:opacity-50"
                          title={`Descargar audio WAV de este clip en ${clipLang === 'en' ? 'Inglés' : 'Español'}`}
                        >
                          {downloadingAudioClip === clip.clipNumber ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Download className="w-3 h-3" />
                          )}
                          <span>WAV {clipLang === 'en' ? 'EN' : 'ES'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ACTIVE CLIP DETAIL (THE 10-SECOND CLIP WITH 5 SHOTS) */}
          {currentClip && (() => {
            const clipLang = clipLanguageMap[currentClip.clipNumber] || 'es';
            const isCurrentClipPlaying = isPlayingAudio;
            const isClipTranslating = translatingClipNumber === currentClip.clipNumber;
            const isClipDownloading = downloadingAudioClip === currentClip.clipNumber;

            const rawActiveVoice = clipLang === 'en'
              ? (currentClip.voiceoverSegmentEnglish || currentClip.voiceoverSegmentSpanish)
              : currentClip.voiceoverSegmentSpanish;
            const activeVoice = cleanStoryVoiceover(rawActiveVoice);
            const wordCount = activeVoice ? activeVoice.trim().split(/\s+/).filter(Boolean).length : 0;
            const approxSeconds = Math.max(5, Math.min(10, Math.round(wordCount / 2.2)));

            const activeClipFormattedPrompt = formatClipGoogleFlowPrompt(
              currentClip.googleFlowPrompt,
              animationStyle,
              selectedVoiceType,
              activeVoice
            );

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Google Flow Animation Prompt (7 cols) */}
                <div className="lg:col-span-7 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-3 gap-3">
                    <div className="flex items-center gap-2">
                      <Film className="w-5 h-5 text-red-500 shrink-0" />
                      <div>
                        <h4 className="text-base font-bold text-white">
                          Prompt de Animación (Clip {currentClip.clipNumber} • {currentClip.timeRange})
                        </h4>
                        <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 flex-wrap">
                          <span>
                            {animationStyle === 'magazine' 
                              ? 'Estilo Revista • 16:9 • 24fps • Newspaper Collage' 
                              : 'Estilo Cyber punk • 16:9 • 24fps • Grunge Punk Collage'}
                          </span>
                          <span className="text-zinc-600">•</span>
                          <span className={clipLang === 'en' ? 'text-blue-300 font-mono font-bold' : 'text-amber-300 font-mono font-bold'}>
                            {clipLang === 'en' ? '🇬🇧 Audio en Inglés' : '🇪🇸 Audio en Español'}
                          </span>
                          <span className="text-zinc-600">•</span>
                          <span className="text-zinc-300 font-medium">
                            🎙️ {VOICE_PROFILES[selectedVoiceType].shortLabel}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Botones de Estilo: Estilo Revista & Estilo Cyber punk */}
                      <div className="flex items-center p-1 rounded-xl bg-zinc-950 border border-zinc-800 gap-1">
                        <button
                          type="button"
                          onClick={() => setAnimationStyle('magazine')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            animationStyle === 'magazine'
                              ? 'bg-amber-600/30 text-amber-200 border border-amber-500/60 shadow-md shadow-amber-950/40'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                          }`}
                          title='Estilo Revista: "motion collage / animated newspaper collage sequence"'
                        >
                          <span>📰 Estilo Revista</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAnimationStyle('cyberpunk')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            animationStyle === 'cyberpunk'
                              ? 'bg-purple-600/30 text-purple-200 border border-purple-500/60 shadow-md shadow-purple-950/40 ring-1 ring-purple-500/30'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                          }`}
                          title='Estilo Cyber punk: "motion Cyber / Punk Grunge Collage sequence"'
                        >
                          <span>⚡ Estilo Cyber punk</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(activeClipFormattedPrompt, `prompt_${currentClip.clipNumber}`)}
                        className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-red-950/40 shrink-0 cursor-pointer"
                      >
                        {copiedField === `prompt_${currentClip.clipNumber}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copiar Prompt</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 leading-relaxed max-h-[360px] overflow-y-auto whitespace-pre-wrap select-text">
                    {activeClipFormattedPrompt}
                  </div>

                  <div className="text-[11px] text-zinc-400 space-y-1 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                    <span className="font-semibold text-zinc-300 block">Efectos de Sonido recomendados:</span>
                    <p className="italic text-zinc-400">{currentClip.soundEffects}</p>
                  </div>
                </div>

              {/* Right Column: Voiceover & 5-Shot Breakdown (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Voiceover Card */}
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Volume2 className="w-3.5 h-3.5 text-amber-500" /> voz en off de este clip (10s):
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                            clipLang === 'en' ? 'bg-blue-950 text-blue-300 border border-blue-800/60' : 'bg-red-950 text-red-300 border border-red-800/60'
                          }`}>
                            {clipLang === 'en' ? '🇬🇧 EN' : '🇪🇸 ES'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-950 text-emerald-400 font-mono font-medium border border-zinc-800" title="Locución estrictamente calibrada para el clip de 10 segundos">
                            ⏱️ ~{approxSeconds}s ({wordCount} palabras)
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* 1. OIR (ES) / OIR (EN) */}
                          <button
                            type="button"
                            onClick={() => {
                              if (isCurrentClipPlaying) {
                                if (stopAudioFn) stopAudioFn();
                                setIsPlayingAudio(false);
                                setStopAudioFn(null);
                              } else {
                                if (clipLang === 'en') {
                                  const voice = cleanStoryVoiceover(currentClip.voiceoverSegmentEnglish || currentClip.voiceoverSegmentSpanish);
                                  handlePlayVoice(voice, 'en', selectedVoiceType);
                                } else {
                                  handlePlayVoice(cleanStoryVoiceover(currentClip.voiceoverSegmentSpanish), 'es', selectedVoiceType);
                                }
                              }
                            }}
                            className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                              clipLang === 'en'
                                ? 'bg-blue-950/70 text-blue-200 border border-blue-600/50 hover:bg-blue-900/80'
                                : 'bg-red-950/70 text-red-200 border border-red-600/50 hover:bg-red-900/80'
                            }`}
                            title={clipLang === 'en' ? 'Escuchar voz en off en inglés' : 'Escuchar voz en off en español'}
                          >
                            {isCurrentClipPlaying ? (
                              <Square className="w-3.5 h-3.5 text-red-400 fill-current" />
                            ) : clipLang === 'en' ? (
                              <Volume2 className="w-3.5 h-3.5 text-blue-300" />
                            ) : (
                              <Play className="w-3.5 h-3.5 text-red-400 fill-current" />
                            )}
                            <span>{isCurrentClipPlaying ? 'Detener' : clipLang === 'en' ? 'oir (en)' : 'oir (es)'}</span>
                          </button>

                          {/* 2. DESCARGAR ESPAÑOL / DESCARGAR INGLES */}
                          <button
                            type="button"
                            onClick={() => handleDownloadClipAudio(currentClip, clipLang)}
                            disabled={isClipDownloading}
                            className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-md transition-all border disabled:opacity-50 ${
                              clipLang === 'en'
                                ? 'bg-gradient-to-r from-blue-700 via-indigo-700 to-amber-600 hover:from-blue-600 hover:to-amber-500 text-white border-blue-400/40 shadow-blue-950/40'
                                : 'bg-gradient-to-r from-red-700 to-amber-700 hover:from-red-600 hover:to-amber-600 text-white border-red-500/40 shadow-red-950/40'
                            }`}
                            title={clipLang === 'en' ? 'Descargar audio WAV de este clip en inglés' : 'Descargar audio WAV de este clip en español'}
                          >
                            {isClipDownloading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : clipLang === 'en' ? (
                              <Globe className="w-3.5 h-3.5 text-blue-200" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            <span>{clipLang === 'en' ? 'Descargar Ingles' : 'Descargar Español'}</span>
                          </button>

                          {/* 3. TRADUCIR AL INGLES / TRADUCIR AL ESPAÑOL */}
                          <button
                            type="button"
                            onClick={() => handleToggleClipLanguage(currentClip)}
                            disabled={isClipTranslating}
                            className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all border disabled:opacity-50 ${
                              clipLang === 'en'
                                ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-300 border-amber-500/40 shadow-sm'
                                : 'bg-blue-900/80 hover:bg-blue-800 text-blue-100 border-blue-500/50 shadow-md shadow-blue-950/40'
                            }`}
                            title={clipLang === 'en' ? 'Volver a traducir y mostrar en español' : 'Traducir la voz en off de este clip al inglés'}
                          >
                            {isClipTranslating ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Traduciendo...</span>
                              </>
                            ) : (
                              <>
                                <Globe className={`w-3.5 h-3.5 ${clipLang === 'en' ? 'text-amber-400' : 'text-blue-300'}`} />
                                <span>{clipLang === 'en' ? 'Traducir al español' : 'Traducir al ingles'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Selector de Tipo de Voz */}
                      <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-1.5 shadow-sm">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>Menú de Tipo de Voz ({clipLang === 'en' ? 'Inglés' : 'Español'}):</span>
                          </label>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {selectedVoiceType === 'male_mature' && '🎙️ 50a • Masculino (Profunda/Rasgada)'}
                            {selectedVoiceType === 'female_mature' && '🎙️ 50a • Mujer (Profunda/Rasgada)'}
                            {selectedVoiceType === 'young_adventurous' && '🎙️ 25a • Joven (Aventurera)'}
                          </span>
                        </div>

                        <div className="relative">
                          <select
                            value={selectedVoiceType}
                            onChange={(e) => {
                              const newVoice = e.target.value as VoiceOptionId;
                              setSelectedVoiceType(newVoice);
                              if (stopAudioFn) {
                                stopAudioFn();
                                setIsPlayingAudio(false);
                                setStopAudioFn(null);
                              }
                            }}
                            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700/80 text-xs font-semibold text-zinc-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 cursor-pointer transition-all shadow-inner"
                          >
                            <option value="male_mature">
                              Masculino 50 años, voz profunda, madura, resonante y rasgada. Misterioso y cinematográfico.
                            </option>
                            <option value="female_mature">
                              Mujer de 50 años, voz profunda, madura, resonante y rasgada. Misterioso y cinematográfico.
                            </option>
                            <option value="young_adventurous">
                              Joven de 25 años, con voz aventurera y interesante.
                            </option>
                          </select>
                        </div>
                      </div>

                      {/* Primary text display in selected clip language */}
                      <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-100 italic font-medium leading-relaxed">
                        "{clipLang === 'en'
                          ? cleanStoryVoiceover(currentClip.voiceoverSegmentEnglish || 'Traduciendo al inglés...')
                          : cleanStoryVoiceover(currentClip.voiceoverSegmentSpanish)}"
                      </div>

                      {/* Secondary comparison view */}
                      {clipLang === 'en' && currentClip.voiceoverSegmentSpanish && (
                        <div className="px-3 py-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800/50 text-[11px] text-zinc-400 italic">
                          <strong className="text-zinc-500 font-sans not-italic mr-1">Español original:</strong>
                          "{cleanStoryVoiceover(currentClip.voiceoverSegmentSpanish)}"
                        </div>
                      )}

                      {clipLang === 'es' && currentClip.voiceoverSegmentEnglish && (
                        <div className="px-3 py-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800/50 text-[11px] text-zinc-400 italic">
                          <strong className="text-zinc-500 font-sans not-italic mr-1">English Voiceover:</strong>
                          "{cleanStoryVoiceover(currentClip.voiceoverSegmentEnglish)}"
                        </div>
                      )}

                      <div className="text-[10px] text-zinc-400 leading-tight">
                        <strong className="text-zinc-300">Tono:</strong> {clipLang === 'en' ? VOICE_PROFILES[selectedVoiceType].narrationStyle.en : VOICE_PROFILES[selectedVoiceType].narrationStyle.es}
                      </div>
                    </div>

                {/* Shot Breakdown (SHOT 1 to 5) */}
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <h5 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" /> Desglose Segundo a Segundo (5 Tomas de 10s):
                  </h5>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {currentClip.shots.map((shot, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-red-400 font-mono text-[11px]">{shot.shotId}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">{shot.seconds}</span>
                        </div>
                        <p className="text-[11px] text-zinc-300 font-sans leading-tight">
                          {shot.visualAction}
                        </p>
                        {shot.narrationSnippet && (
                          <p className="text-[10px] text-zinc-400 italic">
                            VO: "{shot.narrationSnippet}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
            );
          })()}

        </div>
      )}

      {/* SUB-TAB 2: SHORTS POV SINIESTROS (EXACTAMENTE 4 ESCENAS • 20-30s) */}
      {subTab === 'pov' && (
        <div className="space-y-6">
          
          {/* Dynamic POV Presets & Real AI Search Bar */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Escenarios POV Dinámicos (Se actualizan según tu búsqueda):
                </label>
                <button
                  type="button"
                  onClick={() => fetchSmartSuggestions()}
                  className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 font-medium transition-colors"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Sugerir 5 Escenarios POV con IA</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {povTopics.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCustomTopic(preset.scenario);
                      onGeneratePOV(preset.scenario);
                    }}
                    disabled={isLoading}
                    className="text-xs px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700/80 transition-all text-left shadow-sm disabled:opacity-50"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom AI Search for POV Shorts */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!customTopic.trim() || isLoading) return;
                setShowSuggestions(false);
                onGeneratePOV(customTopic);
              }}
              className="relative space-y-2 pt-2 border-t border-zinc-800/80"
            >
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    onFocus={() => {
                      if (aiSuggestions.length > 0) setShowSuggestions(true);
                    }}
                    placeholder="Escribe tu idea de POV (ej: POV: Eres un médico en la peste y las sombras no tienen cuerpo)..."
                    className="w-full pl-9 pr-24 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                  />

                  <button
                    type="button"
                    onClick={() => fetchSmartSuggestions()}
                    disabled={isFetchingSuggestions}
                    className="absolute right-2 top-2 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1 transition-all"
                  >
                    {isFetchingSuggestions ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-400" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span className="hidden sm:inline">Ideas IA</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !customTopic.trim()}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-950/40"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Armando 4 Escenas POV...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Buscar & Armar Short POV</span>
                    </>
                  )}
                </button>
              </div>

              {/* Suggestions dropdown */}
              {showSuggestions && aiSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 z-30 p-3 rounded-xl bg-zinc-950/95 border border-zinc-700 shadow-2xl backdrop-blur-md space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-zinc-800 pb-1.5">
                    <span className="font-semibold text-red-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> 5 Ideas Virales de POV (20-30 Segundos):
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSuggestions(false)}
                      className="text-zinc-500 hover:text-white"
                    >
                      ✕ Cerrar
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {aiSuggestions.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectSuggestion(sug)}
                        className="text-left text-xs p-2 rounded-lg bg-zinc-900 hover:bg-red-950/40 hover:text-white border border-zinc-800 text-zinc-300 transition-all flex items-center justify-between group"
                      >
                        <span className="truncate">{sug}</span>
                        <span className="text-[10px] text-red-400 opacity-0 group-hover:opacity-100 font-semibold ml-2">Armar →</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* POV Short Details Card (4 SCENES • 20-30s) */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-red-500" /> Formato Exacto: 4 Escenas • {povShort.durationSeconds || 25} Segundos • Estilo @krakenpovbo
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                  {povShort.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-emerald-300 font-mono font-bold">
                  ⏱️ {povShort.durationSeconds || 25}s (4 Escenas)
                </span>

                <button
                  type="button"
                  onClick={() => onSave({ type: 'pov_short', data: povShort })}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
                    isPovSaved
                      ? 'bg-emerald-900/90 text-emerald-200 border-2 border-emerald-500 shadow-lg shadow-emerald-950/50'
                      : 'bg-amber-600 hover:bg-amber-500 text-white border border-amber-400/50 shadow-lg shadow-amber-950/40'
                  }`}
                  title="Guarda este Short POV tal como lo ves"
                >
                  {isPovSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Bookmark className="w-4 h-4 text-amber-100 fill-current" />}
                  <span>{isPovSaved ? '✓ Temática Guardada' : '⭐ GUARDAR ESTA TEMÁTICA (SHORT POV)'}</span>
                </button>
              </div>
            </div>

            {/* Hook First 3 Seconds */}
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 space-y-1">
              <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" /> Texto Gigante en Pantalla (Primeros 3 Segundos - Anti Scroll):
              </span>
              <p className="text-base sm:text-lg font-black text-white tracking-wide">
                "{povShort.hookFirst3Sec}"
              </p>
            </div>

            {/* Twist Ending Callout */}
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-900/40 space-y-1">
              <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-400" /> El Giro Final Siniestro (Escena 4 • Últimos 5s):
              </span>
              <p className="text-xs sm:text-sm text-zinc-200 font-medium">
                {povShort.twistEnding}
              </p>
            </div>

            {/* 4 SCENES GRID */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-red-400" /> Las 4 Escenas del Short POV (Desglose para Google Flow):
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    const allScenesText = povShort.scenes.map((s, idx) => `=== ESCENA ${idx + 1} (${s.timestamp}) ===\nTEXTO EN PANTALLA: "${s.textOnScreen}"\nPROMPT FLOW:\n${s.googleFlowPrompt}\nVOZ: "${s.narration}"\nSONIDO: ${s.audioAmbience}`).join('\n\n');
                    handleCopy(allScenesText, 'all_pov_scenes');
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 font-semibold"
                >
                  {copiedField === 'all_pov_scenes' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copiar las 4 Escenas</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {povShort.scenes.map((scene, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border space-y-3 ${
                      idx === 3
                        ? 'bg-red-950/30 border-red-800/60 shadow-lg shadow-red-950/40'
                        : 'bg-zinc-950/80 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                      <span className={`text-xs font-bold font-mono ${idx === 3 ? 'text-red-400' : 'text-zinc-300'}`}>
                        Escena {idx + 1} {idx === 3 && '🔥 [EL GIRO FINAL]'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                        {scene.timestamp}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-zinc-400 block mb-0.5">
                        Texto Gigante en Pantalla:
                      </span>
                      <p className="text-xs font-bold text-white bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                        "{scene.textOnScreen}"
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-zinc-400 mb-0.5">
                        <span>Prompt Google Flow (9:16 Vertical POV):</span>
                        <button
                          onClick={() => handleCopy(scene.googleFlowPrompt, `pov_prompt_${idx}`)}
                          className="hover:text-white"
                        >
                          {copiedField === `pov_prompt_${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <p className="text-[11px] font-mono text-zinc-300 bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800 leading-relaxed max-h-24 overflow-y-auto">
                        {scene.googleFlowPrompt}
                      </p>
                    </div>

                    <div className="text-[11px] text-zinc-400 space-y-1">
                      <p><strong className="text-zinc-300">Voz en off:</strong> "{scene.narration}"</p>
                      <p><strong className="text-zinc-300">Ambiente de audio:</strong> {scene.audioAmbience}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Viral Comment Strategy & Sound */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Comentario Fijado para Viralidad en YouTube/Facebook:
                </span>
                <p className="text-xs text-zinc-200">
                  "{povShort.pinnedCommentStrategy}"
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                  Recomendación Musical / Diseño de Audio:
                </span>
                <p className="text-xs text-zinc-300">
                  {povShort.soundRecommendation}
                </p>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
