# workout-gen — Continuation Brief

This is the handoff doc for resuming development. It is the single source of truth for
**how to work in this repo, what's done, and what's queued next**. Read it fully before
touching code. The owner values brevity, accuracy, and surgical changes — match that.

---

## 1. What this is
A personal, fatigue-aware training PWA with progressive-overload tracking. Single-page
React app, no backend, all state in `localStorage`. Deployed as a static site via GitHub
Pages. The owner trains with it directly, so correctness of the progression math matters
more than features.

Stack: Vite + React 18, no service worker. Files that matter:
- `src/App.jsx` — the whole app (~1150 lines). Almost all work happens here.
- `src/exercises.js` — 96-exercise catalog (each: `name`, `muscles`, optional `bw`, `hold`).
- `src/main.jsx` — entry. `index.html`, `vite.config.js`, `package.json` — standard.

---

## 2. How to work here (mandatory cadence — do not skip steps)
**One feature per commit.** For each change:
1. **Audit first.** `grep`/`sed`/`view` *every* place the change touches before editing.
   The owner distrusts broad/sloppy edits; trace data flow and all call sites.
2. **Edit surgically** (prefer `str_replace`; Python heredocs with asserts for multi-edits).
3. **Build:** `npm run build` — must print `✓ built`. (`pip`/`npm` allowed domains only.)
4. **Sanity-sim the logic** with a quick `node -e '...'` before trusting it.
5. **Commit** with a descriptive lowercase message (subject + short body explaining *why*).
6. **Push**, then **poll the GitHub Actions run** until `completed/success`.
7. **Confirm `git status --short` is clean** before starting the next feature.

**Deploy:** push to `main` → GitHub Actions → GitHub Pages (`dataguy99.github.io/workout-gen`),
~50–90s. Verify via:
`GET https://api.github.com/repos/DataGuy99/workout-gen/actions/runs?per_page=1` → read
`status`/`conclusion` of the top run.

**Push command:** `git push "https://<TOKEN>@github.com/DataGuy99/workout-gen.git" HEAD:main`
— the owner holds the personal access token and will provide it on request. **Never hardcode,
print, or commit the token.** (Do not paste it into any file in this repo.)

---

## 3. Owner preferences (hold these)
- **Brevity above all.** No fluff, platitudes, hedging, or "gassing up." Adult-to-adult.
- **Accuracy is non-negotiable.** Never compromise it. Verify before claiming.
- **Pragmatic, betterment-oriented** (no coping/indulgence framing).
- **Surgical & one-at-a-time.** Audit touchpoints, change one thing, verify, move on.
- **Hold pushes until an explicit go** ("go" / "build it" / "push that"). He was burned once
  by a push during an active session: a deploy/refresh can lose *unsaved React session state*
  (localStorage data is safe across deploys). Documentation/agreed-deliverable pushes are fine.
- **His example numbers are usually hyperbolic.** Use research-grounded values, not his literals.

**Training context (informs engineering decisions):** ~183–184 lb. Ramps a belt/landmine
squat (~150 lb). Uses pull-ups and nordics as bodyweight movements — hits e.g. 6 reps @ RIR 0
(clean failure), which is exactly the case the eccentric back-off logic handles. Runs in a
calorie deficit; uses MacroFactor for empirical burn. Body data trends waist up → the
composition verdict flags a fat-gain/recomp pattern.

---

## 4. Architecture map (where things live in `App.jsx`)
- **`SK`** = `localStorage` key map (`wg2-*`); helpers `sv()` / `ld()`. Stores: `anchors`,
  `anchorLog` (keyed `{exerciseName:[sessions]}`), `accLog` (array) + `accLog+"_prog"` (keyed
  accessory history — the one progression reads), `fatigue`, `prefs`, `banned`, `nutrition`,
  `body`, `cardio`, `meso`, `history` (session list, aka `sessHist`), `profile`, `daytargets`,
  `metgoal`, `eccentrix`.
- **Anchors:** 6 fixed `PATTERNS` (horiz/vert press, horiz/vert pull, squat, hinge). Each maps
  to one exercise; the "Change" button swaps the exercise. Progression via `getProgression()`.
