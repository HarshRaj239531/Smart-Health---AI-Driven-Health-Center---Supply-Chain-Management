import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '../context/ThemeContext';

const ThreeBg = () => {
  const containerRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;

    // Use window dimensions directly
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1000);
    camera.position.y = 110; // High angle view looking down
    camera.position.z = 210;
    camera.rotation.x = -0.42;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Particle Grid (60 columns x 40 rows = 2400 nodes)
    const numParticlesX = 60;
    const numParticlesZ = 40;
    const separation = 16;
    const particleCount = numParticlesX * numParticlesZ;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    let i = 0;
    for (let ix = 0; ix < numParticlesX; ix++) {
      for (let iz = 0; iz < numParticlesZ; iz++) {
        positions[i] = ix * separation - (numParticlesX * separation) / 2; // x
        positions[i + 1] = 0; // y (undulates)
        positions[i + 2] = iz * separation - (numParticlesZ * separation) / 2; // z
        i += 3;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Theme sensitive wave color
    const isLight = theme === 'light';
    const waveColor = isLight ? '#4f46e5' : '#10b981'; // Vivid indigo vs Neon emerald

    // Create a high-quality radial gradient circle dot texture
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(8, 8, 8, 0, Math.PI * 2);
    ctx.fill();
    const texture = new THREE.CanvasTexture(canvas);

    // Using native PointsMaterial for 100% rendering safety
    const material = new THREE.PointsMaterial({
      color: new THREE.Color(waveColor),
      size: 3.5,
      transparent: true,
      opacity: isLight ? 0.35 : 0.5, // Subtle particle opacity
      map: texture,
      depthWrite: false,
      blending: isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Interaction target variables
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event) => {
      mouseX = (event.clientX - window.innerWidth / 2) * 0.5;
      mouseY = (event.clientY - window.innerHeight / 2) * 0.5;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let count = 0;
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth camera pan lag
      targetX += (mouseX - targetX) * 0.04;
      targetY += (mouseY - targetY) * 0.04;
      camera.position.x = targetX * 0.45;
      camera.position.z = 210 + targetY * 0.25;
      camera.lookAt(new THREE.Vector3(0, -10, 0));

      const positionsArray = geometry.attributes.position.array;
      count += 0.03;

      let index = 0;
      for (let ix = 0; ix < numParticlesX; ix++) {
        for (let iz = 0; iz < numParticlesZ; iz++) {
          const px = positionsArray[index];
          const pz = positionsArray[index + 2];

          // Wave equation
          let py = Math.sin((ix + count) * 0.3) * 15 + Math.sin((iz + count) * 0.4) * 15;

          // Mouse proximity ripple physics
          const dx = px - targetX;
          const dz = pz - targetY;
          const distance = Math.sqrt(dx * dx + dz * dz);
          const forceRadius = 140;

          if (distance < forceRadius) {
            const force = (1.0 - distance / forceRadius) * 45;
            py += force; // Push wave up near mouse cursor
          }

          positionsArray[index + 1] = py;
          index += 3;
        }
      }

      geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      texture.dispose();
    };
  }, [theme]);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-1 pointer-events-none opacity-25 dark:opacity-35"
    />
  );
};

export default ThreeBg;
