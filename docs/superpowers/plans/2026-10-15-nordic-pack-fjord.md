# Nordic theme pack — fjord Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `fjord` as a complete OpenCode TUI theme with dark and light palettes, generated from approved palette anchors by a small zero-dependency build, and verified in the real terminal.

**Architecture:** Each mode's five approved anchor steps per hue live as data. A colour module does hex/OKLab maths and WCAG contrast. A ramp module expands anchors into the nine steps the contract requires, interpolating in OKLab so desaturated cold hues don't turn grey mid-ramp. A theme module assembles the full token tree, a validator asserts completeness against the contract and runs a contrast matrix, and a build CLI writes `dist/fjord.json` and can install it.

**Tech Stack:** Node 26 (installed), ESM `.mjs`, `node:test` + `node:assert`, zero runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-10-15-opencode-nordic-theme-pack-design.md`

## Global Constraints

- Node ≥ 20 (machine has v26.11.1). ESM `.mjs` only. No runtime dependencies, no TypeScript, no tooling beyond `node`.
- The filename is the theme name. Output `dist/fjord.json`.
- Both modes ship in every file. The author's `cli.json` keeps `theme.mode` unlocked.
- Every mode defines all 11 hue names (8 base plus `accent`, `interactive`, `neutral`) at all 9 steps, per `docs/reference/opencode-theme-contract.md`.
- Contrast floors: body text on base background ≥ 4.5:1; muted/secondary text, every syntax hue, and diff text ≥ 3:1.
- Step direction flips per mode: `100` lightest → `900` darkest in dark mode, reversed in light mode.
- `interactive` aliases `blue` in every theme; `accent` carries the signature hue and aliases a step of a base hue, never a bespoke ramp.
- Surfaces (`background.*`, `border.base`, `scrollbar.base`, `text.base`, `text.muted`) are literal values in `base`, not ramp steps.
- Generated JSON is never hand-edited. Retune an anchor and regenerate.
- No publishing scaffolding: no README, licence, or repo layout beyond what these tasks name.

## Review Focus

Failure modes the spec implies but no happy path catches, most likely first. Each is pinned by a test named in the owning task.

1. **A theme that loads but is missing tokens** silently falls back to built-in colours and looks *almost* right — the hardest failure to notice. Pinned by Task 4's completeness test.
2. **Light-mode muted and comment text below the contrast floor** — exactly the defect found in the approved palette (`#7b8b9c` on `#dbe3ea` ≈ 2.7:1). Tiring, not obviously broken. Pinned by Task 6's contrast matrix.
3. **Mid-ramp steps going grey**, so a code line reads as one flat wall. Pinned by Task 3's chroma-preservation test.
4. **An interpolated step colliding with an anchor step**, making two distinct syntax tokens the same colour. Pinned by Task 3's distinctness test.
5. **Ramps inverted between modes**, so light mode looks like a broken negative. Pinned by Task 5's per-mode ordering test.
6. **A malformed or short hex** (3- or 4-digit) slipping through. Pinned by Task 2's hex-validation test and Task 6's value-regex check.
7. **Warmth leaking in** — a red that reads as a warning light or an orange that reads as a sunset breaks the whole idea, even though every individual colour is defensible. Chroma *comparison* across hues is the wrong metric for this (dark colours hold more chroma than light ones, and every colour here is already heavily desaturated). What actually carries the coldness is that nothing is vivid and the greys that dominate the screen lean blue-violet. Pinned by Task 5's vividness-ceiling and cold-neutral test.

---

### Task 1: Workspace and contract

**Files:**
- Create: `package.json`, `.gitignore`
- Create: `src/contract.mjs`
- Test: `test/contract.test.mjs`
- Copy: `~/.opencode/plan/2026-10-15-opencode-nordic-theme-pack-design.md` → `docs/superpowers/specs/2026-10-15-opencode-nordic-theme-pack-design.md`
- Reference, already written: `docs/reference/opencode-theme-contract.md`

**Interfaces:**
- Consumes: nothing.
- Produces: `HUES`, `STATE_KEYS`, `tokenPaths()`, `HEX_RE`, `HUE_REF_RE`, `TOKEN_REF_RE`.

- [ ] **Step 1: Initialise the workspace**

