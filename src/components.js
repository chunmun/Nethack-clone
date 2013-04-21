/**
 * Generic Components
 */
Crafty.c('LivingThings', {
  init: function (){
    this.requires('2D');
    this.hp = 0;
    this.maxHp = 0;
    this.damage = 0;
    this.livingName = 'LivingThing';
    this.fightText = function () {return 'It does nothing';};
    this.passible;
    this.visRange = Game.config.player.visibleRange;
  },

  // Only elements that has this component can fight each other
  fight: function (other) {
    if (!other.__c['LivingThings']) {
      Crafty.trigger('SendMainText', this.livingName + ' cannot fight');
      return this;
    }
    Crafty.trigger('SendMainText', this.fightText(other));
    other.hp -= this.damage;
    return this;
  },

  setLivingName: function (newname) {
    if (newname === undefined) {
      return this.livingName;
    } else {
      this.livingName = newname;
      return this;
    }
  },

  // Locate this entity at the given position on the grid
  at: function (x, y) {
    if (x === undefined && y === undefined) {
      return {
        x: (this._x - 3) / Game.config.tile.width - Game.config.padding.left,
        y: (this._y - 3) / Game.config.tile.height - Game.config.padding.top
      };
    } else {
      this.attr({
        x: (x + Game.config.padding.left) * Game.config.tile.width + 3,
        y: (y + Game.config.padding.top) * Game.config.tile.height + 3
      });
      return this;
    }
  },

  visibleRange: function (range) {
    if (range !== undefined) {
      this.visRange = range;
      return this;
    } else {
      return this.visRange;
    }
  },

  distBetween: function (other) {
    return Math.abs(other.at().x - this.at().x) +
           Math.abs(other.at().y - this.at().y);
  },

  distWith: function (x, y) {
    return Math.abs(x - this.at().x) +
           Math.abs(y - this.at().y);
  }
});


/**
 * Monster Components
 */
Crafty.c('MonsterTypes', {
  init: function () {
    this.monsterAll = {
      NEWT: {
        livingName: 'newt',
        damage: 1,
        maxHp: 3,
        fightText: ['newt bites your hand', 'newt bites your leg'],
        color: 'rgb(255,51,51)',
        exp: 1,
        moveChance: 0.6
      },
      JACKAL: {
        livingName: 'jackal',
        damage: 2,
        maxHp: 5,
        fightText: ['jackal rips you', 'jackal claws you'],
        color: 'rgb(100,0,100)',
        exp: 2,
        moveChance: 0.8
      }
    };
  }
});

Crafty.c('Monster', {
  init: function () {
    this.requires('2D, Color, Canvas, MonsterTypes, LivingThings')
      .at(0,0)
      .attr({w: 10, h: 10, z: 9999});
    this.setType('newt');
    this.monsterType;
    this.moveChance;
    this.exp;
  },

  setType: function (newtype) {
    if (newtype === undefined) {
      return this.monsterType;
    } else {
      this.monsterType = this.monsterAll[newtype.toUpperCase()];
      this.setLivingName(this.monsterType.livingName);
      this.fightText = function () {
        return this.monsterType.fightText[
            Math.floor(Math.random()*(this.monsterType.fightText.length))] +
            ' for '+this.monsterType.damage+' dmg';
      };
      this.moveChance = this.monsterType.moveChance;
      this.color(this.monsterType.color);
      this.maxHp = this.monsterType.maxHp;
      this.hp = this.maxHp;
      this.damage = this.monsterType.damage;
      this.exp = this.monsterType.exp;
      return this;
    }
  },

  sgMoveChance: function (chance) {
    if (chance === undefined) {
      return this.moveChance;
    } else {
      this.moveChance = chance;
      return this;
    }
  }
});


/**
 * Player Components
 */
Crafty.c('PlayerActions', {
  init: function() {
  }
});

Crafty.c('PlayerAttributes', {
  init: function () {
    this.alignmentAll = {
      CHAOTIC: {name: 'chaotic'},
      NEUTRAL: {name: 'neutral'},
      BLESSED: {name: 'blessed'}
    };
    this.raceAll = Game.config.player.races;
    this.roleAll = Game.config.player.roles;
    this.genderAll = Game.config.player.genders;
  }
});

