import test from "node:test";
import assert from "node:assert/strict";
import fjord from "../src/palettes/fjord.mjs";
import { buildTheme } from "../src/theme.mjs";
import { hexToRgb, srgbToOklab } from "../src/color.mjs";

const L = (hex) => srgbToOklab(hexToRgb(hex)).L;
const theme = () => buildTheme(fjord);

/** Walk a dotted token path the way the theme loader would. */
function at(tree, path) {
  return path.split(".").reduce((node, key) => (node == null ? undefined : node[key]), tree);
}

/**
 * Resolve a theme value the way OpenCode does: `$hue.<name>.<step>` is that
 * mode's step, `$hue.<name>` is that mode's whole hue, `$<token.path>` walks
 * the mode's merged tree.
 */
function resolve(t, mode, ref) {
  if (ref.startsWith("$hue.")) {
    const [name, step] = ref.slice("$hue.".length).split(".");
    return step === undefined ? t[mode].hue[name] : t[mode].hue[name][step];
  }
  return at(t[mode], ref.slice(1));
}

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
      // accent/interactive/neutral are alias strings, not ramps; each points at
      // a base hue already walked here, so there is nothing new to measure.
      if (typeof steps === "string") continue;
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