`package.json`:

```json
{
  "name": "opencode-nordic-themes",
  "private": true,
  "type": "module",
  "scripts": { "test": "node --test", "build": "node src/build.mjs" }
}
```

`.gitignore`:

```
node_modules/
.superpowers/
dist/
```

Then:

```bash
git init
cp ~/.opencode/plan/2026-10-15-opencode-nordic-theme-pack-design.md \
   docs/superpowers/specs/2026-10-15-opencode-nordic-theme-pack-design.md
```

- [ ] **Step 2: Write the failing test**

`test/contract.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { HUES, STATE_KEYS, tokenPaths, HEX_RE, HUE_REF_RE } from "../src/contract.mjs";

test("HUES lists the eight base hues then the three aliases", () => {
  assert.deepEqual(HUES, ["gray","red","orange","yellow","green","cyan","blue","purple","accent","interactive","neutral"]);
});

test("STATE_KEYS are the five interaction states", () => {
  assert.deepEqual(STATE_KEYS, ["$hovered","$focused","$pressed","$selected","$disabled"]);
});

test("tokenPaths covers every documented path", () => {
  const paths = tokenPaths();
  for (const p of [
    "text.base", "text.muted",
    "text.action.primary.base", "text.action.destructive.$disabled",
    "text.formfield.$selected",
    "text.feedback.error.base", "text.feedback.info.muted",
    "background.base", "background.raised.high", "background.raised.max",
    "background.action.secondary.$pressed",
    "background.feedback.warning.base",
    "border.base", "scrollbar.base",
    "diff.text.hunkHeader", "diff.background.context",
    "diff.highlight.removed", "diff.lineNumber.background.added",
    "syntax.punctuation", "markdown.listEnumeration", "markdown.codeBlock",
    "@dialog.background.base", "@dialog.background.action.primary.$hovered",
  ]) assert.ok(paths.includes(p), `missing ${p}`);
  assert.ok(!paths.includes("categorical"));
});

test("HEX_RE accepts 6 and 8 digit hex, rejects 3 digit", () => {
  assert.ok(HEX_RE.test("#0e1620"));
  assert.ok(HEX_RE.test("#0e1620ff"));
  assert.ok(HEX_RE.test("#ABC"));
  assert.ok(!HEX_RE.test("0e1620"));
});

test("HUE_REF_RE accepts a whole hue or a valid step only", () => {
  assert.ok(HUE_REF_RE.test("$hue.accent"));
  assert.ok(HUE_REF_RE.test("$hue.cyan.400"));
  assert.ok(!HUE_REF_RE.test("$hue.cyan.450"));
  assert.ok(!HUE_REF_RE.test("$hue.cyan.1000"));
});
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `node --test test/contract.test.mjs`
Expected: FAIL — cannot find module `../src/contract.mjs`.

- [ ] **Step 4: Implement `src/contract.mjs`**

Export `HUES`, `STATE_KEYS`, `HEX_RE`, `HUE_REF_RE`, `TOKEN_REF_RE`, and `tokenPaths()` returning a `string[]` of every dotted path in the token tree in `docs/reference/opencode-theme-contract.md`, excluding `categorical`. Build the state-keyed groups by mapping `STATE_KEYS` onto `base` plus each state. `HEX_RE` is `^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$` case-insensitive — copied verbatim from the binary, so 3- and 4-digit hex are accepted by the contract even though we always emit 6.

- [ ] **Step 5: Run it and confirm it passes**

Run: `node --test test/contract.test.mjs`
Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: workspace, theme contract, and design spec"
```

---

### Task 2: Colour maths

**Files:**
- Create: `src/color.mjs`
- Test: `test/color.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `hexToRgb(hex) -> {r,g,b}`, `rgbToHex({r,g,b}) -> string`, `srgbToOklab({r,g,b}) -> {L,a,b}`, `oklabToSrgb({L,a,b}) -> {r,g,b}`, `mixOklab(hexA, hexB, t) -> string`, `relativeLuminance(hex) -> number`, `contrastRatio(hexA, hexB) -> number`.

- [ ] **Step 1: Write the failing test**

`test/color.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { hexToRgb, rgbToHex, srgbToOklab, oklabToSrgb,
         mixOklab, relativeLuminance, contrastRatio } from "../src/color.mjs";

