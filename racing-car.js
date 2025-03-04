// Game variables
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");

// Game settings
const roadWidth = 300;
const roadMarginLeft = (canvas.width - roadWidth) / 2;
const laneWidth = roadWidth / 3;
const carWidth = 40;
const carHeight = 70;
const obstacleWidth = 40;
const obstacleHeight = 70;
const roadLineHeight = 50;
const roadLineGap = 30;
const roadSpeed = 5;

// Game state
let score = 0;
let gameOver = false;
let roadOffset = 0;
let obstacles = [];
let lastObstacleTime = 0;

// Player car
const playerCar = {
  x: canvas.width / 2 - carWidth / 2,
  y: canvas.height - 100,
  lane: 1, // 0: left, 1: center, 2: right
  speed: 5,
  color: "red",
};

// Controls
const keys = {
  ArrowLeft: false,
  ArrowRight: false,
};

// Event listeners
document.addEventListener("keydown", (e) => {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = true;
  }

  // Restart game on Enter if game over
  if (gameOver && e.key === "Enter") {
    resetGame();
  }
});

document.addEventListener("keyup", (e) => {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = false;
  }
});

// Game functions
function resetGame() {
  score = 0;
  gameOver = false;
  obstacles = [];
  lastObstacleTime = 0;
  playerCar.lane = 1;
  playerCar.x = canvas.width / 2 - carWidth / 2;
  updateScore();
}

function updateScore() {
  scoreElement.textContent = `Score: ${score}`;
}

function drawRoad() {
  // Draw road
  ctx.fillStyle = "#555";
  ctx.fillRect(roadMarginLeft, 0, roadWidth, canvas.height);

  // Draw road lines
  ctx.fillStyle = "white";
  for (
    let i = -roadLineHeight;
    i < canvas.height;
    i += roadLineHeight + roadLineGap
  ) {
    // Left lane divider
    ctx.fillRect(
      roadMarginLeft + laneWidth - 5,
      i + roadOffset,
      10,
      roadLineHeight
    );

    // Right lane divider
    ctx.fillRect(
      roadMarginLeft + 2 * laneWidth - 5,
      i + roadOffset,
      10,
      roadLineHeight
    );
  }

  // Update road animation
  roadOffset = (roadOffset + roadSpeed) % (roadLineHeight + roadLineGap);
}

function drawCar(car) {
  ctx.fillStyle = car.color;

  // Car body
  ctx.fillRect(car.x, car.y, carWidth, carHeight);

  // Car details (windows, etc.)
  ctx.fillStyle = "#222";
  ctx.fillRect(car.x + 5, car.y + 5, carWidth - 10, 15);
  ctx.fillRect(car.x + 5, car.y + 45, carWidth - 10, 15);

  // Wheels
  ctx.fillStyle = "black";
  ctx.fillRect(car.x - 5, car.y + 10, 5, 15);
  ctx.fillRect(car.x - 5, car.y + carHeight - 25, 5, 15);
  ctx.fillRect(car.x + carWidth, car.y + 10, 5, 15);
  ctx.fillRect(car.x + carWidth, car.y + carHeight - 25, 5, 15);
}

function createObstacle() {
  const lane = Math.floor(Math.random() * 3);
  const x = roadMarginLeft + lane * laneWidth + (laneWidth - obstacleWidth) / 2;

  obstacles.push({
    x: x,
    y: -obstacleHeight,
    lane: lane,
    color: getRandomColor(),
  });
}

function getRandomColor() {
  const colors = ["blue", "green", "yellow", "purple", "orange"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function updateObstacles() {
  const currentTime = Date.now();

  // Create new obstacles
  if (currentTime - lastObstacleTime > 1500) {
    createObstacle();
    lastObstacleTime = currentTime;
  }

  // Update obstacle positions
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].y += roadSpeed;

    // Remove obstacles that are off screen
    if (obstacles[i].y > canvas.height) {
      obstacles.splice(i, 1);
      score += 10;
      updateScore();
    }
  }
}

function checkCollisions() {
  for (const obstacle of obstacles) {
    if (
      playerCar.x < obstacle.x + obstacleWidth &&
      playerCar.x + carWidth > obstacle.x &&
      playerCar.y < obstacle.y + obstacleHeight &&
      playerCar.y + carHeight > obstacle.y
    ) {
      gameOver = true;
    }
  }
}

function updatePlayerCar() {
  // Handle lane changes
  if (keys.ArrowLeft && playerCar.lane > 0) {
    playerCar.lane--;
    keys.ArrowLeft = false;
  } else if (keys.ArrowRight && playerCar.lane < 2) {
    playerCar.lane++;
    keys.ArrowRight = false;
  }

  // Calculate target X position based on lane
  const targetX =
    roadMarginLeft + playerCar.lane * laneWidth + (laneWidth - carWidth) / 2;

  // Smoothly move car to target position
  if (playerCar.x < targetX) {
    playerCar.x = Math.min(playerCar.x + playerCar.speed, targetX);
  } else if (playerCar.x > targetX) {
    playerCar.x = Math.max(playerCar.x - playerCar.speed, targetX);
  }
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "30px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 30);
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
  ctx.fillText(
    "Press ENTER to restart",
    canvas.width / 2,
    canvas.height / 2 + 50
  );
}

function gameLoop() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw road
  drawRoad();

  if (!gameOver) {
    // Update game state
    updatePlayerCar();
    updateObstacles();
    checkCollisions();

    // Draw obstacles
    obstacles.forEach((obstacle) => drawCar(obstacle));
  }

  // Draw player car
  drawCar(playerCar);

  // Draw game over screen if game is over
  if (gameOver) {
    drawGameOver();
  }

  // Continue game loop
  requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
