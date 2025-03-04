// Game variables
const gameContainer = document.getElementById("game-container");
const player = document.getElementById("player");
const healthDisplay = document.getElementById("health");
const scoreDisplay = document.getElementById("score");
const weaponDisplay = document.getElementById("weapon");
const ammoDisplay = document.getElementById("ammo");
const gameOverScreen = document.getElementById("game-over");
const finalScoreDisplay = document.getElementById("final-score");
const restartButton = document.getElementById("restart-button");

// Game settings
const gameWidth = 800;
const gameHeight = 600;
const playerSpeed = 3;
const bulletSpeed = 10;
const enemyBulletSpeed = 5;
const zombieSpeed = 0.5;
const devilSpeed = 1;
const maxEnemies = 10;
const maxObstacles = 10;
const maxWeaponBlocks = 3;

// Game state
let health = 100;
let score = 0;
let gameRunning = true;
let playerX = gameWidth / 2;
let playerY = gameHeight / 2;
let playerDirection = { x: 0, y: -1 }; // Default direction: up
let keys = {};
let bullets = [];
let enemyBullets = [];
let enemies = [];
let obstacles = [];
let weaponBlocks = [];
let lastEnemySpawn = 0;
let lastWeaponBlockSpawn = 0;
let shooting = false;
let lastShot = 0;
let spacePressed = false;

// Weapon settings
const weapons = {
  pistol: { name: "Pistol", damage: 25, fireRate: 500, ammo: 30, spread: 0.05 },
  shotgun: {
    name: "Shotgun",
    damage: 50,
    fireRate: 800,
    ammo: 20,
    spread: 0.3,
    bullets: 10,
  },
  uzi: { name: "Uzi", damage: 50, fireRate: 100, ammo: 50, spread: 0.1 },
};

// Player's weapon inventory
let weaponInventory = [{ ...weapons.pistol }];
let currentWeaponIndex = 0;
let currentWeapon = weaponInventory[currentWeaponIndex];

// Initialize the game
function init() {
  // Reset game state
  health = 100;
  score = 0;
  gameRunning = true;
  playerX = gameWidth / 2;
  playerY = gameHeight / 2;
  playerDirection = { x: 0, y: -1 }; // Default direction: up
  bullets = [];
  enemyBullets = [];
  enemies = [];
  obstacles = [];
  weaponBlocks = [];

  // Reset weapon inventory
  weaponInventory = [{ ...weapons.pistol }];
  currentWeaponIndex = 0;
  currentWeapon = weaponInventory[currentWeaponIndex];

  // Update player appearance to show direction
  updatePlayerAppearance();

  // Clear all elements
  const elementsToRemove = document.querySelectorAll(
    ".enemy, .bullet, .enemy-bullet, .block"
  );
  elementsToRemove.forEach((element) => element.remove());

  // Update displays
  updateHUD();

  // Hide game over screen
  gameOverScreen.style.display = "none";

  // Create initial obstacles
  for (let i = 0; i < maxObstacles; i++) {
    createObstacle();
  }

  // Start game loop
  requestAnimationFrame(gameLoop);
}

// Update player appearance to show direction
function updatePlayerAppearance() {
  player.style.left = playerX + "px";
  player.style.top = playerY + "px";

  // Add a visual indicator for direction
  const angle =
    (Math.atan2(playerDirection.y, playerDirection.x) * 180) / Math.PI;
  player.style.transform = `rotate(${angle}deg)`;
}

// Update HUD information
function updateHUD() {
  healthDisplay.textContent = health;
  scoreDisplay.textContent = score;
  weaponDisplay.textContent = currentWeapon.name;
  ammoDisplay.textContent = currentWeapon.ammo;
}

// Switch to the next weapon in inventory
function switchWeapon() {
  currentWeaponIndex = (currentWeaponIndex + 1) % weaponInventory.length;
  currentWeapon = weaponInventory[currentWeaponIndex];
  updateHUD();
}

// Create a new obstacle
function createObstacle() {
  const obstacle = document.createElement("div");
  obstacle.className = "block obstacle";

  // Random position (avoiding player start position)
  let x, y;
  do {
    x = Math.random() * (gameWidth - 30);
    y = Math.random() * (gameHeight - 30);
  } while (
    Math.abs(x - gameWidth / 2) < 100 &&
    Math.abs(y - gameHeight / 2) < 100
  );

  obstacle.style.left = x + "px";
  obstacle.style.top = y + "px";

  gameContainer.appendChild(obstacle);
  obstacles.push({
    element: obstacle,
    x: x,
    y: y,
    width: 30,
    height: 30,
  });
}

