/*! Open Historia — difficulty levels & AI directives © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */

// Difficulty is stored on game.json (game.difficulty) and steers the AI:
// every gameplay task gets the matching directive appended to its system
// prompt, so the same simulation engine plays soft or ruthless.
export const DIFFICULTY_LEVELS = [
  {
    id: "very-easy",
    label: "Very Easy",
    emoji: "😴",
    blurb: "The city gives you room to make mistakes",
    directive:
      "DIFFICULTY very-easy: The night favors the Prince heavily. Their schemes almost always succeed and outperform expectations, rival Kindred act cautiously and rarely openly oppose them, Masquerade breaches get quietly covered up, and the Second Inquisition stays distracted elsewhere.",
  },
  {
    id: "easy",
    label: "Easy",
    emoji: "🙂",
    blurb: "A forgiving city",
    directive:
      "DIFFICULTY easy: The night is forgiving. Reasonable orders from the Prince succeed, rival Kindred are slow to exploit their mistakes, and setbacks — a botched feeding, an insulted elder — stay small and recoverable.",
  },
  {
    id: "medium",
    label: "Medium",
    emoji: "⚖️",
    blurb: "Realistic and balanced",
    directive:
      "DIFFICULTY medium: Simulate a balanced, realistic World of Darkness. The Prince's actions succeed or fail on their merits, rival Kindred pursue their own ambitions with normal cunning, and the Masquerade holds only as well as it is kept.",
  },
  {
    id: "hard",
    label: "Hard",
    emoji: "😰",
    blurb: "Rivals play to win",
    directive:
      "DIFFICULTY hard: The night is demanding. Rival Kindred are competent and opportunistic — Carruth's file on the Prince grows thicker, the Baron Council probes weak borders, and every court rival remembers a slight. Weak or vague orders fail or backfire; success requires sound strategy and careful secrecy.",
  },
  {
    id: "very-hard",
    label: "Very Hard",
    emoji: "🔥",
    blurb: "A hostile city",
    directive:
      "DIFFICULTY very-hard: The night is hostile to the Prince. Rival Kindred actively counter their moves and build coalitions against the court, only well-reasoned plans succeed, Masquerade breaches compound, and the Second Inquisition closes in on every mistake.",
  },
  {
    id: "impossible",
    label: "Impossible",
    emoji: "💀",
    blurb: "Everything conspires against you",
    directive:
      "DIFFICULTY impossible: The night conspires against the Prince. Rival Kindred are ruthless, coordinated, and relentless; the Beckoning pulls loyal allies away; even good plans meet complications; every breach feeds the Inquisition's file. The Prince survives only through brilliance — never luck.",
  },
];

export const DEFAULT_DIFFICULTY = "medium";

// Older games store "standard" (or nothing) — treat both as medium.
export const normalizeDifficulty = (value) => {
  const id = String(value ?? "").trim().toLowerCase();
  if (id === "standard" || id === "") {
    return DEFAULT_DIFFICULTY;
  }

  return DIFFICULTY_LEVELS.some((level) => level.id === id) ? id : DEFAULT_DIFFICULTY;
};

export const difficultyMeta = (value) =>
  DIFFICULTY_LEVELS.find((level) => level.id === normalizeDifficulty(value)) ||
  DIFFICULTY_LEVELS[2];

export const difficultyDirective = (value) => difficultyMeta(value).directive;
