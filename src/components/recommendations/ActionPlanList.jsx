import { useEffect, useState } from 'react';
import { getActionPlan } from '../../services/api';
import { parseActionPlan as parsePlan } from '../../services/actionPlan';

function priorityClass(priority) {
  return String(priority).toLowerCase().includes('high')
    ? 'is-high'
    : String(priority).toLowerCase().includes('low')
      ? 'is-low'
      : 'is-medium';
}

export default function ActionPlanList({ companyId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadActionPlan() {
      try {
        setLoading(true);
        setError('');
        const result = await getActionPlan(companyId);
        if (!parsePlan(result.action_plan)) throw new Error('This saved analysis has incomplete details. Please create a new assessment for a complete AI report.');
        if (!cancelled) setData(result);
      } catch (err) {
        console.error('AI action plan fetch failed:', err);
        if (!cancelled) {
          setData(null);
          setError(err?.response?.data?.detail || err?.message || 'The AI service is temporarily unavailable.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadActionPlan();
    return () => { cancelled = true; };
  }, [companyId, retryCount]);

  const plan = parsePlan(data?.action_plan);
  const usingFallback = !plan;
  const actions = plan?.actions || [];

  if (loading) {
    return (
      <section className="carbon-action-plan carbon-action-plan-loading">
        <div className="carbon-action-header">
          <div>
            <span className="carbon-action-eyebrow">AI SUSTAINABILITY ADVISOR</span>
            <h2>Building your action plan</h2>
          </div>
          <span className="carbon-action-status">Analyzing</span>
        </div>
        <div className="carbon-action-loading-line" />
        <p>Turning your latest assessment into practical next steps...</p>
      </section>
    );
  }

  if (error || usingFallback) {
    return <section className="carbon-action-plan" aria-label="AI analysis unavailable">
      <div className="carbon-action-header"><h2>AI analysis unavailable</h2></div>
      <p role="alert">{error || 'A complete AI analysis is not available yet.'}</p>
      <p>Your saved assessment and calculations are still available.</p>
      <button type="button" className="dashboard-button dashboard-button-primary" onClick={() => setRetryCount(count => count + 1)}>Retry AI analysis</button>
    </section>;
  }

  return (
    <section className="carbon-action-plan">
      <div className="carbon-action-header">
        <div>
          <span className="carbon-action-eyebrow">AI SUSTAINABILITY ADVISOR</span>
          <h2>Your recommended action plan</h2>
          <p>Prioritized actions based on your latest emissions profile.</p>
        </div>
        <span className="carbon-action-status">AI generated</span>
      </div>

      {data?.captured_at && <p className="carbon-fallback-note">Saved AI analysis · {new Date(data.captured_at).toLocaleString()} · Reopening this assessment preserves these findings and recommendations.</p>}
      {data && (
        <div className="carbon-scope-grid">
          <div><span>Scope 1</span><strong>{Number(data.scope1 || 0).toFixed(2)} tCO₂e</strong></div>
          <div><span>Scope 2</span><strong>{Number(data.scope2 || 0).toFixed(2)} tCO₂e</strong></div>
          <div><span>Scope 3</span><strong>{Number(data.scope3 || 0).toFixed(2)} tCO₂e</strong></div>
        </div>
      )}

      <div className="carbon-plan-summary">
        <span>Assessment insight</span><p>{plan.executive_summary}</p>
        <div className="carbon-plan-priority"><strong>Start here: {plan.top_priority.title}</strong><small>{plan.top_priority.why_now}</small></div>
      </div>

      {!usingFallback && plan.scope_analysis.length > 0 && <section className="scope-analysis" aria-label="Scope-specific AI analysis"><h3>Understand each scope</h3><p>AI interpretation of the activities reported in this assessment.</p><div className="scope-analysis-grid">{plan.scope_analysis.map(analysis => <article key={analysis.scope}><span className="carbon-action-eyebrow">SCOPE {analysis.scope}</span><h4>{({1: 'Direct fuel use', 2: 'Purchased electricity', 3: 'Reported indirect activities'})[analysis.scope]}</h4><p><strong>What we found:</strong> {analysis.finding}</p><p><strong>Why it matters:</strong> {analysis.reason}</p><p><strong>Recommended next step:</strong> {analysis.recommendation}</p>{Array.isArray(analysis.assumptions) && <details><summary>Assumptions and missing data</summary><ul>{analysis.assumptions.map((item, i) => <li key={i}>{item}</li>)}</ul></details>}</article>)}</div></section>}
      {!usingFallback && plan.company_analysis && <section className="carbon-plan-summary"><h3>Company-wide priorities</h3><p>{plan.company_analysis.finding}</p><p><strong>Why:</strong> {plan.company_analysis.reason}</p><p><strong>Next step:</strong> {plan.company_analysis.recommendation}</p>{Array.isArray(plan.company_analysis.assumptions) && <details><summary>Company context and limitations</summary><ul>{plan.company_analysis.assumptions.map((item, i) => <li key={i}>{item}</li>)}</ul></details>}</section>}
      <div className="carbon-action-list carbon-action-cards">
        {actions.map((action, index) => (
          <article className="carbon-action-item carbon-action-card" key={`${action.title}-${index}`}>
            <div className="carbon-action-number">{String(index + 1).padStart(2, '0')}</div>
            <div className="carbon-action-content">
              <div className="carbon-action-card-topline">
                <span className={`carbon-priority ${priorityClass(action.priority)}`}>{action.priority}</span>
                <span className="carbon-timeframe">{action.timeframe}</span>
              </div>
              <h3>{action.title}</h3>
              <p><strong>Why this is recommended:</strong> {action.why_it_matters}</p>
              <div className="carbon-action-impact"><span>Expected impact</span><strong>{action.expected_impact}</strong></div>
              {action.steps.length > 0 && (
                <ol className="carbon-action-steps">
                  {action.steps.map((step, stepIndex) => <li key={`${step}-${stepIndex}`}>{step}</li>)}
                </ol>
              )}
            </div>
          </article>
        ))}
      </div>

      {!usingFallback && <p className="carbon-measurement"><strong>How to measure progress:</strong> {plan.measurement}</p>}
    </section>
  );
}
