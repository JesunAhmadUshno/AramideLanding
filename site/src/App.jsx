import { useState, useEffect, useRef, useId, useMemo, useCallback } from 'react';
import site from './data/site.json';
import landingCss from '../../style.css?raw';
import { audit, contrast, grade, usagePairs, months, normHex } from './analyze.js';

const REPO = 'https://github.com/JesunAhmadUshno/AramideLanding';
const blob = (p, line) => `${REPO}/blob/main/${p}${line ? `#L${line}` : ''}`;
const LANDING = `${import.meta.env.BASE_URL}landing/index.html`;
const BP = site.mediaQueries.find((m) => m.maxWidth)?.maxWidth;
const yrs = (m) => (m / 12).toFixed(1);

const SECTIONS = [['top', 'Overview', '◎'], ['preview', 'Preview', '▭'], ['sitemap', 'Site map', '☰'], ['timeline', 'Timeline', '▤'], ['tokens', 'Contrast', '◐'], ['audit', 'Audit', '✓'], ['notes', 'Notes', '❯_']];

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.08 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

function MenuBar() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  return (
    <div className="menubar" role="banner">
      <span className="apple" aria-hidden="true">◆</span>
      <a className="app" href="#top">AramideLanding</a>
      <a className="m" href={LANDING}>Open the site</a>
      <a className="m" href={blob('index.html')}>Source</a>
      <a className="m" href={blob('docs/research-review.md')}>Review</a>
      <span className="spacer" />
      <span className="status"><i /> Audited at build</span>
      <a href={REPO}>GitHub ↗</a>
      <span className="clock">{now.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</span>
    </div>
  );
}

function Dock() {
  const [active, setActive] = useState('top');
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-45% 0px -50% 0px' });
    SECTIONS.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);
  return (
    <nav className="dock" aria-label="Sections">
      {SECTIONS.map(([id, label, icon]) => (
        <a key={id} href={`#${id}`} className={active === id ? 'on' : ''} aria-current={active === id ? 'true' : undefined}>
          <span className="ico" aria-hidden="true">{icon}</span><span className="lbl">{label}</span>
        </a>
      ))}
    </nav>
  );
}

function Range({ label, value, min, max, step, onChange, show }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label} <span>{show}</span></label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
    </div>
  );
}

const STATUS = { pass: 'good', warn: 'warn', fail: 'bad' };
const tally = (rows) => ['pass', 'warn', 'fail'].map((s) => [s, rows.filter((r) => r.status === s).length]);

