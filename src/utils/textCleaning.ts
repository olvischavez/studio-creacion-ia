/**
 * Utility to rigorously clean and calibrate documentary voiceover texts.
 * - Strips any "Beat 1", "Beat 2", "Paso 1", "Clip 1", etc.
 * - Strips director instructions / meta-directives ("El narrador describe...", "Se debe hacer...", "Esta escena muestra...")
 * - Ensures pure historical storytelling that narrates part of the prompt's scene in 10 seconds.
 * - Enforces 15-22 words max (~7-9 seconds spoken audio).
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

export function enforce10SecondVoiceover(rawText: string): string {
  if (!rawText) return '';
  const clean = cleanStoryVoiceover(rawText);
  const words = clean.split(/\s+/).filter(Boolean);

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

  // Otherwise take 20 words and terminate with a clean period
  return words.slice(0, 20).join(' ') + '.';
}
