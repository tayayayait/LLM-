import React from 'react';
import { SummaryLength } from '../types';
import { CheckIcon } from './icons';

interface SummaryOptionsProps {
  selectedLength: SummaryLength;
  onLengthChange: (length: SummaryLength) => void;
}

const SummaryOptions: React.FC<SummaryOptionsProps> = ({ selectedLength, onLengthChange }) => {
  const options = [
    { id: SummaryLength.Short, label: '짧게', description: '약 3줄' },
    { id: SummaryLength.Medium, label: '중간', description: '약 1문단' },
  ];

  return (
    <fieldset className="w-full">
      <legend className="text-lg font-semibold text-slate-200 mb-2">요약 길이</legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((option) => (
          <div key={option.id} className="relative">
            <input
              type="radio"
              name="summary-length"
              id={option.id}
              value={option.id}
              checked={selectedLength === option.id}
              onChange={() => onLengthChange(option.id)}
              className="sr-only peer"
            />
            <label
              htmlFor={option.id}
              className="flex flex-col p-4 border-2 border-slate-600 rounded-lg cursor-pointer transition-all duration-200 peer-checked:border-indigo-500 peer-checked:bg-indigo-900/20 hover:border-slate-500"
            >
              <span className="font-semibold text-slate-200">{option.label}</span>
              <span className="text-sm text-slate-400">{option.description}</span>
            </label>
            {selectedLength === option.id && (
                <div className="absolute top-3 right-3 text-white bg-indigo-500 rounded-full p-0.5">
                    <CheckIcon className="w-4 h-4" />
                </div>
            )}
          </div>
        ))}
      </div>
    </fieldset>
  );
};

export default SummaryOptions;
