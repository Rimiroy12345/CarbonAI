import { useEffect, useState } from 'react';
import { getDashboardResults, getAssessmentHistory } from '../services/api';
import WhatIfSimulator from '../components/simulator/WhatIfSimulator';
import ActionPlanList from '../components/recommendations/ActionPlanList';
import './Dashboard.css';

export default function Dashboard({ companyId = null, onRestart }) {
  const [selectedId, setSelectedId] = useState(companyId);
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState('');
  const [historyOffset, setHistoryOffset] = useState(0);
  const [nextOffset, setNextOffset] = useState(null);
  useEffect(() => {
    let cancelled = false;
    getAssessmentHistory(historyOffset).then(result => {
      if (!cancelled) { setHistory(result.assessments); setNextOffset(result.next_offset); setHistoryError(''); }
    }).catch(() => { if (!cancelled) setHistoryError('Unable to load assessment history. Please try again.'); });
    return () => { cancelled = true; };
  }, [historyOffset]);
  const [view, setView] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError('');
        const results = await getDashboardResults(selectedId);
        if (!cancelled) setData(results);
      } catch (err) {
        console.error('Dashboard data fetch failed:', err);
        if (cancelled) return;
        setData(null);
        setError(
          err?.response?.data?.detail ||
          'No assessment data found. Complete an assessment first.'
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDashboardData();
    return () => { cancelled = true; };
  }, [selectedId]);

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-shell dashboard-state">
          <div className="dashboard-spinner" aria-hidden="true" />
          <p>Loading your CarbonAI dashboard...</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-shell dashboard-state dashboard-empty">
          <span className="dashboard-eyebrow">CARBONAI DASHBOARD</span>
          <h1>No assessment yet</h1>
          <p>{error || 'Complete your company assessment to see your carbon dashboard.'}</p>
          <button type="button" className="dashboard-button dashboard-button-primary" onClick={onRestart}>
            ↻ Start assessment
          </button>
        </div>
      </main>
    );
  }

  const totalTco2e = Number(data.total_tco2e || 0);
  const totalKgco2e = Number(data.total_kgco2e || totalTco2e * 1000);
  const breakdown = data.breakdown || {};
  const energy = Number(breakdown.energy_kg || 0);
  const travel = Number(breakdown.travel_kg || 0);
  const waste = Number(breakdown.waste_kg || 0);

  return (
    <main className="dashboard-page">
      <aside className="workspace-nav"><span className="workspace-title">WORKSPACE</span>{[['overview','Overview'],['scenarios','Scenario planner'],['actions','Action plan'],['history','Assessment history']].map(([key,label]) => <button key={key} className={view === key ? 'selected' : ''} onClick={() => setView(key)}>{label}<span>↗</span></button>)}<div className="workspace-note">A clear baseline.<br />A considered next step.</div><button onClick={onRestart}>New assessment <span>+</span></button></aside>
      <div className="dashboard-shell">
        <header className="dashboard-header">
          <div>
            <span className="dashboard-eyebrow">YOUR CARBON DASHBOARD</span>
            <h1>{data.company_name || 'Company Dashboard'}</h1>
            <p>Assessment saved on {new Date(data.calculated_at).toLocaleString()}.</p>
          </div>

          <button type="button" className="dashboard-button dashboard-button-secondary" onClick={onRestart}>
            ↻ Restart assessment
          </button>
        </header>

        {view === 'overview' && <section className="dashboard-metrics" aria-label="Carbon footprint summary">
          <article className="dashboard-metric dashboard-metric-featured">
            <span>Total emissions</span>
            <strong>{totalTco2e.toFixed(2)} tCO₂e</strong>
            <small>{totalKgco2e.toFixed(0)} kg CO₂e</small>
          </article>
          <article className="dashboard-metric">
            <span>Energy</span>
            <strong>{energy.toFixed(1)} kg</strong>
            <small>CO₂e annually</small>
          </article>
          <article className="dashboard-metric">
            <span>Travel</span>
            <strong>{travel.toFixed(1)} kg</strong>
            <small>CO₂e annually</small>
          </article>
          <article className="dashboard-metric">
            <span>Waste</span>
            <strong>{waste.toFixed(1)} kg</strong>
            <small>CO₂e annually</small>
          </article>
        </section>}

        {view === 'scenarios' && <WhatIfSimulator companyId={data.company_id} baseline={breakdown} />}
        {(view === 'overview' || view === 'actions') && <ActionPlanList companyId={data.company_id} />}
        {view === 'history' && <section className="assessment-history"><h2>Saved assessments</h2><p>Each new assessment is saved separately to your account.</p>{historyError && <p role="alert">{historyError}</p>}{history.map(item => <button className="history-report" key={item.company_id} onClick={() => { setSelectedId(item.company_id); setView('overview'); }}><strong>Assessment #{item.number} · {item.company_name}</strong><span>{new Date(item.calculated_at).toLocaleString()} · {Number(item.total_tco2e).toFixed(2)} tCO₂e</span><span>Open report →</span></button>)}<div className="document-buttons">{historyOffset > 0 && <button onClick={() => setHistoryOffset(Math.max(0, historyOffset - 50))}>Newer assessments</button>}{nextOffset !== null && <button onClick={() => setHistoryOffset(nextOffset)}>Older assessments</button>}</div></section>}
      </div>
    </main>
  );
}
