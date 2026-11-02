// Logic checks for src/lib/dates.ts. Run: node scripts/check-dates.mts
// No test framework, no network. Prints PASS/FAIL per case and exits
// non-zero if anything fails. Dates are fixed so results never drift.
import {
  birthstone,
  breakdownBetween,
  countdownInfo,
  countUpDayNumber,
  dLabel,
  daysBetween,
  milestones,
  nextOccurrence,
  ordinal,
  turningInfo,
  zodiacSign,
} from '../src/lib/dates.ts';
import { hashPin, verifyPin } from '../src/lib/applock.ts';
// wizardDateFrom* live in dates.ts and presets in wizardPresets.ts
// (both leaf modules) — importing wizard.ts itself would pull a
// runtime './dates' import that Node ESM cannot resolve.
import { wizardDateFromDate, wizardDateFromDays } from '../src/lib/dates.ts';
import { WIZARD_PRESETS, wizardPreset } from '../src/lib/wizardPresets.ts';
import { widgetVariantProps, WIDGET_VARIANTS } from '../src/lib/widgets.ts';

let pass = 0;
let fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    pass++;
    console.log(`PASS ${name}`);
  } else {
    fail++;
    console.log(`FAIL ${name}: got ${a}, expected ${e}`);
  }
}

// Countdown basics (today fixed at 2026-11-02)
check('countdown D-13', dLabel('2026-11-15', '2026-11-02'), 'D-13');
check('countdown D-Day', dLabel('2026-11-02', '2026-11-02'), 'D-Day');
check('countdown D+5', dLabel('2026-10-28', '2026-11-02'), 'D+5');
check('daysBetween', daysBetween('2026-11-02', '2026-11-15'), 13);
check('countdownInfo label', countdownInfo('2026-11-15', 'countdown', 'none', '2026-11-02').label, 'D-13');
check('past single countdown stays D+', countdownInfo('2026-10-28', 'countdown', 'none', '2026-11-02').label, 'D+5');

// Count-up: start day is Day 1
check('countup Day 1 on start', countUpDayNumber('2026-11-02', '2026-11-02'), 1);
check('countup Day 43 after 42 days', countUpDayNumber('2026-09-21', '2026-11-02'), 43);
check('countup label', countdownInfo('2026-09-21', 'countup', 'none', '2026-11-02').label, 'Day 43');

// Yearly rollover: past this year -> next year
check('yearly past rolls to next year', nextOccurrence('2025-06-10', 'yearly', '2026-11-02'), '2027-06-10');
check('yearly upcoming this year', nextOccurrence('2025-12-25', 'yearly', '2026-11-02'), '2026-12-25');
check('yearly on the day itself', nextOccurrence('2025-11-02', 'yearly', '2026-11-02'), '2026-11-02');
// Feb 29 -> Feb 28 in non-leap years, Feb 29 kept in leap years
check('Feb29 -> Feb28 non-leap', nextOccurrence('2024-02-29', 'yearly', '2026-11-02'), '2027-02-28');
check('Feb29 kept in leap year', nextOccurrence('2024-02-29', 'yearly', '2028-01-01'), '2028-02-29');
check('Feb29 this-year Feb28 when upcoming', nextOccurrence('2024-02-29', 'yearly', '2027-01-01'), '2027-02-28');

// Monthly rollover + clamping
check('monthly upcoming this month', nextOccurrence('2026-01-20', 'monthly', '2026-11-02'), '2026-11-20');
check('monthly past this month -> next month', nextOccurrence('2026-01-01', 'monthly', '2026-11-02'), '2026-12-01');
check('monthly Jan31 clamps to Feb28', nextOccurrence('2026-01-31', 'monthly', '2026-02-10'), '2026-02-28');

// Milestones: 100-day from 2026-01-01 is 2026-04-11 (elapsed 100)
const ms = milestones('2026-01-01', 'countup', 'none', '2026-11-02');
check('100-day milestone date', ms.find((m) => m.label === '100-day')?.dateISO, '2026-04-11');
check('100-day milestone reached', ms.find((m) => m.label === '100-day')?.reached, true);
check('200-day milestone date', ms.find((m) => m.label === '200-day')?.dateISO, '2026-07-20');
check('300-day milestone date', ms.find((m) => m.label === '300-day')?.dateISO, '2026-10-28');
check('next 100-day milestone is future', ms.some((m) => m.label === '400-day' && !m.reached), true);
check('1-year milestone present', ms.some((m) => m.label === '1-year' && !m.reached), true);
check('single countdown has no anniversary milestones', milestones('2026-11-15', 'countdown', 'none', '2026-11-02'), []);

// Breakdown: 13 days = 1 week + 6 days; Nov 2 -> Dec 25 = 1 month + 23 days
const b1 = breakdownBetween('2026-11-02', '2026-11-15');
check('breakdown weeks', [b1.days, b1.weeks, b1.daysAfterWeeks], [13, 1, 6]);
const b2 = breakdownBetween('2026-11-02', '2026-12-25');
check('breakdown months', [b2.days, b2.months, b2.daysAfterMonths], [53, 1, 23]);

