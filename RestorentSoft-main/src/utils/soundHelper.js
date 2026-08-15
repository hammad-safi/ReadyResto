export const playWhatsAppSound = () => {
  try {
    // Read sound settings from sessionStorage or localStorage
    const kitchenSoundSession = window.sessionStorage.getItem("kitchen_soundEnabled");
    const kitchenSoundLocal = window.localStorage.getItem("kitchen_soundEnabled");
    
    let soundEnabled = false;
    if (kitchenSoundSession !== null) {
      soundEnabled = JSON.parse(kitchenSoundSession);
    } else if (kitchenSoundLocal !== null) {
      soundEnabled = JSON.parse(kitchenSoundLocal);
    } else {
      // Default to false to match the kitchen page's default sticky state
      soundEnabled = false;
    }
    
    if (!soundEnabled) {
      return;
    }

    const audio = new Audio('/whatsapp-message.mp3');
    audio.play().catch(e => console.warn("Failed to play audio:", e));
  } catch (e) {
    console.warn("Audio play error:", e);
  }
};
