import React, { useState, useEffect } from 'react';
import Slider from './Slider';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { runWhatIfSimulation } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'; // <-- Put it right here

export default function WhatIfSimulator({ companyId, baseline }) {
  const [renewableMix, setRenewableMix] = useState(0);
  const [travelReduction, setTravelReduction] = useState(0);
  const [wasteRecycling, setWasteRecycling] = useState(0);

  // Client-side instant baseline fallbacks
  const energyBaseline = baseline?.energy_kg || 5000;
  const travelBaseline = baseline?.travel_kg || 2000;
  const wasteBaseline = baseline?.waste_kg || 1000;

  // Local calculation for immediate UI preview
  const simulatedEnergy = energyBaseline * (1 - renewableMix / 100);
  const simulatedTravel = travelBaseline * (1 - travelReduction / 100);
  const simulatedWaste = wasteBaseline * (1 - wasteRecycling / 100);

  const totalBaseline = energyBaseline + travelBaseline + wasteBaseline;
  const totalSimulated = simulatedEnergy + simulatedTravel + simulatedWaste;
  const totalSaved = totalBaseline - totalSimulated;

  // Sync simulation payload with the live backend
  useEffect(() => {
    const syncSimulationWithBackend = async () => {
      try {
        await runWhatIfSimulation({
          companyId,
          renewableMix,
          travelReduction,
          wasteRecycling,
          totalSaved,
        });
      } catch (error) {
        console.error("Backend simulation sync failed, using local preview state:", error);
      }
    };

    const timer = setTimeout(() => {
      syncSimulationWithBackend();
    }, 400); // 400ms debounce to avoid spamming network calls on rapid slider drag

    return () => clearTimeout(timer);
  }, [renewableMix, travelReduction, wasteRecycling, companyId, totalSaved]);

  const chartData = [
    { category: 'Energy', Baseline: energyBaseline, Simulated: simulatedEnergy },
    { category: 'Travel', Baseline: travelBaseline, Simulated: simulatedTravel },
    { category: 'Waste', Baseline: wasteBaseline, Simulated: simulatedWaste },
  ];

 const exportPDF = async () => {
  const element = document.getElementById('simulator-report');
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
  });

  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF('p', 'mm', 'a4');

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = (canvas.height * contentWidth) / canvas.width;

  let heightLeft = contentHeight;
  let position = margin;

  pdf.addImage(
    imgData,
    'PNG',
    margin,
    position,
    contentWidth,
    contentHeight
  );

  heightLeft -= pageHeight - margin * 2;

  while (heightLeft > 0) {
    position = margin - (contentHeight - heightLeft);

    pdf.addPage();

    pdf.addImage(
      imgData,
      'PNG',
      margin,
      position,
      contentWidth,
      contentHeight
    );

    heightLeft -= pageHeight - margin * 2;
  }

  pdf.save('CarbonAI_Simulation_Report.pdf');
};

   return (
    <div
      id="simulator-report"
      className="p-6 bg-white rounded-xl shadow-md border border-gray-100 my-6"
    >
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            What-If Scenario Simulator
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Adjust sustainability levers to project potential carbon reductions.
          </p>
        </div>

        <button
          onClick={exportPDF}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          Export Report (PDF)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-semibold text-gray-700">
              Reduction Levers
            </h3>
            <span className="text-xs text-gray-400">
              Adjust to explore scenarios
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Renewable Energy Mix
                </span>
                <span className="text-sm font-bold text-emerald-600">
                  {renewableMix}%
                </span>
              </div>

              <Slider
                label="Renewable Energy Mix"
                value={renewableMix}
                onChange={setRenewableMix}
              />
            </div>

            <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Business Travel Reduction
                </span>
                <span className="text-sm font-bold text-emerald-600">
                  {travelReduction}%
                </span>
              </div>

              <Slider
                label="Business Travel Reduction"
                value={travelReduction}
                onChange={setTravelReduction}
              />
            </div>

            <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Waste Diversion / Recycling
                </span>
                <span className="text-sm font-bold text-emerald-600">
                  {wasteRecycling}%
                </span>
              </div>

              <Slider
                label="Waste Diversion / Recycling"
                value={wasteRecycling}
                onChange={setWasteRecycling}
              />
            </div>
          </div>

          <div className="mt-5 p-5 bg-emerald-50 rounded-xl border border-emerald-100">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Projected Annual Impact
            </span>

            <div className="text-3xl font-bold text-emerald-700 mt-1">
              -{totalSaved.toFixed(1)}
              <span className="text-sm font-normal ml-1">
                kg CO₂e / yr
              </span>
            </div>

            <p className="text-xs text-emerald-700 mt-2">
              Estimated reduction compared with the current baseline.
            </p>
          </div>
        </div>

        <div>
          <div className="mb-3">
            <h3 className="text-md font-semibold text-gray-700">
              Emissions Comparison
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Baseline vs simulated annual emissions
            </p>
          </div>

          <div className="h-72 p-3 rounded-xl border border-gray-100 bg-gray-50">
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
    </div>
  );
}