Crafty.c('PlayerStats', {
  init: function () {
    this.stats = {
      str: 0,
      dex: 0,
      con: 0,
      intel: 0,
      wis: 0,
      cha: 0
    };
    this.luck = 0;
    this.nutrition = 0;
    this.power = 0;
  },

  // Hit chance with wielded weapon increases
  modToHit: function () {
    var sum = 0;
    // Str modifier
    sum += floor((this.str - 2) / 3) - 2;

    // Dex modifier
    sum += floor((this.dex - 3) / 3) - 2;
    return sum;
  },

  // Damage adjustment to wielded and thrown weapons
  modDamage: function () {
    return floor((this.str - 2) / 3) - 1;
  },

  // Healing rate : in hp per turn
  modHeal: function() {
    return floor((this.con -2) / 6);
  },

  modHp: function () {
    return floor((this.con - 2) / 6) - 7;
  }
});

Crafty.c('Player', {
  init: function () {
    this.requires('2D, Canvas, Color, PlayerAttributes, LivingThings, Persist, PlayerStats')
        .attr({
          x: 10,
          y: 10,
          w: 10,
          h: 10,
          z: 9999999
        })
        .color('rgb(102,204,0)');
    this.setLivingName('Chunmun');
    this.role;
    this.race;
    this.gender;
    this.alignment = this.alignmentAll.CHAOTIC;
    this.exp = 0;
    this.weapon;
    this.hpGainTick;
    this.inventory = {
      amulets: [],
      food: [],
      gems: [],
      rings: [],
      spellbooks: [],
      tools: [],
      weapons: [],
      armour: [],
      potions: [],
      scrolls: [],
      statues: [],
      wands: [],
      gold: 0
    };
    this.hp = 10;
    this.maxHp = 10;
    this.damage = 1;

    this.bind('SaveData', function (data) {
      data.c = ['Player', 'obj'];
      data.livingName = this.livingName;
      data.role = this.role;
      data.race = this.race;
      data.gender = this.gender;
      data.alignment = this.alignment;
      data.weapon = this.weapon;
      data.exp = this.exp;
      data.inventory = this.inventory;
      data.at = this.at();
      data.hpGainTick = this.hpGainTick;
    })
    .bind('LoadData', function (data) {
      this.livingName = data.livingName;
      this.role = data.role;
      this.race = data.race;
      this.gender = data.gender;
      this.alignment = data.alignment;
      this.weapon = data.weapon;
      this.exp = data.exp;
      this.inventory = data.inventory;
      this.at(data.at.x,data.at.y);
      this._globalZ = 99999;
      this.hpGainTick = data.hpGainTick;
      this.generateFightText();
    });
  },

  tickHp: function () {
    if (this.hp < this.maxHp) {
      this.hpGainTick--;
      if (this.hpGainTick === 0) {
        this.hp++;
        this.resetHpGainTick();
      }
    } else {
      this.resetHpGainTick();
    }
    return this;
  },

  resetHpGainTick: function () {
    this.hpGainTick = this.race.hpGainTick;
    return this;
  },

  setRace: function (letter) {
    for (var r in this.raceAll) {
      if (this.raceAll[r].letter.toLowerCase() === letter.toLowerCase()) {
        this.race = this.raceAll[r];
        break;
      }
    }
    this.hpGainTick = this.race.hpGainTick;
    return this;
  },

  setRole: function (letter) {
    for (var r in this.roleAll) {
      if (this.roleAll[r].letter.toLowerCase() === letter.toLowerCase()) {
        this.role = this.roleAll[r];
        break;
      }
    }
    this.weapon = this.role.weapon;
    this.damage = this.weapon.damage;
    this.generateFightText();
    return this;
  },

  setGender: function (letter) {
    for (var gender in this.genderAll) {
      if (this.genderAll[gender].letter.toLowerCase() === letter.toLowerCase()) {
        this.gender = this.genderAll[gender];
        break;
      }
    }
    return this;
  },

  generateFightText: function () {
    this.fightText = function (monster) {
      return 'You '+this.weapon.verb+' the '+ monster.setLivingName()+' with your '+this.weapon.name+' for '+this.damage+' dmg';
    };
  },

  setWeapon: function (weaponName) {
    for (var i in Game.ITEMS.weapons) {
      if (weaponName === i.name) {
        this.weapon = Game.ITEMS.weapons[i];
        break;
      }
    }
    this.damage = this.weapon.damage;
    this.generateFightText();
    return this;
  }
});


