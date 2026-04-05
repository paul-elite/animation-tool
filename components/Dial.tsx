'use client';

import { useCallback, useRef, useState, useEffect } from 'react';

interface DialProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  label: string;
  size?: number;
  sensitivity?: number;
}

export default function Dial({
  value,
  onChange,
  min = -360,
  max = 360,
  step = 1,
  unit = '',
  label,
  size = 64,
  sensitivity = 0.5,
}: DialProps) {
  const dialRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);

  const normalizedValue = ((value - min) / (max - min)) * 270 - 135;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setStartY(e.clientY);
      setStartValue(value);
    },
    [value]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaY = startY - e.clientY;
      const deltaValue = deltaY * sensitivity * step;
      let newValue = startValue + deltaValue;

      // Snap to step
      newValue = Math.round(newValue / step) * step;

      // Clamp to min/max
      newValue = Math.max(min, Math.min(max, newValue));

      onChange(newValue);
    },
    [isDragging, startY, startValue, sensitivity, step, min, max, onChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const formatValue = (val: number) => {
    if (Math.abs(val) >= 100) return val.toFixed(0);
    if (Math.abs(val) >= 10) return val.toFixed(1);
    return val.toFixed(2);
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </span>
      <div
        ref={dialRef}
        onMouseDown={handleMouseDown}
        className={`relative cursor-ns-resize select-none transition-transform ${
          isDragging ? 'scale-105' : ''
        }`}
        style={{ width: size, height: size }}
      >
        {/* Dial background */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          style={{ transform: 'rotate(-135deg)' }}
        >
          {/* Track */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="188.5"
            strokeDashoffset="62.8"
          />
          {/* Progress */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={isDragging ? '#3B82F6' : '#6B7280'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="188.5"
            strokeDashoffset={188.5 - ((value - min) / (max - min)) * 188.5}
            className="transition-all duration-75"
          />
        </svg>

        {/* Indicator dot */}
        <div
          className="absolute w-2 h-2 bg-gray-800 rounded-full transition-transform duration-75"
          style={{
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) rotate(${normalizedValue}deg) translateY(-${size / 2 - 10}px)`,
          }}
        />

        {/* Center value display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-mono font-semibold text-gray-800">
            {formatValue(value)}
          </span>
        </div>
      </div>
      <span className="text-[10px] text-gray-400">{unit}</span>
    </div>
  );
}
