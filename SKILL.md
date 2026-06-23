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

**Required context** (from the user's brief; the skill also auto-enriches from Baserow `Client Data`
in step 1, so a bare company name/Client ID can be enough):
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
| **variation_of** | — (off) | If the user references a prior *winner* (an ad/style/batch that worked), switch to **winner-variation mode** (below) — make variations of that winner, not a fresh random batch. |

Compose the batch as a controlled grid over format × angle so adjacent ads differ by one dimension
(smooth "linear" variation, not chaos). Weight toward the library's most common formats (Bold
Statement, Plain Offer, Fake-UI, Stat/Guarantee) unless told otherwise. Confirm the plan back to the
user in one line before generating if anything is ambiguous; otherwise just proceed.

### Winner-variation mode (double down on what works)

When the user points at something that already performed — "make more like the Apple-Notes one that
crushed", "variations of batch 1's winner", "that this-vs-that ad worked, do 5 more like it" — do NOT
spin a fresh diverse batch. The goal is *more shots on a proven target*, not novelty:

1. **Find the winner.** Look up the client's prior batches in `Creative Batch Data` (filter by Client
   ID), open the referenced batch's Drive folder (and `Creative Ad Data` rows if that table exists),
   and identify the specific winning ad(s) from the user's description (format / style / headline).
   **View the winning ad** to be certain of its exact format, layout and copy.
2. **Vary only secondary levers.** Reuse the winner's format/template and core message; generate
   `count` variations that change only: the angle, headline phrasing, the highlighted line, sub-copy,
   light vs dark, and small visual accents. Stay close — a viewer should recognise them as siblings of
   the winner. (If the user also names a new offer, swap the offer but keep the winning format/style.)
3. **Log it as a variation set** — note in the batch row's Feedback/Notes that it's variations of
   `<winner>` so the lineage is clear. See `references/pipeline.md` for the lookup recipe.

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

0. **Be patient on inputs — don't rush to an error.** The one truly required input is which client
   this run targets (a `client_code`/company, or a winner reference for variation mode). If it's
   missing at the start, context sometimes just lands late (the operator may still be wiring the
   trigger). **Wait and re-check the input source a few times over a short grace window** (e.g.
   re-read after ~90s, up to ~3 times / ~5 min total) before doing anything else. Only if it's still
   missing after the grace window: send ONE concise heads-up — **DM the routine owner** (not the
   public `#5-asset-generation` channel) — and stop. Never guess which client to spend image-gen
   budget on, and never ship a public Slack post / Drive folder / Baserow row for a guess. (Other
   inputs — offer/ICP/brand — are not blockers: enrich from Baserow, then proceed with what you have.)

