# Midnight Countdown — professional Days-style countdown app

A D-Day / event countdown tracker on the Midnight design system
(near-black `#0F0F11`, surface `#1A1A1C`, coral `#F7A5A5`, periwinkle
`#8E99F3`, butter-yellow `#FCE570`, Space Grotesk numerals, Plus Jakarta
Sans labels, JetBrains Mono ratios). Dark-only, offline-first, no server.
This is NOT EventCount — different app, different theme, different folder.
No code was pushed to GitHub: no repo exists for this app yet.

## What is in this build

Flow: splash on every cold start (min ~1.2s, 5s fallback, never on
resume) → 3-slide onboarding (skippable) → auth (email local-only
on device, Google / Apple not-connected honest alert, Guest) →
first-event wizard when 0 events are saved (skippable, re-offered
from the empty Home) → real Home. `App.tsx` renders `Home` instead
of `Placeholder` (`src/components/Placeholder.tsx` is left unused,
not deleted). Bottom tabs are Home + Profile; Recommended Events
and Widgets live under Profile > Discover.

1. **Diverse calculations** — pure, UI-free `src/lib/dates.ts`:
   D-Day countdowns (D-13 / D-Day / D+5), day counting (start day is
   Day 1, e.g. diet or days since quitting smoking), monthly and yearly
   repeats with next-occurrence rollover, Feb 29 → Feb 28 in non-leap
   years, monthly day-31 clamping to the last day of shorter months,
   milestone markers (every 100 days and yearly anniversaries for
   count-ups; next yearly anniversary for yearly repeats), and a
   days / weeks / calendar-months breakdown. Baby-months are only a
   calendar-months breakdown — no invented developmental logic.
2. **Home + Add/Edit + Detail** — event list with filters (All /
   Upcoming / Counting up / Repeats) and search; Add/Edit with title,
   date (YYYY-MM-DD), type, repeat, category; Detail with the big
   D-number, next occurrence, breakdown, milestones, edit/delete.
3. **Deep customisation per event** — colour (Midnight palette + extras),
   Ionicons icon, sticker emoji, font (Grotesk / Jakarta / Mono, all
   already loaded), visual effect (none / coral aura / periwinkle glow,
   implemented as border styling only, no animation library), and a
   background photo picked from the device via `expo-image-picker`
   (installed cleanly, SDK 58; no faked photo is ever shown).
4. **Smart reminders** — D-7 / D-3 / D-1 / day-of at 09:00 via
   `expo-notifications`, imported LAZILY only (never top-level — a
   static import crashes Expo Go, per the EventCount lesson). A
   milestone-notification toggle lives in Settings.
5. **Story (mini-diary)** — per-event entries with date + text + up to
   8 photos, hard-capped in code (`MAX_STORY_PHOTOS = 8`, extras are
   dropped, never stored). Stored in AsyncStorage alongside events.
6. **Social / Recommended Events tab** — SEEDED LOCAL templates only:
   three generic examples (summer stadium concert, new album drop,
   global film premiere) with no real artist, venue, or date. Joining
   one opens the editor prefilled so the user picks their own date.
   Comments are LOCAL-ONLY per recommended event, stored in
   AsyncStorage, labelled "local demo" everywhere.

Seed data: the app starts with NO personal events. An "Add example
events" button on empty Home inserts 3 clearly labelled EXAMPLE events
(30-day trip countdown, 42-day-old reading streak count-up, monthly
book club) that the user can delete like any other event.

## What was added in the "build everything" pass

7. **Fundamental screens** — Profile & Settings tab, grouped
   (Profile / Notifications / Privacy & Security / About), with a
   local display name and the local email shown read-only. In-app
   Terms of Use and Privacy Policy screens state only what is true:
   everything is on-device, no server, no account, nothing uploaded.
   No privacy-policy URL, company address, or legal entity is
   invented. There is NO account password and NO Forgot Password
   flow — inventing one would be fake. Instead, Privacy & Security
   offers an optional device app-lock (see below).
8. **App-lock (optional, device-local)** — `expo-local-authentication`
   (lazily imported) for the OS biometric prompt, plus an optional
   4–6 digit app PIN stored only as a salted hash on this device
   (never plaintext, never uploaded). If the PIN is forgotten there
   is no server reset: signing out clears the lock. This is a casual
   privacy screen, not bank-grade security. Google / Apple remain
   honest not-connected alerts.
9. **Celebration dashboard** — Home sorts by chronological proximity
   and, with no filter/search active, groups into urgency buckets:
   This week / This month / Later / Counting up / Past. Milestone
   banners appear on cards and in Detail: "Turning 50" for yearly
   birthdays, "10th Anniversary" for yearly anniversaries
   (pure `turningInfo` in `dates.ts`, measured at the next
   occurrence). No hours/minutes/seconds ticker — events store
   dates only, so days + weeks/months breakdowns are all that exist.
10. **Add Event form, extended** — relationship tags (Family, Friend,
    Work, Partner, Other), categories extended with Holiday and
    Custom, optional linked contact (name/phone/email/photo from
    import), and optional notes. Date validation, repeat,
    colour/icon/sticker/font/effect/photo are unchanged.
