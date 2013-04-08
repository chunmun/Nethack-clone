/**
 * The actual game scene
 */
Crafty.scene('GameMain', function() {
  var gameMap; // Array of tiles
  var origMap; // Array that is loaded
  var stateMap; // Current state
  var nextMap; // Next state map, used for computing the next state

  var loadStateMap = function() {
    for (var x = 0; x < Game.config.map.width; x++) {
      for (var y = 0; y < Game.config.map.height; y++) {
        switch (stateMap[x][y]) {
          case 0:
            gameMap[x][y].setMode(false);
          break;
          case 1:
            gameMap[x][y].setMode(true);
          break;
        }
      }
    }
  };

  // Clones from src to dest
  var cloneMap = function(src) {
    var arr = [];
    for (var i = 0; i < src.length; i++) {
      arr[i] = src[i].slice(0);
    }
    return arr;
  };

  var generateMap = function() {
    if (origMap !== undefined) return;
    // A 2D array to keep track of all occupied tiles
    origMap = [];
    gameMap = [];
    stateMap = [];
    nextMap = [];
    for (var x = 0; x < Game.config.map.width; x++) {
      origMap[x] = [];
      gameMap[x] = [];
      stateMap[x] = [];
      nextMap[x] = [];
      for (var y = 0; y < Game.config.map.height; y++) {
        origMap[x][y] = 0;
        stateMap[x][y] = 0;
        nextMap[x][y] = 0;
        gameMap[x][y] = Crafty.e('Tile').at(x,y).setMode(false);
      }
    }
  };

  var advanceState = function() {
    for (var x = 0; x < Game.config.map.width; x++) {
      for (var y = 0; y < Game.config.map.height; y++) {
        var alive = getNeighboursAlive(x,y);
        if(stateMap[x][y] === 1) {
          if (alive === 3 || alive === 2) {
            nextMap[x][y] = 1;
          } else {
            nextMap[x][y] = 0;
          }
        } else {
          if (alive === 3) {
            nextMap[x][y] = 1;
          } else {
            nextMap[x][y] = 0;
          }
        }
      }
    }
    stateMap = cloneMap(nextMap);
  };

  var getNeighboursAlive = function(x, y) {
    if (x === 0) {
      if (y === 0) { // Top left
        // console.log('top left');
        return stateMap[x+1][y]+stateMap[x][y+1]+stateMap[x+1][y+1];
      } else if (y == Game.config.map.height - 1) { // Bot left
        // console.log('bot left');
        return stateMap[x+1][y]+stateMap[x][y-1]+stateMap[x+1][y-1];
      } else { // Left
        // console.log('left');
        return stateMap[x][y-1]+stateMap[x+1][y-1]+
               stateMap[x+1][y]+
               stateMap[x][y+1]+stateMap[x+1][y+1];
      }
    } else if (x == Game.config.map.width - 1) {
      if (y === 0) { // Top Right
        // console.log('top right');
        return stateMap[x-1][y]+stateMap[x][y+1]+stateMap[x-1][y+1];
      } else if (y == Game.config.map.height - 1) { // Bot Right
        // console.log('bot right');
        return stateMap[x-1][y]+stateMap[x][y-1]+stateMap[x-1][y-1];
      } else { // Right
        // console.log('right');
        return stateMap[x-1][y-1]+stateMap[x][y-1]+
               stateMap[x-1][y]+
               stateMap[x-1][y+1]+stateMap[x][y+1];
      }
    } else {
      if (y === 0) { //Top
        // console.log('top');
        return stateMap[x-1][y]+stateMap[x+1][y]+
               stateMap[x-1][y+1]+stateMap[x][y+1]+stateMap[x+1][y+1];
      } else if (y == Game.config.map.height - 1) { // Bot
        // console.log('bot');
        return stateMap[x-1][y-1]+stateMap[x][y-1]+stateMap[x+1][y-1]+
               stateMap[x-1][y]+stateMap[x+1][y];
      } else {  // Inner tiles
        // console.log('inner');
        return stateMap[x-1][y-1]+stateMap[x][y-1]+stateMap[x+1][y-1]+
               stateMap[x-1][y]+stateMap[x+1][y]+
               stateMap[x-1][y+1]+stateMap[x][y+1]+stateMap[x+1][y+1];
      }
    }
  };

  var modes = {RUNNING:'RUNNING', SAVING:'SAVING', LOADING: 'LOADING'};
  var currMode = modes.RUNNING;
  generateMap();
  loadStateMap();

  Crafty.background('rgb(100,100,100)');
  var stepGameMap = function() {
    advanceState();
    loadStateMap();
  };

  this.bind('tileClick', function(pos) {
    // console.log('clicking at '+pos.x+','+pos.y+' to set '+pos.mode);
    stateMap[pos.x][pos.y] = (pos.mode ? 1 : 0);
  });






  var saveBox = Crafty.e('Box, SaveMenuBindings');
  var saveText = Crafty.e('Textfield, SaveMenuBindings');

  var loadBox = Crafty.e('Box, LoadMenuBindings');
  var loadText = Crafty.e('Textfield, LoadMenuBindings');


  var loadMenu;
  Crafty.storage.getAllKeys('save', function (keys) {
    loadMenu = Crafty.e('AccordMenu')
                  .attr({
                    x: 300,
                    y: 250,
                    w: 50,
                    h: 30
                  })
                  .setOptions(keys)
                  .setMode(false)
                  .setVisible(false);
  });

  // Separate keyboard logic for advancing frame
  this._enterFrame = this.bind('EnterFrame', function() {
    if (Crafty.keydown[Crafty.keys.SPACE]) {
      stepGameMap();
    }
  });

  // Logic for saving and loading
  this.saveLoad = this.bind('KeyDown', function(e) {
    var _this = this;
    if (currMode === modes.RUNNING) {
      switch (e.keyCode) {
        case 79: // 'o'
          // Save the map
          Crafty.storage.save('map', 'save', stateMap);
          break;
        case 80: // 'p'
          // Load the map
          Crafty.storage.load('map', 'save', function(data) {
            stateMap = cloneMap(data);
            origMap = cloneMap(data);
            loadStateMap();
          });
          break;
        case 77: // 'm'
          break;
        case Crafty.keys.RIGHT_ARROW:
        case 32: // 'Space'
          stepGameMap();
          break;
        case 82: // 'r'
          stateMap = cloneMap(origMap);
          loadStateMap();
          break;


        // Saving mode
        case Crafty.keys.K:
          Crafty.trigger('closeLoad');
          currMode = modes.SAVING;
          Crafty.storage.getAllKeys('save', function(keys) {
            Crafty.trigger('viewSave');
          });
          loadMenu.setMode(true);
          loadMenu.setVisible(true);
          break;

        // Loading mode
        case Crafty.keys.L:
          Crafty.trigger('closeSave');
          currMode = modes.LOADING;
          Crafty.storage.getAllKeys('save', function(keys) {
            Crafty.trigger('viewLoad');
          });
          loadMenu.setMode(true);
          loadMenu.setVisible(true);
          break;
      }
    }
    // When currMode is not Running
    switch (e.keyCode) {

      case Crafty.keys.ESC:
        currMode = modes.RUNNING;
        Crafty.trigger('closeSave');
        Crafty.trigger('closeLoad');
        loadMenu.setMode(false);
        loadMenu.setVisible(false);
        break;

      case Crafty.keys.UP_ARROW:
        loadMenu.selectUp();
        break;

      case Crafty.keys.DOWN_ARROW:
        loadMenu.selectDown();
        break;

      case Crafty.keys.ENTER:
        if(currMode === modes.SAVING) {
          Crafty.trigger('closeSave');
          currMode = modes.RUNNING;
          loadStateMap();
          Crafty.storage.save(saveText.getWord(), 'save', stateMap);
        } else if (currMode === modes.LOADING) {
          Crafty.trigger('closeLoad');
          Crafty.storage.load(loadText.getWord(), 'save', function(data) {
            stateMap = cloneMap(data);
            origMap = cloneMap(data);
            loadStateMap();
            currMode = modes.RUNNING;
          });
        }
        loadMenu.setMode(false);
        loadMenu.setVisible(false);
        break;
    }
  });

  console.log('Game Scene done');
}, function() {
  this.unbind('EnterFrame', this._enterFrame);
});
