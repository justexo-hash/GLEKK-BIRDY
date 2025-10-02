// Confetti and Particle Effects - Mobile Optimized
class ConfettiSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.colors = ['#9ACD32', '#FFD700', '#00fffc', '#fc00ff', '#fffc00'];
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    this.isActive = true;
    this.lastTime = 0;
    this.frameCount = 0;
    
    // Adjust particle count and complexity for mobile
    this.maxParticles = this.isMobile ? 30 : 100;
    this.particleCreationRate = this.isMobile ? 0.1 : 0.3;
    
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Start with reduced frequency animation for better mobile performance
    this.animate();
    
    // Pause confetti when page is not visible (mobile battery saving)
    document.addEventListener('visibilitychange', () => {
      this.isActive = !document.hidden;
    });
  }
  
  resizeCanvas() {
    const dpr = this.isMobile ? 1 : (window.devicePixelRatio || 1); // Reduce DPR on mobile
    
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    
    this.ctx.scale(dpr, dpr);
  }
  
  createParticle() {
    const size = this.isMobile ? 
      Math.random() * 4 + 2 : // Smaller particles on mobile
      Math.random() * 6 + 2;
      
    return {
      x: Math.random() * window.innerWidth,
      y: -10,
      vx: (Math.random() - 0.5) * (this.isMobile ? 2 : 4), // Slower movement on mobile
      vy: Math.random() * 2 + 1,
      size: size,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * (this.isMobile ? 5 : 10), // Slower rotation on mobile
      life: 1,
      decay: Math.random() * 0.015 + 0.005 // Faster decay on mobile for performance
    };
  }
  
  updateParticle(particle) {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.08; // Slightly less gravity for mobile
    particle.rotation += particle.rotationSpeed;
    particle.life -= particle.decay;
    
    // Bounce off walls (simplified physics on mobile)
    if (particle.x <= 0 || particle.x >= window.innerWidth) {
      particle.vx *= this.isMobile ? -0.6 : -0.8; // Less bouncy on mobile
    }
  }
  
  drawParticle(particle) {
    this.ctx.save();
    this.ctx.globalAlpha = particle.life;
    this.ctx.translate(particle.x, particle.y);
    this.ctx.rotate(particle.rotation * Math.PI / 180);
    
    this.ctx.fillStyle = particle.color;
    
    // Use simple rectangles on mobile, more complex shapes on desktop
    if (this.isMobile) {
      this.ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
    } else {
      // More complex shape for desktop
      this.ctx.beginPath();
      this.ctx.moveTo(0, -particle.size/2);
      this.ctx.lineTo(particle.size/2, 0);
      this.ctx.lineTo(0, particle.size/2);
      this.ctx.lineTo(-particle.size/2, 0);
      this.ctx.closePath();
      this.ctx.fill();
    }
    
    this.ctx.restore();
  }
  
  burst(x, y, count = null) {
    if (!this.isActive) return;
    
    // Adjust burst intensity based on device
    if (count === null) {
      count = this.isMobile ? 20 : 50;
    } else {
      count = this.isMobile ? Math.min(count, 30) : count;
    }
    
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        break; // Don't exceed particle limit
      }
      
      const particle = this.createParticle();
      particle.x = x;
      particle.y = y;
      
      // More controlled burst pattern on mobile
      const angle = (i / count) * Math.PI * 2;
      const speed = this.isMobile ? 
        Math.random() * 4 + 2 : 
        Math.random() * 8 + 4;
        
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed - (this.isMobile ? 3 : 5);
      
      this.particles.push(particle);
    }
  }
  
  animate(currentTime = 0) {
    if (!this.isActive) {
      requestAnimationFrame((time) => this.animate(time));
      return;
    }
    
    // Frame rate limiting for mobile
    const deltaTime = currentTime - this.lastTime;
    const targetFPS = this.isMobile ? 30 : 60;
    const frameInterval = 1000 / targetFPS;
    
    if (deltaTime < frameInterval) {
      requestAnimationFrame((time) => this.animate(time));
      return;
    }
    
    this.lastTime = currentTime;
    this.frameCount++;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    
    // Randomly add particles (less frequently on mobile)
    if (Math.random() < this.particleCreationRate && this.particles.length < this.maxParticles) {
      this.particles.push(this.createParticle());
    }
    
    // Update and draw particles
    this.particles = this.particles.filter((particle, index) => {
      this.updateParticle(particle);
      
      if (particle.life > 0 && particle.y < window.innerHeight + 100) {
        // Skip drawing some particles on mobile for performance
        if (!this.isMobile || index % 2 === 0 || this.frameCount % 2 === 0) {
          this.drawParticle(particle);
        }
        return true;
      }
      return false;
    });
    
    requestAnimationFrame((time) => this.animate(time));
  }
  
  // Method to temporarily boost particles (e.g., on user interaction)
  boost() {
    if (!this.isActive) return;
    
    this.particleCreationRate = this.isMobile ? 0.3 : 0.5;
    
    // Reset to normal rate after a short time
    setTimeout(() => {
      this.particleCreationRate = this.isMobile ? 0.1 : 0.3;
    }, 2000);
  }
  
  // Method to pause/resume
  pause() {
    this.isActive = false;
  }
  
  resume() {
    this.isActive = true;
  }
  
  // Method to clear all particles
  clear() {
    this.particles = [];
  }
  
  // Cleanup method
  destroy() {
    this.clear();
    this.pause();
    window.removeEventListener('resize', () => this.resizeCanvas());
    document.removeEventListener('visibilitychange', () => {
      this.isActive = !document.hidden;
    });
  }
}

