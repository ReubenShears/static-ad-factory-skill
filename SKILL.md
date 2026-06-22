---
name: static-ad-factory
description: >-
  Generate a batch of premium static ads for a client by carbon-copying proven winning-format
  templates from the Optimally "Static Ads" Google Drive library and rebranding them (recolour +
  rewrite copy) to the client's offer, ICP and brand. Use this whenever the user wants to produce,
  generate, spin up, or refresh a batch of static ads / paid-social creatives / Meta ad images for
  a client or for Optimally — e.g. "make 10 ads for [client]", "generate a static ad batch", "spin
  up some pain-point ads", "run the ad factory", "create paid social creatives for this offer". Also
  trigger when given a client offer + ICP and asked for ad creative, even if they don't say "batch"
  or "factory". Honours parameters (number of ads, formats, angles, style, multiple offers) and
  falls back to sensible defaults when they aren't specified. NOT for building landing pages/funnels
  (use the VSL funnel skills) or for video ads.
---

# Static Ad Factory

Turn a client's offer + ICP into a batch of high-calibre static ads by **carbon-copying** the
winning ad formats already collected in the Optimally `Static Ads` Drive library. The library is a
swipe file of proven competitor/own ads, each renamed `Category - angle - nn`. The job each run:
pick a varied set of templates, reproduce each one **exactly** (same layout, fonts, shapes,
structure) while changing **only the colours (to the client brand) and the text (to the client's
offer/pain/proof)**, frame every output as 9:16 with the design continuing seamlessly, drop them in
a new Drive folder, and log the batch in Baserow.

Why carbon-copy rather than invent: these formats already win. The creative risk is in the *format*,
which we're reusing; the client's variation rides on top. Inventing new layouts throws away the
proven structure and reliably looks worse — we tested this and the user rejected from-scratch
text-to-image in favour of faithful reskins.

## Inputs

**Required context** (from the user's brief, or pull from Baserow `Client Data` if only a Client ID
is given):
- **Client ID / name** (e.g. `OPTIMALLY`) and **brand colours** (hex + which is primary vs accent).
- **Campaign offer** — the *ad-level* offer being promoted (e.g. "free landing page"). This is the
  bait, often different from the backend/call offer.
- **ICP / audience** and **pain points** — the hooks the copy draws on.

**Optional context:**
- **Backend / call offer** (for context only; usually not shown in the ad).
- **Client logo** (URL or file) — needed to brand templates that contain a logo. If absent, leave
  logo areas clean (never fabricate or keep the original's logo).
- **Founder / team photos**, **case-study numbers / testimonials** — used for human-led or proof ads.

For Optimally as the client, brand defaults live in the `optimally-brand-assets` memory (forest
`#0F2E2A`, lime `#7FB23C`, off-white `#F5F8F1`, warning red `#E5484D`; logo CDN URLs there).

## Parameters and defaults

Read any parameters the user sets and honour them; otherwise use the default. The point of defaults
is that a bare "make ads for X" still produces a great, varied batch.

| Parameter | Default | Notes |
|-----------|---------|-------|
| **count** | **10** | Number of ads in the batch. |
| **formats** | **variation** (weighted by library prevalence) | Restrict if asked, e.g. "only Fake-UI and Before/After". |
| **angles** | **variation** | Restrict if asked, e.g. "pain-point ads only". See angle list in `references/formats.md`. |
| **style** | **mixed** (light + dark) | e.g. "all dark", "premium", "playful/meme". |
| **offers** | **single** (the campaign offer) | If the user gives 2+ offers, split the batch across them and note which ad sells which. |
| **aspect/output** | **9:16, content in centred 1:1 safe-zone** | Don't change unless asked. |

Compose the batch as a controlled grid over format × angle so adjacent ads differ by one dimension
(smooth "linear" variation, not chaos). Weight toward the library's most common formats (Bold
Statement, Plain Offer, Fake-UI, Stat/Guarantee) unless told otherwise. Confirm the plan back to the
user in one line before generating if anything is ambiguous; otherwise just proceed.

## The hard rules (do not violate)

These came directly from the client and protect brand/legal integrity:

1. **Carbon-copy fidelity.** Reproduce the template's layout, typography, shapes and composition
   exactly. Change only colours and words. Don't redesign.
2. **Colour rule.** Recolour *brand/primary accent* colours to the client palette, BUT keep colours
   that carry *meaning* — red = warning/negative, green = success/accept, a strikethrough-red price,
   etc. Recolouring those breaks the message.
3. **Logo rule (critical).** NEVER reproduce another company's logo or brandmark. The image model
   tends to keep the original logo shape and just swap the text — do not allow this. Instruct the
   edit to leave any logo area **empty**, then composite the **real client logo** in afterwards with
   `scripts/overlay_logo.js`. If no client logo is provided, leave the area clean.