1. **Gather context + enrich from Baserow.** Start from the user's brief, then **always try to enrich
   from `Client Data` (table 1000911)** — even when a full brief was given, the record usually has
   sharper offer/ICP/pain/proof detail. Match the referenced company by `Client ID` (exact, uppercase)
   first, then `Company` (case-insensitive contains). If a row is found, pull and merge the useful
   fields (Industry, Offer, Best Product/Service, Pricing, Guarantee, Elevator Pitch, Market Advantage,
   ICP Examples, Consistent Client Persona, Pain Points, Main Bottleneck, Past Frustrations, Frequent
   Objections, Case Studies, Extra Social Proof, Main Goal, Website URL, Drive/Dropbox for assets).
   The user's brief always **wins on conflicts** (it's the campaign intent); Baserow fills gaps and
   adds richness. **If no row matches (or the company can't be found), proceed silently with the
   provided context only** — never block on a missing record. See `references/pipeline.md` for the
   match query and field map. (Use a client's Case Studies / proof only for their own ads; that's
   their results, fair game.)

2. **Plan the batch.** Decide the format × angle spread for `count` ads honouring parameters/defaults.
   Select templates from the bundled index `references/library-index.jsonl` (rich metadata + stable
   Drive `id`): filter by requested formats/angles, prefer `text_density: low`, weight the format mix
   using `references/format-weights.json`, and **dedup** against this client's prior `Source Templates`
   in Baserow so repeat batches rotate. See `references/formats.md`.

3. **Resolve brand via Firecrawl (the consistent, egress-independent way).** Don't guess or hand-pick
   brand colours — scrape them, the same way the demo skill does:
   - **Find the website.** Use Client Data `Website URL`; if blank, derive the domain from the
     client's email (`Contact Email` → `Payment Email` → `Organizer Email(s)`), skipping generic
     providers (gmail/outlook/yahoo/icloud/hotmail/proton). If there's no site and only a generic
     email, fall back to brand colours from the brief (or the `optimally-brand-assets` defaults when
     the client is Optimally).
   - **Scrape once:** `firecrawl_scrape(url, formats: ["branding"])`. Returns `branding.colors`
     (primary / secondary / textPrimary / background), `branding.colorScheme` (light/dark), and
     `branding.images.logo` / `favicon`. **Use Firecrawl, not a direct site fetch** — it scrapes
     server-side, so it works even when the sandbox's egress is blocked (a direct fetch returns
     error pages there).
   - **Map it:** primary → brand primary, secondary → accent; `colorScheme` + `background` bias the
     light/dark style mix; `images.logo` → the client logo (download for overlay on logo-bearing
     templates). **Monochrome sanity check** (from the demo skill): if the brand reads black/white/grey,
     keep it mono and use near-white for accents — never invent a colour.
   - **Logo:** prefer logo-free templates so a missing logo never blocks; for logo-bearing ones use the
     scraped logo via `references/logo-templates.md` (+ `scripts/prep-logo.js` for a light version on
     dark backgrounds). Requires the **Firecrawl MCP**.

4. **Generate each ad (carbon-copy edit).** For each chosen template:
   - Download it (Composio Drive download → curl to local) and **look at it** so you can describe its
     exact structure and exact copy.
   - Write a `jobs.json` entry: `{id, template (local path), prompt, out, expect}` where `prompt` is
     the carbon-copy prompt (reproduce exactly; change only colours + words; leave any logo area
     empty) and `expect` lists the intended copy strings for QC.
   - Run the **direct OpenAI generator**: `OPENAI_API_KEY=… node scripts/gen_batch.js jobs.json` — it
     writes finished square PNGs to disk (no Composio/base64/tmpfiles, no timeout). *(Fallback for
     envs without a key: the Composio `OPENAI_CREATE_IMAGE_EDIT` path in `references/pipeline.md` §3.)*
   - Composite each to 9:16 with `scripts/make916_extend.js`; for logo templates overlay the real
     client logo with `scripts/overlay_logo.js` (coords in `logo-templates.md`).

5. **QC (auto — regenerate misses).** Build a montage (`scripts/contact_sheet.js`), then Read each ad
   and verify its `expect` strings render **correctly spelled**, brand colours applied, semantic
   colours kept, NO competitor logo or person, seamless 9:16. Re-run `gen_batch.js` on a retry subset
   for any miss (≤2 retries; else swap template). Only passing ads proceed. See `pipeline.md` §5.

6. **Deliver to Drive.** Create a new subfolder under `Generated Ad Batches`
   (`1GfgqCopjp0ekFxpuStBGFVk7JQCsjY3c`) named `<Client> Batch NNN | <Offer>`. Upload the 9:16
   finals (host on tmpfiles → `GOOGLEDRIVE_UPLOAD_FROM_URL`). Output folder must stay separate from
   `Static Ads` so generated work is never mistaken for source templates.

