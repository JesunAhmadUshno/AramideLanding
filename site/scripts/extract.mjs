// Build step: copy the landing page byte-for-byte into public/landing/ (served at <base>landing/)
// and record the facts the dashboard shows in src/data/site.json. Nothing here is typed by hand.
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import * as A from '../src/analyze.js';

const root = new URL('../../', import.meta.url);
const read = (f) => fs.readFileSync(new URL(f, root), 'utf8');
const FILES = ['index.html', 'style.css', 'script.js'];
fs.mkdirSync(new URL('site/public/landing/', root), { recursive: true });
for (const f of FILES) fs.copyFileSync(new URL(f, root), new URL(`site/public/landing/${f}`, root));

const html = read('index.html'), css = read('style.css'), js = read('script.js');
const git = (c) => { try { return execSync(`git ${c}`, { cwd: new URL('.', root), encoding: 'utf8' }).trim(); } catch { return null; } };
const data = {
  lines: Object.fromEntries(FILES.map((f) => [f, A.countLines(read(f))])),
  bytes: Object.fromEntries(FILES.map((f) => [f, fs.statSync(new URL(f, root)).size])),
  sections: A.sections(html),
  nav: A.navLinks(html),
  deps: A.externalDeps(html),
  timeline: A.timeline(html),
  yearClaims: A.yearClaims(html),
  tokens: A.tokens(css),
  mediaQueries: A.mediaQueries(css),
  keyframes: A.keyframes(css),
  hexColors: A.hexColors(css),
  cssRules: A.cssRules(css).length,
  jsFunctions: [...js.matchAll(/const (\w+) = \(/g)].map((m) => m[1]),
  commits: Number(git('rev-list --count HEAD')) || null,
  commit: git('rev-parse --short HEAD'),
};
fs.mkdirSync(new URL('site/src/data/', root), { recursive: true });
fs.writeFileSync(new URL('site/src/data/site.json', root), JSON.stringify(data, null, 1));
console.log(`extract: ${FILES.map((f) => `${f} ${data.lines[f]} lines`).join(', ')}; ${data.sections.length} sections; ${data.commits} commits`);
