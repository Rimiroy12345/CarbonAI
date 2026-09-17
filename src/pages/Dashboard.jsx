import React, { useEffect, useState } from 'react';
import { getDashboardResults } from '../services/api';
import WhatIfSimulator from '../components/simulator/WhatIfSimulator';
import ActionPlanList from '../components/recommendations/ActionPlanList';

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
        setError(
          err?.response?.data?.detail ||
          'No assessment data found. Complete an assessment first.'
        );
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [companyId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading Carbon AI Dashboard...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">No assessment yet</h1>
          <p className="text-gray-500 mt-2">
            {error || 'Complete your company assessment to see your carbon dashboard.'}
          </p>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem('carbonai_restart_assessment', '1');
              window.location.reload();
            }}
            style={{
              marginTop: '24px',
              padding: '12px 20px',
              borderRadius: '999px',
              border: '1px solid #d9e8df',
              background: '#ffffff',
              color: '#235c41',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ↻ Start assessment
          </button>
        </div>
      </div>
    );
  }

  const totalTco2e = Number(data.total_tco2e || 0);
  const totalKgco2e = Number(data.total_kgco2e || totalTco2e * 1000);
  const breakdown = data.breakdown || {};

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="mb-8">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '20px',
          flexWrap: 'wrap',
        }}>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {data.company_name || 'Company Dashboard'}
            </h1>
            <p className="text-gray-500">
              Carbon footprint overview based on your latest assessment
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              localStorage.setItem('carbonai_restart_assessment', '1');
              window.location.reload();
            }}
            style={{
              padding: '11px 18px',
              borderRadius: '999px',
              border: '1px solid #d9e8df',
              background: '#ffffff',
              color: '#235c41',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            ↻ Restart assessment
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-emerald-600 text-white rounded-xl shadow-sm">
          <span className="text-xs uppercase tracking-wider font-semibold opacity-80">
            Total Emissions
          </span>
          <div className="text-3xl font-bold mt-2">
            {totalTco2e.toFixed(2)} tCO₂e
          </div>
          <div className="text-xs opacity-80 mt-1">
            {totalKgco2e.toFixed(0)} kg CO₂e
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
          <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">
            Energy Carbon Footprint
          </span>
          <div className="text-2xl font-bold text-gray-800 mt-2">
            {Number(breakdown.energy_kg || 0).toFixed(1)} kg CO₂e
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
          <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">
            Travel & Waste
          </span>
          <div className="text-2xl font-bold text-gray-800 mt-2">
            {(
              Number(breakdown.travel_kg || 0) +
              Number(breakdown.waste_kg || 0)
            ).toFixed(1)}{' '}
            kg CO₂e
          </div>
        </div>
      </div>

      <WhatIfSimulator
        companyId={data.company_id}
        baseline={breakdown}
      />
      <ActionPlanList companyId={data.company_id} />
    </div>
  );
}
