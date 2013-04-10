Game.config = (function() {
  var config = {
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
      bot: 1,
      left: 1,
      right: 1
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
      STAIRCASE_UP: 11,
      STAIRCASE_DOWN: 12
    },

    room: {
      maxWidth: 10,
      maxHeight: 10,
      minWidth: 6,
      minHeight: 6,
      maxDoors: 4,
      minDoors: 1
    },

    player: {
      visibleRange: 5
    },

    monster: {
      maxLimit: 10
    },

    baseAlpha: 0.2
  };

  config.canvasWidth = (config.map.width +
                        config.padding.right +
                        config.padding.left) * config.tile.width;
  config.canvasHeight = (config.map.height +
                        config.padding.top +
                        config.padding.bot) * config.tile.height;

  return config;
})();