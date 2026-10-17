# Nordic theme pack for OpenCode TUI — design

Date: 2026-10-15
Status: awaiting approval

## What we're making

Four colour themes for the OpenCode TUI, plus the light-mode palettes for
each. They are sold and lived in as a set — a pack — even though each one
is its own file that works alone.

- **fjord** — daylight on cold water. Teal-blue. The flagship; the one
  the author is expected to actually work in.
- **ravn** — the raven. Ink-black with a violet sheen, like feather
  iridescence. Darkest, most mythic.
- **nordlys** — the aurora. Night blue with green light. Most saturated.
- **skumring** — dusk. Near-monochrome grey-violet, almost no chroma.
  Quietest and coldest.

## Why these four, as one pack

They are one day in one cold place. fjord is daylight on the water,
skumring is dusk with the colour draining out, ravn is the dark hours
reduced to ink and sheen, nordlys is deep night with the sky lit up. The
narrative is what makes four files read as a deliberate family instead of
four unrelated experiments, and it gives every future decision an obvious
test: does this colour belong in that world.

The author is Danish and asked for vikings plus cold colours. The names
are Danish words, chosen deliberately for that ear.

## Goals

- Four theme files that each work standalone, and that visibly belong
  together when seen side by side.
- Cold blue-leaning palettes that stay cold without becoming colourless
  grey mush.
- Readable. Syntax highlighting must stay tellable apart.
- Both light and dark in every file.

## Non-goals

- Publishing scaffolding. No README, no licence, no repo layout, no
  installer. If it later becomes something other people install, that is
  a separate job. Theme names are distinctive enough to survive it.
- Changing the author's `cli.json` as part of this. They currently run
  `catppuccin-macchiato` with no mode locked (so the terminal decides).
  Switching to a new theme is their move, at the end.
- Theming the OpenCode plugins or anything outside the theme files.
- Text/code font choices. Out of scope.

## Anti-goals

Things that would make this a failure even if every file loads.

- Washed-out grey soup: a palette where every hue sits at the same
  lightness and saturation, so code becomes an even grey wall.
- Warmth leaking in. Bright saturated reds, oranges or yellows would
  break the whole spell instantly.
- Four themes that collapse into each other in light mode. This is the
  real risk of a uniform daylight character, and it is why each theme
  keeps a signature accent (see below).
- Text that technically passes but is miserable to read for an hour.
- Themes that only look right in the browser mockups and feel muddy in
  the actual terminal.

## Constraints, from how OpenCode actually works

Verified against the V2 docs at <https://opencode.ai/v2/docs/cli/theme>.

- A theme is one JSON file. **The filename is the theme name.** They load
  from `~/.config/opencode/themes/`, or a project's `.opencode/themes/`,
  and a project theme overrides a global one of the same name.
- Each file has a `base` token tree shared by both modes, plus a `light`
  and a `dark` section. Modes inherit from the file's own `base` — never
  from the built-in OpenCode theme and never from each other.
- **Every mode must define all eight base hues** — `gray`, `red`,
  `orange`, `yellow`, `green`, `cyan`, `blue`, `purple` — at nine steps
  each, plus the three aliases `accent`, `interactive`, `neutral`. Warm
  hues cannot be omitted even though the palette is cold.
- **Step direction flips between modes.** In a dark theme `100` is the
  lightest step and `900` the darkest. In a light theme `100` is the
  darkest and `900` the lightest. A light palette is therefore a second
  palette built the other way round, not the dark one lightened.
- Hues may alias each other (`"accent": "$hue.cyan"`), and colours may
  reference other tokens (`"$text.muted"`), which is what keeps the
  semantic layer small.
- `base.categorical` is the ordered hue list used to distinguish agents
  and other repeated items.
- Semantic groups: `text`, `background`, `border`, `scrollbar`, `diff`,
  `syntax`, `markdown`. Syntax keys are `comment`, `keyword`, `function`,
  `variable`, `string`, `number`, `type`, `operator`, `punctuation`.
- Actions and form fields take a `base` plus optional `$hovered`,
  `$focused`, `$pressed`, `$selected`, `$disabled` states.
- Dialog surfaces may override tokens under `@dialog`.
- OpenCode reads `.json` only. The theme is picked in `cli.json` under
  `theme.name`, or live with `/themes`. A restart is needed after adding a
  file.
- There is an official generator at <https://opencode.ai/theme/> that
  emits a complete file — useful as a completeness reference.

