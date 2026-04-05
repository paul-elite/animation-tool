'use client';

import Canvas from '@/components/Canvas';
import Controls from '@/components/Controls';
import CSSOutput from '@/components/CSSOutput';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg" />
            <h1 className="text-lg font-semibold text-gray-900">Animation Studio</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">MVP</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - CSS Output */}
        <div className="w-80 bg-white border-r border-gray-200 p-4 flex flex-col gap-4 overflow-y-auto">
          <div className="flex-1">
            <CSSOutput />
          </div>

          {/* Quick tips */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Quick Tips</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Drag dials up/down to change values</li>
              <li>• Switch between 0% and 100% keyframes</li>
              <li>• Toggle Loop for continuous playback</li>
              <li>• Copy CSS to use in your projects</li>
            </ul>
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 p-6 flex flex-col gap-4">
          <Canvas />
        </div>

        {/* Right - Controls */}
        <Controls />
      </div>
    </div>
  );
}
