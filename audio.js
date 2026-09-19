// Audio & Haptic feedback engine for Push-Up Counter
class SoundEngine {
    constructor() {
        this.audioCtx = null;
        this.soundEnabled = true;
        this.speechEnabled = false;
        this.vibrateEnabled = true;
        this.speechVoices = [];

        // Try to load voices
        if ('speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = () => {
                this.speechVoices = window.speechSynthesis.getVoices();
            };
        }
    }

    init() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    // Play a crisp punchy beep on each rep
    playRepSound(count = 1) {
        if (this.vibrateEnabled && 'vibrate' in navigator) {
            try { navigator.vibrate(35); } catch(e) {}
        }

        if (this.speechEnabled && 'speechSynthesis' in window) {
            this.speak(String(count));
            return;
        }

        if (!this.soundEnabled) return;
        this.init();
        if (!this.audioCtx) return;

        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'sine';
            const now = this.audioCtx.currentTime;
            
            // Rising pitch for energetic feel
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.exponentialRampToValueAtTime(750, now + 0.08);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(now);
            osc.stop(now + 0.09);
        } catch (e) {
            console.warn('Audio play error:', e);
        }
    }

    // Rest countdown ticks (e.g., 3, 2, 1)
    playTick(isFinal = false) {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.audioCtx) return;

        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            const now = this.audioCtx.currentTime;

            osc.type = 'triangle';
            const freq = isFinal ? 880 : 520;
            const duration = isFinal ? 0.3 : 0.12;

            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(now);
            osc.stop(now + duration);

            if (this.vibrateEnabled && 'vibrate' in navigator) {
                navigator.vibrate(isFinal ? [100, 50, 150] : 40);
            }
        } catch (e) {}
    }

    // Sound when a set is completed
    playSetComplete() {
        if (this.vibrateEnabled && 'vibrate' in navigator) {
            try { navigator.vibrate([100, 60, 150]); } catch(e) {}
        }
        if (!this.soundEnabled) return;
        this.init();
        if (!this.audioCtx) return;

        try {
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, idx) => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                const now = this.audioCtx.currentTime + idx * 0.09;

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now);

                gain.gain.setValueAtTime(0.28, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

                osc.connect(gain);
                gain.connect(this.audioCtx.destination);

                osc.start(now);
                osc.stop(now + 0.22);
            });
        } catch (e) {}
    }

    // Sound when entire workout finishes
    playWorkoutVictory() {
        if (this.vibrateEnabled && 'vibrate' in navigator) {
            try { navigator.vibrate([200, 100, 200, 100, 400]); } catch(e) {}
        }
        if (!this.soundEnabled) return;
        this.init();
        if (!this.audioCtx) return;

        try {
            const chords = [
                [523.25, 659.25, 783.99],       // C
                [587.33, 739.99, 880.00],       // D
                [659.25, 830.61, 987.77],       // E
                [1046.50, 1318.51, 1567.98]     // High C chord
            ];

            chords.forEach((chord, step) => {
                const stepTime = this.audioCtx.currentTime + step * 0.18;
                chord.forEach(freq => {
                    const osc = this.audioCtx.createOscillator();
                    const gain = this.audioCtx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, stepTime);
                    gain.gain.setValueAtTime(0.18, stepTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, stepTime + (step === 3 ? 0.8 : 0.25));
                    osc.connect(gain);
                    gain.connect(this.audioCtx.destination);
                    osc.start(stepTime);
                    osc.stop(stepTime + (step === 3 ? 0.8 : 0.25));
                });
            });
        } catch (e) {}
    }

    speak(text) {
        if (!('speechSynthesis' in window)) return;
        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.2;
            utterance.pitch = 1.0;
            // Find Vietnamese voice if available
            const viVoice = this.speechVoices.find(v => v.lang && v.lang.startsWith('vi'));
            if (viVoice) {
                utterance.voice = viVoice;
            }
            window.speechSynthesis.speak(utterance);
        } catch (e) {}
    }
}

window.soundEngine = new SoundEngine();
