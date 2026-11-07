// Pure string analysis of the landing page source (index.html, style.css, script.js).
// Shared by scripts/extract.mjs (build time, Node), src/audit.check.mjs (known-answer test)
// and the browser (live audit and contrast calculator), so all three compute the same thing.

export const lineOf = (src, i) => src.slice(0, i).split('\n').length;
export const countLines = (src) => src.split('\n').length - (src.endsWith('\n') ? 1 : 0);
const text = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const attr = (tag, name) => (tag.match(new RegExp(`\\s${name}="([^"]*)"`)) || [])[1];

// ---------- HTML ----------
export function sections(html) {
  return [...html.matchAll(/<section\s[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g)].map((m) => ({
    id: m[1],
    line: lineOf(html, m.index),
    headings: [...m[2].matchAll(/<(h[1-3])[^>]*>([\s\S]*?)<\/\1>/g)].map((h) => ({ tag: h[1], text: text(h[2]) })),
  }));
}

export function navLinks(html) {
  const ul = html.match(/<ul class="nav-links">([\s\S]*?)<\/ul>/);
  if (!ul) return [];
  const base = ul.index + ul[0].indexOf(ul[1]);
  return [...ul[1].matchAll(/<a href="#([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => {
    const target = html.match(new RegExp(`\\sid="${m[1]}"`));
    return { href: `#${m[1]}`, label: text(m[2]), line: lineOf(html, base + m.index), targetLine: target ? lineOf(html, target.index) : null };
  });
}

// External <link>/<script> resources: the page's runtime dependencies.
export function externalDeps(html) {
  return [...html.matchAll(/<(link|script)\b[^>]*>/g)]
    .map((m) => ({ tag: m[0], url: attr(m[0], 'href') || attr(m[0], 'src'), line: lineOf(html, m.index) }))
    .filter((d) => d.url && /^https?:/.test(d.url))
    .map((d) => ({ url: d.url, host: new URL(d.url).host, line: d.line, integrity: !!attr(d.tag, 'integrity') }));
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const ym = (s) => {
  const m = s.trim().match(/^([A-Za-z]+)\s+(\d{4})$/);
  return m && MONTHS.includes(m[1].slice(0, 3).toLowerCase()) ? { y: +m[2], m: MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()) + 1 } : null;
};
export function parseRange(s) {
  const [a, b] = s.split(/\s+-\s+/);
  const start = ym(a || '');
  const end = /present/i.test(b || '') ? 'present' : ym(b || '');
  return start && end ? { start, end } : null;
}
// Whole months from start to end; 'present' resolves to the given date.
export const months = (r, now = new Date()) => {
  const e = r.end === 'present' ? { y: now.getFullYear(), m: now.getMonth() + 1 } : r.end;
  return (e.y - r.start.y) * 12 + (e.m - r.start.m);
};

export function timeline(html) {
  const out = [];
  for (const m of html.matchAll(/<div class="timeline-item">([\s\S]*?)<\/ul>/g)) {
    const date = text((m[1].match(/<div class="timeline-date">([\s\S]*?)<\/div>/) || [])[1] || '');
    out.push({ kind: 'Experience', title: text((m[1].match(/<h3>([\s\S]*?)<\/h3>/) || [])[1] || ''), org: text((m[1].match(/<h4>([\s\S]*?)<\/h4>/) || [])[1] || ''), date, range: parseRange(date), line: lineOf(html, m.index) });
  }
  for (const m of html.matchAll(/<div class="edu-card">([\s\S]*?)<\/div>/g)) {
    const date = text((m[1].match(/<p class="date">([\s\S]*?)<\/p>/) || [])[1] || '');
    out.push({ kind: 'Education', title: text((m[1].match(/<h3>([\s\S]*?)<\/h3>/) || [])[1] || ''), org: text((m[1].match(/<h4>([\s\S]*?)<\/h4>/) || [])[1] || ''), date, range: date ? parseRange(date) : null, line: lineOf(html, m.index) });
  }
  return out;
}

// "over N years" claims in the copy, to compare against the dated timeline.
export const yearClaims = (html) => [...html.matchAll(/over (\d+) years/gi)].map((m) => ({ years: +m[1], quote: m[0], line: lineOf(html, m.index) }));

// ---------- CSS ----------
export function cssRules(css) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1].trim().split('\n').pop().trim(), body: m[2], line: lineOf(css, m.index + m[1].length - m[1].trimStart().length) }));
}
export function tokens(css) {
  const root = css.match(/:root\s*\{([^}]*)\}/);
  return root ? [...root[1].matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => ({ name: `--${m[1]}`, value: m[2].trim() })) : [];
}
export const mediaQueries = (css) => [...css.matchAll(/@media([^{]+)\{/g)].map((m) => ({ query: m[1].trim(), line: lineOf(css, m.index), maxWidth: +((m[1].match(/max-width:\s*(\d+)px/) || [])[1] || 0) || null }));
export const keyframes = (css) => [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => ({ name: m[1], line: lineOf(css, m.index) }));
export const hexColors = (css) => [...new Set([...css.matchAll(/#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b/g)].map((m) => normHex(m[0])))];

const NAMED = { white: '#ffffff', black: '#000000' };
export function normHex(c) {
  c = (NAMED[c.toLowerCase()] || c).toLowerCase();
  return c.length === 4 ? '#' + [...c.slice(1)].map((x) => x + x).join('') : c;
}
// Resolve the color and background declared on one selector, following var(--x) into :root.
export function ruleColors(css, selector) {
  const vars = Object.fromEntries(tokens(css).map((t) => [t.name, t.value]));
  const rule = cssRules(css).find((r) => r.selector === selector);
  if (!rule) return null;
  const get = (re) => {
    const v = (rule.body.match(re) || [])[1];
    if (!v) return null;
    const r = v.trim().replace(/var\((--[\w-]+)\)/, (_, n) => vars[n] || n);
    return /^#|^white$|^black$/i.test(r) ? normHex(r) : null;
  };
  return { fg: get(/(?<![-\w])color:\s*([^;]+);/), bg: get(/background(?:-color)?:\s*([^;]+);/), line: rule.line };
}

// Text/background pairs the page renders. Colors are read from style.css; the pairing
// (which element sits on which background) follows the DOM structure of index.html.
export const USAGE = [
  ['Body text', 'body', 'body'],
  ['About paragraph', '.about-content', 'body'],
  ['Logo', '.logo', 'header'],
  ['Primary button', '.btn.primary', '.btn.primary'],
  ['Timeline date', '.timeline-date', 'body'],
  ['Role subtitle', '.timeline-content h4', 'body'],
  ['Education subtitle', '.edu-card h4', '.edu-card'],
  ['Education date', '.edu-card .date', '.edu-card'],
  ['Hero text', '.hero', '.hero'],
  ['Hero name highlight', '.highlight', '.hero'],
  ['Console prompt', '.command-prompt', '.console-block'],
  ['Console output', '.command-output', '.console-block'],
  ['Contact button', '.contact-btn', '.contact-btn'],
  ['Footer', 'footer', 'footer'],
];
export function usagePairs(css) {
  return USAGE.map(([label, fs, bs]) => {
    const f = ruleColors(css, fs), b = ruleColors(css, bs);
    const fg = f?.fg, bg = b?.bg;
    return { label, fgSel: fs, bgSel: bs, fg, bg, ratio: fg && bg ? contrast(fg, bg) : null };
  });
}

// ---------- WCAG 2.x contrast ----------
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export function luminance(hex) {
  const h = normHex(hex);
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(h.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
export const grade = (r) => ({ aaNormal: r >= 4.5, aaLarge: r >= 3, aaaNormal: r >= 7, aaaLarge: r >= 4.5 });

// ---------- Audit ----------
// Deterministic checks on index.html. status: pass | warn | fail. line cites the source.
export function audit(html) {
  const rows = [];
  const add = (status, title, detail, line = null) => rows.push({ status, title, detail, line });
  const find = (re) => { const m = html.match(re); return m ? { m, line: lineOf(html, m.index) } : null; };

  const nav = navLinks(html);
  const broken = nav.filter((n) => n.targetLine === null);
  add(nav.length && !broken.length ? 'pass' : 'fail', 'Nav anchors resolve', `${nav.length - broken.length}/${nav.length} nav links point at an element id${broken.length ? `; missing: ${broken.map((b) => b.href).join(', ')}` : ''}.`, nav[0]?.line);

  const h1s = [...html.matchAll(/<h1\b/g)];
  add(h1s.length === 1 ? 'pass' : 'fail', 'Exactly one h1', `${h1s.length} h1 element(s).`, h1s[0] && lineOf(html, h1s[0].index));

  const lang = find(/<html[^>]*\slang="([^"]+)"/);
  add(lang ? 'pass' : 'fail', 'Document language set', lang ? `lang="${lang.m[1]}".` : 'No lang on <html>.', lang?.line);

  const vp = find(/<meta name="viewport"[^>]*>/);
  add(vp ? 'pass' : 'fail', 'Viewport meta present', vp ? 'Mobile viewport declared.' : 'No viewport meta, so phones render at desktop width.', vp?.line);

  const blank = [...html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)];
  const unsafe = blank.filter((m) => !/rel="[^"]*noopener/.test(m[0]));
  add(unsafe.length ? 'fail' : 'pass', 'New-tab links use rel=noopener', `${blank.length - unsafe.length}/${blank.length} target=_blank links carry rel=noopener.`, (unsafe[0] || blank[0]) && lineOf(html, (unsafe[0] || blank[0]).index));

  const mail = [...html.matchAll(/href="mailto:([^"]+)"/g)];
  const placeholder = mail.filter((m) => /@example\.(com|org|net)$/i.test(m[1]));
  add(placeholder.length ? 'fail' : mail.length ? 'pass' : 'warn', 'Contact email is real', placeholder.length ? `mailto uses the reserved placeholder domain (${placeholder[0][1]}), so the main call to action cannot reach anyone. Needs the real address from the site's owner.` : mail.length ? 'mailto points at a non-placeholder domain.' : 'No mailto link.', (placeholder[0] || mail[0]) && lineOf(html, (placeholder[0] || mail[0]).index));

  const desc = find(/<meta name="description"[^>]*>/);
  add(desc ? 'pass' : 'warn', 'Meta description', desc ? 'Present, so search results get a summary.' : 'Missing; search engines will guess a snippet.', desc?.line);
  const og = find(/<meta property="og:/);
  add(og ? 'pass' : 'warn', 'Open Graph tags', og ? 'Present.' : 'No og: tags, so shared links show no title card or image.', og?.line);

  const burger = find(/<(\w+)\b[^>]*class="burger"[^>]*>/);
  if (burger) {
    const t = burger.m[0];
    const ok = burger.m[1] === 'button' || (/role="button"/.test(t) && /tabindex=/.test(t));
    const missing = ['aria-label', 'aria-expanded'].filter((a) => !t.includes(a));
    add(ok && !missing.length ? 'pass' : 'fail', 'Mobile menu toggle is keyboard accessible', ok && !missing.length ? `<${burger.m[1]}> with aria-label and aria-expanded.` : `<${burger.m[1]}>${ok ? '' : ' is not focusable'}${missing.length ? `; missing ${missing.join(', ')}` : ''}.`, burger.line);
  }

  const icons = [...html.matchAll(/<i class="fa[^"]*"[^>]*>/g)];
  const loud = icons.filter((m) => !/aria-hidden="true"/.test(m[0]));
  add(loud.length ? 'warn' : 'pass', 'Decorative icons hidden from screen readers', `${icons.length - loud.length}/${icons.length} icon elements are aria-hidden.`, (loud[0] || icons[0]) && lineOf(html, (loud[0] || icons[0]).index));

  const deps = externalDeps(html);
  const noSri = deps.filter((d) => !d.integrity && !/fonts\.googleapis/.test(d.host));
  add(noSri.length ? 'warn' : 'pass', 'Third-party stylesheet integrity (SRI)', noSri.length ? `${noSri.map((d) => d.host).join(', ')} loads without an integrity hash. Google Fonts is exempt because its CSS varies by browser.` : 'All pinned third-party files carry integrity hashes.', noSri[0]?.line);

  const claims = yearClaims(html);
  const distinct = [...new Set(claims.map((c) => c.years))];
  add(distinct.length > 1 ? 'warn' : 'pass', 'Experience claims agree', distinct.length > 1 ? `The copy says ${claims.map((c) => `"${c.quote}" (line ${c.line})`).join(' and ')}. Only the site's owner can say which is right.` : 'All "over N years" claims match.', claims[0]?.line);

  return rows;
}
