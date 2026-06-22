# Logo handling (avoid brittle per-run guessing)

The image model will happily keep another company's logo and just swap the wordmark text — which we
must never ship (see the Logo rule). The robust approach is: **prefer logo-free templates**, and for
the few that contain a logo, blank it in the prompt and composite the **real client logo** with
`scripts/overlay_logo.js` at known coordinates.

## Default behaviour

- **~80% of the library is logo-free** — favour those, especially for unattended routine runs. The
  whole point is the *format*, not the in-ad logo; a logo-free template carries zero logo risk.
- If a chosen template **does** contain a logo (check when you view it during selection):
  1. In the carbon-copy prompt, instruct: "the logo area must be left COMPLETELY EMPTY — no logo,
     swirl, symbol, icon or mark; clean background only."
  2. After the edit, composite the client logo with `overlay_logo.js` using the coords below (or a
     sensible default), then **verify by viewing** the result and nudge the coords if it's off.
- If **no client logo** was supplied, leave the area clean — never fabricate one.

## Known logo-bearing templates (coords in the 1024² square)

Extend this list as you learn. Coords are `logoLeft logoTop logoW` for `overlay_logo.js`; patch hex =
the template's recoloured background.

| Template (category - angle) | logoLeft | logoTop | logoW | patch hex | notes |
|------------------------------|---------:|--------:|------:|-----------|-------|
| We're Sorry (Bold Statement, apology) | 150 | 60 | 250 | client dark bg | wordmark top-left above the headline |

Default if a logo template isn't mapped yet: top-left, `logoLeft 150  logoTop 60  logoW 240`, patch =
the recoloured background hex; then view + tune.

## Light vs dark logo

`overlay_logo.js` composites `logo_light.png` by default. If the template background is light, pass a
dark logo instead; if dark, run `scripts/prep-logo.js <darkLogo> logo_light.png <lightHex>` first so
the wordmark is visible. Match the logo colour to contrast with the patch.
