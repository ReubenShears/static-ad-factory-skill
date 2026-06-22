# Pipeline reference — exact tools, prompts, recipe, gotchas

**Image generation** is done by calling the **OpenAI Images API directly** (`scripts/gen_batch.js`,
needs `OPENAI_API_KEY` in the env) — this is the primary, most reliable path: image bytes land
straight on disk, no base64-through-context, no ephemeral sandbox, no tmpfiles-for-retrieval, no 120s
cap (so `high` quality is even possible). A Composio fallback is documented below for environments
without a raw key.

**Drive + Baserow** go through the **Composio MCP** (server `6d54c6e7-...`, accounts alias
`optimally-internal`: `googledrive` = `googledrive_vernal-brock`, plus `openai` for the fallback).
Execute Composio tools via `COMPOSIO_MULTI_EXECUTE_TOOL`. **Slack** uses the Slack MCP. Load deferred
tools with ToolSearch.

Infra IDs:
- Static Ads (source library) folder: `12pZLCEzziAAlYzbyH6OkmJKFKoE7Dsrg`
- Generated Ad Batches (output parent) folder: `1GfgqCopjp0ekFxpuStBGFVk7JQCsjY3c`
- Baserow Creative Batch Data table: `1040349` (database `453125`); Client Data table: `1000911`

## 1. Pick + fetch templates

**Select from the bundled index** `references/library-index.jsonl` (one row per library ad with
`id`, `name`, `category`, `angle`, `text_density`, `has_human`, `layout`, `notable`). This lets you
pick smartly without re-deriving anything: filter by the requested formats/angles, prefer
`text_density: low` and clean structure, skip un-mappable visual gags, and weight the format mix using
`references/format-weights.json` (defaults = library prevalence; the performance loop updates them).

**Cross-batch dedup:** before picking, read the client's prior rows in `Creative Batch Data`
(filter by Client ID) and avoid reusing the `Source Templates` already used for that client, so repeat
batches rotate rather than repeat.

The `id` is a Google Drive fileId (stable even though the live files are renamed `Category - angle -
nn`). Download each chosen template to local disk and **view it** (you must know its exact text blocks
and structure to write the carbon-copy prompt):
```
GOOGLEDRIVE_DOWNLOAD_FILE { fileId: "<id>" }  -> data.downloaded_file_content.s3url (1h presigned URL)
curl -s -o templates/<id>.jpg "<s3url>"
```
No tmpfiles hosting needed — the direct-API generator reads the local file.

## 2. Carbon-copy generate (direct OpenAI API — primary)

Write a `jobs.json` (one entry per ad) and run the bundled generator. It calls
`POST /v1/images/edits` directly (model `gpt-image-2`, `quality: medium`) and writes finished square
PNGs straight to disk — no Composio, no base64-through-context, no tmpfiles, no 120s cap.
```
jobs.json: [ { "id": "01-this-vs-that",
               "template": "templates/<id>.jpg",
               "prompt": "<carbon-copy prompt>",
               "out": "out/sq-01-this-vs-that.png",
               "expect": ["Your landing page should book calls", "Claim your free landing page"] } ]

OPENAI_API_KEY=... node scripts/gen_batch.js jobs.json 4   # concurrency 4; prints {ok,failed}
```
The optional `expect` array is the intended copy used by the QC step (section 5).