4. **People rule (critical).** Never use a person who resembles the original ad's person. Only
   client-provided photos, generic stock, or AI-generated people that clearly differ from the
   original. With no client photo for a human-led template, swap in a clearly different generic
   person or drop the person.
5. **Output spec.** Every final is 9:16 (1080×1920) with all readable content inside a centred 1:1
   safe-zone and the background extended seamlessly (no solid bars, no logo bars). One asset then
   works on feed (1:1 crop), stories and reels.
6. **Legible, correct spelling.** Always instruct the model to render copy crisply with correct
   spelling, and QC it before delivery.

## Workflow

Follow these steps. The detailed tool slugs, exact prompts, and gotchas are in
`references/pipeline.md` — read it before generating. The format taxonomy and template-selection
guidance are in `references/formats.md`.

1. **Gather context.** Assemble client offer, ICP, pains, brand colours, logo. If only a Client ID
   was given, pull the record from Baserow `Client Data` (table 1000911) and relevant context.

2. **Plan the batch.** Decide the format × angle spread for `count` ads honouring parameters/defaults.
   List the live templates in the `Static Ads` Drive folder
   (`12pZLCEzziAAlYzbyH6OkmJKFKoE7Dsrg`) via Composio `GOOGLEDRIVE_FIND_FILE` — each filename is
   `Category - angle - nn`, so you can filter/sample by category and angle directly. Pick specific
   template files to carbon-copy (favour low text-density, clean structure). See `references/formats.md`.

3. **Prep brand assets.** Fetch the client logo; if it's dark-on-transparent and will sit on a dark
   background, run `scripts/prep-logo.js` to make a light version.

4. **Generate each ad (carbon-copy edit).** For each chosen template:
   - Download it and **look at it** (Read the image) so you can describe its exact structure.
   - Host the template on tmpfiles.org and run `OPENAI_CREATE_IMAGE_EDIT` (model `gpt-image-2`,
     quality `medium`) with a "reproduce exactly, change only colours + words" prompt that specifies
     the new copy per text block, the brand hexes, the colour rule, and "leave any logo area empty".
   - Retrieve the base64 result, composite to 9:16 with `scripts/make916_extend.js`, and if the
     template had a logo, overlay the real client logo with `scripts/overlay_logo.js`.
   - **Generate in batches of ≤5 per Composio call** (larger calls time out).

5. **QC.** Build a contact sheet with `scripts/contact_sheet.js` and Read it. Check: correct/legible
   copy, on-brand colours, semantic colours preserved, NO competitor logo or person, seamless 9:16.
   Regenerate any miss before delivering.

6. **Deliver to Drive.** Create a new subfolder under `Generated Ad Batches`
   (`1GfgqCopjp0ekFxpuStBGFVk7JQCsjY3c`) named `<Client> Batch NNN | <Offer>`. Upload the 9:16
   finals (host on tmpfiles → `GOOGLEDRIVE_UPLOAD_FROM_URL`). Output folder must stay separate from
   `Static Ads` so generated work is never mistaken for source templates.

7. **Log the batch.** Append one row to Baserow `Creative Batch Data` (table 1040349) — see field
   list in `references/pipeline.md`. Report the Drive folder link, the format/angle spread, and flag
   anything regenerated.

8. **Post to Slack** — channel `#5-asset-generation` (`C0AN653QCF2`) via the Slack MCP
   `slack_send_message`. Match the house style the demo/VSL skills use so the channel stays neat:
   an emoji + `_italic_` title, a `_Client_   `CODE`` line, then a `>` blockquote group of
   `:emoji:  _Label:_  value` rows with `·` separators, brand hexes in `code`, and a status line.
   Keep it to the Drive link + key facts. Exact template in `references/pipeline.md`.

## Working style

- Show the user the batch (or a contact sheet) and, unless they've said otherwise, **upload to Drive
  automatically** — they shouldn't have to ask twice.
- When iterating with feedback, work in small rounds (e.g. 3 at a time) so a copy/colour miss costs
  one or two regenerations, never the whole set.
- Keep the OpenAI spend efficient: `medium` quality (not `high` — it times out and costs more),
  generate each ad once, and do all 9:16 framing locally (the scripts are free).

## Reference files

- `references/pipeline.md` — exact Composio tool slugs, the carbon-copy prompt pattern, the
  edit→retrieve→composite→upload recipe with code, the Baserow field list, and all the gotchas
  (no `input_fidelity`, batch ≤5, edit returns base64 so sync+decode, tmpfiles not catbox).
- `references/formats.md` — the 13-format taxonomy, the angle list, how to pick templates from the
  renamed library, and batch-composition guidance.
- `scripts/` — `make916_extend.js` (1:1→9:16 seamless extend), `prep-logo.js` (dark→light logo),
  `overlay_logo.js` (patch + composite real logo), `contact_sheet.js` (QC montage). All use Node +
  `sharp` (`npm i sharp` if missing).
