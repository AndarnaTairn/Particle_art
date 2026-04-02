import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

export class HandTracker {
    constructor(videoElement, callbacks) {
        this.video = videoElement;
        this.callbacks = callbacks;
        
        this.handLandmarker = null;
        this.lastVideoTime = -1;
        
        this.pinchDistances = [];
        this.swipeCooldown = 0;
        this.paletteCooldown = 0;

        this.lastIndexTip = null;
        this.lastHandState = null;

        this.init();
    }

    async init() {
        const statusEl = document.getElementById('status');
        if(statusEl) statusEl.innerText = 'Loading MediaPipe Models...';
        
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 1
        });

        if(statusEl) statusEl.innerText = 'Requesting Webcam...';
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            this.video.srcObject = stream;
            this.video.addEventListener('loadeddata', () => {
                if(statusEl) statusEl.innerText = 'Ready! Play with gestures.';
                setTimeout(() => { 
                    if(statusEl) statusEl.style.display = 'none'; 
                }, 3000);
            });
        } catch (error) {
            if(statusEl) statusEl.innerText = 'Webcam access denied. Needs camera.';
            console.error(error);
        }
    }

    detect() {
        if (!this.handLandmarker || !this.video.videoWidth) return;

        let startTimeMs = performance.now();
        // Prevent duplicate processing of identical frames
        if (this.lastVideoTime !== this.video.currentTime) {
            this.lastVideoTime = this.video.currentTime;
            const results = this.handLandmarker.detectForVideo(this.video, startTimeMs);
            this.processResults(results);
        }
    }

    processResults(results) {
        if (this.swipeCooldown > 0) this.swipeCooldown--;
        if (this.paletteCooldown > 0) this.paletteCooldown--;

        if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            
            // 1. PINCH EVENT (Thumb [4] to Index Tip [8])
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            
            const dx = thumbTip.x - indexTip.x;
            const dy = thumbTip.y - indexTip.y;
            const dz = thumbTip.z - indexTip.z;
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            this.pinchDistances.push(dist);
            if(this.pinchDistances.length > 5) this.pinchDistances.shift();
            const smoothedDist = this.pinchDistances.reduce((a,b)=>a+b, 0) / this.pinchDistances.length;
            
            // map dist ~0.02 (closed) to ~0.25 (open) to scale factors 0.5 to 3.0
            let targetScale = (smoothedDist - 0.02) * (3.0 - 0.5) / (0.25 - 0.02) + 0.5;
            targetScale = Math.max(0.5, Math.min(targetScale, 3.0));

            if(this.callbacks.onScale) {
                this.callbacks.onScale(targetScale);
            }

            // 2. SWIPE EVENT (X-axis movement of Index Tip)
            if (!this.lastIndexTip) this.lastIndexTip = indexTip;
            const swipeDistanceX = indexTip.x - this.lastIndexTip.x;
            
            // Detect fast sweeping motion across the camera (webcam is mirrored usually)
            if (Math.abs(swipeDistanceX) > 0.08 && this.swipeCooldown === 0) {
                if (this.callbacks.onCycleShape) this.callbacks.onCycleShape();
                this.swipeCooldown = 45; // Roughly 45 frames lockout
            }
            this.lastIndexTip = indexTip;

            // 3. PALETTE TOGGLE (Open Hand vs Closed Fist)
            // Check distance from wrist [0] to middle finger tip [12]
            const wrist = landmarks[0];
            const middleTip = landmarks[12];
            const dMy = middleTip.y - wrist.y; // Normally negative since y points down
            
            // Open hand means tips are far above wrist (dMy is very negative)
            // Closed hand means tips are close to wrist
            const isOpenHand = dMy < -0.25; 
            
            if (this.callbacks.onPaletteToggle && this.paletteCooldown === 0) {
                if (this.lastHandState !== null && isOpenHand !== this.lastHandState) {
                    this.callbacks.onPaletteToggle(isOpenHand ? 'neon' : 'synthwave');
                    this.paletteCooldown = 60; // 1 second lockout
                }
                this.lastHandState = isOpenHand;
            }
        }
    }
}
