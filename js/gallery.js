// Reddit Gallery Loader - Mobile Fixed Version with CORS Proxy
class GalleryManager {
  constructor() {
    this.galleryGrid = document.getElementById('gallery-grid');
    this.loadingElement = document.getElementById('gallery-loading');
    this.images = [];
    this.currentIndex = 0;
    this.batchSize = 16;
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
    // Initialize gallery immediately
    this.loadGallery();
  }
  
  async loadGallery() {
    try {
      this.showLoading(true);
      console.log('Starting gallery load for mobile:', this.isMobile);
      
      // Always try Reddit first with multiple methods
      const redditImages = await this.fetchRedditImagesWithFallback();
      
      if (redditImages.length > 0) {
        console.log('Reddit images loaded successfully:', redditImages.length);
        this.images = redditImages;
        this.currentIndex = 0;
        this.renderBatch();
      } else {
        console.log('Reddit failed, loading demo images');
        this.loadDemoImages();
      }
      
    } catch (error) {
      console.error('Gallery loading failed:', error);
      this.loadDemoImages();
    } finally {
      this.showLoading(false);
    }
  }
  
  async fetchRedditImagesWithFallback() {
    // Multiple fetch strategies
    const strategies = [
      () => this.fetchRedditViaProxy(),
      () => this.fetchRedditDirect(),
      () => this.fetchRedditJSONP()
    ];
    
    for (const strategy of strategies) {
      try {
        console.log('Trying Reddit fetch strategy...');
        const images = await strategy();
        if (images.length > 0) {
          console.log('Strategy succeeded with', images.length, 'images');
          return images;
        }
      } catch (error) {
        console.log('Strategy failed:', error.message);
        continue;
      }
    }
    
    return [];
  }
  
