import React, { useEffect, useState } from 'react';
import { getActionPlan } from '../../services/api';

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
          setError(
            err?.response?.data?.detail ||
            err?.message ||
            'Unable to generate the AI action plan right now.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadActionPlan();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl border border-gray-100 animate-pulse my-6">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-20 bg-gray-100 rounded mb-3"></div>
        <div className="h-20 bg-gray-100 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-6 p-5 bg-white border border-amber-100 rounded-xl shadow-sm">
        <h3 className="text-xl font-bold text-gray-800 mb-2">AI Recommended Action Plan</h3>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="my-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">AI Recommended Action Plan</h3>
      <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm">
        <div className="flex flex-wrap gap-2 mb-4 text-xs font-semibold">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
            Scope 1: {Number(data?.scope1 || 0).toFixed(2)} tCO₂e
          </span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
            Scope 2: {Number(data?.scope2 || 0).toFixed(2)} tCO₂e
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
            Scope 3: {Number(data?.scope3 || 0).toFixed(2)} tCO₂e
          </span>
        </div>
        <div className="text-sm text-gray-700 leading-7 whitespace-pre-wrap">
          {data?.action_plan || 'No AI recommendations were returned.'}
        </div>
      </div>
    </div>
  );
}