Crafty.c('Item', {

});

Crafty.c('MenuButton', {
  init: function () {
    this.requires('2D, Canvas, Text, Tween')
      .attr({
        x: 20,
        y: 20,
        w: 80,
        h: 20,
        alpha: 0
      })
      .text('MENU')
      .textColor('#FFFFFF')
      .textFont({'size' : '24px', 'family': Game.config.font})
      .bind('toggleMenu', function (menuOn) {
        this.menuOn = menuOn;
        var newAlpha = 0;
        if (menuOn) {
          newAlpha = 1;
        }
        this.tween({alpha: newAlpha}, 5);
      });
  }
});

Crafty.c('Tile', {
  init: function () {
    this._type = Game.config.floor.IMPASSABLE;
    this.requires('2D, Canvas, Color, Grid, Tween');
    this._setColor();
    this._sighted = false;
    this._livingThing;

    this.bind('SaveData', function (data) {
      data.c = ['Tile', 'obj'];
      data._type = this._type;
      data._sighted = this._sighted;
      data._alpha = this.alpha;
      data.at = this.at();
    })
    .bind('LoadData', function (data) {
      this._type = data.type;
      this._sighted = data._sighted;
      this._alpha = data._alpha;
      this.at(data.at.x,data.at.y);
    });
  },

  tileType: function (newType) {
    if (newType === undefined) {
      return this._type;
    } else {
      this._type = newType;
      this._setColor();
      return this;
    }
  },

  livingThing: function (thing) {
    if (thing === undefined) {
      return this._livingThing;
    } else {
      this._livingThing = thing;
      return this;
    }
  },

  removeThing: function () {
    this._livingThing = undefined;
  },

  tweenLOS: function (inSight, val) {
    if (inSight) {
      this.tween({alpha:val}, 20);
      this._sighted = true;
    } else if (this._sighted) {
      this.tween({alpha: Game.config.baseAlpha}, 5);
    } else {
      this.tween({alpha: 0}, 20);
    }
    if (this._livingThing) {
      if (inSight) {
        this._livingThing.attr({alpha: 1});
      } else {
        this._livingThing.attr({alpha: 0});
      }
    }
    return this;
  },

  _setColor: function () {
    var floors = Game.config.floor;
    switch (this._type) {
      case floors.IMPASSABLE:
        this.color('rgb(0,0,0)');
        break;
      case floors.HORT_WALL:
        this.color('rgb(255,255,255)');
        break;
      case floors.VERT_WALL:
        this.color('rgb(255,255,255)');
        break;
      case floors.TOP_RIGHT_CORNER:
        this.color('rgb(255,255,255)');
        break;
      case floors.TOP_LEFT_CORNER:
        this.color('rgb(255,255,255)');
        break;
      case floors.BOT_RIGHT_CORNER:
        this.color('rgb(255,255,255)');
        break;
      case floors.BOT_LEFT_CORNER:
        this.color('rgb(255,255,255)');
        break;
      case floors.ROAD:
        this.color('rgb(100,0,100)');
        break;
      case floors.ROOM:
        this.color('rgb(100,100,100)');
        break;
      case floors.DOOR_CLOSED:
        this.color('rgb(0,30,40)');
        break;
      case floors.DOOR_OPEN:
        this.color('rgb(0,0,255)');
        break;
      case floors.DOOR_KICKED:
        this.color('rgb(100,100,100)')
        break;
      case floors.STAIRCASE_UP:
        this.color('rgb(10,20,30)');
        break;
      case floors.STAIRCASE_DOWN:
        this.color('rgb(30,20,10)');
        break;
    }

    return this;
  }
});

