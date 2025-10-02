// Flappy GLEKK Game - Mobile Enhanced with Fixed Pipe Graphics
let game = null;
let gameScene = null;

// Game Configuration
const GAME_CONFIG = {
  width: 600,
  height: 800,
  physics: {
    gravity: 1200,
    jumpVelocity: -400
  },
  pipes: {
    speed: 200,
    gap: 200,
    spawnInterval: 1800,
    width: 80
  },
  bird: {
    x: 150,
    startY: 400,
    size: 50
  },
  difficulty: {
    speedIncrease: 20,
    gapDecrease: 15,
    levelThreshold: 5
  }
};

// Game Variables
let bird, pipes, ground, scoreText, levelText, bestScoreText;
let score = 0, level = 1, bestScore = 0;
let gameStarted = false, gameOver = false;
let pipeTimer, currentPipeGap, currentPipeSpeed;

// Mobile detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

// Load best score from memory (localStorage alternative)
let bestScoreStorage = 0;

function loadBestScore() {
  try {
    // Try localStorage first
    const saved = localStorage.getItem('glekk-best-score');
    bestScore = saved ? parseInt(saved) : bestScoreStorage;
  } catch (e) {
    // Fallback to memory storage
    bestScore = bestScoreStorage;
  }
}

// Save best score to memory and localStorage if available
function saveBestScore() {
  bestScoreStorage = bestScore;
  try {
    localStorage.setItem('glekk-best-score', bestScore.toString());
  } catch (e) {
    // Ignore if localStorage is not available, use memory storage
    console.log('Using memory storage for best score');
  }
}

// Initialize game
window.startGlekkGame = function() {
  if (game) return;
  
  loadBestScore();
  
  // Adjust config for mobile
  const mobileConfig = {
    ...GAME_CONFIG,
    width: isMobile ? Math.min(window.innerWidth - 32, 400) : GAME_CONFIG.width,
    height: isMobile ? Math.min(window.innerHeight * 0.6, 500) : GAME_CONFIG.height
  };
  
  const config = {
    type: Phaser.AUTO,
    width: mobileConfig.width,
    height: mobileConfig.height,
    parent: 'phaser-container',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: mobileConfig.physics.gravity },
        debug: false
      }
    },
    scene: {
      preload: preload,
      create: create,
      update: update
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    input: {
      touch: {
        capture: true
      }
    }
  };
  
  game = new Phaser.Game(config);
};

// Destroy game
window.destroyGlekkGame = function() {
  if (game) {
    game.destroy(true);
    game = null;
    gameScene = null;
    
    // Reset game state
    gameStarted = false;
    gameOver = false;
    score = 0;
    level = 1;
  }
};

// Restart game
window.restartGlekkGame = function() {
  if (gameScene) {
    gameScene.scene.restart();
  }
};

// Preload assets
function preload() {
  gameScene = this;
  
  // Create background using cloud image with fallback
  this.load.image('cloud-bg', 'assets/cloud-bg.png');
  
  // Create fallback background
  const bgGraphics = this.add.graphics();
  bgGraphics.fillGradientStyle(0x87CEEB, 0x87CEEB, 0x98FB98, 0x98FB98, 1);
  bgGraphics.fillRect(0, 0, this.scale.width, this.scale.height);
  
  // Create bird sprite (enhanced for mobile)
  const birdSize = isMobile ? 40 : GAME_CONFIG.bird.size;
  const birdGraphics = this.add.graphics();
  
  // Draw tennis ball pattern
  birdGraphics.fillStyle(0x9ACD32);
  birdGraphics.fillCircle(birdSize/2, birdSize/2, birdSize/2);
  
  // Add tennis ball line
  birdGraphics.lineStyle(3, 0xFFFFFF);
  birdGraphics.beginPath();
  birdGraphics.arc(birdSize/2, birdSize/2, birdSize/2 - 2, 0, Math.PI, false);
  birdGraphics.strokePath();
  
  // Add border
  birdGraphics.lineStyle(2, 0xFFD700);
  birdGraphics.strokeCircle(birdSize/2, birdSize/2, birdSize/2 - 1);
  
  birdGraphics.generateTexture('bird', birdSize, birdSize);
  birdGraphics.destroy();
  
  // Create pipe sprite with SOLID FILL (fixed)
  const pipeWidth = isMobile ? 60 : GAME_CONFIG.pipes.width;
  const pipeHeight = 400;
  const pipeGraphics = this.add.graphics();
  
  // Clear any previous graphics
  pipeGraphics.clear();
  
  // Draw main pipe body with solid green fill
  pipeGraphics.fillStyle(0x228B22); // Dark green fill
  pipeGraphics.fillRect(0, 0, pipeWidth, pipeHeight);
  
  // Add lighter green gradient effect
  pipeGraphics.fillStyle(0x32CD32); // Lime green
  pipeGraphics.fillRect(2, 0, pipeWidth - 4, pipeHeight);
  
  // Add darker green edges for depth
  pipeGraphics.fillStyle(0x006400); // Dark green edges
  pipeGraphics.fillRect(0, 0, 3, pipeHeight); // Left edge
  pipeGraphics.fillRect(pipeWidth - 3, 0, 3, pipeHeight); // Right edge
  
  // Add pipe caps (top and bottom)
  pipeGraphics.fillStyle(0x006400); // Dark green for caps
  pipeGraphics.fillRect(-5, 0, pipeWidth + 10, 25); // Top cap
  pipeGraphics.fillRect(-5, pipeHeight - 25, pipeWidth + 10, 25); // Bottom cap
  
  // Add highlight on caps
  pipeGraphics.fillStyle(0x32CD32); // Light green highlight
  pipeGraphics.fillRect(-3, 3, pipeWidth + 6, 19); // Top cap highlight
  pipeGraphics.fillRect(-3, pipeHeight - 22, pipeWidth + 6, 19); // Bottom cap highlight
  
  // Generate the texture
  pipeGraphics.generateTexture('pipe', pipeWidth + 10, pipeHeight);
  pipeGraphics.destroy();
  
  // Try to load actual images if they exist
  this.load.image('bird-img', 'assets/glekkbird.png');
  
  this.load.on('loaderror', (file) => {
    console.log('Failed to load:', file.key, '- using fallback');
  });
}

