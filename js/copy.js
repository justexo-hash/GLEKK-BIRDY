// Copy to Clipboard Functionality - Enhanced for Mobile
document.addEventListener('DOMContentLoaded', () => {
  const copyBtn = document.getElementById('copy-address-btn');
  const contractInput = document.getElementById('contract-address');
  
  if (copyBtn && contractInput) {
    // Enhanced touch handling for mobile
    const handleCopy = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      try {
        // Try to use the modern Clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(contractInput.value);
          showCopySuccess();
        } else {
          // Fallback for older browsers or non-secure contexts
          contractInput.select();
          contractInput.setSelectionRange(0, 99999); // For mobile devices
          
          // Execute copy command
          const successful = document.execCommand('copy');
          if (successful) {
            showCopySuccess();
          } else {
            throw new Error('Copy command failed');
          }
        }
      } catch (error) {
        console.error('Failed to copy text: ', error);
        showCopyError();
      }
    };
    
    // Add both touch and click handlers
    copyBtn.addEventListener('click', handleCopy);
    
    // Enhanced touch handling for mobile
    let touchStartTime;
    copyBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      touchStartTime = Date.now();
      copyBtn.style.transform = 'scale(0.95)';
    });
    
    copyBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      copyBtn.style.transform = 'scale(1)';
      
      const touchDuration = Date.now() - touchStartTime;
      if (touchDuration < 500) { // Quick tap
        handleCopy(e);
      }
    });
    
    copyBtn.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      copyBtn.style.transform = 'scale(1)';
    });
  }
  
  function showCopySuccess() {
    const originalText = copyBtn.textContent;
    const originalClasses = copyBtn.className;
    const originalStyle = copyBtn.style.cssText;
    
    // Update button appearance with fixed positioning
    copyBtn.textContent = 'Copied!';
    copyBtn.className = 'glekk-btn-secondary px-6 py-2 copied';
    copyBtn.style.background = '#9ACD32';
    copyBtn.style.color = '#000';
    copyBtn.style.border = '2px solid #9ACD32';
    copyBtn.style.position = 'relative !important';
    copyBtn.style.zIndex = '10 !important';
    copyBtn.style.transform = 'none !important'; // Prevent any transforms
    copyBtn.style.pointerEvents = 'none'; // Prevent multiple clicks during success state
    
    // Reset after 2 seconds
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.className = originalClasses;
      copyBtn.style.cssText = originalStyle;
      copyBtn.style.pointerEvents = 'auto'; // Re-enable interactions
    }, 2000);
    
    // Show success toast
    showToast('Contract address copied to clipboard!', 'success');
  }
  
  function showCopyError() {
    const originalText = copyBtn.textContent;
    const originalClasses = copyBtn.className;
    const originalStyle = copyBtn.style.cssText;
    
    // Update button to show error with fixed positioning
    copyBtn.textContent = 'Failed!';
    copyBtn.style.background = '#ff0000';
    copyBtn.style.color = '#fff';
    copyBtn.style.border = '2px solid #ff0000';
    copyBtn.style.position = 'relative !important';
    copyBtn.style.zIndex = '10 !important';
    copyBtn.style.transform = 'none !important'; // Prevent any transforms
    copyBtn.style.pointerEvents = 'none'; // Prevent multiple clicks during error state
    
    // Reset after 2 seconds
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.className = originalClasses;
      copyBtn.style.cssText = originalStyle;
      copyBtn.style.pointerEvents = 'auto'; // Re-enable interactions
    }, 2000);
    
    // Show error toast
    showToast('Failed to copy address. Please copy manually.', 'error');
  }
  
  // Enhanced toast notification system for mobile
  function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.glekk-toast');
    existingToasts.forEach(toast => toast.remove());
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'glekk-toast fixed top-20 right-4 left-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 px-6 py-4 rounded-lg font-bold text-center sm:text-left transform translate-y-full transition-transform duration-300';
    
    // Set color based on type
    switch (type) {
      case 'success':
        toast.style.background = 'linear-gradient(135deg, #9ACD32, #FFD700)';
        toast.style.color = '#000';
        toast.innerHTML = `
          <div class="flex items-center justify-center sm:justify-start space-x-2">
            <span class="text-lg">✓</span>
            <span>${message}</span>
          </div>
        `;
        break;
      case 'error':
        toast.style.background = '#ff0000';
        toast.style.color = '#fff';
        toast.innerHTML = `
          <div class="flex items-center justify-center sm:justify-start space-x-2">
            <span class="text-lg">✗</span>
            <span>${message}</span>
          </div>
        `;
        break;
      default:
        toast.style.background = '#333';
        toast.style.color = '#fff';
        toast.textContent = message;
    }
    
    // Enhanced mobile styling
    if (window.innerWidth <= 768) {
      toast.style.bottom = '20px';
      toast.style.top = 'auto';
      toast.style.left = '16px';
      toast.style.right = '16px';
      toast.style.transform = 'translateY(100%)';
    }
    
    // Add to DOM
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      if (window.innerWidth <= 768) {
        toast.style.transform = 'translateY(0)';
      } else {
        toast.style.transform = 'translateY(0)';
      }
    }, 100);
    
    // Auto-dismiss functionality
    let dismissed = false;
    const dismissToast = () => {
      if (dismissed) return;
      dismissed = true;
      
      if (window.innerWidth <= 768) {
        toast.style.transform = 'translateY(100%)';
      } else {
        toast.style.transform = 'translateX(100%)';
      }
      
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    };
    
    // Auto-dismiss after delay
    setTimeout(dismissToast, 3000);
    
    // Manual dismiss on tap/click
    toast.addEventListener('click', dismissToast);
    toast.addEventListener('touchend', (e) => {
      e.preventDefault();
      dismissToast();
    });
  }
  
  // Enhanced input interaction for mobile
  if (contractInput) {
    // Auto-select text when tapping on input (mobile-friendly)
    const handleInputFocus = (e) => {
      // Delay selection slightly on mobile for better UX
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          contractInput.select();
          contractInput.setSelectionRange(0, 99999);
        }, 100);
      } else {
        contractInput.select();
      }
    };
    
    contractInput.addEventListener('click', handleInputFocus);
    contractInput.addEventListener('touchend', (e) => {
      e.preventDefault();
      handleInputFocus(e);
    });
    contractInput.addEventListener('focus', handleInputFocus);
    
    // Prevent manual editing of contract address
    contractInput.addEventListener('keydown', (e) => {
      // Allow selection shortcuts but prevent typing
      if (!e.ctrlKey && !e.metaKey && e.key.length === 1) {
        e.preventDefault();
      }
    });
    
    contractInput.addEventListener('paste', (e) => {
      e.preventDefault();
    });
    
    contractInput.addEventListener('input', (e) => {
      // Reset to original value if somehow changed
      contractInput.value = "0x1234567890123456789012345678901234567890";
    });
    
    // Enhanced mobile input styling
    if (window.innerWidth <= 768) {
      contractInput.style.fontSize = '16px'; // Prevent zoom on iOS
      contractInput.style.userSelect = 'all'; // Make selection easier
    }
  }
  
  // Add double-tap to copy functionality for mobile
  if (contractInput && window.innerWidth <= 768) {
    let lastTap = 0;
    
    contractInput.addEventListener('touchend', (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      
      if (tapLength < 500 && tapLength > 0) {
        // Double tap detected
        e.preventDefault();
        if (copyBtn) {
          const copyEvent = new Event('click');
          copyBtn.dispatchEvent(copyEvent);
        }
        
        // Provide haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
        
        showToast('Double-tap detected! Copying...', 'info');
      }
      lastTap = currentTime;
    });
  }
  
  // Add visual feedback for better mobile UX
  if (copyBtn) {
    copyBtn.addEventListener('mousedown', () => {
      copyBtn.style.transform = 'scale(0.95)';
    });
    
    copyBtn.addEventListener('mouseup', () => {
      setTimeout(() => {
        copyBtn.style.transform = 'scale(1)';
      }, 100);
    });
    
    copyBtn.addEventListener('mouseleave', () => {
      copyBtn.style.transform = 'scale(1)';
    });
  }
  
  // Log for debugging
  if (window.innerWidth <= 768) {
    console.log('Mobile copy functionality enhanced');
  }
});