import React from 'react';
import { SummaryLength, SummaryTemplate } from '../types';
import { CheckIcon } from './icons';

interface SummaryOptionsProps {
  selectedLength: SummaryLength;
  onLengthChange: (length: SummaryLength) => void;
  selectedTemplate: SummaryTemplate;
  onTemplateChange: (template: SummaryTemplate) => void;
}

const SummaryOptions: React.FC<SummaryOptionsProps> = ({
  selectedLength,
  onLengthChange,
  selectedTemplate,
  onTemplateChange,
}) => {
  const options = [
    { id: SummaryLength.Short, label: '짧게', description: '약 3줄' },
    { id: SummaryLength.Medium, label: '중간', description: '약 1문단' },
  ];

  const templateOptions = [
    {
      id: SummaryTemplate.Default,
      label: '기본',
      description: '범용 서머리',
      hint: '모든 부서에서 사용할 수 있는 일반 요약',
    },
    {
      id: SummaryTemplate.RndReport,
      label: 'R&D 리포트',
      description: '기술적 하이라이트',
      hint: '연구 부서의 실험 결과 및 인사이트 정리에 최적화',
    },
    {
      id: SummaryTemplate.HrBullet,
      label: 'HR 브리핑',
      description: '조직 공지 포맷',
      hint: '인사 부서 공지나 정책 정리를 위한 핵심 bullet 요약',
    },
    {
      id: SummaryTemplate.SalesActionItems,
      label: '세일즈 액션',
      description: '후속 조치 중심',
      hint: '영업팀 미팅 회의록에서 follow-up 항목을 정리',
    },
  ];

  return (
    <div className="w-full space-y-6">
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

      <fieldset className="w-full">
        <legend className="text-lg font-semibold text-slate-200 mb-2">요약 템플릿</legend>
        <p className="text-sm text-slate-400 mb-3">
          부서별 추천 양식을 선택하면 해당 업무 흐름에 맞춰 요약이 제공됩니다.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {templateOptions.map((option) => (
            <div key={option.id} className="relative">
              <input
                type="radio"
                name="summary-template"
                id={option.id}
                value={option.id}
                checked={selectedTemplate === option.id}
                onChange={() => onTemplateChange(option.id)}
                className="sr-only peer"
              />
              <label
                htmlFor={option.id}
                className="flex flex-col p-4 border-2 border-slate-600 rounded-lg cursor-pointer transition-all duration-200 peer-checked:border-indigo-500 peer-checked:bg-indigo-900/20 hover:border-slate-500"
                title={option.hint}
              >
                <span className="font-semibold text-slate-200">{option.label}</span>
                <span className="text-sm text-slate-400">{option.description}</span>
                <span className="text-xs text-slate-500 mt-2">{option.hint}</span>
              </label>
              {selectedTemplate === option.id && (
                <div className="absolute top-3 right-3 text-white bg-indigo-500 rounded-full p-0.5">
                  <CheckIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </fieldset>
    </div>
  );
};

export default SummaryOptions;