Two findings worth recording about validation.

**The documented `$schema` URLs are dead right now.**
`https://opencode.ai/theme.json` returns 404, and so does
`https://opencode.ai/v2/theme.json`. So `$schema` in the file is cosmetic
and there is nothing to validate against over the network.

**But the real contract is embedded in the binary.** The installed
`opencode` executable contains the theme token tree and its constraints as
plain strings. Verified by fixed-string search:

```sh
B=~/.opencode/bin/opencode
grep -a -c -F 'listEnumeration' "$B"   # 2
grep -a -c -F 'horizontalRule'  "$B"   # 2
grep -a -c -F 'categorical'     "$B"   # 8
```

So the builder can check completeness against the shipped binary rather
than guessing at docs.

> [!warning] Use fixed-string search, not regex
> The binary is ~186 MB. A `grep -a -E` with bounded-context regexes
> against it does not finish in two minutes. `grep -a -F` scans it in
> about a second.

## Decided with the author

- All four names and all four dark directions were shown as mockups and
  approved. Nothing is being cut.
- **Light mode is "overcast"** for all four themes: a cool grey-blue
  background rather than white, so the weather stays in it. Chosen over
  "paper" (nearly white, most legible, least Nordic) and "ice" (a blue
  background, coldest, closest to gimmick).
- The same daylight character across the whole pack, because that is what
  makes four files read as one family.
- The project lives in `/Users/mojoaar/Development/opencode/themes`, which
  is the authoring workspace. Finished files are copied to
  `~/.config/opencode/themes/` at the end.
- **Work order: fjord first, both modes, installed into the real terminal
  and lived in before the other three are started.** Browser mockups are
  not trusted as evidence that the greys feel right.

## The cold strategy

This is the core idea, and everything else follows from it.

Since red, orange and yellow must exist and must stay distinguishable,
coldness is achieved in two places at once:

1. The greys, blues and cyans carry the temperature. They are the
   background, the text, and the bulk of the UI.
2. The warm hues are pulled cold and desaturated — rust instead of red,
   dried blood instead of crimson, cold brass instead of yellow, heather
   violet instead of candy purple. They stay tellable apart from each
   other but never read as warm light.

This is also what real Norse colour actually looks like: iron, rust,
lichen on stone, blood on snow, faded wool dye. The constraint turns out
to be a gift rather than a compromise.

Each theme keeps a **signature accent** so the four stay distinguishable
in overcast light: fjord teal, ravn violet, nordlys aurora green,
skumring nearly none at all.

## The palettes

The approved mockups showed five representative steps per hue (100, 300,
500, 700, 900) for legibility on screen. The real files need all nine.
These anchors are the source of truth; the intermediate steps are derived
by interpolating between them in a consistent sweep, so that all four
themes share the same lightness rhythm.

**Sibling rule:** step *n* of every chromatic hue should land at roughly
the same perceived lightness across all four themes. That sameness is what
makes them feel like one family, and it is the thing to check when a
palette looks "off" without an obvious reason.

The rule applies to the hue ramps, **not** to the chrome. Each theme keeps
its own endpoint anchors, so ravn stays the darkest of the four and
skumring the greyest. Within each theme's own line, the mid steps align.

### fjord — dark (approved)

Background `#0e1620`, raised `#16202c`, border `#24333f`, text `#c6d4e0`,
muted `#7d90a3`, signature accent teal `#4aa7b3`.

| hue | 100 | 300 | 500 | 700 | 900 |
| --- | --- | --- | --- | --- | --- |
| gray | #e6ecf2 | #aebfcd | #7d90a3 | #3a4b5a | #0e1620 |
| red | #e0b6b6 | #a86c72 | #6f3c43 | #3d1f24 | #150a0c |
| orange | #e8c9b0 | #b1845f | #75502f | #422c17 | #180f06 |
| yellow | #f0e6c4 | #c3b06f | #857439 | #4b401d | #1c170a |
| green | #cbe7d8 | #78b096 | #3d755a | #224231 | #0c1e14 |
| cyan | #cbf0f2 | #6fc4cd | #358892 | #1c4c53 | #0a1d20 |
| blue | #cfe4f7 | #7fb2dc | #4278ad | #234468 | #0e1c2c |
| purple | #d5cde8 | #9183b6 | #594d7d | #2f2746 | #100d1a |

Syntax mapping: comment `gray.500`, keyword `cyan.300`, function
`blue.300`, variable `text.base`, string `green.300`, number `yellow.300`,
type `purple.300`, operator `gray.500`.