// Initialize confetti system when page loads
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) {
    console.warn('Confetti canvas not found');
    return;
  }
  
  const confetti = new ConfettiSystem(canvas);
  
  // Trigger confetti burst on hero section interactions
  const heroSection = document.getElementById('home');
  if (heroSection) {
    // Enhanced interaction handlers for both desktop and mobile
    const handleInteraction = (e) => {
      let x, y;
      
      if (e.type === 'touchend' && e.changedTouches) {
        x = e.changedTouches[0].clientX;
        y = e.changedTouches[0].clientY;
      } else if (e.clientX !== undefined) {
        x = e.clientX;
        y = e.clientY;
      } else {
        // Fallback to random position
        x = Math.random() * window.innerWidth;
        y = Math.random() * window.innerHeight * 0.5;
      }
      
      confetti.burst(x, y, confetti.isMobile ? 15 : 30);
    };
    
    // Add both click and touch handlers
    heroSection.addEventListener('click', handleInteraction);
    heroSection.addEventListener('touchend', (e) => {
      e.preventDefault(); // Prevent double-firing with click
      handleInteraction(e);
    });
  }
  
  // Auto-trigger confetti periodically (less frequent on mobile)
  const autoTriggerInterval = confetti.isMobile ? 15000 : 10000; // 15s on mobile, 10s on desktop
  
  setInterval(() => {
    if (confetti.isActive && !document.hidden) {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight * 0.5;
      confetti.burst(x, y, confetti.isMobile ? 10 : 20);
    }
  }, autoTriggerInterval);
  
  // Trigger confetti on CTA button clicks
  const ctaButtons = document.querySelectorAll('.glekk-btn-primary, .glekk-btn-secondary');
  ctaButtons.forEach(button => {
    const handleButtonClick = (e) => {
      const rect = button.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      
      confetti.burst(x, y, confetti.isMobile ? 12 : 25);
      confetti.boost(); // Temporarily increase particle creation
    };
    
    button.addEventListener('click', handleButtonClick);
    button.addEventListener('touchend', (e) => {
      // Small delay to prevent double-firing
      setTimeout(() => handleButtonClick(e), 50);
    });
  });
  
  // Performance monitoring for mobile
  if (confetti.isMobile) {
    let performanceCheckInterval = setInterval(() => {
      // If too many particles, reduce creation rate
      if (confetti.particles.length > confetti.maxParticles * 0.8) {
        confetti.particleCreationRate *= 0.8;
      }
      
      // Check frame rate and adjust if needed
      // This is a simplified check - in a real app you'd want more sophisticated monitoring
      if (confetti.frameCount % 300 === 0) { // Check every 10 seconds at 30fps
        console.log('Confetti particles:', confetti.particles.length);
      }
    }, 10000);
    
    // Clean up interval when page unloads
    window.addEventListener('beforeunload', () => {
      clearInterval(performanceCheckInterval);
      confetti.destroy();
    });
  }
  
  // Pause confetti when page becomes hidden (mobile battery saving)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      confetti.pause();
    } else {
      confetti.resume();
    }
  });
  
  // Reduce confetti when device is low on battery (if supported)
  if (navigator.getBattery) {
    navigator.getBattery().then(battery => {
      const checkBattery = () => {
        if (battery.level < 0.2 && !battery.charging) {
          // Low battery and not charging - reduce effects
          confetti.particleCreationRate *= 0.5;
          confetti.maxParticles = Math.floor(confetti.maxParticles * 0.6);
        }
      };
      
      battery.addEventListener('levelchange', checkBattery);
      battery.addEventListener('chargingchange', checkBattery);
      checkBattery(); // Initial check
    });
  }
  
  // Make confetti system globally available for other scripts
  window.confettiSystem = confetti;
  
  // Log initialization
  console.log('Confetti system initialized:', {
    mobile: confetti.isMobile,
    maxParticles: confetti.maxParticles,
    creationRate: confetti.particleCreationRate
  });
});