Crafty.c('Textfield', {
  init: function () {
    this.requires('2D')
        .attr({
          x: 0,
          y: 0,
          w: 0,
          h: 0
        });
    this._word = '';
    this._fontSize;

    this._limit = 20;
    this.isOn = false;

    this.bind('KeyDown', function (e) {
      var i;
      if (this.isOn) {
        if (e.keyCode >= 48 && e.keyCode <= 90) { //Alphanumeric keys
          for (i in Crafty.keys) {
            if (Crafty.keys[i] === e.keyCode) {
              this._word += i;
              this.drawWord();
              break;
            }
          }
        } else if (e.keyCode === Crafty.keys.BACKSPACE) {
          this._word = this._word.slice(0, -1);
          this.drawWord();
        }
      }
    });

    this.drawWord();
  },

  setFontSize: function (size) {
    this._fontSize = size;
    return this;
  },

  limit: function (limit) {
    this._limit = limit;
    return this;
  },

  setWord: function (word) {
    this._word = word;
    this.drawWord();
    return this;
  },

  getWord: function (word) {
    return this._word;
  },

  drawWord: function () {
    this.detach(this._txt);
    this.destroyWord();
    var shown = 0;
    if (this._word.length > this._limit) {
      shown = this._word.length - this._limit;
    }

    this._txt = Crafty.e('2D, Canvas, Text, Tween')
                      .textColor('#FFFFFF', 1);

    if (this._word.slice) {
      this._txt.text(this._word.slice(shown))
    }

    if (this._fontSize) {
      this._txt.textFont({'size' : this._fontSize+'px', 'family': Game.config.font});
    } else {
      this._txt.textFont({'size' : '24px', 'family': Game.config.font});
    }

    this._txt.attr({x: this._x,
                    y: this._y,
                    w: this._word.length * 24,
                    h: 24,
                    z: this._z,
                    alpha: this._alpha
                    });
    this.attach(this._txt);
    return this;
  },

  destroyWord: function () {
    if (this._txt !== undefined) {
      this._txt.destroy();
    }
    return this;
  },

  setTxtAlpha: function (al) {
    this._txt.attr({alpha: al});
  },

  setMode: function (mode) {
    this.isOn = mode;
    return this;
  }
});

Crafty.c('SaveMenuBindings', {
  init: function () {
    this.isOn = false;
    this.requires('Tween')
      .bind('viewSave', function () {
        this.isOn = true;
        this.tween({alpha: 1}, 5);
      })
      .bind('closeSave', function () {
        this.isOn = false;
        this.tween({alpha: 0}, 5);
      });
  }
});

Crafty.c('LoadMenuBindings', {
  init: function () {
    this.isOn = false;
    this.requires('Tween')
      .bind('viewLoad', function () {
        this.tween({alpha: 1}, 5);
        this.isOn = true;
      })
      .bind('closeLoad', function () {
        this.isOn = false;
        this.tween({alpha: 0}, 5);
      });
  }
});


Crafty.c('Box', {
  init: function () {
    this.requires('2D, Canvas, Color, SaveMenuBindings')
      .attr({
        x: 0,
        y: Game.config.canvasHeight / 2 - 20,
        w: Game.config.canvasWidth,
        h: 25,
        alpha: 0
      })
      .color('rgb(100,100,0)');
  }
});

/**
 * Player Controls
 */
