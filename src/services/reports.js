import { jsPDF } from 'jspdf';

export function buildAssessmentPdf(data, analysis = null) {
  const pdf = new jsPDF();
  let y = 30;
  const text = (value, heading = false) => {
    if (heading && y > 245) { pdf.addPage(); y = 25; }
    pdf.setFont('helvetica', heading ? 'bold' : 'normal');
    pdf.setFontSize(heading ? 13 : 10);
    const clean = String(value ?? '').replace(/CO₂/g, 'CO2').replace(/[–—]/g, '-').replace(/[^\x20-\x7E\n]/g, '?');
    const lines = pdf.splitTextToSize(clean, 170);
    for (const line of lines) {
      if (y > 270) { pdf.addPage(); y = 25; }
      pdf.text(line, 20, y); y += heading ? 7 : 5;
    }
    y += 4;
  };
  text('CarbonAI | Assessment report', true);
  text(data.company_name, true);
  text(`Assessment ID: ${data.company_id}\nReporting year: ${data.reporting_year ?? 'Not recorded'} (January-December)\nSaved: ${data.calculated_at}\nExported: ${new Date().toISOString()}\nIndustry: ${data.industry}\nLocation: ${data.location || 'Not provided'}\nEmployees: ${data.employee_count ?? 'Not provided'}`);
  text(`Calculation snapshot: ${data.snapshot?.calculation_captured_at || 'Not retained'} | ${data.snapshot?.provenance || 'legacy_unsaved'}`);
  text('Calculated footprint', true);
  text(`Saved footprint: ${Number(data.total_tco2e).toFixed(4)} tCO2e\nCalculation-context footprint: ${(data.total_kgco2e / 1000).toFixed(4)} tCO2e`);
  for (const scope of [1, 2, 3]) {
    const rows = data.activities.filter(row => row.scope === scope);
    text(`Scope ${scope}: ${(rows.reduce((sum, row) => sum + row.emissions_kgco2e, 0) / 1000).toFixed(4)} tCO2e`, true);
    for (const row of rows) text(`${row.category.replaceAll('_', ' ')}: ${row.quantity} ${row.unit} x ${row.factor ?? 'Missing factor'} kgCO2e/${row.unit} = ${row.emissions_kgco2e} kgCO2e`);
  }
  text('Method and boundaries', true);
  text('Annual activity quantities multiplied by the assessment calculation factors. New assessments preserve their original inputs and factors. Older assessments captured later may differ from their original saved total. Scope 1 assumes owned or controlled fuel use. Scope 2 covers purchased electricity. Scope 3 includes reported travel, hotels, commuting and waste only; this is not a complete inventory. Inputs were reviewed or entered by the user; uploaded source documents are not retained. This report contains no ML forecast or verified reduction claim.');
  if (analysis) {
    text('AI-generated interpretation', true);
    text('Saved AI advice is reused for this assessment; the report export does not regenerate existing advice. Review recommendations and assumptions before acting.');
    text(`AI analysis saved: ${analysis.captured_at || 'Not available'}`);
    text(analysis.executive_summary);
    for (const item of analysis.scope_analysis || []) {
      text(`Scope ${item.scope} analysis`, true);
      text(`Finding: ${item.finding}\nWhy: ${item.reason}\nNext step: ${item.recommendation}`);
      text(`Assumptions: ${(item.assumptions || []).join('; ')}`);
    }
    if (analysis.company_analysis) {
      text('Company priorities', true);
      const item = analysis.company_analysis;
      text(`${item.finding}\nWhy: ${item.reason}\nNext step: ${item.recommendation}\nAssumptions: ${(item.assumptions || []).join('; ')}`);
    }
    for (const [index, action] of (analysis.actions || []).entries()) {
      text(`${index + 1}. ${action.title}`, true);
      text(`Priority: ${action.priority} | Timing: ${action.timeframe}\nWhy: ${action.why_it_matters}\nExpected impact: ${action.expected_impact}`);
      for (const step of action.steps || []) text(`- ${step}`);
    }
    text(`Measurement: ${analysis.measurement}`);
  } else {
    text('AI analysis unavailable', true);
    text('The numerical assessment is included. AI analysis could not be generated for this export; no generic advice has been substituted.');
  }
  for (let page = 1; page <= pdf.getNumberOfPages(); page++) {
    pdf.setPage(page); pdf.setFontSize(8); pdf.setTextColor(90);
    pdf.text(`CarbonAI | Page ${page} of ${pdf.getNumberOfPages()}`, 20, 287);
  }
  return pdf;
}
