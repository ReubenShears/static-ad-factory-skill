// Direct OpenAI Images-edit batch generator. Carbon-copies each template into a rebranded ad by
// calling the OpenAI API directly (no Composio, no base64-through-context, no tmpfiles for retrieval,
// no 120s Composio cap). Writes finished square PNGs straight to disk.
//
// Requires: process.env.OPENAI_API_KEY. Node 18+ (uses global fetch/FormData/Blob).
//
// Usage: node gen_batch.js <jobs.json> [concurrency=4] [model=gpt-image-2] [quality=medium] [size=1024x1024]
// jobs.json: [ { "id": "01-this-vs-that", "template": "path/to/template.jpg",
//                "prompt": "<carbon-copy prompt>", "out": "out/sq-01-this-vs-that.png" }, ... ]
// Prints a JSON summary { ok:[ids], failed:[{id,error}] } to stdout.
const fs = require('fs');
const path = require('path');

const [, , jobsPath, concArg, modelArg, qualArg, sizeArg] = process.argv;
const CONC = +(concArg || 4);
const MODEL = modelArg || 'gpt-image-2';
const QUALITY = qualArg || 'medium';
const SIZE = sizeArg || '1024x1024';
const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error('FATAL: OPENAI_API_KEY not set'); process.exit(2); }
if (!jobsPath) { console.error('FATAL: pass a jobs.json path'); process.exit(2); }

const jobs = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));
const mimeOf = f => (f.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');

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
    if (res.status >= 500 && attempt < 3) { await new Promise(r => setTimeout(r, 1500 * attempt)); return runOne(job, attempt + 1); }
    throw new Error(`HTTP ${res.status}: ${t.slice(0, 300)}`);
  }
  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error('no b64_json in response');
  fs.mkdirSync(path.dirname(job.out), { recursive: true });
  fs.writeFileSync(job.out, Buffer.from(b64, 'base64'));
  return job.out;
}

(async () => {
  const ok = [], failed = [];
  let i = 0;
  async function worker() {
    while (i < jobs.length) {
      const job = jobs[i++];
      try { await runOne(job); ok.push(job.id); process.stderr.write(`done ${job.id}\n`); }
      catch (e) { failed.push({ id: job.id, error: String(e.message || e) }); process.stderr.write(`FAIL ${job.id}: ${e.message}\n`); }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONC, jobs.length) }, worker));
  console.log(JSON.stringify({ ok, failed }, null, 2));
  if (failed.length) process.exitCode = 1;
})();
