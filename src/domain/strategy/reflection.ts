import { clamp } from '@/lib/math';
import type { Preferences, StrategyState } from './strategy';

export type ReflectionChipId = 'more-hands-on' | 'less-reading' | 'more-reading' | 'harder' | 'easier';

export interface ReflectionChip {
  id: ReflectionChipId;
  label: string;
  change: Partial<Record<keyof Preferences, number>>;
  message: string;
}

export const REFLECTION_CHIPS: ReflectionChip[] = [
  {
    id: 'more-hands-on',
    label: 'More hands-on',
    change: { handsOn: 1 },
    message: 'You asked for more building, so tasks now lean hands-on.',
  },
  {
    id: 'less-reading',
    label: 'Less reading',
    change: { handsOn: 1 },
    message: 'Less reading, more doing! Tasks will get you making things sooner.',
  },
  {
    id: 'more-reading',
    label: 'More explanations',
    change: { handsOn: -1 },
    message: 'You wanted more explanations, so tasks now include more investigating.',
  },
  { id: 'harder', label: 'Harder', change: { challenge: 1 }, message: 'Challenge accepted! Tasks will stretch you a bit more.' },
  { id: 'easier', label: 'Easier', change: { challenge: -1 }, message: "We'll keep things gentler for a while. No rush." },
];

export interface Reflection {
  chips: ReflectionChipId[];
  liked?: string;
  disliked?: string;
  strategyChange?: string;
}

const PREF_LIMIT = 2;

export function applyReflection(state: StrategyState, reflection: Reflection): StrategyState {
  const chips = [...new Set(reflection.chips)];
  if (!chips.length) return state;
  const at = new Date().toISOString();
  let preferences = { ...state.preferences };
  const changelog = [...state.changelog];
  for (const id of chips) {
    const chip = REFLECTION_CHIPS.find((c) => c.id === id);
    if (!chip) continue;
    for (const [key, delta] of Object.entries(chip.change) as [keyof Preferences, number][]) {
      preferences = { ...preferences, [key]: clamp(preferences[key] + delta, -PREF_LIMIT, PREF_LIMIT) };
    }
    changelog.push({ at, message: chip.message });
  }
  return { ...state, preferences, changelog };
}
