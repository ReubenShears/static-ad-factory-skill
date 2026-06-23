// Direct OpenAI Images-edit batch generator. Carbon-copies each template into a rebranded ad by
// calling the OpenAI API directly (no Composio, no base64-through-context, no tmpfiles for retrieval,
// no 120s Composio cap). Writes finished square PNGs straight to disk.
//
// RESUMABLE + RATE-LIMIT SAFE: skips any job whose `out` already exists (so a re-run never re-pays
// for completed ads), caps concurrency low, and backs off on 429/5xx. This is what stops a crash or
// rate-limit from turning into a full re-spend.
//
// Requires: process.env.OPENAI_API_KEY. Node 18+ (uses global fetch/FormData/Blob).
//
// Usage: node gen_batch.js <jobs.json> [concurrency=3] [model=gpt-image-2] [quality=medium] [size=1024x1024]
// jobs.json: [ { "id": "01-this-vs-that", "template": "path/to/template.jpg",
//                "prompt": "<carbon-copy prompt>", "out": "out/sq-01-this-vs-that.png" }, ... ]
// Prints a JSON summary { ok, skipped, failed } to stdout.
const fs = require('fs');
const path = require('path');

const [, , jobsPath, concArg, modelArg, qualArg, sizeArg] = process.argv;
const CONC = +(concArg || 3);              // keep low — image APIs rate-limit aggressively
const MODEL = modelArg || 'gpt-image-2';
const QUALITY = qualArg || 'medium';
const SIZE = sizeArg || '1024x1024';
const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error('FATAL: OPENAI_API_KEY not set'); process.exit(2); }
if (!jobsPath) { console.error('FATAL: pass a jobs.json path'); process.exit(2); }

const jobs = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));
const mimeOf = f => (f.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runOne(job, attempt = 1) {
  const buf = fs.readFileSync(job.template);
  const form = new FormData();
  form.append('model', MODEL);
  form.append('prompt', job.prompt);
  form.append('size', SIZE);
  form.append('quality', QUALITY);
  form.append('n', '1');
  form.append('image', new Blob([buf], { type: mimeOf(job.template) }), path.basename(job.template));
  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST', headers: { Authorization: `Bearer ${KEY}` }, body: form,
  });
  if (!res.ok) {
    const t = await res.text();
    // 429 (rate limit) and 5xx are transient — back off and retry, up to 6 attempts
    if ((res.status === 429 || res.status >= 500) && attempt <= 6) {
      const wait = Math.min(60000, 2000 * 2 ** (attempt - 1)); // 2s,4s,8s,16s,32s,60s
      process.stderr.write(`retry ${job.id} (HTTP ${res.status}) in ${wait}ms\n`);
      await sleep(wait); return runOne(job, attempt + 1);
    }
    throw new Error(`HTTP ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error('no b64_json in response');
  fs.mkdirSync(path.dirname(job.out), { recursive: true });
  fs.writeFileSync(job.out, Buffer.from(b64, 'base64'));
  return job.out;
}

(async () => {
  const ok = [], failed = [], skipped = [];
  let i = 0;
  async function worker() {
    while (i < jobs.length) {
      const job = jobs[i++];
      if (fs.existsSync(job.out) && fs.statSync(job.out).size > 1000) { skipped.push(job.id); continue; } // resume
      try { await runOne(job); ok.push(job.id); process.stderr.write(`done ${job.id}\n`); }
      catch (e) { failed.push({ id: job.id, error: String(e.message || e) }); process.stderr.write(`FAIL ${job.id}: ${e.message}\n`); }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONC, jobs.length) }, worker));
  console.log(JSON.stringify({ ok, skipped, failed }, null, 2));
  if (failed.length) process.exitCode = 1;
})();
