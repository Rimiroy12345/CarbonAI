import { useRef, useState } from 'react';
import { api } from '../services/api';
import { bulkFields, groupAnnualRows, duplicateRowIds } from '../services/bulkImport';
import './DocumentUpload.css';

export default function BulkDocumentUpload({ company, seriesId, onComplete }) {
  const input = useRef(null);
  const [files, setFiles] = useState([]);
  const [rows, setRows] = useState([]);
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState({});
  const [started, setStarted] = useState(false);
  const requests = useRef({});
  const extractionCache = useRef(new Map());
  const root = useRef(seriesId || null);
  const locked = saving || started;
  const units = { electricity: 'kWh', natural_gas: 'm³', petrol: 'litres', diesel: 'litres', air_travel: 'km', hotels: 'nights', commuting: 'km', waste: 'kg' };
  const years = Array.from({ length: new Date().getFullYear() - 1990 }, (_, i) => new Date().getFullYear() - 1 - i);
  const duplicates = duplicateRowIds(rows);
  let groups = [], reviewError = '';
  try { if (rows.some(row => row.selected)) groups = groupAnnualRows(rows.map(row => ({ ...row, annualConfirmed: true }))); }
  catch (err) { reviewError = err.message; }
  const choose = list => {
    if (locked || busy) return;
    const chosen = [...list];
    setError('');
    if (!chosen.length || chosen.length > 10) { setError('Select between 1 and 10 files.'); return; }
    if (chosen.some(file => !/\.(pdf|xlsx|csv)$/i.test(file.name) || !file.size || file.size > 100 * 1024 * 1024) || chosen.reduce((sum, file) => sum + file.size, 0) > 100 * 1024 * 1024) { setError('Choose non-empty PDF, XLSX or CSV files, up to 100 MB total per batch.'); return; }
    setFiles(chosen); setRows([]); setMessages([]); setConfirmed(false); requests.current = {}; root.current = seriesId || null;
    void extract(chosen);
  };
  const extract = async (selectedFiles = files) => {
    if (busy || locked || !selectedFiles.length) return;
    setBusy(true); setError(''); setRows([]); setMessages([]); setConfirmed(false);
    const extracted = [], notices = [], hashes = new Set(), identities = new Set();
    let failed = 0;
    try {
      for (const [index, file] of selectedFiles.entries()) {
        setProgress(`Reading ${index + 1} of ${selectedFiles.length}: ${file.name}`);
        setMessages([...notices, `Reading ${index + 1} of ${selectedFiles.length}: ${file.name}`]);
        try {
          const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
          const hash = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
          if (hashes.has(hash)) { notices.push(`${file.name}: identical file skipped.`); continue; }
          hashes.add(hash);
          const form = new FormData(); form.append('file', file);
          let extraction = extractionCache.current.get(hash);
          if (!extraction) {
            const response = await api.post('/documents/extract', form, { headers: { 'Content-Type': undefined }, timeout: 120000 });
            extraction = response.data; extractionCache.current.set(hash, extraction);
          }
          notices.push(`${file.name}: ${extraction.method === 'cloud-ai' ? 'Cloud AI' : 'Rule-based fallback'} · ${extraction.records.length} values.`, ...extraction.warnings.map(warning => `${file.name}: ${warning}`));
          for (const row of extraction.records) {
            const year = row.reporting_year >= 1990 && row.reporting_year < new Date().getFullYear() ? String(row.reporting_year) : '';
            const identity = JSON.stringify([year, row.field, row.value, row.unit]);
            const possibleDuplicate = identities.has(identity); identities.add(identity);
            extracted.push({ ...row, id: `${index}-${row.id}`, filename: file.name, year, value: String(row.value), selected: !possibleDuplicate, possibleDuplicate });
          }
        } catch (err) { failed++; notices.push(`${file.name}: ${err?.response?.data?.detail || err?.message || 'Extraction failed. Remove or retry this file before importing its values.'}`); }
      }
      setRows(extracted); setMessages(notices);
      if (failed && extracted.length) setError(`${failed} file(s) could not be extracted. Review the file warnings; only successfully extracted, selected rows can be saved.`);
      if (!extracted.length) setError('No activity values were extracted. Check the file messages or enter numbers manually.');
    } finally { setBusy(false); setProgress(''); }
  };
  const update = (id, change) => { setRows(previous => previous.map(row => row.id === id ? { ...row, ...change } : row)); setConfirmed(false); };
  const save = async () => {
    setSaving(true); setError('');
    const completed = { ...saved };
    try {
      const annual = groupAnnualRows(rows.map(row => ({ ...row, annualConfirmed: confirmed })));
      if (!company.name.trim()) throw new Error('Enter the company name before saving.');
      if (company.employees && (!Number.isInteger(Number(company.employees)) || Number(company.employees) < 1)) throw new Error('Employee count must be a positive whole number.');
      for (const group of annual) {
        if (completed[group.year]) continue;
        requests.current[group.year] ||= crypto.randomUUID();
        setStarted(true);
        const response = await api.post('/assessment', {
          submission_id: requests.current[group.year], reporting_year: group.year, forecast_series_id: root.current,
          company_name: company.name.trim(), industry: company.industry || 'general', location: company.location || null,
          employee_count: company.employees ? Number(company.employees) : null,
          ...Object.fromEntries(Object.values(bulkFields).map(field => [field, group.values[field] || 0])),
        }, { timeout: 120000 });
        root.current ||= response.data.company_id;
        completed[group.year] = response.data.company_id; setSaved({ ...completed });
      }
    } catch (err) { setError(err?.response?.data?.detail || err?.message || 'Saving stopped. Saved years are retained. Retry the remaining years.'); }
    finally { setSaving(false); }
  };
  const allSaved = groups.length > 0 && groups.every(group => saved[group.year]);
  return <section className="document-panel" aria-labelledby="bulk-title">
    <div className="document-heading"><div><span className="new-eyebrow">BULK DOCUMENT INTELLIGENCE</span><h2 id="bulk-title">Build your company’s annual history.</h2><p>Upload multiple files, review their reporting years, then save one assessment per year for {company.name || 'this company'}. AI advice is generated when you open each saved assessment.</p></div></div>
    <div className="document-drop" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); choose(event.dataTransfer.files); }}>
      <input ref={input} type="file" multiple accept=".pdf,.xlsx,.csv" aria-label="Select multiple company activity documents" disabled={busy || locked} onChange={event => choose(event.target.files)}/>
      <p>{files.length ? `${files.length} files selected` : 'Drop annual company documents here'}</p><span>Up to 10 files · 100 MB total per batch · Text-based PDF, XLSX or CSV</span>
      <div className="document-buttons"><button type="button" className="carbonai-secondary" disabled={busy || locked} onClick={() => input.current.click()}>Choose files</button>{files.length > 0 && !busy && <button type="button" className="carbonai-secondary" disabled={locked} onClick={() => extract()}>Retry extraction</button>}</div>
      <p role="status" aria-live="polite" className="document-message">{busy ? `${progress || 'Starting extraction…'} Review will appear below when all files finish.` : rows.length ? `${rows.length} values extracted. Next: review the rows below, confirm annual totals, then save your assessments.` : 'Choose your files to start extraction automatically. You will review the values before anything is saved.'}</p>
      <ul>{files.map((file, index) => <li key={index}>{file.name}</li>)}</ul>
    </div>
    <p className="document-privacy">Extracted text is sent to our cloud AI provider. Files are not retained. Years suggested from activity evidence or document context must be confirmed. Files containing several years can be split by assigning each row separately.</p>
    {messages.length > 0 && <details className="document-warnings"><summary>File results and warnings ({messages.length})</summary>{messages.map((message, index) => <p key={index}>{message}</p>)}</details>}
    {error && <p role="alert" className="document-error">{error}</p>}
    {rows.length > 0 && <><h3>Review values and reporting years</h3><p className="document-privacy">Possible duplicate values are initially excluded. Include them only if they represent distinct activity. Annual totals and invoice subtotals may overlap even when their quantities differ.</p>
      <fieldset disabled={locked || busy} className="bulk-review"><div className="document-rows">{rows.map(row => <article key={row.id} className={`document-row ${row.selected ? '' : 'excluded'}`}>
        <div className="document-row-title"><label><input type="checkbox" checked={row.selected} onChange={event => update(row.id, { selected: event.target.checked })}/>{row.label}</label><span>Scope {row.scope}</span></div>
        <p className="document-privacy">{row.filename} · {row.source}{row.possibleDuplicate || duplicates.has(row.id) ? ' · Possible duplicate—review before combining' : ''}</p>
        <div className="document-value"><label>Annual quantity<input type="number" min="0" step="any" value={row.value} onChange={event => update(row.id, { value: event.target.value })}/></label><span>{row.unit}</span><label>Reporting year<select value={row.year} onChange={event => update(row.id, { year: event.target.value })}><option value="">Needs review</option>{years.map(year => <option key={year} value={year}>{year}</option>)}</select></label></div>
        <small>Document period: {row.period} · Year suggestion: {row.year_source}</small><details><summary>View evidence</summary><p>{row.evidence}</p><small>Original: {row.original_value} {row.original_unit}</small></details>
      </article>)}</div></fieldset>
      {reviewError && <p role="alert" className="document-error">{reviewError}</p>}
      {groups.length > 0 && <div className="document-message"><strong>Assessments to save</strong>{groups.map(group => <div key={group.year}><h4>{group.year} · {saved[group.year] ? 'Saved' : 'Pending'}</h4><ul>{Object.entries(group.values).map(([field, quantity]) => <li key={field}>{field.replaceAll('_', ' ')}: {quantity} {units[field]}</li>)}</ul><p>Categories absent from this year’s selected rows will be saved as zero. Confirm that no required activity is missing.</p></div>)}</div>}
      <label className="document-confirm"><input type="checkbox" disabled={locked} checked={confirmed} onChange={event => setConfirmed(event.target.checked)}/>I reviewed the file warnings, every selected row, reporting year, unit and duplicate. These are complete annual totals for the same company, adjusted for any monthly figures. Unreported categories are confirmed zero. New assessments add versions and preserve older assessments.</label>
      <div className="document-buttons"><button type="button" className="carbonai-primary" disabled={busy || saving || allSaved || !confirmed || !groups.length || Boolean(reviewError)} onClick={save}>{saving ? 'Saving annual assessments…' : Object.keys(saved).length ? 'Retry remaining years' : `Save ${groups.length} annual assessment${groups.length === 1 ? '' : 's'}`}</button>{allSaved && <button type="button" className="carbonai-secondary" onClick={() => onComplete(saved[Math.max(...groups.map(group => group.year))])}>Open latest assessment →</button>}</div>
      {Object.keys(saved).length > 0 && <p role="status" className="document-message">Saved years: {Object.keys(saved).sort().join(', ')}. Saved assessments are in your history. Keep this page open until remaining years finish; repeated saves reuse the same import identifiers.</p>}
    </>}
  </section>;
}
