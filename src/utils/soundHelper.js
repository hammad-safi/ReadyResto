let globalAudioCtx = null;

export const playWhatsAppSound = () => {
  try {
    // Read sound settings exclusively from localStorage to support cross-tab toggling
    const kitchenSoundLocal = window.localStorage.getItem("kitchen_soundEnabled");
    let soundEnabled = false;
    
    if (kitchenSoundLocal !== null) {
      soundEnabled = JSON.parse(kitchenSoundLocal);
    }
    
    if (!soundEnabled) {
      return;
    }

    // Play small bell using Web Audio API
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    
    if (!globalAudioCtx) {
      globalAudioCtx = new AudioCtx();
    }
    const ac = globalAudioCtx;
    
    // Resume audio context if it's in suspended state (browser autoplay policy)
    if (ac.state === 'suspended') {
      ac.resume();
    }

    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, ac.currentTime);
    g.gain.setValueAtTime(0.0001, ac.currentTime);
    o.connect(g);
    g.connect(ac.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(1.0, ac.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
    o.stop(ac.currentTime + 0.51);
  } catch (e) {
    console.warn("Audio play error:", e);
  }
};
