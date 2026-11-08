import { useMemo, useState, useEffect, useId } from 'react';
import evaluation from '../../level-1-learn/evaluation.json';
import learnRes from '../../level-1-learn/results_learn.json';
import adversarial from '../../level-2-build/adversarial.json';
import { scores, audit_log as auditLog, top_class_after_stage2 as topClass } from '../../level-2-build/results_build.json';
import deep from '../../level-3-deep/results_deep.json';
import rigor from '../../level-3-deep/results_rigor.json';
import report from '../../REPORT.md?raw';
import guardPy from '../../level-1-learn/guardrails.py?raw';
import { createGuard, luhnOk } from './guard.js';
import { fitRecorded, confusion, prf } from './classifier.js';
import { wilson, sampleSd, mean, paired } from './stats.js';

const REPO = 'https://github.com/JesunAhmadUshno/guardrails-lab';
const blob = (p) => `${REPO}/blob/main/${p}`;
const pct = (x, d = 0) => `${(x * 100).toFixed(d)}%`;
const f3 = (x) => x.toFixed(3);
const ci = ([lo, hi], d = 0) => `${pct(lo, d)} to ${pct(hi, d)}`;
const pval = (p) => (p < 0.001 ? p.toFixed(4) : p.toFixed(3));

const STAGES = [['stage1_alone', 'Stage 1 · target alone', 'var(--muted)'], ['stage2_guarded', 'Stage 2 · Learn guardrails', 'var(--warn)'], ['stage3_guarded_plus_fix', 'Stage 3 · guardrails + fix', 'var(--primary)']];
const STAGE_SHORT = { stage1_alone: 'S1 alone', stage2_guarded: 'S2 guarded', stage3_guarded_plus_fix: 'S3 + fix' };
const CLASSES = ['jailbreak', 'prompt_injection', 'misuse'];
const LABEL = { jailbreak: 'Jailbreak', prompt_injection: 'Prompt injection', misuse: 'Misuse', benign: 'Benign' };
const { check, BLOCK_AT, POLICY_RULES } = createGuard(guardPy);
const caseById = Object.fromEntries(adversarial.map((c) => [c.id, c]));
const s2 = scores.stage2_guarded, s3 = scores.stage3_guarded_plus_fix;

