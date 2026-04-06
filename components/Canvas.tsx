'use client';

import { motion, type Easing } from 'framer-motion';
import { useEffect, useCallback, useRef, useState } from 'react';
import { useAnimationStore } from '@/lib/store';

type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;

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
    elementWidth,
    elementHeight,
    updateKeyframe,
    setElementSvg,
    setElementSize,
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

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [hoveredResizeHandle, setHoveredResizeHandle] = useState<ResizeHandle>(null);

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

  // Handle drag end
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

  // Handle resize start
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: ResizeHandle) => {
      e.stopPropagation();
      e.preventDefault();
      setIsResizing(true);
      setResizeHandle(handle);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: elementWidth,
        height: elementHeight,
      });
    },
    [elementWidth, elementHeight]
  );

  // Handle resize move
  useEffect(() => {
    if (!isResizing || !resizeHandle) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;

      // Calculate new dimensions based on handle - resize from center
      if (resizeHandle.includes('e')) {
        newWidth = Math.max(24, resizeStart.width + deltaX * 2);
      }
      if (resizeHandle.includes('w')) {
        newWidth = Math.max(24, resizeStart.width - deltaX * 2);
      }
      if (resizeHandle.includes('s')) {
        newHeight = Math.max(24, resizeStart.height + deltaY * 2);
      }
      if (resizeHandle.includes('n')) {
        newHeight = Math.max(24, resizeStart.height - deltaY * 2);
      }

      // Hold Shift for proportional resize
      if (e.shiftKey) {
        const aspectRatio = resizeStart.width / resizeStart.height;
        if (resizeHandle.includes('e') || resizeHandle.includes('w')) {
          newHeight = newWidth / aspectRatio;
        } else {
          newWidth = newHeight * aspectRatio;
        }
      }

      setElementSize(Math.round(newWidth), Math.round(newHeight));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeHandle(null);
      setHoveredResizeHandle(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeHandle, resizeStart, setElementSize]);

  // Handle paste from clipboard
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

  // Get cursor for resize handle
  const getResizeCursor = (handle: ResizeHandle): string => {
    const cursors: Record<string, string> = {
      n: 'ns-resize',
      s: 'ns-resize',
      e: 'ew-resize',
      w: 'ew-resize',
      ne: 'nesw-resize',
      sw: 'nesw-resize',
      nw: 'nwse-resize',
      se: 'nwse-resize',
    };
    return cursors[handle || ''] || 'default';
  };

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

  // Resize handles configuration
  const resizeHandles: { handle: ResizeHandle; position: string; size: string }[] = [
    // Corners
    { handle: 'nw', position: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2', size: 'w-3 h-3' },
    { handle: 'ne', position: 'top-0 right-0 translate-x-1/2 -translate-y-1/2', size: 'w-3 h-3' },
    { handle: 'sw', position: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2', size: 'w-3 h-3' },
    { handle: 'se', position: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2', size: 'w-3 h-3' },
    // Edges
    { handle: 'n', position: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2', size: 'w-2 h-2' },
    { handle: 's', position: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2', size: 'w-2 h-2' },
    { handle: 'e', position: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2', size: 'w-2 h-2' },
    { handle: 'w', position: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2', size: 'w-2 h-2' },
  ];

  return (
    <div
      ref={canvasRef}
      className="flex-1 flex items-center justify-center bg-[#F5F5F5] rounded-xl border border-gray-200 overflow-hidden relative"
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
        // Playing mode
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
          style={{
            transformOrigin,
            width: elementWidth,
            height: elementHeight,
            boxShadow: '0 0 0 0.5px rgba(0, 0, 0, 0.05)',
          }}
          className="bg-white rounded-xl"
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
        // Editing mode
        <div className="relative" style={{ transform: `translate(${staticPosition.x}px, ${staticPosition.y}px)` }}>
          {/* Rotation handles - outer corners */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(${staticPosition.rotate}deg)`,
              width: elementWidth,
              height: elementHeight,
            }}
          >
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

          {/* The draggable element */}
          <motion.div
            ref={elementRef}
            key="editing"
            drag={!hoveredResizeHandle && !isResizing}
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
            whileHover={!hoveredResizeHandle ? { boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.5)' } : {}}
            whileDrag={{ cursor: 'grabbing' }}
            style={{
              transformOrigin,
              cursor: isResizing ? getResizeCursor(resizeHandle) : hoveredResizeHandle ? getResizeCursor(hoveredResizeHandle) : 'grab',
              width: elementWidth,
              height: elementHeight,
              boxShadow: '0 0 0 0.5px rgba(0, 0, 0, 0.05)',
            }}
            className="bg-white rounded-xl relative"
          >
            {elementType === 'text' && elementText}
            {elementType === 'svg' && elementSvg && (
              <div
                className="w-full h-full pointer-events-none"
                dangerouslySetInnerHTML={{ __html: elementSvg }}
              />
            )}

            {/* Resize handles */}
            {resizeHandles.map(({ handle, position, size }) => (
              <div
                key={handle}
                onMouseDown={(e) => handleResizeStart(e, handle)}
                onMouseEnter={() => setHoveredResizeHandle(handle)}
                onMouseLeave={() => !isResizing && setHoveredResizeHandle(null)}
                className={`absolute ${position} ${size} pointer-events-auto flex items-center justify-center`}
                style={{ cursor: getResizeCursor(handle) }}
              >
                <div
                  className={`w-full h-full bg-white border-2 border-blue-500 rounded-sm transition-all duration-150 ${
                    hoveredResizeHandle === handle || isResizing ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                  }`}
                />
              </div>
            ))}
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
        {isResizing && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
            <span className="text-xs text-gray-500">
              {elementWidth} × {elementHeight}
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
