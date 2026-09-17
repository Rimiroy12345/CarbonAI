import React, { useEffect, useState } from 'react';
import { getActionPlan } from '../../services/api';

const fallbackPlan = [
  {
    title: 'Reduce your largest emission source first',
    priority: 'High',
    timeframe: '0–90 days',
    expected_impact: 'Focus investment where it can make the biggest difference.',
    why_it_matters: 'Targeting the largest source first creates momentum and makes progress visible.',
    steps: ['Review your emissions breakdown.', 'Set a reduction target.', 'Track progress monthly.'],
  },
  {
    title: 'Improve energy efficiency',
    priority: 'High',
    timeframe: '0–90 days',
    expected_impact: 'Lower electricity and fuel use while reducing operating costs.',
    why_it_matters: 'Efficiency upgrades are often the fastest way to reduce Scope 1 and Scope 2 emissions.',
    steps: ['Audit major energy users.', 'Eliminate avoidable consumption.', 'Evaluate efficient equipment and renewable electricity.'],
  },
  {
    title: 'Cut travel-related emissions',
    priority: 'Medium',
    timeframe: '3–6 months',
    expected_impact: 'Fewer avoidable trips and lower emissions per journey.',
    why_it_matters: 'Travel can grow quickly without a clear travel policy and measurement process.',
    steps: ['Set a travel baseline.', 'Prefer rail or virtual meetings where practical.', 'Add carbon criteria to travel approvals.'],
  },
];

function parsePlan(text) {
  if (!text) return null;

  try {
    const cleaned = text.trim().replace(/^\`\`\`(?:json)?\s*/i, '').replace(/\`\`\`$/i, '');
    const plan = JSON.parse(cleaned);
    if (Array.isArray(plan.actions) && plan.actions.length) {
      return {
        executive_summary: plan.executive_summary || 'A tailored action plan based on your latest assessment.',
        top_priority: plan.top_priority || null,
        actions: plan.actions.slice(0, 4).map((action) => ({
          title: action.title || 'Carbon reduction opportunity',
          priority: action.priority || 'Medium',
          timeframe: action.timeframe || 'This year',
          expected_impact: action.expected_impact || 'Measured reduction in annual emissions.',
          why_it_matters: action.why_it_matters || 'A practical step toward a lower-carbon operation.',
          steps: Array.isArray(action.steps) ? action.steps.slice(0, 3) : [],
        })),
        measurement: plan.measurement || 'Review emissions and action progress monthly.',
      };
    }
  } catch {
    // Older recommendations used Markdown. Show useful baseline cards instead.
  }

  return null;
}

function priorityClass(priority) {
  return String(priority).toLowerCase().includes('high')
    ? 'is-high'
    : String(priority).toLowerCase().includes('low')
      ? 'is-low'
      : 'is-medium';
}

export default function ActionPlanList() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadActionPlan() {
      try {
        setLoading(true);
        setError('');
        const result = await getActionPlan();
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
  }, []);

  const plan = parsePlan(data?.action_plan);
  const usingFallback = !plan;
  const actions = plan?.actions || fallbackPlan;

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

  return (
    <section className="carbon-action-plan">
      <div className="carbon-action-header">
        <div>
          <span className="carbon-action-eyebrow">AI SUSTAINABILITY ADVISOR</span>
          <h2>Your recommended action plan</h2>
          <p>Prioritized actions based on your latest emissions profile.</p>
        </div>
        <span className="carbon-action-status">{usingFallback ? 'Baseline plan' : 'AI generated'}</span>
      </div>

      {data && (
        <div className="carbon-scope-grid">
          <div><span>Scope 1</span><strong>{Number(data.scope1 || 0).toFixed(2)} tCO₂e</strong></div>
          <div><span>Scope 2</span><strong>{Number(data.scope2 || 0).toFixed(2)} tCO₂e</strong></div>
          <div><span>Scope 3</span><strong>{Number(data.scope3 || 0).toFixed(2)} tCO₂e</strong></div>
        </div>
      )}

      {usingFallback ? (
        <div className="carbon-fallback-note">
          {error
            ? 'The AI service is temporarily unavailable, so this baseline plan keeps you moving.'
            : 'Your next request will receive the new AI-formatted action plan. This baseline plan is ready to use now.'}
        </div>
      ) : (
        <div className="carbon-plan-summary">
          <span>Assessment insight</span>
          <p>{plan.executive_summary}</p>
          {plan.top_priority && (
            <div className="carbon-plan-priority">
              <strong>Start here: {plan.top_priority.title}</strong>
              <small>{plan.top_priority.why_now}</small>
            </div>
          )}
        </div>
      )}

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
              <p>{action.why_it_matters}</p>
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
