const GRID_SIZE = 5;
const PLAYER_BLUE = 'blue';
const PLAYER_RED = 'red';

let gameState = {
    started: false,
    grid: [],
    blueSnake: [],
    redSnake: [],
    currentPlayer: PLAYER_BLUE,
    blueHead: null,
    redHead: null,
    difficulty: 'easy'
};

const startBtn = document.getElementById('startBtn');
const controls = document.getElementById('controls');
const message = document.getElementById('message');
const gridEl = document.getElementById('grid');
const linesEl = document.getElementById('lines');

initGrid();

startBtn.addEventListener('click', startGame);

function initGrid() {
    gridEl.innerHTML = '';
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', () => handleCellClick(row, col));
            gridEl.appendChild(cell);
        }
    }
}

function startGame() {
    const selectedLevel = document.querySelector('input[name="level"]:checked').value;
    gameState.difficulty = selectedLevel;
    
    controls.style.display = 'none';
    startBtn.style.display = 'none';
    message.textContent = '';
    
    gameState.started = true;
    gameState.grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    gameState.blueSnake = [[1, 1]];
    gameState.redSnake = [[3, 3]];
    gameState.blueHead = [1, 1];
    gameState.redHead = [3, 3];
    gameState.currentPlayer = PLAYER_BLUE;
    
    gameState.grid[1][1] = PLAYER_BLUE;
    gameState.grid[3][3] = PLAYER_RED;
    
    linesEl.innerHTML = '';
    renderGrid();
}

function renderGrid() {
    const cells = gridEl.querySelectorAll('.cell');
    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const value = gameState.grid[row][col];
        
        cell.className = 'cell';
        if (value === PLAYER_BLUE) {
            if (row === gameState.blueHead[0] && col === gameState.blueHead[1]) {
                cell.classList.add('blue-head');
            } else {
                cell.classList.add('blue');
            }
        } else if (value === PLAYER_RED) {
            if (row === gameState.redHead[0] && col === gameState.redHead[1]) {
                cell.classList.add('red-head');
            } else {
                cell.classList.add('red');
            }
        }
    });
}

function handleCellClick(row, col) {
    if (!gameState.started || gameState.currentPlayer !== PLAYER_BLUE) return;
    
    if (isValidMove(row, col, PLAYER_BLUE)) {
        makeMove(row, col, PLAYER_BLUE);
        
        if (checkGameOver(PLAYER_RED)) {
            endGame(PLAYER_BLUE);
            return;
        }
        
        gameState.currentPlayer = PLAYER_RED;
        setTimeout(computerMove, 500);
    }
}

function isValidMove(row, col, player) {
    const head = player === PLAYER_BLUE ? gameState.blueHead : gameState.redHead;
    
    const rowDiff = Math.abs(row - head[0]);
    const colDiff = Math.abs(col - head[1]);
    if (!((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1))) {
        return false;
    }
    
    if (gameState.grid[row][col] !== null) {
        return false;
    }
    
    return true;
}

function makeMove(row, col, player) {
    const oldHead = player === PLAYER_BLUE ? gameState.blueHead : gameState.redHead;
    
    gameState.grid[row][col] = player;
    
    if (player === PLAYER_BLUE) {
        gameState.blueSnake.push([row, col]);
        gameState.blueHead = [row, col];
    } else {
        gameState.redSnake.push([row, col]);
        gameState.redHead = [row, col];
    }
    
    drawLine(oldHead[0], oldHead[1], row, col, player);
    
    renderGrid();
}

function drawLine(row1, col1, row2, col2, player) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    
    const x1 = col1 * 50 + 25;
    const y1 = row1 * 50 + 25;
    const x2 = col2 * 50 + 25;
    const y2 = row2 * 50 + 25;
    
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', player === PLAYER_BLUE ? '#4A90E2' : '#E24A4A');
    line.setAttribute('stroke-width', '3');
    
    linesEl.appendChild(line);
}

function getValidMoves(player) {
    const head = player === PLAYER_BLUE ? gameState.blueHead : gameState.redHead;
    const moves = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    for (const [dr, dc] of directions) {
        const newRow = head[0] + dr;
        const newCol = head[1] + dc;
        
        if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
            if (gameState.grid[newRow][newCol] === null) {
                moves.push([newRow, newCol]);
            }
        }
    }
    
    return moves;
}

function evaluatePosition() {
    const redMoves = getValidMoves(PLAYER_RED).length;
    const blueMoves = getValidMoves(PLAYER_BLUE).length;
    
    if (redMoves === 0) return -1000;
    if (blueMoves === 0) return 1000;
    
    const mobilityScore = (redMoves - blueMoves) * 10;
    
    const redTerritory = countAccessibleCells(PLAYER_RED);
    const blueTerritory = countAccessibleCells(PLAYER_BLUE);
    const territoryScore = (redTerritory - blueTerritory) * 5;
    
    return mobilityScore + territoryScore;
}

function countAccessibleCells(player) {
    const head = player === PLAYER_BLUE ? gameState.blueHead : gameState.redHead;
    const visited = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
    const queue = [[head[0], head[1]]];
    visited[head[0]][head[1]] = true;
    let count = 0;
    
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    while (queue.length > 0) {
        const [row, col] = queue.shift();
        count++;
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE &&
                !visited[newRow][newCol] && gameState.grid[newRow][newCol] === null) {
                visited[newRow][newCol] = true;
                queue.push([newRow, newCol]);
            }
        }
    }
    
    return count;
}

