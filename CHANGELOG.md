# Changelog

All notable changes to this pack. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the version follows [SemVer](https://semver.org) read as a design-token API: a colour retune
is a **patch**, because consumers bind to token names rather than to exact hex.

## [1.0.0] — 2026-10-17

First release. Four themes, each with a dark mode and a light one.

### Added

- **fjord** — cold sea blue-grey with a teal accent; the flagship.
- **ravn** — ink black with a violet sheen; the darkest.
- **nordlys** — night blue with aurora green; the most saturated.
- **skumring** — grey-violet, barely any colour; the quietest.
- A light mode for every theme: **overcast**, a cool tinted sky rather than a white page, tinted
  per theme so the four stay recognisably different days.
- Eleven nine-step ramps per theme (`gray`, `red`, `orange`, `yellow`, `green`, `cyan`, `blue`,
  `purple`, plus the `accent`, `interactive` and `neutral` aliases), with the four steps between
  each pair of anchors interpolated in OKLab so a ramp keeps its hue.
- The same colours exported as CSS custom properties and JSON (`themes/dist/tokens/`), for use
  outside OpenCode.

### Changed

- Every light mode's inline code is teal and headings are violet, so code, links and headings
  stay tellable apart.
- Light-mode diff context fills sit one ramp step lighter, which lifts the muted text and syntax
  operators drawn on them above the 3:1 floor.

### Fixed

- The picker row is readable: an action's hover and focus backgrounds are neutral surfaces, and
  the focused row's text inverts to the background colour, so no theme paints light text on a
  light accent fill.
- Theme files load at all: hue aliases are whole-hue (`"$hue.cyan"`) with the step chosen at each
  reference site, and no colour position carries a bare hue reference.
