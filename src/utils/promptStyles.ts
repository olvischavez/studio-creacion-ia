// Animation Styles and Prompt Formatting for Google Flow Prompts
import { VoiceOptionId } from './audioPlayer';
import { cleanStoryVoiceover } from './textCleaning';

export type AnimationStyle = 'magazine' | 'cyberpunk';

export const MAGAZINE_PHRASE = 'motion collage / animated newspaper collage sequence';
export const CYBERPUNK_PHRASE = 'motion Cyber / Punk Grunge Collage sequence';

export const VOICE_PROFILES_ENGLISH_TONE: Record<VoiceOptionId, string> = {
  male_mature: '50-year-old male narrator, deep, mature, resonant and raspy voice. Mysterious and cinematic BBC documentary tone.',
  female_mature: '50-year-old female narrator, deep, mature, resonant and raspy voice. Mysterious and cinematic dark chronicles tone.',
  young_adventurous: '25-year-old youthful narrator, with adventurous and interesting voice, curious and engaging.',
};

/**
 * Replaces the animation style prefix in a Google Flow prompt.
 * Only modifies the style phrase without altering any clip content, acts, shots, or story.
 */
export function applyAnimationStyle(promptText: string, style: AnimationStyle): string {
  if (!promptText) return '';

  if (style === 'cyberpunk') {
    return promptText
      .replace(/motion\s*collage\s*\/\s*animated\s*newspaper\s*collage\s*sequence/gi, CYBERPUNK_PHRASE)
      .replace(/motion\s*collage\s*sequence/gi, CYBERPUNK_PHRASE);
  } else {
    return promptText
      .replace(/motion\s*Cyber\s*\/\s*Punk\s*Grunge\s*Collage\s*sequence/gi, MAGAZINE_PHRASE)
      .replace(/motion\s*cyber\s*\/\s*punk\s*grunge\s*collage\s*sequence/gi, MAGAZINE_PHRASE);
  }
}

/**
 * Dynamically formats a clip's Google Flow animation prompt with:
 * 1. The selected Animation Style ("Estilo Revista" vs "Estilo Cyber punk").
 * 2. The selected Voice Profile / Narrator Tone ALWAYS in English.
 * 3. The Synchronized Voiceover Narration in the clip's current language (English or Spanish).
 */
export function formatClipGoogleFlowPrompt(
  rawPrompt: string,
  style: AnimationStyle,
  voiceType: VoiceOptionId = 'male_mature',
  voiceText: string = ''
): string {
  if (!rawPrompt) return '';

  // 1. Apply animation style phrase
  let prompt = applyAnimationStyle(rawPrompt, style);
  const toneDesc = VOICE_PROFILES_ENGLISH_TONE[voiceType] || VOICE_PROFILES_ENGLISH_TONE.male_mature;
  const cleanVoice = cleanStoryVoiceover(voiceText);

  const voiceProfileLine = `VOICE PROFILE / NARRATOR TONE: ${toneDesc}`;
  const syncNarrationBlock = cleanVoice
    ? `SYNCHRONIZED VOICEOVER NARRATION (Audio for this 10s Clip):\n"${cleanVoice}"\nSCENE VISUAL SYNC: The 5 motion shots below directly illustrate this precise moment of the chronicle.`
    : '';

  // 2. Check and update VOICE PROFILE line
  const voiceProfileRegex = /VOICE PROFILE(?:\s*\/\s*NARRATOR TONE)?:\s*[^\n]*\n?/i;
  const hasVoiceProfile = voiceProfileRegex.test(prompt);

  if (hasVoiceProfile) {
    prompt = prompt.replace(voiceProfileRegex, `${voiceProfileLine}\n`);
  }

  // 3. Check and update SYNCHRONIZED VOICEOVER NARRATION block
  const syncNarrationRegex = /SYNCHRONIZED VOICEOVER NARRATION[\s\S]*?(?=\n\s*(?:GLOBAL VISUAL STYLE|SHOT 1|$))/i;
  const hasSyncNarration = syncNarrationRegex.test(prompt);

  if (hasSyncNarration) {
    if (syncNarrationBlock) {
      prompt = prompt.replace(syncNarrationRegex, `${syncNarrationBlock}\n`);
    } else {
      prompt = prompt.replace(syncNarrationRegex, '');
    }
  }

  // 4. If VOICE PROFILE or SYNCHRONIZED VOICEOVER was not already present, insert them in standard place
  if (!hasVoiceProfile || (!hasSyncNarration && syncNarrationBlock)) {
    const missingLines: string[] = [];
    if (!hasVoiceProfile) {
      missingLines.push(voiceProfileLine);
    }
    if (!hasSyncNarration && syncNarrationBlock) {
      missingLines.push(syncNarrationBlock);
    }

    const insertionText = missingLines.join('\n');

    if (/GLOBAL VISUAL STYLE:/i.test(prompt)) {
      prompt = prompt.replace(/(\n?GLOBAL VISUAL STYLE:)/i, `\n${insertionText}\n\n$1`);
    } else if (/SHOT 1/i.test(prompt)) {
      prompt = prompt.replace(/(\n?SHOT 1)/i, `\n${insertionText}\n\n$1`);
    } else {
      prompt = `${prompt}\n\n${insertionText}`;
    }
  }

  // Clean up any double empty lines
  return prompt.replace(/\n{3,}/g, '\n\n').trim();
}
