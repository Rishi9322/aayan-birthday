// One small stroke-icon set for UI controls (emoji stay for playful content).
const s = p => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
export const icon = {
  volume: s('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>'),
  muted: s('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6M21 9l-5 6"/>'),
  mic: s('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
  replay: s('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'),
  prev: s('<path d="m15 5-7 7 7 7"/>'),
  next: s('<path d="m9 5 7 7-7 7"/>'),
  close: s('<path d="M6 6l12 12M18 6 6 18"/>'),
};
