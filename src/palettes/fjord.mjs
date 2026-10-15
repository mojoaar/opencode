// fjord — daylight on cold water. The pack's flagship.
//
// This is the only hand-authored colour content in the project: every hex below
// is either copied verbatim from the approved anchor tables in
// docs/superpowers/specs/2026-10-15-opencode-nordic-theme-pack-design.md, or a
// binding onto one of those ramps. Nothing is hand-tuned here; to change a
// colour, change an anchor and rebuild.
//
// Anchors are the five approved steps (100, 300, 500, 700, 900); buildTheme
// expands the other four. Surfaces are literal values, not ramp steps — the
// contract does not require them to be addressable.

/** The five interaction states every stateful group carries. */
const allStates = (value) => ({
  base: value,
  $hovered: value,
  $focused: value,
  $pressed: value,
  $selected: value,
  $disabled: value,
});

export default {
  name: "fjord",
  // The signature accent first, then the hues furthest from teal.
  categorical: ["accent", "purple", "green", "blue"],

  base: {
    text: {
      base: "#c6d4e0",
      muted: "#7d90a3",
      action: {
        primary: allStates("$hue.accent"),
        secondary: allStates("$hue.neutral"),
        destructive: allStates("$hue.red"),
      },
      formfield: allStates("$text.base"),
      feedback: {
        error: { base: "$hue.red.200", muted: "$hue.red.300" },
        warning: { base: "$hue.yellow.200", muted: "$hue.yellow.300" },
        success: { base: "$hue.green.200", muted: "$hue.green.300" },
        info: { base: "$hue.cyan.200", muted: "$hue.cyan.300" },
      },
    },
    background: {
      base: "#0e1620",
      raised: { base: "#16202c", high: "#1c2934", max: "#243341" },
      action: {
        primary: allStates("$hue.accent"),
        secondary: allStates("$hue.neutral"),
        destructive: allStates("$hue.red"),
      },
      formfield: allStates("$background.raised.base"),
      feedback: {
        error: { base: "$hue.red.700" },
        warning: { base: "$hue.yellow.700" },
        success: { base: "$hue.green.700" },
        info: { base: "$hue.cyan.700" },
      },
    },
    border: { base: "#24333f" },
    scrollbar: { base: "#24333f" },
    diff: {
      text: {
        added: "$hue.green.200",
        removed: "$hue.red.200",
        context: "$hue.gray.400",
        hunkHeader: "$hue.gray.500",
      },
      background: {
        added: "#163020",
        removed: "#2a1519",
        context: "$hue.gray.800",
      },
      highlight: { added: "$hue.green.300", removed: "$hue.red.300" },
      // The brief fixes no values for the gutter fills, so they reference the
      // approved line fills rather than inventing hexes. Defined once here:
      // each mode's own diff.background values flow through.
      lineNumber: {
        text: "$hue.gray.500",
        background: { added: "$diff.background.added", removed: "$diff.background.removed" },
      },
    },
    // The three grey tokens cannot all sit on the approved gray.500: the ramp
    // anchor #7b8b9c is the approved light-mode muted grey, which measures
    // 2.69:1 on the light background (under the 3:1 floor), and `base` carries
    // one step for both modes. So comment and operator move off it. `comment`
    // takes `$text.muted`, which is #7d90a3 in dark — byte-identical to the
    // approved comment grey — and the approved corrected #586a7a in light.
    // operator and punctuation then take the two steps below it so all nine
    // syntax tokens stay distinct in both modes.
    syntax: {
      comment: "$text.muted",
      keyword: "$hue.cyan.300",
      function: "$hue.blue.300",
      variable: "$hue.gray.100",
      string: "$hue.green.300",
      number: "$hue.yellow.300",
      type: "$hue.purple.300",
      operator: "$hue.gray.400",
      punctuation: "$hue.gray.300",
    },
    markdown: {
      text: "$hue.gray.100",
      heading: "$hue.cyan.300",
      link: "$hue.interactive.300",
      linkText: "$hue.interactive.200",
      code: "$hue.green.300",
      blockQuote: "$hue.gray.400",
      emphasis: "$hue.gray.100",
      strong: "$hue.gray.100",
      horizontalRule: "$hue.gray.500",
      listItem: "$hue.gray.200",
      listEnumeration: "$hue.gray.300",
      image: "$hue.interactive.300",
      imageText: "$hue.gray.200",
      codeBlock: "$hue.gray.100",
    },
  },

  modes: {
    dark: {
      hue: {
        gray: { 100: "#e6ecf2", 300: "#aebfcd", 500: "#7d90a3", 700: "#3a4b5a", 900: "#0e1620" },
        red: { 100: "#e0b6b6", 300: "#a86c72", 500: "#6f3c43", 700: "#3d1f24", 900: "#150a0c" },
        orange: { 100: "#e8c9b0", 300: "#b1845f", 500: "#75502f", 700: "#422c17", 900: "#180f06" },
        yellow: { 100: "#f0e6c4", 300: "#c3b06f", 500: "#857439", 700: "#4b401d", 900: "#1c170a" },
        green: { 100: "#cbe7d8", 300: "#78b096", 500: "#3d755a", 700: "#224231", 900: "#0c1e14" },
        cyan: { 100: "#cbf0f2", 300: "#6fc4cd", 500: "#358892", 700: "#1c4c53", 900: "#0a1d20" },
        blue: { 100: "#cfe4f7", 300: "#7fb2dc", 500: "#4278ad", 700: "#234468", 900: "#0e1c2c" },
        purple: { 100: "#d5cde8", 300: "#9183b6", 500: "#594d7d", 700: "#2f2746", 900: "#100d1a" },
        accent: "$hue.cyan.400",
        interactive: "$hue.blue",
        neutral: "$hue.gray",
      },
    },

    light: {
      hue: {
        gray: { 100: "#202c38", 300: "#4a5a6b", 500: "#7b8b9c", 700: "#b3c0cc", 900: "#dbe3ea" },
        red: { 100: "#451f27", 300: "#77393f", 500: "#a85f63", 700: "#d9a8ab", 900: "#f0d6d8" },
        orange: { 100: "#40291a", 300: "#6f4a2c", 500: "#a2734a", 700: "#d4b193", 900: "#eddbc9" },
        yellow: { 100: "#3d3212", 300: "#6d5b21", 500: "#a08a3c", 700: "#d3c58f", 900: "#ece4c8" },
        green: { 100: "#16362a", 300: "#2f6349", 500: "#4f9273", 700: "#a9cdb9", 900: "#d6e9dd" },
        cyan: { 100: "#0d3540", 300: "#22646f", 500: "#3f95a2", 700: "#a3d0d7", 900: "#d3e8ec" },
        blue: { 100: "#123047", 300: "#2c5f80", 500: "#4f8fb0", 700: "#a8c9dd", 900: "#d5e5ef" },
        purple: { 100: "#2c2148", 300: "#514173", 500: "#7f6ea6", 700: "#bfb2d6", 900: "#e2dbef" },
        accent: "$hue.cyan.300",
        interactive: "$hue.blue",
        neutral: "$hue.gray",
      },
      tokens: {
        text: { base: "#1b2733", muted: "#586a7a" },
        background: {
          base: "#dbe3ea",
          raised: { base: "#cfd8e1", high: "#c6d0da", max: "#b6c2ce" },
        },
        border: { base: "#b6c2ce" },
        scrollbar: { base: "#b6c2ce" },
        diff: {
          background: { added: "#d6e9dd", removed: "#f0d6d8", context: "$hue.gray.700" },
        },
      },
    },
  },
};
