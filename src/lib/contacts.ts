// Contact import — NEW object-based expo-contacts API ONLY. No legacy API
// is used anywhere. Lazily imported, so the app never touches contacts
// without the user tapping Import, and nothing is ever uploaded: the
// picked contact's details are copied into the local event only.
//
// Contact shapes differ slightly by platform, so mapping is defensive:
// a field that is missing or oddly shaped is treated as absent, never
// as a crash. Birthday year may be absent (year-unknown birthdays) —
// in that case the current year is used as the editor's starting date
// and the user can correct it; it is never presented as the real year.
export interface ImportedContact {
  name: string;
  birthdayISO: string | null; // YYYY-MM-DD, or null when no birthday on file
  birthdayMonth: number | null;
  birthdayDay: number | null;
  birthdayYearKnown: boolean;
  phone: string | null;
  email: string | null;
  imageUri: string | null;
}

export type ContactsPermission = 'granted' | 'denied' | 'unavailable';

function firstString(v: unknown): string | null {
  if (typeof v === 'string' && v.trim()) return v.trim();
  if (Array.isArray(v)) {
    for (const item of v) {
      if (typeof item === 'string' && item.trim()) return item.trim();
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>;
        for (const k of ['number', 'email', 'value', 'label']) {
          if (typeof o[k] === 'string' && (o[k] as string).trim()) return (o[k] as string).trim();
        }
      }
    }
  }
  return null;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Requests permission and, if granted, returns contacts WITH a birthday. */
export async function loadContactsWithBirthday(): Promise<{
  permission: ContactsPermission;
  contacts: ImportedContact[];
  error?: string;
}> {
  try {
    const mod = await import('expo-contacts');
    const Contacts = (mod as unknown as { default?: unknown }).default ?? mod;
    const C = Contacts as {
      requestPermissionsAsync?: () => Promise<{ status?: string; granted?: boolean }>;
      Contact?: {
        getAllDetails?: (fields: string[], options?: Record<string, unknown>) => Promise<unknown[]>;
      };
    };
    const perm = await C.requestPermissionsAsync?.();
    const granted = perm?.status === 'granted' || perm?.granted === true;
    if (!granted) return { permission: 'denied', contacts: [] };
    const getAllDetails = C.Contact?.getAllDetails;
    if (!getAllDetails) return { permission: 'unavailable', contacts: [], error: 'This device does not expose the new contacts API.' };
    const rows = await getAllDetails(
      ['fullName', 'givenName', 'familyName', 'birthday', 'phones', 'emails', 'image', 'thumbnail'],
      { sortOrder: 'givenName' },
    );
    const out: ImportedContact[] = [];
    for (const row of rows as Record<string, unknown>[]) {
      const b = row.birthday as { month?: number; day?: number; year?: number } | null | undefined;
      if (!b || !b.month || !b.day) continue;
      const yearKnown = typeof b.year === 'number' && b.year > 1900;
      const year = yearKnown ? (b.year as number) : new Date().getFullYear();
      const name =
        (typeof row.fullName === 'string' && row.fullName.trim()) ||
        [row.givenName, row.familyName].filter((x) => typeof x === 'string' && x).join(' ').trim() ||
        'Unnamed contact';
      out.push({
        name,
        birthdayISO: `${year}-${pad(b.month)}-${pad(b.day)}`,
        birthdayMonth: b.month,
        birthdayDay: b.day,
        birthdayYearKnown: yearKnown,
        phone: firstString(row.phones),
        email: firstString(row.emails),
        imageUri:
          (typeof row.image === 'string' && row.image) ||
          (typeof row.thumbnail === 'string' && row.thumbnail) ||
          null,
      });
    }
    out.sort((a, b) => a.name.localeCompare(b.name));
    return { permission: 'granted', contacts: out };
  } catch (e) {
    return { permission: 'unavailable', contacts: [], error: e instanceof Error ? e.message : 'Could not read contacts.' };
  }
}
