 Particle Space

**Particle Space** is a real-time, gesture-controlled 3D particle system built with **Three.js** and **MediaPipe**. Experience immersive generative art that responds to your hand movements via webcam.

![Particle System Preview](https://via.placeholder.com/800x450.png?text=Particle+Space+Preview)

##  Interactive Gestures

Control the particle universe using only your hands:

| Gesture | Action |
| :--- | :--- |
| **🤏 Pinch** | Dynamically scale the particles in 3D space. |
| **✋ Open/✊ Close** | Toggle between **Neon** and **Synthwave** color palettes. |
| **↔️ Swipe L/R** | Cycle through a library of complex 3D geometric shapes. |

##  Featured 3D Shapes

Explore a variety of procedurally generated forms, including:
- ** Heart:** A volumetric sampling of Taubin's heart surface.
- ** Saturn:** A central sphere surrounded by a dust ring.
- ** DNA:** A double-helix structure with connecting base pairs.
- ** Tomato:** A multi-lobed heirloom tomato with organic leaf caps.
- ** Arc Reactor:** Concentric glowing rings with a dense energy core.
- ** Flower & MilkWeed:** Organic botanical-inspired particle distributions.
- ** Globe & Needles:** Mathematical shells and radial spikes.

##  Technology Stack

- **[Three.js](https://threejs.org/):** High-performance 3D rendering and particle math.
- **[MediaPipe Hands](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker):** Real-time hand landmark detection and gesture recognition.
- **Vanilla JavaScript (ESM):** Modular, modern web architecture without heavy frameworks.
- **CSS3:** Sleek glassmorphic UI overlay.

##  Getting Started

Since this project uses ES Modules, you need to run it through a local server:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/particle-art.git
    cd particle-art
    ```
2.  **Run a local server:**
    If you have Python installed:
    ```bash
    python -m http.server
    ```
    Or using Node.js:
    ```bash
    npx serve .
    ```
3.  **Open in Browser:** Navigate to `http://localhost:8000`.

##  License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