// Create game objects
function create() {
  gameScene = this;
  
  // Reset game state
  score = 0;
  level = 1;
  gameStarted = false;
  gameOver = false;
  currentPipeGap = isMobile ? GAME_CONFIG.pipes.gap + 50 : GAME_CONFIG.pipes.gap; // Larger gap on mobile
  currentPipeSpeed = isMobile ? GAME_CONFIG.pipes.speed * 0.8 : GAME_CONFIG.pipes.speed; // Slower on mobile
  
  // Background with cloud image
  let bg;
  if (this.textures.exists('cloud-bg')) {
    bg = this.add.image(this.scale.width/2, this.scale.height/2, 'cloud-bg');
    
    // Calculate scale to fit the game area
    const scaleX = this.scale.width / bg.width;
    const scaleY = this.scale.height / bg.height;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale);
    bg.setTint(0xcccccc);
  } else {
    // Fallback gradient background
    bg = this.add.rectangle(this.scale.width/2, this.scale.height/2, this.scale.width, this.scale.height);
    bg.setFillStyle(0x87CEEB);
  }
  
  // Ground (adjusted for mobile)
  const groundHeight = isMobile ? 40 : 60;
  ground = this.add.rectangle(this.scale.width/2, this.scale.height - groundHeight/2, this.scale.width, groundHeight, 0x8B4513);
  this.physics.add.existing(ground, true);
  
  // Create bird (adjusted for mobile)
  const birdTexture = this.textures.exists('bird-img') ? 'bird-img' : 'bird';
  const birdSize = isMobile ? 40 : GAME_CONFIG.bird.size;
  const birdX = isMobile ? this.scale.width * 0.2 : GAME_CONFIG.bird.x;
  const birdY = this.scale.height / 2;
  
  bird = this.physics.add.sprite(birdX, birdY, birdTexture);
  
  if (birdTexture === 'bird-img') {
    bird.setScale(birdSize / bird.width);
  }
  
  bird.setCollideWorldBounds(true);
  bird.body.setSize(birdSize * 0.8, birdSize * 0.8);
  
  // Create pipes group
  pipes = this.physics.add.group();
  
  // UI Text (adjusted for mobile)
  const fontSize = isMobile ? 18 : 24;
  const smallFontSize = isMobile ? 14 : 20;
  
  scoreText = this.add.text(15, 15, 'Score: 0', {
    fontSize: `${fontSize}px`,
    fill: '#fff',
    fontFamily: 'Arial',
    stroke: '#000',
    strokeThickness: 3
  });
  
  levelText = this.add.text(15, 15 + fontSize + 5, 'Level: 1', {
    fontSize: `${smallFontSize}px`,
    fill: '#9ACD32',
    fontFamily: 'Arial',
    stroke: '#000',
    strokeThickness: 3
  });
  
  bestScoreText = this.add.text(15, 15 + fontSize + smallFontSize + 10, `Best: ${bestScore}`, {
    fontSize: `${smallFontSize - 2}px`,
    fill: '#FFD700',
    fontFamily: 'Arial',
    stroke: '#000',
    strokeThickness: 2
  });
  
  // Instructions (mobile-optimized)
  const instructionFontSize = isMobile ? 16 : 20;
  const instructions = this.add.text(this.scale.width/2, this.scale.height/2 + (isMobile ? 60 : 100), 
    isMobile ? 'Tap to Start!\nTap to Flap' : 'Click or Press SPACE to Start!\nClick/Space to Flap', {
    fontSize: `${instructionFontSize}px`,
    fill: '#fff',
    align: 'center',
    fontFamily: 'Arial',
    stroke: '#000',
    strokeThickness: 4
  }).setOrigin(0.5);
  
  // Enhanced input handlers for mobile
  this.input.on('pointerdown', handleInput);
  
  // Touch-specific handling
  this.input.addPointer(2); // Allow multi-touch
  
  if (!isMobile) {
    // Keyboard only on desktop
    this.input.keyboard.on('keydown-SPACE', handleInput);
  }
  
  // Collisions
  this.physics.add.collider(bird, ground, gameOverHandler);
  this.physics.add.collider(bird, pipes, gameOverHandler);
  
  // Start pipe spawning timer (but don't spawn until game starts)
  const spawnInterval = isMobile ? GAME_CONFIG.pipes.spawnInterval + 500 : GAME_CONFIG.pipes.spawnInterval;
  pipeTimer = this.time.addEvent({
    delay: spawnInterval,
    callback: spawnPipes,
    callbackScope: this,
    loop: true,
    paused: true
  });
  
  // Hide instructions after first input
  this.firstInput = () => {
    instructions.destroy();
    gameStarted = true;
    pipeTimer.paused = false;
    this.firstInput = null;
  };
}

