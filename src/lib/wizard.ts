// First-event wizard — draft type + conversion. The wizard component
// (FirstEventWizard.tsx) only holds draft state; it creates NOTHING
// until its Finish button is pressed exactly once, and Skip at any
// step creates nothing at all. Going back/forward never duplicates,
// because creation happens in one guarded Finish handler in Home, not
// per step. Presets and date helpers are re-exported from their leaf
// files so app code keeps a single import point.
import { todayISO } from './dates';
import type { Repeat } from './dates';
import type { WizardPreset } from './wizardPresets';

export { WIZARD_PRESETS, wizardPreset } from './wizardPresets';
export type { WizardPreset } from './wizardPresets';
export { wizardDateFromDate, wizardDateFromDays } from './dates';

/** The draft the wizard hands to Home on Finish — nothing is saved before then. */
export interface WizardDraft {
  preset: WizardPreset;
  title: string;
  dateISO: string;
  photoUri: string | null;
  widgetVariant: 'small' | 'medium' | 'large' | 'list' | 'yearDots' | 'yearLock';
}

export function wizardDraftToEventInput(draft: WizardDraft, today: string): {
  title: string; dateISO: string; type: 'countdown'; repeat: Repeat; category: string;
  color: string; icon: string; sticker: string; photoUri: string | null; createdAt: string;
} {
  return {
    title: draft.title.trim(),
    dateISO: draft.dateISO,
    type: 'countdown',
    repeat: draft.preset.repeat,
    category: draft.preset.category,
    color: draft.preset.color,
    icon: draft.preset.icon,
    sticker: draft.preset.sticker,
    photoUri: draft.photoUri,
    createdAt: today || todayISO(),
  };
}
