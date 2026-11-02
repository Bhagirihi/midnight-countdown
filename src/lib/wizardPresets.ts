// First-event wizard presets — data only, NO runtime imports (only a
// type-only import, which Node's type stripping erases). That is what
// lets the plain-Node logic check import this file directly: any file
// with a runtime import of './dates' would fail Node ESM resolution
// (extensionless imports), which is why the wizard date helpers live
// in dates.ts and are only re-exported by wizard.ts.
import type { Repeat } from './dates';

export interface WizardPreset {
  id: string;
  label: string;
  /** Prefilled event name, fully editable in Step 2. */
  prefillTitle: string;
  category: string;
  repeat: Repeat;
  color: string;
  icon: string;
  sticker: string;
}

export const WIZARD_PRESETS: WizardPreset[] = [
  { id: 'birthday', label: 'Birthday', prefillTitle: 'Birthday', category: 'Birthday', repeat: 'yearly', color: '#F7A5A5', icon: 'cake', sticker: '🎂' },
  { id: 'anniversary', label: 'Anniversary', prefillTitle: 'Anniversary', category: 'Anniversary', repeat: 'yearly', color: '#8E99F3', icon: 'heart', sticker: '❤️' },
  { id: 'wedding', label: 'Wedding', prefillTitle: 'Wedding', category: 'Wedding', repeat: 'none', color: '#FCE570', icon: 'heart', sticker: '💍' },
  { id: 'holiday', label: 'Holiday', prefillTitle: 'Holiday', category: 'Holiday', repeat: 'yearly', color: '#4ADE80', icon: 'leaf', sticker: '🌸' },
  { id: 'exam', label: 'Exam', prefillTitle: 'Exam', category: 'Custom', repeat: 'none', color: '#38BDF8', icon: 'book', sticker: '📚' },
  { id: 'trip', label: 'Trip', prefillTitle: 'Trip', category: 'Trip', repeat: 'none', color: '#8E99F3', icon: 'airplane', sticker: '✈️' },
  { id: 'baby-due', label: 'Baby due', prefillTitle: 'Baby due', category: 'Family', repeat: 'none', color: '#F472B6', icon: 'heart', sticker: '👶' },
  { id: 'work-deadline', label: 'Work deadline', prefillTitle: 'Work deadline', category: 'Work', repeat: 'none', color: '#FB923C', icon: 'trophy', sticker: '💼' },
  // 9th row: the manual escape hatch. Everything else stays blank so
  // the user types their own title/category in the full editor later.
  { id: 'manual', label: 'Add manually', prefillTitle: '', category: 'Custom', repeat: 'none', color: '#F7A5A5', icon: 'calendar', sticker: '' },
];

export function wizardPreset(id: string): WizardPreset {
  return WIZARD_PRESETS.find((p) => p.id === id) ?? WIZARD_PRESETS[WIZARD_PRESETS.length - 1];
}
