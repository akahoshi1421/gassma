const levenshtein = (a: string[], b: string[]): number => {
  let prev = Array.from({ length: a.length + 1 }, (_, i) => i);

  b.forEach((bChar, j) => {
    const current = [j + 1];
    a.forEach((aChar, i) => {
      const cost = aChar === bChar ? 0 : 1;
      current.push(Math.min(current[i] + 1, prev[i + 1] + 1, prev[i] + cost));
    });
    prev = current;
  });

  return prev[a.length];
};

const MAX_DISTANCE = 3;

const suggestClosest = (input: string, candidates: string[]): string | null => {
  const inputChars = Array.from(input);

  let best: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  candidates.forEach((candidate) => {
    const distance = levenshtein(inputChars, Array.from(candidate));
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  });

  if (best === null) return null;

  const maxLength = Math.max(inputChars.length, Array.from(best).length);
  if (bestDistance <= MAX_DISTANCE && bestDistance < maxLength) return best;

  return null;
};

export { suggestClosest };
