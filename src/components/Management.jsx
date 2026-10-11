import { useEffect, useState } from 'react';
import { api, getActionPlan } from '../services/api';

export default function Management({ companyId, onOpenActions, onOpenForecast }) {
  const [data, setData] = useState(null);
  const [plan, setPlan] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState('');
  const [aiError, setAiError] = useState('');
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await api.get(`/management/${companyId}`);
        if (cancelled) return;
        setData(response.data);
        // Optional AI and forecast requests start independently after role authorization.
        getActionPlan(companyId).then(result => { if (!cancelled) setPlan(JSON.parse(result.action_plan)); })
          .catch(() => { if (!cancelled) setAiError('AI summary is unavailable. Emissions and history remain available.'); });
        api.get(`/forecast/${companyId}`).then(result => { if (!cancelled) setForecast(result.data); })
          .catch(() => { if (!cancelled) setForecast({status: 'unavailable', reason: 'Forecast status could not be loaded.'}); });
      } catch { if (!cancelled) setError('Management summary is unavailable or your account does not have access.'); }
    }
    load(); return () => { cancelled = true; };
  }, [companyId]);
  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p>Loading management summary...</p>;
  return <section className="assessment-history"><span className="carbon-action-eyebrow">MANAGEMENT BRIEF</span><h2>Your priorities at a glance</h2><p>{data.reporting_year ? `Calendar year ${data.reporting_year}` : 'Reporting year not yet assigned'} · Selected assessment</p>
    <div className="carbon-plan-summary"><h3>{Number(data.current_tco2e).toFixed(2)} tCO₂e</h3><p>Reported annual footprint using the assessment calculation context</p>{data.comparison ? <p>Compared with {data.comparison.previous_year}: {data.comparison.change_tco2e >= 0 ? '+' : ''}{data.comparison.change_tco2e.toFixed(2)} tCO₂e {data.comparison.change_pct === null ? '(previous year was zero; percentage unavailable)' : `(${data.comparison.change_pct >= 0 ? '+' : ''}${data.comparison.change_pct}%)`}</p> : <p>No previous-year assessment in this company history is available for comparison.</p>}</div>
    <div className="carbon-scope-grid">{[1,2,3].map(scope => <div key={scope}><span>Scope {scope}</span><strong>{data.scopes[scope].toFixed(2)} tCO₂e</strong></div>)}</div>
    <h3>Largest reported emission drivers</h3>{data.drivers.map(row => <p key={row.category}><strong>{row.category.replaceAll('_',' ')}:</strong> {(row.emissions_kgco2e/1000).toFixed(2)} tCO₂e</p>)}
    <div className="carbon-plan-summary"><h3>Decision priorities</h3>{plan ? <><p>{plan.executive_summary}</p>{plan.top_priority && <p><strong>Start with {plan.top_priority.title}:</strong> {plan.top_priority.why_now}</p>}<ol>{plan.actions.slice(0,3).map((action,i) => <li key={i}><strong>{action.title}</strong> · {action.priority} · {action.timeframe}<p>{action.why_it_matters}</p></li>)}</ol></> : <p>{aiError || 'Preparing the AI summary...'}</p>}<button className="dashboard-button dashboard-button-secondary" onClick={onOpenActions}>Open detailed action plan →</button></div>
    <div className="carbon-plan-summary"><h3>Next-year outlook</h3>{!forecast ? <p>Checking forecast readiness...</p> : forecast.status === 'ready' ? <p>{forecast.forecast_year}: <strong>{forecast.predicted_tco2e.toFixed(2)} tCO₂e</strong> · {forecast.preliminary ? 'Preliminary unchanged-activity baseline' : 'Trend/baseline comparison available'}. Exploratory projection.</p> : <p>{forecast.reason}</p>}<button className="dashboard-button dashboard-button-secondary" onClick={onOpenForecast}>Review forecast and limitations →</button></div>
    <p>{data.method_note}</p><p>Download this assessment’s PDF or Excel using the report buttons above. This view summarizes your own account’s data.</p><aside className="carbon-plan-summary" aria-labelledby="management-special-note"><h3 id="management-special-note">Special note</h3><p>This view brings your assessment’s most important findings into one concise executive summary—helping decision-makers see what needs attention, why it matters and where to act first. It draws on the same assessment data as Overview, with a focus on priorities rather than detailed analysis.</p><p>Today, it summarizes the selected assessment within your own account. Shared company access, organization-wide targets, action owners, deadlines, budgets and progress across teams or locations are not yet available. Those capabilities would turn this summary into a broader management workspace.</p><p>Use this view to set direction, then open the detailed action plan, forecast or reports to review the supporting information.</p></aside>
  </section>;
}