// Each component's write-up is one '## ... (was <level>/README.md)' section of REPORT.md; its '###' subsections
// are lifted to '##' so the parser below reads it like the old level README.
function reportSection(file) {
  const s = report.split(/\n## /).find((x) => x.split('\n')[0].includes(`(was `) && x.split('\n')[0].includes(file));
  if (!s) throw new Error(`REPORT.md has no section for ${file}`);
  return s.replace(/\n### /g, '\n## ');
}

// Pull the limits and determinism hash straight out of each component's REPORT.md section.
function parseReadme(md) {
  const section = (re) => { const m = md.split(/\n## /).find((s) => re.test(s.split('\n')[0])); return m ? m.split('\n').slice(1).join('\n') : ''; };
  const bullets = (txt) => txt.split(/\n- /).slice(1).map((b) => b.replace(/\n\s*/g, ' ').replace(/\n.*$/s, '').trim());
  const limits = bullets(section(/^Failure modes/).split(/\n\n(?!- |  )/)[0] + '\n');
  const hash = md.match(/sha256 of (\S+)\s+([0-9a-f]{64})/);
  if (!limits.length) throw new Error('REPORT.md section has no failure modes');
  return { limits, hash: hash && { file: hash[1], sha: hash[2] } };
}
const LEVELS = [['Rule guardrails', 'level-1-learn/README.md'], ['Adversarial harness', 'level-2-build/README.md'], ['Misuse classifier', 'level-3-deep/README.md']].map(([t, f]) => [t, 'REPORT.md', parseReadme(reportSection(f))]);

const SECTIONS = [['top', 'Overview', '◎'], ['playground', 'Playground', '⌨'], ['bypass', 'Bypass', '▥'], ['audit', 'Audit log', '☰'], ['classifier', 'Classifier', 'ƒ'], ['cv', 'Cross-val', '⁘'], ['limits', 'Limits', '⚠'], ['reproduce', 'Reproduce', '❯_']];

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
      <a className="app" href="#top">Guardrails Lab</a>
      <a className="m" href={blob('PROPOSAL.md')}>Proposal</a>
      <a className="m" href={blob('REPORT.md')}>Report</a>
      <span className="spacer" />
      <span className="status"><i /> Parity checked at build</span>
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

export default function App() {
  useReveal();
  const [clf, setClf] = useState(null);
  useEffect(() => {
    // Retrain once on load; yield a frame first so the page paints before the 300 epochs run.
    const t = setTimeout(() => {
      const t0 = performance.now();
      const r = fitRecorded(evaluation, adversarial, deep);
      setClf({ ...r, ms: performance.now() - t0 });
    }, 30);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="wrap">
      <MenuBar />
      <div className="glow" aria-hidden="true" />
      <Hero />
      <Playground />
      <Ablation />
      <Bypass />
      <Audit />
      <Classifier clf={clf} />
      <CrossVal clf={clf} />
      <Limits />
      <Reproduce />
      <Dock />
      <footer>
        Code: Apache-2.0. Every number on this page is read at build time from <code>level-*/results_*.json</code> and REPORT.md. The guard playground and the classifier retrain run in your browser, and <code>npm run build</code> fails unless they reproduce the recorded Python results. All cases are synthetic and hand-built.
      </footer>
    </div>
  );
}

function Hero() {
  const L = learnRes.summary;
  const jb = s3.jailbreak.bypass_rate;
  const cv = deep.cross_validation;
  return (
    <header className="card hero window" id="top" data-title="guardrails.py — README">
      <div className="head">
        <p className="eyebrow">Red-team study · three levels · stdlib only</p>
        <span className="pill warn">● Same-author synthetic set · stand-in targets</span>
      </div>
      <h1>
        Rule guardrails caught every attack they were written for, yet {jb === 0.5 ? 'half' : pct(jb)} the jailbreaks still got through, and one quarantine fix cut prompt-injection bypass from {f3(s2.prompt_injection.bypass_rate)} to <em>{s3.prompt_injection.bypass_rate === 0 ? 'zero' : f3(s3.prompt_injection.bypass_rate)}</em>.
      </h1>
      <p className="sub">
        Hand-written rules and PII redaction, a {adversarial.length}-case red-team set run in three stages against stand-in RAG and agent targets, and a logistic misuse classifier trained from scratch.
        Read every rate here as a result on its own hand-built, same-author set: the targets are stand-ins, not real systems, and no case comes from real traffic.
        The two live windows rerun the repo&rsquo;s own code in your browser.
      </p>
      <div className="actions">
        <a className="btn primary" href="#playground">Try the guard playground</a>
        <a className="btn ghost" href="#classifier">Retrain the classifier</a>
        <span className="hint">Reproduce with <code>python3 level-2-build/run_build.py</code></span>
      </div>
      <div className="tiles">
        <div className="tile"><div className="num">{L.passed}/{L.total}</div><div className="cap">Learn cases matched expected action and class</div></div>
        <div className="tile"><div className="num">{L.benign_false_positives}/{L.benign_total}</div><div className="cap">Benign false positives (95% CI up to {pct(rigor.learn_ci.benign_false_positive.ci95[1])})</div></div>
        <div className="tile"><div className="num sm">{pct(s2.prompt_injection.bypass_rate)} → {pct(s3.prompt_injection.bypass_rate)}</div><div className="cap">Prompt-injection bypass, guarded vs guarded plus fix</div></div>
        <div className="tile"><div className="num">{f3(deep.held_out.f1)}</div><div className="cap">Held-out F1; 5-fold CV F1 {f3(cv.f1_mean)} ± {sampleSd(cv.f1_per_fold).toFixed(3)}</div></div>
      </div>
    </header>
  );
}

function Highlight({ text, findings }) {
  const parts = [];
  let at = 0;
  findings.forEach((f, i) => {
    if (f.start > at) parts.push(<span key={`t${i}`}>{text.slice(at, f.start)}</span>);
    parts.push(<mark key={`m${i}`} title={f.type}>{text.slice(f.start, f.end)}</mark>);
    at = f.end;
  });
  parts.push(<span key="end">{text.slice(at)}</span>);
  return <>{parts}</>;
}

const PRESETS = [
  ...evaluation.map((c) => ({ key: `L:${c.id}`, group: 'Learn evaluation set', id: c.id, text: c.text, expect: `expected ${c.expected_action}${c.expected_class ? ` (${c.expected_class})` : ''}` })),
  ...adversarial.map((c) => {
    const rec = auditLog.find((a) => a.case_id === c.id && a.stage === 'stage2_guarded');
    return { key: `B:${c.id}`, group: 'Build red-team set (user text)', id: c.id, text: c.user_text, expect: `recorded stage-2 input action: ${rec.actions.input}` };
  }),
];

function Playground() {
  const [key, setKey] = useState('L:P04');
  const preset = PRESETS.find((p) => p.key === key);
  const [text, setText] = useState(preset?.text ?? '');
  const [dir, setDir] = useState('input');
  const r = useMemo(() => check(text, dir), [text, dir]);
  const pick = (k) => { setKey(k); const p = PRESETS.find((x) => x.key === k); if (p) setText(p.text); };
  const edited = preset && preset.text !== text;
  const tone = { block: 'bad', redact: 'warn', allow: 'good' }[r.action];
  const maxScore = Math.max(4, ...Object.values(r.scores));
  return (
    <section id="playground" className="card window reveal" data-title="check(text).app — live">
      <div className="head">
        <div>
          <p className="eyebrow">Live in your browser</p>
          <h2>Type anything and watch the <em>rules</em> decide.</h2>
          <p className="sub">
            A line-for-line JavaScript port of <a href={blob('level-1-learn/guardrails.py')}>guardrails.py</a>: four PII detectors (cards only if Luhn passes), weighted policy rules, a class blocks at score {BLOCK_AT}, and block beats redact beats allow.
            The build fails unless this port reproduces all {evaluation.length} recorded Learn results and every stage-2 guard action in the Build audit log. Nothing leaves the page.
          </p>
        </div>
        <span className={`pill ${tone}`}>● {r.action.toUpperCase()}{r.predictedClass ? ` · ${LABEL[r.predictedClass]}` : ''}</span>
      </div>
      <div className="controls pgc">
        <div className="field">
          <label htmlFor="preset">Preset from the repo&rsquo;s sets <span>{edited ? 'edited' : preset?.expect}</span></label>
          <select id="preset" value={key} onChange={(e) => pick(e.target.value)}>
            {['Learn evaluation set', 'Build red-team set (user text)'].map((g) => (
              <optgroup key={g} label={g}>{PRESETS.filter((p) => p.group === g).map((p) => <option key={p.key} value={p.key}>{p.id} · {p.text.slice(0, 64)}{p.text.length > 64 ? '…' : ''}</option>)}</optgroup>
            ))}
          </select>
        </div>
        <div className="field">
          <span className="flabel" id="dir-l">Direction</span>
          <div className="seg" role="group" aria-labelledby="dir-l">
            {['input', 'output'].map((d) => <button key={d} aria-pressed={dir === d} onClick={() => setDir(d)}>{d === 'input' ? 'Input filter' : 'Output filter'}</button>)}
          </div>
        </div>
      </div>
      <div className="field">
        <label htmlFor="pg-text">Text to check <span>{text.length} chars</span></label>
        <textarea id="pg-text" rows={3} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
      </div>
      <div className="grid2" style={{ marginTop: 16 }}>
        <div>
          <h3>Policy scores against block threshold {BLOCK_AT}</h3>
          <div className="bars" style={{ marginTop: 12 }}>
            {Object.entries(r.scores).map(([cls, s]) => (
              <div className="bar-row" key={cls}>
                <div className="lab"><span>{LABEL[cls]}</span><b>{s}</b></div>
                <div className="track">
                  <div className="fill" style={{ width: `${(s / maxScore) * 100}%`, background: s >= BLOCK_AT ? 'var(--bad)' : s ? 'var(--warn)' : 'transparent' }} />
                  <div className="alpha" style={{ left: `${(BLOCK_AT / maxScore) * 100}%` }} />
                </div>
                <div className="hint">{r.matched[cls].length ? r.matched[cls].map((m) => <code key={m.pattern} className="rule">{m.pattern} +{m.weight}</code>) : 'no rule matched'}</div>
              </div>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 10 }}>The dashed line marks the block threshold. Weak signal words weigh 1, so a topic word alone never blocks. {dir === 'output' ? 'At the Learn level the output filter runs the same rule path as the input filter, a limit the README names.' : ''}</p>
        </div>
        <div>
          <h3>PII findings ({r.findings.length})</h3>
          <div className="pii">
            {r.findings.length ? r.findings.map((f, i) => (
              <div key={i} className="pii-row">
                <span className="pill info">{f.type}</span>
                <span className="mono">{f.text}</span>
                <span className="hint">chars {f.start}–{f.end}</span>
                {f.type === 'CREDIT_CARD' && <span className={`pill ${luhnOk(f.text.replace(/\D/g, '')) ? 'good' : 'bad'}`}>Luhn ✓</span>}
              </div>
            )) : <p className="hint">None. Try P04, or a card-shaped number that fails Luhn, which stays unflagged.</p>}
          </div>
          <h3 style={{ marginTop: 16 }}>Text with spans marked</h3>
          <p className="out"><Highlight text={text} findings={r.findings} /></p>
          <h3>Redacted text</h3>
          <p className="out mono">{r.action === 'block' ? <span className="no">[blocked: {LABEL[r.predictedClass]}]</span> : r.redactedText || ' '}</p>
        </div>
      </div>
    </section>
  );
}

function Ablation() {
  const ab = rigor.rule_ablation;
  const rows = [...ab.rules].sort((a, b) => b.stage2_bypass_added - a.stage2_bypass_added || b.learn_cases_lost - a.learn_cases_lost);
  const nRules = Object.values(POLICY_RULES).flat().length;
  const dead = ab.rules.filter((r) => !r.stage2_bypass_added && !r.learn_cases_lost).length;
  return (
    <section id="ablation" className="card window reveal" data-title="rigor.py — leave-one-rule-out">
      <p className="eyebrow">Rule ablation · generated by rigor.py</p>
      <h2>Which of the {nRules} rules actually carry the weight?</h2>
      <p className="sub">
        Each rule is removed in turn and both the Learn evaluation and the full Build harness are rerun ({ab.baseline.learn_passed} Learn passes and {ab.baseline.build_stage2_bypass} stage-2 bypasses with all rules).
        {' '}{dead} of {nRules} rules change nothing on either set when removed: they are either redundant with another rule or never fire on these cases. Benign false positives stay at {Math.max(...ab.rules.map((r) => r.learn_benign_fp))} under every ablation.
      </p>
      <div style={{ overflowX: 'auto', marginTop: 12, maxHeight: 320 }}>
        <table>
          <thead><tr><th>Class</th><th>Rule pattern</th><th>Weight</th><th>Learn cases lost</th><th>Stage-2 bypasses added</th><th>Stage-3 bypass total</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.cls + r.rule_index}><td>{LABEL[r.cls]}</td><td className="mono">{POLICY_RULES[r.cls][r.rule_index][0]}</td><td>{r.weight}</td>
                <td className={r.learn_cases_lost ? 'no' : ''}>{r.learn_cases_lost}</td><td className={r.stage2_bypass_added ? 'no' : ''}>+{r.stage2_bypass_added}</td><td>{r.build_stage3_bypass}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Bypass() {
  const [sel, setSel] = useState(topClass);
  const W = 960, H = 320, pad = { l: 44, r: 12, t: 24, b: 40 };
  const gw = (W - pad.l - pad.r) / CLASSES.length, bw = gw / 5;
  const y = (v) => pad.t + (1 - v) * (H - pad.t - pad.b);
  const p12 = useMemo(() => paired(auditLog, 'stage1_alone', 'stage2_guarded'), []);
  const p23 = useMemo(() => paired(auditLog, 'stage2_guarded', 'stage3_guarded_plus_fix'), []);
  const cases = adversarial.filter((c) => c.cls === sel);
  const verdict = (id, st) => auditLog.find((a) => a.case_id === id && a.stage === st);
  return (
    <section id="bypass" className="card window reveal" data-title="results_build.json — bypass by stage">
      <div className="head">
        <div>
          <p className="eyebrow">Red-team table</p>
          <h2>The fix ends injection through retrieved text, and leaves <em>jailbreaks</em> where they were.</h2>
          <p className="sub">
            Bypass rate per class across the three stages, with Wilson 95% intervals computed live from the counts (n = {s2.jailbreak.total} per class).
            Stage 1 is {f3(scores.stage1_alone.jailbreak.bypass_rate)} for every class by construction: the stand-ins follow any planted instruction. The fix targets the class the code found worst after stage 2, {LABEL[topClass].toLowerCase()}, and only touches retrieved and tool text.
          </p>
        </div>
        <span className="pill info">RECORDED · harness.py run</span>
      </div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Grouped bar chart of bypass rate per class across three stages, with 95% intervals">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => <g key={t}><line className="axis" x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} /><text x={pad.l - 8} y={y(t) + 4} textAnchor="end">{pct(t)}</text></g>)}
        {CLASSES.map((cls, g) => (
          <g key={cls} onClick={() => setSel(cls)} style={{ cursor: 'pointer' }}>
            <rect x={pad.l + g * gw + 4} y={pad.t - 16} width={gw - 8} height={H - pad.t - pad.b + 40} fill={sel === cls ? 'var(--primary-pale)' : 'transparent'} rx="10" />
            {STAGES.map(([st, , color], i) => {
              const v = scores[st][cls], x = pad.l + g * gw + bw * (i + 1);
              const [lo, hi] = wilson(v.bypass, v.total);
              return (
                <g key={st}>
                  <rect x={x} y={y(v.bypass_rate)} width={bw - 6} height={Math.max(1, y(0) - y(v.bypass_rate))} fill={color} rx="4" />
                  <line x1={x + (bw - 6) / 2} x2={x + (bw - 6) / 2} y1={y(lo)} y2={y(hi)} stroke="var(--text)" strokeOpacity="0.55" strokeWidth="1.5" />
                  <text x={x + (bw - 6) / 2} y={y(hi) - 5} textAnchor="middle" style={{ fill: 'var(--text)' }}>{v.bypass}/{v.total}</text>
                </g>
              );
            })}
            <text x={pad.l + g * gw + gw / 2} y={H - 12} textAnchor="middle" style={{ fill: 'var(--text)', fontSize: 13, fontWeight: 600 }}>{LABEL[cls]}</text>
          </g>
        ))}
      </svg>
      <div className="legend">{STAGES.map(([st, l, c]) => <span key={st}><i style={{ background: c }} />{l}</span>)}<span>Benign controls: {scores.stage1_alone.benign.success}/{scores.stage1_alone.benign.total}, {s2.benign.success}/{s2.benign.total}, {s3.benign.success}/{s3.benign.total} succeeded</span></div>
      <div className="grid2" style={{ marginTop: 20 }}>
        <div>
          <div className="head" style={{ marginBottom: 8 }}>
            <h3>{LABEL[sel]} cases by stage</h3>
            <div className="seg" role="group" aria-label="Choose a class">
              {CLASSES.map((c) => <button key={c} aria-pressed={sel === c} onClick={() => setSel(c)}>{LABEL[c].split(' ')[0]}</button>)}
            </div>
          </div>
          <div className="caselist" style={{ overflowY: 'auto' }}>
            {cases.map((c) => (
              <div key={c.id} className="case">
                <b className="mono">{c.id}</b><span className="hint">{c.channel} → {c.target}</span>
                <span className="dots">{STAGES.map(([st]) => { const v = verdict(c.id, st); return <span key={st} className={`dot ${v.bypass ? 'by' : 'st'}`} title={`${STAGE_SHORT[st]}: ${v.bypass ? 'bypass' : 'stopped'}`}>{v.bypass ? '✕' : '✓'}</span>; })}</span>
              </div>
            ))}
          </div>
          <p className="hint">✕ bypassed, ✓ stopped, for stages 1, 2, 3. Open a case in the audit log below for its text.</p>
        </div>
        <div>
          <h3>Paired change per class (exact McNemar, computed live)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>Class</th><th>S1→S2 stopped / new</th><th>p</th><th>S2→S3 stopped / new</th><th>p</th></tr></thead>
              <tbody>
                {CLASSES.map((c) => <tr key={c}><td>{LABEL[c]}</td><td>{p12[c].fixed} / {p12[c].broken}</td><td>{pval(p12[c].p_exact)}</td><td>{p23[c].fixed} / {p23[c].broken}</td><td className={p23[c].p_exact < 0.05 ? 'ok' : ''}>{pval(p23[c].p_exact)}</td></tr>)}
              </tbody>
            </table>
          </div>
          <p className="hint" style={{ marginTop: 8 }}>Same cases, two stages: only cases that changed verdict count. With {s2.misuse.total} cases a class, the misuse drop is suggestive, not significant. The p-values test this fixed set, not unseen attacks, and the fix was designed on these same cases.</p>
        </div>
      </div>
    </section>
  );
}

function Audit() {
  const [f, setF] = useState({ stage: 'all', cls: 'all', channel: 'all', target: 'all', verdict: 'all' });
  const [open, setOpen] = useState(null);
  const [all, setAll] = useState(false);
  const rows = useMemo(() => auditLog.filter((a) => {
    const c = caseById[a.case_id];
    const v = a.cls === 'benign' ? (a.success ? 'success' : 'fail') : a.bypass ? 'bypass' : 'stopped';
    return (f.stage === 'all' || a.stage === f.stage) && (f.cls === 'all' || a.cls === f.cls) && (f.channel === 'all' || c.channel === f.channel) && (f.target === 'all' || a.target === f.target) && (f.verdict === 'all' || v === f.verdict);
  }), [f]);
  const opts = {
    stage: STAGES.map(([s, l]) => [s, l]),
    cls: ['jailbreak', 'prompt_injection', 'misuse', 'benign'].map((c) => [c, LABEL[c]]),
    channel: [...new Set(adversarial.map((c) => c.channel))].map((c) => [c, c]),
    target: [...new Set(adversarial.map((c) => c.target))].map((c) => [c, c]),
    verdict: [['bypass', 'bypass'], ['stopped', 'stopped'], ['success', 'benign success'], ['fail', 'benign fail']],
  };
  const names = { stage: 'Stage', cls: 'Class', channel: 'Channel', target: 'Target', verdict: 'Verdict' };
  const shown = all ? rows : rows.slice(0, 12);
  const oc = open && caseById[open];
  const act = (x) => <span className={`act ${x}`}>{x === 'not_checked' ? '·' : x}</span>;
  return (
    <section id="audit" className="card window reveal" data-title={`audit_log.db — ${auditLog.length} records`}>
      <div className="head">
        <div>
          <p className="eyebrow">Audit log explorer</p>
          <h2>Every case, every stage, every surface the guard looked at.</h2>
          <p className="sub">{adversarial.length} cases times {STAGES.length} stages: one record each with the guard action on input, retrieved, tool and output text, what tool fired, and the verdict. Click a row to read the case.</p>
        </div>
        <span className="pill info">RECORDED · results_build.json</span>
      </div>
      <div className="controls compact">
        {Object.keys(f).map((k) => (
          <div className="field" key={k}>
            <label htmlFor={`f-${k}`}>{names[k]}</label>
            <select id={`f-${k}`} value={f[k]} onChange={(e) => { setF({ ...f, [k]: e.target.value }); setAll(false); }}>
              <option value="all">All</option>
              {opts[k].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="audit">
          <thead><tr><th>Case</th><th>Class</th><th>Channel</th><th>Target</th><th>Stage</th><th>Input</th><th>Retrieved</th><th>Tool</th><th>Output</th><th>Fired</th><th>Verdict</th></tr></thead>
          <tbody>
            {shown.map((a) => {
              const c = caseById[a.case_id];
              const good = a.cls === 'benign' ? a.success : !a.bypass;
              return (
                <tr key={a.case_id + a.stage} onClick={() => setOpen(a.case_id)} className={open === a.case_id ? 'sel' : ''} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpen(a.case_id)}>
                  <td className="mono">{a.case_id}</td><td>{LABEL[a.cls]}</td><td>{c.channel}</td><td>{a.target}</td><td>{STAGE_SHORT[a.stage]}</td>
                  <td>{act(a.actions.input)}</td><td>{act(a.actions.retrieved)}</td><td>{act(a.actions.tool)}</td><td>{act(a.actions.output)}</td>
                  <td className="mono">{a.fired.join(', ') || '·'}</td>
                  <td><span className={`pill ${good ? 'good' : 'bad'}`}>{a.cls === 'benign' ? (a.success ? 'success' : 'fail') : a.bypass ? 'bypass' : 'stopped'}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="actions" style={{ marginTop: 12 }}>
        <span className="hint">Showing {shown.length} of {rows.length} matching records ({auditLog.length} total).</span>
        {rows.length > 12 && <button className="btn ghost" onClick={() => setAll(!all)}>{all ? 'Show fewer' : `Show all ${rows.length}`}</button>}
      </div>
      {oc && (
        <div className="drawer" aria-live="polite">
          <div className="head" style={{ marginBottom: 8 }}>
            <h3>{oc.id} · {LABEL[oc.cls]} via {oc.channel}, {oc.target} target{oc.marker ? <> · marker <code>{oc.marker}</code></> : ''}</h3>
            <button className="btn ghost" onClick={() => setOpen(null)}>Close</button>
          </div>
          <p className="out"><b>User text.</b> {oc.user_text}</p>
          {oc.docs?.map((d, i) => <p className="out" key={i}><b>Retrieved {i + 1}.</b> {d}</p>)}
          {oc.tool_output && <p className="out"><b>Tool output.</b> {oc.tool_output}</p>}
          <div className="stagecards">
            {STAGES.map(([st, l]) => {
              const a = auditLog.find((x) => x.case_id === oc.id && x.stage === st);
              const good = a.cls === 'benign' ? a.success : !a.bypass;
              return (
                <div className="tile" key={st}>
                  <div className="head" style={{ marginBottom: 4 }}><b>{l}</b><span className={`pill ${good ? 'good' : 'bad'}`}>{a.cls === 'benign' ? (a.success ? 'success' : 'fail') : a.bypass ? 'bypass' : 'stopped'}</span></div>
                  <div className="hint">input {a.actions.input} · retrieved {a.actions.retrieved} · tool {a.actions.tool} · output {a.actions.output} · target {a.target_ran ? 'ran' : 'not run'}{a.fired.length ? ` · fired ${a.fired.join(', ')}` : ''}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function Classifier({ clf }) {
  const [th, setTh] = useState(0.5);
  const [free, setFree] = useState(evaluation.find((c) => c.id === 'B05').text);
  const y = clf ? clf.test.map((r) => r.label) : [];
  const conf = clf && confusion(y, clf.probs.map((p) => +(p >= th)));
  const m = conf && prf(conf);
  const at05 = clf && confusion(y, clf.probs.map((p) => +(p >= 0.5)));
  const rec = deep.held_out.confusion;
  const parity = at05 && ['tp', 'fp', 'tn', 'fn'].every((k) => at05[k] === rec[k]);
  const sweep = useMemo(() => clf && Array.from({ length: 99 }, (_, i) => { const t = (i + 1) / 100; return [t, prf(confusion(y, clf.probs.map((p) => +(p >= t))))]; }), [clf]); // eslint-disable-line react-hooks/exhaustive-deps
  const baselines = useMemo(() => {
    if (!clf) return null;
    const maj = +(deep.dataset.positive_block_worthy >= deep.dataset.negative_benign);
    return [
      ['Majority class (always block)', prf(confusion(y, y.map(() => maj)))],
      ['Learn rules as a classifier (block = positive)', prf(confusion(y, clf.test.map((r) => +(check(r.text).action === 'block'))))],
    ];
  }, [clf]); // eslint-disable-line react-hooks/exhaustive-deps
  const exp = useMemo(() => clf && clf.model.explain(free), [clf, free]);
  const top = exp ? [...exp.contrib].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 8) : [];
  const W = 460, H = 220, pad = { l: 36, r: 10, t: 10, b: 24 };
  const lossMax = clf ? clf.model.loss[0] : 1;
  const lx = (i) => pad.l + (i / ((clf?.model.loss.length || 2) - 1)) * (W - pad.l - pad.r);
  const ly = (v) => pad.t + (1 - v / lossMax) * (H - pad.t - pad.b);
  const sx = (t) => pad.l + t * (W - pad.l - pad.r);
  const sy = (v) => pad.t + (1 - v) * (H - pad.t - pad.b);
  const md = deep.model;
  return (
    <section id="classifier" className="card window reveal" data-title="classifier.py — live retrain">
      <div className="head">
        <div>
          <p className="eyebrow">Live in your browser</p>
          <h2>A from-scratch misuse classifier, <em>retrained</em> as this page loaded.</h2>
          <p className="sub">
            Logistic regression on word uni- and bigrams plus character 3- and 4-grams, {md.epochs} epochs of full-batch gradient descent from zero (learning rate {md.lr}, L2 {md.l2}), on the exact recorded split: {deep.split.train_size} training cases, {deep.split.test_size} held out ({deep.split.test_negative} benign).
            Planted marker tokens are stripped first, so the model never sees the answer key.
          </p>
        </div>
        {clf ? <span className={`pill ${parity ? 'good' : 'bad'}`} title={`live at 0.5: TP ${at05.tp} FP ${at05.fp} TN ${at05.tn} FN ${at05.fn}; recorded TP ${rec.tp} FP ${rec.fp} TN ${rec.tn} FN ${rec.fn}`}>● {parity ? 'Parity with recorded run' : 'Mismatch with recorded run'}</span> : <span className="pill info">Training…</span>}
      </div>
      {clf && (
        <>
          <div className="grid2">
            <div>
              <Range label="Decision threshold" value={th} min={0.05} max={0.95} step={0.01} onChange={setTh} show={th.toFixed(2)} />
              <div className="matrix" role="table" aria-label="Confusion matrix at the chosen threshold">
                <div role="row" className="mrow"><span role="columnheader" /><span role="columnheader">Predicted block</span><span role="columnheader">Predicted allow</span></div>
                <div role="row" className="mrow"><span role="rowheader">Block-worthy</span><b role="cell" className="cell good">TP {conf.tp}</b><b role="cell" className="cell bad">FN {conf.fn}</b></div>
                <div role="row" className="mrow"><span role="rowheader">Benign</span><b role="cell" className="cell bad">FP {conf.fp}</b><b role="cell" className="cell good">TN {conf.tn}</b></div>
              </div>
              <div className="tiles" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginTop: 12 }}>
                <div className="tile"><div className="num">{f3(m.precision)}</div><div className="cap">Precision, 95% CI {ci(wilson(conf.tp, conf.tp + conf.fp))}</div></div>
                <div className="tile"><div className="num">{f3(m.recall)}</div><div className="cap">Recall, 95% CI {ci(wilson(conf.tp, conf.tp + conf.fn))}</div></div>
                <div className="tile"><div className="num">{f3(m.f1)}</div><div className="cap">F1 at threshold {th.toFixed(2)}</div></div>
                <div className="tile"><div className="num">{f3(m.specificity)}</div><div className="cap">Specificity on {conf.tn + conf.fp} benign, CI {ci(wilson(conf.tn, conf.tn + conf.fp))}</div></div>
              </div>
            </div>
            <div>
              <h3>Precision and recall across thresholds (held-out)</h3>
              <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Threshold sweep of precision and recall">
                {[0, 0.5, 1].map((t) => <g key={t}><line className="axis" x1={pad.l} x2={W - pad.r} y1={sy(t)} y2={sy(t)} /><text x={pad.l - 6} y={sy(t) + 4} textAnchor="end">{t}</text></g>)}
                <polyline fill="none" stroke="var(--primary)" strokeWidth="2.2" points={sweep.map(([t, v]) => `${sx(t)},${sy(v.precision)}`).join(' ')} />
                <polyline fill="none" stroke="var(--good)" strokeWidth="2.2" points={sweep.map(([t, v]) => `${sx(t)},${sy(v.recall)}`).join(' ')} />
                <polyline fill="none" stroke="var(--warn)" strokeWidth="1.6" strokeDasharray="5 4" points={sweep.map(([t, v]) => `${sx(t)},${sy(v.specificity)}`).join(' ')} />
                <line x1={sx(th)} x2={sx(th)} y1={pad.t} y2={H - pad.b} stroke="var(--text)" strokeOpacity="0.5" />
                <text x={pad.l} y={H - 4}>threshold 0</text><text x={W - pad.r} y={H - 4} textAnchor="end">1</text>
              </svg>
              <div className="legend"><span><i style={{ background: 'var(--primary)' }} />precision</span><span><i style={{ background: 'var(--good)' }} />recall</span><span><i style={{ background: 'var(--warn)' }} />specificity</span></div>
              <h3 style={{ marginTop: 16 }}>Training loss, {md.epochs} epochs (live)</h3>
              <svg className="chart" viewBox={`0 0 ${W} ${H * 0.7}`} role="img" aria-label="Training loss curve of the live retrain">
                <polyline fill="none" stroke="var(--primary)" strokeWidth="2.2" points={clf.model.loss.map((v, i) => `${lx(i)},${ly(v) * 0.7}`).join(' ')} />
                <text x={pad.l + 8} y={ly(clf.model.loss[0]) * 0.7 + 12}>{clf.model.loss[0].toFixed(4)}</text>
                <text x={W - pad.r} y={ly(clf.model.loss.at(-1)) * 0.7 - 6} textAnchor="end">{clf.model.loss.at(-1).toFixed(4)} (recorded {md.train_loss_final_epoch})</text>
              </svg>
              <p className="hint">{clf.model.vocabSize.toLocaleString()} features, trained in {clf.ms.toFixed(0)} ms. At threshold 0.5 the live model gives TP {at05.tp}, FP {at05.fp}, TN {at05.tn}, FN {at05.fn}; the recorded Python run gave TP {rec.tp}, FP {rec.fp}, TN {rec.tn}, FN {rec.fn}.</p>
            </div>
          </div>
          <h3 style={{ marginTop: 20 }}>Against baselines on the same {deep.split.test_size} held-out cases (computed live)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>Model</th><th>Precision</th><th>Recall</th><th>F1</th><th>Specificity</th><th>Accuracy</th></tr></thead>
              <tbody>
                {[...baselines, [`Logistic classifier at threshold ${th.toFixed(2)}`, m]].map(([k, v]) => (
                  <tr key={k}><td>{k}</td><td>{f3(v.precision)}</td><td>{f3(v.recall)}</td><td>{f3(v.f1)}</td><td>{f3(v.specificity)}</td><td>{f3(v.accuracy)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="hint" style={{ marginTop: 8 }}>Always blocking already scores F1 {f3(baselines[0][1].f1)} at this class balance, so the classifier&rsquo;s edge is real but small, and it rests on {deep.split.test_negative} benign cases. The rules are precise but miss most fluent attacks.</p>
          <div className="grid2" style={{ marginTop: 20 }}>
            <div className="field">
              <label htmlFor="free">Score your own text <span>p(block) = {exp.p.toFixed(3)}</span></label>
              <textarea id="free" rows={4} value={free} onChange={(e) => setFree(e.target.value)} spellCheck={false} />
              <p className="hint">Defaults to B05, a benign sentence about jailbreak research that the classifier wrongly flags: it keys on vocabulary, not intent.</p>
            </div>
            <div>
              <h3>Top contributing features</h3>
              <div className="bars" style={{ marginTop: 8 }}>
                {top.map(([k, c]) => (
                  <div key={k} className="feat"><span className="mono">{k.replace(/ /g, '␣')}</span>
                    <span className="fbar"><i style={{ width: `${Math.min(100, (Math.abs(c) / Math.abs(top[0]?.[1] || 1)) * 100)}%`, background: c > 0 ? 'var(--bad)' : 'var(--good)' }} /></span>
                    <b>{c > 0 ? '+' : ''}{c.toFixed(3)}</b></div>
                ))}
              </div>
              <p className="hint">Red pushes toward block, green toward allow. Logit = bias {clf.model.bias.toFixed(3)} + the sum of all contributions.</p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function CrossVal({ clf }) {
  const cv = deep.cross_validation;
  const metrics = [['precision', 'Precision', 'var(--primary)'], ['recall', 'Recall', 'var(--good)'], ['f1', 'F1', 'var(--warn)']];
  const W = 460, H = 240, pad = { l: 36, r: 10, t: 12, b: 28 }, lo = 0.7, hi = 1.0;
  const y = (v) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const gw = (W - pad.l - pad.r) / 3;
  const ds = deep.dataset;
  const comp = clf ? ['jailbreak', 'prompt_injection', 'misuse', 'benign'].map((c) => [c, clf.rows.filter((r) => r.cls === c).length]) : [];
  return (
    <section id="cv" className="card window reveal" data-title="cv_folds.json — 5-fold">
      <p className="eyebrow">Cross-validation · recorded</p>
      <h2>Across {cv.folds} folds, F1 averages {f3(cv.f1_mean)}, a little below the held-out {f3(deep.held_out.f1)}.</h2>
      <p className="sub">
        Stratified {cv.folds}-fold cross-validation over all {ds.total_usable} usable cases (seed {cv.seed}). The fold values are recorded from the Python run: its fold assignment uses Python&rsquo;s random shuffle, which this page does not reimplement, so only the held-out split above is retrained live. Means and spreads below are computed from the recorded folds.
      </p>
      <div className="grid2" style={{ marginTop: 16 }}>
        <div>
          <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Per-fold precision, recall and F1 dot plot with means">
            {[0.7, 0.8, 0.9, 1].map((t) => <g key={t}><line className="axis" x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} /><text x={pad.l - 6} y={y(t) + 4} textAnchor="end">{t.toFixed(1)}</text></g>)}
            {metrics.map(([k, l, c], g) => {
              const xs = cv[`${k}_per_fold`], mu = mean(xs), sd = sampleSd(xs), cx = pad.l + g * gw + gw / 2;
              return (
                <g key={k}>
                  <rect x={cx - 40} width={80} y={y(Math.min(hi, mu + sd))} height={y(Math.max(lo, mu - sd)) - y(Math.min(hi, mu + sd))} fill={c} opacity="0.12" rx="6" />
                  <line x1={cx - 40} x2={cx + 40} y1={y(mu)} y2={y(mu)} stroke={c} strokeWidth="2" />
                  {xs.map((v, i) => <circle key={i} cx={cx - 28 + i * 14} cy={y(v)} r="5" fill={c} stroke="var(--surface-strong)" strokeWidth="1.5"><title>{`fold ${i + 1}: ${v}`}</title></circle>)}
                  <text x={cx} y={H - 8} textAnchor="middle" style={{ fill: 'var(--text)', fontWeight: 600 }}>{l}</text>
                </g>
              );
            })}
          </svg>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>Metric</th><th>Recorded mean</th><th>SD (n−1)</th><th>Folds</th></tr></thead>
              <tbody>{metrics.map(([k, l]) => <tr key={k}><td>{l}</td><td>{f3(cv[`${k}_mean`])}</td><td>{sampleSd(cv[`${k}_per_fold`]).toFixed(3)}</td><td className="mono">{cv[`${k}_per_fold`].join(' · ')}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
        <div>
          <h3>What the classifier learned from</h3>
          <div className="stack" aria-label="Dataset composition">
            <span style={{ flex: ds.positive_block_worthy, background: 'var(--bad)' }}>{ds.positive_block_worthy} block-worthy</span>
            <span style={{ flex: ds.negative_benign, background: 'var(--good)' }}>{ds.negative_benign} benign</span>
          </div>
          <div className="bars" style={{ marginTop: 16 }}>
            {comp.map(([c, n]) => (
              <div className="bar-row" key={c}><div className="lab"><span>{LABEL[c]}</span><b>{n}</b></div>
                <div className="track"><div className="fill" style={{ width: `${(n / ds.total_usable) * 100}%`, background: c === 'benign' ? 'var(--good)' : 'var(--primary)' }} /></div></div>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 12 }}>Counted live from the loaded sets. The {ds.pii_excluded_from_learn} Learn PII cases are excluded: PII is a redact task, not a block task. At {ds.positive_block_worthy}:{ds.negative_benign} a model that always blocks is right {pct(ds.positive_block_worthy / ds.total_usable)} of the time.</p>
        </div>
      </div>
    </section>
  );
}

function Limits() {
  return (
    <section id="limits" className="card window reveal" data-title="LIMITS.md — failure modes">
      <p className="eyebrow">Failure modes</p>
      <h2>What this lab does <em>not</em> show.</h2>
      <p className="sub">
        Quoted from each component&rsquo;s section of <a href={blob('REPORT.md')}>REPORT.md</a> at build time. The repo is not pre-registered: the hypotheses there were written with the results, and <a href={blob('PROPOSAL.md')}>PROPOSAL.md</a> lists what a locked confirmatory cycle would need.
      </p>
      {LEVELS.map(([t, path, lv], i) => (
        <details key={t} open={i === 1} className="lim">
          <summary>{t}: {lv.limits.length} named failure modes</summary>
          <ul>{lv.limits.map((l) => <li key={l.slice(0, 40)}>{l}</li>)}</ul>
        </details>
      ))}
    </section>
  );
}

function Reproduce() {
  const docs = [
    ['PROPOSAL.md', 'Proposal', 'Question, scope, next cycle (not locked)'],
    ['REPORT.md', 'Report', `Hypotheses scored, ${evaluation.length}- and ${adversarial.length}-case sets, limits`],
    ['level-1-learn/guardrails.py', 'Guardrails', 'Rules and PII redaction'],
    ['level-2-build/harness.py', 'Harness', 'Stand-ins, three stages, fix'],
    ['level-3-deep/rigor.py', 'Rigor runner', 'Intervals, McNemar, ablation'],
    ['scripts/reproduce.sh', 'Reproduce', 'One command, byte-for-byte check'],
  ];
  const hashes = LEVELS.map(([, , lv]) => lv.hash).filter(Boolean);
  return (
    <section id="reproduce" className="card window reveal" data-title="Terminal — reproduce">
      <p className="eyebrow">Reproduce it</p>
      <h2>Standard library only, deterministic, under a second.</h2>
      <ol className="steps" style={{ marginTop: 16 }}>
        <li><span className="n">1</span><div><b>Run the three levels and the rigor pass</b><div className="hint"><code>python3 level-1-learn/run_learn.py && python3 level-2-build/run_build.py && python3 level-3-deep/run_deep.py && python3 level-3-deep/rigor.py</code></div></div></li>
        <li><span className="n">2</span><div><b>Run the tests</b><div className="hint"><code>python3 tests/test_smoke.py && python3 -m unittest discover -s tests</code></div></div></li>
        <li><span className="n">3</span><div><b>Check determinism against the hashes REPORT.md records</b><div className="hint">{hashes.map((h) => <div key={h.file}><code>{h.file} {h.sha}</code></div>)}</div></div></li>
        <li><span className="n">4</span><div><b>Rebuild this page with its parity gates</b><div className="hint"><code>cd site && npm ci && npm run build</code></div></div></li>
      </ol>
      <div className="docs" style={{ marginTop: 20 }}>
        {docs.map(([p, t, d]) => <a key={p} href={blob(p)}><b>{t}</b><small>{d}</small></a>)}
      </div>
    </section>
  );
}