### Carbon-copy prompt pattern
Reuse this structure; fill the brackets:
```
Reproduce this advertisement EXACTLY: identical layout, composition, fonts, font sizes, spacing and
visual structure — [name each structural element: e.g. the pill tags top-left, the headline with a
highlighted phrase, the two stat cards, the CTA pill]. Change ONLY the colours and the words.
Colours: [recolour brand accents to client hexes; KEEP semantic colours — name them, e.g. "keep the
red decline / green accept buttons"; recolour background X -> client dark/light]. [If the template has
a logo:] The logo area must be left COMPLETELY EMPTY — do NOT draw any logo, swirl, symbol, icon or
brand mark there; leave clean background.
New words in the same positions and styling: [block 1] '...'; [block 2] '...'; [CTA] '...'.
Everything else must stay pixel-identical to the reference. Perfectly legible correct spelling. Square.
```
Keep the client's offer/pain/proof in the new copy. Map the original's intent to the client's offer
(e.g. a "1M views guarantee" stat becomes the client's proof stat). For logo templates, see
`logo-templates.md`.

## 3. Composio fallback (only if no `OPENAI_API_KEY`)

Host the template on tmpfiles (`/dl/` URL), then `OPENAI_CREATE_IMAGE_EDIT` (`gpt-image-2`,
`quality: medium`, **no `input_fidelity`**, `sync_response_to_workbench: true`, **≤5 per call**). The
result is a large `b64_json` in the workbench — decode on the Composio remote sandbox and re-host to
pull it locally:
```
COMPOSIO_REMOTE_BASH_TOOL (same session_id):
  cd /mnt/files/mex && python3 -c "import json,base64;d=json.load(open('<workbenchfile>.json'));\
    open('/tmp/a.png','wb').write(base64.b64decode(d['results'][0]['response']['data']['data'][0]['b64_json']))"
  curl -s -F "file=@/tmp/a.png" https://tmpfiles.org/api/v1/upload   # -> data.url -> curl /dl/ locally
```
This is the older path we proved before adding the direct API; prefer section 2.

## 4. Compose 9:16 (+ logo) locally

```
node scripts/make916_extend.js <square.png> <out9x16.png>   # extends bg edges to 1080x1920
# if the template had a logo, overlay the real client logo (after prep-logo if needed):
node scripts/overlay_logo.js <out_or_square.png> <final.png> <rectTop> <rectH> <logoTop> <logoW>
```
`make916_extend.js` resizes the square to 1080 and `.extend({top:420,bottom:420,extendWith:'copy'})`
so a solid/edge background continues seamlessly. `overlay_logo.js` paints a brand-coloured patch over
the (empty) logo area then composites `logo_light.png` — tune the coords by viewing the result.
`prep-logo.js` turns a dark transparent logo into an off-white one for dark backgrounds.

## 5. QC (automated — required for unattended runs)

There is no human in a routine run, so verify every ad before delivery and **auto-regenerate misses**:

1. Build a montage for a fast overview: `node scripts/contact_sheet.js <batch-dir> out/_contact.png`.
2. **Per-ad copy check (the important one):** Read each square and confirm every string in that job's
   `expect` array appears **and is spelled correctly** (gpt-image-2 occasionally drops a contraction
   or fumbles a word). Also confirm: brand colours applied, semantic colours preserved, **no
   competitor logo or person**, no leftover original wording, clean composition.
3. For any ad that fails, rebuild a `jobs-retry.json` with just those entries (optionally tighten the
   prompt — e.g. spell the exact words, "use contractions") and re-run `gen_batch.js` on it. Re-check.
   Cap at ~2 retries per ad; if still failing, swap to a different template for that slot and note it.

Only ads that pass copy + brand + no-logo/person checks proceed to upload.

## 6. Upload to Drive

```
GOOGLEDRIVE_CREATE_FOLDER { name: "<Client> Batch NNN | <Offer>", parent_id: "1GfgqCopjp0ekFxpuStBGFVk7JQCsjY3c" }
# host each final on tmpfiles, then:
GOOGLEDRIVE_UPLOAD_FROM_URL { source_url: "<tmpfiles /dl/ url>", name: "<Client> - NN - <Format>.png",
  mime_type: "image/png", parent_folder_id: "<new folder id>" }
```
Upload in batches of ~5.

## 7. Log to Baserow

Batch-level (always): `create_rows table_id 1040349`, one row:
```
Batch Name ("<Client> Batch NNN | <Offer>"), Client ID (UPPERCASE code), Date Created (ISO, e.g.
"2026-06-22T00:00:00Z"), Campaign Offer, Backend / Call Offer, ICP / Audience, Pain Points Used,
Brand Colours, Ad Count (number), Formats Used (semicolon list), Angles Used (semicolon list),
Output Spec, Source Templates (semicolon list), Drive Folder (URL), Feedback / Notes.
```
Per-ad (if a `Creative Ad Data` table exists — see `performance-loop.md`): also append one row per ad
(batch link, Client ID, format, angle, source template, Drive file link). This is the join key for the
performance-feedback loop. If the table doesn't exist yet, skip — the per-ad naming + batch row are
enough to add it later.

## 8. Post to Slack

Channel `#5-asset-generation` = `C0AN653QCF2` (private). Send via the Slack MCP `slack_send_message`
(server `c2edb284-...`), `channel_id: "C0AN653QCF2"`. Match the house style (italic labels, `code`
for client code / hexes, `>` blockquote group, `·` separators). The integration appends a
"Sent using Claude [timestamp]" footer automatically — don't add it yourself. Template:

```
:frame_with_picture: _New Static Ad Batch_

_<Client>_   `<CLIENT CODE>`

> :file_folder:  _Drive:_  <drive-folder-url|View batch in Drive>
> :handshake:  _Offer:_  <campaign offer>
> :busts_in_silhouette:  _ICP:_  <short ICP>
> :frame_with_picture:  _Ads:_  <count>  ·  9:16 (1:1 safe-zone)
> :performing_arts:  _Formats:_  <format · format · ...>
> :dart:  _Angles:_  <angle · angle · ...>
> :art:  _Brand:_  `#PRIMARY`  /  `#ACCENT`
> :white_check_mark:  _Status:_  Delivered  ·  Logged to Baserow
```

## Gotchas (learned the hard way)

The direct-API generator (section 2) avoids the worst of these (no base64/workbench/tmpfiles for gen,
no 120s cap). The first few bullets apply only to the **Composio fallback** (section 3):

- **`input_fidelity` is rejected by gpt-image-2** (400 error). Don't pass it (direct API or Composio).
- **(Composio fallback) Quality `high` + edit TIMES OUT** at Composio's 120s read cap. Use `medium`.
  The direct API has no such cap, so `high` is fine there if you want it.
- **(Composio fallback) Edit returns raw `b64_json`** (~300k tokens) — `sync_response_to_workbench:true`
  and decode via remote bash; never pull it inline. Batch **≤5 gens per multi-execute call**.
- **(Composio fallback) remote sandbox is ephemeral per call** — decode + re-host in the same step.
- **`GOOGLEDRIVE_UPLOAD_FROM_URL` fails from catbox.moe** (RemoteDisconnected). Use **tmpfiles.org**
  `/dl/` URLs for the upload hop. Upload in small batches.
- **The read-only Google Drive connector** (`mcp__e3f11bdf...`) is download/search only — use Composio
  for any write (rename/move/upload/folder).
- To **replace** a delivered ad: upload the new one, then `GOOGLEDRIVE_TRASH_FILE { file_id }` the old.