11. **Celebration profile (Detail, extended)** — turning-age /
    anniversary banner, contact + quick actions (Call via `tel:`,
    WhatsApp via `wa.me`, Email via `mailto:` — each enabled ONLY
    when a real phone/email is linked, otherwise disabled with
    "link a contact first" text; nothing is ever sent by the app
    itself), gift planning per event (gift ideas with notes + link
    text — no checkout, no affiliate — wishlist notes, planned
    budget + spent entries with computed remaining, past-gifts log),
    copyable greeting templates per category via `expo-clipboard`
    (lazily imported; copy works, nothing is sent), and a fun-only
    zodiac sign + birthstone from month/day (no personality claims).
12. **Contact import** — new object-based `expo-contacts` API only
    (no legacy API), lazily imported. Reachable from Home empty
    state, from the device-calendar entry point, and inline inside
    Add/Edit (inline so opening it never discards a half-filled
    form). Permission denial shows a message + Open system settings,
    never a crash or silent empty list. Only contacts with a birthday
    are listed; the user picks ONE at a time with confirmation, and
    the editor opens prefilled (name, birthday, phone/email, contact
    photo). Duplicate warning (same name + same month/day) is shown
    before confirming. NO bulk auto-creation. Year-unknown birthdays
    use the current year as a starting date and say so — the year is
    never presented as real.
13. **Device-calendar import** — `expo-calendar`, lazily imported,
    reading this device's calendars only (next 12 months), per-event
    confirmation, same dedupe approach. This is NOT Google Calendar
    sync and NOT Facebook — no server, no account, nothing uploaded.
14. **Group gift planning (local only)** — per-event contributor list
    (name + item + amount, stored locally) plus a Share-summary
    button that shares plain text via RN Share. The UI labels it
    "Local plan — not a live shared link or payment" everywhere.

## What changed in the splash / widgets / navigation / wizard pass

> NOTE: the PDF user guide from earlier is now OUT OF DATE for
> navigation, widgets, and the first-run flow (it still shows the old
> 4-tab bar and no wizard). It was deliberately NOT updated here —
> refresh it only if the user asks.

15. **Splash — already present, audited, not rebuilt.** `App.tsx`
    already showed `StartupSplash` first on every cold start (fonts
    ready + ≥1.2s elapsed, 5s fallback, never on resume), and
    `app.json` already had the native splash at `#0F0F11` with the
    Midnight splash icon. Nothing about that flow was broken, so
    nothing was rebuilt. The only splash-adjacent fix was stale
    onboarding copy: slides 2–3 used to say widgets/reminders/story
    were "next steps — not built yet". They are built now, so that
    copy now states the real limits (widgets need a dev build).
16. **Multiple widgets — real definitions, dev build still
    required.** `expo-widgets ~58.0.26` + `@expo/ui ~58.0.26`
    (note: `npx expo install` first mis-wrote the UI package as a
    dependency literally named "undefined"; that entry was removed
    and `@expo/ui` was added properly, then `npm install` verified
    it). Four Android home-screen widget definitions in
    `src/widgets/` (isolated `'widget'` runtime, Jetpack Compose
    Column/Text only, props only): Small 1×1 (D-number + title),
    Medium 2×1 (+ next date), Large 2×2 (+ next milestone, next
    story date, next event — all real snapshot data, blank when
    none exists), Next-up list 4×2 (next 3 events). `app.json`
    registers all four with `enableAndroid: true` and the existing
    `android.package`. The app pushes the existing snapshot into
    them via `widgetSync.ts` (lazily imported, best-effort, silent
    no-op in Expo Go). VERIFIED WITHOUT A DEVICE: `expo prebuild
    --platform android` in an isolated copy generated all four
    providers (`MidnightSmall/Medium/Large/NextUpProvider.kt`) and
    their manifest receivers; the copy (including its rewritten
    package.json) was deleted afterwards and the project has NO
    `android/` folder. A real device/emulator + dev-build install
    is still required before any widget can actually be added.
    There is NO Android lock-screen widget: stock Android has not
    supported third-party lock-screen widgets since Android 5, and
    the UI says so instead of offering one. (iOS lock-screen
    widgets are WidgetKit accessory families — a different,
    iOS-only concept, not offered here.)
17. **Navigation de-congested — 2 tabs + FAB.** Bottom tabs are now
    Home + Profile only. Recommended Events and Widgets moved to
    Profile > Discover as full sub-views with a back button — both
    features fully intact, nothing deleted. Add Event is unmissable:
    a header button on Home AND a coral FAB (bottom-right, above
    the tab bar) on the Home list, plus the empty-state buttons.
    The duplicate bottom-of-list "+ Add event" button was removed.
    Home layout otherwise unchanged (urgency buckets, filters,
    search).
