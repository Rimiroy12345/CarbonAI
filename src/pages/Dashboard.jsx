import React, { useEffect, useState } from 'react';
import { getDashboardResults } from '../services/api';
import WhatIfSimulator from '../components/simulator/WhatIfSimulator';
import ActionPlanList from '../components/recommendations/ActionPlanList';
import './Dashboard.css';

export default function Dashboard({ companyId = null }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError('');
        const results = await getDashboardResults();
        setData(results);
      } catch (err) {
        console.error('Dashboard data fetch failed:', err);
        setData(null);
        setError(err?.response?.data?.detail || 'No assessment data found. Complete an assessment first.');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [companyId]);

  const restart = () => {
    localStorage.setItem('carbonai_restart_assessment', '1');
    window.location.reload();
  };

  if (loading) {
    return <div className="dashboard-shell dashboard-loading"><div className="dashboard-loader"><span />Loading your CarbonAI dashboard...</div></div>;
  }

  if (!data) {
    return (
      <div className="dashboard-shell">
        <div className="dashboard-empty">
          <div className="empty-icon">◈</div>
          <div className="dashboard-kicker">CARBONAI</div>
          <h1>No assessment yet</h1>
          <p>{error || 'Complete your company assessment to unlock your carbon dashboard.'}</p>
          <button className="dashboard-primary" type="button" onClick={restart}>Start assessment <span>→</span></button>
        </div>
      </div>
    );
  }

  const totalTco2e = Number(data.total_tco2e || 0);
  const totalKgco2e = Number(data.total_kgco2e || totalTco2e * 1000);
  const breakdown = data.breakdown || {};
  const energy = Number(breakdown.energy_kg || 0);
  const travel = Number(breakdown.travel_kg || 0);
  const waste = Number(breakdown.waste_kg || 0);
  const componentTotal = energy + travel + waste;
  const divisor = componentTotal || totalKgco2e || 1;
  const energyPct = Math.round((energy / divisor) * 100);
  const travelPct = Math.round((travel / divisor) * 100);
  const wastePct = Math.max(0, 100 - energyPct - travelPct);
  const largest = [
    ['Energy', energy, energyPct],
    ['Travel', travel, travelPct],
    ['Waste', waste, wastePct],
  ].sort((a, b) => b[1] - a[1])[0];

  return (
    <main className="dashboard-shell">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <div className="dashboard-kicker">CARBONAI / INSIGHTS</div>
            <h1>{data.company_name || 'Company Dashboard'}</h1>
            <p>Your latest carbon footprint, translated into clear actions.</p>
          </div>
          <button className="dashboard-ghost" type="button" onClick={restart}>↻ Restart assessment</button>
        </header>

        <section className="dashboard-hero-card">
          <div className="hero-copy">
            <div className="hero-eyebrow"><span className="pulse-dot" /> LATEST ASSESSMENT</div>
            <h2>{totalTco2e.toFixed(2)} <small>tCO₂e</small></h2>
            <p>Estimated annual carbon footprint</p>
            <div className="hero-meta"><span>{totalKgco2e.toFixed(0)} kg CO₂e</span><span>•</span><span>Based on submitted activity data</span></div>
          </div>
          <div className="hero-ring" style={{ background: `conic-gradient(#a8ebc0 ${Math.min(100, Math.max(3, largest[2]))}%, rgba(255,255,255,.10) 0)` }}>
            <div><strong>{largest[2]}%</strong><span>largest source</span></div>
          </div>
        </section>

        <section className="dashboard-metrics">
          <article className="metric-card metric-card-featured"><span>♨</span><label>Total emissions</label><strong>{totalTco2e.toFixed(2)}</strong><small>tCO₂e / year</small></article>
          <article className="metric-card"><span>⚡</span><label>Energy</label><strong>{energy.toFixed(1)}</strong><small>kg CO₂e · {energyPct}%</small></article>
          <article className="metric-card"><span>✈</span><label>Travel</label><strong>{travel.toFixed(1)}</strong><small>kg CO₂e · {travelPct}%</small></article>
          <article className="metric-card"><span>♻</span><label>Waste</label><strong>{waste.toFixed(1)}</strong><small>kg CO₂e · {wastePct}%</small></article>
        </section>

        <section className="dashboard-grid">
          <article className="dashboard-panel breakdown-panel">
            <div className="panel-heading"><div><span className="panel-kicker">WHERE IT COMES FROM</span><h3>Emission breakdown</h3></div><span className="panel-icon">◌</span></div>
            <div className="breakdown-content">
              <div className="dashboard-donut" style={{ background: `conic-gradient(#6fbc8d 0 ${energyPct}%, #b9d8c2 ${energyPct}% ${energyPct + travelPct}%, #e1eadf ${energyPct + travelPct}% 100%)` }}><div><strong>{totalKgco2e.toFixed(0)}</strong><span>kg CO₂e</span></div></div>
              <div className="breakdown-legend">
                <div><i className="legend-dot energy" /><span>Energy</span><strong>{energyPct}%</strong></div>
                <div><i className="legend-dot travel" /><span>Travel</span><strong>{travelPct}%</strong></div>
                <div><i className="legend-dot waste" /><span>Waste</span><strong>{wastePct}%</strong></div>
              </div>
            </div>
          </article>

          <article className="dashboard-panel insight-panel">
            <div className="panel-heading"><div><span className="panel-kicker">AI INSIGHT</span><h3>Your biggest lever</h3></div><span className="sparkle">✦</span></div>
            <div className="insight-source"><span>{largest[0]}</span><strong>{largest[2]}%</strong></div>
            <p>{largest[0]} currently represents the largest share of the measured footprint. Focus your first reduction experiments here for the clearest potential impact.</p>
            <div className="insight-line"><span>Recommended focus</span><strong>{largest[0]} reduction</strong></div>
          </article>
        </section>

        <section className="dashboard-section-title"><div><span className="panel-kicker">PLAN AHEAD</span><h2>Explore your impact</h2></div><p>Test realistic sustainability changes before committing resources.</p></section>
        <WhatIfSimulator companyId={data.company_id} baseline={breakdown} />

        <section className="dashboard-section-title action-title"><div><span className="panel-kicker">AI ACTION PLAN</span><h2>Turn insight into action</h2></div></section>
        <ActionPlanList companyId={data.company_id} />
      </div>
    </main>
  );
}
