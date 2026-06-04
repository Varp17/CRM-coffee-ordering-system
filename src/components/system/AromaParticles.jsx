import React, { useEffect, useRef } from 'react';
import './AromaParticles.css';

const AromaParticles = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, rx: 0, ry: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationId;
    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;

    canvas.width = W * (window.devicePixelRatio || 1);
    canvas.height = H * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    const particles = [];
    const particleCount = 45;

    class Particle {
      constructor() {
        this.reset();
        this.y = Math.random() * H;
      }

      reset() {
        this.x = Math.random() * W;
        this.y = H + 20;
        this.size = Math.random() * 3.5 + 1.2;
        this.speedY = Math.random() * 0.6 + 0.3;
        this.speedX = Math.random() * 0.4 - 0.2;
        this.opacity = Math.random() * 0.4 + 0.15;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = Math.random() * 0.02 - 0.01;
        this.isBean = Math.random() > 0.6; // Render some as coffee beans
      }

      update() {
        // Rise up
        this.y -= this.speedY;
        this.x += this.speedX + Math.sin(this.y * 0.01) * 0.15;
        this.rotation += this.rotationSpeed;

        // Mouse interaction
        const dx = this.x - mouseRef.current.rx;
        const dy = this.y - mouseRef.current.ry;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          const force = (100 - dist) * 0.05;
          this.x += (dx / dist) * force;
          this.y += (dy / dist) * force;
        }

        // Reset if offscreen
        if (this.y < -20 || this.x < -20 || this.x > W + 20) {
          this.reset();
        }
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (this.isBean) {
          // Render a simple 3D vector coffee bean
          ctx.fillStyle = '#6F4E37';
          ctx.beginPath();
          ctx.ellipse(0, 0, this.size * 1.5, this.size * 0.9, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Split line down the bean center
          ctx.strokeStyle = '#5D4032';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(-this.size * 1.2, 0);
          ctx.bezierCurveTo(0, -this.size * 0.2, 0, this.size * 0.2, this.size * 1.2, 0);
          ctx.stroke();
        } else {
          // Render rising aroma/steam specs
          ctx.fillStyle = '#E8E5E1';
          ctx.beginPath();
          ctx.arc(0, 0, this.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Capture mouse movement relative to canvas bounds
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Track scroll velocity
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = Math.abs(currentScrollY - lastScrollY);
      lastScrollY = currentScrollY;

      // Accelerate rising speed briefly on scroll
      particles.forEach(p => {
        p.y -= diff * 0.15;
      });
    };

    window.addEventListener('scroll', handleScroll);

    // Resize handler
    const handleResize = () => {
      if (!canvas) return;
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W * (window.devicePixelRatio || 1);
      canvas.height = H * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };

    window.addEventListener('resize', handleResize);

    const animate = () => {
      // Lerp mouse positions for fluid spring movement
      mouseRef.current.rx += (mouseRef.current.x - mouseRef.current.rx) * 0.08;
      mouseRef.current.ry += (mouseRef.current.y - mouseRef.current.ry) * 0.08;

      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="aroma-particles-container">
      <canvas ref={canvasRef} className="aroma-particles-canvas" />
    </div>
  );
};

export default AromaParticles;
