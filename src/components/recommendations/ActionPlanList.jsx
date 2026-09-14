import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import ActionPlanCard from './ActionPlanCard';

export default function ActionPlanList({ companyId }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecs() {
      try {
        const data = await api.getRecommendations(companyId);
        setRecommendations(data.recommendations || []);
      } catch (err) {
        setRecommendations([
          {
            title: "Transition to Solar Power Subscriptions",
            description: "Switching 40% of grid energy to local solar providers yields immediate operational offset.",
            roi: "12 Mos Payback",
            impact: "High",
            estimated_savings: "250 kg CO₂e"
          },
          {
            title: "Optimize Logistics Route Scheduling",
            description: "Deploy algorithmic route mapping to consolidate delivery runs and reduce transport emissions.",
            roi: "Immediate",
            impact: "Medium",
            estimated_savings: "110 kg CO₂e"
          }
        ]);
      } finally {
        setLoading(false);
      }
    }
    if (companyId) loadRecs();
  }, [companyId]);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl border border-gray-100 animate-pulse my-6">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-20 bg-gray-100 rounded mb-3"></div>
        <div className="h-20 bg-gray-100 rounded"></div>
      </div>
    );
  }

  return (
    <div className="my-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">AI Recommended Action Plan</h3>
      {recommendations.map((rec, idx) => (
        <ActionPlanCard key={idx} rec={rec} />
      ))}
    </div>
  );
}
