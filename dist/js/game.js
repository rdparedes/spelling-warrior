(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

window.onload = function () {
	
  	var game = new Phaser.Game(600, 400, Phaser.AUTO, 'pickup-artist');

	// Variables globales
	game.playerName = "";
	game.lives = 3;
	game.score = 0;

	game.PANEL_LOW_Y = 400 - 64; // Posición en Y del panel cuando es bajo
	game.PANEL_FADE_TIME = 100; // Tiempo de fade in y out del panel
	game.PANEL_TEXT_X = 128;
	game.PANEL_TEXT_Y = 400 - 116;	// Posición en Y del texto de diálogo cuando es bajo


  // Game States
  game.state.add('boot', require('./states/boot'));
  game.state.add('gameover', require('./states/gameover'));
  game.state.add('menu', require('./states/menu'));
  game.state.add('play', require('./states/play'));
  game.state.add('preload', require('./states/preload'));
  

  game.state.start('boot');
};
},{"./states/boot":4,"./states/gameover":5,"./states/menu":6,"./states/play":7,"./states/preload":8}],2:[function(require,module,exports){
'use strict';

var Panel = require('./panel');

var DialogueBox = function(game) {

    Phaser.Group.call(this, game);

    // Panel contenedor de texto
    this.panel = new Panel(this.game, this.game.world.centerX, this.game.PANEL_LOW_Y);
    this.add(this.panel);
    this.panel.alpha = 0;
    this.panelFadeIn = this.game.add.tween(this.panel).to({
        alpha: 1
    }, this.game.PANEL_FADE_TIME, Phaser.Easing.Linear.None, true);

};

DialogueBox.prototype = Object.create(Phaser.Group.prototype);
DialogueBox.prototype.constructor = DialogueBox;

DialogueBox.prototype.update = function() {

}

DialogueBox.prototype.addText = function(msg, x, y) {

    var msgText = "";

    // Transformar el arreglo de texto en una sola String (msgText)
    msg.forEach(function(line) {
        msgText += line + "\n";
    });

    // Si ya existe un objeto de texto, eliminarlo (solo puede haber uno a la vez)
    if (this.text !== undefined)
        this.text.destroy();

    // Una vez que la animación del panel ha finalizado, comenzar a escribir
    //this.panelFadeIn.onComplete.add(function() {

        console.log("Pendiente: Evitar que se pueda pasar de texto antes de que termine de renderizarse el actual");

        // Agregar msgText
        this.text = this.game.add.text(x, y, "", this.game.paragraphFont)
        this.add(this.text);

        var i = 0;
        var tempString = ""; // Cadena temporal a la que se le irá agregando letra por letra
        // Recorrer cada letra del texto
        this.game.time.events.repeat(0.1, msgText.length, function() {
            tempString += msgText[i];
            this.text.setText(tempString);
            i++;
        }, this);
    //}, this);
       
};




module.exports = DialogueBox;
},{"./panel":3}],3:[function(require,module,exports){
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
},{}],4:[function(require,module,exports){
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
},{}],5:[function(require,module,exports){
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
},{}],6:[function(require,module,exports){
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
},{}],7:[function(require,module,exports){
'use strict';

var DialogueBox = require('../prefabs/dialogue-box');
var Panel = require('../prefabs/panel');

// Inicio de play
function Play() {}

Play.prototype = {

    create: function() {
        // Agregar todas las escenas
        this.game.state.add('rmFirstScene', RmFirstScene);
        this.game.state.add('rmPlayerRoom', RmPlayerRoom);

        // Ir a la primera escena: Creación del personaje
        this.goToRoom('rmFirstScene');
    },

    update: function() {

    },

    // Agregar cuadro de diálogo
    createDialogue: function(msg) {
        // Crea el objeto si no existe
        if (this.dialogueBox === undefined) {
            this.dialogueBox = new DialogueBox(this.game);
            this.game.add.existing(this.dialogueBox);
        }
        // Añade texto al objeto
        this.dialogueBox.addText(msg, this.game.PANEL_TEXT_X, this.game.PANEL_TEXT_Y);
    },

    // Destruir cuadro de diálogo
    destroyDialogue: function() {
        // Asegurarse que el objeto esté definido antes de destruirlo
        if (this.dialogueBox !== undefined) {
            var fadeOut = this.game.add.tween(this.dialogueBox).to({ // Realizar animación
                alpha: 0
            }, this.game.PANEL_FADE_TIME, Phaser.Easing.Linear.None, true);
            fadeOut.onComplete.add(function() {
                this.dialogueBox.destroy(); // Destruir el objeto al finalizar la animación
            }, this);
        }
    },

    // Crear panel
    createPanel: function() {
        this.game.add.existing(new Panel(this.game, this.game.world.centerX, this.game.height - 64))
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
        this.iDialogo = 1;
        this.msg = [
                        "Jugador:",
                        "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed",
                        "do eiusmod tempor incididunt ut labore et dolore magna",
                        "aliqua. Ut enim ad minim veniam..."
                    ];
        this.createDialogue(this.msg);

        this.game.input.onDown.add(function() {
            if (this.iDialogo <= 3) {
                switch (this.iDialogo) {
                    case 1:
                        this.msg = [
                            "Este es un mensaje de varias líneas. Cuando la",
                            "ví, me enamoré. Me enamoré como por vez primera.",
                            "Por ella sí, mi amor se fue",
                            "No sé por qué pero temblé al verla"
                        ];
                        break;
                    case 2:
                        this.msg = [
                            "Me tomó como 18 horas poder programar este puto sistema.",
                            "jajaja jejeje. ASDMAOSD Sólo falta agregarle el sonido cuando",
                            "las letras vayan corriendo. Pero eso queda como un extra por si",
                            "el tiempo alcanza."
                        ];
                        break;
                    case 3:
                    this.msg = [
                        "A la izquierda queda espacio para colocar la cara del personaje",
                        "como en los rpgs clásicos."
                    ];
                    break;
                }
                this.iDialogo++;
                this.createDialogue(this.msg);
                this.game.lives++;
            } else {
                this.destroyDialogue();
            }
        }, this);

    }

}


// ESCENA: CUARTO DEL PERSONAJE
///

RmPlayerRoom.prototype = new Play();

function RmPlayerRoom() {

    this.create = function() {
        console.log(lives);

        this.msg = ["Tienes " + this.game.lives + " vidas"];

        this.game.input.onDown.add(function() {
            this.createDialogue(this.msg);
        }, this);
    }

}

module.exports = Play;
},{"../prefabs/dialogue-box":2,"../prefabs/panel":3}],8:[function(require,module,exports){
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
        this.load.image('logojackal', 'assets/img/logo-jackal.png');  // this = Pickartist
        this.load.image('fondo-mainmenu', 'assets/img/background-mainmenu.png');
        this.load.image('btn-comenzar', 'assets/img/btn-comenzar.png');
        this.load.image('btn-puntajes', 'assets/img/btn-puntajes.png');
        this.load.image('btn-creditos', 'assets/img/btn-creditos.png');
        this.load.image('panel', 'assets/img/panel-dialog.png');

        // Llamar al script de Google WebFont Loader. Utiliza la función que se encuentra en utils
        this.game.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');

        // Configurar fuente
        this.game.paragraphFont = {
            font: "16px Molengo",
            fill: "#ffffff",
            align: "left",
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