function minimax(depth, isMaximizing) {
    const redMoves = getValidMoves(PLAYER_RED);
    const blueMoves = getValidMoves(PLAYER_BLUE);
    
    if (redMoves.length === 0) return -1000;
    if (blueMoves.length === 0) return 1000;
    if (depth === 0) return evaluatePosition();
    
    if (isMaximizing) {
        let maxEval = -Infinity;
        
        for (const move of redMoves) {
            const state = saveState();
            simulateMove(move[0], move[1], PLAYER_RED);
            
            const evaluation = minimax(depth - 1, false);
            maxEval = Math.max(maxEval, evaluation);
            
            restoreState(state);
        }
        
        return maxEval;
    } else {
        let minEval = Infinity;
        
        for (const move of blueMoves) {
            const state = saveState();
            simulateMove(move[0], move[1], PLAYER_BLUE);
            
            const evaluation = minimax(depth - 1, true);
            minEval = Math.min(minEval, evaluation);
            
            restoreState(state);
        }
        
        return minEval;
    }
}

function alphaBeta(depth, alpha, beta, isMaximizing) {
    const redMoves = getValidMoves(PLAYER_RED);
    const blueMoves = getValidMoves(PLAYER_BLUE);
    
    if (redMoves.length === 0) return -1000;
    if (blueMoves.length === 0) return 1000;
    if (depth === 0) return evaluatePosition();
    
    if (isMaximizing) {
        let maxEval = -Infinity;
        
        for (const move of redMoves) {
            const state = saveState();
            simulateMove(move[0], move[1], PLAYER_RED);
            
            const evaluation = alphaBeta(depth - 1, alpha, beta, false);
            maxEval = Math.max(maxEval, evaluation);
            alpha = Math.max(alpha, evaluation);
            
            restoreState(state);
            
            if (beta <= alpha) break;
        }
        
        return maxEval;
    } else {
        let minEval = Infinity;
        
        for (const move of blueMoves) {
            const state = saveState();
            simulateMove(move[0], move[1], PLAYER_BLUE);
            
            const evaluation = alphaBeta(depth - 1, alpha, beta, true);
            minEval = Math.min(minEval, evaluation);
            beta = Math.min(beta, evaluation);
            
            restoreState(state);
            
            if (beta <= alpha) break;
        }
        
        return minEval;
    }
}

function saveState() {
    return {
        grid: gameState.grid.map(row => [...row]),
        blueSnake: gameState.blueSnake.map(pos => [...pos]),
        redSnake: gameState.redSnake.map(pos => [...pos]),
        blueHead: [...gameState.blueHead],
        redHead: [...gameState.redHead]
    };
}

function restoreState(state) {
    gameState.grid = state.grid;
    gameState.blueSnake = state.blueSnake;
    gameState.redSnake = state.redSnake;
    gameState.blueHead = state.blueHead;
    gameState.redHead = state.redHead;
}

function simulateMove(row, col, player) {
    gameState.grid[row][col] = player;
    
    if (player === PLAYER_BLUE) {
        gameState.blueSnake.push([row, col]);
        gameState.blueHead = [row, col];
    } else {
        gameState.redSnake.push([row, col]);
        gameState.redHead = [row, col];
    }
}

function computerMove() {
    const validMoves = getValidMoves(PLAYER_RED);
    
    if (validMoves.length === 0) {
        endGame(PLAYER_BLUE);
        return;
    }
    
    let chosenMove;
    
    if (gameState.difficulty === 'easy') {
        chosenMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        
    } else if (gameState.difficulty === 'medium') {
        let bestScore = -Infinity;
        const depth = 5;
        
        for (const move of validMoves) {
            const state = saveState();
            simulateMove(move[0], move[1], PLAYER_RED);
            
            const score = minimax(depth, false);
            
            restoreState(state);
            
            if (score > bestScore) {
                bestScore = score;
                chosenMove = move;
            }
        }
        
    } else {
        let bestScore = -Infinity;
        const depth = 8;
        
        for (const move of validMoves) {
            const state = saveState();
            simulateMove(move[0], move[1], PLAYER_RED);
            
            const score = alphaBeta(depth, -Infinity, Infinity, false);
            
            restoreState(state);
            
            if (score > bestScore) {
                bestScore = score;
                chosenMove = move;
            }
        }
    }
    
    makeMove(chosenMove[0], chosenMove[1], PLAYER_RED);
    
    if (checkGameOver(PLAYER_BLUE)) {
        endGame(PLAYER_RED);
        return;
    }
    
    gameState.currentPlayer = PLAYER_BLUE;
}

function checkGameOver(player) {
    return getValidMoves(player).length === 0;
}

function endGame(winner) {
    gameState.started = false;
    
    if (winner === PLAYER_BLUE) {
        message.textContent = 'You Won!';
        message.className = 'win';
    } else {
        message.textContent = 'You Lost!';
        message.className = 'lose';
    }
    
    controls.style.display = 'flex';
    startBtn.style.display = 'block';
}
