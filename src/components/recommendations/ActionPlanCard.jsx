import React from 'react';

export default function ActionPlanCard({ rec }) {
  return (
    <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow mb-4">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-800 text-lg">{rec.title}</h4>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
          {rec.roi || 'High ROI'}
        </span>
      </div>
      <p className="text-gray-600 text-sm mb-4">{rec.description}</p>
      <div className="flex justify-between items-center text-xs font-medium text-gray-500 border-t border-gray-50 pt-3">
        <span>Impact: <strong className="text-emerald-600">{rec.impact || 'High'}</strong></span>
        <span>Est. Reduction: <strong className="text-emerald-600">{rec.estimated_savings || '15%'}</strong></span>
      </div>
    </div>
  );
}
