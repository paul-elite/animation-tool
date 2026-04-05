'use client';

import { motion, type Easing } from 'framer-motion';
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

  const canvasRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const [showPasteHint, setShowPasteHint] = useState(true);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [rotationStart, setRotationStart] = useState({ angle: 0, startRotation: 0 });
  const [hoveredHandle, setHoveredHandle] = useState<number | null>(null);

  // Current keyframe values
  const currentKf = keyframes[activeKeyframe];

  const getEasing = useCallback((easingStr: string): Easing => {
    const easingMap: Record<string, [number, number, number, number]> = {
      'ease': [0.25, 0.1, 0.25, 1],
      'ease-in': [0.42, 0, 1, 1],
      'ease-out': [0, 0, 0.58, 1],
      'ease-in-out': [0.42, 0, 0.58, 1],
    };

    if (easingStr === 'linear') {
      return 'linear' as Easing;
    }

    if (easingStr.startsWith('cubic-bezier')) {
      const match = easingStr.match(/cubic-bezier\(([^)]+)\)/);
      if (match) {
        const values = match[1].split(',').map((v) => parseFloat(v.trim()));
        return values as [number, number, number, number];
      }
    }

    return easingMap[easingStr] || [0.25, 0.1, 0.25, 1];
  }, []);

  // Handle drag
  const handleDrag = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number; y: number } }) => {
      setDragOffset({ x: info.offset.x, y: info.offset.y });
    },
    []
  );

  // Handle drag end - update the active keyframe position
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number; y: number } }) => {
      setIsDragging(false);
      const newX = Math.round(currentKf.translateX + info.offset.x);
      const newY = Math.round(currentKf.translateY + info.offset.y);
      updateKeyframe(activeKeyframe, 'translateX', newX);
      updateKeyframe(activeKeyframe, 'translateY', newY);
      setDragOffset({ x: 0, y: 0 });
    },
    [activeKeyframe, currentKf.translateX, currentKf.translateY, updateKeyframe]
  );

  // Handle rotation start
  const handleRotationStart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (!canvasRef.current) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const centerX = canvasRect.width / 2 + currentKf.translateX;
      const centerY = canvasRect.height / 2 + currentKf.translateY;

      const startX = e.clientX - canvasRect.left;
      const startY = e.clientY - canvasRect.top;

      const startAngle = Math.atan2(startY - centerY, startX - centerX) * (180 / Math.PI);

      setIsRotating(true);
      setRotationStart({ angle: startAngle, startRotation: currentKf.rotate });
    },
    [currentKf.translateX, currentKf.translateY, currentKf.rotate]
  );

  // Handle rotation move
  useEffect(() => {
    if (!isRotating) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const centerX = canvasRect.width / 2 + currentKf.translateX;
      const centerY = canvasRect.height / 2 + currentKf.translateY;

      const currentX = e.clientX - canvasRect.left;
      const currentY = e.clientY - canvasRect.top;

      const currentAngle = Math.atan2(currentY - centerY, currentX - centerX) * (180 / Math.PI);
      const deltaAngle = currentAngle - rotationStart.angle;

      let newRotation = rotationStart.startRotation + deltaAngle;

      // Snap to 15-degree increments when holding Shift
      if (e.shiftKey) {
        newRotation = Math.round(newRotation / 15) * 15;
      }

      updateKeyframe(activeKeyframe, 'rotate', Math.round(newRotation));
    };

    const handleMouseUp = () => {
      setIsRotating(false);
      setHoveredHandle(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isRotating, rotationStart, currentKf.translateX, currentKf.translateY, activeKeyframe, updateKeyframe]);

  // Handle paste from clipboard (Figma SVG)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type === 'text/html') {
          item.getAsString((html) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const svg = doc.querySelector('svg');
            if (svg) {
              svg.removeAttribute('style');
              svg.setAttribute('width', '100%');
              svg.setAttribute('height', '100%');
              setElementSvg(svg.outerHTML);
              setShowPasteHint(false);
            }
          });
          return;
        }

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

  // Animation variants
  const animationVariants = {
    from: {
      x: keyframes.from.translateX,
      y: keyframes.from.translateY,
      scale: keyframes.from.scale,
      rotate: keyframes.from.rotate,
      opacity: keyframes.from.opacity,
    },
    to: {
      x: keyframes.to.translateX,
      y: keyframes.to.translateY,
      scale: keyframes.to.scale,
      rotate: keyframes.to.rotate,
      opacity: keyframes.to.opacity,
    },
  };

  // Calculate position for non-playing state
  const staticPosition = {
    x: currentKf.translateX + dragOffset.x,
    y: currentKf.translateY + dragOffset.y,
    scale: currentKf.scale,
    rotate: currentKf.rotate,
    opacity: currentKf.opacity,
  };

  return (
    <div
      ref={canvasRef}
      className="flex-1 flex items-center justify-center bg-[#FAFAFA] rounded-xl border border-gray-200 overflow-hidden relative"
      tabIndex={0}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #E5E7EB 1px, transparent 1px),
            linear-gradient(to bottom, #E5E7EB 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Center crosshair */}
      <div className="absolute w-full h-px bg-gray-300 pointer-events-none" />
      <div className="absolute w-px h-full bg-gray-300 pointer-events-none" />

      {/* Paste hint */}
      {showPasteHint && elementType !== 'svg' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-full opacity-70 pointer-events-none">
          Copy from Figma and paste here (⌘V)
        </div>
      )}

      {/* Animated element */}
      {isPlaying ? (
        // Playing mode - use CSS animation
        <motion.div
          key="playing"
          initial="from"
          animate="to"
          variants={animationVariants}
          transition={{
            duration,
            delay,
            ease: getEasing(easing),
            repeat: iterations === 'infinite' ? Infinity : iterations - 1,
            repeatType: 'reverse',
          }}
          style={{ transformOrigin }}
          className={`${
            elementType === 'box'
              ? 'w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg'
              : elementType === 'text'
              ? 'text-4xl font-bold text-gray-800'
              : 'w-32 h-32'
          }`}
        >
          {elementType === 'text' && elementText}
          {elementType === 'svg' && elementSvg && (
            <div
              className="w-full h-full"
              dangerouslySetInnerHTML={{ __html: elementSvg }}
            />
          )}
        </motion.div>
      ) : (
        // Editing mode - draggable with rotation handles
        <div className="relative" style={{ transform: `translate(${staticPosition.x}px, ${staticPosition.y}px)` }}>
          {/* Rotation handles - positioned outside the element */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(${staticPosition.rotate}deg)`,
              width: elementType === 'box' ? '96px' : elementType === 'svg' ? '128px' : 'auto',
              height: elementType === 'box' ? '96px' : elementType === 'svg' ? '128px' : 'auto',
            }}
          >
            {/* Corner rotation handles */}
            {[
              { position: '-top-5 -left-5' },
              { position: '-top-5 -right-5' },
              { position: '-bottom-5 -left-5' },
              { position: '-bottom-5 -right-5' },
            ].map((handle, idx) => (
              <div
                key={idx}
                onMouseDown={handleRotationStart}
                onMouseEnter={() => setHoveredHandle(idx)}
                onMouseLeave={() => !isRotating && setHoveredHandle(null)}
                className={`absolute ${handle.position} w-6 h-6 pointer-events-auto flex items-center justify-center`}
                style={{ cursor: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2'%3E%3Cpath d='M21 12a9 9 0 1 1-9-9'/%3E%3Cpath d='M12 3v3M21 12h-3'/%3E%3C/svg%3E") 12 12, pointer` }}
              >
                <div
                  className={`w-2.5 h-2.5 bg-white border-2 border-blue-500 rounded-full transition-all duration-150 ${
                    hoveredHandle === idx || isRotating ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* The actual draggable element */}
          <motion.div
            ref={elementRef}
            key="editing"
            drag
            dragMomentum={false}
            dragElastic={0}
            onDragStart={() => setIsDragging(true)}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            initial={false}
            animate={{
              scale: staticPosition.scale,
              rotate: staticPosition.rotate,
              opacity: staticPosition.opacity,
              x: dragOffset.x,
              y: dragOffset.y,
            }}
            transition={{ type: 'tween', duration: 0.05 }}
            whileHover={{ boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.5)' }}
            whileDrag={{ cursor: 'grabbing' }}
            style={{
              transformOrigin,
              cursor: isRotating ? 'grabbing' : 'grab',
            }}
            className={`${
              elementType === 'box'
                ? 'w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg'
                : elementType === 'text'
                ? 'text-4xl font-bold text-gray-800'
                : 'w-32 h-32'
            }`}
          >
            {elementType === 'text' && elementText}
            {elementType === 'svg' && elementSvg && (
              <div
                className="w-full h-full pointer-events-none"
                dangerouslySetInnerHTML={{ __html: elementSvg }}
              />
            )}
          </motion.div>
        </div>
      )}

      {/* Status indicators */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3 pointer-events-none">
        {isPlaying && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">Playing</span>
          </div>
        )}
        {isDragging && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-xs text-gray-500">
              X: {Math.round(currentKf.translateX + dragOffset.x)}, Y: {Math.round(currentKf.translateY + dragOffset.y)}
            </span>
          </div>
        )}
        {isRotating && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full" />
            <span className="text-xs text-gray-500">
              Rotation: {currentKf.rotate}°
            </span>
          </div>
        )}
      </div>

      {/* Active keyframe indicator */}
      {!isPlaying && (
        <div className="absolute bottom-4 right-4 px-2 py-1 bg-gray-800 text-white text-xs rounded pointer-events-none">
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
