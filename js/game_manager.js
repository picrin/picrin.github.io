function GameManager(size, InputManager, Actuator, ScoreManager) {
  this.size         = size; // Size of the grid
  this.inputManager = new InputManager;
  this.scoreManager = new ScoreManager;
  this.actuator     = new Actuator;

  this.startTiles   = 2;

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));

  this.setup();
}

// Restart the game
GameManager.prototype.restart = function () {
  this.actuator.continue();
  this.setup();
};

// Keep playing after winning
GameManager.prototype.keepPlaying = function () {
  this.keepPlaying = true;
  this.actuator.continue();
};

GameManager.prototype.isGameTerminated = function () {
  if (this.over || (this.won && !this.keepPlaying)) {
    return true;
  } else {
    return false;
  }
};


function reverseSublists(nestedList){
  var reversals = []
  var nexlist;
  nestedList.forEach(function (sublist){
    nextlist = [];
    reversals.push(nextlist);
    for(var i = sublist.length - 1; i >= 0; i--){
      nextlist.push(sublist[i]);
    };
  });
  return reversals;
}

// Set up the game
GameManager.prototype.setup = function () {
  this.grid               = new Grid(this.size);
  this.columnOrder        = [[2, 3, 0], [0, 1, 2], [1, 2, 3], [3, 0, 1]];
  this.rowOrder           = [[3, 0, 1], [1, 2, 3], [0, 1, 2], [2, 3, 0]];
  this.reverseColumnOrder = reverseSublists(this.columnOrder);
  //console.log(this.reverseColumnOrder);
  this.reverseRowOrder    = reverseSublists(this.rowOrder);
  this.score              = 0;
  this.over               = false;
  this.won                = false;
  this.keepPlaying        = false;

  // Add the initial tiles
  this.addStartTiles();

  // Update the actuator
  this.actuate();
};

// Set up the initial tiles to start the game with
GameManager.prototype.addStartTiles = function () {
  for (var i = 0; i < this.startTiles; i++) {
    this.addRandomTile();
  }
  //this.grid.insertTile(new Tile({x: 2, y: 1}, 1));
  //this.grid.insertTile(new Tile({x: 2, y: 3}, 2));

  //this.grid.insertTile(new Tile({x: 3, y: 1}, 2));
  //this.grid.insertTile(new Tile({x: 3, y: 3}, 2));


};

// Adds a tile in a random position
GameManager.prototype.addRandomTile = function () {
  if (this.grid.cellsAvailable()) {
    var value = Math.random() < 0.9 ? 2 : 4;
    var tile = new Tile(this.grid.randomAvailableCell(), value);

    this.grid.insertTile(tile);
  }
};

// Sends the updated grid to the actuator
GameManager.prototype.actuate = function () {
  if (this.scoreManager.get() < this.score) {
    this.scoreManager.set(this.score);
  }

  this.actuator.actuate(this.grid, {
    score:      this.score,
    over:       this.over,
    won:        this.won,
    bestScore:  this.scoreManager.get(),
    terminated: this.isGameTerminated()
  });

};

// Save all tile positions and remove merger info
GameManager.prototype.prepareTiles = function () {
  //console.log(this);
  this.grid.eachCell(function (x, y, tile) {
    if (tile) {
      tile.mergedFrom = null;
      tile.savePosition();
    }
  });
};


// Move a tile and its representation
GameManager.prototype.moveTile = function (tile, cell) {
  this.grid.cells[tile.x][tile.y] = null;
  this.grid.cells[cell.x][cell.y] = tile;
  tile.updatePosition(cell);
};

//GameManager.prototype.moveTile = function (tile, cell)
GameManager.prototype.newColumnLayout = function (x, tiles, order, swapOrNot) {
  var index = 0;
  var self = this;
  //console.log(tell, tell, tell);
  tiles.forEach(function (tile){
    //console.log(value, self.columnOrder);
    var y = order[x][index];
    self.moveTile(tile, swapOrNot(x, y));
    //self.grid.cells[x][y] = new Tile({x: x, y: y}, value);
    index++;
  });
};