Crafty.c('Controls', {
  init: function () {
    this.requires('Keyboard');
    this._player;
    this._gameFloor;
    this._monsters;
    this._dirTrigger = {
      OPEN: 'PlayerOpen',
      MOVE: 'PlayerMove',
      KICK: 'PlayerKick',
      FIGHT: 'PlayerFight',
      CLOSE: 'PlayerClose',
      LOOK: 'PlayerLook'
    };
    this._currDirTrigger = this._dirTrigger.MOVE;

    this.bind('KeyDown', function (e) {
      switch (e.keyCode) {
        case Crafty.keys.UP_ARROW:
          Crafty.trigger(this._currDirTrigger, {x: 0, y: -1});
          if (this._currDirTrigger != this._dirTrigger.LOOK)
            this._currDirTrigger = this._dirTrigger.MOVE;
        break;
        case Crafty.keys.DOWN_ARROW:
          Crafty.trigger(this._currDirTrigger, {x: 0, y: 1});
          if (this._currDirTrigger != this._dirTrigger.LOOK)
            this._currDirTrigger = this._dirTrigger.MOVE;
        break;
        case Crafty.keys.LEFT_ARROW:
          Crafty.trigger(this._currDirTrigger, {x:-1, y:0});
          if (this._currDirTrigger != this._dirTrigger.LOOK)
            this._currDirTrigger = this._dirTrigger.MOVE;
        break;
        case Crafty.keys.RIGHT_ARROW:
          Crafty.trigger(this._currDirTrigger, {x:1, y:0});
          if (this._currDirTrigger != this._dirTrigger.LOOK)
            this._currDirTrigger = this._dirTrigger.MOVE;
        break;
        case Crafty.keys.O: // For opening doors
          this._currDirTrigger = this._dirTrigger.OPEN;
        break;
        case Crafty.keys.A: // For applying items
        break;
        case Crafty.keys.C: // For closing doors or calling
          this._currDirTrigger = this._dirTrigger.CLOSE;
        break;
        case Crafty.keys.D: // For dropping stuff
        break;
        case Crafty.keys.E: // For eating food
        break;
        case Crafty.keys.SEMICOLON: // For looking around
          this._currDirTrigger = this._dirTrigger.LOOK;
          Crafty.trigger(this._currDirTrigger, {x: 0, y: 0});
        break;
        case Crafty.keys.F: // For fighting and firing
          if (e.shiftKey) {
            this._currDirTrigger = this._dirTrigger.FIGHT;
          }
        break;
        case Crafty.keys.H: // For general help
        break;
        case Crafty.keys.I: // For seeing the inventory
        break;
        case Crafty.keys.J: // For jumping
        break;
        case Crafty.keys.K: // For kicking
          this._currDirTrigger = this._dirTrigger.KICK;
          break;
        case Crafty.keys.COMMA: // For picking up stuff on ground
          if (e.shiftKey) {
            Crafty.trigger('PlayerStaircase', 'down');
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
            Crafty.trigger('SaveGame');
          }
        break;
        case Crafty.keys.L:
          if (e.shiftKey) {
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
            Crafty.trigger('PlayerStaircase', 'up');
          }
        break;
        case Crafty.keys.ESC: // Escapes the situation
          Crafty.trigger('ControlClear')
          this._currDirTrigger = this._dirTrigger.MOVE;
        break;
      }
    });
  },

  setPlayer: function (player) {
    this._player = player;
    return this;
  },

  setGameFloor: function (gameFloor) {
    this._gameFloor = gameFloor;
  },

  setMonsters: function (monsters) {
    this._monsters = monsters;
  }
});

Crafty.c('Blackout', {
  init: function () {
    this.nextScene = 'Intro';
    this.changed = false;
    this.requires('2D, Canvas, Color, Tween, Persist')
      .attr({
        x: 0,
        y: 0,
        w: Crafty.viewport.width,
        h: Crafty.viewport.height,
        z: 99999,
        alpha: 0.0
      })
      .color('rgb(0,0,0)')
      .bind('blackOut', function () {
        this.tween({alpha: 1.0}, 30)
            .bind('TweenEnd', function () {
              if (this.changed) {
                this.destroy();
              } else {
                if (!this.changed) {
                  Crafty.scene(this.nextScene);
                  this.tween({alpha: 0}, 20)
                  this.changed = true;
                }
              }
            });
      });
  },

  setNextScene: function (next) {
    this.nextScene = next;
    return this;
  }
});


// The Grid component allows an element to be located
// on a grid of tiles
Crafty.c('Grid', {
  init: function () {
    this.requires('2D');
    this.attr({
      w: Game.config.tile.width - 1,
      h: Game.config.tile.height - 1
    });
  },

  // Locate this entity at the given position on the grid
  at: function (x, y) {
    if (x === undefined && y === undefined) {
      return {
        x: this.x / Game.config.tile.width - Game.config.padding.left,
        y: this.y / Game.config.tile.height - Game.config.padding.top
      };
    } else {
      this.attr({
        x: (x + Game.config.padding.left) * Game.config.tile.width,
        y: (y + Game.config.padding.top) * Game.config.tile.height
      });
      return this;
    }
  }
});


