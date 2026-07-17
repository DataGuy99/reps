// ── HEAD-LEVEL MUSCLE LOAD DISTRIBUTION ─────────────────────────────────────────
// Written 2026-07-17. The exercise catalog (exercises.js) tracks involvement only at
// the whole-muscle-group level (chest, shoulders, …). This module refines that into
// the individual HEADS of each muscle (upper/mid/lower chest, front/side/rear delt,
// long/lateral/medial triceps, …) — INCLUDING background/secondary involvement — so
// recording (weekly volume) and reporting (insights) can show which heads are actually
// being hit, and the generator can gear work to fill under-trained heads.
//
// Design, and why:
// - Additive & backward-compatible: exercises.js is untouched. headLoad() expands an
//   exercise's existing {muscle:%} involvement into {muscle/head:%} using either a
//   per-exercise EMPHASIS override (where a variation genuinely biases a head) or the
//   muscle's DEFAULT_SPLIT (a neutral within-muscle distribution). Every head split
//   sums to 100, so a muscle's total involvement % is conserved when spread to heads.
// - "Even in the background": secondary-muscle involvement (ex.s) is expanded to heads
//   too, so e.g. the rear-delt work inside a row, or the long-head triceps stretch in
//   an overhead press, is captured — not just the primary mover.
// - Splits are anatomy/EMG-informed approximations, tunable — not claimed exact. The
//   point is a consistent, refinable model, the same philosophy as the muscle-group
//   involvement numbers already in the catalog.

// Heads per muscle group, in a stable display order.
export const HEADS = {
  chest:      ["upper", "mid", "lower"],
  back:       ["lats", "rhomboids", "erectors"],
  shoulders:  ["front", "side", "rear"],
  biceps:     ["longHead", "shortHead", "brachialis"],
  triceps:    ["longHead", "lateralHead", "medialHead"],
  quads:      ["rectusFemoris", "vastusLateralis", "vastusMedialis", "vastusIntermedius"],
  hamstrings: ["bicepsFemoris", "semi"],
  glutes:     ["max", "medius", "minimus"],
  calves:     ["gastrocnemius", "soleus"],
  core:       ["rectus", "obliques", "transverse"],
  traps:      ["upper", "mid", "lower"],
  forearms:   ["flexors", "extensors", "brachioradialis"],
};

// Human-readable labels for reporting, keyed "muscle/head".
export const HEAD_LABELS = {
  "chest/upper":"Upper chest", "chest/mid":"Mid chest", "chest/lower":"Lower chest",
  "back/lats":"Lats", "back/rhomboids":"Mid-back / rhomboids", "back/erectors":"Spinal erectors",
  "shoulders/front":"Front delt", "shoulders/side":"Side delt", "shoulders/rear":"Rear delt",
  "biceps/longHead":"Biceps long head", "biceps/shortHead":"Biceps short head", "biceps/brachialis":"Brachialis",
  "triceps/longHead":"Triceps long head", "triceps/lateralHead":"Triceps lateral head", "triceps/medialHead":"Triceps medial head",
  "quads/rectusFemoris":"Rectus femoris", "quads/vastusLateralis":"Vastus lateralis", "quads/vastusMedialis":"Vastus medialis (VMO)", "quads/vastusIntermedius":"Vastus intermedius",
  "hamstrings/bicepsFemoris":"Biceps femoris (lateral ham)", "hamstrings/semi":"Semitendinosus/membranosus (medial ham)",
  "glutes/max":"Gluteus maximus", "glutes/medius":"Gluteus medius", "glutes/minimus":"Gluteus minimus",
  "calves/gastrocnemius":"Gastrocnemius", "calves/soleus":"Soleus",
  "core/rectus":"Rectus abdominis", "core/obliques":"Obliques", "core/transverse":"Transverse / deep core",
  "traps/upper":"Upper traps", "traps/mid":"Mid traps", "traps/lower":"Lower traps",
  "forearms/flexors":"Wrist flexors", "forearms/extensors":"Wrist extensors", "forearms/brachioradialis":"Brachioradialis",
};

