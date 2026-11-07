// Known-answer check and repo smoke test: node src/audit.check.mjs (runs inside npm run build).
// It runs the same functions the browser runs against the repo's index.html and style.css.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as A from './analyze.js';

const read = (f) => fs.readFileSync(new URL(`../../${f}`, import.meta.url), 'utf8');
const html = read('index.html'), css = read('style.css');
const r2 = (x) => Math.round(x * 100) / 100;

// WCAG contrast against published reference values (WebAIM contrast checker).
assert.equal(r2(A.contrast('#ffffff', '#000000')), 21);
assert.equal(r2(A.contrast('#007bff', '#fff')), 3.98);
assert.equal(r2(A.contrast('#333', '#fff')), 12.63);
assert.equal(r2(A.contrast('#6c757d', '#fff')), 4.69);
assert.equal(r2(A.contrast('#888', '#fff')), 3.54);
assert.equal(A.normHex('white'), '#ffffff');

// Date arithmetic: Dec 2016 - Jan 2026 is 109 months (about 9.1 years).
assert.equal(A.months(A.parseRange('Dec 2016 - Jan 2026')), 109);
assert.equal(A.months(A.parseRange('Jan 2026 - Present'), new Date(2026, 10, 7)), 10);
assert.equal(A.parseRange('Jan 2025 - June 2026').end.m, 6);
assert.equal(A.parseRange('no date'), null);

// Structure of the landing page as shipped.
const secs = A.sections(html);
assert.deepEqual(secs.map((s) => s.id), ['home', 'about', 'skills', 'experience', 'education', 'contact']);
const nav = A.navLinks(html);
assert.equal(nav.length, 6);
assert.ok(nav.every((n) => n.targetLine), 'every nav anchor resolves');
assert.deepEqual(A.mediaQueries(css).map((m) => m.maxWidth), [768]);
assert.deepEqual(A.keyframes(css).map((k) => k.name), ['fadeIn', 'navLinkFade']);
assert.deepEqual(A.externalDeps(html).map((d) => d.host), ['cdnjs.cloudflare.com', 'fonts.googleapis.com']);
assert.equal(A.tokens(css).find((t) => t.name === '--primary').value, '#007bff');
const tl = A.timeline(html);
assert.equal(tl.length, 6);
assert.equal(tl.filter((t) => t.range).length, 4, 'four dated entries, two undated');
assert.deepEqual(A.yearClaims(html).map((c) => c.years), [10, 9]);

// Usage pairs resolve from style.css (no pair silently missing).
const pairs = A.usagePairs(css);
assert.ok(pairs.every((p) => p.ratio), `unresolved pair: ${pairs.filter((p) => !p.ratio).map((p) => p.label)}`);
assert.equal(r2(pairs.find((p) => p.label === 'Primary button').ratio), 3.98);
assert.equal(r2(pairs.find((p) => p.label === 'Education date').ratio), 3.54);

// Audit: regressions the repo fixed stay fixed; open findings stay reported.
const rows = Object.fromEntries(A.audit(html).map((r) => [r.title, r.status]));
for (const t of ['Nav anchors resolve', 'Exactly one h1', 'Document language set', 'Viewport meta present', 'New-tab links use rel=noopener', 'Mobile menu toggle is keyboard accessible', 'Decorative icons hidden from screen readers', 'Meta description'])
  assert.equal(rows[t], 'pass', t);
assert.equal(rows['Contact email is real'], 'fail');
assert.equal(rows['Experience claims agree'], 'warn');
assert.equal(rows['Open Graph tags'], 'warn');
assert.equal(rows['Third-party stylesheet integrity (SRI)'], 'warn');

// The audit itself catches the original faults (pre-fix markup).
const before = '<html><a href="https://x" target="_blank">x</a><div class="burger"></div><i class="fas fa-x"></i></html>';
const b = Object.fromEntries(A.audit(before).map((r) => [r.title, r.status]));
assert.equal(b['New-tab links use rel=noopener'], 'fail');
assert.equal(b['Mobile menu toggle is keyboard accessible'], 'fail');
assert.equal(b['Decorative icons hidden from screen readers'], 'warn');
assert.equal(b['Exactly one h1'], 'fail');

console.log(`audit.check: ok (${Object.keys(rows).length} audit rows, ${pairs.length} contrast pairs)`);