// Button Components
Crafty.c('KeyBind', {
  init: function () {
    this._keys = {};
    this.isOn = true;

    this.bind('KeyDown', function (e) {
      if(this.isOn) {
        if (e.keyCode in this._keys) {
          this._keys[e.keyCode]();
        }
      }
    });
  },

  bindKey: function (keyCode, fun) {
    if (keyCode.length) {
      for (var i = 0; i < keyCode.length; i++) {
        this._keys[keyCode[i]] = fun;
      }
    } else {
      this._keys[keyCode] = fun;
    }

    return this;
  },

  setMode: function (on) {
    this.isOn = on;
  }
});

Crafty.c('Target', {
  init: function () {
    var tileHeight = Game.config.tile.height;
    var tileWidth = Game.config.tile.width;

    this.requires('Grid, Canvas, Tween');
    // Create the horizontal pieces
    for (var i = 0; i < 2; i++) {
      for (var j = 0; j < 2; j++) {
        var temp = Crafty.e('2D, Canvas, Color')
                         .color('rgb(255,0,0)')
                         .attr({
                            x: this._x + i * tileWidth / 3 * 2,
                            y: this._y + j * tileHeight / 5 * 4,
                            w: tileWidth / 3,
                            h: tileHeight / 5,
                            z: 9999
                          });
        this.attach(temp);
      }
    }

    // Create the vertical pieces
    for (var i = 0; i < 2; i++) {
      for (var j = 0; j < 2; j++) {
        var temp = Crafty.e('2D, Canvas, Color')
                         .color('rgb(255,0,0)')
                         .attr({
                           x: this._x + i * tileWidth / 5 * 4,
                           y: this._y + j * tileHeight / 3 * 2,
                           w: tileWidth / 5,
                           h: tileHeight / 3,
                           z: 9999
                         });
        this.attach(temp);
      }
    }
  },

  setBlockAlpha: function (al) {
    if (al === undefined) {
      return this._alpha;
    } else {
      this._alpha = al;
      for (var i = 0; i < this._children.length; i++) {
        this._children[i].attr({alpha: al});
      }
      return this;
    }
  }
});

// Visual Effects Components
Crafty.c('Blinker', {
  init: function () {
    this.requires('Canvas, Tween');
    this._interval = 20,
    this._nextAlpha = 0;
    this.isOn = false;

    this.bind('StartBlink', function () {
      if (this.isOn) {
        this.tween({alpha: this._nextAlpha}, this._interval);
      }
    })
    .bind('TweenEnd', function () {
      this._nextAlpha = 1 - this._nextAlpha;
      if (this.isOn) {
        this.trigger('StartBlink');
      }
    });
  },

  startBlink: function () {
    this.isOn = true;
    this.trigger('StartBlink');
    return this;
  },

  stopBlink: function() {
    this.isOn = false;
    this._nextAlpha = 1;
    this.tween({alpha: 1}, 1);
    return this;
  },

  interval: function(period) {
    if (period === undefined) {
      return this._interval;
    } else {
      this._interval = period;
      return this;
    }
  }
});

