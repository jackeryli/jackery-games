// Game variables
let board = [];
let score = 0;
let gameOver = false;
const size = 4;

// Initialize the game
function startGame() {
  // Reset variables
  board = [];
  score = 0;
  gameOver = false;
  document.getElementById("score").textContent = "0";
  document.getElementById("game-message").classList.remove("game-over");

  // Clear the tile container
  const tileContainer = document.getElementById("tile-container");
  tileContainer.innerHTML = "";

  // Initialize the board
  for (let i = 0; i < size; i++) {
    board[i] = [];
    for (let j = 0; j < size; j++) {
      board[i][j] = 0;
    }
  }

  // Add two initial tiles
  addRandomTile();
  addRandomTile();

  // Render the board
  renderBoard();
}

// Add a random tile (2 or 4) to an empty cell
function addRandomTile() {
  if (gameOver) return;

  const emptyCells = [];

  // Find all empty cells
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (board[i][j] === 0) {
        emptyCells.push({ row: i, col: j });
      }
    }
  }

  // If there are no empty cells, return
  if (emptyCells.length === 0) return;

  // Choose a random empty cell
  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];

  // Set the value to 2 or 4 (90% chance for 2, 10% chance for 4)
  board[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;

  // Create and add the tile element
  createTileElement(
    randomCell.row,
    randomCell.col,
    board[randomCell.row][randomCell.col]
  );
}

// Create a tile element and add it to the DOM
function createTileElement(row, col, value) {
  const tileContainer = document.getElementById("tile-container");
  const tile = document.createElement("div");
  tile.className = `tile tile-${value}`;
  tile.textContent = value;
  tile.style.top = `${row * 110}px`;
  tile.style.left = `${col * 110}px`;
  tile.setAttribute("data-row", row);
  tile.setAttribute("data-col", col);
  tile.setAttribute("data-value", value);
  tileContainer.appendChild(tile);
}

// Render the board
function renderBoard() {
  const tileContainer = document.getElementById("tile-container");
  tileContainer.innerHTML = "";

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (board[i][j] !== 0) {
        createTileElement(i, j, board[i][j]);
      }
    }
  }
}

// Move tiles in a direction
function moveTiles(direction) {
  if (gameOver) return false;

  let moved = false;
  const oldBoard = JSON.parse(JSON.stringify(board));

  // Helper function to move a row or column
  function moveLineOfTiles(line) {
    // Remove zeros
    line = line.filter((val) => val !== 0);

    // Merge tiles
    for (let i = 0; i < line.length - 1; i++) {
      if (line[i] === line[i + 1]) {
        line[i] *= 2;
        line[i + 1] = 0;
        score += line[i];
      }
    }

    // Remove zeros again
    line = line.filter((val) => val !== 0);

    // Add zeros to fill the line
    while (line.length < size) {
      line.push(0);
    }

    return line;
  }

  // Move up
  if (direction === "up") {
    for (let j = 0; j < size; j++) {
      let column = [];
      for (let i = 0; i < size; i++) {
        column.push(board[i][j]);
      }

      column = moveLineOfTiles(column);

      for (let i = 0; i < size; i++) {
        board[i][j] = column[i];
      }
    }
  }
  // Move right
  else if (direction === "right") {
    for (let i = 0; i < size; i++) {
      let row = [...board[i]];
      row.reverse();

      row = moveLineOfTiles(row);
      row.reverse();

      board[i] = row;
    }
  }
  // Move down
  else if (direction === "down") {
    for (let j = 0; j < size; j++) {
      let column = [];
      for (let i = 0; i < size; i++) {
        column.push(board[i][j]);
      }

      column.reverse();
      column = moveLineOfTiles(column);
      column.reverse();

      for (let i = 0; i < size; i++) {
        board[i][j] = column[i];
      }
    }
  }
  // Move left
  else if (direction === "left") {
    for (let i = 0; i < size; i++) {
      let row = [...board[i]];

      row = moveLineOfTiles(row);

      board[i] = row;
    }
  }

  // Check if the board changed
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (board[i][j] !== oldBoard[i][j]) {
        moved = true;
      }
    }
  }

  // Update the score
  document.getElementById("score").textContent = score;

  return moved;
}

// Check if the game is over
function checkGameOver() {
  // Check if there are any empty cells
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (board[i][j] === 0) {
        return false;
      }
    }
  }

  // Check if there are any possible merges
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      // Check right
      if (j < size - 1 && board[i][j] === board[i][j + 1]) {
        return false;
      }
      // Check down
      if (i < size - 1 && board[i][j] === board[i + 1][j]) {
        return false;
      }
    }
  }

  // If we get here, the game is over
  return true;
}

// Handle keyboard input
document.addEventListener("keydown", function (event) {
  let moved = false;

  if (event.key === "ArrowUp") {
    moved = moveTiles("up");
  } else if (event.key === "ArrowRight") {
    moved = moveTiles("right");
  } else if (event.key === "ArrowDown") {
    moved = moveTiles("down");
  } else if (event.key === "ArrowLeft") {
    moved = moveTiles("left");
  }

  if (moved) {
    renderBoard();
    addRandomTile();

    // Check if the game is over
    if (checkGameOver()) {
      gameOver = true;
      document.getElementById("game-message").classList.add("game-over");
    }
  }
});

// Handle touch input for mobile devices
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

document.addEventListener("touchstart", function (event) {
  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
});

document.addEventListener("touchend", function (event) {
  touchEndX = event.changedTouches[0].clientX;
  touchEndY = event.changedTouches[0].clientY;
  handleSwipe();
});

function handleSwipe() {
  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;

  // Determine the direction of the swipe
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal swipe
    if (dx > 0) {
      // Right swipe
      if (moveTiles("right")) {
        renderBoard();
        addRandomTile();
        if (checkGameOver()) {
          gameOver = true;
          document.getElementById("game-message").classList.add("game-over");
        }
      }
    } else {
      // Left swipe
      if (moveTiles("left")) {
        renderBoard();
        addRandomTile();
        if (checkGameOver()) {
          gameOver = true;
          document.getElementById("game-message").classList.add("game-over");
        }
      }
    }
  } else {
    // Vertical swipe
    if (dy > 0) {
      // Down swipe
      if (moveTiles("down")) {
        renderBoard();
        addRandomTile();
        if (checkGameOver()) {
          gameOver = true;
          document.getElementById("game-message").classList.add("game-over");
        }
      }
    } else {
      // Up swipe
      if (moveTiles("up")) {
        renderBoard();
        addRandomTile();
        if (checkGameOver()) {
          gameOver = true;
          document.getElementById("game-message").classList.add("game-over");
        }
      }
    }
  }
}

// Start the game when the page loads
window.onload = startGame;
