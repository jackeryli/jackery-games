// Game variables
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Game constants
const FLAP_SPEED = -5;
const GRAVITY = 0.25;
const PIPE_SPEED = 2;
const PIPE_GAP = 125;
const PIPE_SPAWN_RATE = 90; // frames

// Game state
let gameOver = false;
let score = 0;
let frames = 0;

// Bird object
const bird = {
  x: 50,
  y: canvas.height / 2,
  width: 34,
  height: 24,
  velocity: 0,

  draw: function () {
    ctx.fillStyle = "#f00"; // Red color for the bird
    ctx.beginPath();
    ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
    ctx.fill();
  },

  update: function () {
    if (gameOver) return;

    this.velocity += GRAVITY;
    this.y += this.velocity;

    // Check if bird hits the ground or ceiling
    if (
      this.y + this.height / 2 >= canvas.height ||
      this.y - this.height / 2 <= 0
    ) {
      gameOver = true;
    }
  },

  flap: function () {
    if (gameOver) return;
    this.velocity = FLAP_SPEED;
  },
};

// Pipes array
const pipes = [];

// Pipe object constructor
function Pipe() {
  this.x = canvas.width;
  this.width = 50;
  this.topHeight =
    Math.floor(Math.random() * (canvas.height - PIPE_GAP - 100)) + 50;
  this.bottomHeight = canvas.height - this.topHeight - PIPE_GAP;
  this.scored = false;

  this.draw = function () {
    // Top pipe
    ctx.fillStyle = "#0f0"; // Green color for pipes
    ctx.fillRect(this.x, 0, this.width, this.topHeight);

    // Bottom pipe
    ctx.fillRect(
      this.x,
      canvas.height - this.bottomHeight,
      this.width,
      this.bottomHeight
    );
  };

  this.update = function () {
    if (gameOver) return;

    this.x -= PIPE_SPEED;

    // Check collision with bird
    if (
      bird.x + bird.width / 2 > this.x &&
      bird.x - bird.width / 2 < this.x + this.width &&
      (bird.y - bird.height / 2 < this.topHeight ||
        bird.y + bird.height / 2 > canvas.height - this.bottomHeight)
    ) {
      gameOver = true;
    }

    // Check if bird passed the pipe
    if (!this.scored && bird.x > this.x + this.width) {
      score++;
      this.scored = true;
    }
  };
}

// Game loop
function gameLoop() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update and draw bird
  bird.update();
  bird.draw();

  // Spawn new pipes
  if (frames % PIPE_SPAWN_RATE === 0) {
    pipes.push(new Pipe());
  }

  // Update and draw pipes
  for (let i = 0; i < pipes.length; i++) {
    pipes[i].update();
    pipes[i].draw();

    // Remove pipes that are off screen
    if (pipes[i].x + pipes[i].width < 0) {
      pipes.splice(i, 1);
      i--;
    }
  }

  // Draw score
  ctx.fillStyle = "#000";
  ctx.font = "24px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);

  // Draw game over message
  if (gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "36px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 30);

    ctx.font = "24px Arial";
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);

    ctx.font = "18px Arial";
    ctx.fillText("Click to restart", canvas.width / 2, canvas.height / 2 + 50);
  }

  frames++;
  requestAnimationFrame(gameLoop);
}

// Event listeners
canvas.addEventListener("click", function () {
  if (gameOver) {
    // Reset game
    gameOver = false;
    score = 0;
    frames = 0;
    pipes.length = 0;
    bird.y = canvas.height / 2;
    bird.velocity = 0;
  } else {
    bird.flap();
  }
});

// Start the game
gameLoop();
