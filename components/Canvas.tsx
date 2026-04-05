'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect, useCallback, useRef, useState } from 'react';
import { useAnimationStore } from '@/lib/store';

export default function Canvas() {
  const {
    keyframes,
    activeKeyframe,
    duration,
    delay,
    iterations,
    easing,
    transformOrigin,
    isPlaying,
    isLooping,
    elementType,
    elementText,
    elementSvg,
    updateKeyframe,
    setElementSvg,
    clearElement,
  } = useAnimationStore();

  const controls = useAnimation();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPasteHint, setShowPasteHint] = useState(true);

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

  // Update position when not playing based on active keyframe
  useEffect(() => {
    if (!isPlaying && !isDragging) {
      const kf = keyframes[activeKeyframe];
      controls.set({
        x: kf.translateX,
        y: kf.translateY,
        scale: kf.scale,
        rotate: kf.rotate,
        opacity: kf.opacity,
      });
    }
  }, [isPlaying, isDragging, controls, keyframes, activeKeyframe]);

  // Handle drag end - update the active keyframe position
  const handleDragEnd = useCallback(
    (_: never, info: { offset: { x: number; y: number } }) => {
      setIsDragging(false);
      const currentX = keyframes[activeKeyframe].translateX;
      const currentY = keyframes[activeKeyframe].translateY;
      updateKeyframe(activeKeyframe, 'translateX', Math.round(currentX + info.offset.x));
      updateKeyframe(activeKeyframe, 'translateY', Math.round(currentY + info.offset.y));
    },
    [activeKeyframe, keyframes, updateKeyframe]
  );

  // Handle paste from clipboard (Figma SVG)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Check for SVG in clipboard
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        // Check for SVG as text/html (Figma copies as HTML with SVG)
        if (item.type === 'text/html') {
          item.getAsString((html) => {
            // Extract SVG from HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const svg = doc.querySelector('svg');
            if (svg) {
              // Clean up the SVG
              svg.removeAttribute('style');
              svg.setAttribute('width', '100%');
              svg.setAttribute('height', '100%');
              setElementSvg(svg.outerHTML);
              setShowPasteHint(false);
            }
          });
          return;
        }

        // Check for plain SVG text
        if (item.type === 'text/plain') {
          item.getAsString((text) => {
            if (text.trim().startsWith('<svg')) {
              const parser = new DOMParser();
              const doc = parser.parseFromString(text, 'image/svg+xml');
              const svg = doc.querySelector('svg');
              if (svg) {
                svg.setAttribute('width', '100%');
                svg.setAttribute('height', '100%');
                setElementSvg(svg.outerHTML);
                setShowPasteHint(false);
              }
            }
          });
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [setElementSvg]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete/Backspace to clear element
      if ((e.key === 'Delete' || e.key === 'Backspace') && elementSvg) {
        if (document.activeElement?.tagName !== 'INPUT') {
          e.preventDefault();
          clearElement();
          setShowPasteHint(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [elementSvg, clearElement]);

  return (
    <div
      ref={canvasRef}
      className="flex-1 flex items-center justify-center bg-[#FAFAFA] rounded-xl border border-gray-200 overflow-hidden relative"
      tabIndex={0}
    >
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

      {/* Paste hint */}
      {showPasteHint && elementType !== 'svg' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-full opacity-70">
          Copy from Figma and paste here (⌘V)
        </div>
      )}

      {/* Animated element */}
      <motion.div
        animate={controls}
        drag={!isPlaying}
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        whileDrag={{ cursor: 'grabbing' }}
        style={{
          transformOrigin,
          cursor: isPlaying ? 'default' : 'grab',
        }}
        className={`${
          elementType === 'box'
            ? 'w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg'
            : elementType === 'text'
            ? 'text-4xl font-bold text-gray-800'
            : 'w-32 h-32'
        } ${!isPlaying ? 'hover:ring-2 hover:ring-blue-400 hover:ring-offset-2' : ''}`}
      >
        {elementType === 'text' && elementText}
        {elementType === 'svg' && elementSvg && (
          <div
            className="w-full h-full"
            dangerouslySetInnerHTML={{ __html: elementSvg }}
          />
        )}
      </motion.div>

      {/* Status indicators */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3">
        {isPlaying && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">Playing</span>
          </div>
        )}
        {isDragging && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-xs text-gray-500">Dragging</span>
          </div>
        )}
      </div>

      {/* Active keyframe indicator */}
      {!isPlaying && (
        <div className="absolute bottom-4 right-4 px-2 py-1 bg-gray-800 text-white text-xs rounded">
          Editing: {activeKeyframe === 'from' ? '0%' : '100%'}
        </div>
      )}

      {/* Element type indicator */}
      {elementType === 'svg' && (
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <span className="text-xs text-gray-500">Figma Element</span>
          <button
            onClick={() => {
              clearElement();
              setShowPasteHint(true);
            }}
            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
