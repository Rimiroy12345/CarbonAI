import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function Forecast({ companyId, reportingYear }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [year, setYear] = useState(reportingYear || '');
  const [revision, setRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    api.get(`/forecast/${companyId}`).then(result => { if (!cancelled) { setData(result.data); setError(''); } })
      .catch(err => { if (!cancelled) setError(err?.response?.data?.detail || err?.message || 'Forecast could not be loaded. Please try again.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [companyId, revision]);
  const retryForecast = () => { setLoading(true); setError(''); setData(null); setRevision(value => value + 1); };
  async function savePeriod(event) {
    event.preventDefault(); setSaving(true);
    try { await api.patch(`/assessments/${companyId}/period`, { reporting_year: Number(year) }); retryForecast(); }
    catch { setError('Unable to save the year. Use a completed calendar year.'); }
    finally { setSaving(false); }
  }
  return <section className="assessment-history"><span className="carbon-action-eyebrow">ACTIVITY FORECAST</span><h2>Next-year emissions outlook</h2><p>Uses this company’s annual activity history. Separate businesses and repeat versions are kept apart.</p>
    <section className="forecast-history-guide" aria-label="How history changes your forecast"><h3>More history, more ways to check the forecast</h3><div className="scope-analysis-grid"><article><h4>2–5 complete years</h4><strong>Preliminary baseline</strong><p>Next year uses the latest year’s activity levels, assuming they stay unchanged. Earlier years provide history, but this version does not use them to validate a trend model.</p><p>We do not show accuracy scores or an uncertainty range because there is not enough history for our validation process.</p></article><article><h4>6+ complete years</h4><strong>Trend comparison and a separate test year</strong><p>We fit an activity trend using earlier years and compare its prediction errors with the unchanged-activity baseline. We select the trend only when it lowers validation error by at least 5%.</p><p>The final year is kept out of model selection and used as a separate check. You can see the errors and which method was selected for each activity.</p></article></div><p><strong>Why the difference?</strong> Fitting a trend, comparing methods and checking on a separate year need different parts of your history. Two years can support a simple starting point; six gives this process room to run. Six years does not guarantee accuracy—the baseline may still perform better.</p><p>Use consecutive full calendar years for the same company. Repeat assessments for one year count as versions, not extra years. Both approaches use current emission factors and remain exploratory.</p></section>
    {!reportingYear && <form onSubmit={savePeriod}><label htmlFor="legacy-year">Which completed calendar year does this assessment cover?</label><select id="legacy-year" required value={year} onChange={event => setYear(event.target.value)}><option value="">Select completed year</option>{Array.from({length: new Date().getFullYear() - 1990}, (_, i) => new Date().getFullYear() - 1 - i).map(value => <option key={value} value={value}>{value} · January–December</option>)}</select><button disabled={saving}>{saving ? 'Saving...' : 'Save reporting year'}</button><p>This labels the reporting period; it does not change your saved numbers.</p></form>}
    {error && <div className="carbon-plan-summary"><p role="alert">{error}</p><button type="button" className="dashboard-button dashboard-button-primary" disabled={loading} onClick={retryForecast}>Retry forecast</button></div>}
    {loading && <p role="status">Checking reporting history...</p>}
    {data && data.status !== 'ready' && <div className="carbon-plan-summary"><h3>Forecast unavailable</h3><p>{data.reason}</p><p>{data.years_available || 0} distinct annual periods available. Add past years using “New assessment” and select this company’s history.</p></div>}
    {data?.status === 'ready' && <><div className="carbon-plan-summary"><h3>Exploratory projection for {data.forecast_year}</h3><p><strong>{Number(data.predicted_tco2e).toFixed(2)} tCO₂e</strong> projected, compared with {Number(data.current_tco2e).toFixed(2)} tCO₂e for the anchor year using current factors.</p><p>Not a verified forecast or a guaranteed outcome. No calibrated uncertainty range is available.</p></div>
    <div className="carbon-scope-grid">{[1, 2, 3].map(scope => <div key={scope}><span>Scope {scope}</span><strong>{Number(data.scopes[scope]).toFixed(2)} tCO₂e</strong></div>)}</div>
    {data.preliminary && <p><strong>Preliminary baseline:</strong> Next year assumes the latest annual activity stays unchanged. Model comparison needs six years.</p>}{!data.preliminary && <h3>Largest projected changes</h3>}{data.drivers.map(row => <p key={row.category}><strong>{row.category.replaceAll('_', ' ')}:</strong> {row.change_tco2e >= 0 ? '+' : ''}{row.change_tco2e.toFixed(2)} tCO₂e. {row.method === 'linear_trend' ? 'Historical activity trend selected after validation.' : 'Last-year activity baseline performed as well or better in validation.'}</p>)}
    <div style={{overflowX: 'auto'}}><table><caption>Activity predictions and historical error in each activity’s own units</caption><thead><tr><th>Activity</th><th>Latest quantity</th><th>Predicted quantity</th><th>Model</th><th>Validation MAE</th><th>Baseline MAE</th><th>Holdout error</th></tr></thead><tbody>{data.activities.map(row => <tr key={row.category}><td>{row.category.replaceAll('_', ' ')} ({row.unit})</td><td>{row.latest_quantity.toFixed(1)}</td><td>{row.predicted_quantity.toFixed(1)}</td><td>{row.method.replaceAll('_', ' ')}</td><td>{row.validation_mae == null ? 'Not evaluated' : row.validation_mae.toFixed(1)}</td><td>{row.baseline_validation_mae == null ? 'Not evaluated' : row.baseline_validation_mae.toFixed(1)}</td><td>{row.holdout_absolute_error == null ? 'Not evaluated' : row.holdout_absolute_error.toFixed(1)}</td></tr>)}</tbody></table></div>
    {!data.preliminary && <p>Model selection used {data.validation_origins} earlier rolling validation years. Final holdout year: {data.holdout_year}. Sum of category absolute errors: {data.holdout_category_error_sum_tco2e} tCO₂e; last-year baseline: {data.baseline_holdout_category_error_sum_tco2e} tCO₂e. This is not the error of the aggregate total.</p>}
    <details><summary>Method and limitations</summary>{!data.preliminary && <p>Ordinary least-squares activity trend fitted against calendar year, compared with last-year activity. Trend is selected only with at least 5% lower validation error. The final year is held out from model selection, then all available years are used for the next-year estimate. Category estimates are multiplied by current factors.</p>}<ul>{data.limitations.map(item => <li key={item}>{item}</li>)}</ul></details></>}
  </section>;
}
