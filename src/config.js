Game.config = (function() {
  var config = {
    font: 'COURIER NEW',

    tile: {
      width: 16,
      height: 16
    },

    map: {
      width: 48,
      height: 32,
      coverage: 0.3
    },

    padding: {
      top: 1,
      bot: 8,
      left: 10,
      right: 10
    },

    floor: {
      IMPASSABLE: 0,
      HORT_WALL: 1,
      VERT_WALL: 2,
      TOP_RIGHT_CORNER: 3,
      TOP_LEFT_CORNER: 4,
      BOT_RIGHT_CORNER: 5,
      BOT_LEFT_CORNER: 6,
      ROAD: 7,
      ROOM: 8,
      DOOR_CLOSED: 9,
      DOOR_OPEN: 10,
      DOOR_KICKED: 11,
      STAIRCASE_UP: 12,
      STAIRCASE_DOWN: 13,
    },

    room: {
      maxWidth: 10,
      maxHeight: 10,
      minWidth: 6,
      minHeight: 6,
      maxDoors: 4,
      minDoors: 1
    },

    monster: {
      maxLimit: 10
    },

    baseAlpha: 0.2,

    player: {
      visibleRange: 5,

      roles: {
        ARCHEOLOGIST: {name: 'Archeologist', letter: 'a', weapon: Game.ITEMS.weapons.RUSTY_SPADE},
        BARBARIAN: {name: 'Barbarian', letter: 'b', weapon: Game.ITEMS.weapons.STONE_AXE},
        CAVEMAN: {name: 'Caveman', letter: 'c', weapon: Game.ITEMS.weapons.WOODEN_CLUB},
        HEALER: {name: 'Healer', letter: 'h', weapon: Game.ITEMS.weapons.BARE_HANDS},
        KNIGHT: {name: 'Knight', letter: 'k', weapon: Game.ITEMS.weapons.RUSTY_SWORD},
        MONK: {name: 'Monk', letter: 'm', weapon: Game.ITEMS.weapons.BARE_HANDS},
        PRIEST: {name: 'Priest', letter: 'p', weapon: Game.ITEMS.weapons.BARE_HANDS},
        ROGUE: {name: 'Rogue', letter: 'r', weapon: Game.ITEMS.weapons.RUSTY_DAGGER},
        RANGER: {name: 'Ranger', letter: 'g', weapon: Game.ITEMS.weapons.WOODEN_BOW},
        SAMURAI: {name: 'Samurai', letter: 's', weapon: Game.ITEMS.weapons.RUSTY_KATANA},
        TOURIST: {name: 'Tourist', letter: 't', weapon: Game.ITEMS.weapons.CAMERA},
        VALKYRIE: {name: 'Valkyrie', letter: 'v', weapon: Game.ITEMS.weapons.RUSTY_SWORD},
        WIZARD: {name: 'Wizard', letter: 'w', weapon: Game.ITEMS.weapons.WOODEN_STAFF}
      },

      genders: {
        FEMALE: {name: 'Female', letter: 'f'},
        MALE: {name: 'Male', letter: 'm'}
      },

      races: {
        HUMAN: {name: 'Human', letter: 'h', hpGainTick: 14},
        ELF: {name: 'Elf', letter: 'e', hpGainTick: 12},
        GNOME: {name: 'Gnome', letter: 'g', hpGainTick: 16},
        ORC: {name: 'Orc', letter: 'o', hpGainTick: 12},
        DWARF: {name: 'Dwarf', letter: 'd', hpGainTick: 16}
      }
    }, // player

    mainText: {
      OPEN_DOOR: ['You opened the door with ease',
                  'A slight twist and the door opens',
                  'The door creaks open slowly',
                  'With a little effort, the door opens to you'],

      KICK_DOOR: ['You gave that door a roundhouse kick and smashes it to bits'],
      CLOSE_DOOR: ['The door slams shut',
                   'You pull on the handle with might and seal the door',
                   'Without a sound, the door slowly closes'],
    }
  };

  config.canvasWidth = (config.map.width +
                        config.padding.right +
                        config.padding.left) * config.tile.width;
  config.canvasHeight = (config.map.height +
                        config.padding.top +
                        config.padding.bot) * config.tile.height;


  return config;
})();

// Shuffle the doors
function shuffle(o){
  for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
};

function withinGameBound(x, y) {
  return (x >= 0 && x < Game.config.map.width &&
          y >= 0 && y < Game.config.map.height);
}

function isRoomTile (tile) {
  return (tile === Game.config.floor.HORT_WALL ||
          tile === Game.config.floor.VERT_WALL ||
          tile === Game.config.floor.TOP_RIGHT_CORNER ||
          tile === Game.config.floor.TOP_LEFT_CORNER ||
          tile === Game.config.floor.BOT_LEFT_CORNER ||
          tile === Game.config.floor.BOT_RIGHT_CORNER ||
          tile === Game.config.floor.DOOR_OPEN ||
          tile === Game.config.floor.DOOR_KICKED ||
          // tile === Game.config.floor.DOOR_CLOSED ||
          tile === Game.config.floor.ROOM ||
          tile === Game.config.floor.STAIRCASE_UP ||
          tile === Game.config.floor.STAIRCASE_DOWN);
};

var binaryHeap = function(comp) {

  // default to max heap if comparator not provided
  comp = comp || function(a, b) {
    return a > b;
  };

  var arr = [];

  var swap = function(a, b) {
    var temp = arr[a];
    arr[a] = arr[b];
    arr[b] = temp;
  };

  var bubbleDown = function(pos) {
    var left = 2 * pos + 1;
    var right = left + 1;
    var largest = pos;
    if (left < arr.length && comp(arr[left], arr[largest])) {
      largest = left;
    }
    if (right < arr.length && comp(arr[right], arr[largest])) {
      largest = right;
    }
    if (largest != pos) {
      swap(largest, pos);
      bubbleDown(largest);
    }
  };

  var bubbleUp = function(pos) {
    if (pos <= 0) {
      return;
    }
    var parent = Math.floor((pos - 1) / 2);
    if (comp(arr[pos], arr[parent])) {
      swap(pos, parent);
      bubbleUp(parent);
    }
  };

  var that = {};

  that.pop = function() {
    if (arr.length === 0) {
      throw new Error("pop() called on emtpy binary heap");
    }
    var value = arr[0];
    var last = arr.length - 1;
    arr[0] = arr[last];
    arr.length = last;
    if (last > 0) {
      bubbleDown(0);
    }
    return value;
  };

  that.push = function(value) {
    arr.push(value);
    bubbleUp(arr.length - 1);
  };

  that.size = function() {
    return arr.length;
  };

  return that;
};