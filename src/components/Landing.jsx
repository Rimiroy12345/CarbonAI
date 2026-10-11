import { ArrowUpRight, Leaf, Zap, Route, Sparkles, ArrowRight, ChartNoAxesCombined, SlidersHorizontal } from 'lucide-react';

const capabilities = [
  [ChartNoAxesCombined, '01', 'See the whole picture.', 'Bring energy, travel and waste into one clear view of your business footprint.'],
  [SlidersHorizontal, '02', 'Explore a better path.', 'Compare reduction scenarios before deciding where to invest your effort.'],
  [Sparkles, '03', 'Make your next move.', 'Turn your assessment into practical, prioritized actions with AI assistance.'],
];

export default function Landing({ onStart, onDashboard }) {
  return <main className="new-landing">
    <section className="new-hero" id="home">
      <div className="hero-copy"><span className="new-eyebrow"><i /> CLARITY FOR A LOWER-CARBON FUTURE</span>
        <h1>A smaller footprint.<br />A <em>bigger perspective.</em></h1>
        <p>Understand your emissions. Explore your options. Give your business a clear path toward meaningful climate action.</p>
        <div className="hero-actions"><button className="carbonai-primary" onClick={onStart}>Get started <ArrowUpRight size={18} /></button><button className="hero-text-button" onClick={onDashboard}>Open your dashboard <ArrowRight size={17} /></button></div>
        <div className="hero-note"><Leaf size={17} /><span>Carbon accounting, with actionable intelligence.</span></div>
      </div>
      <div className="preview-stage" aria-label="Illustrative CarbonAI dashboard with example data">
        <div className="preview-top"><span><span className="preview-brand">◈</span> CarbonAI</span><span className="preview-label">PRODUCT PREVIEW · EXAMPLE DATA</span></div>
        <div className="preview-body"><div className="preview-heading"><div><small>YOUR BUSINESS, IN PERSPECTIVE</small><h3>Emissions overview</h3></div><span className="preview-period">Annual assessment</span></div>
          <div className="preview-total"><span>Total carbon footprint</span><strong>124.8 <small>tCO₂e</small></strong><p>One baseline. A clearer starting point.</p></div>
          <div className="preview-bottom"><div className="preview-bars"><span>Emission sources</span><div className="preview-bar-row"><Zap size={14}/><span>Energy</span><i style={{width:'74%'}}/><b>74%</b></div><div className="preview-bar-row"><Route size={14}/><span>Travel</span><i style={{width:'21%'}}/><b>21%</b></div><div className="preview-bar-row"><Leaf size={14}/><span>Waste</span><i style={{width:'5%'}}/><b>5%</b></div></div><div className="preview-insight"><Sparkles size={19}/><small>YOUR NEXT OPPORTUNITY</small><p>Start with energy.<br />Explore efficiency and renewable electricity.</p><span>From insight to action ↗</span></div></div>
        </div><div className="preview-footer"><span><i/> Data → understanding → action</span><span>Built for better decisions</span></div>
      </div>
    </section>
    <section className="platform-strip"><span>ONE CONNECTED WORKFLOW</span><p>Measure your footprint <i>↗</i> Understand the drivers <i>↗</i> Plan your next move</p></section>
    <section className="capability-section" id="features"><div className="section-intro"><div><span className="new-eyebrow">LESS COMPLEXITY. MORE CLARITY.</span><h2>Make sustainability<br />part of your strategy.</h2></div><p>Your business data has a story to tell.<br />CarbonAI helps you find the decisions that matter.</p></div><div className="capability-grid">{capabilities.map(([Icon,n,title,description])=><article key={n}><div className="capability-top"><Icon size={25}/><span>{n}</span></div><h3>{title}</h3><p>{description}</p></article>)}</div></section>
    <section className="workflow-section" id="how"><div><span className="new-eyebrow">FROM ACTIVITY TO ACTION</span><h2>A clear process.<br /><em>A considered decision.</em></h2><p>No sustainability expertise needed to get started. Bring your annual activity data, and build an informed baseline.</p><button className="carbonai-primary" onClick={onStart}>Start your assessment <ArrowUpRight size={18}/></button></div><ol>{[['Tell us about your business','Add your company, industry, team size and location.'],['Build your emissions baseline','Enter annual energy, fuel, travel and waste activity.'],['Explore what comes next','Review your results, compare scenarios and open your action plan.']].map(([title,description],i)=><li key={title}><span>0{i+1}</span><div><h3>{title}</h3><p>{description}</p></div></li>)}</ol></section>
    <section className="decision-section" id="impact"><span className="new-eyebrow">A BETTER STARTING POINT</span><h2>You cannot improve<br />what you cannot <em>see.</em></h2><p>Move from scattered activity data to a footprint you can understand, discuss and act on.</p><button onClick={onStart}>Find your starting point <ArrowUpRight size={19}/></button></section>
    <footer className="new-footer" id="about"><div><strong>◈ CarbonAI</strong><p>Intelligence for a more considered future.</p></div><p>Carbon accounting · Scenario planning · AI action plans</p><span>Built with tomorrow in mind.</span></footer>
  </main>;
}