// Neutral within-muscle split for an exercise that doesn't bias a specific head.
// Each object sums to 100.
const DEFAULT_SPLIT = {
  chest:      {upper:25, mid:45, lower:30},
  back:       {lats:45, rhomboids:35, erectors:20},
  shoulders:  {front:35, side:40, rear:25},
  biceps:     {longHead:40, shortHead:40, brachialis:20},
  triceps:    {longHead:40, lateralHead:35, medialHead:25},
  quads:      {rectusFemoris:25, vastusLateralis:30, vastusMedialis:25, vastusIntermedius:20},
  hamstrings: {bicepsFemoris:50, semi:50},
  glutes:     {max:70, medius:20, minimus:10},
  calves:     {gastrocnemius:55, soleus:45},
  core:       {rectus:45, obliques:30, transverse:25},
  traps:      {upper:45, mid:30, lower:25},
  forearms:   {flexors:40, extensors:35, brachioradialis:25},
};

// Per-exercise head emphasis — only where a movement genuinely biases specific heads
// vs. the neutral default. Keyed by exercise name; each value maps muscle → head split
// (which must sum to 100). Muscles not listed for an exercise use DEFAULT_SPLIT.
// Grounded in movement mechanics: line of pull, joint angle, stretch position.
const EMPHASIS = {
  // ── CHEST angle / delt bias ──
  "Incline Barbell Bench Press": {chest:{upper:55, mid:35, lower:10}, shoulders:{front:55, side:30, rear:15}},
  "Incline Dumbbell Press":      {chest:{upper:55, mid:35, lower:10}, shoulders:{front:55, side:30, rear:15}},
  "Incline Dumbbell Flyes":      {chest:{upper:55, mid:35, lower:10}, shoulders:{front:50, side:30, rear:20}},
  "Decline Dumbbell Press":      {chest:{upper:10, mid:40, lower:50}, triceps:{longHead:30, lateralHead:40, medialHead:30}},
  "Decline Push-ups":            {chest:{upper:45, mid:35, lower:20}, shoulders:{front:60, side:25, rear:15}}, // pike-ish, front-delt heavy
  "Barbell Bench Press":         {chest:{upper:20, mid:50, lower:30}, triceps:{longHead:25, lateralHead:40, medialHead:35}},
  "Dumbbell Bench Press":        {chest:{upper:22, mid:50, lower:28}},
  "Dumbbell Floor Press":        {chest:{upper:25, mid:50, lower:25}, triceps:{longHead:30, lateralHead:40, medialHead:30}}, // partial ROM, triceps-lockout
  "Dumbbell Flyes":              {chest:{upper:20, mid:55, lower:25}}, // stretch-biased mid
  "Dumbbell Squeeze Press":      {chest:{upper:25, mid:55, lower:20}}, // inner-chest adduction emphasis
  "Svend Press":                 {chest:{upper:30, mid:55, lower:15}},
  "Dips":                        {chest:{upper:5, mid:35, lower:60}, triceps:{longHead:35, lateralHead:40, medialHead:25}}, // lean = lower chest
  "Push-ups":                    {chest:{upper:20, mid:50, lower:30}},
  "Diamond Push-ups":            {chest:{upper:20, mid:50, lower:30}, triceps:{longHead:30, lateralHead:35, medialHead:35}},

  // ── SHOULDERS ──
  "Barbell Overhead Press":      {shoulders:{front:60, side:30, rear:10}, triceps:{longHead:45, lateralHead:30, medialHead:25}},
  "Barbell Push Press":          {shoulders:{front:60, side:30, rear:10}},
  "Dumbbell Arnold Press":       {shoulders:{front:50, side:40, rear:10}},
  "Pike Push-ups":               {shoulders:{front:60, side:30, rear:10}, triceps:{longHead:35, lateralHead:35, medialHead:30}},
  "Landmine Press":              {shoulders:{front:65, side:25, rear:10}, chest:{upper:60, mid:30, lower:10}},
  "Single-arm Landmine Press":   {shoulders:{front:65, side:25, rear:10}, chest:{upper:60, mid:30, lower:10}},
  "Dumbbell Lateral Raises":     {shoulders:{front:10, side:80, rear:10}},
  "Dumbbell Front Raises":       {shoulders:{front:80, side:15, rear:5}},
  "Plate Front Raises":          {shoulders:{front:80, side:15, rear:5}},
  "Dumbbell Reverse Flyes":      {shoulders:{front:5, side:20, rear:75}},
  "Incline DB Reverse Flyes":    {shoulders:{front:5, side:15, rear:80}},
  "Barbell Upright Rows":        {shoulders:{front:20, side:65, rear:15}, traps:{upper:70, mid:20, lower:10}},
  "Dumbbell Upright Rows":       {shoulders:{front:20, side:65, rear:15}, traps:{upper:70, mid:20, lower:10}},

  // ── TRICEPS head bias ──
  "EZ Bar Skull Crushers":       {triceps:{longHead:45, lateralHead:30, medialHead:25}},
  "EZ Bar Overhead Extension":   {triceps:{longHead:60, lateralHead:20, medialHead:20}}, // overhead = long-head stretch
  "Dumbbell Overhead Tricep Ext":{triceps:{longHead:60, lateralHead:20, medialHead:20}},
  "Close-grip Barbell Bench":    {triceps:{longHead:25, lateralHead:40, medialHead:35}, chest:{upper:20, mid:55, lower:25}},
  "Dumbbell Kickbacks":          {triceps:{longHead:50, lateralHead:30, medialHead:20}},

  // ── BICEPS head bias ──
  "Incline Dumbbell Curls":      {biceps:{longHead:65, shortHead:25, brachialis:10}}, // shoulder-extended = long-head stretch
  "Dumbbell Concentration Curls":{biceps:{longHead:25, shortHead:65, brachialis:10}}, // peak/short head
  "Dumbbell Hammer Curls":       {biceps:{longHead:30, shortHead:20, brachialis:50}, forearms:{flexors:20, extensors:20, brachioradialis:60}},
  "Dumbbell Zottman Curls":      {biceps:{longHead:30, shortHead:30, brachialis:40}, forearms:{flexors:25, extensors:45, brachioradialis:30}},
  "EZ Bar Reverse Curls":        {biceps:{longHead:20, shortHead:20, brachialis:60}, forearms:{flexors:15, extensors:55, brachioradialis:30}},
  "EZ Bar Curls":                {biceps:{longHead:35, shortHead:45, brachialis:20}},
  "Barbell Curls":               {biceps:{longHead:35, shortHead:45, brachialis:20}},

  // ── BACK line-of-pull ──
  "Wide-grip Pull-ups":          {back:{lats:70, rhomboids:25, erectors:5}},
  "Pull-ups":                    {back:{lats:60, rhomboids:30, erectors:10}},
  "Chin-ups":                    {back:{lats:55, rhomboids:30, erectors:15}, biceps:{longHead:35, shortHead:50, brachialis:15}},
  "Commando Pull-ups":           {back:{lats:55, rhomboids:35, erectors:10}},
  "Barbell Rows":                {back:{lats:45, rhomboids:45, erectors:10}},
  "Pendlay Rows":                {back:{lats:40, rhomboids:50, erectors:10}},
  "Dumbbell Rows":               {back:{lats:50, rhomboids:40, erectors:10}},
  "Chest-supported Incline DB Rows":{back:{lats:40, rhomboids:55, erectors:5}}, // supported = mid-back
  "Meadow Rows":                 {back:{lats:55, rhomboids:35, erectors:10}},
  "Inverted Rows":               {back:{lats:40, rhomboids:50, erectors:10}},
  "Dumbbell Pullovers":          {back:{lats:80, rhomboids:10, erectors:10}, chest:{upper:20, mid:55, lower:25}},

  // ── TRAPS ──
  "Barbell Shrugs":              {traps:{upper:80, mid:15, lower:5}},
  "Dumbbell Shrugs":             {traps:{upper:80, mid:15, lower:5}},

  // ── QUADS / squat pattern ──
  "Barbell Front Squat":         {quads:{rectusFemoris:30, vastusLateralis:25, vastusMedialis:30, vastusIntermedius:15}}, // upright = more rectus/VMO
  "Barbell Back Squat":          {quads:{rectusFemoris:20, vastusLateralis:35, vastusMedialis:25, vastusIntermedius:20}},
  "Belt Squat":                  {quads:{rectusFemoris:20, vastusLateralis:32, vastusMedialis:28, vastusIntermedius:20}},
  "Sissy Squats":                {quads:{rectusFemoris:40, vastusLateralis:22, vastusMedialis:22, vastusIntermedius:16}}, // knees-forward, rectus stretch
  "Pistol Squats":               {quads:{rectusFemoris:25, vastusLateralis:25, vastusMedialis:35, vastusIntermedius:15}, glutes:{max:60, medius:30, minimus:10}}, // single-leg = med/VMO
  "Dumbbell Bulgarian Split Squat":{quads:{rectusFemoris:20, vastusLateralis:25, vastusMedialis:35, vastusIntermedius:20}, glutes:{max:55, medius:35, minimus:10}},
  "Wall Sit":                    {quads:{rectusFemoris:20, vastusLateralis:30, vastusMedialis:30, vastusIntermedius:20}},

  // ── GLUTES / hinge & single-leg ──
  "Barbell Hip Thrusts":         {glutes:{max:80, medius:15, minimus:5}},
  "Single-leg Hip Thrust":       {glutes:{max:70, medius:25, minimus:5}},
  "B-stance Hip Thrust":         {glutes:{max:75, medius:20, minimus:5}},
  "Barbell Glute Bridge":        {glutes:{max:80, medius:15, minimus:5}},
  "Dumbbell Curtsy Lunge":       {glutes:{max:55, medius:35, minimus:10}}, // frontal-plane = medius
  "Dumbbell Reverse Lunges":     {glutes:{max:65, medius:25, minimus:10}},
  "Landmine Reverse Lunge":      {glutes:{max:65, medius:25, minimus:10}},

  // ── HAMSTRINGS ──
  "Nordic Curls":                {hamstrings:{bicepsFemoris:45, semi:55}}, // knee-flexion = both, slight medial
  "Barbell Romanian Deadlifts":  {hamstrings:{bicepsFemoris:55, semi:45}, back:{lats:15, rhomboids:15, erectors:70}},
  "Dumbbell Romanian Deadlifts": {hamstrings:{bicepsFemoris:55, semi:45}, back:{lats:15, rhomboids:15, erectors:70}},
  "Single-leg DB Romanian Deadlift":{hamstrings:{bicepsFemoris:55, semi:45}, glutes:{max:60, medius:35, minimus:5}, back:{lats:10, rhomboids:20, erectors:70}},
  "Landmine Romanian Deadlift":  {hamstrings:{bicepsFemoris:55, semi:45}, back:{lats:15, rhomboids:15, erectors:70}},
  "Barbell Good Mornings":       {hamstrings:{bicepsFemoris:55, semi:45}, back:{lats:5, rhomboids:15, erectors:80}},
  "Conventional Deadlift":       {hamstrings:{bicepsFemoris:55, semi:45}, back:{lats:20, rhomboids:20, erectors:60}, glutes:{max:80, medius:15, minimus:5}},
  "Sumo Deadlift":               {hamstrings:{bicepsFemoris:50, semi:50}, back:{lats:20, rhomboids:20, erectors:60}, glutes:{max:70, medius:25, minimus:5}, quads:{rectusFemoris:20, vastusLateralis:30, vastusMedialis:30, vastusIntermedius:20}},

  // ── CALVES ──
  "Seated Dumbbell Calf Raises": {calves:{gastrocnemius:25, soleus:75}}, // bent knee = soleus
  "Single-leg Calf Raises":      {calves:{gastrocnemius:65, soleus:35}}, // straight knee = gastroc
  "Barbell Calf Raises":         {calves:{gastrocnemius:65, soleus:35}},

  // ── CORE region bias ──
  "Hanging Leg Raises":          {core:{rectus:55, obliques:25, transverse:20}}, // lower-rectus + hip flexor
  "Hanging Knee Raises":         {core:{rectus:55, obliques:20, transverse:25}},
  "Toes to Bar":                 {core:{rectus:55, obliques:25, transverse:20}},
  "Windshield Wipers":           {core:{rectus:25, obliques:60, transverse:15}}, // rotation = obliques
  "Russian Twists":              {core:{rectus:20, obliques:65, transverse:15}},
  "Dumbbell Side Bends":         {core:{rectus:10, obliques:80, transverse:10}},
  "Landmine Rotations":          {core:{rectus:15, obliques:65, transverse:20}},
  "Dumbbell Woodchops":          {core:{rectus:15, obliques:60, transverse:25}},
  "Side Plank":                  {core:{rectus:10, obliques:60, transverse:30}},
  "Copenhagen Plank":            {core:{rectus:10, obliques:60, transverse:30}},
  "Plank Hold":                  {core:{rectus:25, obliques:20, transverse:55}}, // anti-extension = deep core
  "Hollow Body Hold":            {core:{rectus:45, obliques:20, transverse:35}},
  "Dead Bugs":                   {core:{rectus:25, obliques:20, transverse:55}}, // anti-extension / stability
  "Bird Dogs":                   {core:{rectus:15, obliques:25, transverse:60}}, // anti-rotation
  "Ab Wheel / Barbell Rollouts": {core:{rectus:45, obliques:15, transverse:40}},
  "Dragon Flags":                {core:{rectus:60, obliques:20, transverse:20}},
  "Decline Sit-ups":             {core:{rectus:65, obliques:20, transverse:15}},
  "Mountain Climbers":           {core:{rectus:35, obliques:40, transverse:25}},
  "Farmer Carries":              {core:{rectus:20, obliques:30, transverse:50}, traps:{upper:70, mid:20, lower:10}},
  "Suitcase Carry":              {core:{rectus:10, obliques:55, transverse:35}, traps:{upper:70, mid:20, lower:10}},
};

