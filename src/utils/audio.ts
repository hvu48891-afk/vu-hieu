// Web Audio API Synthesizer for 24V Relay mechanical click & system buzzer

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

export const setSoundEnabled = (enabled: boolean) => {
  soundEnabled = enabled;
};

export const getSoundEnabled = () => soundEnabled;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

/**
 * Realistic 24V Mechanical Relay Click Sound
 * @param state 'on' (relay coil energizes & contacts close) or 'off' (spring returns)
 */
export const playRelayClick = (state: 'on' | 'off' = 'on') => {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    
    // First high impulse click (spark/armature impact)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(state === 'on' ? 1200 : 900, t);
    osc1.frequency.exponentialRampToValueAtTime(80, t + 0.025);
    
    gain1.gain.setValueAtTime(0.35, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.03);

    // Second mechanical bounce click 12ms later
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(state === 'on' ? 450 : 380, t + 0.012);
    osc2.frequency.exponentialRampToValueAtTime(60, t + 0.04);
    
    gain2.gain.setValueAtTime(0.2, t + 0.012);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t + 0.012);
    osc2.stop(t + 0.045);
  } catch {
    // Ignore audio errors if blocked by browser policy
  }
};

/**
 * Warning buzzer when classroom is empty but power is forgotten
 */
export const playWarningBeep = () => {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.setValueAtTime(1175, t + 0.08);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  } catch {
    // Audio autoplay restricted
  }
};
