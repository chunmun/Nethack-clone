/**
 * Loading Scene in the Game
 */
var saves;
Crafty.scene('Loading', function() {
  // Crafty.background('rgb(100,100,100)');
  Crafty.background('rgb(0,0,0)');
  var loadingText = Crafty.e("2D, DOM, Text")
      .attr({w: 500, h: 20, x: ((Crafty.viewport.width) / 2), y: (Crafty.viewport.height / 2), z: 2})
      .text('Loading ...')
      .textColor('#000')
      .textFont({'size' : '24px', 'family': Game.config.font});

  // var assets = [];

  // Crafty.load(assets, function() {
  //   console.log('Game Assets Loaded');
  // });
  Crafty.storage.getAllKeys('save', function (keys) {
    saves = keys;
    Crafty.e('Player').attr({alpha:0});
    Crafty.scene('StartSplash');
  });
}, function() {

});



/**
 * Start Splash Scene
 */

// var blackFun;
Crafty.scene('StartSplash', function() {
  var StartText = Crafty.e("2D, Canvas, Text")
      .attr({
        w: 100,
        h: 20,
        x: (Crafty.viewport.width / 3 - 20),
        y: (Crafty.viewport.height / 2),
        z: 2
      })
      .text('Press any key to start game')
      .textColor('#FFFFFF')
      .textFont({'size' : '24px', 'family': Game.config.font});

  var blackout = Crafty.e('Blackout');
  // blackFun = function() {
  //   Crafty.trigger('blackOut');
  // };
  this.bind('KeyDown', function () {Crafty.trigger('blackOut');});
}, function() {
  // Crafty.unbind('KeyDown', blackFun);
});