// Create a new weapon block
function createWeaponBlock() {
  if (weaponBlocks.length >= maxWeaponBlocks) return;

  const block = document.createElement("div");
  block.className = "block weapon-block";

  // Random position
  const x = Math.random() * (gameWidth - 30);
  const y = Math.random() * (gameHeight - 30);

  block.style.left = x + "px";
  block.style.top = y + "px";

  // Random weapon type
  const weaponTypes = ["shotgun", "uzi"];
  const weaponType =
    weaponTypes[Math.floor(Math.random() * weaponTypes.length)];

  block.style.backgroundColor = "#ff9800";

  gameContainer.appendChild(block);
  weaponBlocks.push({
    element: block,
    x: x,
    y: y,
    width: 30,
    height: 30,
    weaponType: weaponType,
  });
}

// Create a new enemy
function createEnemy() {
  if (enemies.length >= maxEnemies) return;

  const enemy = document.createElement("div");

  // Randomly choose enemy type
  const isDevil = Math.random() < 0.3; // 30% chance for devil
  enemy.className = `enemy ${isDevil ? "devil" : "zombie"}`;

  // Spawn at the edge of the screen
  let x, y;
  if (Math.random() < 0.5) {
    // Spawn on left or right edge
    x = Math.random() < 0.5 ? -30 : gameWidth;
    y = Math.random() * gameHeight;
  } else {
    // Spawn on top or bottom edge
    x = Math.random() * gameWidth;
    y = Math.random() < 0.5 ? -30 : gameHeight;
  }

  enemy.style.left = x + "px";
  enemy.style.top = y + "px";

  gameContainer.appendChild(enemy);
  enemies.push({
    element: enemy,
    x: x,
    y: y,
    width: 25,
    height: 25,
    type: isDevil ? "devil" : "zombie",
    health: isDevil ? 50 : 30,
    lastShot: 0,
  });
}

// Create a bullet
function shoot() {
  if (!gameRunning || currentWeapon.ammo <= 0) return;

  const now = Date.now();
  if (now - lastShot < currentWeapon.fireRate) return;

  lastShot = now;
  currentWeapon.ammo--;
  updateHUD();

  // For shotgun, create multiple bullets
  if (currentWeapon.name === "Shotgun") {
    for (let i = 0; i < currentWeapon.bullets; i++) {
      // Add some spread
      const spreadX =
        playerDirection.x + (Math.random() - 0.5) * currentWeapon.spread;
      const spreadY =
        playerDirection.y + (Math.random() - 0.5) * currentWeapon.spread;

      // Normalize direction
      const length = Math.sqrt(spreadX * spreadX + spreadY * spreadY);
      const normalizedX = spreadX / length;
      const normalizedY = spreadY / length;

      createBullet(
        playerX + 15,
        playerY + 15,
        playerX + 15 + normalizedX * 20,
        playerY + 15 + normalizedY * 20
      );
    }
  } else {
    // For other weapons, create a single bullet
    createBullet(
      playerX + 15,
      playerY + 15,
      playerX + 15 + playerDirection.x * 20,
      playerY + 15 + playerDirection.y * 20
    );
  }
}

// Create a bullet (for both player and enemies)
function createBullet(startX, startY, targetX, targetY, isEnemy = false) {
  const bullet = document.createElement("div");
  bullet.className = isEnemy ? "enemy-bullet" : "bullet";

  bullet.style.left = startX + "px";
  bullet.style.top = startY + "px";

  gameContainer.appendChild(bullet);

  // Calculate direction
  const dx = targetX - startX;
  const dy = targetY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Normalize direction
  const vx = dx / distance;
  const vy = dy / distance;

  const bulletObj = {
    element: bullet,
    x: startX,
    y: startY,
    vx: vx,
    vy: vy,
    damage: isEnemy ? 10 : currentWeapon.damage,
  };

  if (isEnemy) {
    enemyBullets.push(bulletObj);
  } else {
    bullets.push(bulletObj);
  }
}

// Check collision between two objects
function checkCollision(obj1, obj2) {
  return (
    obj1.x < obj2.x + obj2.width &&
    obj1.x + obj1.width > obj2.x &&
    obj1.y < obj2.y + obj2.height &&
    obj1.y + obj1.height > obj2.y
  );
}

