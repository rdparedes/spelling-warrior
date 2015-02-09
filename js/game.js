(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

window.onload = function () {
	
  	var game = new Phaser.Game(600, 400, Phaser.AUTO, 'pickup-artist');

	// Variables globales
	game.playerName = "";
	game.lives = 3;
	game.score = 0;

	// Game States
	game.state.add('battle', require('./states/battle'));
	game.state.add('boot', require('./states/boot'));
	game.state.add('gameover', require('./states/gameover'));
	game.state.add('menu', require('./states/menu'));
	game.state.add('play', require('./states/play'));
	game.state.add('preload', require('./states/preload'));
	

	game.state.start('boot');
};
},{"./states/battle":6,"./states/boot":7,"./states/gameover":8,"./states/menu":9,"./states/play":10,"./states/preload":11}],2:[function(require,module,exports){
'use strict';

var PANEL_LOW_Y = 400 - 64; // Posición en Y del panel cuando es bajo
var PANEL_FADE_TIME = 100; // Tiempo de fade in y out del panel

var Panel = require('./panel');

var DialogueBox = function(game) {

    Phaser.Group.call(this, game);

    // Panel contenedor de texto
    this.panel = new Panel(this.game, this.game.world.centerX, PANEL_LOW_Y);
    this.add(this.panel);
    this.panel.alpha = 0;
    this.panelFadeIn = this.game.add.tween(this.panel).to({
        alpha: 1
    }, PANEL_FADE_TIME, Phaser.Easing.Linear.None, true);

    // Indicar si se puede escribir nuevamente
    this.canContinue = true;
    this.hasQuestions = false;
};

DialogueBox.prototype = Object.create(Phaser.Group.prototype);
DialogueBox.prototype.constructor = DialogueBox;

DialogueBox.prototype.update = function() {

}

DialogueBox.prototype.addText = function(msg, question1, question2, question3, question4) {

    if (this.canContinue) {
        // Indicar que se ha comenzado a escribir
        this.canContinue = false;
        this.hasQuestions = false;
        var msgText = "";

        // Si ya existen objetos del texto, eliminarlos
        if (this.text !== undefined)
            this.text.destroy();

        // Agregar texto (vacío al inicio)
        this.text = this.game.add.group();
        this.add(this.text);
        var textX = this.panel.x - this.panel.width / 2 + 42;
        var textY = this.panel.y - this.panel.height / 2 + 12; // Posición de la línea inicial
        var lineHeight = 24; // Espacio entre líneas

        // Crear un text por cada línea de diálogo
        for (var i = 0; i < msg.length; i++) {
            this["text" + i] = this.game.add.text(textX, textY, "", this.game.paragraphFont, this.text);
            this["text" + i].setShadow(0.5, 0.5, '#111', 2);
            textY += lineHeight;
        }

        if (question1 !== undefined) {
            this.hasQuestions = true;
            this.txtQuestion1 = this.game.add.text(24, 350, question1, this.game.paragraphFont);
            this.txtQuestion1.visible = false;
            this.text.add(this.txtQuestion1);
        }
        if (question2 !== undefined) {
            this.txtQuestion2 = this.game.add.text(24, 350, question2, this.game.paragraphFont);
            this.txtQuestion2.visible = false;
            this.text.add(this.txtQuestion2);
        }
        if (question3 !== undefined) {
            this.txtQuestion3 = this.game.add.text(24, 350, question3, this.game.paragraphFont);
            this.txtQuestion3.visible = false;
            this.text.add(this.txtQuestion3);
        }
        if (question4 !== undefined) {
            this.txtQuestion4 = this.game.add.text(24, 350, question4, this.game.paragraphFont);
            this.txtQuestion4.visible = false;
            this.text.add(this.txtQuestion4);
        }

        RenderText(this, msg);

        // Al finalizar la escritura, se activa el semáforo de que se puede continuar
        this.writingTimer.timer.onComplete.addOnce(function() {
            // Si hay preguntas, mostrarlas
            if (this.hasQuestions) {
                if (question1 !== undefined) {
                    this.txtQuestion1.inputEnabled = true;
                    this.txtQuestion1.x = textX + 25;
                    this.txtQuestion1.y = textY + 10;
                    this.txtQuestion1.visible = true;
                }
                if (question2 !== undefined) {
                    this.txtQuestion2.inputEnabled = true;
                    this.txtQuestion2.x = textX + 25;
                    this.txtQuestion2.y = textY + 37;
                    this.txtQuestion2.visible = true;
                }
                if (question3 !== undefined) {
                    this.txtQuestion3.inputEnabled = true;
                    this.txtQuestion3.x = this.game.world.centerX;
                    this.txtQuestion3.y = textY + 10;
                    this.txtQuestion3.visible = true;
                }
                if (question4 !== undefined) {
                    this.txtQuestion4.inputEnabled = true;
                    this.txtQuestion4.x = this.game.world.centerX;
                    this.txtQuestion4.y = textY + 37;
                    this.txtQuestion4.visible = true;
                }
            }
            // Finalmente, se puede continuar
            this.canContinue = true;

        }, this)

    }

};

// Recibir un grupo de líneas de texto, y agregarles lo contenido en msg
function RenderText(that, msg) {
    var i = 0; // Pivot del elemento
    var j = 0; // Pivot del texto
    var tempString = ""; // Cadena temporal a la que se le irá agregando letra por letra
    var totalLength = 0; // Largo total de todo el texto

    msg.forEach(function(item) {
        totalLength += item.length;
    });

    that.writingTimer = that.game.time.events.repeat(22, totalLength / 2, function() {
        tempString += msg[i][j];
        if (j < (msg[i].length - 1))
            tempString += msg[i][j + 1];
        this.text.children[i].setText(tempString);
        j += 2;
        if (j >= (msg[i].length)) {
            i++;
            j = 0;
            tempString = "";
        }
    }, that);
}

module.exports = DialogueBox;
},{"./panel":4}],3:[function(require,module,exports){
'use strict';

var Npc = function(game, x, y, frame) {
    Phaser.Sprite.call(this, game, x, y, 'player', frame);

    this.anchor.setTo(0.5, 1);

    // Activar el click en este objeto
    this.inputEnabled = true;

    // Poner una animación por defecto en player
    this.animations.add('idle', [1]);
    this.animations.play('idle');

    // Activar física en este objeto
    this.game.physics.arcade.enableBody(this);

    // Settings
    this.body.setSize(26, 28);
    this.body.allowGravity = false;
    this.body.collideWorldBounds = true;
    this.body.immovable = true;

    this.smoothed = false;

    // Diálogo del NPC
    this.dialogue = "Hey...";

};

Npc.prototype = Object.create(Phaser.Sprite.prototype);
Npc.prototype.constructor = Npc;

Npc.prototype.update = function() {};

// NPC Guard 1
Npc.Guard1 = function(game, x, y, frame) {

    Npc.call(this, game, x, y, 'player', frame);

    // Agregar animaciones de personaje
    this.animations.add('guard1_walk_up', [43, 42, 43, 44], 10, true);
    this.animations.add('guard1_walk_right', [31, 30, 31, 32], 10, true);
    this.animations.add('guard1_walk_down', [7, 6, 7, 8], 10, true);
    this.animations.add('guard1_walk_left', [19, 18, 19, 20], 10, true);

    this.animations.play('guard1_walk_down');
    this.animations.stop();

};

Npc.Guard1.prototype = Object.create(Npc.prototype);
Npc.Guard1.prototype.constructor = Npc;

module.exports = Npc;
},{}],4:[function(require,module,exports){
'use strict';

var Panel = function(game, x, y, frame) {
    
    Phaser.Sprite.call(this, game, x, y, 'panel', frame);
    this.anchor.setTo(0.5, 0.5);

    // initialize your prefab here

};

Panel.prototype = Object.create(Phaser.Sprite.prototype);
Panel.prototype.constructor = Panel;

Panel.prototype.update = function() {

    // write your prefab's specific update code here

};

module.exports = Panel;
},{}],5:[function(require,module,exports){
'use strict';

var upKey;
var rightKey;
var downKey;
var leftKey;
var walkSpeed = 120;

var Player = function(game, x, y, frame) {
    Phaser.Sprite.call(this, game, x, y, 'player', frame);
    this.anchor.setTo(0.5, 1);

    // Agregar animaciones de personaje
    this.animations.add('player_walk_up', [37, 36, 37, 38], 10, true);
    this.animations.add('player_walk_right', [25, 24, 25, 26], 10, true);
    this.animations.add('player_walk_down', [1, 0, 1, 2], 10, true);
    this.animations.add('player_walk_left', [13, 12, 13, 14], 10, true);

    // Agregar teclas de dirección
    upKey = this.game.input.keyboard.addKey(Phaser.Keyboard.W);
    downKey = this.game.input.keyboard.addKey(Phaser.Keyboard.S);
    leftKey = this.game.input.keyboard.addKey(Phaser.Keyboard.A);
    rightKey = this.game.input.keyboard.addKey(Phaser.Keyboard.D);

    // Activar física en este objeto
    this.game.physics.arcade.enableBody(this);
    // Settings
    this.body.setSize(26, 28);
    this.body.allowGravity = false;
    this.body.collideWorldBounds = true;

    this.smoothed = false;
        
};

Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player;

Player.prototype.update = function() {

    this.body.velocity.x = 0;
    this.body.velocity.y = 0;

    if (upKey.isDown) {
        if (downKey.isUp && rightKey.isUp && leftKey.isUp) {
            this.body.velocity.y = -walkSpeed;
            this.animations.play('player_walk_up');
        } else {
            this.body.velocity.y = -walkSpeed;
        }
    }
    if (downKey.isDown) {
        if (upKey.isUp && rightKey.isUp && leftKey.isUp) {
            this.body.velocity.y = walkSpeed;
            this.animations.play('player_walk_down');
        } else {
            this.body.velocity.y = walkSpeed;

        }
    }
    if (rightKey.isDown) {
        if (upKey.isUp && downKey.isUp && leftKey.isUp) {
            this.body.velocity.x = walkSpeed;
            this.animations.play('player_walk_right');
        } else {
            this.body.velocity.x = walkSpeed;
        }
    }
    if (leftKey.isDown) {
        if (upKey.isUp && downKey.isUp && rightKey.isUp) {
            this.body.velocity.x = -walkSpeed;
            this.animations.play('player_walk_left');
        } else {
            this.body.velocity.x = -walkSpeed;
        }
    }

    if (!upKey.isDown && !rightKey.isDown && !downKey.isDown && !leftKey.isDown) {
        this.animations.stop(null, true);
    }

};

module.exports = Player;
},{}],6:[function(require,module,exports){
'use strict';

function Battle() {}
Battle.prototype = {
    preload: function() {
        // Override this method to add some load operations. 
        // If you need to use the loader, you may need to use them here.
    },
    create: function() {
        // This method is called after the game engine successfully switches states. 
        // Feel free to add any setup code here (do not load anything here, override preload() instead).
    },
    update: function() {
        // state update code
    },
    paused: function() {
        // This method will be called when game paused.
    },
    render: function() {
        // Put render operations here.
    },
    shutdown: function() {
        // This method will be called when the state is shut down 
        // (i.e. you switch to another state from this one).
    }
};
module.exports = Battle;
},{}],7:[function(require,module,exports){
'use strict';

// Boot start
function Boot() {}

Boot.prototype = {

    preload: function() {
        // Cargar assets del estado Preload
        this.load.image('preload-bar', 'assets/img/preloader-bar.png');
    },
    create: function() {
    	// El fondo en este estado será negro
		this.game.stage.backgroundColor = '#fff';
		
        // FullScreen and Window scale modes
    	this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.game.scale.refresh();
        
        // Start preload
        this.game.state.start('preload');
    }

};

module.exports = Boot;
},{}],8:[function(require,module,exports){
'use strict';

function GameOver() {}

GameOver.prototype = {
    preload: function() {

    },
    create: function() {
        var style = {
            font: '65px Arial',
            fill: '#ffffff',
            align: 'center'
        };
        this.titleText = this.game.add.text(this.game.world.centerX, 100, 'Game Over!', style);
        this.titleText.anchor.setTo(0.5, 0.5);

        this.congratsText = this.game.add.text(this.game.world.centerX, 200, 'You Win!', {
            font: '32px Arial',
            fill: '#ffffff',
            align: 'center'
        });
        this.congratsText.anchor.setTo(0.5, 0.5);

        this.instructionText = this.game.add.text(this.game.world.centerX, 300, 'Click To Play Again', {
            font: '16px Arial',
            fill: '#ffffff',
            align: 'center'
        });
        this.instructionText.anchor.setTo(0.5, 0.5);
    },
    update: function() {
        if (this.game.input.activePointer.justPressed()) {
            this.game.state.start('play');
        }
    }
};
module.exports = GameOver;
},{}],9:[function(require,module,exports){
'use strict';

function Menu() {}

Menu.prototype = {

    create: function() {
        var style = {
            font: '65px Arial',
            fill: '#ffffff',
            align: 'center'
        };

        this.titleText = this.game.add.text(this.game.world.centerX, 300, '\'Allo, \'Allo!', style);
        this.titleText.anchor.setTo(0.5, 0.5);

        // Cargar sprites
        this.imgLogo = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'logojackal');
        this.imgLogo.anchor.setTo(0.5, 0.5);

        // Ocultar 1ra imagen después de 2 segundos
        // Mostrar menú principal
        this.game.time.events.add(Phaser.Timer.SECOND * 2, function() {

            this.imgMainMenu = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'fondo-mainmenu');
            this.imgMainMenu.anchor.setTo(0.5, 0.5);

            // Agregar botones
            this.btnComenzar = this.game.add.button(this.game.width / 2, 200, 'btn-comenzar', this.comenzarClick, this);
            this.btnComenzar.anchor.setTo(0.5, 0.5);
            this.btnPuntajes = this.game.add.button(this.game.width / 2, 258, 'btn-puntajes', this.puntajesClick, this);
            this.btnPuntajes.anchor.setTo(0.5, 0.5);
            this.btnCreditos = this.game.add.button(this.game.width / 2, 316, 'btn-creditos', this.creditosClick, this);
            this.btnCreditos.anchor.setTo(0.5, 0.5);

        }, this);
    },
    update: function() {

    },
    comenzarClick: function() {
        // Handler del botón comenzar juego
        // Iniciar el estado Game
        this.game.state.start('play');
    }

};