### fjord — light, overcast (approved)

Background `#dbe3ea`, raised `#cfd8e1`, border `#b6c2ce`, text `#1b2733`,
muted `#7b8b9c`, signature accent teal `#22646f`.

Ramps run dark to light in this mode.

| hue | 100 | 300 | 500 | 700 | 900 |
| --- | --- | --- | --- | --- | --- |
| gray | #202c38 | #4a5a6b | #7b8b9c | #b3c0cc | #dbe3ea |
| red | #451f27 | #77393f | #a85f63 | #d9a8ab | #f0d6d8 |
| orange | #40291a | #6f4a2c | #a2734a | #d4b193 | #eddbc9 |
| yellow | #3d3212 | #6d5b21 | #a08a3c | #d3c58f | #ece4c8 |
| green | #16362a | #2f6349 | #4f9273 | #a9cdb9 | #d6e9dd |
| cyan | #0d3540 | #22646f | #3f95a2 | #a3d0d7 | #d3e8ec |
| blue | #123047 | #2c5f80 | #4f8fb0 | #a8c9dd | #d5e5ef |
| purple | #2c2148 | #514173 | #7f6ea6 | #bfb2d6 | #e2dbef |

Syntax mapping mirrors the dark mode choices.

> [!warning] One approved value has to change
> `muted` `#7b8b9c` on the overcast background `#dbe3ea` measures about
> **2.7:1**, under the 3:1 floor, and it drops to about 2.4:1 on the raised
> surface. That same value is also the syntax `comment` and `operator`
> colour, so three tokens fail together. It gets darkened until it clears
> the floor while keeping the same cool grey character. Dark mode passes
> as drawn.

### ravn — dark (approved direction, anchors)

Background `#0a0b12`, raised `#13151f`, border `#232734`, text `#c9d1e2`,
muted `#767e92`, signature accent violet `#a596d8`.

| hue | 100 | 300 | 500 | 700 | 900 |
| --- | --- | --- | --- | --- | --- |
| gray | #e4e8f0 | #a9b2c4 | #767e92 | #343a49 | #0a0b12 |
| red | #dfb0b4 | #a2626d | #6a3642 | #381b22 | #130809 |
| orange | #e4c3a8 | #ab7c56 | #6f4a2b | #3d2614 | #150d05 |
| yellow | #ece2c2 | #bda96a | #7c6c37 | #443a1c | #19150a |
| green | #c6e3d3 | #74a98d | #3a6b53 | #1d3a2b | #0a1a13 |
| cyan | #c5e5ec | #6fb3c4 | #37707f | #1b3c45 | #08181c |
| blue | #ccd9ef | #7d9cd6 | #46618f | #22314c | #0c1220 |
| purple | #dcd4f0 | #a596d8 | #6f5da8 | #3a2f5c | #12101f |

### nordlys — dark (approved direction, anchors)

Background `#0b1020`, raised `#131a2e`, border `#243050`, text `#ccd8ee`,
muted `#7c8ab0`, signature accent aurora green `#6ee0a8`.

| hue | 100 | 300 | 500 | 700 | 900 |
| --- | --- | --- | --- | --- | --- |
| gray | #e6ebf6 | #aab6d1 | #7c8ab0 | #38425f | #0d1020 |
| red | #e6b2bb | #b06678 | #72384a | #3d1c28 | #15070c |
| orange | #ecc9a4 | #b68251 | #7a4d26 | #422810 | #160c03 |
| yellow | #f2e8c0 | #cbb168 | #8a7333 | #4b3d17 | #1b1405 |
| green | #c8f5e0 | #6ee0a8 | #2f9e70 | #175440 | #062018 |
| cyan | #c4eff5 | #63cfe0 | #2b8fa3 | #154d5c | #05171e |
| blue | #cdddf8 | #7fa8ee | #4169b3 | #22386a | #0b1020 |
| purple | #ded3f5 | #ab93e4 | #7459b3 | #3d2d68 | #100a1f |

### skumring — dark (approved direction, anchors)

Background `#111218`, raised `#191b23`, border `#2a2d38`, text `#ccd0dd`,
muted `#7e8496`, signature accent pale ice blue `#8fa8cc`. Deliberately
the lowest chroma of the four — the greys should stay grey here and the
signature accent is barely an accent.

