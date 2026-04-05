'use client';

import { useMemo, useState } from 'react';
import { useAnimationStore } from '@/lib/store';

export default function CSSOutput() {
  const { keyframes, duration, delay, iterations, easing, transformOrigin } =
    useAnimationStore();
  const [copied, setCopied] = useState(false);

  const cssCode = useMemo(() => {
    const { from, to } = keyframes;

    const formatTransform = (kf: typeof from) => {
      const transforms: string[] = [];
      if (kf.translateX !== 0 || kf.translateY !== 0) {
        transforms.push(`translate(${kf.translateX}px, ${kf.translateY}px)`);
      }
      if (kf.scale !== 1) {
        transforms.push(`scale(${kf.scale})`);
      }
      if (kf.rotate !== 0) {
        transforms.push(`rotate(${kf.rotate}deg)`);
      }
      return transforms.length > 0 ? transforms.join(' ') : 'none';
    };

    const fromTransform = formatTransform(from);
    const toTransform = formatTransform(to);

    const keyframesCSS = `@keyframes custom-animation {
  0% {
    transform: ${fromTransform};
    opacity: ${from.opacity};
  }
  100% {
    transform: ${toTransform};
    opacity: ${to.opacity};
  }
}`;

    const iterationValue = iterations === 'infinite' ? 'infinite' : iterations;

    const animationCSS = `.animated-element {
  animation: custom-animation ${duration}s ${easing} ${delay}s ${iterationValue} alternate both;
  transform-origin: ${transformOrigin};
}`;

    return `${keyframesCSS}\n\n${animationCSS}`;
  }, [keyframes, duration, delay, iterations, easing, transformOrigin]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cssCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-xs font-medium text-gray-400">CSS Output</span>
        <button
          onClick={handleCopy}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {copied ? 'Copied!' : 'Copy CSS'}
        </button>
      </div>

      {/* Code display */}
      <pre className="p-4 text-xs font-mono text-gray-300 overflow-x-auto">
        <code>{cssCode}</code>
      </pre>
    </div>
  );
}