module.exports = Menu;
},{}],10:[function(require,module,exports){
'use strict';

var DialogueBox = require('../prefabs/dialogue-box');
var Panel = require('../prefabs/panel');
var Player = require('../prefabs/player');
var Npc = require('../prefabs/npc');

var PANEL_FADE_TIME = 100; 

// Inicio de play
function Play() {}

Play.prototype = {

    create: function() {
        // Set bounds
        this.game.world.setBounds(0, 0, 600, 400);

        // Iniciar el sistema de física y poner la gravedad en 0
        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        // Agregar todas las escenas
        this.game.state.add('rmFirstScene', RmFirstScene);
        this.game.state.add('rmFirstScenario', RmFirstScenario);

        // Ir a la primera escena: Creación del personaje
        this.goToRoom('rmFirstScene');
    },

    update: function() {

    },

    // Agregar cuadro de diálogo
    createDialogue: function(msg, question1, question2, question3, question4) {
        // Crea el objeto si no existe
        if (this.dialogueBox === undefined) {
            this.dialogueBox = new DialogueBox(this.game);
            this.game.add.existing(this.dialogueBox);
        }
        // Añade texto al objeto
        if (this.dialogueBox.canContinue) {
            this.dialogueBox.addText(msg, question1, question2, question3, question4);
        }
    },

    // Destruir cuadro de diálogo
    destroyDialogue: function() {
        // Asegurarse que el objeto esté definido antes de destruirlo
        if (this.dialogueBox !== undefined)
        // Si se ha terminado de escribir
            if (this.dialogueBox.canContinue) {
                var fadeOut = this.game.add.tween(this.dialogueBox).to({ // Realizar animación
                    alpha: 0
                }, PANEL_FADE_TIME, Phaser.Easing.Linear.None, true);
                fadeOut.onComplete.add(function() {
                    this.dialogueBox.destroy(true); // Destruir el objeto al finalizar la animación
                    console.log(this.dialogueBox);
                }, this);
            }
    },

    // Crear panel
    createPanel: function() {
        this.game.add.existing(new Panel(this.game, this.game.world.centerX, this.game.height - 64));
    },

    // Ir a un room diferente
    goToRoom: function(room) {
        this.game.state.start(room);
    }

};


// ESCENA: PRIMERA (CREAR PERSONAJE)
///

RmFirstScene.prototype = new Play();

function RmFirstScene() {

    this.create = function() {
        this.startEvent(1);
    }

    this.startEvent = function(iDialogue, answer) {
        switch (iDialogue){
            case 1:
                var msg = [
                    "First and foremost, what's your name?"
                ];
                var question1 = "Kevin";
                var question2 = "Roberto";
                var question3 = "Rafael Correa";
                var question4 = "Kim Kardashian";
                this.createDialogue(msg, question1, question2, question3, question4);

                this.dialogueBox.txtQuestion1.events.onInputDown.addOnce(function() {
                        this.startEvent(iDialogue + 1, 1);
                },this);
                this.dialogueBox.txtQuestion2.events.onInputDown.addOnce(function() {
                        this.startEvent(iDialogue + 1, 2);
                },this);
                this.dialogueBox.txtQuestion3.events.onInputDown.addOnce(function() {
                        this.startEvent(iDialogue + 1, 3);
                },this);
                this.dialogueBox.txtQuestion4.events.onInputDown.addOnce(function() {
                        this.startEvent(iDialogue + 1, 4);
                },this);
            break;

            case 2:
                switch (answer){
                    case 1: 
                        this.createDialogue( ["Option 1 chosen"]);
                    break;
                    case 2:
                        this.createDialogue( ["Option 2 chosen"]);
                    break; 
                    case 3:
                        this.createDialogue( ["Option 3 chosen"]);
                    break; 
                    case 4:
                        this.createDialogue( ["Option 4 chosen"]);
                    break; 
                }
                this.game.input.onDown.addOnce(function() {
                    this.startEvent(iDialogue + 1);
                }, this);
            break;

            case 3:
                var msg = [
                    "Do you like pizza?"
                ];
                var question1 = "No way";
                var question2 = "Yes, it is my favorite meal";
                var question3 = "White power!";
                var question4 = "ASDSASD";
                this.createDialogue(msg, question1, question2, question3, question4);

                this.dialogueBox.txtQuestion1.events.onInputDown.addOnce(function() {
                        this.startEvent(iDialogue + 1, 1);
                },this);
                this.dialogueBox.txtQuestion2.events.onInputDown.addOnce(function() {
                        this.startEvent(iDialogue + 1, 2);
                },this);
                this.dialogueBox.txtQuestion3.events.onInputDown.addOnce(function() {
                        this.startEvent(iDialogue + 1, 3);
                },this);
                this.dialogueBox.txtQuestion4.events.onInputDown.addOnce(function() {
                        this.startEvent(iDialogue + 1, 4);
                },this);
            break;

            case 4:
                switch (answer){
                    case 1: 
                        this.createDialogue( ["Option 1 chosen"]);
                    break;
                    case 2:
                        this.createDialogue( ["Option 2 chosen"]);
                    break; 
                    case 3:
                        this.createDialogue( ["Option 3 chosen"]);
                    break; 
                    case 4:
                        this.createDialogue( ["Option 4 chosen"]);
                    break; 
                }
                this.game.input.onDown.addOnce(function() {
                    this.startEvent(iDialogue + 1);
                }, this);
            break;

            case 5:
                this.createDialogue(["This is a dialogue of several lines... One",
                            "two, three. This is a dialogue system similar to the ones found in",
                            "old rpgs. It has letter by letter rendering, and you can choose your",
                            "answers accordingly."]);
               
                this.game.input.onDown.addOnce(function() {
                    this.startEvent(iDialogue + 1);
                }, this);
            break;

            case 6:
                this.createDialogue(["Starting game..."]);
                this.game.input.onDown.addOnce(function() {
                    this.destroyDialogue();
                    this.goToRoom('rmFirstScenario');
                }, this);
            break;
        }
    }

}


// ESCENA: CUARTO DEL PERSONAJE
///

RmFirstScenario.prototype = new Play();

function RmFirstScenario() {

    this.create = function() {
        // Background
        this.game.add.sprite(0, 0, 'escena1');

        // Creamos el jugador
        this.player = new Player(this.game, this.game.world.centerX, this.game.world.centerY);
        this.game.add.existing(this.player);

        // Grupo que contendrá todos los Npcs
        this.NPCs = this.game.add.group();

        // Crear los npcs
        this.guard1 = new Npc.Guard1(this.game, 200, this.game.world.centerY);
        this.NPCs.add(this.guard1);
        this.guard1.events.onInputDown.add(function() {
                this.guard1Dialogue(1);
            },this);

    }

    this.update = function() {
         // object1, object2, collideCallback, processCallback, callbackContext
        this.game.physics.arcade.collide(this.player, this.NPCs, function(obj1, obj2) {
            obj2.body.velocity.x = 0;
            obj2.body.velocity.y = 0;
         } , null, this);
    }

    this.render = function() {
        
    }

    this.guard1Dialogue = function(iDialogue, answer) {
        switch (iDialogue){
            case 1:
                var msg = [
                    "Hello, my name is Hob, I'm a guard from the old",
                    "Empire days. I'm totally screwed now."
                ];

                this.createDialogue(msg);
                this.game.input.onDown.addOnce(function() {
                    this.guard1Dialogue(iDialogue + 1);
                }, this);
            break;

            case 2:
                var msg = [
                    "So you wanna fight nigga?"
                ];
                var question1 = "Yes";
                var question2 = "No";

                this.createDialogue(msg, question1, question2);

                this.dialogueBox.txtQuestion1.events.onInputDown.addOnce(function() {
                        this.guard1Dialogue(iDialogue + 1, 1);
                },this);
                this.dialogueBox.txtQuestion2.events.onInputDown.addOnce(function() {
                        this.destroyDialogue();
                },this);
            break;

            case 3:
                switch (answer) {
                    case 1:
                        // go to fight
                    break;

                    case 2:
                        
                    break;
                }
            break;
        }
    }

}

module.exports = Play;
},{"../prefabs/dialogue-box":2,"../prefabs/npc":3,"../prefabs/panel":4,"../prefabs/player":5}],11:[function(require,module,exports){
'use strict';

// Preload start
function Preload() {
    this.asset = null;
    this.ready = false;
}

Preload.prototype = {

    preload: function() {
        this.preloadBar = this.add.sprite(this.game.world.centerX, this.game.world.centerY + 128, 'preload-bar');
        this.preloadBar.anchor.setTo(0.5);

        this.load.onLoadComplete.addOnce(this.onLoadComplete, this);
        this.load.setPreloadSprite(this.preloadBar);

        // Cargar aquí assets del juego
        // Imágenes
        this.load.image('logojackal', 'assets/img/logo-jackal.png');  // this = Pickartist
        this.load.image('fondo-mainmenu', 'assets/img/background-mainmenu.png');
        this.load.image('btn-comenzar', 'assets/img/btn-comenzar.png');
        this.load.image('btn-puntajes', 'assets/img/btn-puntajes.png');
        this.load.image('btn-creditos', 'assets/img/btn-creditos.png');
        this.load.image('panel', 'assets/img/panel-dialog.png');
        this.load.image('escena1', 'assets/img/escena-temp.png');

        // Spritesheets
        this.game.load.spritesheet('player', 'assets/img/player1.png', 32, 32);

        // Llamar al script de Google WebFont Loader. Utiliza la función que se encuentra en utils
        this.game.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');

        // Configurar fuente
        this.game.paragraphFont = {
            font: "19px Molengo",
            fill: "#ffffff",
            align: "left",
            stroke: "black",
            strokeThickness: 1
        };

    },
    create: function() {
        this.preloadBar.cropEnabled = false;
    },
    update: function() {
        if (!!this.ready) {
            // Iniciar MainMenu
            this.game.state.start('menu');
        }
    },
    onLoadComplete: function() {
        this.ready = true;
    }

};

module.exports = Preload;
},{}]},{},[1])