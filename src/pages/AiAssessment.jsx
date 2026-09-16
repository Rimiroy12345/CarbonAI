import AiAssessment from './pages/AiAssessment';
import React, { useState } from 'react';
import { submitAssessment } from '../services/api';

export default function AiAssessment() {
  const [formData, setFormData] = useState({
    company_name: '',
    scope1: '',
    scope2: '',
    scope3: '',
    industry: 'Technology'
  });
  
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await submitAssessment({
        company_name: formData.company_name,
        scope1_emissions: parseFloat(formData.scope1) || 0,
        scope2_emissions: parseFloat(formData.scope2) || 0,
        scope3_emissions: parseFloat(formData.scope3) || 0,
        industry: formData.industry
      });
      setAiResult(data);
    } catch (err) {
      console.error(err);
      setError('Failed to generate AI action plan. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-2 text-emerald-400">🤖 CarbonAI Intelligent Assessor</h1>
      <p className="text-gray-400 mb-6">Input your corporate emissions metrics to generate a real-time AI-powered reduction roadmap.</p>

      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Company Name</label>
          <input 
            type="text" 
            name="company_name" 
            value={formData.company_name} 
            onChange={handleChange}
            required
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-emerald-500 focus:outline-none"
            placeholder="e.g. EcoTech Industries"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Scope 1 (Direct - kg)</label>
            <input 
              type="number" 
              name="scope1" 
              value={formData.scope1} 
              onChange={handleChange}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-emerald-500 focus:outline-none"
              placeholder="5000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Scope 2 (Energy - kg)</label>
            <input 
              type="number" 
              name="scope2" 
              value={formData.scope2} 
              onChange={handleChange}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-emerald-500 focus:outline-none"
              placeholder="3000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Scope 3 (Supply Chain - kg)</label>
            <input 
              type="number" 
              name="scope3" 
              value={formData.scope3} 
              onChange={handleChange}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-emerald-500 focus:outline-none"
              placeholder="12000"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition duration-200 mt-4 disabled:opacity-50"
        >
          {loading ? 'Analyzing with AI Engine...' : 'Generate AI Reduction Roadmap 🚀'}
        </button>
      </form>

      {error && <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-6">{error}</div>}

      {aiResult && (
        <div className="bg-gray-800 p-6 rounded-xl border border-emerald-500/50 shadow-xl space-y-4">
          <h2 className="text-2xl font-semibold text-emerald-300">Generated Action Plan</h2>
          <p className="text-gray-300">Total Carbon Footprint: <span className="font-bold text-white">{aiResult.total_emissions || 'Calculated'} kg CO2e</span></p>
          <div className="bg-gray-900 p-4 rounded border border-gray-700 whitespace-pre-line text-gray-200">
            {aiResult.action_plan || JSON.stringify(aiResult, null, 2)}
          </div>
        </div>
      )}
    </div>
  );
}