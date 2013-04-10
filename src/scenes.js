
// Shuffle the doors
function shuffle(o){
  for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
};

function withinGameBound(x, y) {
  return (x >= 0 && x < Game.config.map.width &&
          y >= 0 && y < Game.config.map.height);
}

/**
 * Loading Scene in the Game
 */
Crafty.scene('Loading', function() {
  console.log('Start Loading');
  var loadingText = Crafty.e("2D, DOM, Text")
      .attr({w: 500, h: 20, x: ((Crafty.viewport.width) / 2), y: (Crafty.viewport.height / 2), z: 2})
      .text('Loading ...')
      .textColor('#000')
      .textFont({'size' : '24px', 'family': 'Arial'});

  // var assets = [];

  // Crafty.load(assets, function() {
  //   console.log('Game Assets Loaded');
  // });
  Crafty.e('Player, Persist').attr({alpha:0});
  Crafty.scene('StartSplash');
}, function() {

});



/**
 * Start Splash Scene
 */

var blackFun;
Crafty.scene('StartSplash', function() {
  Crafty.background('rgb(0,0,0)');
  var StartText = Crafty.e("2D, Canvas, Text")
      .attr({
        w: 100,
        h: 20,
        x: (Crafty.viewport.width / 3),
        y: (Crafty.viewport.height / 2),
        z: 2
      })
      .text('Press any key to start game')
      .textColor('#FFFFFF')
      .textFont({'size' : '24px', 'family': 'Arial'});

  var blackout = Crafty.e('Blackout');
  blackFun = function() {
    Crafty.trigger('blackOut');
  };

  Crafty.bind('KeyDown', blackFun);
}, function() {
  Crafty.unbind('KeyDown', blackFun);
});


// Introduction Scene
Crafty.scene('Intro', function () {
  var self = this;
  var input;
  var frameNum = 0;
  var frames = [
    {text: 'What is your name ?', next:1, wordFun: function (word) {
      Crafty('Player, Persist').setName(word);
    }}
  ];

  Crafty.e('Textfield')
      .attr({
        x: Game.config.canvasWidth / 3,
        y: Game.config.canvasHeight / 3,
        w: 10,
        h: 10
      })
      .setMode(false)
      .bind('ChangeFrame', function () {
        if (frameNum >= frames.length) {
          Crafty.scene('GameMain');
        } else {
          this.setWord(frames[frameNum].text);
        }
      });

  Crafty.e('Textfield')
        .attr({
          x: Game.config.canvasWidth / 3,
          y: Game.config.canvasHeight / 3 + 25,
          w: 10,
          h: 10
        })
        .setMode(true)
        .bind('KeyDown', function (e) {
          if (e.keyCode === Crafty.keys.ENTER) {
            input = this.getWord();
            if (frames[frameNum].wordFun) {
              frames[frameNum].wordFun(input);
            }
            frameNum = frames[frameNum].next;
            Crafty.trigger('ChangeFrame', frameNum);
          }
        });

  Crafty.trigger('ChangeFrame');

}, function () {

});




function isIn(pos, arr) {
  for (var i = 0; i < arr.length; i++) {
    if (pos.x === arr[i].x && pos.y === arr[i].y) {
      return true;
    }
  }
  return false;
}

