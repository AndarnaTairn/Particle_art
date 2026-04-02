import * as THREE from 'three';

const SHAPES = ['Heart', 'Flower', 'Saturn', 'ArcReactor', 'Globe', 'DNA', 'Needles', 'MilkWeed', 'Tomato'];
const PALETTES = {
    neon: [0xff00ff, 0x00ffff, 0x7b00ff, 0xff0055],
    synthwave: [0xf700ca, 0x3d00cc, 0x00d0ff, 0xffaa00],
    heart_red: [0xff6b6b, 0xff0000, 0x8b0000, 0x4a0000],
    tomato_red: [0xff4500, 0xff0000, 0xdc143c, 0xb22222],
    tomato_green: [0x32cd32, 0x228b22, 0x008000, 0x006400]
};

export class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.particleCount = 10000;
        this.currentShapeIndex = 0;
        this.currentPalette = 'neon';
        this.globalScale = 1.0;
        this.targetScale = 1.0;
        
        this.initThree();
        this.initParticles();
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x050510, 0.003);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 200;

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    initParticles() {
        this.geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(this.particleCount * 3);
        this.targetPositions = new Float32Array(this.particleCount * 3);
        this.colors = new Float32Array(this.particleCount * 3);

        for (let i = 0; i < this.particleCount; i++) {
            this.positions[i * 3] = (Math.random() - 0.5) * 500;
            this.positions[i * 3 + 1] = (Math.random() - 0.5) * 500;
            this.positions[i * 3 + 2] = (Math.random() - 0.5) * 500;
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

        const textureLoader = new THREE.TextureLoader();
        // create a radial gradient dynamically for an organic look
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);

        this.material = new THREE.PointsMaterial({
            size: 2.0,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            map: texture,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.particles);

        this.generateTargetShape(SHAPES[this.currentShapeIndex]);
        this.updateColors();
    }

    generateTargetShape(shapeName) {
        let i = 0;
        const count = this.particleCount;
        switch (shapeName) {
            case 'Heart':
                for (let j = 0; j < count; j++) {
                    let inside = false;
                    let x, y, z;
                    // Rejection sampling for a true 3D Heart volume (Taubin's Heart surface)
                    while (!inside) {
                        x = (Math.random() - 0.5) * 3.0; // Range [-1.5, 1.5]
                        y = (Math.random() - 0.5) * 3.0; // Range [-1.5, 1.5]
                        z = (Math.random() - 0.5) * 3.0; // Range [-1.5, 1.5]
                        
                        // Taubin's Heart implicit equation, adapted for ThreeJS axes
                        const expr1 = x*x + (2.25)*z*z + y*y - 1.0;
                        const val = (expr1 * expr1 * expr1) - (x*x * y*y*y) - (0.1125 * z*z * y*y*y);
                        
                        if (val <= 0) {
                            inside = true;
                        }
                    }
                    const scale = 35; // Expand coordinates to fit canvas
                    this.targetPositions[i * 3] = x * scale;
                    this.targetPositions[i * 3 + 1] = y * scale;
                    this.targetPositions[i * 3 + 2] = z * scale;
                    i++;
                }
                break;
            case 'Flower':
                for (let j = 0; j < count; j++) {
                    const r = Math.random();
                    const theta = Math.random() * Math.PI * 2;
                    const k = 6; 
                    const v = Math.cos(k * theta);
                    const radius = (r * v * 40 + Math.random() * 10) + 10;
                    
                    this.targetPositions[i * 3] = radius * Math.cos(theta);
                    this.targetPositions[i * 3 + 1] = radius * Math.sin(theta);
                    this.targetPositions[i * 3 + 2] = (Math.random() - 0.5) * 15;
                    i++;
                }
                break;
            case 'Saturn':
                // Central Sphere
                const sphereCount = Math.floor(count * 0.4);
                for (let j = 0; j < sphereCount; j++) {
                    const u = Math.random();
                    const v = Math.random();
                    const theta = u * 2.0 * Math.PI;
                    const phi = Math.acos(2.0 * v - 1.0);
                    const r = 35 * Math.cbrt(Math.random());
                    this.targetPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
                    this.targetPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                    this.targetPositions[i * 3 + 2] = r * Math.cos(phi);
                    i++;
                }
                // Rings
                const ringCount = count - sphereCount;
                for (let j = 0; j < ringCount; j++) {
                    const theta = Math.random() * Math.PI * 2;
                    const r = 45 + Math.random() * 45; 
                    this.targetPositions[i * 3] = r * Math.cos(theta);
                    this.targetPositions[i * 3 + 1] = (Math.random() - 0.5) * 3; 
                    this.targetPositions[i * 3 + 2] = r * Math.sin(theta);
                    i++;
                }
                // Rotate Saturn
                for(let k=0; k<count; k++) {
                    let y = this.targetPositions[k*3+1];
                    let z = this.targetPositions[k*3+2];
                    this.targetPositions[k*3+1] = y * Math.cos(0.5) - z * Math.sin(0.5);
                    this.targetPositions[k*3+2] = y * Math.sin(0.5) + z * Math.cos(0.5);
                }
                break;
            case 'Needles':
                const numNeedles = 100;
                const particlesPerNeedle = Math.floor(count / numNeedles);
                for (let k=0; k<numNeedles; k++) {
                    const u = Math.random();
                    const v = Math.random();
                    const theta = u * 2.0 * Math.PI;
                    const phi = Math.acos(2.0 * v - 1.0);
                    const nx = Math.sin(phi) * Math.cos(theta);
                    const ny = Math.sin(phi) * Math.sin(theta);
                    const nz = Math.cos(phi);
                    
                    const maxLength = 60 + Math.random() * 40;
                    for (let j=0; j<particlesPerNeedle; j++) {
                        const dist = Math.random() * maxLength;
                        this.targetPositions[i * 3]     = nx * dist;
                        this.targetPositions[i * 3 + 1] = ny * dist;
                        this.targetPositions[i * 3 + 2] = nz * dist;
                        i++;
                    }
                }
                for(; i < count; i++) {
                    this.targetPositions[i * 3] = 0;
                    this.targetPositions[i * 3 + 1] = 0;
                    this.targetPositions[i * 3 + 2] = 0;
                }
                break;
            case 'MilkWeed':
                const coreCount = Math.floor(count * 0.1);
                const silkCount = count - coreCount;
                for (let j = 0; j < coreCount; j++) {
                    const r = Math.random() * 5;
                    const theta = Math.random() * 2 * Math.PI;
                    const phi = Math.acos(2 * Math.random() - 1);
                    this.targetPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
                    this.targetPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                    this.targetPositions[i * 3 + 2] = r * Math.cos(phi);
                    i++;
                }
                for (let j = 0; j < silkCount; j++) {
                    const r = 5 + Math.random() * 80; 
                    const theta = Math.random() * 2 * Math.PI;
                    const yDist = Math.random(); 
                    const height = yDist * r;
                    const spread = Math.pow(yDist, 1.5) * (r * 0.8) + Math.random()*5; 
                    
                    this.targetPositions[i * 3] = spread * Math.cos(theta);
                    this.targetPositions[i * 3 + 1] = height - 20; 
                    this.targetPositions[i * 3 + 2] = spread * Math.sin(theta);
                    i++;
                }
                break;
            case 'Tomato':
                const leafCount = Math.floor(count * 0.05); // 5% of particles for leaves
                const bodyCount = count - leafCount;
                
                // Tomato Body (oblate squashed spheroid with 5 vertical lobes)
                for (let j = 0; j < bodyCount; j++) {
                    const u = Math.random();
                    const v = Math.random();
                    const theta = u * 2.0 * Math.PI;
                    const phi = Math.acos(2.0 * v - 1.0);
                    
                    // Radius with 5 lobes for that heirloom tomato look
                    const rH = 35 + 4 * Math.cos(5 * theta); 
                    
                    // Squash vertically and indent the top/bottom slightly
                    const yRadius = 26 - 4 * Math.abs(Math.cos(phi));
                    
                    // Keep most on the skin surface, some distributed inside
                    const volFactor = Math.random() > 0.1 ? 1.0 : Math.cbrt(Math.random());
                    
                    this.targetPositions[i * 3]     = rH * Math.sin(phi) * Math.cos(theta) * volFactor;
                    this.targetPositions[i * 3 + 1] = yRadius * Math.cos(phi) * volFactor; // Y is up
                    this.targetPositions[i * 3 + 2] = rH * Math.sin(phi) * Math.sin(theta) * volFactor;
                    i++;
                }

                // Tomato Leaves/Stem on the top (a 5-point star-like cap)
                for (let j = 0; j < leafCount; j++) {
                    const theta = Math.random() * 2 * Math.PI;
                    // Sharp star shape for the leaf structure
                    const rLeaf = Math.random() * (12 + 10 * Math.cos(5 * theta)); 
                    this.targetPositions[i * 3]     = rLeaf * Math.cos(theta);
                    this.targetPositions[i * 3 + 1] = 23 + Math.random() * 2; // Flat on the top indent
                    this.targetPositions[i * 3 + 2] = rLeaf * Math.sin(theta);
                    i++;
                }
                break;
            case 'ArcReactor':
                const rings = 5;
                const particlesPerRing = Math.floor(count * 0.8 / rings);
                const coreParticles = count - (particlesPerRing * rings);
                
                for(let r=0; r<rings; r++) {
                    const radius = 15 + r * 12;
                    for(let j=0; j<particlesPerRing; j++) {
                        const theta = Math.random() * Math.PI * 2;
                        this.targetPositions[i * 3] = radius * Math.cos(theta) + (Math.random()-0.5)*2;
                        this.targetPositions[i * 3 + 1] = radius * Math.sin(theta) + (Math.random()-0.5)*2;
                        this.targetPositions[i * 3 + 2] = (Math.random() - 0.5) * 8; // Flat Z
                        i++;
                    }
                }
                for(let j=0; j<coreParticles; j++) {
                    const u = Math.random();
                    const v = Math.random();
                    const theta = u * 2.0 * Math.PI;
                    const phi = Math.acos(2.0 * v - 1.0);
                    const r = 10 * Math.cbrt(Math.random());
                    this.targetPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
                    this.targetPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                    this.targetPositions[i * 3 + 2] = r * Math.cos(phi) + (Math.random()-0.5)*4;
                    i++;
                }
                break;
            case 'Globe':
                for (let j = 0; j < count; j++) {
                    const u = Math.random();
                    const v = Math.random();
                    const theta = u * 2.0 * Math.PI;
                    const phi = Math.acos(2.0 * v - 1.0);
                    // 90% on the surface shell forming a hollow globe, 10% inside
                    const r = Math.random() > 0.1 ? 50 + (Math.random()-0.5)*1.5 : 50 * Math.cbrt(Math.random());
                    
                    this.targetPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
                    this.targetPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                    this.targetPositions[i * 3 + 2] = r * Math.cos(phi);
                    i++;
                }
                break;
            case 'DNA':
                for (let j = 0; j < count; j++) {
                    // helix along Y axis
                    const y = (Math.random() - 0.5) * 160; 
                    const t = y * 0.1; // frequency of wraps
                    const r = 20;
                    
                    const type = Math.random();
                    if (type < 0.35) {
                        // strand 1
                        this.targetPositions[i * 3] = r * Math.cos(t) + (Math.random()-0.5)*4;
                        this.targetPositions[i * 3 + 1] = y;
                        this.targetPositions[i * 3 + 2] = r * Math.sin(t) + (Math.random()-0.5)*4;
                    } else if (type < 0.70) {
                        // strand 2
                        this.targetPositions[i * 3] = r * Math.cos(t + Math.PI) + (Math.random()-0.5)*4;
                        this.targetPositions[i * 3 + 1] = y;
                        this.targetPositions[i * 3 + 2] = r * Math.sin(t + Math.PI) + (Math.random()-0.5)*4;
                    } else {
                        // connecting bridges (discreet steps)
                        const stepY = Math.round(y / 10) * 10; 
                        const stepT = stepY * 0.1;
                        const lerp = Math.random(); 
                        const x1 = r * Math.cos(stepT), z1 = r * Math.sin(stepT);
                        const x2 = r * Math.cos(stepT + Math.PI), z2 = r * Math.sin(stepT + Math.PI);
                        
                        this.targetPositions[i * 3] = x1 + (x2 - x1) * lerp + (Math.random()-0.5)*2;
                        this.targetPositions[i * 3 + 1] = stepY + (Math.random()-0.5)*2;
                        this.targetPositions[i * 3 + 2] = z1 + (z2 - z1) * lerp + (Math.random()-0.5)*2;
                    }
                    i++;
                }
                // Rotate DNA slightly diagonally
                for(let k=0; k<count; k++) {
                    let x = this.targetPositions[k*3];
                    let y = this.targetPositions[k*3+1];
                    this.targetPositions[k*3] = x * Math.cos(0.5) - y * Math.sin(0.5);
                    this.targetPositions[k*3+1] = x * Math.sin(0.5) + y * Math.cos(0.5);
                }
                break;
        }
    }

    updateColors() {
        const currentShape = SHAPES[this.currentShapeIndex];
        
        if (currentShape === 'Tomato') {
            const leafCount = Math.floor(this.particleCount * 0.05);
            const bodyCount = this.particleCount - leafCount;
            
            const redPalette = PALETTES.tomato_red;
            const greenPalette = PALETTES.tomato_green;
            const color = new THREE.Color();
            
            for (let i = 0; i < this.particleCount; i++) {
                const palette = i < bodyCount ? redPalette : greenPalette;
                const hex = palette[Math.floor(Math.random() * palette.length)];
                color.setHex(hex);
                
                this.colors[i * 3] = color.r;
                this.colors[i * 3 + 1] = color.g;
                this.colors[i * 3 + 2] = color.b;
            }
            this.geometry.attributes.color.needsUpdate = true;
            return;
        }

        let paletteName = this.currentPalette;
        if (currentShape === 'Heart') {
            paletteName = 'heart_red';
        }
        const palette = PALETTES[paletteName];
        const color = new THREE.Color();
        
        for (let i = 0; i < this.particleCount; i++) {
            const hex = palette[Math.floor(Math.random() * palette.length)];
            color.setHex(hex);
            
            this.colors[i * 3] = color.r;
            this.colors[i * 3 + 1] = color.g;
            this.colors[i * 3 + 2] = color.b;
        }
        this.geometry.attributes.color.needsUpdate = true;
    }

    cycleShape() {
        this.currentShapeIndex = (this.currentShapeIndex + 1) % SHAPES.length;
        const newShape = SHAPES[this.currentShapeIndex];
        document.getElementById('current-shape').innerText = newShape;
        this.generateTargetShape(newShape);
        this.updateColors();
    }

    setColors(paletteName) {
        if (this.currentPalette !== paletteName && PALETTES[paletteName]) {
            this.currentPalette = paletteName;
            this.updateColors();
        }
    }

    setScale(targetScale) {
        this.targetScale = Math.max(0.5, Math.min(targetScale, 3.0));
    }

    render() {
        // Lerp global scale
        this.globalScale += (this.targetScale - this.globalScale) * 0.1;

        const posAttribute = this.geometry.attributes.position;
        const positions = posAttribute.array;

        // Animate particles
        for (let i = 0; i < this.particleCount; i++) {
            const ix = i * 3;
            const iy = i * 3 + 1;
            const iz = i * 3 + 2;

            const tx = this.targetPositions[ix] * this.globalScale;
            let ty = this.targetPositions[iy] * this.globalScale;
            const tz = this.targetPositions[iz] * this.globalScale;

            positions[ix] += (tx - positions[ix]) * 0.05;
            positions[iy] += (ty - positions[iy]) * 0.05;
            positions[iz] += (tz - positions[iz]) * 0.05;
        }

        posAttribute.needsUpdate = true;
        
        // Slightly rotate the entire system
        this.particles.rotation.y += 0.002;
        this.particles.rotation.z = Math.sin(Date.now() * 0.0005) * 0.1;

        this.renderer.render(this.scene, this.camera);
    }
}
