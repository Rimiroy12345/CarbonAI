import { useRef, useState } from 'react';
import { FileUp, FileCheck2, AlertCircle, X } from 'lucide-react';
import { api } from '../services/api';
import './DocumentUpload.css';

const fields = { electricity: 'Electricity', naturalGas: 'Natural gas', petrol: 'Petrol', diesel: 'Diesel', flights: 'Air travel', hotels: 'Hotel stays', commuting: 'Commuting', waste: 'Waste' };

export default function DocumentUpload({ onApply }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [applied, setApplied] = useState(false);
  const input = useRef(null);

  const chooseFile = (chosen) => {
    setError(''); setResult(null); setRows([]); setConfirmed(false); setApplied(false);
    if (!chosen) { setFile(null); return; }
    if (!/\.(pdf|xlsx|csv)$/i.test(chosen.name)) { setFile(null); setError('Choose a PDF, XLSX or CSV file.'); return; }
    if (!chosen.size || chosen.size > 100 * 1024 * 1024) { setFile(null); setError('Choose a non-empty file up to 100 MB.'); return; }
    setFile(chosen);
  };
  const extract = async () => {
    setBusy(true); setError(''); setResult(null); setApplied(false); setConfirmed(false);
    try {
      const form = new FormData(); form.append('file', file);
      const response = await api.post('/documents/extract', form, { headers: { 'Content-Type': undefined }, timeout: 120000 });
      setResult(response.data);
      setRows(response.data.records.map((row) => ({ ...row, selected: true, value: String(row.value) })));
    } catch (err) { setError(err?.response?.data?.detail || (err.code === 'ECONNABORTED' ? 'Processing took too long. Try a smaller file or retry shortly.' : 'Unable to process this document. Please try again.')); }
    finally { setBusy(false); }
  };
  const update = (id, values) => { setRows((previous) => previous.map((row) => row.id === id ? { ...row, ...values } : row)); setApplied(false); setConfirmed(false); };
  const selected = rows.filter((row) => row.selected);
  const valid = selected.length > 0 && selected.every((row) => row.value.trim() !== '' && Number.isFinite(Number(row.value)) && Number(row.value) >= 0);
  const apply = () => {
    if (!valid || !confirmed) return;
    const totals = {}; selected.forEach((row) => { totals[row.field] = (totals[row.field] || 0) + Number(row.value); });
    onApply(Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, String(value)])));
    setApplied(true);
  };
  return <section className="document-panel" aria-labelledby="document-title">
    <div className="document-heading"><div><span className="new-eyebrow">DOCUMENT INTELLIGENCE</span><h2 id="document-title">Let your documents do the talking.</h2><p>Extract activity data, check the evidence, and bring it into your assessment.</p></div><FileUp size={28}/></div>
    <div className="document-drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (!busy) chooseFile(e.dataTransfer.files[0]); }}>
      <input ref={input} type="file" accept=".pdf,.xlsx,.csv" disabled={busy} aria-label="Select company activity document" onChange={(e) => chooseFile(e.target.files[0])}/>
      <p><strong>{file ? file.name : 'Drop a company document here'}</strong></p><span>Text-based PDF, Excel (.xlsx), or CSV · Up to 100 MB · PDFs up to 60 pages</span>
      <div className="document-buttons"><button type="button" className="carbonai-secondary" disabled={busy} onClick={() => input.current.click()}>{file ? 'Choose another file' : 'Choose file'}</button>{file && <button type="button" className="carbonai-primary" disabled={busy} onClick={extract}>{busy ? 'Reading your document…' : 'Extract activity data'}</button>}</div>
    </div>
    <p className="document-privacy">Extracted text is sent to our cloud AI provider for analysis. Files are not saved by CarbonAI. Scanned images need OCR and are not supported yet.</p>
    <a className="document-template" href="/CarbonAI_Activity_Template.csv" download>Download activity template ↗</a>
    {busy && <p role="status" className="document-message">Reading and classifying your data. This may take a minute if the service is waking up.</p>}
    {error && <p role="alert" className="document-error"><AlertCircle size={17}/>{error}</p>}
    {result && <div className="document-review"><div className="document-review-header"><div><h3>Review extracted data</h3><p>{result.document_type} · {result.records.length} values · {result.method === 'cloud-ai' ? 'Cloud AI with evidence validation' : 'Rule-based extraction'}</p></div><FileCheck2 size={24}/></div>
      <div className="document-warnings">{result.warnings.map((warning, i) => <p key={i}>{warning}</p>)}</div>
      <div className="document-rows">{rows.map((row) => <article className={`document-row ${row.selected ? '' : 'excluded'}`} key={row.id}>
        <div className="document-row-title"><label><input type="checkbox" checked={row.selected} onChange={(e) => update(row.id, { selected: e.target.checked })}/>{fields[row.field]}</label><span>Suggested Scope {row.scope}</span></div>
        <div className="document-value"><label>Annual value to import<input type="number" min="0" step="any" value={row.value} onChange={(e) => update(row.id, { value: e.target.value })}/></label><span>{row.unit}</span><small>Document period: {row.period}</small></div>
        <details><summary>Source: {row.source} · View evidence</summary><p>{row.evidence}</p><small>Original: {row.original_value} {row.original_unit}</small></details>
      </article>)}</div>
      {rows.length > 0 && <><label className="document-confirm"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}/>I checked the units, periods, scope suggestions and duplicates. Selected values represent annual totals for the same reporting year.</label><p className="document-privacy">Selected rows for the same activity are added together. Import replaces existing values for those activities; other fields stay as entered.</p><div className="document-buttons"><button type="button" className="carbonai-primary" disabled={!valid || !confirmed} onClick={apply}>Import reviewed values →</button><button type="button" className="hero-text-button" onClick={() => { setResult(null); setRows([]); setFile(null); setApplied(false); }}>Discard extraction <X size={14}/></button></div></>}
      {applied && <p role="status" className="document-message">Reviewed values imported. Continue below to check your annual emissions data.</p>}
    </div>}
  </section>;
}