var connectDoors = function (floor) {
  var floors = Game.config.floor;
  var doors = [];
  var i, j;
  var count = 0;

  // Scan all door positions
  for (i = 0; i < Game.config.map.width; i++) {
    for (j = 0; j < Game.config.map.height; j++) {
      if (floor[i][j] === floors.DOOR_CLOSED) {
        doors.push({x: i, y: j});
      }
    }
  }

  doors = shuffle(doors);

  // Do simple BFS search towards the next door and pave
  function BFSPaving (door1, door2) {
    var found = false;
    var frontier = [];
    var explored = [];
    var curr = door1;

    frontier.push({x: curr.x-1, y: curr.y, parent:curr},
                  {x: curr.x+1, y: curr.y, parent:curr},
                  {x: curr.x, y: curr.y-1, parent:curr},
                    {x: curr.x, y: curr.y+1, parent:curr});

    while (!found && frontier.length !== 0) {
      curr = frontier.shift();
      if (curr.x === door2.x && curr.y === door2.y) {
        curr = curr.parent;
        found = true;
        break;
      }

      if (!isIn(curr, explored) &&
          curr.x >= 0 && curr.x < Game.config.map.width &&
          curr.y >= 0 && curr.y < Game.config.map.height &&
          (floor[curr.x][curr.y] === floors.IMPASSABLE ||
           floor[curr.x][curr.y] === floors.ROAD)) {

        explored.push(curr);

        var choices = prioritise([{x: curr.x-1, y: curr.y, parent:curr},
                      {x: curr.x+1, y: curr.y, parent:curr},
                      {x: curr.x, y: curr.y-1, parent:curr},
                      {x: curr.x, y: curr.y+1, parent:curr}]);
        choices.map(function (e) {frontier.push(e);});
      }
    }

    // BackTracking
    if (found) {
      while (curr.parent !== undefined &&
        !(curr.x === door1.x && curr.y === door1.y)) {
        floor[curr.x][curr.y] = floors.ROAD;
        curr = curr.parent;
      }
      count++;
    }

    function prioritise(arr) {
      for (var i = 0; i < arr.length; i++) {
        var inBound = (arr[i].x >= 0 && arr[i].x < Game.config.map.width &&
                       arr[i].y >= 0 && arr[i].y < Game.config.map.height);
        if (inBound && floor[arr[i].x][arr[i].y] === floors.ROAD) {
          var temp = {x:arr[i].x,y:arr[i].y,parent:arr[i].parent};
          arr[i].x = arr[0].x;
          arr[i].y = arr[0].y;
          arr[i].parent = arr[0].parent;
          arr[0] = temp;
        }
      }
      arr = shuffle(arr);
      return arr;
    }


  }

  for(i = 0; i < doors.length-1; i++) {
    BFSPaving(doors[i], doors[i+1]);
  }
} // Connect Doors

var placeRoom = function (floor, room) {
  var floors = Game.config.floor;
  var i, j;

  // Do an initial scan, if intersect with another room
  // abandon if there's an intersection
  // The room coordinates are supposed to be within bounds
  // but I check one square more so the room don't stick together
  for (i = room.x-1; i < room.x+room.w+1; i++) {
    for (j = room.y-1; j < room.y+room.h+1; j++) {
      if (floor[i][j] && floor[i][j] !== floors.IMPASSABLE) {
        return 0;
      }
    }
  }

  var count = 0;
  var doorTop = false;
  var doorLeft = false;
  var doorRight = false;
  var doorBot = false;

  // Really put in the floor pieces now
  for (i = room.x; i < room.x+room.w; i++) {
    for (j = room.y; j < room.y+room.h; j++) {
      var atTop = j === room.y;
      var atBot = j === room.y + room.h - 1;
      var atRight = i === room.x + room.w - 1;
      var atLeft = i === room.x;
      var inExistingRoom = floor[i][j] === floors.ROOM ||
                           floor[i][j] === floors.HORT_WALL ||
                           floor[i][j] === floors.VERT_WALL;

      var inExistingCorner = floor[i][j] === floors.TOP_RIGHT_CORNER ||
                             floor[i][j] === floors.TOP_LEFT_CORNER ||
                             floor[i][j] === floors.BOT_RIGHT_CORNER ||
                             floor[i][j] === floors.BOT_LEFT_CORNER;

      if (atTop) {
        if (atRight) {
          floor[i][j] = floors.TOP_RIGHT_CORNER;
        } else if (atLeft) {
          floor[i][j] = floors.TOP_LEFT_CORNER;
        } else {
          floor[i][j] = floors.HORT_WALL;
        }
      } else if (atBot) {
        if (atRight) {
          floor[i][j] = floors.BOT_RIGHT_CORNER;
        } else if (atLeft) {
          floor[i][j] = floors.BOT_LEFT_CORNER;
        } else {
          floor[i][j] = floors.HORT_WALL;
        }
      } else {
        if (atRight) {
          floor[i][j] = floors.VERT_WALL;
        } else if (atLeft) {
          floor[i][j] = floors.VERT_WALL;
        } else {
          floor[i][j] = floors.ROOM;
        }
      }
      count++;
    }
  }
  var maxDr = Game.config.room.maxDoors;
  var minDr = Game.config.room.minDoors;
  for(var doorsLeft = Math.floor(Math.sqrt(Math.random()) * maxDr - minDr) + minDr;
    doorsLeft > 0; doorsLeft--) {
    var ranNum = Math.random();
    if (ranNum <= 0.25) { // Top wall has a door
      floor[room.x + 1 + Math.floor(Math.random() * (room.w - 2))]
           [room.y] = floors.DOOR_CLOSED;
    } else if (ranNum <= 0.5) { // Bot wall has a door
      floor[room.x + 1 + Math.floor(Math.random() * (room.w - 2))]
           [room.y + room.h - 1] = floors.DOOR_CLOSED;
    } else if (ranNum <= 0.75) { // Left wall has a door
      floor[room.x]
           [room.y + 1 + Math.floor(Math.random() * (room.h - 2))] = floors.DOOR_CLOSED;
    } else { // Right wall has a door
      floor[room.x + room.w - 1]
           [room.y + 1 + Math.floor(Math.random() * (room.h - 2))] = floors.DOOR_CLOSED;
    }
  }
  return count;
}; // placeRoom