// Introduction Scene
Crafty.scene('Intro', function () {
  blackFun = undefined;
  function extractField (obj, field) {
    var arr = [];
    for (var i in obj) {
      arr.push(obj[i][field]);
    }
    return arr;
  }

  var input;
  var frameNum = 0;
  var optionText = [];
  var selectedOptions = [];

  var frames = [
    {text: 'What is your name ?', next:1, response: 'word',
     wordFun: function (word) {
      Crafty('Player').setLivingName(word);
      Crafty.e('Textfield').attr({
       x: Game.config.canvasWidth / 3,
       y: Game.config.canvasHeight / 3 + 35,
       w: 10,
       h: 10
      }).setMode(false).setWord(input);

      for (var i = 0; i < saves.length; i++) {
        if (saves[i] === input) {
          Crafty('Textfield').destroy();
          Crafty.e('Blackout')
            .setNextScene('GameMain');
          break;
        }
      }
    }},
    {text: 'What is your gender ?', next:2, response: 'letter',
     possible: extractField(Game.config.player.genders, 'letter'),
     options: Game.config.player.genders,
     wordFun: function (word) {Crafty('Player').setGender(word);
    }},
    {text: 'What is your race ?', next:3, response: 'letter',
     possible: extractField(Game.config.player.races, 'letter'),
     options: Game.config.player.races,
     wordFun: function (word) {Crafty('Player').setRace(word);
    }},
    {text: 'What is your role?', next:4, response: 'letter',
     possible: extractField(Game.config.player.roles, 'letter'),
     options: Game.config.player.roles,
     wordFun: function (word) {Crafty('Player').setRole(word);
    }},
  ];

  function displayOptions () {
    if (optionText && optionText.length > 0) {
      for (var i = 0; i < optionText.length; i++) {
        var optionWord = optionText[i].getWord();
        if (optionWord.slice(optionWord.length-1).toLowerCase() === input.toLowerCase()) {
          selectedOptions.push(optionText[i]);
        } else {
          optionText[i].setWord('');
          optionText[i].destroy();
        }
      }
      optionText = [];
    }
    if (!frames[frameNum] || !frames[frameNum].options) return;
    var opts = frames[frameNum].options;
    var x = Crafty.viewport.width / (frames.length + 1) * frameNum;
    var y = Crafty.viewport.height / 3 + 70;
    var i = 0;
    for (var opt in opts) {
      var text = Crafty.e('Textfield')
                       .setMode(false)
                       .limit(50)
                       .attr({
                        x: x,
                        y: y + i * 24,
                        w: 10,
                        h: 24
                       })
                       .setWord(opts[opt].name + ' - '+opts[opt].letter);
      optionText.push(text);
      i++;
    }
  }

  Crafty.e('Textfield')
      .attr({
        x: Game.config.canvasWidth / 3,
        y: Game.config.canvasHeight / 3,
        w: 20,
        h: 10
      })
      .setMode(false)
      .limit(50)
      .bind('ChangeFrame', function () {
        displayOptions();
        if (frameNum >= frames.length) {
          Crafty.e('Blackout')
                .setNextScene('GameMain');
        } else {
          this.setWord(frames[frameNum].text);
        }
      });

  Crafty.e('Textfield')
        .attr({
          x: Game.config.canvasWidth / 3,
          y: Game.config.canvasHeight / 3 + 35,
          w: 10,
          h: 10
        })
        .limit(50)
        .setMode(true)
        .bind('KeyDown', function (e) {
          input = this.getWord();
          if (frames[frameNum].response === 'word') {
            if (e.keyCode === Crafty.keys.ENTER) {
              if (frames[frameNum].wordFun) {
                frames[frameNum].wordFun(input);
              }
              frameNum = frames[frameNum].next;
              this.setWord('');

              // Check if the player's name is a match
              console.log(saves);
              var found = false;

              Crafty.trigger('ChangeFrame', frameNum);
            }
          } else if (frames[frameNum].response === 'letter') {

            if (e.keyCode === Crafty.keys.BACKSPACE && frameNum > 1) {
              frameNum--;
              var last = selectedOptions.pop();
              last.setWord('');
              last.destroy();
              Crafty.trigger('ChangeFrame', frameNum);
            }

            if (e.keyCode >= 48 && e.keyCode <= 90) {
              if (frames[frameNum].possible.indexOf(input.toLowerCase()) < 0){
                this.setWord('')
                return;
              };
              if (frames[frameNum].wordFun) {
                frames[frameNum].wordFun(input);
              }
              frameNum = frames[frameNum].next;
              this.setWord('');
              Crafty.trigger('ChangeFrame', frameNum);
            }
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
  for(var doorsLeft = Math.floor(Math.sqrt(Math.random()) * maxDr - minDr + 1) + minDr;
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

Crafty.scene('GameMain', function () {
  var level = 1;
  var gameFloor;
  var gameEntityFloor;
  var monsters = [];
  var player = Crafty('Player').attr({alpha: 0});
  var items;
  var floors = Game.config.floor;
  var map = Game.config.map;
  var modes = {LOOK: 'look', PLAYER: 'player'};
  var currMove = modes.LOOK;

  var mainText = Crafty.e('MainText');
  mainText.append('Loading Game');

  var playerStatText = Crafty.e('StatusText')
                             .attr({
                              x: 20,
                              y: 20,
                              alpha: 1
                             });

  var lookTarget = Crafty.e('Target')
                         .at(player.at().x, player.at().y)
                         .setBlockAlpha(0);

  var targetStatText = Crafty.e('StatusText')
                             .attr({
                              x: Crafty.viewport.width - 250,
                              y: 20
                             });

  var loadPlayerStatusText = function () {
    if (!player) return;
    playerStatText.putStatus('', player.setLivingName());
    playerStatText.putStatus('HP', player.hp);
    playerStatText.putStatus('EXP', player.exp);
    playerStatText.sgVisible(true);
  }

  var floorPassible = function (x, y) {
    return (withinGameBound(x, y) &&
            (gameFloor[x][y] === floors.ROOM ||
            gameFloor[x][y] === floors.ROAD ||
            gameFloor[x][y] === floors.DOOR_OPEN ||
            gameFloor[x][y] === floors.STAIRCASE_UP ||
            gameFloor[x][y] === floors.STAIRCASE_DOWN ||
            gameFloor[x][y] === floors.DOOR_KICKED));
  }

  var passible = function (x, y) {
    var pass = floorPassible(x, y);
    if (pass && gameEntityFloor && gameEntityFloor[x][y].livingThing()) {
      return false;
    } else {
      return pass;
    }
  };

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
          player.at(_x+1,_y+1);
          upPlaced = true;
        } else if (!downPlaced) {
          gameFloor[_x+1][_y+1] = floors.STAIRCASE_DOWN;
          downPlaced = true;
        }
      }

    }

    // Add in the connecting roads
    connectDoors(gameFloor);
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
    // Clear the existing monsters
    for (var i = 0; i < monsters.length; i++) {
      monsters[i].destroy();
    }
    monsters = [];

    var possible = [];
    for (var i = 0; i < map.width; i++) {
      for (var j = 0; j < map.height; j++) {
        if (passible(i, j)) {
          possible.push({x: i, y: j});
        }
      }
    }
    possible = shuffle(possible);

    for (var i = 0; i < Game.config.monster.maxLimit; i++) {
      var monster = Crafty.e('Monster')
                          .at(possible[i].x, possible[i].y)
                          .attr({alpha: 0});
      monsters.push(monster);
      gameEntityFloor[possible[i].x][possible[i].y].livingThing(monster);
    }
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
    Crafty.storage.load(player.livingName+'gameFloor','save',function (data) {
      reloadGame(data);
      Crafty.storage.load(player.livingName,'save',function(p) {
        player.destroy();
        player = p;
        updateVisibility();
        cb();
      });
    });
  };

  var moveThing = function (thing, newX, newY) {
    gameEntityFloor[thing.at().x][thing.at().y].removeThing();
    thing.at(newX, newY);
    gameEntityFloor[newX][newY].livingThing(thing);
  };


  var getMonsterNextMove = function (monster) {
    // Will only try up to a distance of 2 * visibleRange
    // If no viable route is found, just keep still
    var newX = monster.at().x;
    var newY = monster.at().y;

    var explored = [];
    var found = false;

    var frontier = binaryHeap(function (a, b) {
      var diff = (a.distPlayer + a.distMon) - (b.distPlayer + b.distMon);
      if (diff === 0) {
        if (Math.random() > 0.5) {
          return true;
        } else {
          return false;
        }
      } else if (diff < 0) {
        return true;
      } else {
        return false;
      }
    });

    frontier.push({x: newX - 1, y: newY, distMon: 1, distPlayer: player.distWith(newX - 1, newY), parent: null});
    frontier.push({x: newX, y: newY - 1, distMon: 1, distPlayer: player.distWith(newX, newY - 1), parent: null});
    frontier.push({x: newX, y: newY + 1, distMon: 1, distPlayer: player.distWith(newX, newY + 1), parent: null});
    frontier.push({x: newX + 1, y: newY, distMon: 1, distPlayer: player.distWith(newX + 1, newY), parent: null});

    while (frontier.size() !== 0) {
      var curr = frontier.pop();
      if (!withinGameBound(curr.x, curr.y) ||
          curr.distMon > monster.visibleRange * 2 ||
          isIn(curr, explored)) continue;
      if (!floorPassible(curr.x, curr.y)) {
        continue;
      }
      if (curr.distPlayer === 1) {
        found = curr;
        break;
      }
      frontier.push({x: curr.x - 1, y: curr.y, distMon: curr.distMon + 1, distPlayer: player.distWith(curr.x - 1, curr.y), parent: curr});
      frontier.push({x: curr.x, y: curr.y - 1, distMon: curr.distMon + 1, distPlayer: player.distWith(curr.x, curr.y - 1), parent: curr});
      frontier.push({x: curr.x, y: curr.y + 1, distMon: curr.distMon + 1, distPlayer: player.distWith(curr.x, curr.y + 1), parent: curr});
      frontier.push({x: curr.x + 1, y: curr.y, distMon: curr.distMon + 1, distPlayer: player.distWith(curr.x + 1, curr.y), parent: curr});

      explored.push(curr);
    }

    // Backtracking
    if (found) {
      while (found.parent !== null) {
        found = found.parent;
      }
      if (passible(found.x, found.y)) {
        newX = found.x;
        newY = found.y;
      }
    }
    return {x: newX, y: newY};
  }

  var moveMonsters = function () {
    if (monsters.length === 0) return;
    for (var i = 0; i < monsters.length; i++) {
      var monster = monsters[i];

      var dir = [{x: monster.at().x - 1, y: monster.at().y},
                 {x: monster.at().x, y: monster.at().y - 1},
                 {x: monster.at().x, y: monster.at().y + 1},
                 {x: monster.at().x + 1, y: monster.at().y}];

      var distToPlayer = monster.distBetween(player);

      // if the player is adjacent attack the player
      if (distToPlayer <= 1) {
          monster.fight(player);
          loadPlayerStatusText();
          return;
      }

      // Check if we're close enough to move towards the player
      if (distToPlayer <= monster.visibleRange()) {
        var nextMove = getMonsterNextMove(monster);
        if(Math.random() <= monster.moveChance) {
          moveThing(monster, nextMove.x, nextMove.y);
        }
        continue;
      }

      // Randomly move around
      dir = shuffle(dir);

      for (var j in dir) {
        if (passible(dir[j].x, dir[j].y)) {
          moveThing(monster, dir[j].x, dir[j].y);
          break;
        }
      }

      if(player.at().x === monster.at().x && player.at().y === monster.at().y) {
        console.log('There is overlap');
      }
    }
  }

  var updateVisibility = function () {
    // Visibility of the monsters are calculated based on the floor
    var visibleRange = Game.config.player.visibleRange;
    var lighted = [];
    var playerInRoom = isRoomTile(gameFloor[player.at().x][player.at().y]);

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
      var relX = player.at().x - visibleRange + currX;
      var relY = player.at().y - visibleRange + currY;

      if (!withinGameBound(relX, relY) ||
          (currX < 0 || currX >= visibleRange * 2 + 1 ||
           currY < 0 || currY >= visibleRange * 2 + 1)) { // this check is needed for small rooms
        return;
      }

      var currFloor = gameFloor[relX][relY];
      var parentFloor = gameFloor[player.at().x - visibleRange + x][player.at().y - visibleRange + y];

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
      }
    }

    for (var i = 0; i < visibleRange * 2 + 1; i++) {
      for (var j = 0; j < visibleRange * 2 + 1; j++) {
        relX = player.at().x - visibleRange + i;
        relY = player.at().y - visibleRange + j;
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
      // Open-door or kicked-door can be parent for any child
      // Closed-door cannot be parent for any child
      // RoomTiles can light up any other room tiles
      // For all others, just check for same types
      if (parent === floors.DOOR_OPEN || parent === floors.DOOR_KICKED) {
        return true;
      }
      if (isRoomTile(parent)) {
        return ((isRoomTile(child) ||
                child === floors.DOOR_CLOSED ||
                child === floors.DOOR_KICKED)
          ? true : false);
      }

      switch (parent) {
        case floors.IMPASSABLE:
        case floors.DOOR_CLOSED:
          return false;
        case floors.ROAD:
          if (child === floors.ROAD ||
              child === floors.DOOR_OPEN ||
              child === floors.DOOR_KICKED ||
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

  var generateTargetStatText = function () {
    targetStatText.flush();
    var x = lookTarget.at().x;
    var y = lookTarget.at().y;
    var currFloor = gameFloor[x][y];

    // Unknown in the darkness
    if (gameEntityFloor[x][y]._alpha === 0) {
      targetStatText.putStatus('Floor', 'unknown');
    } else {
      // Else just report the name
      for (var floorType in floors) {
        if (floors[floorType] === currFloor) {
          targetStatText.putStatus('Floor', formatFloorText(floorType));
          break;
        }
      }
    }

    // livingThings
    if (gameEntityFloor[x][y].livingThing() !== undefined) {
      var thing = gameEntityFloor[x][y].livingThing();
      if (thing.__c.Monster) { // this is a monster
        targetStatText.putStatus('Monster', thing.livingName);
        targetStatText.putStatus('dmg',thing.damage);
      } else if (thing.__c.Player) { // this is a player
        targetStatText.putStatus('',player.gender.name+' '+player.race.name+' '+player.role.name)
      }
    }

    targetStatText.sgVisible(true);

    function formatFloorText (text) {
      var words = text.split('_');
      var str = '';
      for (var i = 0; i < words.length; i++) {
        words[i] = words[i].toLowerCase();
        str += capitaliseFirstLetter(words[i])+' ';
      }
      return str;
    }

    function capitaliseFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
  }

  var checkDeath = function () {
    if (player.hp <= 0) {
      player.attr({alpha: 0});
      controls.destroy();
      Crafty.e('Textfield')
            .attr({
              x: Crafty.viewport.width / 3 + 20,
              y: Crafty.viewport.height / 2,
              w: 10,
              h: 10
            })
            .setMode(false)
            .setWord('You have died');
      Crafty.e('Blackout').setNextScene('DeathScene');
    }
  } // checkDeath

  var found = false;
  for (var i = 0; i < saves.length; i++) {
    if (saves[i] === player.livingName) {
      loadGame(function () {
        player.attr({alpha: 1});
        spawnMonsters(gameFloor);
        updateVisibility();
        loadPlayerStatusText();
        mainText.append('Load Done');
        gameEntityFloor[player.at().x][player.at().y].livingThing(player);
      });
      found = true;
      break;
    }
  }

  if (!found) {
    generateGameLevel();
    loadGameLevel();
    spawnMonsters(gameFloor);
    player.attr({alpha:1});
    updateVisibility();
    loadPlayerStatusText();
    mainText.append('Load Done');
    gameEntityFloor[player.at().x][player.at().y].livingThing(player);
  }

  var appendRandomText = function (textArr) {
    var i = Math.floor(Math.random() * (textArr.length - 1));
    mainText.append(textArr[i]);
  }

  var controls = Crafty.e('Controls');
  var actions = [];
  function getRelDelta (delta) {
    var rel = {x: player.at().x + delta.x, y: player.at().y + delta.y};
    return rel;
  }

  actions.push(this.bind('PlayerLook', function (dir) {
    if (dir.x === 0 && dir.y === 0) { // this is the initialisation
      currMode = modes.LOOK;
      lookTarget.setBlockAlpha(1);
      lookTarget.at(player.at().x, player.at().y);
      generateTargetStatText();
      return;
    }
    var rel = {x: dir.x + lookTarget.at().x, y: dir.y + lookTarget.at().y};
    lookTarget.at(rel.x, rel.y);
    generateTargetStatText();
  }));

  actions.push(this.bind('ControlClear', function () {
    currMode = modes.PLAYER;
    lookTarget.setBlockAlpha(0);
    targetStatText.sgVisible(false);
    // if (gameEntityFloor[rel.x][rel.y].livingThing()) {

    // }
  }));

  actions.push(this.bind('PlayerStaircase', function (dir) {
    if ((dir === 'down' &&
         gameFloor[player.at().x][player.at().y] === floors.STAIRCASE_DOWN) ||
        (dir === 'up' &&
         gameFloor[player.at().x][player.at().y] === floors.STAIRCASE_UP)) {
      if (dir === 'up') {
        level--;
        if (level === 0) {
          var exit = confirm('You will leave the game if you run away');
          if (!exit) return;
        }
      } else {
        level++;
      }
      mainText.append('Moving '+dir+' to dungeon level '+level);
      generateGameLevel();
      loadGameLevel();
      spawnMonsters();
      updateVisibility();
    }
  }));

  actions.push(this.bind('SaveGame', function () {
    mainText.append('Saving Game...');
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
    var saved = 0;
    Crafty.storage.save(player.livingName+'gameFloor','save',gameFloorMod, function () {
      saved++;
      console.log('saved left: '+saved);
      if (saved === 2) mainText.append('Save Done');
    });
    Crafty.storage.save(player.livingName,'save',player, function () {
      saved++;
      console.log('saved left: '+saved);
      if (saved === 2) mainText.append('Save Done');
    });
    // console.log('Saved to '+player.livingName);
  }));

  actions.push(this.bind('PlayerOpen', function (delta) {
    var rel = getRelDelta(delta);
    if (gameFloor[rel.x][rel.y] === floors.DOOR_CLOSED) {
      gameFloor[rel.x][rel.y] = floors.DOOR_OPEN;
      gameEntityFloor[rel.x][rel.y].tileType(floors.DOOR_OPEN);
      updateVisibility();
      checkDeath();
      appendRandomText(Game.config.mainText.OPEN_DOOR);
    }
  }));

  actions.push(this.bind('PlayerMove', function (delta) {
    var rel = getRelDelta(delta);
    player.tickHp();
    if (passible(rel.x, rel.y)) {
      moveThing(player, rel.x, rel.y);
      updateVisibility();
      moveMonsters();
      checkDeath();
    }
    if (gameEntityFloor[rel.x][rel.y].livingThing()) {
      Crafty.trigger('PlayerFight', delta);
    }
  }));

  actions.push(this.bind('PlayerKick', function (delta) {
    var rel = getRelDelta(delta);
    if (gameFloor[rel.x][rel.y] === floors.DOOR_CLOSED) {
      gameFloor[rel.x][rel.y] = floors.DOOR_KICKED;
      gameEntityFloor[rel.x][rel.y].tileType(floors.DOOR_KICKED);
      updateVisibility();
      checkDeath();
      appendRandomText(Game.config.mainText.KICK_DOOR);
    }
  }));

  actions.push(this.bind('PlayerClose', function (delta) {
    var rel = getRelDelta(delta);
    if (gameFloor[rel.x][rel.y] === floors.DOOR_OPEN) {
      // Cannot close a door if there's a monster on it
      if (gameEntityFloor[rel.x][rel.y].livingThing() !== undefined) {

      } else {
        gameFloor[rel.x][rel.y] = floors.DOOR_CLOSED;
        gameEntityFloor[rel.x][rel.y].tileType(floors.DOOR_CLOSED);
        updateVisibility();
        checkDeath();
        appendRandomText(Game.config.mainText.CLOSE_DOOR);
      }
    }
  }));

  actions.push(this.bind('PlayerFight', function (delta) {
    var rel = getRelDelta(delta);
    var monster = gameEntityFloor[rel.x][rel.y].livingThing();
    if (monster !== undefined) {
      player.fight(monster);
      player.resetHpGainTick();
      if (monster.hp <= 0) {
        player.exp += monster.exp;
        monster.destroy();
        gameEntityFloor[rel.x][rel.y].removeThing();
        monsters = monsters.filter(function (mon) { return mon !== monster;});
      }
      moveMonsters();
    }
    loadPlayerStatusText();
    checkDeath();
  }));

}, function () {
});



Crafty.scene('DeathScene', function () {
  Crafty.e('Textfield')
      .attr({
        x: Crafty.viewport.width / 3 + 20,
        y: Crafty.viewport.height / 2,
        w: 10,
        h: 10
      })
      .setMode(false)
      .setWord('You have died');

  var mainText = Crafty.e('MainText')
                       .attr({
                        x: 10,
                        y: 10,
                        w: Crafty.viewport.width - 10,
                        h: Crafty.viewport.height - 10,
                        alpha: 0
                       });

  // Generate the death text
  mainText.append();
}, function () {

});