Crafty.c('StatusText', {
  init: function () {
    this.requires('2D, Canvas');
    this.statusText = [];
    this.realText = [];
    this.moveY = 20;
    this._fontSize = 16;
    this.attr({
      x: 0,
      y: 0,
      w: 20,
      h: 30,
      z: 9999,
      alpha: 0
    });
  },

  setFontSize: function (size) {
    this._fontSize = size;
    return this;
  },

  sgVisible: function (vis) {
    for (var i = 0; i < this.statusText.length; i++) {
      this.realText[i].setTxtAlpha((vis ? 1 :0));
    }
    this.attr({alpha: (vis ? 1 : 0)});
    return this;
  },

  updateRealText: function () {
    // Make more textfields if insufficient
    // Else just make them invisible
    var diff = this.statusText.length - this.realText.length;
    if (diff > 0) {
      // insufficient textfields
      for (var i = 0; i < diff; i++) {
        var temp = Crafty.e('Textfield')
                         .attr({
                           x: this._x,
                           y: this._y,
                           z: this._z,
                           w: this._w,
                           h: this._h,
                           alpha: this._alpha
                         })
                         .limit(50)
                         .setFontSize(this._fontSize)
                         .setMode(false);
        this.realText.push(temp);
      }
    } else if (diff < 0) {
      // Too many textfields
      for (var i = this.realText.length + diff; i < this.realText.length; i++) {
        this.realText[i].setWord('').attr({alpha: 0});
      }
    }
    for (var i = 0; i < this.statusText.length; i++) {
      var str = '';
      // If the status is blank, just display the value
      if (this.statusText[i].status === '') {
        str =  this.statusText[i].value;
      } else {
        str = this.statusText[i].status+' : '+this.statusText[i].value;
      }
      this.realText[i]
          .setWord(str)
          .setFontSize(this._fontSize)
          .attr({
            x: this._x,
            y: this._y + this.moveY * i
          });
    }
  },

  flush: function () {
    this.statusText = [];
    this.updateRealText();
    return this;
  },

  putStatus: function (stat, val) {
    for (var i = 0; i < this.statusText.length; i++) {
      if (this.statusText[i].status === stat) {
        this.statusText[i].value = val;
        this.updateRealText();
        return this;
      }
    }
    this.statusText.push({status: stat, value: val});
    var l = this.statusText.length;
    this.updateRealText();
    return this;
  },

  removeStatus: function (status) {
    var temp = [];
    for (var i = 0; i < this.statusText.length; i++) {
      var stat = this.statusText.shift();
      if (stat.status === status) {
        this.statusText = temp.concat(this.statusText);
        this.updateRealText();
        return this;
      } else {
        temp.push(stat);
      }
    }
    this.statusText = temp;
    this.updateRealText();
    return this;
  }
});

Crafty.c('MainText', {
  init: function () {
    this.sentences = [];
    this.lineLimit = 6;
    this.charLimit = 100;
    this._fontSize = 16;
    this.startY = Crafty.viewport.height - this._fontSize * 3;
    this.startX = 20;
    this.moveY = this._fontSize;
    this.bind('SendMainText', function (text) {
      this.append(text);
    });
  },

  process: function (word) {
    var newSentences = [];
    var words = word.split(' ');
    var str = '';
    for (var i = 0; i < words.length; i++) {
      if (str.length + words[i].length < this.charLimit) {
        str += words[i] + ' ';
      } else {
        var temp = Crafty.e('Textfield, Tween')
                         .setMode(false)
                         .attr({
                            x: this.startX,
                            y: this.startY,
                            w: this.charLimit,
                            h: 30,
                            z: 9999,
                            alpha: 0
                          })
                         .setFontSize(this._fontSize)
                         .limit(this.charLimit)
                         .setWord(str);
        newSentences.push(temp);
        str = '';
      }
    }
    var temp = Crafty.e('Textfield, Tween')
                 .setMode(false)
                 .attr({
                    x: this.startX,
                    y: this.startY,
                    w: this.charLimit,
                    h: 24,
                    z: 9999,
                    alpha: 0
                  })
                 .setFontSize(this._fontSize)
                 .limit(this.charLimit)
                 .setWord(str);
    newSentences.push(temp);
    return newSentences;
  },

  flush: function () {
    for (var i = 0; i < this.lineLimit; i++) {
      this.append('');
    }
  },

  append: function (word) {
    var newSentences = this.process(word);
    for (var i = 0; i < newSentences.length; i++) {
      // make top sentence tween to invi
      if (this.sentences.length === this.lineLimit) {
        var top = this.sentences.shift();
        top.setWord('');
        top.destroy();
      }
      // move every sentence up
      this.sentences.push(newSentences[i]);
      newSentences[i]._txt.attr({alpha: 1});

      for (var j = 0; j < this.sentences.length; j++) {
        this.sentences[j].attr({y: this.startY - (this.lineLimit - j) * this.moveY});
      }
    }
  }
});

