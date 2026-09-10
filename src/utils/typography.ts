/**
 * Replaces regular spaces after Russian prepositions, conjunctions, and short words with non-breaking spaces (\u00A0).
 */
export function formatNbsp(text: string): string {
  if (!text || typeof text !== "string") return text;

  // 1. Digits followed by words/units (e.g. "3000 очков", "25 шт", "10 победителей", "300 сек", "№ 1")
  let res = text.replace(/(\d+|№)\s+([а-яёa-z]+)/gi, "$1\u00A0$2");

  // 2. Prepositions and conjunctions followed by whitespace
  const prepPattern =
    /(^|[\s(«"„—–-])(в|во|без|до|для|за|из|к|ко|на|над|о|об|обо|от|перед|при|про|с|со|у|под|по|через|и|а|но|да|не|ни|или)\s+/gi;

  // Run twice to properly handle adjacent prepositions like "и в", "не для", "а по"
  res = res.replace(prepPattern, "$1$2\u00A0");
  res = res.replace(prepPattern, "$1$2\u00A0");

  // 3. Short particles following a word (e.g. "ли", "же", "бы")
  res = res.replace(/\s+(же|ли|бы)([\s.,!?:;]|$)/gi, "\u00A0$1$2");

  return res;
}