| hue | 100 | 300 | 500 | 700 | 900 |
| --- | --- | --- | --- | --- | --- |
| gray | #e7e9f0 | #b3b8c7 | #7e8496 | #3b3f4c | #111218 |
| red | #e3c8cb | #ae8289 | #745057 | #3e292e | #171011 |
| orange | #e6d3c4 | #b3937c | #785f4b | #403227 | #171210 |
| yellow | #eae4cf | #bcb189 | #7f7556 | #443f2c | #191710 |
| green | #d8e6dc | #97b8a2 | #5c806b | #2f4436 | #111a15 |
| cyan | #d2e4e8 | #8bb4bd | #537e88 | #2a4147 | #0f181a |
| blue | #d7e0ee | #93aacb | #5c7395 | #2d3b52 | #0f131c |
| purple | #ddd8ec | #a79fc4 | #6e6690 | #393451 | #14121d |

### Light modes for ravn, nordlys, skumring

Settled: **each theme's overcast is tinted toward its own signature.** The
four light modes share fjord's construction discipline — same lightness
ladder, same contrast floors, raised band kept inside the
background/raised/border trio — but each rotates its neutral hue toward its
own character, so the four read as four cold places rather than one grey
repeated four times. fjord keeps the coldest sea blue-grey and is unchanged.

Method: keep fjord light's OKLab lightness, rotate a/b to the theme's
signature hue, scale chroma by `k`. Measured text/background ratios are fjord
11.69:1, ravn 10.98:1, nordlys 10.92:1, skumring 10.97:1, and
muted/raised.max is 3.38-3.42:1 (fjord 3.40, ravn 3.42, nordlys 3.39,
skumring 3.41), so the floors and the visual weight are identical across the
four. fjord's higher ratio follows its own approved light body text `#1b2733`
(see the table below), a touch darker than the `#202c38` its gray ramp step
100 carries; the three tinted ladders derive their text from fjord's gray
step 100 and so land near 11:1.

| | fjord (unchanged) | ravn (292deg x0.85) | nordlys (172deg x0.95) | skumring (262deg x0.45) |
|---|---|---|---|---|
| text | `#1b2733` | `#2b2936` | `#1d2f29` | `#272b31` |
| muted | `#586a7a` | `#686577` | `#556e65` | `#636871` |
| border | `#b6c2ce` | `#c0bfcc` | `#b4c5bf` | `#bdc1c7` |
| raised.max | `#c1cbd6` | `#cac8d4` | `#bfcec8` | `#c7cacf` |
| raised.high | `#c8d2dc` | `#d0cfda` | `#c6d4cf` | `#ced1d6` |
| raised.base | `#cfd8e1` | `#d7d5df` | `#cedad6` | `#d4d7dc` |
| background | `#dbe3ea` | `#e2e1e9` | `#dae5e1` | `#e0e2e6` |

The grey ramps follow the same rotation:

| gray | fjord | ravn | nordlys | skumring |
|---|---|---|---|---|
| 100 | `#202c38` | `#2b2936` | `#1d2f29` | `#272b31` |
| 300 | `#4a5a6b` | `#585668` | `#465e56` | `#545861` |
| 500 | `#7b8b9c` | `#898698` | `#778f87` | `#848992` |
| 700 | `#b3c0cc` | `#bebcca` | `#b1c3bc` | `#bbbec5` |
| 900 | `#dbe3ea` | `#e2e1e9` | `#dae5e1` | `#e0e2e6` |

The light **chromatic** ramps are not retinted: the three themes reuse
fjord's approved light ramps verbatim. The four then share one syntax
family, so code reads the same in all four, and identity is carried by the
neutrals above plus the signature accent. Only the greys and the surfaces
are tinted.

Each theme's light accent stays a step of its own hue — fjord
`$hue.cyan.300` `#22646f`, ravn `$hue.purple.300` `#514173`, nordlys
`$hue.green.300` `#2f6349`, skumring `$hue.blue.300` `#2c5f80`.

## My calls

Decisions I made rather than asking, flagged here so they can be reversed.

- **A small generator is used instead of hand-written JSON.** Per-theme
  palette anchors plus a build script that interpolates the nine steps and
  emits the JSON files. Rationale: 4 themes × 2 modes × 8 hues × 9 steps is
  576 hue values, and the moment the author says "the greys are muddy" we
  want to retune one anchor and regenerate everything consistently rather
  than hand-patch 576 hexes. The generated JSON is the deliverable; the
  script is scaffolding that can be thrown away.