// Game loop
function gameLoop() {
  if (!gameRunning) return;

  // Handle player movement
  if (keys["ArrowUp"] || keys["w"] || keys["W"]) {
    playerY = Math.max(0, playerY - playerSpeed);
    playerDirection = { x: 0, y: -1 };
  }
  if (keys["ArrowDown"] || keys["s"] || keys["S"]) {
    playerY = Math.min(gameHeight - 30, playerY + playerSpeed);
    playerDirection = { x: 0, y: 1 };
  }
  if (keys["ArrowLeft"] || keys["a"] || keys["A"]) {
    playerX = Math.max(0, playerX - playerSpeed);
    playerDirection = { x: -1, y: 0 };
  }
  if (keys["ArrowRight"] || keys["d"] || keys["D"]) {
    playerX = Math.min(gameWidth - 30, playerX + playerSpeed);
    playerDirection = { x: 1, y: 0 };
  }

  // Diagonal directions
  if (
    (keys["ArrowUp"] || keys["w"] || keys["W"]) &&
    (keys["ArrowRight"] || keys["d"] || keys["D"])
  ) {
    playerDirection = { x: 0.7071, y: -0.7071 }; // Normalized (1,1) vector
  }
  if (
    (keys["ArrowUp"] || keys["w"] || keys["W"]) &&
    (keys["ArrowLeft"] || keys["a"] || keys["A"])
  ) {
    playerDirection = { x: -0.7071, y: -0.7071 };
  }
  if (
    (keys["ArrowDown"] || keys["s"] || keys["S"]) &&
    (keys["ArrowRight"] || keys["d"] || keys["D"])
  ) {
    playerDirection = { x: 0.7071, y: 0.7071 };
  }
  if (
    (keys["ArrowDown"] || keys["s"] || keys["S"]) &&
    (keys["ArrowLeft"] || keys["a"] || keys["A"])
  ) {
    playerDirection = { x: -0.7071, y: 0.7071 };
  }

  // Switch weapons with Q key
  if (keys["q"] || keys["Q"]) {
    if (!keys.qPressed) {
      switchWeapon();
      keys.qPressed = true;
    }
  } else {
    keys.qPressed = false;
  }

  // Handle shooting with space bar
  if (spacePressed) {
    shoot();
  }

  // Update player position
  updatePlayerAppearance();

  // Spawn enemies
  const now = Date.now();
  if (now - lastEnemySpawn > 1000) {
    // Spawn enemy every second
    createEnemy();
    lastEnemySpawn = now;
  }

  // Spawn weapon blocks
  if (now - lastWeaponBlockSpawn > 5000) {
    // Spawn weapon block every 5 seconds
    createWeaponBlock();
    lastWeaponBlockSpawn = now;
  }

  // Move bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];

    // Move bullet
    bullet.x += bullet.vx * bulletSpeed;
    bullet.y += bullet.vy * bulletSpeed;

    // Update position
    bullet.element.style.left = bullet.x + "px";
    bullet.element.style.top = bullet.y + "px";

    // Check if bullet is out of bounds
    if (
      bullet.x < 0 ||
      bullet.x > gameWidth ||
      bullet.y < 0 ||
      bullet.y > gameHeight
    ) {
      bullet.element.remove();
      bullets.splice(i, 1);
      continue;
    }

    // Check collision with obstacles
    let hitObstacle = false;
    for (const obstacle of obstacles) {
      if (
        checkCollision(
          { x: bullet.x, y: bullet.y, width: 5, height: 5 },
          obstacle
        )
      ) {
        bullet.element.remove();
        bullets.splice(i, 1);
        hitObstacle = true;
        break;
      }
    }
    if (hitObstacle) continue;

    // Check collision with enemies
    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      if (
        checkCollision(
          { x: bullet.x, y: bullet.y, width: 5, height: 5 },
          { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height }
        )
      ) {
        // Remove bullet
        bullet.element.remove();
        bullets.splice(i, 1);

        // Damage enemy
        enemy.health -= bullet.damage;

        // Check if enemy is dead
        if (enemy.health <= 0) {
          // Remove enemy
          enemy.element.remove();
          enemies.splice(j, 1);

          // Add score
          score += enemy.type === "zombie" ? 10 : 20;
          updateHUD();
        }

        break;
      }
    }
  }

  // Move enemy bullets
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const bullet = enemyBullets[i];

    // Move bullet
    bullet.x += bullet.vx * enemyBulletSpeed;
    bullet.y += bullet.vy * enemyBulletSpeed;

    // Update position
    bullet.element.style.left = bullet.x + "px";
    bullet.element.style.top = bullet.y + "px";

    // Check if bullet is out of bounds
    if (
      bullet.x < 0 ||
      bullet.x > gameWidth ||
      bullet.y < 0 ||
      bullet.y > gameHeight
    ) {
      bullet.element.remove();
      enemyBullets.splice(i, 1);
      continue;
    }

    // Check collision with obstacles
    let hitObstacle = false;
    for (const obstacle of obstacles) {
      if (
        checkCollision(
          { x: bullet.x, y: bullet.y, width: 5, height: 5 },
          obstacle
        )
      ) {
        bullet.element.remove();
        enemyBullets.splice(i, 1);
        hitObstacle = true;
        break;
      }
    }
    if (hitObstacle) continue;

    // Check collision with player
    if (
      checkCollision(
        { x: bullet.x, y: bullet.y, width: 5, height: 5 },
        { x: playerX, y: playerY, width: 30, height: 30 }
      )
    ) {
      // Remove bullet
      bullet.element.remove();
      enemyBullets.splice(i, 1);

      // Player takes damage
      health -= bullet.damage;
      updateHUD();

      // Check if player is dead
      if (health <= 0) {
        gameOver();
      }
    }
  }

  // Move enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];

    // Calculate direction to player
    const dx = playerX - enemy.x;
    const dy = playerY - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Normalize direction
    const vx = dx / distance;
    const vy = dy / distance;

    // Move enemy
    const speed = enemy.type === "zombie" ? zombieSpeed : devilSpeed;
    enemy.x += vx * speed;
    enemy.y += vy * speed;

    // Update position
    enemy.element.style.left = enemy.x + "px";
    enemy.element.style.top = enemy.y + "px";

    // Devils can shoot
    if (enemy.type === "devil") {
      const now = Date.now();
      if (now - enemy.lastShot > 2000 && distance < 300) {
        // Shoot every 2 seconds if within range
        createBullet(
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2,
          playerX + 15,
          playerY + 15,
          true
        );
        enemy.lastShot = now;
      }
    }

    // Check collision with player
    if (
      checkCollision(
        { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height },
        { x: playerX, y: playerY, width: 30, height: 30 }
      )
    ) {
      // Player takes damage
      health -= enemy.type === "zombie" ? 1 : 2; // Zombies do 1 damage per frame, devils do 2
      updateHUD();

      // Check if player is dead
      if (health <= 0) {
        gameOver();
        break;
      }
    }
  }

  // Check collision with weapon blocks
  for (let i = weaponBlocks.length - 1; i >= 0; i--) {
    const block = weaponBlocks[i];
    if (
      checkCollision({ x: playerX, y: playerY, width: 30, height: 30 }, block)
    ) {
      // Add weapon to inventory
      const newWeapon = { ...weapons[block.weaponType] };

      // Check if player already has this weapon type
      const existingWeaponIndex = weaponInventory.findIndex(
        (w) => w.name === newWeapon.name
      );

      if (existingWeaponIndex !== -1) {
        // Add ammo to existing weapon
        weaponInventory[existingWeaponIndex].ammo += newWeapon.ammo;
      } else {
        // Add new weapon to inventory
        weaponInventory.push(newWeapon);

        // Switch to the new weapon
        currentWeaponIndex = weaponInventory.length - 1;
        currentWeapon = weaponInventory[currentWeaponIndex];
      }

      updateHUD();

      // Remove block
      block.element.remove();
      weaponBlocks.splice(i, 1);

      // Show weapon pickup message
      showMessage(`Picked up ${newWeapon.name}!`);
    }
  }

  // Continue game loop
  requestAnimationFrame(gameLoop);
}

