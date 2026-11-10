// All math is local. No network needed.

export const ACTIVITY_LEVELS = [
  { key: 'sedentary', label: 'Sedentary', hint: 'Desk job, little exercise', factor: 1.2 },
  { key: 'light', label: 'Light', hint: '1-3 workouts/week', factor: 1.375 },
  { key: 'moderate', label: 'Moderate', hint: '3-5 workouts/week', factor: 1.55 },
  { key: 'active', label: 'Active', hint: '6-7 workouts/week', factor: 1.725 },
  { key: 'very_active', label: 'Very active', hint: 'Hard training + physical job', factor: 1.9 },
];

export const GOALS = [
  { key: 'lose', label: 'Lose weight' },
  { key: 'maintain', label: 'Maintain' },
  { key: 'gain', label: 'Gain weight' },
];

// kcal/day added to (gain) or removed from (lose) maintenance
export const PACES = {
  lose: [
    { key: 'slow', label: 'Slow', kcal: 250 },
    { key: 'steady', label: 'Steady', kcal: 500 },
    { key: 'fast', label: 'Fast', kcal: 750 },
  ],
  gain: [
    { key: 'slow', label: 'Lean', kcal: 250 },
    { key: 'steady', label: 'Steady', kcal: 400 },
    { key: 'fast', label: 'Aggressive', kcal: 600 },
  ],
};

const MIN_SAFE = { male: 1500, female: 1200 };

// Mifflin-St Jeor
export function calcBMR({ sex, weightKg, heightCm, age }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function calcTargets(profile) {
  const { sex, weightKg, heightCm, age, activity, goal, pace } = profile;
  if (![weightKg, heightCm, age].every((n) => Number(n) > 0)) return null;

  const bmr = calcBMR({ sex, weightKg: +weightKg, heightCm: +heightCm, age: +age });
  const factor = ACTIVITY_LEVELS.find((a) => a.key === activity)?.factor ?? 1.2;
  const tdee = bmr * factor;

  let adjust = 0;
  if (goal === 'lose' || goal === 'gain') {
    const kcal = PACES[goal].find((p) => p.key === pace)?.kcal ?? PACES[goal][1].kcal;
    adjust = goal === 'lose' ? -kcal : kcal;
  }

  let target = tdee + adjust;
  let belowFloor = false;
  if (target < MIN_SAFE[sex]) {
    target = MIN_SAFE[sex];
    belowFloor = true;
  }

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    target: Math.round(target),
    adjust: Math.round(target - tdee),
    belowFloor,
  };
}

export function todayKey(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