- **`getProgression(name, log, repRange=[6,10], targetRIR=2, bodyWeight=0)`** (~line 263):
  routes bodyweight exercises (`exDef.bw`) → `bwProgression()`; otherwise loaded **"model C"**
  e1RM double-progression (Epley e1RM averaged across all sets). Call sites: `genAcc` (~391),
  anchor session gen `initSession` (~558), and inline in the anchor card render.
- **`bwProgression(ex, last, repRange, targetRIR, bodyWeight)`** (~line 212): RIR-band model.
  Holds → time progression. *Pure-clean phase:* RIR ≥ `RIR_PROGRESS`(3) add a clean rep;
  RIR 1–2 hold (optimal hypertrophy zone); RIR 0 (failure) backs clean reps **down** by
  `targetRIR` and converts the remainder to eccentrics; at the rep ceiling → add load.
  *Eccentric phase* (E>0, RIR read as eccentric reserve): ecc RIR ≥ 3 convert one ecc→clean;
  RIR 1–2 hold the mix; RIR < 1 ease toward more ecc; graduates back to all-clean. Gated by
  `eccEnabled` (`SK.eccentrix`). Research basis: Refalo 2023/24 & Robinson 2023 — hypertrophy
  zone ~1–3 RIR, failure adds fatigue w/o benefit, eccentrics ~40% stronger / less fatigue.
- **`SetRow`** component (~line 466): per-set inputs (weight/reps/RIR/pain). For `isHold`
  exercises it shows a start/stop **hold timer** that writes elapsed seconds into the reps
  field (~466–482). Shows an eccentric input when `showEcc`. **This is the component to extend
  for the per-set power timer.**
- **`genAcc(...)`** (~line 300s onward): headroom-aware accessory selector. Reads `accProg`
  (keyed history) once; recency penalty scaled by star rating; intensity cycling
  (8-12 / 12-15 / 15-20); `exclude` param prevents reroll dupes; `muscleSeedWeight()` seeds new
  accessories; deload reduces to 1 set @ 70%. Callers: `initSession`, `rerollAcc`.
- **`VOL_LANDMARKS`** = per-muscle `{mev, mav, mrv}` weekly hard-set targets.
  **`calcWeeklyVolume(anchorLog, accLog)`**: rolling 7-day window, counts hard sets (rir ≤ 4)
  with **fractional** muscle attribution across primary+secondary. (Known limitation: under-reads
  focused muscles due to fractional-vs-direct-set mismatch; not yet fixed — a 1.0 primary / 0.5
  secondary scheme was discussed but not implemented.)
- **`meso`** = `{startDate, length}` mesocycle; `mesoState.phase` drives deload behavior.
- **Trends helpers:** `slope(pts)` least-squares; `bodyTrend(entries, key)` fits a 2-var
  least-squares (value ~ day + hour) to control for time-of-day, but only at ≥5 measurements
  spread across varied times, else plain slope; `cardioBurn()` Keytel HR-based;
  `CARDIO_MET` (steady 7 / hiit 9 / rowing) fallback + `RESIST_MET` (5).
- **Tabs:** LIFT / LOG / TRENDS via `view===`. The **ECCENTRIC toggle** sits at the top of LIFT
  under the volume dashboard — **mirror this exact pattern for the new Power toggle.**

---

## 5. Done & deployed (latest commit `01a248b`)
- Accessory engine: recency + intensity cycling; fixed a bug where `genAcc` read the flat
  `accLog` instead of the keyed `accLog+"_prog"` (accessories never progressed); reroll dedup;
  star rating protects recency.
- Eccentric overload for bodyweight: per-set `ecc` input on dynamic bw rows; research-grounded
  RIR-band `bwProgression` (see §4); ECCENTRIC toggle (default ON) at top of LIFT.
- MET-hours/week Trends metric (editable goal, default 40; cardio + lifting split, stacked
  weekly bars + goal line).
- Removed vestigial activity-override row + day-target constants (nutrition target now solely
  `dayTargets[dow]`).