- **No publishing scaffolding.** No README, licence or repo layout, per
  the non-goals.
- **`base` carries the semantic token tree**, with each mode overriding
  only what genuinely differs. Where a token is identical in both modes it
  lives in `base` and is not repeated.
- **Mode handling:** both modes are always shipped in every file. The
  author's `cli.json` keeps mode unlocked, so the terminal decides.
- **Contrast targets:** body text on base backgrounds ≥ 4.5:1, muted and
  secondary text ≥ 3:1, and every syntax hue must clear 3:1 against the
  editor background. Chosen as a floor, not a goal — the palettes are cold
  and desaturated, which is exactly where contrast quietly fails.
- **The `categorical` list** uses each theme's signature accent first,
  then hues that stay furthest apart from it.
- **File names** are the theme names: `fjord.json`, `ravn.json`,
  `nordlys.json`, `skumring.json`. Lowercase, no prefix.

And these, added after the builder check:

- **The signature accent aliases the hue; the step is chosen at the
  reference site**, rather than getting a bespoke nine-step ramp. The approved
  mockups only showed odd steps (100, 300, 500, 700, 900), which is why the
  signature hexes looked like they sat off the ramps — fjord's `#4aa7b3` is the
  `cyan.400` that never got drawn, so its accent actions bind `$hue.accent.400`
  in dark and `$hue.accent.300` in light. ravn's violet is `purple.300` and
  nordlys's aurora green is `green.300`. skumring's pale ice is the same
  accepted consequence: its approved signature is `#8fa8cc`, another hex that
  never got drawn as a ramp step, and its accent binds `$hue.accent.300`, which
  ships as `blue.300` `#93aacb` — the nearest approved step. As for fjord, the
  accent aliases the hue and the actual colour is the step chosen at the
  reference site, so no approved hue is retuned.
- **Surfaces are literal values in `base`** — background, raised, border,
  text and muted are not required to be addressable steps of a ramp. The
  gray ramps are not retuned to absorb them.
- **`interactive` aliases `blue`, not `accent`**, and the same for all
  four themes. Blue is the one hue that is cold and present in every theme,
  so links, inputs and selectors read as interactive everywhere. `accent`
  carries the theme's identity; `interactive` carries the shared affordance.
  For skumring the two deliberately coincide: its signature accent is
  `$hue.blue` as well, so its links and its primary-action labels are the
  same colour. That sameness is skumring's "barely an accent" identity, not
  an oversight — the reason to keep `interactive` on blue is the *other*
  three themes, whose accents are teal, violet and green; skumring's own
  controls are blue because its accent is blue.
- **The contrast checker runs against a matrix, not one surface**: body
  text, muted text, every syntax hue and diff text, each checked against
  `background.base`, `background.raised.max`, and the added/removed diff
  fills. Diff fills are where a low-chroma cold palette collapses first.

## Order of work

1. fjord, dark and light, complete and generated.
2. Validate the shape, run the contrast check, show the final palette.
3. Install it to `~/.config/opencode/themes/` and use it in the real
   terminal for a while.
4. Then the light modes for ravn, nordlys and skumring, settled as drawn in
   "Light modes for ravn, nordlys, skumring" above, and the three remaining
   themes built from fjord's palette module as their template.
5. Step back and compare all four side by side in both modes, as the
   family test.

## How we'll know it worked

- fjord survives an hour of real use. That is the primary evidence, and
  the reason it goes first.
- All four files load, appear in `/themes`, and switch modes without
  falling back.
- All four are recognisably the same cold world, and still tellable apart
  at a glance in overcast light.
- Syntax highlighting is distinguishable hue by hue — a code line should
  not read as a single grey mass.
- No warm glow anywhere. If a red looks like a warning light or an orange
  looks like a sunset, the palette has failed.

## Left to the builder

- The exact interpolation sweep for the four intermediate steps per hue.
- The full semantic token tree: every `text`, `background`, `border`,
  `scrollbar`, `diff`, `syntax` and `markdown` token, plus interaction
  states for actions and form fields, and the `@dialog` overrides.
  Completeness should be checked against the token tree embedded in the
  installed binary, cross-checked with the docs page and the official
  generator, then confirmed by loading the theme for real.
- The language and shape of the generator script.
- Which surface colours go in `base` versus per-mode.
- Diff colours: the approved mockups show added and removed lines but the
  exact tokens for added/removed/context/line-number still need settling.
- The `categorical` ordering beyond the accent-first rule.