7. **Log the batch.** Append one row to Baserow `Creative Batch Data` (table 1040349) — see field
   list in `references/pipeline.md`. Also append per-ad rows to `Creative Ad Data` if that table
   exists (it's the join key for the performance loop — see `references/performance-loop.md`). Report
   the Drive folder link, the format/angle spread, and flag anything regenerated.

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
- Keep the OpenAI spend efficient: `quality: medium`, generate each ad once, and do all 9:16 framing
  locally (the scripts are free). With the direct API there's no 120s cap, so `high` is available for
  hero ads if you want it.

## Requirements

- `OPENAI_API_KEY` in the env for the primary generator (`scripts/gen_batch.js`). Without it, fall
  back to the Composio `openai` connection (slower, see `pipeline.md` §3).
- Composio MCP (`googledrive` + `openai`), Baserow MCP, Slack MCP, **Firecrawl MCP** (brand scrape).
- `node` + `sharp` (`npm i sharp`), `git`, `curl`.

## Running remotely (restricted environments)

Validated end-to-end in a remote routine env. Expect these and adapt — they're normal, not failures:

- **No `OPENAI_API_KEY`** → use the Composio `OPENAI_CREATE_IMAGE_EDIT` fallback (`pipeline.md` §3).
  This is the default remote path.
- **`sharp` not preinstalled** → `npm i sharp`, OR composite with PIL on the remote sandbox (below).
- **Restricted local egress** — the local sandbox may allowlist network so **tmpfiles.org and the open
  web are blocked** (only the Composio R2 download host is reachable). When you detect this (uploads
  return empty / fetches return tiny error pages), do image-edit + 9:16 composition on the **Composio
  remote sandbox** (`COMPOSIO_REMOTE_WORKBENCH`, PIL + network), keep base64 in-sandbox, then pull
  finals back locally via Drive→R2 for QC.
- **Generate resumably + throttled — this is the credit-safety rule.** A naive remote run wasted
  credits (a sandbox recycle wiped 12 in-progress squares → full regen; 429s from launching 14 at
  once). So ALWAYS: create the Drive batch folder first; per ad **generate → compose → upload to Drive
  immediately**; **resume by listing the folder and skipping slots already uploaded**; cap
  **concurrency ≤ 3**; back off on 429/5xx. Drive is the checkpoint, so a crash or rate-limit costs at
  most the in-flight ad, never the whole batch. Don't trust `/mnt/files` to survive a recycle. Full
  recipe + rules in `pipeline.md` §10. (Beat the ~60s transport cap by running the driver as a
  background thread + polling — but correctness comes from the Drive-resume rule, not kernel uptime.)
- **Brand/logo not in Baserow** — derive from the client website (from the sandbox if egress is
  blocked); prefer logo-free templates so it never blocks.
- **Be patient on inputs** — see step 0 (grace window before erroring).
- **Best fix (recommended for the routine env): set `OPENAI_API_KEY` and allowlist `api.openai.com`.**
  Then the local `gen_batch.js` path runs — it's resumable + 429-safe + writes to disk — and the whole
  fragile remote-sandbox/tmpfiles dance (the source of the wasted credits) disappears. Until that's
  provisioned, the resumable §10 sandbox path is the safe fallback.

## Reference files

- `references/pipeline.md` — exact recipe + code: direct-API generation (primary) and the Composio
  fallback, the carbon-copy prompt pattern, compose/QC/upload, Baserow fields, Slack template, gotchas.
- `references/formats.md` — the 13-format taxonomy, angle list, template selection + batch composition.
- `references/library-index.jsonl` — rich per-template metadata (id, category, angle, layout, etc.)
  for smart selection.
- `references/format-weights.json` — selection weights (prevalence defaults; updated by the
  performance loop).
- `references/logo-templates.md` — logo handling + known logo-template coordinates.
- `references/performance-loop.md` — how the factory learns from real Meta performance over time.
- `scripts/` — `gen_batch.js` (direct OpenAI Images-edit batch generator), `make916_extend.js`
  (1:1→9:16 seamless extend), `prep-logo.js` (dark→light logo), `overlay_logo.js` (patch + composite
  real logo), `contact_sheet.js` (QC montage). Node + `sharp` (`npm i sharp`).