function handleInput(pointer) {
  if (gameOver) return;
  
  // Prevent event bubbling on mobile
  if (pointer && pointer.event) {
    pointer.event.preventDefault();
    pointer.event.stopPropagation();
  }
  
  if (!gameStarted && gameScene.firstInput) {
    gameScene.firstInput();
  }
  
  if (gameStarted) {
    bird.setVelocityY(GAME_CONFIG.physics.jumpVelocity);
    
    // Add rotation effect
    bird.setRotation(-0.3);
    gameScene.tweens.add({
      targets: bird,
      rotation: 0.5,
      duration: 500,
      ease: 'Power2'
    });
  }
}

function spawnPipes() {
  if (!gameStarted || gameOver) return;
  
  const pipeWidth = isMobile ? 60 : GAME_CONFIG.pipes.width;
  const gapY = Phaser.Math.Between(100, gameScene.scale.height - currentPipeGap - 100);
  
  // Top pipe
  const topPipe = pipes.create(gameScene.scale.width, gapY - currentPipeGap/2 - 200, 'pipe');
  topPipe.body.allowGravity = false;
  topPipe.setVelocityX(-currentPipeSpeed);
  topPipe.setOrigin(0, 1);
  topPipe.scored = false;
  
  // Bottom pipe
  const bottomPipe = pipes.create(gameScene.scale.width, gapY + currentPipeGap/2, 'pipe');
  bottomPipe.body.allowGravity = false;
  bottomPipe.setVelocityX(-currentPipeSpeed);
  bottomPipe.setOrigin(0, 0);
  bottomPipe.scored = false;
}

function update() {
  if (gameOver || !gameStarted) return;
  
  // Check for scoring
  pipes.children.entries.forEach(pipe => {
    if (!pipe.scored && pipe.x + pipe.width < bird.x) {
      pipe.scored = true;
      score += 0.5; // Each pair of pipes gives 1 point
      
      if (Number.isInteger(score)) {
        scoreText.setText(`Score: ${Math.floor(score)}`);
        
        // Level up every 5 points (or 3 on mobile for faster progression)
        const levelThreshold = isMobile ? 3 : GAME_CONFIG.difficulty.levelThreshold;
        if (score % levelThreshold === 0) {
          levelUp();
        }
      }
    }
    
    // Remove pipes that are off screen
    const pipeWidth = isMobile ? 60 : GAME_CONFIG.pipes.width;
    if (pipe.x < -pipeWidth) {
      pipe.destroy();
    }
  });
  
  // Check if bird hits ceiling
  if (bird.y < 0) {
    gameOverHandler();
  }
}

function levelUp() {
  level++;
  levelText.setText(`Level: ${level}`);
  
  // Increase difficulty (slower progression on mobile)
  const speedIncrease = isMobile ? GAME_CONFIG.difficulty.speedIncrease * 0.7 : GAME_CONFIG.difficulty.speedIncrease;
  const gapDecrease = isMobile ? GAME_CONFIG.difficulty.gapDecrease * 0.5 : GAME_CONFIG.difficulty.gapDecrease;
  
  currentPipeSpeed += speedIncrease;
  currentPipeGap = Math.max(isMobile ? 160 : 120, currentPipeGap - gapDecrease);
  
  // Update existing pipes speed
  pipes.children.entries.forEach(pipe => {
    pipe.setVelocityX(-currentPipeSpeed);
  });
  
  // Visual feedback for level up
  gameScene.cameras.main.flash(200, 154, 205, 50);
}

