import { ParticleSystem } from './ParticleSystem.js';
import { HandTracker } from './HandTracker.js';

let particleSystem;
let handTracker;

function init() {
    const canvas = document.getElementById('webgl-canvas');
    const video = document.getElementById('webcam');

    // Initialize Particle System
    particleSystem = new ParticleSystem(canvas);

    // Callbacks for MediaPipe gestures
    const callbacks = {
        onScale: (scaleFactor) => {
            particleSystem.setScale(scaleFactor);
        },
        onCycleShape: () => {
            particleSystem.cycleShape();
        },
        onPaletteToggle: (paletteName) => {
            particleSystem.setColors(paletteName);
        }
    };

    // Initialize Hand Tracker
    handTracker = new HandTracker(video, callbacks);

    // Start rendering loop
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    
    // Process hand tracking for the current frame
    if (handTracker) {
        handTracker.detect();
    }

    // Render and animate particles
    if (particleSystem) {
        particleSystem.render();
    }
}

// Ensure DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