/**
 * The main game
 */
Crafty.keys.SEMICOLON = 186;
var keyBindings;

Crafty.scene('GameMain', function () {
  Crafty.background('rgb(0,0,0)');
  var gameFloor;
  var gameEntityFloor;
  var monsters;
  var player = Crafty('Player, Persist');
  var items;
  var floors = Game.config.floor;
  var map = Game.config.map;

  var generateGameLevel = function () {
    var upPlaced = false;
    var downPlaced = false;

    // Put down impassable floors
    if (gameFloor === undefined) {
      gameFloor = [];
      for (var i = 0; i < map.width; i++) {
        gameFloor[i] = [];
        for(var j = 0; j < map.height; j++) {
          gameFloor[i][j] = Game.config.floor.IMPASSABLE;
        }
      }
    } else {
      for (var i = 0; i < map.width; i++) {
        for(var j = 0; j < map.height; j++) {
          gameFloor[i][j] = Game.config.floor.IMPASSABLE;
        }
      }
    }

    // Add in the rooms
    var floorsAdded = 0;
    var target = map.width *
                 map.height *
                 map.coverage;
    while (floorsAdded < target) {
      // Place a room and its doors
      var _h = Math.floor(Math.random()*(Game.config.room.maxHeight-Game.config.room.minHeight)+Game.config.room.minHeight);
      var _w = Math.floor(Math.random()*(Game.config.room.maxWidth-Game.config.room.minWidth)+Game.config.room.minWidth);
      var _x = 1+Math.floor(Math.random()*(map.width-_w-2));
      var _y = 1+Math.floor(Math.random()*(map.height-_h-2));
      var added = placeRoom(gameFloor, {x: _x, y: _y, w: _w, h: _h});
      floorsAdded += added;

      if (added > 0) {
        if (!upPlaced) {
          gameFloor[_x+1][_y+1] = floors.STAIRCASE_UP;
          upPlaced = true;
        } else if (!downPlaced) {
          gameFloor[_x+1][_y+1] = floors.STAIRCASE_DOWN;
          player.at(_x+1,_y+1);
          downPlaced = true;
        }
      }

    }

    // Add in the connecting roads
    connectDoors(gameFloor);
    spawnMonsters(gameFloor);
  }; // generateGameLevel

  var loadGameLevel = function () {
    if (gameEntityFloor && gameEntityFloor[0][0] && typeof gameEntityFloor[0][0] === 'object'){
      for (var i = 0; i < Game.config.map.width; i++) {
        for(var j = 0; j < Game.config.map.height; j++) {
          gameEntityFloor[i][j].destroy();
        }
      }
    }

    gameEntityFloor = [];
    for (var i = 0; i < Game.config.map.width; i++) {
      gameEntityFloor[i] = [];
      for(var j = 0; j < Game.config.map.height; j++) {
        gameEntityFloor[i][j] = Crafty.e('Tile')
                                  .attr({alpha:0})
                                  .at(i,j)
                                  .tileType(gameFloor[i][j]);
      }
    }
  }; //loadGameLevel

  var spawnMonsters = function(floor) {
    var possible = [];
    for (var i = 0; i < map.width; i++) {
      for (var j = 0; j < map.height; j++) {
        if (floor[i][j] !== floors.IMPASSABLE) {
          possible.push({x: i, y: j});
        }
      }
    }
    possible = shuffle(possible);
  }; // spawnMonsters

  var reloadGame = function (data) {
    gameEntityFloor = gameEntityFloor || [];
    gameFloor = gameFloor || [];
    for (var i = 0; i < map.width; i++) {
      gameEntityFloor[i] = gameEntityFloor[i] || [];
      gameFloor[i] = gameFloor[i] || [];
      for (var j = 0; j < map.height; j++) {
        gameEntityFloor[i][j] = gameEntityFloor[i][j] || {};
        gameFloor[i][j] = gameFloor[i][j] || floors.IMPASSABLE;
        var type = data[i][j];
        var sighted = false;
        if (type > 900) {
          type -= 999;
          sighted = true;
        }
        if (typeof gameEntityFloor[i][j].destroy === 'function') {
          gameEntityFloor[i][j].destroy();
        }
        gameEntityFloor[i][j] = Crafty.e('Tile')
                                      .at(i,j)
                                      .tileType(type);
        gameEntityFloor[i][j]._sighted = sighted;
        gameEntityFloor[i][j].attr({alpha:0}).tweenLOS(false);
        gameFloor[i][j] = type;
      }
    }
  }; // reloadGame

  var loadGame = function (cb) {
    Crafty.storage.load(player._name+'gameFloor','save',function (data) {
      reloadGame(data);
      Crafty.storage.load(player._name,'save',function(p) {
        player.destroy();
        player = p;
        updateVisibility();
        cb();
      });
    });
  };

  Crafty.storage.getAllKeys('save', function (keys) {
    var found = false;
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] === player._name) {
        loadGame(function () {
          player.attr({alpha: 1});
          updateVisibility();
        });
        found = true;
        break;
      }
    }
    if (!found) {
      generateGameLevel();
      loadGameLevel();
      player.attr({alpha:1});
      updateVisibility();
    }
  });

  var updateVisibility = function () {
    var floors = Game.config.floor;
    var visibleRange = Game.config.player.visibleRange;
    var lighted = [];

    for (var i = 0; i < visibleRange * 2 + 1; i++) {
      lighted[i] = [];
      for (var j = 0; j < visibleRange * 2 + 1; j++) {
        lighted[i][j] = 0;
      }
    }

    lighted[visibleRange][visibleRange] = visibleRange;

    // Shoot a light beam at all 4 directions
    beam(visibleRange, visibleRange, -1, 0, visibleRange, true);
    beam(visibleRange, visibleRange, 0, -1, visibleRange, true);
    beam(visibleRange, visibleRange, 1, 0, visibleRange, true);
    beam(visibleRange, visibleRange, 0, 1, visibleRange, true);

    function beam (x, y, deltaX, deltaY, stepLeft, beamTangent) {
      if (stepLeft <= 0) {
        return;
      }

      var currX = x + deltaX;
      var currY = y + deltaY;

      var currFloor = gameFloor[player.at().x - visibleRange + currX][player.at().y - visibleRange + currY];
      var parentFloor = gameFloor[player.at().x - visibleRange + x][player.at().y - visibleRange + y];

      if (!withinGameBound(currX, currY)) {
        return;
      }

      if (validParent(parentFloor, currFloor)) {
        if (lighted[currX][currY] === 0) {
          lighted[currX][currY] = lighted[x][y] - 1;
        } else {
          lighted[currX][currY] = Math.max(lighted[currX][currY], lighted[x][y] - 1);
        }

        beam(currX,currY,deltaX,deltaY,stepLeft - 1, beamTangent);

        if (beamTangent) {
          beam(currX, currY, deltaY, deltaX, stepLeft - 1, false);
          if (deltaY !== 0) {
            beam(currX, currY, -deltaY, deltaX, stepLeft - 1, false);
          } else {
            beam(currX, currY, deltaY, -deltaX, stepLeft - 1, false);
          }
        }
      } else {
        lighted[currX][currY] = -1;
      }

    }

    for (var i = 0; i < visibleRange * 2 + 1; i++) {
      for (var j = 0; j < visibleRange * 2 + 1; j++) {
        var relX = player.at().x - visibleRange + i;
        var relY = player.at().y - visibleRange + j;
        if (!withinGameBound(relX, relY)) continue;
        if (lighted[i][j] > 0) {
          gameEntityFloor[relX][relY]
          .tweenLOS(true, lighted[i][j] / (visibleRange * 2) + 0.5);
        } else {
          gameEntityFloor[relX][relY].tweenLOS(false);
        }
      }
    }

    function validParent (parent, child) {
      // Open-door can be parent for any child
      // Closed-door cannot be parent for any child
      // RoomTiles can light up any other room tiles
      // For all others, just check for same types
      var isRoomTile = function (tile) {
        return (tile === floors.HORT_WALL ||
                tile === floors.VERT_WALL ||
                tile === floors.TOP_RIGHT_CORNER ||
                tile === floors.TOP_LEFT_CORNER ||
                tile === floors.BOT_LEFT_CORNER ||
                tile === floors.BOT_RIGHT_CORNER ||
                tile === floors.CLOSED_DOOR ||
                tile === floors.ROOM ||
                tile === floors.STAIRCASE_UP ||
                tile === floors.STAIRCASE_DOWN);
      };

      if (isRoomTile(parent)) {
        return (isRoomTile(child) ||
                child === floors.DOOR_OPEN ||
                child === floors.DOOR_CLOSED) ? true : false;
      }

      switch (parent) {
        case floors.DOOR_OPEN:
          return true;
        case floors.IMPASSABLE:
        case floors.DOOR_CLOSED:
          return false;
        case floors.ROAD:
          if (child === floors.ROAD ||
              child === floors.DOOR_OPEN ||
              child === floors.DOOR_CLOSED) {
            return true;
          } else {
            return false;
          }
          break;
        default:
          if (parent === child) return true;
          return false;
      }
    }
  }; // updateVisibility


  var passible = function (x, y) {
    console.log('passible called for '+x+','+y);
    return (withinGameBound(x, y) &&
            (gameFloor[x][y] === floors.ROOM ||
            gameFloor[x][y] === floors.ROAD ||
            gameFloor[x][y] === floors.DOOR_OPEN ||
            gameFloor[x][y] === floors.STAIRCASE_UP ||
            gameFloor[x][y] === floors.STAIRCASE_DOWN));
  };

  var lastKey = Crafty.keys.ESC;
  console.log(player);

  keyBindings = this.bind('KeyDown', function (e) {

    switch (e.keyCode) {
      case Crafty.keys.UP_ARROW:
        if (lastKey === Crafty.keys.ESC &&
          passible(player.at().x,player.at().y-1)) {
          player.at(player.at().x,player.at().y-1);
        } else if (lastKey === Crafty.keys.K) {
          if (gameFloor[player.at().x][player.at().y-1] === floors.DOOR_CLOSED) {
            gameFloor[player.at().x][player.at().y-1] = floors.DOOR_OPEN;
            gameEntityFloor[player.at().x][player.at().y-1].tileType(floors.DOOR_OPEN);
          } else {
            // You kick at thin air
          }
          lastKey = Crafty.keys.ESC;
        }
        updateVisibility();
      break;
      case Crafty.keys.DOWN_ARROW:
        if (lastKey === Crafty.keys.ESC &&
          passible(player.at().x,player.at().y+1)) {
          player.at(player.at().x,player.at().y+1);
        } else if (lastKey === Crafty.keys.K) {
          if (gameFloor[player.at().x][player.at().y+1] === floors.DOOR_CLOSED) {
            gameFloor[player.at().x][player.at().y+1] = floors.DOOR_OPEN;
            gameEntityFloor[player.at().x][player.at().y+1].tileType(floors.DOOR_OPEN);
          } else {
            // You kick at thin air
          }
          lastKey = Crafty.keys.ESC;
        }
        updateVisibility();
      break;
      case Crafty.keys.LEFT_ARROW:
        if (lastKey === Crafty.keys.ESC &&
          passible(player.at().x-1,player.at().y)) {
          player.at(player.at().x-1,player.at().y);
        } else if (lastKey === Crafty.keys.K) {
          if (gameFloor[player.at().x-1][player.at().y] === floors.DOOR_CLOSED) {
            gameFloor[player.at().x-1][player.at().y] = floors.DOOR_OPEN;
            gameEntityFloor[player.at().x-1][player.at().y].tileType(floors.DOOR_OPEN);
          } else {
            // You kick at thin air
          }
          lastKey = Crafty.keys.ESC;
        }
        updateVisibility();
      break;
      case Crafty.keys.RIGHT_ARROW:
        if (passible(player.at().x+1,player.at().y)) {
          player.at(player.at().x+1,player.at().y);
        } else if (lastKey === Crafty.keys.K) {
          if (gameFloor[player.at().x+1][player.at().y] === floors.DOOR_CLOSED) {
            gameFloor[player.at().x+1][player.at().y] = floors.DOOR_OPEN;
            gameEntityFloor[player.at().x+1][player.at().y].tileType(floors.DOOR_OPEN);
          } else {
            // You kick at thin air
          };
          lastKey = Crafty.keys.ESC;
        }
        updateVisibility();
      break;
      case Crafty.keys.O: // For opening doors
      break;
      case Crafty.keys.A: // For applying items
      break;
      case Crafty.keys.C: // For closing doors or calling
      break;
      case Crafty.keys.D: // For dropping stuff
      break;
      case Crafty.keys.E: // For eating food
      break;
      case Crafty.keys.SEMICOLON: // For looking around
      break;
      case Crafty.keys.F: // For fighting and firing
      break;
      case Crafty.keys.H: // For general help
      break;
      case Crafty.keys.I: // For seeing the inventory
      break;
      case Crafty.keys.J: // For jumping
      break;
      case Crafty.keys.K: // For kicking
        lastKey = Crafty.keys.K;
        break;
      case Crafty.keys.COMMA: // For picking up stuff on ground
        if (e.shiftKey) {
          generateGameLevel();
          loadGameLevel();
          updateVisibility();
        }
      break;
      case Crafty.keys.P: // For putting on stuff other than armour
      break;
      case Crafty.keys.R: // For removing stuff that is on
      break;
      case Crafty.keys.W:
      // For wielding weapons
      // if down wth shift-key then for wearing armour
      break;
      case Crafty.keys.T:
      // For throwing stuff
      // if done with shift-key then for taking off armour
      break;
      case Crafty.keys.Q:
      // Quaffing or drinking from potions/fountains/sinks
      // If done with shift-key then its quivering a projectile
      break;
      case Crafty.keys.S:
      // Search can discover hidden doors, stuff, monsters
      // If done with shift-key then its a save, reload using name;
        if (e.shiftKey) {
          var gameFloorMod = [];
          for (var i = 0; i < gameFloor.length; i++) {
            gameFloorMod[i] = [];
            for (var j = 0; j < gameFloor[i].length; j++) {
              gameFloorMod[i][j] = gameFloor[i][j];
              if (gameEntityFloor[i][j]._sighted) {
                gameFloorMod[i][j] += 999;
              }
            }
          }
          Crafty.storage.save(player._name+'gameFloor','save',gameFloorMod);
          Crafty.storage.save(player._name,'save',player);
          console.log('Saved to '+player._name);
        }
      break;
      case Crafty.keys.L:
        if (e.shiftKey) {
          loadGame();
        }
      break;
      case Crafty.keys.Z: // Cast spells from a menu
      break;
      case Crafty.keys.U: // Untraps
      break;
      case Crafty.keys.X: // Switches main and sec weapons
      break;
      case Crafty.keys.PERIOD: // Move to next level with shift-key
        if (e.shiftKey) {
          generateGameLevel();
          loadGameLevel();
          updateVisibility();
        }
      break;
      case Crafty.keys.ESC: // Escapes the situation
        lastKey = Crafty.keys.ESC;
        break;
    }
  });
}, function () {
  Crafty.unbind('KeyDown', keyBindings);
});












