'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect, useCallback } from 'react';
import { useAnimationStore } from '@/lib/store';

export default function Canvas() {
  const {
    keyframes,
    duration,
    delay,
    iterations,
    easing,
    transformOrigin,
    isPlaying,
    isLooping,
    elementType,
    elementText,
  } = useAnimationStore();

  const controls = useAnimation();

  const getEasingArray = useCallback((easingStr: string): [number, number, number, number] | string => {
    const easingMap: Record<string, [number, number, number, number] | string> = {
      'ease': [0.25, 0.1, 0.25, 1],
      'ease-in': [0.42, 0, 1, 1],
      'ease-out': [0, 0, 0.58, 1],
      'ease-in-out': [0.42, 0, 0.58, 1],
      'linear': 'linear',
    };

    if (easingStr.startsWith('cubic-bezier')) {
      const match = easingStr.match(/cubic-bezier\(([^)]+)\)/);
      if (match) {
        const values = match[1].split(',').map((v) => parseFloat(v.trim()));
        return values as [number, number, number, number];
      }
    }

    return easingMap[easingStr] || 'linear';
  }, []);

  const runAnimation = useCallback(async () => {
    const easingValue = getEasingArray(easing);

    await controls.start({
      x: keyframes.to.translateX,
      y: keyframes.to.translateY,
      scale: keyframes.to.scale,
      rotate: keyframes.to.rotate,
      opacity: keyframes.to.opacity,
      transition: {
        duration,
        delay,
        ease: easingValue as [number, number, number, number],
        repeat: isLooping ? (iterations === 'infinite' ? Infinity : iterations - 1) : 0,
        repeatType: 'reverse',
      },
    });
  }, [controls, keyframes, duration, delay, easing, isLooping, iterations, getEasingArray]);

  useEffect(() => {
    // Reset to initial state
    controls.set({
      x: keyframes.from.translateX,
      y: keyframes.from.translateY,
      scale: keyframes.from.scale,
      rotate: keyframes.from.rotate,
      opacity: keyframes.from.opacity,
    });

    if (isPlaying) {
      runAnimation();
    }
  }, [isPlaying, controls, keyframes, runAnimation]);

  // Update initial position when from keyframe changes
  useEffect(() => {
    if (!isPlaying) {
      controls.set({
        x: keyframes.from.translateX,
        y: keyframes.from.translateY,
        scale: keyframes.from.scale,
        rotate: keyframes.from.rotate,
        opacity: keyframes.from.opacity,
      });
    }
  }, [isPlaying, controls, keyframes.from]);

  return (
    <div className="flex-1 flex items-center justify-center bg-[#FAFAFA] rounded-xl border border-gray-200 overflow-hidden relative">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, #E5E7EB 1px, transparent 1px),
            linear-gradient(to bottom, #E5E7EB 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Center crosshair */}
      <div className="absolute w-full h-px bg-gray-300" />
      <div className="absolute w-px h-full bg-gray-300" />

      {/* Animated element */}
      <motion.div
        animate={controls}
        style={{
          transformOrigin,
        }}
        className={`${
          elementType === 'box'
            ? 'w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg'
            : 'text-4xl font-bold text-gray-800'
        }`}
      >
        {elementType === 'text' && elementText}
      </motion.div>

      {/* Playback indicator */}
      {isPlaying && (
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-gray-500">Playing</span>
        </div>
      )}
    </div>
  );
}
