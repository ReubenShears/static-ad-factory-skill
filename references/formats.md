# Format taxonomy, angles, and batch composition

The `Static Ads` library is a swipe file of proven winning ads, each renamed `Category - angle - nn`
(flat, in the one folder). The filename IS the metadata: parse it to pick by format and angle without
opening every file. The library is extensible — anyone can drop a new ad in named to this convention.

## FORMAT categories (the visual skeleton — axis 1)

Derived from a full vision pass of the library, ranked by how common each is (more common = more
reliably a winner, weight batches toward the top unless told otherwise):

| Category | What it looks like |
|----------|--------------------|
| **Bold Statement** | One punchy text claim dominates; highlight-block on the key phrase is the signature device |
| **Plain Offer** | Clean, minimal offer/value-prop card |
| **Fake UI** | Mimics an interface — dashboard, OS dialog, Notes app, calendar, settings toggle, search result |
| **Stat Guarantee** | One huge number or guarantee as the hero |
| **Testimonial Result** | Client quote / result / attributed founder quote |
| **This vs That** | Two-column ✗/✓ comparison |
| **Fake Social** | Mimics a social post / DM / notification / incoming call (tweet, iMessage, lock-screen) |
| **Framework Diagram** | System map, flow of nodes, doodle, equation |
| **Listicle** | Bulleted benefits / "works for…" / "leaking if…" list |
| **Before After** | Split: pain-state vs desired-state |
| **Meme Native** | Looks organic/un-ad-like, meme or comic style |
| **Lead Magnet Mockup** | A freebie shown as ebook/laptop/doc mockups |
| **Founder Human** | A real person/portrait leads it (needs a client/founder photo — see People rule) |

Fake UI + Fake Social together are the standout "native mimic" device and punch above their weight.

## ANGLE (the message/hook — axis 2, independent of format)

`pain · fear · contrarian · proof · reframe · mechanism · future-pace · curiosity · authority · price-anchor`

The library spans all of these fairly evenly, so you can usually find a template in most
format×angle combinations. "Pain-point ads only" = filter to `angle = pain` (and adjacent: fear,
reframe). "Proof-led" = proof/authority/price-anchor.

## Production facts (from the data)

- ~81% of winning ads have **no human** — graphic/typographic dominates, so client photos are
  genuinely optional. Don't force a person in.
- Aspect in the wild is square/portrait; we standardise output to **9:16 with a 1:1 safe-zone**.
- Recurring cross-format "spice" devices you can lean on: highlight-block on the key phrase,
  strikethrough price anchor, a hand-drawn circle on a stat, pay-on-results risk-reversal, fake-UI-
  as-proof.

## Picking templates for a batch

- **Favour low text-density, clean structure** — they reskin most faithfully.
- **Match the angle to the client's hooks** — a pain template wants a pain point in the copy; a
  proof/stat template wants a real client result.
- **Skip templates whose meaning can't map** to the client (e.g. a niche-specific visual gag).
- **Avoid using Optimally's own produced ads** (`Ad NN`, `Disruptor Ad NN`) as templates unless the
  client *is* Optimally and you want to iterate on them — the point is to reuse the broad winning
  formats, not re-skin in-house creative.
- For visual variety, mix light-background and dark-background templates within the batch.

## Composing the batch (controlled variation)

Default: spread `count` ads across a format × angle grid so any two adjacent creatives differ by one
dimension — smooth, deliberate variation rather than 10 random looks or 10 near-duplicates. Weight
the format mix toward the library's common winners. Examples:

- `count: 10`, default → ~6–7 distinct formats, each with a fitting angle, ~60% light / 40% dark.
- `"pain-point ads only"` → hold angle≈pain, vary the format across Bold Statement, Fake UI, This vs
  That, Listicle, Before/After, etc.
- `"all Fake-UI"` → hold format=Fake UI/Fake Social, vary the angle and the specific interface
  mimicked (notification, dashboard, Notes, incoming call, search result…).
- Two offers → split the count across both, label which ad sells which, keep variation within each.
