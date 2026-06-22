# Pipeline reference — exact tools, prompts, recipe, gotchas

All image gen + Drive + Baserow go through the **Composio MCP** (server `6d54c6e7-...`). Two relevant
connected accounts, both alias `optimally-internal`: `googledrive` (`googledrive_vernal-brock`) and
`openai`. Execute Composio tools via `COMPOSIO_MULTI_EXECUTE_TOOL` (pass the tool `slug` + `arguments`).
Load Composio tools with ToolSearch if deferred.

Infra IDs:
- Static Ads (source library) folder: `12pZLCEzziAAlYzbyH6OkmJKFKoE7Dsrg`
- Generated Ad Batches (output parent) folder: `1GfgqCopjp0ekFxpuStBGFVk7JQCsjY3c`
- Baserow Creative Batch Data table: `1040349` (database `453125`); Client Data table: `1000911`

## 1. Pick + fetch templates

List the library and parse `Category - angle - nn` filenames:
```
GOOGLEDRIVE_FIND_FILE { folder_id: "12pZLCEzziAAlYzbyH6OkmJKFKoE7Dsrg",
  q: "mimeType != 'application/vnd.google-apps.folder' and trashed = false",
  fields: "files(id,name)", pageSize: 1000 }
```
For each chosen template, get its bytes onto the local disk so you can (a) view it and (b) host it as
the edit reference:
```
GOOGLEDRIVE_DOWNLOAD_FILE { fileId }  -> data.downloaded_file_content.s3url (1h presigned URL)
curl -s -o template.jpg "<s3url>"
```
**Read the downloaded image** before writing its carbon-copy prompt — you must know its exact text
blocks and structure. Then host it for the edit (the edit needs an image_url):
```
curl -s -F "file=@template.jpg" https://tmpfiles.org/api/v1/upload
# take data.url and convert tmpfiles.org/ -> tmpfiles.org/dl/  (direct-download form)
```

## 2. Carbon-copy edit (gpt-image-2)

```
OPENAI_CREATE_IMAGE_EDIT {
  model: "gpt-image-2", size: "1024x1024", quality: "medium",
  images: [{ image_url: "<tmpfiles /dl/ url of template>" }],
  prompt: "<carbon-copy prompt>"
}
```
Run with `sync_response_to_workbench: true` (the result is a large base64). Generate **≤5 edits per
COMPOSIO_MULTI_EXECUTE_TOOL call** — bigger calls exceed the transport timeout.

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
(e.g. a "1M views guarantee" stat becomes the client's proof stat).

## 3. Retrieve the result (edit returns base64, not a URL)

The workbench file holds `results[i].response.data.data[0].b64_json`. Decode it on the Composio
remote sandbox and re-host so you can pull it locally (the remote sandbox has python3 + curl):
```
COMPOSIO_REMOTE_BASH_TOOL (same session_id):
  cd /mnt/files/mex && python3 -c "import json,base64;d=json.load(open('<workbenchfile>.json'));\
    open('/tmp/a.png','wb').write(base64.b64decode(d['results'][0]['response']['data']['data'][0]['b64_json']))"
  curl -s -F "file=@/tmp/a.png" https://tmpfiles.org/api/v1/upload   # -> data.url
```
Then `curl` the `/dl/` URL to local disk. (The workbench filename is auto-named; the tool result that
created it tells you the path, e.g. `/mnt/files/mex/<word>.json`.)

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

## 5. QC

```
node scripts/contact_sheet.js   # tiles out/sq-*.png (point it at your batch dir) -> a montage
```
Read the montage. Verify copy/spelling, brand colours, semantic colours kept, **no competitor logo or
person**, seamless 9:16. Regenerate misses.

## 6. Upload to Drive

```
GOOGLEDRIVE_CREATE_FOLDER { name: "<Client> Batch NNN | <Offer>", parent_id: "1GfgqCopjp0ekFxpuStBGFVk7JQCsjY3c" }
# host each final on tmpfiles, then:
GOOGLEDRIVE_UPLOAD_FROM_URL { source_url: "<tmpfiles /dl/ url>", name: "<Client> - NN - <Format>.png",
  mime_type: "image/png", parent_folder_id: "<new folder id>" }
```
Upload in batches of ~5.

## 7. Log to Baserow

```
create_rows table_id 1040349, one row with fields:
Batch Name ("<Client> Batch NNN | <Offer>"), Client ID (UPPERCASE code), Date Created (ISO, e.g.
"2026-06-22T00:00:00Z"), Campaign Offer, Backend / Call Offer, ICP / Audience, Pain Points Used,
Brand Colours, Ad Count (number), Formats Used (semicolon list), Angles Used (semicolon list),
Output Spec, Source Templates (semicolon list), Drive Folder (URL), Feedback / Notes.
```

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

- **Quality `high` + edit TIMES OUT** at Composio's 120s read cap and costs more. Use `medium`.
- **`input_fidelity` is rejected by gpt-image-2** (400 error). Don't pass it.
- **Edit returns raw `b64_json`** (~300k tokens) — always `sync_response_to_workbench:true` and decode
  via remote bash; never pull it inline.
- **`CREATE_IMAGE` (text-to-image) returns a clean `asset_url`** — useful if you ever need a from-
  scratch image, but the client wants carbon-copy edits, so prefer EDIT.
- **Batch ≤5 gens per multi-execute call**; ~14 in one call exceeds the MCP transport timeout (and you
  pay for server-side gens you can't retrieve).
- **`GOOGLEDRIVE_UPLOAD_FROM_URL` fails from catbox.moe** (RemoteDisconnected). Use **tmpfiles.org**
  `/dl/` URLs. Upload in small batches.
- **Composio remote sandbox is ephemeral per call** — decode + re-host in the same step; don't rely on
  workbench files persisting across unrelated calls.
- **The read-only Google Drive connector** (`mcp__e3f11bdf...`) is download/search only — use Composio
  for any write (rename/move/upload/folder).
- To **replace** a delivered ad: upload the new one, then `GOOGLEDRIVE_TRASH_FILE { file_id }` the old.
