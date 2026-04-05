import { create } from 'zustand';

export interface Keyframe {
  translateX: number;
  translateY: number;
  scale: number;
  rotate: number;
  opacity: number;
}

export interface AnimationState {
  // Keyframes (0% and 100%)
  keyframes: {
    from: Keyframe;
    to: Keyframe;
  };

  // Active keyframe being edited
  activeKeyframe: 'from' | 'to';

  // Animation properties
  duration: number;
  delay: number;
  iterations: number | 'infinite';
  easing: string;
  transformOrigin: string;

  // Playback state
  isPlaying: boolean;
  isLooping: boolean;

  // Element properties
  elementType: 'box' | 'text' | 'svg';
  elementText: string;
  elementSvg: string | null;

  // Actions
  updateKeyframe: (keyframe: 'from' | 'to', property: keyof Keyframe, value: number) => void;
  setActiveKeyframe: (keyframe: 'from' | 'to') => void;
  setDuration: (duration: number) => void;
  setDelay: (delay: number) => void;
  setIterations: (iterations: number | 'infinite') => void;
  setEasing: (easing: string) => void;
  setTransformOrigin: (origin: string) => void;
  togglePlay: () => void;
  toggleLoop: () => void;
  setElementType: (type: 'box' | 'text' | 'svg') => void;
  setElementText: (text: string) => void;
  setElementSvg: (svg: string | null) => void;
  resetAnimation: () => void;
  clearElement: () => void;
}

const defaultKeyframe: Keyframe = {
  translateX: 0,
  translateY: 0,
  scale: 1,
  rotate: 0,
  opacity: 1,
};

export const useAnimationStore = create<AnimationState>((set) => ({
  keyframes: {
    from: { ...defaultKeyframe },
    to: { ...defaultKeyframe, translateX: 100, rotate: 180 },
  },

  activeKeyframe: 'from',

  duration: 1,
  delay: 0,
  iterations: 1,
  easing: 'ease',
  transformOrigin: 'center center',

  isPlaying: false,
  isLooping: true,

  elementType: 'box',
  elementText: 'Hello',
  elementSvg: null,

  updateKeyframe: (keyframe, property, value) =>
    set((state) => ({
      keyframes: {
        ...state.keyframes,
        [keyframe]: {
          ...state.keyframes[keyframe],
          [property]: value,
        },
      },
    })),

  setActiveKeyframe: (keyframe) => set({ activeKeyframe: keyframe }),

  setDuration: (duration) => set({ duration }),
  setDelay: (delay) => set({ delay }),
  setIterations: (iterations) => set({ iterations }),
  setEasing: (easing) => set({ easing }),
  setTransformOrigin: (origin) => set({ transformOrigin: origin }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  toggleLoop: () => set((state) => ({ isLooping: !state.isLooping })),

  setElementType: (type) => set({ elementType: type }),
  setElementText: (text) => set({ elementText: text }),
  setElementSvg: (svg) => set({ elementSvg: svg, elementType: 'svg' }),

  resetAnimation: () =>
    set({
      keyframes: {
        from: { ...defaultKeyframe },
        to: { ...defaultKeyframe },
      },
      duration: 1,
      delay: 0,
      iterations: 1,
      easing: 'ease',
    }),

  clearElement: () =>
    set({
      elementType: 'box',
      elementSvg: null,
    }),
}));
