'use client';

import * as RadixSlider from '@radix-ui/react-slider';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  unit?: string;
}

export default function Slider({
  value,
  onChange,
  min,
  max,
  step = 0.1,
  label,
  unit = '',
}: SliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <span className="text-xs font-mono text-gray-700">
          {value.toFixed(step < 1 ? 2 : 0)}{unit}
        </span>
      </div>
      <RadixSlider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
      >
        <RadixSlider.Track className="bg-gray-200 relative grow rounded-full h-1.5">
          <RadixSlider.Range className="absolute bg-gray-600 rounded-full h-full" />
        </RadixSlider.Track>
        <RadixSlider.Thumb className="block w-4 h-4 bg-white border-2 border-gray-600 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors cursor-grab active:cursor-grabbing" />
      </RadixSlider.Root>
    </div>
  );
}
