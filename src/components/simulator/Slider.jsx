import React from 'react';

export default function Slider({ label, value, onChange, min = 0, max = 100, step = 1, unit = "%" }) {
  return (
    <div className="flex flex-col gap-2 my-3">
      <div className="flex justify-between text-sm font-medium text-gray-700">
        <span>{label}</span>
        <span className="font-semibold text-emerald-600">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
      />
    </div>
  );
}