  // Method 1: Using CORS proxy
  async fetchRedditViaProxy() {
    const proxyUrls = [
      'https://api.allorigins.win/get?url=',
      'https://cors-anywhere.herokuapp.com/',
      'https://corsproxy.io/?'
    ];
    
    const redditUrl = 'https://www.reddit.com/r/glekk/hot.json?limit=25&raw_json=1';
    
    for (const proxy of proxyUrls) {
      try {
        const response = await fetch(proxy + encodeURIComponent(redditUrl), {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (response.ok) {
          let data;
          if (proxy.includes('allorigins')) {
            const result = await response.json();
            data = JSON.parse(result.contents);
          } else {
            data = await response.json();
          }
          
          const images = this.processRedditData(data);
          if (images.length > 0) {
            return images;
          }
        }
      } catch (error) {
        console.log('Proxy failed:', proxy, error.message);
        continue;
      }
    }
    
    throw new Error('All proxy methods failed');
  }
  
  // Method 2: Direct fetch (works on some mobile browsers)
  async fetchRedditDirect() {
    const endpoints = [
      'https://www.reddit.com/r/glekk/hot.json?limit=25&raw_json=1',
      'https://www.reddit.com/r/glekk.json?limit=25&raw_json=1'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; GLEKK-Gallery/1.0)',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          mode: 'cors',
          credentials: 'omit'
        });
        
        if (response.ok) {
          const data = await response.json();
          const images = this.processRedditData(data);
          if (images.length > 0) {
            return images;
          }
        }
      } catch (error) {
        console.log('Direct fetch failed:', endpoint, error.message);
        continue;
      }
    }
    
    throw new Error('Direct fetch methods failed');
  }
  
  // Method 3: JSONP fallback
  async fetchRedditJSONP() {
    return new Promise((resolve, reject) => {
      const callbackName = 'redditCallback_' + Date.now();
      const script = document.createElement('script');
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('JSONP timeout'));
      }, 10000);
      
      const cleanup = () => {
        clearTimeout(timeout);
        document.head.removeChild(script);
        delete window[callbackName];
      };
      
      window[callbackName] = (data) => {
        cleanup();
        try {
          const images = this.processRedditData(data);
          resolve(images);
        } catch (error) {
          reject(error);
        }
      };
      
      script.onerror = () => {
        cleanup();
        reject(new Error('JSONP script error'));
      };
      
      script.src = `https://www.reddit.com/r/glekk/hot.json?limit=25&jsonp=${callbackName}`;
      document.head.appendChild(script);
    });
  }
  
  processRedditData(data) {
    const images = [];
    
    if (!data.data || !data.data.children) {
      throw new Error('Invalid Reddit data structure');
    }
    
    data.data.children.forEach((post, index) => {
      const postData = post.data;
      
      // Skip if no title or deleted
      if (!postData.title || postData.title === '[deleted]' || !postData.author) {
        return;
      }
      
      try {
        // Process different types of Reddit media
        this.extractImagesFromPost(postData, images);
      } catch (postError) {
        console.log('Error processing post:', postData.title, postError);
      }
    });
    
    // Filter and deduplicate
    const validImages = images
      .filter((img, index, array) => {
        return img.url && 
               img.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) &&
               array.findIndex(other => other.url === img.url) === index;
      })
      .slice(0, 20);
    
    console.log(`Processed ${data.data.children.length} posts into ${validImages.length} images`);
    return validImages;
  }
  
  extractImagesFromPost(postData, images) {
    // Direct image posts
    if (postData.post_hint === 'image' && postData.url) {
      const imageUrl = this.normalizeImageUrl(postData.url);
      if (imageUrl) {
        images.push(this.createImageObject(postData, imageUrl));
      }
    }
    
    // Reddit uploaded images (i.redd.it)
    else if (postData.url && postData.url.includes('i.redd.it')) {
      images.push(this.createImageObject(postData, postData.url));
    }
    
    // Preview images
    else if (postData.preview && postData.preview.images && postData.preview.images[0]) {
      const preview = postData.preview.images[0];
      if (preview.source && preview.source.url) {
        const previewUrl = preview.source.url.replace(/&amp;/g, '&');
        images.push(this.createImageObject(postData, previewUrl));
      }
    }
    
    // Gallery posts
    else if (postData.is_gallery && postData.media_metadata) {
      Object.entries(postData.media_metadata).forEach(([mediaId, metadata], galleryIndex) => {
        if (metadata.s && metadata.s.u) {
          const imageUrl = metadata.s.u.replace(/&amp;/g, '&');
          images.push(this.createImageObject(postData, imageUrl, `${postData.title} (${galleryIndex + 1})`, `${postData.id}_${galleryIndex}`));
        }
      });
    }
    
    // Imgur links
    else if (postData.url && postData.url.includes('imgur.com')) {
      const imgurUrl = this.processImgurUrl(postData.url);
      if (imgurUrl) {
        images.push(this.createImageObject(postData, imgurUrl));
      }
    }
  }
  
  normalizeImageUrl(url) {
    if (!url) return null;
    
    // Handle imgur URLs
    if (url.includes('imgur.com')) {
      return this.processImgurUrl(url);
    }
    
    // Ensure proper image extension
    if (!url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return null;
    }
    
    return url;
  }
  
  processImgurUrl(url) {
    try {
      // Skip galleries and albums
      if (url.includes('/a/') || url.includes('/gallery/')) {
        return null;
      }
      
      // Extract imgur ID
      const match = url.match(/imgur\.com\/(\w+)/);
      if (match) {
        const imgurId = match[1];
        return `https://i.imgur.com/${imgurId}.jpg`;
      }
    } catch (error) {
      console.log('Error processing imgur URL:', url, error);
    }
    
    return null;
  }
  
  createImageObject(postData, imageUrl, customTitle = null, customId = null) {
    return {
      url: imageUrl,
      title: customTitle || postData.title,
      author: postData.author || 'unknown',
      score: postData.score || 0,
      permalink: 'https://reddit.com' + postData.permalink,
      id: customId || postData.id,
      subreddit: postData.subreddit
    };
  }
  
  loadDemoImages() {
    console.log('Loading enhanced demo images');
    
    const demoImages = [];
    
    // Add any existing assets
    const assetImages = [
      { 
        url: 'assets/glekk-grass.png', 
        title: 'Original GLEKK on Grass', 
        author: 'glekk-team', 
        score: 100,
        id: 'asset1' 
      },
      { 
        url: 'assets/glekk-suits.png', 
        title: 'Corporate GLEKK Team', 
        author: 'glekk-team', 
        score: 95,
        id: 'asset2'
      }
    ];
    
    // Enhanced demo themes
    const themes = [
      'Tennis Ball Collection', 'Bird Photography', 'Green Nature Scene', 'Sports Meme Culture',
      'Tennis Court Action', 'Flying Bird Sequence', 'Grass Field Vista', 'Yellow Sports Equipment',
      'Tennis Ball Close-up', 'Bird in Flight', 'Green Tennis Ball Art', 'Sports Equipment Design',
      'Bird on Branch', 'Tennis Match Moment', 'GLEKK Community Art', 'Tennis Bird Hybrid',
      'Green Sports Theme', 'Bird Tennis Player', 'Court Side View', 'Flying Tennis Ball',
      'Nature Sports Fusion', 'GLEKK Fan Art', 'Tennis Ball Bird', 'Green Court Design'
    ];
    
    // Generate diverse placeholder images
    themes.forEach((theme, i) => {
      const seedBase = 2000 + i;
      const size = this.isMobile ? 300 : 400;
      
      // Use multiple placeholder services for variety
      const services = [
        `https://picsum.photos/seed/${seedBase}/${size}/${size}`,
        `https://source.unsplash.com/${size}x${size}/?tennis,sport,sig=${seedBase}`,
        `https://source.unsplash.com/${size}x${size}/?bird,nature,sig=${seedBase}`,
        `https://source.unsplash.com/${size}x${size}/?green,grass,sig=${seedBase}`
      ];
      
      const serviceIndex = i % services.length;
      const imageUrl = services[serviceIndex];
      
      demoImages.push({
        url: imageUrl,
        title: `GLEKK ${theme}`,
        author: `glekkfan${(i % 10) + 1}`,
        score: Math.floor(Math.random() * 150) + 20,
        id: `demo${i + 3}`,
        permalink: 'https://reddit.com/r/glekk'
      });
    });
    
    // Combine assets and generated images
    this.images = [...assetImages, ...demoImages];
    this.currentIndex = 0;
    this.renderBatch();
  }
  
  refreshGallery() {
    this.galleryGrid.innerHTML = '';
    this.currentIndex = 0;
    this.renderBatch();
  }
  
  renderBatch() {
    const startIndex = this.currentIndex;
    const endIndex = Math.min(startIndex + this.batchSize, this.images.length);
    const batch = this.images.slice(startIndex, endIndex);
    
    console.log(`Rendering batch: ${startIndex} to ${endIndex}, total: ${this.images.length}`);
    
    batch.forEach((image, batchIndex) => {
      const imageElement = this.createImageElement(image, startIndex + batchIndex);
      this.galleryGrid.appendChild(imageElement);
    });
    
    this.currentIndex = endIndex;
    
    // Add load more button if there are more images
    if (this.currentIndex < this.images.length) {
      this.addLoadMoreButton();
    }
  }
  
  createImageElement(image, index) {
    const container = document.createElement('div');
    container.className = 'relative group overflow-hidden rounded-xl bg-gray-800 aspect-square cursor-pointer transform transition-all duration-300 hover:scale-105 hover:z-10 gallery-image-container';
    container.setAttribute('data-image-id', image.id || index);
    
    const img = document.createElement('img');
    img.src = image.url;
    img.alt = image.title || 'GLEKK Image';
    img.className = 'w-full h-full object-cover transition-transform duration-300 group-hover:scale-110';
    img.loading = 'lazy';
    
    // Enhanced error handling with multiple fallback strategies
    let fallbackAttempts = 0;
    const maxFallbacks = 3;
    
    const tryFallback = () => {
      fallbackAttempts++;
      console.log(`Image fallback attempt ${fallbackAttempts} for:`, image.url);
      
      if (fallbackAttempts <= maxFallbacks) {
        // Try different fallback strategies
        if (image.url.includes('picsum.photos')) {
          const newSeed = Math.floor(Math.random() * 1000) + fallbackAttempts * 100;
          img.src = `https://picsum.photos/seed/${newSeed}/300/300`;
          return;
        }
        
        if (image.url.includes('unsplash.com')) {
          const keywords = ['tennis', 'bird', 'green', 'sports'][fallbackAttempts - 1] || 'nature';
          img.src = `https://source.unsplash.com/300x300/?${keywords},sig=${Date.now() + fallbackAttempts}`;
          return;
        }
        
        if (image.url.includes('imgur.com') && fallbackAttempts === 1) {
          img.src = image.url.replace('.jpg', '.png');
          return;
        }
        
        if (fallbackAttempts === 2) {
          // Try another picsum image
          img.src = `https://picsum.photos/seed/${Date.now()}/300/300`;
          return;
        }
      }
      
      // Final fallback - create styled placeholder
      createStyledPlaceholder();
    };
    
    const createStyledPlaceholder = () => {
      img.style.display = 'none';
      container.innerHTML = `
        <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-glekk-green to-glekk-yellow text-black">
          <div class="text-center p-4">
            <div class="text-3xl mb-2">🎾</div>
            <div class="font-bold text-sm mb-1 truncate" title="${image.title}">${image.title}</div>
            <div class="text-xs opacity-75">by ${image.author}</div>
            <div class="text-xs text-green-800">↑ ${image.score}</div>
          </div>
        </div>
        ${container.querySelector('.absolute.inset-0') ? container.querySelector('.absolute.inset-0').outerHTML : ''}
      `;
    };
    
    img.onerror = tryFallback;
    
    // Success handler
    img.onload = () => {
      console.log('Image loaded successfully:', image.title);
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        img.style.opacity = '1';
      }, 100);
    };
    
    // Overlay with image info
    const overlay = document.createElement('div');
    overlay.className = 'absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 md:p-4';
    
    const title = document.createElement('h3');
    title.className = 'text-white font-bold text-sm md:text-base mb-1 truncate';
    title.textContent = image.title || 'GLEKK Image';
    title.title = image.title; // Tooltip
    
    const meta = document.createElement('div');
    meta.className = 'flex justify-between items-center text-xs text-gray-300';
    
    const author = document.createElement('span');
    author.className = 'truncate flex-1 mr-2';
    author.textContent = `by ${image.author || 'unknown'}`;
    
    const score = document.createElement('span');
    score.className = 'text-glekk-green flex-shrink-0';
    score.textContent = `↑ ${image.score || 0}`;
    
    meta.appendChild(author);
    meta.appendChild(score);
    overlay.appendChild(title);
    overlay.appendChild(meta);
    
    container.appendChild(img);
    container.appendChild(overlay);
    
    // Enhanced click/touch handlers
    const handleInteraction = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openLightbox(image, index);
    };
    
    container.addEventListener('click', handleInteraction);
    
    // Mobile-specific touch handling
    if (this.isMobile) {
      let touchStartTime;
      let touchMoved = false;
      
      container.addEventListener('touchstart', (e) => {
        touchStartTime = Date.now();
        touchMoved = false;
      }, { passive: true });
      
      container.addEventListener('touchmove', (e) => {
        touchMoved = true;
      }, { passive: true });
      
      container.addEventListener('touchend', (e) => {
        if (!touchMoved) {
          const touchDuration = Date.now() - touchStartTime;
          if (touchDuration < 500) {
            handleInteraction(e);
          }
        }
      });
    }
    
    return container;
  }
  
  addLoadMoreButton() {
    const existingButton = document.getElementById('load-more-btn');
    if (existingButton) {
      existingButton.remove();
    }
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'col-span-full flex justify-center mt-8';
    
    const button = document.createElement('button');
    button.id = 'load-more-btn';
    button.className = 'glekk-btn-secondary py-3 px-8 text-lg font-bold rounded-xl transition-all duration-300 hover:scale-105';
    button.textContent = `Load More GLEKKs (${this.images.length - this.currentIndex} remaining)`;
    
    const handleLoadMore = (e) => {
      e.preventDefault();
      buttonContainer.remove();
      this.renderBatch();
    };
    
    button.addEventListener('click', handleLoadMore);
    
    if (this.isMobile) {
      button.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleLoadMore(e);
      });
    }
    
    buttonContainer.appendChild(button);
    this.galleryGrid.appendChild(buttonContainer);
  }
  
  openLightbox(image, index) {
    console.log('Opening lightbox for:', image.title);
    
    const lightbox = document.createElement('div');
    lightbox.className = 'fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 lightbox-container';
    lightbox.style.touchAction = 'manipulation';
    
    const content = document.createElement('div');
    content.className = 'relative max-w-4xl max-h-full flex flex-col items-center';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'absolute -top-2 -right-2 md:-top-4 md:-right-4 z-10 text-white text-3xl md:text-4xl hover:text-glekk-green bg-black/50 rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center transition-colors';
    closeBtn.innerHTML = '×';
    closeBtn.style.touchAction = 'manipulation';
    
    const imgContainer = document.createElement('div');
    imgContainer.className = 'relative max-w-full max-h-[70vh] md:max-h-[80vh]';
    
    const img = document.createElement('img');
    img.src = image.url;
    img.className = 'max-w-full max-h-full object-contain rounded-lg';
    img.alt = image.title;
    
    const loading = document.createElement('div');
    loading.className = 'absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg';
    loading.innerHTML = '<div class="text-glekk-green text-xl">Loading...</div>';
    
    img.onload = () => loading.remove();
    img.onerror = () => {
      loading.innerHTML = '<div class="text-red-500 text-xl">Failed to load image</div>';
    };
    
    imgContainer.appendChild(loading);
    imgContainer.appendChild(img);
    
    const info = document.createElement('div');
    info.className = 'mt-4 text-center text-white max-w-full';
    info.innerHTML = `
      <h3 class="text-xl md:text-2xl font-bold mb-2 break-words">${image.title}</h3>
      <div class="flex justify-center items-center space-x-4 text-gray-300 flex-wrap">
        <span>by ${image.author}</span>
        <span class="text-glekk-green">↑ ${image.score}</span>
        ${image.permalink ? `<a href="${image.permalink}" target="_blank" rel="noopener" class="text-glekk-yellow hover:text-glekk-green transition-colors">View on Reddit</a>` : ''}
      </div>
    `;
    
    // Navigation for multiple images
    if (this.images.length > 1) {
      const nav = document.createElement('div');
      nav.className = 'flex justify-between items-center mt-4 w-full max-w-md';
      
      const prevBtn = document.createElement('button');
      prevBtn.className = 'glekk-btn-secondary px-4 py-2 text-sm';
      prevBtn.textContent = '← Previous';
      prevBtn.disabled = index === 0;
      if (prevBtn.disabled) prevBtn.className += ' opacity-50 cursor-not-allowed';
      
      const nextBtn = document.createElement('button');
      nextBtn.className = 'glekk-btn-secondary px-4 py-2 text-sm';
      nextBtn.textContent = 'Next →';
      nextBtn.disabled = index >= this.images.length - 1;
      if (nextBtn.disabled) nextBtn.className += ' opacity-50 cursor-not-allowed';
      
      const counter = document.createElement('span');
      counter.className = 'text-gray-400';
      counter.textContent = `${index + 1} / ${this.images.length}`;
      
      if (!prevBtn.disabled) {
        const prevHandler = (e) => {
          e.preventDefault();
          lightbox.remove();
          this.openLightbox(this.images[index - 1], index - 1);
        };
        prevBtn.addEventListener('click', prevHandler);
        if (this.isMobile) {
          prevBtn.addEventListener('touchend', (e) => { e.preventDefault(); prevHandler(e); });
        }
      }
      
      if (!nextBtn.disabled) {
        const nextHandler = (e) => {
          e.preventDefault();
          lightbox.remove();
          this.openLightbox(this.images[index + 1], index + 1);
        };
        nextBtn.addEventListener('click', nextHandler);
        if (this.isMobile) {
          nextBtn.addEventListener('touchend', (e) => { e.preventDefault(); nextHandler(e); });
        }
      }
      
      nav.appendChild(prevBtn);
      nav.appendChild(counter);
      nav.appendChild(nextBtn);
      info.appendChild(nav);
    }
    
    content.appendChild(closeBtn);
    content.appendChild(imgContainer);
    content.appendChild(info);
    lightbox.appendChild(content);
    
    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';
    
    const closeLightbox = () => {
      lightbox.remove();
      document.body.style.overflow = '';
    };
    
    const closeHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeLightbox();
    };
    
    closeBtn.addEventListener('click', closeHandler);
    
    if (this.isMobile) {
      closeBtn.addEventListener('touchend', closeHandler);
    }
    
    if (!this.isMobile) {
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
          closeLightbox();
        }
      });
    }
    
    const keyHandler = (e) => {
      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowLeft':
          if (index > 0) {
            lightbox.remove();
            this.openLightbox(this.images[index - 1], index - 1);
          }
          break;
        case 'ArrowRight':
          if (index < this.images.length - 1) {
            lightbox.remove();
            this.openLightbox(this.images[index + 1], index + 1);
          }
          break;
      }
    };
    
    document.addEventListener('keydown', keyHandler);
    
    const originalRemove = lightbox.remove;
    lightbox.remove = function() {
      document.removeEventListener('keydown', keyHandler);
      document.body.style.overflow = '';
      originalRemove.call(this);
    };
  }
  
  showLoading(show) {
    if (this.loadingElement) {
      this.loadingElement.style.display = show ? 'block' : 'none';
      if (show) {
        this.loadingElement.textContent = 'Loading GLEKK gallery from r/glekk...';
      }
    }
  }
}

// Initialize gallery when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing GLEKK gallery...');
  new GalleryManager();
  
  // Add mobile-specific CSS
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
  
  if (isMobile) {
    const style = document.createElement('style');
    style.textContent = `
      #gallery-grid {
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 0.5rem !important;
      }
      
      @media (min-width: 480px) {
        #gallery-grid {
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 0.75rem !important;
        }
      }
      
      .gallery-image-container {
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }
      
      .lightbox-container {
        -webkit-overflow-scrolling: touch;
      }
      
      /* Ensure images load properly on mobile */
      .gallery-image-container img {
        transform: translateZ(0);
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
      }
    `;
    document.head.appendChild(style);
  }
});