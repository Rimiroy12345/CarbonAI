import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Slider from './Slider';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function WhatIfSimulator({ companyId, baseline }) {
  const [renewableMix, setRenewableMix] = useState(0);
  const [travelReduction, setTravelReduction] = useState(0);
  const [wasteRecycling, setWasteRecycling] = useState(0);

  const energyBaseline = baseline?.energy_kg || 5000;
  const travelBaseline = baseline?.travel_kg || 2000;
  const wasteBaseline = baseline?.waste_kg || 1000;

  const simulatedEnergy = energyBaseline * (1 - renewableMix / 100);
  const simulatedTravel = travelBaseline * (1 - travelReduction / 100);
  const simulatedWaste = wasteBaseline * (1 - wasteRecycling / 100);

  const totalBaseline = energyBaseline + travelBaseline + wasteBaseline;
  const totalSimulated = simulatedEnergy + simulatedTravel + simulatedWaste;
  const totalSaved = totalBaseline - totalSimulated;

  const chartData = [
    { category: 'Energy', Baseline: energyBaseline, Simulated: simulatedEnergy },
    { category: 'Travel', Baseline: travelBaseline, Simulated: simulatedTravel },
    { category: 'Waste', Baseline: wasteBaseline, Simulated: simulatedWaste },
  ];

  const exportPDF = async () => {
    const element = document.getElementById('simulator-report');
    if (!element) return;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);
    pdf.save('CarbonAI_Simulation_Report.pdf');
  };

  return (
    <div id="simulator-report" className="p-6 bg-white rounded-xl shadow-md border border-gray-100 my-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">What-If Scenario Simulator</h2>
          <p className="text-sm text-gray-500">Adjust levers to project carbon emission reductions</p>
        </div>
        <button
          onClick={exportPDF}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Export Report (PDF)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-md font-semibold text-gray-700 mb-2">Reduction Levers</h3>
          <Slider label="Renewable Energy Mix" value={renewableMix} onChange={setRenewableMix} />
          <Slider label="Business Travel Reduction" value={travelReduction} onChange={setTravelReduction} />
          <Slider label="Waste Diversion / Recycling" value={wasteRecycling} onChange={setWasteRecycling} />

          <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Projected Impact</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              -{totalSaved.toFixed(1)} <span className="text-sm font-normal">kg CO₂e / yr</span>
            </div>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Baseline" fill="#9CA3AF" />
              <Bar dataKey="Simulated" fill="#059669" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