- Stripped bilateral limb measurements (both arms, both thighs) everywhere; kept weight/waist/navel.
- Removed redundant first→last body delta box (kept the slope box).
- Time-of-day adjustment for body trends via covariate regression (`bodyTrend`).
- Cardio: rowing type + distance (m) input + Z1–Z5 minute boxes (blank = 0). Commit `6837225`.
- Edit duration of saved lift sessions: in Trends → Session history each entry has an **edit**
  control that swaps the row for a minutes input (pre-filled), saves back by date, flows into
  the MET-hours resistance calc. Commit `01a248b`.

---

## 6. QUEUED — build next, one at a time, per the §2 cadence
Design is **already decided** for all three (owner delegated the exact rules where noted —
keep them research-grounded). Build order suggestion: Power → Set-count → Custom anchors.

### 6.1 Power timers + power progression  *(research-grounded; model decided)*
- **Global "Power" toggle** in settings, mirroring the ECCENTRIC toggle (new `SK` key e.g.
  `wg2-power`, default OFF). When ON, **every set row** gets an *optional* per-set timer —
  extend the existing hold stopwatch in `SetRow` (~466–482), which already does start/stop and
  writes elapsed seconds.
- **Power-set model (explicit owner decisions):** TIME is the constant the user sets (the
  window, ~15–20 s); the user logs REPS done in that window; **FLAT TARGET — no velocity-loss
  autoregulation.** Power is a third goal alongside hypertrophy and strength.
- **Prescription:** a submaximal load + a fixed target rep count to hit inside the time window.
  Load is exercise-dependent in the literature (jump/ballistic ~0–30%, bench ~30–45%, back squat
  ~56–65%, hex-bar DL ~60%, Olympic ~70–80% of 1RM; low reps at maximal velocity). The app
  doesn't classify exercises, so use **a single sensible default (~50% of current e1RM, rounded
  to plate, user-editable)** + a fixed target (e.g. 5 reps).
- **Progression rule (flat target):** reps_in_window ≥ target → add a small load increment next
  session (~+2.5–5 lb, or +2.5% e1RM-equivalent), keep target + time; reps_in_window < target →
  hold load. Implement as a new branch in `getProgression` (or a parallel `powerProgression`)
  keyed off the presence of timer data on the set.
- **Citations:** Cormie 2007 (jump squat 0%, squat 56%, power clean 80% 1RM); PMC9806758
  (back-squat Pmax 64.6%, hex-bar DL 59.6% 1RM); Wilson 1993 (30–60% trains force + velocity);
  reviews: submaximal 30–80% 1RM at maximal velocity, reps ~1–5 to preserve bar speed.

### 6.2 Set-count auto-progression  *(owner said "figure it out" — keep it grounded)*
- Progression should adjust **set count**, not just reps/weight. Model: a weekly meso ramp —
  start near **MEV**, add a set once the rep range is topped out, climb toward **MRV** across the
  mesocycle, then deload. Use the existing `VOL_LANDMARKS` (mev/mav/mrv) and `meso`
  (startDate/length). New order of operations: **reps → add a set → add load.** Touches session
  generation (`initSession` set counts, `genAcc`) and the meso logic.

### 6.3 Custom-anchor configurator  *(model decided)*
- Keep the fixed 6 as the **default** ("best"). Add a **smaller, separate** option to configure/
  select your own anchors and run that custom set for a mesocycle. Integrates cleanly: the
  volume/accessory engine already reads each anchor's *assigned-exercise muscle profile*, not the
  pattern label, and logged history is keyed by exercise name (so it survives slot changes).
- **Open sub-decisions to confirm with the owner:** variable slot count? custom slot names?
  start the custom set from the 6 as an editable preset, or from blank?

---

## 7. Notes / tunables
- Tunable constants the owner may revisit: `RIR_PROGRESS`(3), `RESIST_MET`(5), MET goal default
  (40), recency window (2 sessions), muscle-seed median.
- `bodyTrend` only engages the time-of-day regression at ≥5 varied-time measurements; otherwise
  it's a plain slope. It uses the log timestamp as a proxy for measurement time (best if the
  owner logs promptly).
- A commented-out `RAMP_PREFILL` block in `initSession` is intentional and harmless.
- An earlier 4-phase data spec was completed; **this brief supersedes it** for what comes next.
- When resuming: confirm the working tree is clean and `main` is at the latest commit, then start
  with §6.1, following the §2 cadence end to end.
