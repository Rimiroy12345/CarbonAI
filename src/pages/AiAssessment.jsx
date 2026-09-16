import React, { useState } from 'react';
import { submitAssessment } from '../services/api';

export default function AiAssessment() {
  const [formData, setFormData] = useState({
    company_name: '',
    industry: 'general',
    employee_count: '',
    location: '',
    electricity: '',
    natural_gas: '',
    petrol: '',
    diesel: '',
    air_travel: '',
    hotels: '',
    commuting: '',
    waste: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        company_name: formData.company_name,
        industry: formData.industry,
        employee_count: formData.employee_count ? parseInt(formData.employee_count) : null,
        location: formData.location || null,
        electricity: parseFloat(formData.electricity) || 0,
        natural_gas: parseFloat(formData.natural_gas) || 0,
        petrol: parseFloat(formData.petrol) || 0,
        diesel: parseFloat(formData.diesel) || 0,
        air_travel: parseFloat(formData.air_travel) || 0,
        hotels: parseFloat(formData.hotels) || 0,
        commuting: parseFloat(formData.commuting) || 0,
        waste: parseFloat(formData.waste) || 0,
      };

      const data = await submitAssessment(payload);
      setResult(data);
    } catch (err) {
      console.error(err);
      setError('Submission failed. Make sure you are signed in and backend CORS/tokens are valid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-2 text-emerald-400">🌱 CarbonAI Corporate Assessor</h1>
      <p className="text-gray-400 mb-6">Enter your resource consumption metrics to calculate greenhouse gas emissions and breakdown percentages.</p>

      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg space-y-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Company Name *</label>
            <input 
              type="text" 
              name="company_name" 
              value={formData.company_name} 
              onChange={handleChange}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-emerald-500 focus:outline-none"
              placeholder="EcoTech Industries"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Industry</label>
            <input 
              type="text" 
              name="industry" 
              value={formData.industry} 
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-emerald-500 focus:outline-none"
              placeholder="general / technology / manufacturing"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Employee Count</label>
            <input 
              type="number" 
              name="employee_count" 
              value={formData.employee_count} 
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-emerald-500 focus:outline-none"
              placeholder="150"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
            <input 
              type="text" 
              name="location" 
              value={formData.location} 
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-emerald-500 focus:outline-none"
              placeholder="New York, NY"
            />
          </div>
        </div>

        <h3 className="text-xl font-semibold text-emerald-300 pt-4 border-t border-gray-700">Consumption Metrics</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Electricity (kWh)</label>
            <input type="number" step="any" name="electricity" value={formData.electricity} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" placeholder="10000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Natural Gas (m3)</label>
            <input type="number" step="any" name="natural_gas" value={formData.natural_gas} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" placeholder="500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Petrol (L)</label>
            <input type="number" step="any" name="petrol" value={formData.petrol} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" placeholder="200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Diesel (L)</label>
            <input type="number" step="any" name="diesel" value={formData.diesel} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" placeholder="300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Air Travel (km)</label>
            <input type="number" step="any" name="air_travel" value={formData.air_travel} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" placeholder="5000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Hotel Nights</label>
            <input type="number" step="any" name="hotels" value={formData.hotels} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" placeholder="20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Commuting (km)</label>
            <input type="number" step="any" name="commuting" value={formData.commuting} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" placeholder="1200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Waste (kg)</label>
            <input type="number" step="any" name="waste" value={formData.waste} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" placeholder="400" />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition duration-200 mt-6 disabled:opacity-50"
        >
          {loading ? 'Calculating Footprint...' : 'Calculate Carbon Footprint 🚀'}
        </button>
      </form>

      {error && <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-6">{error}</div>}

      {result && (
        <div className="bg-gray-800 p-6 rounded-xl border border-emerald-500/50 shadow-xl space-y-4">
          <h2 className="text-2xl font-semibold text-emerald-300">Assessment Results</h2>
          <p className="text-gray-300 text-lg">Total Carbon Footprint: <span className="font-bold text-emerald-400">{result.total_tco2e} tCO2e</span></p>
          <div className="bg-gray-900 p-4 rounded border border-gray-700">
            <h4 className="font-semibold text-gray-300 mb-2">Category Totals:</h4>
            <pre className="text-sm text-gray-300">{JSON.stringify(result.category_totals, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}