// Move tiles on the grid in the specified direction
GameManager.prototype.move = function (direction) {
  var self = this;
  if (this.isGameTerminated()) return; // Don't do anything if the game's over  
  var vector = this.getVector(direction);
  var moved  = true;
  self.prepareTiles();
  var swapOrNot;

  var order;
  if (vector.y === 1){
    order = self.reverseColumnOrder;
    swapOrNot = function (x, y){return {x: x, y: y};};
  } else if (vector.y === -1) {
    order = self.columnOrder;
    swapOrNot = function (x, y){return {x: x, y: y};};
  } else if (vector.x === 1){
    order = self.reverseRowOrder;
    swapOrNot = function (x, y){return {y: x, x: y};};
  } else if (vector.x === -1){
    order = self.rowOrder;
    swapOrNot = function (x, y){return {y: x, x: y};};
  }

  //think columns, if you want to think rows, swap xs and ys in your head.
  for(var x = 0; x < 4; x++){
    var tiles  = [];
    var previous_tile = null;

    order[x].forEach(function(y){
      tile = self.grid.cellContent(swapOrNot(x, y));
      console.log(tile);
      if(tile){
        self.grid.removeTile(tile);
        if (previous_tile !== null && previous_tile.value === tile.value){
          tile.value *= 2;
          tiles.pop();
          //previous_tile.value *= 2;
          //previous_tile = null
        } else {
          previous_tile = tile;
        }
        tiles.push(tile);

      }
    });
    self.newColumnLayout(x, tiles, order, swapOrNot);  
  }
  
  // Save the current tile positions and remove merger information

  // Traverse the grid in the right direction and move tiles
  /*var xPos;
  var step;
  if (vector.x === 1){
    xPos = 4;
    step = -1;
  } else {
    xPos = -1;
    step = 1;
  }
  traversals.forEach(function (innerList) {
    xPos += step;
    innerList.forEach(function (element) {
      console.log(xPos, element);
      cell = { x: xPos, y: element };
      tile = self.grid.cellContent(cell);
      if (tile) {
        var positions = self.findFarthestPosition(cell, vector);
        var next      = self.grid.cellContent(positions.next);

        // Only one merger per row traversal?
        if (next && next.value === tile.value && !next.mergedFrom) {
          var merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];

          self.grid.insertTile(merged);
          self.grid.removeTile(tile);

          // Converge the two tiles' positions
          tile.updatePosition(positions.next);

          // Update the score
          self.score += merged.value;

          // The mighty 2048 tile
          if (merged.value === 2048) self.won = true;
        } else {
          self.moveTile(tile, positions.farthest);
        }
        if (!self.positionsEqual(cell, tile)) {
          moved = true; // The tile moved from its original cell!
        }
      }
    });
  });*/

  if (moved) {
    this.addRandomTile();
    if (!this.movesAvailable()) {
      this.over = true; // Game over!
    }
    this.actuate();
  }
};


// Get the vector representing the chosen direction
GameManager.prototype.getVector = function (direction) {
  // Vectors representing tile movement
  var map = {
    0: { x: 0,  y: -1 }, // up
    1: { x: 1,  y: 0 },  // right
    2: { x: 0,  y: 1 },  // down
    3: { x: -1, y: 0 }   // left
  };

  return map[direction];
};

GameManager.prototype.findFarthestPosition = function (cell, vector) {
  var previous;

  // Progress towards the vector direction until an obstacle is found
  do {
    previous = cell;
    cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (this.grid.withinBounds(cell) &&
           this.grid.cellAvailable(cell));

  return {
    farthest: previous,
    next: cell // Used to check if a merge is required
  };
};

GameManager.prototype.movesAvailable = function () {
  return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

// Check for available matches between tiles (more expensive check)
GameManager.prototype.tileMatchesAvailable = function () {
  var self = this;

  var tile;

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      tile = this.grid.cellContent({ x: x, y: y });

      if (tile) {
        for (var direction = 0; direction < 4; direction++) {
          var vector = self.getVector(direction);
          var cell   = { x: x + vector.x, y: y + vector.y };

          var other  = self.grid.cellContent(cell);

          if (other && other.value === tile.value) {
            return true; // These two tiles can be merged
          }
        }
      }
    }
  }

  return false;
};

GameManager.prototype.positionsEqual = function (first, second) {
  return first.x === second.x && first.y === second.y;
};