// Turning age / anniversary banners (measured at the NEXT occurrence)
check('turning 50 birthday', turningInfo('1977-06-10', 'Birthday', 'yearly', '2026-11-02'), { label: 'Turning 50', number: 50, nextISO: '2027-06-10' });
check('10th anniversary', turningInfo('2017-03-05', 'Anniversary', 'yearly', '2026-11-02'), { label: '10th Anniversary', number: 10, nextISO: '2027-03-05' });
check('turning on the day itself', turningInfo('2000-11-02', 'Birthday', 'yearly', '2026-11-02')?.label, 'Turning 26');
check('non-yearly has no turning', turningInfo('2000-11-02', 'Birthday', 'none', '2026-11-02'), null);
check('same-year yearly has no turning yet', turningInfo('2026-12-25', 'Birthday', 'yearly', '2026-11-02'), null);
check('ordinal 1st/2nd/3rd/11th/21st', [ordinal(1), ordinal(2), ordinal(3), ordinal(11), ordinal(21), ordinal(22)], ['1st', '2nd', '3rd', '11th', '21st', '22nd']);

// Zodiac + birthstone (fun only, from month/day)
check('zodiac Aries boundary', zodiacSign(3, 21), { sign: 'Aries', range: 'Mar 21 – Apr 19' });
check('zodiac Capricorn wraps year', zodiacSign(1, 10), { sign: 'Capricorn', range: 'Dec 22 – Jan 19' });
check('zodiac Scorpio', zodiacSign(10, 30).sign, 'Scorpio');
check('birthstone June', birthstone(6), 'Pearl');
check('birthstone December', birthstone(12), 'Turquoise');

// App-lock PIN hash: deterministic, verifies, wrong PIN fails, no plaintext stored
const h = hashPin('1234');
check('pin hash deterministic', hashPin('1234') === h, true);
check('pin verifies', verifyPin('1234', h), true);
check('wrong pin fails', verifyPin('9999', h), false);
check('pin hash is not the pin', h.includes('1234'), false);

// Wizard: days-from-today math, date validation, preset repeat defaults
check('wizard days 30 from 2026-11-02', wizardDateFromDays('2026-11-02', '30'), { dateISO: '2026-12-02', error: null });
check('wizard days 0 is today', wizardDateFromDays('2026-11-02', '0'), { dateISO: '2026-11-02', error: null });
check('wizard days rolls over year', wizardDateFromDays('2026-12-20', '30'), { dateISO: '2027-01-19', error: null });
check('wizard days rejects decimals', wizardDateFromDays('2026-11-02', '1.5').dateISO, null);
check('wizard days rejects negatives', wizardDateFromDays('2026-11-02', '-3').dateISO, null);
check('wizard date valid', wizardDateFromDate('2026-12-25'), { dateISO: '2026-12-25', error: null });
check('wizard date rejects Feb 30', wizardDateFromDate('2026-02-30').dateISO, null);
check('wizard presets are 8 + manual', WIZARD_PRESETS.length, 9);
check('wizard preset birthday yearly', [wizardPreset('birthday').category, wizardPreset('birthday').repeat], ['Birthday', 'yearly']);
check('wizard preset anniversary yearly', [wizardPreset('anniversary').category, wizardPreset('anniversary').repeat], ['Anniversary', 'yearly']);
check('wizard preset wedding one-time', [wizardPreset('wedding').category, wizardPreset('wedding').repeat], ['Wedding', 'none']);
check('wizard preset trip one-time', [wizardPreset('trip').category, wizardPreset('trip').repeat], ['Trip', 'none']);

// Widget variants: props come from the snapshot only, never invented
const snap = {
  updatedAt: '2026-11-02T00:00:00.000Z',
  pinned: { id: 'a', title: 'Trip', label: 'D-30', dateISO: '2026-12-02', color: '#F7A5A5', milestoneLabel: '100-day', storyDateISO: '2026-11-10' },
  upcoming: [
    { id: 'a', title: 'Trip', label: 'D-30', dateISO: '2026-12-02', color: '#F7A5A5' },
    { id: 'b', title: 'Exam', label: 'D-5', dateISO: '2026-11-07', color: '#38BDF8' },
    { id: 'c', title: 'Holiday', label: 'D-50', dateISO: '2026-12-22', color: '#4ADE80' },
    { id: 'd', title: 'Work', label: 'D-60', dateISO: '2027-01-01', color: '#FB923C' },
  ],
};
check('widget variants are 4', WIDGET_VARIANTS.map((v) => v.id), ['small', 'medium', 'large', 'list']);
check('widget small props', widgetVariantProps(snap, 'small'), { title: 'Trip', label: 'D-30' });
check('widget medium props', widgetVariantProps(snap, 'medium'), { title: 'Trip', label: 'D-30', dateISO: '2026-12-02' });
check('widget large props carry milestone + story', widgetVariantProps(snap, 'large'), { title: 'Trip', label: 'D-30', dateISO: '2026-12-02', nextTitle: 'Exam', nextLabel: 'D-5', milestoneLabel: '100-day', storyDateISO: '2026-11-10' });
check('widget list props are next 3', (widgetVariantProps(snap, 'list') as { items: unknown[] }).items.length, 3);
check('widget empty snapshot is honest', widgetVariantProps(null, 'small'), { title: 'No event yet', label: 'Add an event' });

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
