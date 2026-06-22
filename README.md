# static-ad-factory (Claude skill)

Generate a batch of premium static ads for a client by **carbon-copying** proven winning-format
templates from the Optimally `Static Ads` Google Drive library and rebranding them — reproducing each
template's exact layout/typography while changing only the **colours** (to the client brand) and the
**text** (to the client's offer / pain / proof). Every output is framed **9:16 with a centred 1:1
safe-zone** so one asset works across feed, stories and reels. Batches are delivered to a dedicated
Drive folder, logged to Baserow, and announced in Slack.

This repo is a self-contained Claude **skill** so a remote routine (or any Claude with the right MCP
connections) can pull it down and follow it.

## Usage

Point Claude at `SKILL.md` and give it a client brief, e.g.:

> "Use static-ad-factory to make 10 ads for Optimally — offer is a free landing page."

It honours parameters (count, formats, angles, style, multiple offers) and falls back to sensible
defaults (batch of 10, variation across format × angle, 9:16) when they aren't given.

## Prerequisites (MCP + tooling)

- **Composio MCP** with connected `googledrive` and `openai` accounts (image gen via `gpt-image-2`,
  Drive read/write).
- **Baserow MCP** (batch logging) and a **Slack MCP** (batch announcement).
- **Node** with `sharp` (`npm i sharp`) for local 1:1 → 9:16 compositing and logo overlay.

## Structure

```
SKILL.md                  workflow, inputs, parameters/defaults, the hard rules
references/
  pipeline.md             exact tool calls, carbon-copy prompt pattern, recipe + gotchas, Slack/Baserow
  formats.md              format taxonomy, angles, template selection + batch composition
scripts/
  make916_extend.js       1:1 -> seamless 9:16 (edge extend)
  prep-logo.js            recolour a dark logo to light for dark backgrounds
  overlay_logo.js         patch an emptied logo area + composite the real client logo
  contact_sheet.js        QC montage of a batch
```

## Hard rules

Never reproduce another company's logo or a person resembling the original ad; recolour brand accents
but preserve semantically meaningful colours (red = warning, green = success); keep all readable
content inside the 1:1 safe-zone. See `SKILL.md` for the full set.

---

Built by [Optimally](https://www.optimally.ltd).
