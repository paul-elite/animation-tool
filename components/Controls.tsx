'use client';

import { useAnimationStore } from '@/lib/store';
import Dial from './Dial';
import Slider from './Slider';
import * as Select from '@radix-ui/react-select';
import * as Tabs from '@radix-ui/react-tabs';
import { ChevronDownIcon } from '@radix-ui/react-icons';

export default function Controls() {
  const {
    keyframes,
    duration,
    delay,
    iterations,
    easing,
    transformOrigin,
    isPlaying,
    isLooping,
    updateKeyframe,
    setDuration,
    setDelay,
    setIterations,
    setEasing,
    setTransformOrigin,
    togglePlay,
    toggleLoop,
  } = useAnimationStore();

  const easingOptions = [
    { value: 'linear', label: 'Linear' },
    { value: 'ease', label: 'Ease' },
    { value: 'ease-in', label: 'Ease In' },
    { value: 'ease-out', label: 'Ease Out' },
    { value: 'ease-in-out', label: 'Ease In Out' },
    { value: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', label: 'Back' },
    { value: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', label: 'Back Out' },
    { value: 'cubic-bezier(0.6, 0.04, 0.98, 0.335)', label: 'Circ In' },
    { value: 'cubic-bezier(0.075, 0.82, 0.165, 1)', label: 'Circ Out' },
  ];

  const originOptions = [
    'center center',
    'top left',
    'top center',
    'top right',
    'center left',
    'center right',
    'bottom left',
    'bottom center',
    'bottom right',
  ];

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-800">Animation Controls</h2>
      </div>

      {/* Playback controls */}
      <div className="p-4 border-b border-gray-100 flex gap-2">
        <button
          onClick={togglePlay}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isPlaying
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={toggleLoop}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isLooping
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Loop
        </button>
      </div>

      {/* Keyframe tabs */}
      <Tabs.Root defaultValue="from" className="flex-1 flex flex-col overflow-hidden">
        <Tabs.List className="flex border-b border-gray-100 px-4">
          <Tabs.Trigger
            value="from"
            className="px-4 py-2 text-sm font-medium text-gray-500 data-[state=active]:text-gray-900 data-[state=active]:border-b-2 data-[state=active]:border-gray-900 -mb-px"
          >
            0% (From)
          </Tabs.Trigger>
          <Tabs.Trigger
            value="to"
            className="px-4 py-2 text-sm font-medium text-gray-500 data-[state=active]:text-gray-900 data-[state=active]:border-b-2 data-[state=active]:border-gray-900 -mb-px"
          >
            100% (To)
          </Tabs.Trigger>
        </Tabs.List>

        {(['from', 'to'] as const).map((keyframe) => (
          <Tabs.Content
            key={keyframe}
            value={keyframe}
            className="flex-1 overflow-y-auto p-4 space-y-6"
          >
            {/* Transform dials */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Transform
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <Dial
                  label="X"
                  value={keyframes[keyframe].translateX}
                  onChange={(v) => updateKeyframe(keyframe, 'translateX', v)}
                  min={-200}
                  max={200}
                  step={1}
                  unit="px"
                />
                <Dial
                  label="Y"
                  value={keyframes[keyframe].translateY}
                  onChange={(v) => updateKeyframe(keyframe, 'translateY', v)}
                  min={-200}
                  max={200}
                  step={1}
                  unit="px"
                />
                <Dial
                  label="Rotate"
                  value={keyframes[keyframe].rotate}
                  onChange={(v) => updateKeyframe(keyframe, 'rotate', v)}
                  min={-360}
                  max={360}
                  step={1}
                  unit="deg"
                />
              </div>
            </div>

            {/* Scale and Opacity sliders */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Properties
              </h3>
              <Slider
                label="Scale"
                value={keyframes[keyframe].scale}
                onChange={(v) => updateKeyframe(keyframe, 'scale', v)}
                min={0}
                max={3}
                step={0.01}
              />
              <Slider
                label="Opacity"
                value={keyframes[keyframe].opacity}
                onChange={(v) => updateKeyframe(keyframe, 'opacity', v)}
                min={0}
                max={1}
                step={0.01}
              />
            </div>
          </Tabs.Content>
        ))}
      </Tabs.Root>

      {/* Animation settings */}
      <div className="p-4 border-t border-gray-100 space-y-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Timing
        </h3>

        <Slider
          label="Duration"
          value={duration}
          onChange={setDuration}
          min={0.1}
          max={5}
          step={0.1}
          unit="s"
        />

        <Slider
          label="Delay"
          value={delay}
          onChange={setDelay}
          min={0}
          max={2}
          step={0.1}
          unit="s"
        />

        <div className="flex gap-4">
          {/* Iterations */}
          <div className="flex-1">
            <label className="text-xs font-medium text-gray-500 mb-2 block">
              Iterations
            </label>
            <Select.Root
              value={String(iterations)}
              onValueChange={(v) => setIterations(v === 'infinite' ? 'infinite' : parseInt(v))}
            >
              <Select.Trigger className="w-full flex items-center justify-between px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <Select.Value />
                <Select.Icon>
                  <ChevronDownIcon />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                  <Select.Viewport className="p-1">
                    {[1, 2, 3, 5, 10, 'infinite'].map((val) => (
                      <Select.Item
                        key={val}
                        value={String(val)}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded outline-none data-[highlighted]:bg-gray-100"
                      >
                        <Select.ItemText>{val === 'infinite' ? '∞ Infinite' : val}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          {/* Easing */}
          <div className="flex-1">
            <label className="text-xs font-medium text-gray-500 mb-2 block">
              Easing
            </label>
            <Select.Root value={easing} onValueChange={setEasing}>
              <Select.Trigger className="w-full flex items-center justify-between px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <Select.Value>
                  {easingOptions.find((e) => e.value === easing)?.label || 'Ease'}
                </Select.Value>
                <Select.Icon>
                  <ChevronDownIcon />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                  <Select.Viewport className="p-1">
                    {easingOptions.map((option) => (
                      <Select.Item
                        key={option.value}
                        value={option.value}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded outline-none data-[highlighted]:bg-gray-100"
                      >
                        <Select.ItemText>{option.label}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>
        </div>

        {/* Transform Origin */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-2 block">
            Transform Origin
          </label>
          <Select.Root value={transformOrigin} onValueChange={setTransformOrigin}>
            <Select.Trigger className="w-full flex items-center justify-between px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
              <Select.Value />
              <Select.Icon>
                <ChevronDownIcon />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                <Select.Viewport className="p-1">
                  {originOptions.map((origin) => (
                    <Select.Item
                      key={origin}
                      value={origin}
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded outline-none data-[highlighted]:bg-gray-100"
                    >
                      <Select.ItemText>{origin}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>
      </div>
    </div>
  );
}