// Look up an exercise's raw {muscle:%} involvement from the catalog (primary+secondary).
function muscleInvolvement(exObj){
  const out = {};
  [...(exObj.p||[]), ...(exObj.s||[])].forEach(({m, p}) => { out[m] = (out[m]||0) + p; });
  return out;
}

// Expand an exercise into head-level involvement.
// Returns { "muscle/head": effectivePercent, ... } where, per muscle, the head
// percentages sum to that muscle's total involvement (primary + background alike).
// `exObj` is a catalog exercise object; if you only have a name, pass the object
// (callers already have EXERCISES.find). Unknown/heads-less muscles pass through as
// "muscle/_" so nothing is silently dropped.
export function headLoad(exObj){
  if(!exObj) return {};
  const involvement = muscleInvolvement(exObj);
  const emph = EMPHASIS[exObj.name] || {};
  const out = {};
  Object.entries(involvement).forEach(([muscle, pct]) => {
    const heads = HEADS[muscle];
    if(!heads){ out[`${muscle}/_`] = (out[`${muscle}/_`]||0) + pct; return; }
    const split = emph[muscle] || DEFAULT_SPLIT[muscle];
    const total = heads.reduce((a,h)=>a+(split[h]||0), 0) || 1;
    heads.forEach(h => {
      const share = (split[h]||0)/total;
      if(share>0) out[`${muscle}/${h}`] = (out[`${muscle}/${h}`]||0) + pct*share;
    });
  });
  return out;
}

// Aggregate head-level hard-set volume across a set of logged entries, mirroring
// calcWeeklyVolume() but at head granularity. `rows` = [{exObj, hardSets}]. Returns
// { "muscle/head": effectiveHardSets }. Lets recording/reporting show which heads a
// week actually trained (incl. background involvement) rather than just muscle groups.
export function headVolume(rows){
  const vol = {};
  (rows||[]).forEach(({exObj, hardSets}) => {
    if(!exObj || !hardSets) return;
    const hl = headLoad(exObj);
    Object.entries(hl).forEach(([key, pct]) => { vol[key] = (vol[key]||0) + hardSets*(pct/100); });
  });
  return vol;
}
