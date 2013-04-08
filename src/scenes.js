
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
  Crafty.scene('StartSplash');
}, function() {

});



/**
 * Start Splash Scene
 */

var blackFun;
Crafty.scene('StartSplash', function() {
  var StartText = Crafty.e("2D, Canvas, Text")
      .attr({
        w: 100,
        h: 20,
        x: (Crafty.viewport.width / 3),
        y: (Crafty.viewport.height / 2),
        z: 2
      })
      .text('Press any key to start game')
      .textColor('rgb(0,0,0)')
      .textFont({'size' : '24px', 'family': 'Arial'});

  var blackout = Crafty.e('Blackout');
  blackFun = function() {
    Crafty.trigger('blackOut');
  };

  Crafty.bind('KeyDown', blackFun);
}, function() {
  Crafty.unbind('KeyDown', blackFun);
});



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

  // Shuffle the doors
  function shuffle(o){
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
  };
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
      return arr;
    }

    function isIn(pos, arr) {
      for (var i = 0; i < arr.length; i++) {
        if (curr.x === arr[i].x && curr.y === arr[i].y) {
          return true;
        }
      }
      return false;
    }
  }

  for(i = 0; i < doors.length-1; i++) {
    BFSPaving(doors[i], doors[i+1]);
  }
}

var placeRoom = function (floor, room) {
  var floors = Game.config.floor;
  var i, j;

  // Do an initial scan, if intersect with another room
  // abandon with 0.8 prob
  for (i = room.x; i < room.x+room.w; i++) {
    for (j = room.y; j < room.y+room.h; j++) {
      if (floor[i][j] !== floors.IMPASSABLE) {
        return 0;
      }
    }
  }

  var count = 0;
  var doorTop = false;
  var doorLeft = false;
  var doorRight = false;
  var doorBot = false;

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
          if (!doorTop && inExistingRoom && !inExistingCorner) {
            floor[i][j] = floors.DOOR_CLOSED;
            doorTop = true;
          } else {
            floor[i][j] = floors.HORT_WALL;
          }
        }
        count++;
      } else if (atBot) {
        if (atRight) {
          floor[i][j] = floors.BOT_RIGHT_CORNER;
        } else if (atLeft) {
          floor[i][j] = floors.BOT_LEFT_CORNER;
        } else {
          if (!doorBot && inExistingRoom && !inExistingCorner) {
            floor[i][j] = floors.DOOR_CLOSED;
            doorBot = true;
          } else {
            floor[i][j] = floors.HORT_WALL;
          }
        }
        count++;
      } else {
        if (atRight) {
          if (!doorRight && inExistingRoom && !inExistingCorner) {
            floor[i][j] = floors.DOOR_CLOSED;
            doorRight = true;
          } else {
            floor[i][j] = floors.VERT_WALL;
          }
        } else if (atLeft) {
          if (!doorLeft && inExistingRoom && !inExistingCorner) {
            floor[i][j] = floors.DOOR_CLOSED;
            doorLeft = true;
          } else {
            floor[i][j] = floors.VERT_WALL;
          }
        } else {
          floor[i][j] = floors.ROOM;
        }
        count++;
      }
    }
  }

  var noDoors = !doorTop && !doorLeft && !doorRight && !doorBot;
  while (noDoors) {
    var ranNum = Math.random();
    if (ranNum <= 0.25) { // Top wall has a door
      floor[room.x + 1 + Math.floor(Math.random() * (room.w - 2))][room.y] = floors.DOOR_CLOSED;
      doorTop = true;
    } else if (ranNum <= 0.5) { // Bot wall has a door
      floor[room.x + 1 + Math.floor(Math.random() * (room.w - 2))][room.y + room.h - 1] = floors.DOOR_CLOSED;
      doorBot = true;
    } else if (ranNum <= 0.75) { // Left wall has a door
      floor[room.x][room.y + 1 + Math.floor(Math.random() * (room.h - 2))] = floors.DOOR_CLOSED;
      doorLeft = true;
    } else { // Right wall has a door
      floor[room.x + room.w - 1][room.y + 1 + Math.floor(Math.random() * (room.h - 2))] = floors.DOOR_CLOSED;
      doorRight = true;
    }
    noDoors = !doorTop && !doorLeft && !doorRight && !doorBot;
  }
  return count;
};

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
  var items;
  var player = Crafty.e('Player');
  var floors = Game.config.floor;
  var map = Game.config.map;

  (function generateGameLevel () {
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
    }
    // Add in the rooms
    var floorsAdded = 0;
    var target = map.width *
                 map.height *
                 map.coverage;
    while (floorsAdded < target) {
      // Place a room
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
  })();

  (function loadGameLevel () {
    gameEntityFloor = [];
    for (var i = 0; i < Game.config.map.width; i++) {
      gameEntityFloor[i] = [];
      for(var j = 0; j < Game.config.map.height; j++) {
        gameEntityFloor[i][j] = Crafty.e('Tile')
                                  .at(i,j)
                                  .tileType(gameFloor[i][j]);
      }
    }
  })();

  var passible = function (x, y) {
    return (x >= 0 && x < map.width &&
            y >= 0 && y < map.height) &&
            (gameFloor[x][y] === floors.ROOM ||
            gameFloor[x][y] === floors.ROAD ||
            gameFloor[x][y] === floors.DOOR_OPEN ||
            gameFloor[x][y] === floors.STAIRCASE_UP ||
            gameFloor[x][y] === floors.STAIRCASE_DOWN);
  };

  var lastKey = Crafty.keys.ESC;

  keyBindings = this.bind('KeyDown', function (e) {

    switch (e.keyCode) {
      case Crafty.keys.UP_ARROW:
        if (lastKey === Crafty.keys.ESC &&
          passible(player.at().x,player.at().y - 1)) {
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
      break;
      case Crafty.keys.DOWN_ARROW:
        if (lastKey === Crafty.keys.ESC &&
          passible(player.at().x,player.at().y + 1)) {
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
      break;
      case Crafty.keys.LEFT_ARROW:
        if (lastKey === Crafty.keys.ESC &&
          passible(player.at().x - 1,player.at().y)) {
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
      break;
      case Crafty.keys.RIGHT_ARROW:
        if (passible(player.at().x + 1,player.at().y)) {
          player.at(player.at().x+1,player.at().y);
        } else if (lastKey === Crafty.keys.K) {
          if (gameFloor[player.at().x+1][player.at().y] === floors.DOOR_CLOSED) {
            gameFloor[player.at().x+1][player.at().y] = floors.DOOR_OPEN;
            gameEntityFloor[player.at().x+1][player.at().y].tileType(floors.DOOR_OPEN);
          } else {
            // You kick at thin air
          }
          lastKey = Crafty.keys.ESC;
        }
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
      // If done with shift-key then its a save, reload using name
      break;
      case Crafty.keys.Z: // Cast spells from a menu
      break;
      case Crafty.keys.U: // Untraps
      break;
      case Crafty.keys.X: // Switches main and sec weapons
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