function gameOverHandler() {
  if (gameOver) return;
  
  gameOver = true;
  gameStarted = false;
  
  // Stop bird physics
  bird.setVelocityY(0);
  bird.setVelocityX(0);
  bird.body.allowGravity = false;
  
  // Stop pipes
  pipes.children.entries.forEach(pipe => {
    pipe.setVelocityX(0);
  });
  
  // Stop pipe spawning
  pipeTimer.paused = true;
  
  // Update best score
  const finalScore = Math.floor(score);
  if (finalScore > bestScore) {
    bestScore = finalScore;
    saveBestScore();
    bestScoreText.setText(`Best: ${bestScore}`);
  }
  
  // Show game over overlay with delay for mobile
  const delay = isMobile ? 500 : 300;
  setTimeout(() => {
    showGameOverOverlay(finalScore);
  }, delay);
  
  // Screen shake effect (reduced on mobile)
  gameScene.cameras.main.shake(isMobile ? 300 : 500, isMobile ? 0.01 : 0.02);
}

function showGameOverOverlay(finalScore) {
  const overlay = document.getElementById('game-overlay');
  const title = document.getElementById('overlay-title');
  const subtitle = document.getElementById('overlay-subtitle');
  const restartBtn = document.getElementById('restart-game-btn');
  
  if (!overlay || !title || !subtitle || !restartBtn) {
    console.error('Game overlay elements not found');
    return;
  }
  
  title.textContent = finalScore > bestScore ? 'New Best Score!' : 'Game Over!';
  subtitle.textContent = `Score: ${finalScore} • Level: ${level} • Best: ${bestScore}`;
  
  // Ensure overlay is properly displayed
  overlay.style.display = 'flex';
  overlay.style.zIndex = '100';
  overlay.classList.remove('hidden');
  
  // Ensure buttons are interactive on mobile
  if (isMobile) {
    overlay.style.touchAction = 'manipulation';
    restartBtn.style.touchAction = 'manipulation';
    restartBtn.style.pointerEvents = 'auto';
    restartBtn.style.position = 'relative';
    restartBtn.style.zIndex = '101';
    
    // Add visual feedback for mobile tap
    let restartTouchStart = false;
    
    const handleRestartTouchStart = (e) => {
      e.preventDefault();
      e.stopPropagation();
      restartTouchStart = true;
      restartBtn.style.transform = 'scale(0.95)';
      restartBtn.style.opacity = '0.8';
    };
    
    const handleRestartTouchEnd = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      restartBtn.style.transform = 'scale(1)';
      restartBtn.style.opacity = '1';
      
      if (restartTouchStart) {
        restartTouchStart = false;
        
        // Hide overlay and restart game
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
        
        if (window.restartGlekkGame) {
          setTimeout(() => {
            window.restartGlekkGame();
          }, 100);
        }
      }
    };
    
    const handleRestartTouchCancel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      restartTouchStart = false;
      restartBtn.style.transform = 'scale(1)';
      restartBtn.style.opacity = '1';
    };
    
    // Remove existing listeners to prevent duplicates
    restartBtn.removeEventListener('touchstart', handleRestartTouchStart);
    restartBtn.removeEventListener('touchend', handleRestartTouchEnd);
    restartBtn.removeEventListener('touchcancel', handleRestartTouchCancel);
    
    // Add fresh listeners
    restartBtn.addEventListener('touchstart', handleRestartTouchStart, { passive: false });
    restartBtn.addEventListener('touchend', handleRestartTouchEnd, { passive: false });
    restartBtn.addEventListener('touchcancel', handleRestartTouchCancel, { passive: false });
  }
  
  // Focus management for accessibility
  if (!isMobile) {
    setTimeout(() => {
      restartBtn.focus();
    }, 100);
  }
}

// Make game functions globally available
window.GLEKK_GAME = {
  start: window.startGlekkGame,
  destroy: window.destroyGlekkGame,
  restart: window.restartGlekkGame,
  getScore: () => Math.floor(score),
  getLevel: () => level,
  getBestScore: () => bestScore,
  isMobile: isMobile
};

// Debug logging
console.log('GLEKK Game loaded:', {
  isMobile: isMobile,
  screenSize: `${window.innerWidth}x${window.innerHeight}`,
  gameSize: isMobile ? 
    `${Math.min(window.innerWidth - 32, 400)}x${Math.min(window.innerHeight * 0.6, 500)}` : 
    `${GAME_CONFIG.width}x${GAME_CONFIG.height}`
});