// /**
//  * Start Menu Scene
//  * - Menu to start new game or load saved games
//  */
// var Scene_StartMenu_keybinds;
// Crafty.scene('StartMenuOld', function() {
//   // Opening text
//   Crafty.e('2D, DOM, Text')
//     .attr({
//       x: Game.config.canvasWidth / 2 - 125,
//       y: Game.config.canvasHeight / 3,
//       w: 250
//     })
//     .css('text-align', 'center')
//     .text('Conway Game of Life')
//     .textColor('#000000', 1)
//     .textFont({'size' : '24px', 'family': 'Arial'});

//   var mode = {
//     SINGLE: function () {Crafty.scene('GameSingle');},
//     MULTI: function () {Crafty.scene('GameMulti');}
//   };

//   var currentMode = mode.SINGLE;

//   var boxSingle = Crafty.e('Blinker, 2D, Canvas, Color, KeyBind')
//     .attr({
//       x: Game.config.canvasWidth / 2 - 75,
//       y: Game.config.canvasHeight / 2 - 25,
//       w: 150,
//       h: 50
//     })
//     .interval(7)
//     .color('rgb(1,0,0)')
//     .startBlink();

//   var boxMulti = Crafty.e('Blinker, 2D, Canvas, Color, KeyBind')
//      .attr({
//       x: Game.config.canvasWidth / 2 - 75,
//       y: Game.config.canvasHeight / 2 + 35,
//       w: 150,
//       h: 50
//     })
//     .interval(7)
//     .color('rgb(1,0,0)');

