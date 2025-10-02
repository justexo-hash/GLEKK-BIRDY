// UI Interactions and Modal Management - Mobile Enhanced with Touch Fixes
document.addEventListener('DOMContentLoaded', () => {
  
  // Mobile Menu Elements
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuLinks = document.querySelectorAll('.mobile-menu-link');
  
  // Game Modal Elements
  const gameModal = document.getElementById('game-modal');
  const openGameBtns = [
    document.getElementById('play-game-btn'),
    document.getElementById('launch-game-btn')
  ];
  const closeGameBtn = document.getElementById('close-game-btn');
  const gameOverlay = document.getElementById('game-overlay');
  const restartBtn = document.getElementById('restart-game-btn');
  
  // Mobile Menu Toggle with Enhanced Touch Support
  if (mobileMenuBtn && mobileMenu) {
    const toggleMenu = (forceClose = false) => {
      const isOpen = mobileMenu.classList.contains('show');
      
      if (isOpen || forceClose) {
        mobileMenu.classList.remove('show');
        mobileMenu.classList.add('hidden');
        // Update button icon to hamburger
        mobileMenuBtn.innerHTML = `
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        `;
      } else {
        mobileMenu.classList.remove('hidden');
        setTimeout(() => mobileMenu.classList.add('show'), 10);
        // Update button icon to X
        mobileMenuBtn.innerHTML = `
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        `;
      }
    };
    
    // Enhanced touch event handling for mobile menu button
    let touchStartTime;
    mobileMenuBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      touchStartTime = Date.now();
    });
    
    mobileMenuBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      const touchDuration = Date.now() - touchStartTime;
      if (touchDuration < 500) { // Quick tap
        toggleMenu();
      }
    });
    
    // Fallback click handler for desktop
    mobileMenuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleMenu();
    });
    
    // Close mobile menu when clicking on links
    mobileMenuLinks.forEach(link => {
      const closeMobileMenu = (e) => {
        e.preventDefault();
        toggleMenu(true);
        
        // Handle smooth scrolling
        const targetId = link.getAttribute('href');
        if (targetId && targetId.startsWith('#')) {
          const targetSection = document.querySelector(targetId);
          if (targetSection) {
            const navHeight = document.querySelector('nav').offsetHeight;
            const targetPosition = targetSection.offsetTop - navHeight;
            
            setTimeout(() => {
              window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
              });
            }, 300);
          }
        }
      };
      
      link.addEventListener('touchend', closeMobileMenu);
      link.addEventListener('click', closeMobileMenu);
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
        if (mobileMenu.classList.contains('show')) {
          toggleMenu(true);
        }
      }
    });
    
    // Close mobile menu on touch outside
    document.addEventListener('touchstart', (e) => {
      if (!mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
        if (mobileMenu.classList.contains('show')) {
          toggleMenu(true);
        }
      }
    });
  }
  
  // Open Game Modal with Enhanced Touch Support
  openGameBtns.forEach(btn => {
    if (btn) {
      const openGameModal = (e) => {
        e.preventDefault();
        gameModal.classList.remove('hidden');
        gameModal.classList.add('flex');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        
        // Start the game after modal opens
        setTimeout(() => {
          if (window.startGlekkGame) {
            window.startGlekkGame();
          }
        }, 300);
      };
      
      btn.addEventListener('click', openGameModal);
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        openGameModal(e);
      });
    }
  });
  
  // Close Game Modal with Enhanced Touch Support
  const closeModal = (e) => {
    if (e) e.preventDefault();
    
    gameModal.classList.add('hidden');
    gameModal.classList.remove('flex');
    gameOverlay.classList.add('hidden');
    document.body.style.overflow = ''; // Restore scrolling
    
    // Destroy game instance
    if (window.destroyGlekkGame) {
      window.destroyGlekkGame();
    }
  };
  
  if (closeGameBtn) {
    // Enhanced close button with better touch handling
    let closeButtonTouchStart;
    
    closeGameBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeButtonTouchStart = Date.now();
      closeGameBtn.style.transform = 'scale(0.9)';
    });
    
    closeGameBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeGameBtn.style.transform = 'scale(1)';
      
      const touchDuration = Date.now() - closeButtonTouchStart;
      if (touchDuration < 500) {
        closeModal();
      }
    });
    
    closeGameBtn.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeGameBtn.style.transform = 'scale(1)';
    });
    
    // Fallback click handler for desktop
    closeGameBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    });
  }
  
  // Restart Game with Enhanced Touch Support
  if (restartBtn) {
    const restartGame = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      gameOverlay.classList.add('hidden');
      if (window.restartGlekkGame) {
        window.restartGlekkGame();
      }
    };
    
    let restartTouchStart;
    
    restartBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      restartTouchStart = Date.now();
      restartBtn.style.transform = 'scale(0.95)';
    });
    
    restartBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      restartBtn.style.transform = 'scale(1)';
      
      const touchDuration = Date.now() - restartTouchStart;
      if (touchDuration < 500) {
        restartGame(e);
      }
    });
    
    restartBtn.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      e.stopPropagation();
      restartBtn.style.transform = 'scale(1)';
    });
    
    // Fallback click handler for desktop
    restartBtn.addEventListener('click', restartGame);
  }
  
  // Prevent modal close when clicking inside game area on mobile
  if (gameModal) {
    const modalContent = gameModal.querySelector('.relative');
    if (modalContent) {
      modalContent.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      
      modalContent.addEventListener('touchend', (e) => {
        e.stopPropagation();
      });
    }
    
    // Only close modal when clicking background on desktop
    gameModal.addEventListener('click', (e) => {
      if (e.target === gameModal && window.innerWidth > 768) {
        closeModal();
      }
    });
  }
  
  // Enhanced Touch Support for Game Overlay
  if (gameOverlay) {
    // Ensure game overlay is properly interactive
    gameOverlay.addEventListener('touchstart', (e) => {
      e.stopPropagation();
    });
    
    gameOverlay.addEventListener('touchend', (e) => {
      e.stopPropagation();
    });
    
    gameOverlay.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
  
  // Enhanced Touch Support for preventing pull-to-refresh
  let touchStartY = 0;
  let touchEndY = 0;
  
  // Prevent pull-to-refresh on mobile when game modal is open
  gameModal.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  });
  
  gameModal.addEventListener('touchmove', (e) => {
    touchEndY = e.touches[0].clientY;
    if (touchStartY <= touchEndY) {
      e.preventDefault(); // Prevent pull-to-refresh
    }
  });
  
  // Smooth Scrolling for Navigation Links
  const navLinks = document.querySelectorAll('nav a[href^="#"], .mobile-menu-link[href^="#"]');
  navLinks.forEach(link => {
    const handleNavClick = (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      
      if (targetSection) {
        const navHeight = document.querySelector('nav').offsetHeight;
        const targetPosition = targetSection.offsetTop - navHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    };
    
    link.addEventListener('click', handleNavClick);
  });
  
  // CTA Button Smooth Scrolling
  const ctaLinks = document.querySelectorAll('a[href^="#"]:not(.mobile-menu-link)');
  ctaLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href.startsWith('#') && href !== '#') {
        e.preventDefault();
        const targetSection = document.querySelector(href);
        
        if (targetSection) {
          const navHeight = document.querySelector('nav').offsetHeight;
          const targetPosition = targetSection.offsetTop - navHeight;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });
  
  // Viewport Height Fix for Mobile Browsers
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', () => {
    setTimeout(setVH, 100);
  });
  
  // Intersection Observer for Animations
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -100px 0px', // Trigger animation earlier on mobile
    threshold: 0.1
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-in');
      }
    });
  }, observerOptions);
  
  // Observe sections for animations
  const sections = document.querySelectorAll('section');
  sections.forEach(section => {
    observer.observe(section);
  });
  
  // Add fade-in animation class
  const style = document.createElement('style');
  style.textContent = `
    .animate-fade-in {
      animation: fadeIn 0.8s ease-in-out;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Mobile-optimized fade-in */
    @media (max-width: 768px) {
      .animate-fade-in {
        animation-duration: 0.6s;
      }
      
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    }
  `;
  document.head.appendChild(style);
  
  // Enhanced Keyboard Navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Close game modal
      if (!gameModal.classList.contains('hidden')) {
        closeModal();
      }
      // Close mobile menu
      if (mobileMenu && mobileMenu.classList.contains('show')) {
        const toggleEvent = new Event('click');
        mobileMenuBtn.dispatchEvent(toggleEvent);
      }
    }
  });
  
  // Performance: Debounce scroll events
  let scrollTimeout;
  let lastScrollY = window.scrollY;
  
  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    const nav = document.querySelector('nav');
    
    // Hide/show nav on mobile scroll
    if (window.innerWidth <= 768) {
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        nav.style.transform = 'translateY(-100%)';
      } else {
        // Scrolling up
        nav.style.transform = 'translateY(0)';
      }
    } else {
      // Always show nav on desktop
      nav.style.transform = 'translateY(0)';
    }
    
    lastScrollY = currentScrollY;
  };
  
  window.addEventListener('scroll', () => {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(handleScroll, 10);
  });
  
  // Touch-friendly hover effects
  const addTouchHover = (element) => {
    let touchTimeout;
    
    element.addEventListener('touchstart', (e) => {
      element.classList.add('hover');
      clearTimeout(touchTimeout);
    });
    
    element.addEventListener('touchend', (e) => {
      touchTimeout = setTimeout(() => {
        element.classList.remove('hover');
      }, 300);
    });
    
    element.addEventListener('touchcancel', (e) => {
      clearTimeout(touchTimeout);
      element.classList.remove('hover');
    });
  };
  
  // Apply touch hover to interactive elements
  document.querySelectorAll('button, a, .glekk-btn-primary, .glekk-btn-secondary, .glekk-btn-outline').forEach(addTouchHover);
  
  // Add loading states
  const addLoadingState = (element) => {
    element.classList.add('opacity-50', 'pointer-events-none');
    const originalText = element.textContent;
    element.textContent = 'Loading...';
    
    return () => {
      element.classList.remove('opacity-50', 'pointer-events-none');
      element.textContent = originalText;
    };
  };
  
  // Optimize images for mobile
  const optimizeImages = () => {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      // Add loading="lazy" for better performance
      img.loading = 'lazy';
      
      // Add error handling
      img.addEventListener('error', function() {
        console.warn('Failed to load image:', this.src);
        // Don't hide completely on mobile, show placeholder instead
        if (window.innerWidth <= 768) {
          this.style.opacity = '0.5';
          this.alt = 'Image not available';
        } else {
          this.style.display = 'none';
        }
      });
      
      // Add load event for fade-in effect
      img.addEventListener('load', function() {
        this.style.opacity = '0';
        this.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
          this.style.opacity = '1';
        }, 100);
      });
    });
  };
  
  optimizeImages();
  
  // Reduce motion for users who prefer it
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.setProperty('--animation-duration', '0.01s');
  }
  
  // Better touch scrolling on iOS
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    document.body.style.webkitOverflowScrolling = 'touch';
  }
  
  // Enhanced button feedback for mobile
  const enhanceButtonFeedback = () => {
    const buttons = document.querySelectorAll('button, .glekk-btn-primary, .glekk-btn-secondary, .glekk-btn-outline');
    
    buttons.forEach(button => {
      button.addEventListener('touchstart', function() {
        this.style.transform = 'scale(0.95)';
      });
      
      button.addEventListener('touchend', function() {
        setTimeout(() => {
          this.style.transform = 'scale(1)';
        }, 100);
      });
      
      button.addEventListener('touchcancel', function() {
        this.style.transform = 'scale(1)';
      });
    });
  };
  
  enhanceButtonFeedback();
  
  // Make functions globally available
  window.addLoadingState = addLoadingState;
  window.closeGameModal = closeModal;
  
  // Debug logging for mobile
  if (window.innerWidth <= 768) {
    console.log('Mobile UI enhancements loaded');
  }
});