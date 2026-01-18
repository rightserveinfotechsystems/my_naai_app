// utils/tts.js
import Tts from 'react-native-tts';

export const initTTS = async () => {
  try {
    await Tts.getInitStatus();
    Tts.setDefaultLanguage('en-IN');
    Tts.setDefaultRate(0.5);
  } catch (e) {
    console.log('TTS init error', e);
  }
};

export const speakNewBooking = () => {
  Tts.stop();
  Tts.speak('New booking received');
};
