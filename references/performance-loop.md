# Performance feedback loop (make the factory learn)

The premise is "winning formats", but prevalence in the swipe file is only a proxy for what *actually*
converts for our clients. Closing the loop means feeding real Meta performance back so batch
composition leans toward formats/angles that win in market. This is the highest-value upgrade; it has
two halves — the **foundation** (built into the skill now) and the **feedback routine** (a scheduled
job to stand up once generated ads are live on Meta).

## Foundation (in the skill now)

- **Per-ad identity.** Every generated ad is named `<Client> - NN - <Format>.png` and the batch row in
  `Creative Batch Data` records the format/angle spread and source templates. This is enough to map a
  launched ad back to its format/angle later.
- **Per-ad logging (recommended next).** Add a Baserow table `Creative Ad Data` (one row per generated
  ad: link to batch, Client ID, format, angle, source template, Drive file link, and — once
  launched — the Meta ad id). The skill should append these rows when the table exists. This is the
  join key between a creative and its Meta performance.
- **Weighting hook.** Batch selection reads `references/format-weights.json`. Today those are
  prevalence defaults; the feedback routine overwrites them with performance-based weights, so the
  skill automatically starts favouring proven winners with no code change.

## Feedback routine (build when ads are live)

A scheduled routine (daily/weekly) that:

1. Pulls Meta ad performance via the existing meta-ads pipeline into `Ad Data` (table 1001990).
2. Matches each launched Meta ad to its generated creative (by the uploaded image / ad name, or via
   the Meta ad id stored on the `Creative Ad Data` row).
3. Aggregates performance by **format** and **angle** (e.g. median CTR and CPL per format), over a
   trailing window, with a minimum-spend threshold so noise doesn't dominate.
4. Writes updated `references/format-weights.json` (normalised so strong performers get picked more,
   weak ones less; keep a floor so nothing drops to zero and we keep exploring).
5. Optionally posts a short "format leaderboard" to `#5-asset-generation`.

Guardrails: require a minimum number of ads + spend per format before trusting its weight; blend
performance weight with a small prevalence prior so a thin sample can't crown a fluke; keep an
exploration floor so every format still gets occasional play.

This routine is independent of the generator — it only reads Meta data and writes the weights file
the generator already consumes.
