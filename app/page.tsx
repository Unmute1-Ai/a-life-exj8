"use client";

import { FormEvent, useEffect, useState } from "react";

type Turn = { requestId: string; answer: string; experts: { id: string; label: string; output: string }[]; routing: string[]; authority: { state: string; executionAllowed: boolean; note: string }; receipt: { algorithm: string; digest: string }; provider: string };
type Status = { providerConfigured: boolean; experts: { id: string; label: string }[] };
const defaults = ["Help me reason through a difficult decision and show what evidence could change the conclusion.", "Design an accessible interaction that adapts to sensory overload without making assumptions about the person.", "Evaluate a proposed action for uncertainty, unintended effects, and what must be authorized separately."];

export default function Home() {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [turn, setTurn] = useState<Turn | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<Status | null>(null);
  const [history, setHistory] = useState<{ id: string; prompt: string; time: string }[]>([]);
  useEffect(() => { fetch("/api/organism/turn").then(r => r.json()).then(setStatus).catch(() => setStatus(null)); }, []);
  async function submit(e: FormEvent) {
    e.preventDefault(); if (!input.trim() || busy) return;
    setBusy(true); setError(""); setTurn(null);
    try {
      const response = await fetch("/api/organism/turn", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ input }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || "Turn failed");
      setTurn(data); setHistory(h => [{ id: data.requestId, prompt: input.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }, ...h].slice(0, 8));
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to complete the turn."); }
    finally { setBusy(false); }
  }
  return <main className="shell">
    <header className="topbar"><a className="brand" href="#" aria-label="U1 Organism home"><span className="brandmark"><i/><i/><i/></span><span>UNMUTE<span className="cyan">1</span>AI <small>RESEARCH SYSTEMS</small></span></a><div className="topmeta"><span className="pulse"/><span>ORGANISM / 0.1.0</span><span className="divider-v"/><span className="muted">LOCAL CONTROL · SERVER REASONING</span></div></header>
    <section className="hero"><div className="eyebrow"><span className="tiny-dot"/> ADAPTIVE INTELLIGENCE, ACCOUNTABLE BY DESIGN</div><h1>Not a toolchain.<br/><em>An organism.</em></h1><p className="lede">Perceive. Specialize. Collaborate. Test. Learn from outcomes.<br/>One coherent system, with authority kept separate from intelligence.</p>
      <div className="organism-wrap"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="core"><div className="core-inner"><span className="core-glyph">U1</span><span className="core-label">SYNCHRONOUS CORE</span><span className="core-status">{busy ? "PROCESSING" : "STANDING BY"}</span></div></div><div className="node node-a"><b>01</b><span>PERCEPTION</span><small>Context · Signal</small></div><div className="node node-b"><b>02</b><span>MOE ROUTING</span><small>Specialist selection</small></div><div className="node node-c"><b>03</b><span>MOA SYNTHESIS</span><small>Agreement · Conflict</small></div><div className="node node-d"><b>04</b><span>FALSIFICATION</span><small>Evidence · Countercheck</small></div><div className="node node-e"><b>05</b><span>EXPERIENCE</span><small>Verified outcomes</small></div><div className="node node-f"><b>06</b><span>U1Si-Q</span><small>Authority · Audit</small></div><div className="orbit-caption">LIVE SYSTEM MAP <span>•</span> ADVISORY EXECUTION MODE</div></div>
    </section>
    <section className="workspace"><div className="section-head"><div><div className="eyebrow">01 / INTERACTION</div><h2>Give the organism a problem.</h2></div><div className={"provider-state " + (status?.providerConfigured ? "connected" : "disconnected")}><span className="tiny-dot"/>{status?.providerConfigured ? "MODEL PROVIDER CONNECTED" : "MODEL PROVIDER NOT CONFIGURED"}</div></div>
      {!status?.providerConfigured && <div className="notice"><strong>Provider connection required</strong><span>This build will not fabricate model output. Set <code>MODEL_API_KEY</code> in the deployment environment; optionally set <code>MODEL_BASE_URL</code> and <code>MODEL_NAME</code> for an OpenAI-compatible provider.</span></div>}
      <form className="composer" onSubmit={submit}><label htmlFor="prompt">INPUT / INTENT</label><textarea id="prompt" value={input} onChange={e => setInput(e.target.value)} maxLength={6000} placeholder="Describe a problem, a signal, a decision, or a hypothesis…" /><div className="composer-bottom"><span>{input.length}/6000 · No action executes from a model response.</span><button type="submit" disabled={busy || !input.trim()}>{busy ? "PROCESSING…" : "RUN ORGANISM"} <span>↗</span></button></div></form>
      <div className="examples"><span className="muted label-small">TRY A STARTING POINT</span>{defaults.map((d,i)=><button className="example" key={d} onClick={()=>setInput(d)}><span>0{i+1}</span>{d}<b>↗</b></button>)}</div>
      {error && <div className="error-panel"><strong>TURN NOT COMPLETED</strong><p>{error}</p><small>No synthetic answer was substituted. No action was executed.</small></div>}
      {turn && <section className="result"><div className="result-head"><div><div className="eyebrow">02 / ORGANISM OUTPUT</div><h2>Integrated assessment</h2></div><span className="pill">ADVISORY ONLY</span></div><div className="answer">{turn.answer}</div><div className="subhead">SPECIALIST SIGNALS <span>{turn.experts.length} ACTIVE</span></div><div className="expert-grid">{turn.experts.map(ex=><article className="expert-card" key={ex.id}><div className="expert-title"><span className="tiny-dot"/>{ex.label.toUpperCase()}</div><p>{ex.output}</p></article>)}</div><div className="receipt"><div><div className="subhead">GLASS BOX RECEIPT</div><p>SHA-256 · {turn.receipt.digest.slice(0,20)}…</p><small>Integrity digest only. It does not prove that an assertion is true or an action was authorized.</small></div><div className="authority"><span className="tiny-dot"/><strong>{turn.authority.state}</strong><small>Execution: denied by default</small></div></div></section>}
    </section>
    <section className="lower-grid"><article className="panel"><div className="eyebrow">02 / SPECIALIZATION</div><h3>Mixture of Experts</h3><p>Routing selects relevant specialist roles for each turn. Roles are application-level specialists, not separate trained neural subnetworks.</p><div className="expert-list">{(status?.experts || [{id:"context",label:"Context"},{id:"pattern",label:"Pattern"},{id:"prediction",label:"Prediction"},{id:"critic",label:"Critic"},{id:"safety",label:"Safety"},{id:"accessibility",label:"Accessibility"}]).map((x,i)=><div key={x.id}><span className="list-index">0{i+1}</span>{x.label}<span className="list-status">AVAILABLE</span></div>)}</div></article><article className="panel"><div className="eyebrow">03 / COLLABORATION</div><h3>Mixture of Agents</h3><p>Independent specialist assessments are synthesized into one response. Disagreement is evidence to inspect, not noise to hide.</p><div className="flow-steps"><div><b>01</b><span>Specialist proposals</span></div><div><b>02</b><span>Synthesis pass</span></div><div><b>03</b><span>Evidence and uncertainty</span></div><div><b>04</b><span>Independent authority boundary</span></div></div></article><article className="panel"><div className="eyebrow">04 / CONTINUITY</div><h3>Experience ledger</h3><p>Completed turns appear here for this page session. Durable learning from verified outcomes is not enabled yet; the organism will not claim it learned from an outcome it never observed.</p>{history.length ? <div className="history">{history.map(h=><div key={h.id}><span>{h.time}</span><p>{h.prompt}</p></div>)}</div> : <div className="empty-ledger"><span className="ledger-icon">◎</span><span>AWAITING VERIFIED EXPERIENCE</span><small>Predictions need outcomes before calibration can be measured.</small></div>}</article></section>
    <footer><div className="brandmark small-mark"><i/><i/><i/></div><span>UNMUTE1AI / U1 ORGANISM</span><span className="footer-motto">INTELLIGENCE RECOMMENDS. AUTHORITY DECIDES.</span><span className="muted">RESEARCH BUILD 0.1.0</span></footer>
  </main>;
}