//   Scene_StartMenu_keybinds = this.bind('KeyDown', function (e) {
//       switch (e.keyCode) {
//         case Crafty.keys.UP_ARROW:
//           boxSingle.startBlink();
//           boxMulti.stopBlink();
//           currentMode = mode.SINGLE;
//           break;
//         case Crafty.keys.DOWN_ARROW:
//           boxSingle.stopBlink();
//           boxMulti.startBlink();
//           currentMode = mode.MULTI;
//           break;

//         case Crafty.keys.ENTER:
//           currentMode();
//           break;
//       }
//     });
// }, function() {
//   Crafty.unbind('KeyDown', Scene_StartMenu_keybinds);
// });


// Crafty.scene('GameSingle', function () {
//   Crafty.e('2D, DOM, Text')
//     .attr({
//       x: Game.config.canvasWidth / 2 - 125,
//       y: Game.config.canvasHeight / 3,
//       w: 250
//     })
//     .css('text-align', 'center')
//     .text('Single')
//     .textColor('#000000', 1)
//     .textFont({'size' : '24px', 'family': 'Arial'});

//   Crafty.scene('GameMain');
// }, function () {

// });


// Crafty.scene('GameMulti', function () {
//   Crafty.e('2D, DOM, Text')
//     .attr({
//       x: Game.config.canvasWidth / 2 - 125,
//       y: Game.config.canvasHeight / 3,
//       w: 250
//     })
//     .css('text-align', 'center')
//     .text('Multi')
//     .textColor('#000000', 1)
//     .textFont({'size' : '24px', 'family': 'Arial'});
// }, function () {

// });
