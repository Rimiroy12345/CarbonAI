import React, { useEffect, useState } from 'react';
import { getDashboardResults, submitAssessment, runWhatIfSimulation } from '../services/api';
import WhatIfSimulator from '../components/simulator/WhatIfSimulator';
import ActionPlanList from '../components/recommendations/ActionPlanList';

export default function Dashboard({ companyId = "demo-company" }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const results = await getDashboardResults();
        setData(results);
      } catch (err) {
        setData({
          company_name: "EcoTech Industries",
          total_emissions: 8000,
          breakdown: { energy_kg: 5000, travel_kg: 2000, waste_kg: 1000 }
        });
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [companyId]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Carbon AI Dashboard...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{data?.company_name || 'Company Dashboard'}</h1>
        <p className="text-gray-500">Real-time Carbon Intelligence & Mitigation Intelligence</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-emerald-600 text-white rounded-xl shadow-sm">
          <span className="text-xs uppercase tracking-wider font-semibold opacity-80">Total Emissions</span>
          <div className="text-3xl font-bold mt-2">{data?.total_emissions || 0} kg CO₂e</div>
        </div>
        <div className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
          <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">Energy Carbon Footprint</span>
          <div className="text-2xl font-bold text-gray-800 mt-2">{data?.breakdown?.energy_kg || 0} kg CO₂e</div>
        </div>
        <div className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
          <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">Travel & Waste</span>
          <div className="text-2xl font-bold text-gray-800 mt-2">
            {(data?.breakdown?.travel_kg || 0) + (data?.breakdown?.waste_kg || 0)} kg CO₂e
          </div>
        </div>
      </div>

      <WhatIfSimulator companyId={companyId} baseline={data?.breakdown} />
      <ActionPlanList companyId={companyId} />
    </div>
  );
}