test("hexToRgb parses 6 and 3 digit forms, rejects junk", () => {
  assert.deepEqual(hexToRgb("#0e1620"), { r: 14, g: 22, b: 32 });
  assert.deepEqual(hexToRgb("#fff"), { r: 255, g: 255, b: 255 });
  assert.throws(() => hexToRgb("0e1620"), /Invalid hex/);
  assert.throws(() => hexToRgb("#12345"), /Invalid hex/);
});

test("rgbToHex round-trips and lowercases", () => {
  assert.equal(rgbToHex(hexToRgb("#4AA7B3")), "#4aa7b3");
});

test("OKLab round-trips within one 8 bit step", () => {
  for (const hex of ["#0e1620", "#c6d4e0", "#4aa7b3", "#f0e6c4", "#150a0c"]) {
    const back = rgbToHex(oklabToSrgb(srgbToOklab(hexToRgb(hex))));
    const a = hexToRgb(hex), b = hexToRgb(back);
    for (const k of ["r","g","b"]) assert.ok(Math.abs(a[k] - b[k]) <= 1, `${hex} ${k}`);
  }
});

test("OKLab lightness anchors", () => {
  assert.ok(Math.abs(srgbToOklab({r:255,g:255,b:255}).L - 1) < 0.001);
  assert.ok(Math.abs(srgbToOklab({r:0,g:0,b:0}).L) < 0.001);
});

test("contrastRatio matches WCAG", () => {
  assert.equal(contrastRatio("#ffffff", "#000000"), 21);
  assert.ok(Math.abs(contrastRatio("#7b8b9c", "#dbe3ea") - 2.7) < 0.05);
});

test("mixOklab lands midway in OKLab lightness, not sRGB", () => {
  const mid = mixOklab("#000000", "#ffffff", 0.5);
  assert.ok(Math.abs(srgbToOklab(hexToRgb(mid)).L - 0.5) < 0.02, mid);
});