// Accordion effect for the menu
Crafty.c('Accordion', {
  init: function () {
    this.requires('2D, Canvas, Tween');
    this._levels = 0;
    this.currLevel = 0;
    this._moveDist = 0;
  },

  setInitialY: function(Y) {
    if (Y === undefined) {
      this._initialY = this._y;
    } else {
      this._initialY = Y;
    }
    return this;
  },

  setMoveDist: function (num) {
    this._moveDist = num;
    return this;
  },

  numLevels: function (num) {
    this._levels = num;
    return this;
  },

  setLevel: function (num) {
    while(this.currLevel !== num) {
      if (this.currLevel < num) {
        this.moveDown(num);
      } else {
        this.moveUp(num);
      }
    }
    return this;
  },

  moveUp: function (lvl) {
    var moves = lvl || 1;
    this.currLevel -= moves;
    var tweener = {
      y: this._initialY + this.currLevel * this._moveDist
    };

    if (this.currLevel > this._levels || this.currLevel < -this._levels) {
      tweener.alpha = 0;
    } else {
      tweener.alpha = 1 - Math.abs(this.currLevel) / this._levels;
    }

    this.tween(tweener, 5);
    return this;
  },

  moveDown: function (lvl) {
    var moves = lvl || 1;
    this.currLevel += moves;
    var tweener = {
      y: this._initialY + this.currLevel * this._moveDist
    };

    if (this.currLevel > this._levels || this.currLevel < -this._levels) {
      tweener.alpha = 0;
    } else {
      tweener.alpha = 1 - Math.abs(this.currLevel) / this._levels;
    }

    this.tween(tweener, 5);
    return this;
  }
});


Crafty.c('AccordionText', {
  init: function () {
    this._txt = '';
    // this.requires('Accordion, Text, Canvas')
    //   .text(this._txt)
    //   .textColor('#FFFFFF')
    //   .textFont({'size' : '24px', 'family': Game.config.font});
    this.requires('Accordion, Canvas, Visibility, Color')
        .color('rgb(255,0,0)')
        .attr({
          x: 10,
          y: 10
        });
  },

  word: function (str) {
    if (str === undefined || str === '') {
      return this._txt;
    } else {
      this._txt = str;
      // this.text(this._txt);
      return this;
    }
  }

});

// An Accordion menu
Crafty.c('AccordMenu', {
  init: function () {
    this.requires('2D, Canvas');
    this._options = [];
    this.isOn = false;
    this.currOption = undefined;
    this._levels = 8;
    this._moveDist = 40;
  },

  setMode: function (val) {
    this.isOn = val;
    return this;
  },

  setOptions: function (arr) {
    var i;
    if (!arr.length) return;

    // Destroy the old options
    for(i = 0; i < this._options.length; i++) {
      this.detach(this._options[i]);
      this._options[i].destroy();
    }
    this._options = [];

    // Add in the new options
    for(i = 0; i < arr.length; i++) {
      var ent = Crafty.e('AccordionText')
                  .attr({
                    x: this._x,
                    y: this._y,
                    w: this._w,
                    h: this._h
                  })
                  .setInitialY()
                  .word(arr[i])
                  .numLevels(this._levels / 2)
                  .setMoveDist(this._moveDist)
                  .setLevel(i);

      this._options.push(ent);
      this.attach(ent);
    }

    this.currOption = 0;
    return this;
  },

  setVisible: function (vis) {
    this.attr({visible:vis});
    for(var i = 0; i < this._options.length; i++) {
      this._options[i].attr({visible:vis});
    }
    return this;
  },

  selectUp: function () {
    if (this.currOption === 0) return;
    this._options.map(function (ent) {ent.moveDown();});
    this.currOption--;
    return this;
  },

  selectDown: function () {
    if (this.currOption === this._options.length - 1) return;
    this._options.map(function (ent) {ent.moveUp();});
    this.currOption++;
    return this;
  },

  selectOption: function (num) {
    while (this.currOption !== num) {
      if (this.currOption < num) {
        this.selectDown();
      } else {
        this.selectUp();
      }
    }
    return this;
  },

  selected: function (str) {
    var i;
    if (str === undefined || str === '') {
      return this._options[this.currOption].word();
    } else {
      // move until selected
      for(i = 0; i < this._options.length; i++) {
        if(this._options[i].word() === str) {
          this.selectOption(i);
          break;
        }
      }
      return this;
    }
  }
});