export default function App() {
  useReveal();
  // The shipped landing HTML, fetched from this deployment and audited in the browser.
  const [source, setSource] = useState(null);
  const [error, setError] = useState(null);
  const load = useCallback(() => {
    setError(null);
    fetch(LANDING).then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`)))).then(setSource, (e) => setError(e.message));
  }, []);
  useEffect(load, [load]);
  return (
    <div className="wrap">
      <MenuBar />
      <div className="glow" aria-hidden="true" />
      <Hero source={source} />
      <Preview />
      <SiteMap />
      <Timeline />
      <Tokens />
      <Audit source={source} error={error} reload={load} />
      <Notes />
      <Dock />
      <footer>
        Case study of a client site built by Jesun Ahmad Ushno; this page is not the subject's own site. Every number is computed from <code>index.html</code>, <code>style.css</code> and <code>script.js</code> at build time ({site.commit ? <>commit <code>{site.commit}</code></> : 'local build'}) or live in your browser.
      </footer>
    </div>
  );
}

function Hero({ source }) {
  const rows = useMemo(() => (source ? audit(source) : []), [source]);
  const L = site.lines;
  return (
    <header className="card hero window" id="top" data-title="AramideLanding.app">
      <div className="head">
        <p className="eyebrow">Engineering case study · static site</p>
        <span className="pill info">● No build step, no framework</span>
      </div>
      <h1>A hand-built portfolio site: {site.sections.length} anchored sections, {site.mediaQueries.length} breakpoint and {L['script.js']} lines of JavaScript, audited <em>live</em> from its own source.</h1>
      <p className="sub">
        A one-page portfolio for a data analyst, written in plain HTML, CSS and JavaScript. This dashboard renders the real page, checks every nav anchor,
        measures colour contrast with the WCAG formula and runs a source audit in your browser. Open findings, such as a placeholder email, are reported, not patched with guesses.
      </p>
      <div className="actions">
        <a className="btn primary" href="#preview">Try the responsive preview</a>
        <a className="btn ghost" href="#audit">Read the audit</a>
        <span className="hint">
          {rows.length ? tally(rows).map(([s, n]) => <span key={s} className={`pill ${STATUS[s]}`} style={{ marginRight: 6 }}>{n} {s}</span>) : 'Auditing…'}
        </span>
      </div>
      <div className="tiles">
        <div className="tile"><div className="num">{L['index.html']}</div><div className="cap">Lines of HTML in <code>index.html</code></div></div>
        <div className="tile"><div className="num">{L['style.css']}</div><div className="cap">Lines of CSS, {site.cssRules} rules, {site.keyframes.length} keyframe animations</div></div>
        <div className="tile"><div className="num">{L['script.js']}</div><div className="cap">Lines of JavaScript, {site.jsFunctions.length} functions</div></div>
        <div className="tile"><div className="num">{site.deps.length}</div><div className="cap">External stylesheets, from {site.deps.map((d) => d.host).join(' and ')}</div></div>
      </div>
      <p className="hint" style={{ marginTop: 14 }}>
        Breakpoint: <code>{site.mediaQueries[0]?.query}</code> · Animations: {site.keyframes.map((k) => <code key={k.name} style={{ marginRight: 4 }}>{k.name}</code>)} · Commits in this repo: {site.commits ?? 'n/a'}
      </p>
    </header>
  );
}

function Preview() {
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(390);
  const [box, setBox] = useState(900);
  const boxRef = useRef(null), frame = useRef(null);
  useEffect(() => {
    if (!boxRef.current) return;
    const ro = new ResizeObserver(([e]) => setBox(e.contentRect.width));
    ro.observe(boxRef.current);
    return () => ro.disconnect();
  }, []);
  const scale = Math.min(1, box / width), H = 540;
  const mobile = BP && width <= BP;
  const toggleMenu = () => frame.current?.contentDocument?.querySelector('.burger')?.click();
  return (
    <section id="preview" className="card window reveal" data-title="index.html — Preview">
      <div className="head">
        <div>
          <p className="eyebrow">Live preview · the real page</p>
          <h2>Drag the width across {BP}px and watch the nav fold into a menu.</h2>
        </div>
        <span className={`pill ${mobile ? 'warn' : 'info'}`}>{mobile ? `≤ ${BP}px: mobile layout` : `> ${BP}px: desktop layout`}</span>
      </div>
      <div className="controls">
        <Range label="Viewport width" value={width} min={320} max={1440} step={1} onChange={setWidth} show={`${width}px`} />
        <div className="field">
          <span className="flabel">Presets</span>
          <div className="seg" role="group" aria-label="Width presets">
            {[390, BP, BP + 1, 1440].map((w) => <button key={w} type="button" aria-pressed={width === w} onClick={() => setWidth(w)}>{w}</button>)}
          </div>
        </div>
      </div>
      <div className="frame-box" ref={boxRef} style={{ height: H }}>
        {open ? (
          <iframe ref={frame} title="Landing page preview" src={LANDING}
            style={{ width, height: H / scale, transform: `scale(${scale})` }} />
        ) : (
          <div className="frame-placeholder">
            <button className="btn primary" type="button" onClick={() => setOpen(true)}>Open preview</button>
            <p className="hint">Loads the shipped page from <code>landing/</code>, which also fetches Font Awesome from cdnjs and Poppins from Google Fonts.</p>
          </div>
        )}
      </div>
      <div className="actions" style={{ marginTop: 12 }}>
        <button className="btn ghost" type="button" disabled={!open || !mobile} onClick={toggleMenu}>Toggle the burger menu</button>
        <span className="hint">Rendered at {width}px, scaled to {Math.round(scale * 100)}% to fit. <a href={LANDING}>Open full page ↗</a></span>
      </div>
    </section>
  );
}

function SiteMap() {
  const ok = site.nav.filter((n) => n.targetLine).length;
  return (
    <section id="sitemap" className="card window reveal" data-title="sections.json">
      <div className="head">
        <div>
          <p className="eyebrow">Site map</p>
          <h2>Every nav link lands on a real section.</h2>
        </div>
        <span className={`pill ${ok === site.nav.length ? 'good' : 'bad'}`}>{ok}/{site.nav.length} anchors resolve</span>
      </div>
      <div className="scroll-x">
        <table>
          <thead><tr><th>Link</th><th>Anchor</th><th>Nav line</th><th>Target line</th><th className="wide">Headings in section</th></tr></thead>
          <tbody>
            {site.nav.map((n) => {
              const s = site.sections.find((x) => `#${x.id}` === n.href);
              return (
                <tr key={n.href}>
                  <td>{n.label}</td><td className="mono">{n.href}</td>
                  <td><a href={blob('index.html', n.line)}>L{n.line}</a></td>
                  <td>{n.targetLine ? <a className="ok" href={blob('index.html', n.targetLine)}>L{n.targetLine}</a> : <span className="no">missing</span>}</td>
                  <td className="hint wide">{s ? s.headings.map((h) => h.text).join(' · ') : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Timeline() {
  const [hover, setHover] = useState(null);
  const now = new Date();
  const dated = site.timeline.filter((t) => t.range);
  const undated = site.timeline.filter((t) => !t.range);
  const idx = (p) => (p === 'present' ? now.getFullYear() * 12 + now.getMonth() : p.y * 12 + p.m - 1);
  const lo = Math.min(...dated.map((t) => idx(t.range.start))), hi = Math.max(...dated.map((t) => idx(t.range.end)));
  const pos = (v) => ((v - lo) / (hi - lo)) * 100;
  const years = []; for (let y = Math.ceil(lo / 12); y <= Math.floor(hi / 12); y += 2) years.push(y);
  const longest = dated.filter((t) => t.kind === 'Experience').reduce((a, t) => (months(t.range, now) > months(a.range, now) ? t : a), dated.find((t) => t.kind === 'Experience'));
  const shown = hover ?? longest;
  return (
    <section id="timeline" className="card window reveal" data-title={`timeline — ${dated.length} dated entries`}>
      <p className="eyebrow">Career timeline · parsed from index.html</p>
      <h2>The dates say <em>{yrs(months(longest.range, now))} years</em>; the copy says {site.yearClaims.map((c) => `“${c.quote.toLowerCase()}”`).join(' and ')}.</h2>
      <div className="gantt" role="img" aria-label={`Timeline of ${dated.length} dated entries from ${Math.floor(lo / 12)} to ${Math.floor(hi / 12)}`} style={{ marginTop: 18 }}>
        {dated.map((t) => (
          <div className="g-row" key={t.title} onMouseEnter={() => setHover(t)} onFocus={() => setHover(t)} tabIndex={0}>
            <div className="g-lab"><b>{t.title}</b><small>{t.kind} · {t.date}</small></div>
            <div className="track g-track">
              <div className={`g-bar ${t.kind === 'Education' ? 'edu' : ''} ${t.range.end === 'present' ? 'open' : ''}`}
                style={{ left: `${pos(idx(t.range.start))}%`, width: `${Math.max(1.5, pos(idx(t.range.end)) - pos(idx(t.range.start)))}%` }} />
            </div>
          </div>
        ))}
        <div className="g-row g-axis" aria-hidden="true">
          <div className="g-lab" />
          <div className="g-ticks">{years.map((y) => <span key={y} style={{ left: `${pos(y * 12)}%` }}>{y}</span>)}</div>
        </div>
      </div>
      <div className="legend"><span><i style={{ background: 'var(--primary)' }} />Experience</span><span><i style={{ background: 'var(--warn)' }} />Education</span><span><i style={{ background: 'repeating-linear-gradient(90deg, var(--primary) 0 4px, transparent 4px 7px)' }} />Ends “Present” (measured to today)</span></div>
      <p className="tip">
        <b>{shown.title}</b>, {shown.org}: {shown.date} = {months(shown.range, now)} months ({yrs(months(shown.range, now))} years){shown.range.end === 'present' ? ', counted to today' : ''}. <a href={blob('index.html', shown.line)}>Source L{shown.line}</a>
      </p>
      <div className="grid2" style={{ marginTop: 12 }}>
        <div className="tile">
          <h3>Copy versus dates</h3>
          <p className="hint" style={{ margin: '6px 0 0' }}>
            {site.yearClaims.map((c) => <span key={c.line}>“{c.quote}” at <a href={blob('index.html', c.line)}>L{c.line}</a>. </span>)}
            The longest dated role runs {longest.date}, {yrs(months(longest.range, now))} years. Only the site's owner can say which figure is meant, so this stays an open finding.
          </p>
        </div>
        <div className="tile">
          <h3>Undated entries</h3>
          <p className="hint" style={{ margin: '6px 0 0' }}>{undated.map((t) => <span key={t.title}>{t.title}, {t.org} (<a href={blob('index.html', t.line)}>L{t.line}</a>). </span>)}These have no dates in the source, so they are not drawn.</p>
        </div>
      </div>
    </section>
  );
}

function Tokens() {
  const pairs = useMemo(() => usagePairs(landingCss), []);
  const palette = useMemo(() => [...new Set([...site.tokens.filter((t) => t.value.startsWith('#')).map((t) => normHex(t.value)), ...site.hexColors])], []);
  const tokenName = (hex) => site.tokens.find((t) => t.value.startsWith('#') && normHex(t.value) === hex)?.name;
  const [fg, setFg] = useState(pairs[0].fg), [bg, setBg] = useState(pairs[0].bg);
  const r = contrast(fg, bg), g = grade(r);
  const fid = useId(), bid = useId();
  const below = pairs.filter((p) => p.ratio < 4.5);
  const opt = (c) => <option key={c} value={c}>{c}{tokenName(c) ? ` (${tokenName(c)})` : ''}</option>;
  return (
    <section id="tokens" className="card window reveal" data-title="style.css — Tokens">
      <div className="head">
        <div>
          <p className="eyebrow">Design tokens · WCAG 2.x contrast</p>
          <h2>{below.length} of {pairs.length} text colours fall short of AA for body text.</h2>
        </div>
        <span className={`pill ${below.length ? 'warn' : 'good'}`}>{below.length ? `${below.length} below 4.5:1` : 'All pass AA'}</span>
      </div>
      <div className="swatches">
        {site.tokens.filter((t) => t.value.startsWith('#')).map((t) => (
          <div key={t.name} className="swatch"><i style={{ background: t.value }} /><b className="mono">{t.name}</b><small className="mono">{t.value}</small></div>
        ))}
      </div>
      <div className="grid2" style={{ marginTop: 18 }}>
        <div>
          <h3 style={{ marginBottom: 10 }}>Contrast calculator</h3>
          <div className="controls" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="field"><label htmlFor={fid}>Text</label><select id={fid} value={fg} onChange={(e) => setFg(e.target.value)}>{palette.map(opt)}</select></div>
            <div className="field"><label htmlFor={bid}>Background</label><select id={bid} value={bg} onChange={(e) => setBg(e.target.value)}>{palette.map(opt)}</select></div>
          </div>
          <div className="sample" style={{ color: fg, background: bg }}>
            <span className="ratio">{r.toFixed(2)}:1</span>
            <span>Aa: sample body text at 14px</span>
          </div>
          <div className="pills">
            {[['AA normal', g.aaNormal], ['AA large', g.aaLarge], ['AAA normal', g.aaaNormal], ['AAA large', g.aaaLarge]].map(([k, v]) => <span key={k} className={`pill ${v ? 'good' : 'bad'}`}>{v ? '✓' : '✕'} {k}</span>)}
          </div>
          <p className="hint">Normal text needs 4.5:1 for AA and 7:1 for AAA; large text (24px, or 18.7px bold) needs 3:1 and 4.5:1.</p>
        </div>
        <div>
          <h3 style={{ marginBottom: 10 }}>Pairs the page renders <span className="hint">(click to load)</span></h3>
          <div className="bars">
            {pairs.map((p) => (
              <button type="button" key={p.label} className={`bar-row pair ${p.fg === fg && p.bg === bg ? 'sel' : ''}`} onClick={() => { setFg(p.fg); setBg(p.bg); }}>
                <span className="lab"><span>{p.label} <small className="mono">{p.fgSel}</small></span><b className={p.ratio >= 4.5 ? 'ok' : 'no'}>{p.ratio.toFixed(2)}</b></span>
                <span className="track"><span className="fill" style={{ width: `${(Math.min(p.ratio, 21) / 21) * 100}%`, background: p.ratio >= 4.5 ? 'var(--good)' : p.ratio >= 3 ? 'var(--warn)' : 'var(--bad)' }} /><span className="alpha" style={{ left: `${(4.5 / 21) * 100}%` }} /></span>
              </button>
            ))}
          </div>
          <p className="hint">Dashed line marks 4.5:1. Colours are resolved from <a href={blob('style.css')}>style.css</a>; which element sits on which background follows the DOM of index.html.</p>
        </div>
      </div>
    </section>
  );
}

function Audit({ source, error, reload }) {
  const [draft, setDraft] = useState(null);
  const text = draft ?? source;
  const rows = useMemo(() => (text ? audit(text) : []), [text]);
  const tid = useId();
  return (
    <section id="audit" className="card window reveal" data-title="audit.log">
      <div className="head">
        <div>
          <p className="eyebrow">Source audit · runs in your browser</p>
          <h2>{rows.length} deterministic checks on the shipped HTML.</h2>
        </div>
        <div className="pills" style={{ margin: 0 }}>{tally(rows).map(([s, n]) => <span key={s} className={`pill ${STATUS[s]}`}>{n} {s}</span>)}</div>
      </div>
      {error && <p className="no">Could not load landing/index.html ({error}). <button className="btn ghost" type="button" onClick={reload}>Retry</button></p>}
      <ol className="log">
        {rows.map((r) => (
          <li key={r.title} className={r.status}>
            <span className={`pill ${STATUS[r.status]}`}>{r.status}</span>
            <div><b>{r.title}</b><div className="hint">{r.detail}</div></div>
            {r.line ? (draft === null ? <a className="mono" href={blob('index.html', r.line)}>L{r.line}</a> : <span className="mono hint">L{r.line}</span>) : <span />}
          </li>
        ))}
      </ol>
      <details className="editor">
        <summary>Edit the HTML and watch the audit re-run</summary>
        <label htmlFor={tid} className="hint">Your edits stay in this tab. Try fixing the email or adding an og:title meta tag.</label>
        <textarea id={tid} spellCheck={false} value={text ?? ''} onChange={(e) => setDraft(e.target.value)} />
        <div className="actions" style={{ marginTop: 10 }}>
          <button className="btn ghost" type="button" disabled={draft === null} onClick={() => setDraft(null)}>Reset to shipped source</button>
          {draft !== null && <span className="pill warn">Auditing your edited copy</span>}
        </div>
      </details>
      <p className="hint">Static checks on the source text, the same functions as <code>site/src/audit.check.mjs</code>, which runs on every build. They are not a substitute for a screen-reader or Lighthouse pass.</p>
    </section>
  );
}

function Notes() {
  return (
    <section id="notes" className="card window reveal" data-title="README.md">
      <p className="eyebrow">Engineering notes</p>
      <h2>What it is, what changed, and what is still open.</h2>
      <div className="grid2" style={{ marginTop: 16 }}>
        <div className="tile"><h3>Stack</h3><p className="hint">Plain HTML, CSS and JavaScript, no build step and no framework. One <code>@media</code> breakpoint at {BP}px, {site.tokens.length} CSS custom properties, and {site.deps.length} CDN stylesheets. It opens straight from the file system.</p></div>
        <div className="tile"><h3>Deploy</h3><p className="hint"><code>.github/workflows/pages.yml</code> builds this dashboard and serves the untouched page at <code>/AramideLanding/landing/</code>. The build copies the three files byte for byte; it does not rewrite them.</p></div>
        <div className="tile"><h3>Changed in this repo</h3><p className="hint">The burger menu became a real button with <code>aria-label</code> and <code>aria-expanded</code>; icons became <code>aria-hidden</code>; the LinkedIn link got <code>rel="noopener noreferrer"</code>; a meta description reuses the hero text. Nothing visible changed.</p></div>
        <div className="tile"><h3>Open, needs the site's owner</h3><p className="hint">The contact email is a placeholder on <code>example.com</code>, and the copy gives two different year counts. Both need real values; guessing would put words in the subject's mouth.</p></div>
        <div className="tile"><h3>Limits of this dashboard</h3><p className="hint">The audit is regex-based static analysis of one file, not a browser accessibility scan. Contrast pairs assume the background named in the DOM, not overlays or hover states. There is no traffic or user data, so nothing here measures how the site performs with visitors.</p></div>
        <div className="tile"><h3>Review</h3><p className="hint">The grade, gaps and what each remaining gap needs are in <a href={blob('docs/research-review.md')}>docs/research-review.md</a>. Run the checks locally with <code>cd site && npm ci && npm test</code>.</p></div>
      </div>
    </section>
  );
}