test("mixOklab returns the endpoints exactly", () => {
  assert.equal(mixOklab("#123456", "#abcdef", 0), "#123456");
  assert.equal(mixOklab("#123456", "#abcdef", 1), "#abcdef");
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node --test test/color.test.mjs`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `src/color.mjs`**

Straightforward except the OKLab matrices, which are not guessable. Use these, with the standard sRGB transfer function (`c <= 0.04045 ? c/12.92 : ((c+0.055)/1.055)^2.4`, inverse `c <= 0.0031308 ? 12.92*c : 1.055*c^(1/2.4) - 0.055`) applied to channels already divided by 255.

```js
// linear sRGB -> LMS
const l = 0.4122214708*r + 0.5363325363*g + 0.0514459929*b;
const m = 0.2119034982*r + 0.6806995451*g + 0.1073969566*b;
const s = 0.0883024619*r + 0.2817188376*g + 0.6299787005*b;
// cube roots, then
L = 0.2104542553*l_ + 0.7936177850*m_ - 0.0040720468*s_;
a = 1.9779984951*l_ - 2.4285922050*m_ + 0.4505937099*s_;
b = 0.0259040371*l_ + 0.7827717662*m_ - 0.8086757660*s_;
// inverse
l_ = L + 0.3963377774*a + 0.2158037573*b;
m_ = L - 0.1055613458*a - 0.0638541728*b;
s_ = L - 0.0894841775*a - 1.2914855480*b;
r = +4.0767416621*l_ - 3.3077115913*m_ + 0.2309699292*s_;
g = -1.2684380046*l_ + 2.6097574011*m_ - 0.3413193965*s_;
b = -0.0041960863*l_ - 0.7034186147*m_ + 1.7076147010*s_;
```

`hexToRgb` accepts only 3- or 6-digit hex — this is our own parser for interpolation, so it is deliberately stricter than the contract regex. `mixOklab` interpolates L, a and b linearly, converts back, and clamps to `0..255` before rounding. `relativeLuminance` uses the linear channels with `0.2126/0.7152/0.0722`. `contrastRatio` returns `(hi + 0.05) / (lo + 0.05)` with the lighter first.

- [ ] **Step 4: Run it and confirm it passes**

Run: `node --test test/color.test.mjs`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/color.mjs test/color.test.mjs
git commit -m "feat: OKLab colour maths and WCAG contrast"
```

---

### Task 3: Ramp expansion

**Files:**
- Create: `src/ramp.mjs`
- Test: `test/ramp.test.mjs`

**Interfaces:**
- Consumes: `mixOklab`, `srgbToOklab`, `hexToRgb` from `src/color.mjs`.
- Produces: `expandRamp(anchors) -> Record<step, hex>` where `anchors` is `{100,300,500,700,900}` and the result has all nine steps as string keys.

- [ ] **Step 1: Write the failing test**

`test/ramp.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { expandRamp } from "../src/ramp.mjs";
import { srgbToOklab, hexToRgb, contrastRatio } from "../src/color.mjs";

const CYAN_DARK = { 100:"#cbf0f2", 300:"#6fc4cd", 500:"#358892", 700:"#1c4c53", 900:"#0a1d20" };
const STEPS = ["100","200","300","400","500","600","700","800","900"];
const L = (hex) => srgbToOklab(hexToRgb(hex)).L;
const C = (hex) => { const {a,b} = srgbToOklab(hexToRgb(hex)); return Math.hypot(a,b); };

test("every step is present and endpoints are exact", () => {
  const ramp = expandRamp(CYAN_DARK);
  assert.deepEqual(Object.keys(ramp).sort(), [...STEPS].sort());
  for (const s of [100,300,500,700,900]) assert.equal(ramp[s], CYAN_DARK[s]);
});

test("lightness is monotonic along the ramp", () => {
  const ramp = expandRamp(CYAN_DARK);
  const ls = STEPS.map((s) => L(ramp[s]));
  for (let i = 1; i < ls.length; i++) assert.ok(ls[i] < ls[i-1],
    `step ${STEPS[i]} is lighter than ${STEPS[i-1]}: ${ls[i-1]} -> ${ls[i]}`);
});

test("mid steps keep their chroma instead of going grey", () => {
  const ramp = expandRamp(CYAN_DARK);
  for (const [mid, lo, hi] of [[200,100,300],[400,300,500],[600,500,700],[800,700,900]]) {
    const floor = Math.min(C(ramp[lo]), C(ramp[hi])) * 0.8;
    assert.ok(C(ramp[mid]) >= floor, `step ${mid} chroma ${C(ramp[mid])} < floor ${floor}`);
  }
});

test("no step duplicates another", () => {
  const ramp = expandRamp(CYAN_DARK);
  const used = new Set(STEPS.map((s) => ramp[s]));
  assert.equal(used.size, 9);
});

test("a light-mode ramp expanding towards lighter steps works the same way", () => {
  const lightGray = { 100:"#202c38", 300:"#4a5a6b", 500:"#7b8b9c", 700:"#b3c0cc", 900:"#dbe3ea" };
  const ramp = expandRamp(lightGray);
  const ls = STEPS.map((s) => L(ramp[s]));
  for (let i = 1; i < ls.length; i++) assert.ok(ls[i] > ls[i-1]);
  assert.ok(contrastRatio(ramp["900"], ramp["100"]) > contrastRatio(ramp["900"], ramp["700"]));
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node --test test/ramp.test.mjs`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `expandRamp`**

For each of the four gaps (100–300, 300–500, 500–700, 700–900) the middle step is `mixOklab(lower, upper, 0.5)`. No `direction` parameter: the anchor order already encodes the mode's direction, so light ramps are simply anchors that increase in lightness. Copy the five anchors through untouched, never recompute them.

- [ ] **Step 4: Run it and confirm it passes**

Run: `node --test test/ramp.test.mjs`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/ramp.mjs test/ramp.test.mjs
git commit -m "feat: expand five palette anchors into nine ramp steps"
```

---

### Task 4: Theme assembly

**Files:**
- Create: `src/theme.mjs`
- Test: `test/theme.test.mjs`

**Interfaces:**
- Consumes: `expandRamp` from `src/ramp.mjs`; `HUES`, `tokenPaths` from `src/contract.mjs`.
- Produces: `buildTheme(spec) -> object` — a complete theme file object, and `DIALOG_DEFAULT` (the `@dialog` value).

The spec shape, which Tasks 5 and 7 depend on:

```js
{
  name: "fjord",
  categorical: ["accent", "cyan", "blue", "purple"],
  base: { text: {...}, background: {...}, border: {...}, scrollbar: {...},
          diff: {...}, syntax: {...}, markdown: {...} },
  modes: {
    dark:  { hue: { gray: {100,300,500,700,900}, ... }, tokens: { /* optional overrides */ } },
    light: { hue: { ... }, tokens: { /* optional overrides */ } }
  }
}
```

- [ ] **Step 1: Write the failing test**

`test/theme.test.mjs`. Build a minimal two-hue fixture inline rather than importing fjord, so this test does not depend on Task 5.

```js
test("the built theme defines every path in the contract", () => { ... });
// assert every tokenPaths() entry resolves to a non-undefined leaf, for both modes

test("both modes define all 11 hues at all 9 steps", () => { ... });
// for each of HUES, each of 100..900 is a string

test("a missing hue is reported by name", () => {
  const spec = fixture();
  delete spec.modes.dark.hue.neutral;
  assert.throws(() => buildTheme(spec), /neutral/);
});

test("token references survive assembly untouched", () => { ... });
// base.syntax.keyword === "$hue.cyan.300" in the output

test("mode token overrides win over base", () => { ... });

test("categorical lands in base", () => { ... });

test("the @dialog default is present", () => { ... });
// deepEqual(output.base["@dialog"], DIALOG_DEFAULT)
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node --test test/theme.test.mjs`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `buildTheme(spec)`**

Deep-clone `base`, deep-merge each mode's `tokens` over the clone, expand that mode's `hue` anchors through `expandRamp`, throw `Missing hue "<name>" in <mode>` when any of `HUES` is absent, and set `base.categorical` from `spec.categorical`. A hue whose value is a **string** is an alias for another hue (`"$hue.cyan.400"`, `"$hue.blue"`) — pass it through untouched and never hand it to `expandRamp`, which only accepts the five-anchor object. Add `$schema: "https://opencode.ai/theme.json"` as a cosmetic key. Return `{ $schema, base, light, dark }` with `hue` as the first key of each mode so the files read sensibly. `DIALOG_DEFAULT` is the default from `docs/reference/opencode-theme-contract.md` — write it once and export it rather than inlining it in both modes.

- [ ] **Step 4: Run it and confirm it passes**

Run: `node --test test/theme.test.mjs`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/theme.mjs test/theme.test.mjs
git commit -m "feat: assemble a theme file from a palette spec"
```

---

### Task 5: The fjord palette

**Files:**
- Create: `src/palettes/fjord.mjs`
- Test: `test/fjord.test.mjs`

**Interfaces:**
- Consumes: the spec shape from Task 4.
- Produces: `fjord` (the default export), consumed by Task 7's build.

Every anchor value is copied verbatim from the approved tables in the design spec, with the single exception of light-mode `text.muted`, which the approved value fails the contrast floor and must be darkened.

- [ ] **Step 1: Write the failing test**

`test/fjord.test.mjs`:

```js
import fjord from "../src/palettes/fjord.mjs";
import { buildTheme } from "../src/theme.mjs";
import { hexToRgb, srgbToOklab } from "../src/color.mjs";

const L = (hex) => srgbToOklab(hexToRgb(hex)).L;
const theme = () => buildTheme(fjord);

test("dark runs light to dark, light runs dark to light", () => {
  const t = theme();
  assert.ok(L(t.dark.hue.gray["100"]) > L(t.dark.hue.gray["900"]));
  assert.ok(L(t.light.hue.gray["100"]) < L(t.light.hue.gray["900"]));
});

test("every syntax hue is a distinct colour in both modes", () => {
  const t = theme();
  for (const mode of ["dark","light"]) {
    const keys = Object.keys(t.base.syntax);
    const seen = new Map();
    for (const k of keys) {
      const v = resolve(t, mode, t.base.syntax[k]);
      assert.ok(!seen.has(v), `${k} and ${seen.get(v)} are both ${v} in ${mode}`);
      seen.set(v, k);
    }
  }
});

test("fjord aliases its signature hue and shares the common aliases", () => {
  const t = theme();
  assert.equal(t.dark.hue.accent, "$hue.cyan.400");
  assert.equal(t.light.hue.accent, "$hue.cyan.300");
  assert.equal(t.dark.hue.interactive, "$hue.blue");
  assert.equal(t.dark.hue.neutral, "$hue.gray");
});

test("approved anchor values are preserved exactly", () => {
  const t = theme();
  assert.equal(t.dark.hue.cyan["300"], "#6fc4cd");
  assert.equal(t.dark.hue.cyan["900"], "#0a1d20");
  assert.equal(t.light.hue.gray["900"], "#dbe3ea");
  assert.equal(t.base.background.base, "#0e1620");
});

test("light mode overrides text.muted to clear the contrast floor", () => {
  const t = theme();
  assert.notEqual(t.light.text.muted, t.dark.text.muted);
});

test("nothing in the palette is vivid, and the neutrals lean cold", () => {
  const t = theme();
  // Reference chroma, for scale: amber #ff8800 is 0.181, pure red #ff0000 is 0.258.
  const CEILING = 0.12;
  const lab = (hex) => srgbToOklab(hexToRgb(hex));
  for (const mode of ["dark", "light"]) {
    for (const [hue, steps] of Object.entries(t[mode].hue)) {
      for (const [step, hex] of Object.entries(steps)) {
        const { a, b } = lab(hex);
        const chroma = Math.hypot(a, b);
        assert.ok(chroma < CEILING, `${mode} ${hue}.${step} ${hex} chroma ${chroma.toFixed(3)} >= ${CEILING}`);
      }
    }
    // The greys dominate the screen, so they are what makes the theme read cold.
    // Negative a and b is the blue-violet direction; a warm grey would show b > 0.
    for (const [step, hex] of Object.entries(t[mode].hue.gray)) {
      const { a, b } = lab(hex);
      assert.ok(a < 0 && b < 0, `${mode} gray.${step} ${hex} leans warm (a ${a.toFixed(4)}, b ${b.toFixed(4)})`);
    }
  }
});
```

`resolve` is a local test helper: given `$hue.<name>.<step>` return that mode's hue step, given `$hue.<name>` return the whole hue (unused for syntax), given `$<token.path>` walk the merged base-plus-mode tree.

- [ ] **Step 2: Run it and confirm it fails**

Run: `node --test test/fjord.test.mjs`
Expected: FAIL — cannot find module `../src/palettes/fjord.mjs`.

- [ ] **Step 3: Write `src/palettes/fjord.mjs`**

Copy the four approved anchor tables for `fjord` and the two approved tables for `fjord` light, plus these binding rules:

- `base` surfaces (dark values, since surfaces are literal): background `#0e1620`, raised `#16202c`/`#1c2934`/`#243341`, border `#24333f`, scrollbar `#24333f`, text `#c6d4e0`, muted `#7d90a3`. Light mode overrides all of these with its own approved values, and must darken `text.muted` past the 3:1 floor — `#5d6f80` is the starting suggestion, adjusted until Task 6 passes.
- `hue.gray` is the neutral hue; `hue.neutral` aliases `$hue.gray`; `hue.interactive` aliases `$hue.blue`. The accent binding is **mode-specific**, because the approved accent lands on different steps in the two modes: dark `hue.accent` is `$hue.cyan.400` (the ramp's own fourth step interpolates to `#52a6af`, a fraction off the approved `#4aa7b3` — that is the approved "accent is a step of a base hue, never a bespoke ramp" decision showing through), light `hue.accent` is `$hue.cyan.300`, which is the approved `#22646f` exactly.
- `base.syntax`: comment `$hue.gray.500`, keyword `$hue.cyan.300`, function `$hue.blue.300`, variable `$hue.gray.100`, string `$hue.green.300`, number `$hue.yellow.300`, type `$hue.purple.300`, operator `$hue.gray.500`, punctuation `$hue.gray.400`.
- `base.markdown`: headings `$hue.cyan.300`, links `$hue.interactive.300`, inline code `$hue.green.300`, the rest from `gray`, using the same steps in both modes so `base` carries them once.
- `base.diff`: text added `$hue.green.200`, removed `$hue.red.200`, context `$hue.gray.400`, hunkHeader `$hue.gray.500`; highlights `$hue.green.300` / `$hue.red.300`; line-number text `$hue.gray.500`; the background fills are per-mode overrides (dark `#163020` / `#2a1519` / `$hue.gray.800`, light `#d6e9dd` / `#f0d6d8` / `$hue.gray.700`).
- `base.background.action.primary` uses `$hue.accent`, `secondary` uses `$hue.neutral`, `destructive` uses `$hue.red`; `base.text.feedback.*` mirrors those, with `success` on `green`, `warning` on `yellow`, `info` on `cyan`.
- `categorical`: `["accent","purple","green","blue"]` — accent first, then the hues furthest from teal.

- [ ] **Step 4: Run it and confirm it passes**

Run: `node --test test/fjord.test.mjs`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/palettes/fjord.mjs test/fjord.test.mjs
git commit -m "feat: fjord palette anchors and semantic bindings"
```

---

### Task 6: Validation

**Files:**
- Create: `src/validate.mjs`
- Test: `test/validate.test.mjs`

**Interfaces:**
- Consumes: `HUES`, `tokenPaths`, `HEX_RE`, `HUE_REF_RE`, `TOKEN_REF_RE` from `src/contract.mjs`; `contrastRatio` from `src/color.mjs`.
- Produces: `validateTheme(theme) -> { ok: boolean, errors: string[] }` and `CONTRAST_RULES` (the matrix, exported so the test can state its expectations).

- [ ] **Step 1: Write the failing test**

`test/validate.test.mjs`. Build a small valid fixture, then break one thing per test and assert the specific error.

```js
test("a valid theme produces no errors", ...);

test("a missing token is named in the error", () => {
  const t = fixture(); delete t.base.scrollbar;
  const { ok, errors } = validateTheme(t);
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("scrollbar.base")));
});

test("a bad hex value is named in the error", () => {
  const t = fixture(); t.base.border.base = "#1234567";
  assert.ok(validateTheme(t).errors.some((e) => e.includes("border.base")));
});

test("a missing hue step is reported", () => { ... }); // delete t.dark.hue.red["400"]

test("an inverted dark ramp is reported", () => {
  const t = fixture();
  t.dark.hue.gray["100"] = "#000000"; t.dark.hue.gray["900"] = "#ffffff";
  assert.ok(validateTheme(t).errors.some((e) => /direction/.test(e)));
});

test("light-mode muted text below 3:1 is reported", () => {
  const t = fixture();
  t.light.text.muted = t.light.background.base;
  const { errors } = validateTheme(t);
  assert.ok(errors.some((e) => e.includes("text.muted") && e.includes("light")));
});

test("a syntax hue below 3:1 on the base background is reported", () => { ... });
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node --test test/validate.test.mjs`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Implement `validateTheme`**

Checks, in this order, each pushing a message naming the offending path and mode:

1. Every `tokenPaths()` entry resolves in `base` merged with each mode's overrides, for both modes.
2. Every leaf reachable through `tokenPaths()` is `"transparent"`, a `HEX_RE` match, a `HUE_REF_RE` match, or a `TOKEN_REF_RE` match. Iterate `tokenPaths()` rather than walking the object generically: `base.categorical` is an array of hue *names* (`["accent","purple","green","blue"]`), not a colour, so a generic walk would flag `"accent"`. Validate `categorical` separately as a non-empty array whose every entry is in `HUES`.
3. Every mode defines all `HUES` at all nine steps.
4. Ramp direction: gray lightness falls from `100` to `900` in dark and rises in light. Messages contain the word `direction`.
5. The contrast matrix:

```js
export const CONTRAST_RULES = [
  { fg: "text.base",             bg: "background.base",       min: 4.5 },
  { fg: "text.base",             bg: "background.raised.max", min: 4.5 },
  { fg: "text.muted",            bg: "background.base",       min: 3 },
  { fg: "syntax.*",              bg: "background.base",       min: 3 },
  { fg: "diff.text.added",       bg: "diff.background.added", min: 3 },
  { fg: "diff.text.removed",     bg: "diff.background.removed", min: 3 },
  { fg: "diff.text.context",     bg: "background.base",       min: 3 },
];
```

Each rule is evaluated per mode, resolving `$hue.*` and `$token.*` references against that mode's merged tree before measuring. Errors read `[light] text.muted on background.base is 2.70:1, needs 3:1`.

- [ ] **Step 4: Run it and confirm it passes**

Run: `node --test test/validate.test.mjs`
Expected: PASS, 7 tests.

- [ ] **Step 5: Run the whole suite**

Run: `node --test`
Expected: PASS, all files.

- [ ] **Step 6: Commit**

```bash
git add src/validate.mjs test/validate.test.mjs
git commit -m "feat: validate theme completeness, ramp direction, and contrast"
```

---

### Task 7: Build, install, and look at it

**Files:**
- Create: `src/build.mjs`
- Test: `test/build.test.mjs`
- Create: `test/fixtures/broken.mjs` (a palette spec missing `hue.neutral` in its dark mode, used by the third test)
- Creates: `dist/fjord.json` (gitignored, regenerable)

**Interfaces:**
- Consumes: every module above, plus every default export in `src/palettes/`.
- Produces: `buildAll({ palettesDir, outDir, install }) -> { built: string[], errors: string[] }`, and `dist/<name>.json` per palette. `main()` wraps `buildAll` with the defaults `src/palettes`, `dist`, `install: false`, and exits 1 on any error.

- [ ] **Step 1: Write the failing test**

`test/build.test.mjs`. Drive `src/build.mjs` as a subprocess so the exit codes are real.

```js
test("build writes a valid dist/fjord.json", () => { ... });
// spawnSync node src/build.mjs; status 0; JSON.parse(dist/fjord.json) has base, light, dark

test("the written file passes validation", () => { ... });
// import validateTheme, assert ok === true

test("build reports a broken palette instead of writing it", () => { ... });
// buildAll({ palettesDir: "test/fixtures/broken", outDir: tmp }) where the fixture is
// missing hue.neutral; assert errors names "neutral" and nothing was written for it
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `node --test test/build.test.mjs`
Expected: FAIL — cannot find `src/build.mjs`.

- [ ] **Step 3: Implement `src/build.mjs`**

Import every `src/palettes/*.mjs` default export, build each with `buildTheme`, run `validateTheme`, and collect errors rather than throwing. `buildAll({ palettesDir, outDir, install })` returns `{ built, errors }` and writes only the themes that validated. `main()` prints any errors to stderr, exits 1 if there were any, and otherwise prints a one-line summary per theme including the worst contrast ratio found. With `--install`, also copy each file to `~/.config/opencode/themes/<name>.json`, creating the directory if needed. Export `buildAll` so the test can point it at a fixture directory.

- [ ] **Step 4: Run it and confirm it passes**

Run: `node --test test/build.test.mjs`
Expected: PASS, 3 tests.

- [ ] **Step 5: Build and install**

```bash
node src/build.mjs --install
ls -l ~/.config/opencode/themes/fjord.json
```

Expected: a validation summary, no errors, and the file present. If validation refuses the build, fix the anchors or the light-mode overrides until it passes — do not relax a floor to get a green run.

- [ ] **Step 6: Look at it in the real terminal**

Restart OpenCode, run `/themes`, select `fjord`. Then open a real file with real code and a real diff. Check: comments are readable not whispery, keywords and strings tell apart at a glance, the diff's added and removed lines are distinguishable, and the theme switches to light mode when the terminal's appearance flips. This step is the whole point of building fjord first, so record what looks wrong rather than passing it.

- [ ] **Step 7: Commit**

```bash
git add src/build.mjs test/build.test.mjs
git commit -m "feat: build and install theme files from palette specs"
```

---

## After this plan

The remaining three themes — `ravn`, `nordlys`, `skumring` — are a follow-on plan, not this one. They reuse every module here and need only new anchor data in `src/palettes/`, plus the light-mode palettes that the design deliberately leaves undecided until the author has seen all four in daylight. Nothing in the other three should require changing `src/color.mjs`, `src/ramp.mjs`, `src/theme.mjs`, `src/validate.mjs` or `src/build.mjs`; if it does, that is a signal the abstraction is wrong and worth fixing before adding themes four through eight.