18. **First-event wizard (after auth, only with 0 events).**
    `FirstEventWizard.tsx`, shown instead of an empty Home after
    auth when no events are saved, skippable at every step, and
    re-offered from the Home empty state after a Skip. Steps in
    order: (1) "What's your special day?" — 8 presets (Birthday,
    Anniversary, Wedding, Holiday, Exam, Trip, Baby due, Work
    deadline) + "Add manually"; presets set category + repeat
    (Birthday/Anniversary/Holiday = yearly, the rest one-time).
    (2) "What do you want to call it?" — name input, prefilled from
    the preset, editable, required non-empty. (3) "When is it?" —
    Date (YYYY-MM-DD, editor validation) OR Days (whole days from
    today, computed date shown, e.g. in 30 days = 2026-12-02).
    (4) Permissions — notifications (for D-7/D-3/D-1, lazily
    imported) and location (lazily imported `expo-location`,
    installed cleanly), both skippable, denial blocks nothing, and
    the copy states plainly that location powers NO feature today
    (preference only, for possible future use). (5) Widget setup —
    pick one of the four variants, see how to add it on an Android
    home screen, and the stock-Android lock-screen note. Finish
    creates the event EXACTLY ONCE (guarded handler in Home),
    pins it for the widget, saves the chosen variant, and lands on
    Home with the event visible. Skip creates nothing; back/forward
    never duplicates.

## Checks

- `npx tsc --noEmit` — passes.
- `node scripts/check-dates.mts` — 60/60 checks pass (the previous
  42, plus wizard days-math, date validation, preset repeat
  defaults, and widget-variant props from the snapshot only).
  Run it after any change to `dates.ts`.
- `npx expo export --platform android` — passes (2.6 MB bundle;
  the temporary export directory was deleted afterwards).
- `npx expo prebuild --platform android` in an isolated copy —
  passes; all four widget providers + manifest receivers generated
  (see 16). The copy was deleted; the project has no `android/`.
- No static import of `expo-notifications`, `expo-image-picker`,
  `expo-contacts`, `expo-calendar`, `expo-local-authentication`,
  `expo-clipboard`, or `expo-location` anywhere in app code
  (`src/components/`, `src/lib/`, `App.tsx`) — all are
  dynamic-imported only. The only static expo-widgets / Jetpack
  Compose imports are inside `src/widgets/*.tsx`, which are
  isolated-runtime definitions, dynamically imported only by
  `widgetSync.ts` and never by the app entry point.

## Run

```bash
cd ~/workspace/midnight-countdown && npx expo start
```

Then open in Expo Go (Android/iOS) or press `a` / `i` for an emulator.
No EAS build, no GitHub repo, no keys are required for this build.

## Honesty — what is NOT real yet

- **Social has no server.** No real other users, no live feed, no
  likes from real people. Recommended events are seeded examples and
  comments never leave this device.
- **Widgets are defined, NOT running.** Four Android home-screen
  widget definitions + app.json config exist and prebuild generates
  their providers, but no widget can be added from Expo Go (expo-
  widgets is not available there) and none has been installed on a
  device. A dev build (prebuild + rebuild + install) is still
  required. There is NO Android lock-screen widget on stock
  Android (unsupported since Android 5) — do not claim one. The
  Profile > Discover > Widgets screen shows the widget-snapshot
  JSON (`midnight:widgetSnapshot` in AsyncStorage) the dev-build
  widgets would read.
- **Notifications need a dev build to fire.** Scheduling is
  implemented and permission is requested on tap, but in Expo Go
  scheduled notifications may not actually be delivered.
- **Photo URIs are device-local.** Picked photos are stored as URIs
  in AsyncStorage and may not survive an uninstall or reinstall.
  Nothing is uploaded anywhere.
- **No sync, no backup, no accounts.** Everything is AsyncStorage on
  this device. Email sign-in is local-only; Google / Apple are still
  not connected and show an honest alert.
- **No server auth / Forgot Password.** There is no account password
  to reset. App-lock is device-local only (see above); forgetting the
  app PIN is recovered by signing out, which clears the lock.
- **No Facebook / Google Contacts import.** Contacts come from the
  device address book only, one at a time with confirmation.
  Calendar import reads device calendars only — not Google Calendar
  sync.
- **No live group-gift link or payments.** Group planning is a local
  list plus a plain-text summary you choose to share. No money is
  collected by the app.
- **Not device-tested.** Phone check (Expo Go run, photo picking,
  reminder scheduling, story cap, widget snapshot, contact +
  calendar import permission flows, biometric / PIN unlock, the
  5-step first-event wizard, wizard permission denial, and — after
  a dev build — actually adding each of the four widgets to an
  Android home screen) is still the user's step. Contact/calendar
  import, biometric unlock, and widgets need a real device or
  emulator — they cannot be verified from this VM.

## Earlier honesty notes (still true)

- Space Grotesk ships max weight 700, not 900 — display/numerals use
  `SpaceGrotesk_700Bold`.
- Solar `-bold` icons are a web Iconify set, unavailable as a React
  Native font — Ionicons equivalents are used instead.
- Nothing on a dark background is rendered in a dark colour; all text
  uses the light `onSurface` / `onSurfaceVariant` tokens.
