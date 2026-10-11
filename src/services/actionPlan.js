const hasText = value => typeof value === 'string' && Boolean(value.trim());
const analysisValid = item => item && ['finding', 'reason', 'recommendation'].every(key => hasText(item[key]))
  && Array.isArray(item.assumptions) && item.assumptions.every(value => typeof value === 'string');

export function parseActionPlan(text) {
  try {
    const plan = JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/i, ''));
    if (!hasText(plan.executive_summary) || !hasText(plan.measurement)
      || !hasText(plan.top_priority?.title) || !hasText(plan.top_priority?.why_now)
      || !Array.isArray(plan.scope_analysis) || plan.scope_analysis.length !== 3
      || ![1, 2, 3].every(scope => plan.scope_analysis.some(item => item?.scope === scope))
      || !plan.scope_analysis.every(analysisValid) || !analysisValid(plan.company_analysis)
      || !Array.isArray(plan.actions) || plan.actions.length !== 4
      || !plan.actions.every(action => action && ['title', 'priority', 'timeframe', 'expected_impact', 'why_it_matters'].every(key => hasText(action[key]))
        && ['High', 'Medium', 'Low'].includes(action.priority)
        && Array.isArray(action.steps) && action.steps.length > 0 && action.steps.every(hasText))) return null;
    return plan;
  } catch { return null; }
}