// Show a temporary message
function showMessage(text) {
  const message = document.createElement("div");
  message.className = "message";
  message.textContent = text;
  message.style.position = "absolute";
  message.style.top = "50px";
  message.style.left = "50%";
  message.style.transform = "translateX(-50%)";
  message.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  message.style.color = "white";
  message.style.padding = "10px 20px";
  message.style.borderRadius = "5px";
  message.style.zIndex = "50";

  gameContainer.appendChild(message);

  // Remove message after 2 seconds
  setTimeout(() => {
    message.remove();
  }, 2000);
}

// Game over function
function gameOver() {
  gameRunning = false;
  finalScoreDisplay.textContent = score;
  gameOverScreen.style.display = "flex";
}

// Event listeners
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;

  // Handle space bar for shooting
  if (e.key === " " || e.code === "Space") {
    spacePressed = true;
    e.preventDefault(); // Prevent scrolling with space
  }
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;

  // Handle space bar for shooting
  if (e.key === " " || e.code === "Space") {
    spacePressed = false;
  }
});

gameContainer.addEventListener("mousedown", () => {
  shooting = true;
  shoot();
});

gameContainer.addEventListener("mouseup", () => {
  shooting = false;
});

gameContainer.addEventListener("mouseleave", () => {
  shooting = false;
});

restartButton.addEventListener("click", init);

// Start the game
init();
