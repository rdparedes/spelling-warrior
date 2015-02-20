(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

window.onload = function () {
	
  	var game = new Phaser.Game(600, 400, Phaser.AUTO, 'spelling-warrior');

	// Variables globales
	game.player = {
		name: 'Will',
		level: 1,
		experience: 0,
		xpCap: 15,
		score: 0,
		stats: 
		{
			maxHp: 67,
			hp: 67,
			attack: 7,
			defense: 5
		},
		abilities:
		{
			attack: {
				// Nombre ataque : Fuerza
				'attack': 1,
				'special attack': 2
			}, 
			heal: {
				'cure': 50
			}
		}
	};

	game.questions = [];
	game.previousRoom = '';

	// Game States
	game.state.add('battle', require('./states/battle'));
	game.state.add('boot', require('./states/boot'));
	game.state.add('gameover', require('./states/gameover'));
	game.state.add('menu', require('./states/menu'));
	game.state.add('play', require('./states/play'));
	game.state.add('preload', require('./states/preload'));
	

	game.state.start('boot');
};
},{"./states/battle":9,"./states/boot":10,"./states/gameover":11,"./states/menu":12,"./states/play":13,"./states/preload":14}],2:[function(require,module,exports){
'use strict';

var BattleEnemy = function(game, x, y, enemyType) {

	this.tag = 'enemy';

    switch (enemyType) {
        case 'skeleton':
            Phaser.Sprite.call(this, game, x, y, 'skeleton');
            // Stats del enemigo
            this.stats = {
                maxHp: 12,
                hp: 12,
                attack: 4,
                speed: 2,
                level: 2,
                xp: 3
            };
            this.attacks = {
            	// Nombre ataque: [fuerza, probabilidad de uso]
            	'normal': [1, 85],
            	'strong': [2, 15]
            };
            break;
    }

    this.anchor.setTo(0.5, 1);
    this.smoothed = false;

    // Turno de atacar
    this.ready = false;		// Indica que está listo para ser colocado en cola de acciones
    this.executing = false;	// Indica si ya se está ejecutando acción
    this.done = false;		// Indica que ha terminado de ejecutarse
	this.damageDone = 0;

    // Temporizador para que el enemigo ataque
    this.battleTimer = this.game.time.create(false);
    this.battleTimer.loop(15000 / this.stats.speed + Math.floor(Math.random() * 900) + 1,
        function() { 
        	this.ready = true;	// Indicar que está listo para ser ejecutado
        	this.battleTimer.pause();	// Pausar temporizador hasta que se ejecute acción de este enemigo
        }, this);
};

BattleEnemy.prototype = Object.create(Phaser.Sprite.prototype);
BattleEnemy.prototype.constructor = BattleEnemy;

BattleEnemy.prototype.update = function() {
};

BattleEnemy.prototype.action = function(player, playerSprite) {

	this.executing = true;	// Indicar que se está ejecutando la acción del enemigo
	this.done = false;	// Indicar que todavía no ha terminado de ejecutarse

	var attackName = '';
	var temp = 0;

	// Elegir qué ataque usar
	var chosenAttack = Math.floor(Math.random() * 100);	// Aleatorio entre 1 y 100
	$.each(this.attacks, function(key, value) {
		// En cada iteración, si el aleatorio coincide con la probabilidad del ataque actual,
		// se rompe el bucle y se elige dicho ataque
		temp += value[1];
		if (chosenAttack <= temp) {
			attackName = key;
			return false;
		}
	});

	// Calcular daño
	this.damageDone = Math.floor(this.attacks[attackName][0]) +
					Math.floor(this.stats.attack / 2) -
					Math.floor(player.stats.defense / 3) + 
					Math.floor(Math.random() * this.stats.level); 

	// Animación de parpadeo
	var blink = this.game.time.events.repeat(75, 4, function() {
		if (this.tint == 0xFFFFFF)
			this.tint = 0x171700;
		else
			this.tint = 0xFFFFFF;
    }, this);
	
	// Al finalizar parpadeo
	blink.timer.onComplete.addOnce(function() {
		// Ejecutar animación de ataque enemigo


        player.stats.hp -= this.damageDone;
        (player.stats.hp <= 0) && (player.stats.hp = 0);

		this.done = true;	// Indicar que ha terminado de ejecutarse
		this.battleTimer.resume();	// Resumir temporizador de este enemigo

    	//console.log(this + " ataca con " + attackName + " y causa " + this.damageDone + " de daño.");

	}, this);	

};

module.exports = BattleEnemy;
},{}],3:[function(require,module,exports){
'use strict';

var BattlePlayer = function(game, x, y, frame) {

    this.tag = 'player';

    Phaser.Sprite.call(this, game, x, y, 'heroe-batalla', frame);
    this.anchor.setTo(0.5, 1);
    this.smoothed = false;

    // Animaciones de combate
    this.animations.add('player_idle', [0, 1, 2, 3], 8, true);
    this.animations.add('player_attack', [16, 17, 18, 19], 8, false);
    this.animations.add('player_struck', [12, 13, 14, 15], 8, false);
    this.animations.add('player_advance', [32, 33, 34, 35], 8, true);
    this.animations.add('player_retreat', [36, 37, 38, 39], 8, true);
    this.animations.add('player_victory', [40, 41, 42, 43], 4, true);
    this.animations.add('player_dead', [48, 49, 50, 51], 8, true);

    // Animación por defecto
    this.animations.play('player_idle');

    // Activar física en este objeto
    this.game.physics.arcade.enableBody(this);
    this.body.allowGravity = false;

    this.attackType = ''; // Tipo de ataque (correcto o fallido)
    //this.moving = false;

    this.executing = false; // Indica si ya se está ejecutando acción
    this.done = false; // Indica que ha terminado de ejecutarse
    this.damageDone = 0;

};

BattlePlayer.prototype = Object.create(Phaser.Sprite.prototype);
BattlePlayer.prototype.constructor = BattlePlayer;

BattlePlayer.prototype.update = function() {
};

BattlePlayer.prototype.action = function(enemy) {

    this.executing = true; // Indicar que se está ejecutando la acción del jugador
    this.done = false; // Indicar que todavía no ha terminado de ejecutarse

    var ability = '';
    var attackName = '';

    // Elegir ataque
    console.log("Pendiente: Añadir resto de habilidades y ataques");
    ability = this.game.player.abilities.attack;

    // Elegir habilidad
    switch (ability) {
        case 'attack':
            attackName = ability['attack'];
            break;
        case 'heal':
            break;
    }

    this.damageDone = Math.floor(ability['attack']) +
        Math.floor(this.game.player.stats.attack / 2) +
        Math.floor(Math.random() * (this.game.player.level + 1) );

    // Animación
    var x = this.x;	// Guardar coordenadas iniciales
    var y = this.y;

    this.animations.play('player_advance');
    var moveToEnemy = this.game.add.tween(this).to({
        x: enemy.x + 50,
        y: enemy.y
    }, 500, Phaser.Easing.Linear.None, true);

    moveToEnemy.onComplete.addOnce(function() {
        this.animations.play('player_attack');
    }, this);

    this.animations.getAnimation('player_attack').onComplete.addOnce(function() {
    	// Mostrar animación de ataque
    	

        // Mover de vuelta al lugar inicial
        this.animations.play('player_retreat');
        var moveToStart = this.game.add.tween(this).to({
            x: x,
            y: y
        }, 400, Phaser.Easing.Linear.None, true);

		// Al finalizar animación de ataque
        moveToStart.onComplete.addOnce(function() {
            this.animations.play('player_idle');

            (this.attackType == 'correct') && (enemy.stats.hp -= this.damageDone);
            (enemy.stats.hp <= 0) && (enemy.kill()); 

    		this.done = true;
        }, this);
    }, this);


};

module.exports = BattlePlayer;
},{}],4:[function(require,module,exports){
'use strict';

var PANEL_FADE_TIME = 100; // Tiempo de fade in y out del panel
var secondColX = 0; // Posición X de las 3ra y 4ta preguntas

var Panel = require('./panel');

var DialogueBox = function(game, position, isTransparent) {

    Phaser.Group.call(this, game);

    // Posición del panel
    switch (position) {
        case 'low':
            var panelX = this.game.world.centerX;
            var panelY = 324;
            break;

        case 'battle':
            var panelX = this.game.world.centerX + this.game.world.width / 4 - 3;
            var panelY = 346;
            break;

        default:
            var panelX = this.game.world.centerX;
            var panelY = 324;
            break;
    }

    // Agregar panel de texto
    this.panel = new Panel(this.game, panelX, panelY);
    this.add(this.panel);
    this.panel.alpha = 0;

    // Dibujar sprite del Panel, a menos que se indique que es transparente
    if (!isTransparent) {
        this.panelFadeIn = this.game.add.tween(this.panel).to({
            alpha: 1
        }, PANEL_FADE_TIME, Phaser.Easing.Linear.None, true);
    }

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
        
        var textX = this.panel.x - this.panel.width / 2 + 24;
        var textY = this.panel.y - this.panel.height / 2 + 10; // Posición de la línea inicial
        var lineHeight = 24; // Espacio entre líneas
        
        // Agregar texto
        this.text = this.game.add.group();
        this.add(this.text);

        if (msg) {
            // Crear un text por cada línea de diálogo
            for (var i = 0; i < msg.length; i++) {
                this["text" + i] = this.game.add.text(textX, textY, "", this.game.paragraphFont, this.text);
                this["text" + i].setShadow(0.5, 0.5, '#111', 2);
                textY += lineHeight;
            }
            RenderText(this, msg);
        } else {
            this.writingTimer = this.game.time.events.repeat(0, 0, function(){}, this);
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

        // Al finalizar la escritura, se activa el semáforo de que se puede continuar
        this.writingTimer.timer.onComplete.addOnce(function() {
            // Si hay preguntas, mostrarlas
            if (this.hasQuestions) {
                if (question1 !== undefined) {
                    this.txtQuestion1.inputEnabled = true;
                    this.txtQuestion1.x = textX + 25;
                    this.txtQuestion1.y = textY + 9;
                    this.txtQuestion1.visible = true;
                }
                if (question2 !== undefined) {
                    this.txtQuestion2.inputEnabled = true;
                    this.txtQuestion2.x = textX + 25;
                    this.txtQuestion2.y = textY + 35;
                    this.txtQuestion2.visible = true;

                    if (this.txtQuestion1.width >= this.txtQuestion2.width)
                        secondColX = this.txtQuestion1.x + this.txtQuestion1.width + 42;
                    else
                        secondColX = this.txtQuestion2.x + this.txtQuestion2.width + 42;
                }

                if (question3 !== undefined) {
                    this.txtQuestion3.inputEnabled = true;
                    this.txtQuestion3.x = secondColX;
                    this.txtQuestion3.y = textY + 9;
                    this.txtQuestion3.visible = true;
                }
                if (question4 !== undefined) {
                    this.txtQuestion4.inputEnabled = true;
                    this.txtQuestion4.x = secondColX;
                    this.txtQuestion4.y = textY + 35;
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
},{"./panel":7}],5:[function(require,module,exports){
'use strict';

var FacePlayer = function(game, x, y, frame) {
    Phaser.Sprite.call(this, game, x, y, 'heroe-faces', frame);

    // initialize your prefab here

};

FacePlayer.prototype = Object.create(Phaser.Sprite.prototype);
FacePlayer.prototype.constructor = FacePlayer;

FacePlayer.prototype.update = function() {

    // write your prefab's specific update code here

};

module.exports = FacePlayer;
},{}],6:[function(require,module,exports){
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
},{}],7:[function(require,module,exports){
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
},{}],8:[function(require,module,exports){
'use strict';

var upKey;
var rightKey;
var downKey;
var leftKey;
var walkSpeed = 120;
var xClick = 0; // Coordenada X del último click
var yClick = 0; // Coordenada Y del último click

var Player = function(game, x, y, frame) {
    Phaser.Sprite.call(this, game, x, y, 'heroe', frame);
    this.anchor.setTo(0.5, 1);

    // Vars
    this.isTalking = false;
    this.isMovingToPointer = false;


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

    // Mover jugador a click
    this.game.input.onDown.add(function(position) {
        if (!this.isTalking) {
            xClick = position.x;
            yClick = position.y;
            this.isMovingToPointer = true;
        }
    }, this);

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

    // Si no se está moviendo hacia el cursor
    this.body.velocity.setTo(0, 0); // Detener

    // Si ha llegado a donde se hizo click, debe detenerse
    if (Phaser.Rectangle.contains(this.body, xClick, yClick))
        this.isMovingToPointer = false;

    // Si no está hablando, puede moverse
    if (!this.isTalking) {
        // Input con mouse / toque
        if (this.isMovingToPointer) {
            this.game.physics.arcade.moveToXY(this, xClick, yClick, walkSpeed);
            var angleBetween = this.game.physics.arcade.angleToXY(this, xClick, yClick);

            switch (true) {
                case (angleBetween >= -0.75 && angleBetween <= 0.75):
                	this.animations.play('player_walk_right');
                    break;
                case (angleBetween >= 0.76 && angleBetween <= 2.25):
                	this.animations.play('player_walk_down');
                    break;
                case (angleBetween >= 2.26 || angleBetween <= -2.26):
                	this.animations.play('player_walk_left');
                    break;
                case (angleBetween >= -2.25 && angleBetween <= -0.76):
                	this.animations.play('player_walk_up');
                    break;
            };
        }

        // Input con teclado
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
    } else {
        this.isMovingToPointer = false;
        this.animations.stop(null, true);
    }

    // Si se presiona una de las teclas de movimiento, ya no moverse al puntero
    if (upKey.isDown || rightKey.isDown || downKey.isDown || leftKey.isDown)
        this.isMovingToPointer = false;

    // Si las teclas de dirección no están presionadas, detener la animación de movimiento
    if (!upKey.isDown && !rightKey.isDown && !downKey.isDown && !leftKey.isDown && !this.isMovingToPointer) {
        this.animations.stop(null, true);
    }

};

module.exports = Player;
},{}],9:[function(require,module,exports){
'use strict';

var BattlePlayer = require('../prefabs/battle-player');
var BattleEnemy = require('../prefabs/battle-enemy');
var FacePlayer = require('../prefabs/face-player');
var DialogueBox = require('../prefabs/dialogue-box');

var hpMaxWidth = 84;
var actionQueue = [];

function Battle() {}

Battle.prototype = {
    preload: function() {

    },
    create: function() {

        this.xpGained = 0;
        this.leveledUp = false;
        this.playerDead = false;

        // ------------------------
        // Cargar fondo de batalla
        // ------------------------
        this.battleBack = this.game.add.sprite(0, 0, 'battle-grass');

        // ------------------------
        // Cargar UI
        // ------------------------
        this.panelTop = this.game.add.sprite(0, 0, 'panel-top');
        this.panelBottom = this.game.add.sprite(
            this.game.world.width - this.game.cache.getImage('panel-bottom').width + 2,
            this.game.world.height - this.game.cache.getImage('panel-bottom').height,
            'panel-bottom');

        // Crear grupo: Panel de estado del jugador
        this.battleStatus = this.game.add.group();
        this.battleStatus.Pane = this.game.add.sprite(
            0,
            this.game.world.height - this.game.cache.getImage('panel-battlestatus').height,
            'panel-battlestatus');
        this.battleStatus.add(this.battleStatus.Pane);

        // Cara de jugador
        this.facePlayer = new FacePlayer(
            this.game,
            this.battleStatus.Pane.x + 10,
            this.battleStatus.Pane.y + 15,
            0);
        this.game.add.existing(this.facePlayer);
        this.facePlayer.scale.x = 0.7;
        this.facePlayer.scale.y = 0.7;

        // Textos - Panel de estado jugador
        this.battleStatus.playerName = this.game.add.text(
            this.battleStatus.Pane.x + 83, // X relativo al padre
            this.battleStatus.Pane.y + 15, // Y relativo al padre
            this.game.player.name,
            this.game.paragraphFont,
            this.battlestatus);
        this.battleStatus.hpLabel = this.game.add.text(
            this.battleStatus.Pane.x + 83, // X relativo al padre
            this.battleStatus.Pane.y + 44, // Y relativo al padre
            "HP", {
                font: "13px Molengo",
                fill: "#fffb00"
            },
            this.battlestatus);

        // Contenedor barra de HP
        this.battleStatus.hpContainer = this.game.add.sprite(
            this.battleStatus.Pane.x + 81,
            this.battleStatus.hpLabel.y + this.battleStatus.hpLabel.height - 6,
            'panel-hpcontainer');
        this.battleStatus.add(this.battleStatus.hpContainer);

        // Barra de HP
        this.battleStatus.hpBar = this.game.add.graphics(this.battleStatus.hpContainer.x + 4,
            this.battleStatus.hpContainer.y + 3);
        this.battleStatus.hpBar.lineStyle(0);
        this.battleStatus.hpBar.beginFill(0xff2600, 1);
        this.battleStatus.hpBar.drawRect(0, 0, hpMaxWidth, 16);
        this.battleStatus.add(this.battleStatus.hpBar);
        // Asignar ancho inicial según hp del jugador
        this.battleStatus.hpBar.width = this.game.player.stats.hp / this.game.player.stats.maxHp * hpMaxWidth;


        // Texto - Hp
        this.battleStatus.hpText = this.game.add.text(
            this.battleStatus.hpContainer.x + this.battleStatus.hpContainer.width / 2,
            this.battleStatus.hpContainer.y + this.battleStatus.hpContainer.height / 2,
            this.game.player.stats.hp + " / " + this.game.player.stats.maxHp, {
                font: "13px Molengo",
                fill: "#ffffff"
            },
            this.battlestatus);
        this.battleStatus.hpText.anchor.setTo(0.5, 0.5);

        // ------------------------
        // Cargar Enemigos
        // ------------------------
        this.enemies = [];
        this.loadEnemies(this.enemies, 'skeleton', 1);

        // ------------------------
        // Cargar Jugador
        // ------------------------
        this.battlePlayer = new BattlePlayer(this.game, this.game.world.width - 150, 240);
        this.game.add.existing(this.battlePlayer);

        //Comenzar turnos
        this.enemies.forEach(function(enemy) {
            enemy.battleTimer.start();
        }, this);
        this.playerTurn();

    },

    playerTurn: function() {

        // Seleccionar de una pregunta al azar del arreglo de preguntas
        var questionIndex = Math.floor(Math.random() * this.game.questions.length);
        var questionObj = this.game.questions[questionIndex];

        var msg = [
            questionObj.text
        ];

        var questions = [];
        for (var i = 0; i < 4; i++)
            (questionObj.answers[i] !== undefined) && (questions[i] = questionObj.answers[i]);

        var correctAnswer = questionObj.correct;

        // Crear pregunta con los elementos obtenidos del arreglo de preguntas
        this.createDialogue(msg, questions[0], questions[1], questions[2], questions[3], correctAnswer);
    },

    // Carga enemigos en pantalla y los alinea (máximo = 4)
    loadEnemies: function(enemiesArray, type, quantity) {
        // Punto inicial de enemigos
        var x = 150;
        var y = 245;
        var yDistance = 35;

        for (var i = 0; i < quantity; i++) {
            enemiesArray.push(this.game.add.existing(new BattleEnemy(this.game, 0, 0, type)));
        }

        // Alinear enemigos
        if (this.enemies.length == 1) {
            enemiesArray[0].x = x;
            enemiesArray[0].y = y;
        } else {
            // GRID:
            // Enemigo 0 = enemigo de atrás
            // Enemigo 1 = enemigo del medio arriba
            // Enemigo 2 = enemigo del medio abajo
            // Enemigo 3 = enemigo de adelante
            switch (this.enemies.length) {
                case 2:
                    enemiesArray[0].x = x - enemiesArray[0].width * 0.75;
                    enemiesArray[0].y = y + yDistance;
                    enemiesArray[1].x = x + enemiesArray[1].width * 0.75;
                    enemiesArray[1].y = y - yDistance;
                    break;
                case 3:
                    enemiesArray[0].x = x - enemiesArray[0].width * 0.75;
                    enemiesArray[0].y = y;
                    enemiesArray[1].x = x + enemiesArray[1].width * 1.25;
                    enemiesArray[1].y = y - yDistance;
                    enemiesArray[2].x = x + enemiesArray[1].width * 0.75;
                    enemiesArray[2].y = y + yDistance;
                    break;
                case 4:
                    enemiesArray[0].x = x - enemiesArray[0].width * 0.75;
                    enemiesArray[0].y = y;
                    enemiesArray[1].x = x + enemiesArray[1].width * 1.25;
                    enemiesArray[1].y = y - yDistance;
                    enemiesArray[2].x = x + enemiesArray[1].width * 0.75;
                    enemiesArray[2].y = y + yDistance;
                    enemiesArray[3].x = x + enemiesArray[1].width * 2.5;
                    enemiesArray[3].y = y;
                    break;
            }
        }
    },

    // Agregar diálogo de la parte inferior
    createDialogue: function(msg, question1, question2, question3, question4, correctAnswer) {
        // Crea el objeto si no existe
        if (this.dialogueBox === undefined) {
            this.dialogueBox = new DialogueBox(this.game, 'battle', true);
            this.game.add.existing(this.dialogueBox);
        }

        // Añade texto
        if (this.dialogueBox.canContinue) {
            this.dialogueBox.addText(msg, question1, question2, question3, question4);

            // Añadir evento de click a las preguntas
            this.dialogueBox.txtQuestion1.events.onInputDown.addOnce(function() {
                var answerId = 1;
                this.playerAction(answerId == correctAnswer);
            }, this);

            if (this.dialogueBox.txtQuestion2 !== undefined)
                this.dialogueBox.txtQuestion2.events.onInputDown.addOnce(function() {
                    var answerId = 2;
                    this.playerAction(answerId == correctAnswer);
                }, this);

            if (this.dialogueBox.txtQuestion3 !== undefined)
                this.dialogueBox.txtQuestion3.events.onInputDown.addOnce(function() {
                    var answerId = 3;
                    this.playerAction(answerId == correctAnswer);
                }, this);

            if (this.dialogueBox.txtQuestion4 !== undefined)
                this.dialogueBox.txtQuestion4.events.onInputDown.addOnce(function() {
                    var answerId = 4;
                    this.playerAction(answerId == correctAnswer);
                }, this);
        }
    },

    // Destruir cuadro de diálogo
    destroyDialogue: function() {
        // Asegurarse que el objeto esté definido antes de destruirlo
        if (this.dialogueBox !== undefined)
        // Si se ha terminado de escribir
            if (this.dialogueBox.canContinue) {
                this.dialogueBox.destroy(true); 
                delete this.dialogueBox;
            }
    },

    playerAction: function(correctAnswer) {
        // Primero, destruir todos los eventos de las preguntas para evitar que se vuelva
        // a elegir otra opción
        for (var i = 1; i <= 4; i++)
            if (this.dialogueBox['txtQuestion' + i] !== undefined)
                this.dialogueBox['txtQuestion' + i].events.destroy();

            // Elegir ataque según la respuesta elegida
        if (correctAnswer) {
            this.showBattleMessage("Correct answer");
            this.battlePlayer.attackType = 'correct';
        } else {
            this.showBattleMessage("Wrong answer! Try again");
            this.battlePlayer.attackType = 'incorrect';
        }
        actionQueue.push(this.battlePlayer);
    },

    // Mensaje de 1 línea en la parte superior
    showBattleMessage: function(msg, autoDestroy) {
        var i = 0; // Pivot del texto
        var tempString = "";

        // Por defecto, autodestruir mensaje 
        autoDestroy = typeof autoDestroy !== 'undefined' ? autoDestroy : true;

        (this.battleMessage !== undefined) && (this.battleMessage.destroy());
        (this.destroyTimer !== undefined) && (this.destroyTimer.destroy());

        this.battleMessage = this.game.add.text(16, 8, "", this.game.paragraphFont);
        this.battleMessage.setShadow(0.5, 0.5, '#111', 2);

        this.game.time.events.repeat(22, msg.length / 2, function() {
            tempString += msg[i];
            if (i < (msg.length - 1))
                tempString += msg[i + 1];
            this.battleMessage.setText(tempString);
            i += 2;
        }, this);

        if (autoDestroy) {
            // Destruir mensaje después de 3 segundos
            this.destroyTimer = this.game.time.create(true);
            this.destroyTimer.add(Phaser.Timer.SECOND * 3, function() {
                this.battleMessage.destroy();
            }, this);
            this.destroyTimer.start();
        }
    },

    // Acción que se ejecuta al ganar combate
    win: function() {
        this.battlePlayer.animations.play('player_victory');
        this.showBattleMessage('Victory!', false);

        this.game.input.onDown.addOnce(function() {
            this.game.player.experience += this.xpGained;
            this.showBattleMessage('Gained ' + this.xpGained + ' points of experience', false);
            while (this.game.player.experience >= this.game.player.xpCap) {
                this.leveledUp = true;
                this.game.player.level++;
                this.game.player.xpCap *= 2;
            }

            if (this.leveledUp) {
                this.game.input.onDown.addOnce(function() {
                    this.showBattleMessage('Level ' + this.game.player.level + ' reached!', false);
                    this.game.input.onDown.addOnce(function() {
                        // Ir de vuelta al mapa anterior
                        this.goToRoom(this.game.previousRoom);
                    }, this);
                }, this);
            } else {
                this.game.input.onDown.addOnce(function() {
                    // Ir de vuelta al mapa anterior
                    this.goToRoom(this.game.previousRoom);
                }, this);
            }
        }, this);
    },

    lose: function() {
        this.playerDead = true;
        this.battlePlayer.animations.play('player_dead');
        this.showBattleMessage('Annihilated...', false);
        this.game.input.onDown.addOnce(function() {
            this.goToRoom('gameover');
        }, this);
    },

    update: function() {
        // Redibujar barra de HP de jugador
        this.battleStatus.hpBar.width = this.game.player.stats.hp / this.game.player.stats.maxHp * hpMaxWidth;
        this.battleStatus.hpText.setText(this.game.player.stats.hp + " / " + this.game.player.stats.maxHp);

        // Si el jugador ha perdido todo su HP, morir
        if (this.game.player.stats.hp <= 0 && !this.playerDead) {
            this.lose();
        }

        // Si el enemigo ha muerto, borrarlo del arreglo
        for (var i = 0; i < this.enemies.length; i++)
            if (!this.enemies[i].exists) {
                this.xpGained += this.enemies[i].stats.xp;
                this.enemies.splice(i, 1);
                // Si no quedan enemigos, ganar combate
                if (this.enemies.length <= 0) {
                    this.win();
                }
            }

            // Acciones de enemigos
        if (this.enemies.length > 0 && !this.playerDead)
            for (var i in this.enemies) {
                // Si está listo, agregarlo a la cola 
                if (this.enemies[i].ready) {
                    this.enemies[i].ready = false,
                    actionQueue.push(this.enemies[i]);
                }
            }

        // Cola de acciones del combate
        if (actionQueue.length >= 1 && !this.playerDead) {
            if (!actionQueue[0].executing) {
                // Realizar acción según quién está en la cola (enemigo o jugador)
                switch (actionQueue[0].tag) {
                    // Si es enemigo, enviarle el jugador para que lo ataque
                    case 'enemy':
                        actionQueue[0].action(this.game.player, this.battlePlayer);
                        break;
                        // Si es el jugador, enviarle un enemigo al azar
                    case 'player':
                        actionQueue[0].action(this.enemies[Math.floor(Math.random() * this.enemies.length)]);
                        break;
                }
            }
            // Cuando el objeto en cola termina de realizar sus acciones
            if (actionQueue[0].done && this.enemies.length > 0) {
                (actionQueue[0].tag == 'player') && this.playerTurn();
                actionQueue[0].executing = false;
                actionQueue.splice(0, 1);
            }
        }

    },

    // Ir a un room diferente
    goToRoom: function(room) {
        this.game.state.start(room);
    },

    paused: function() {
        // This method will be called when game paused.
    },
    render: function() {
        // Put render operations here.
    },
    shutdown: function() {
        // Borrar cola de acciones
        actionQueue = [];
        // Borrar cualquier diálogo que haya quedado creado
        this.destroyDialogue();
    }
};
module.exports = Battle;
},{"../prefabs/battle-enemy":2,"../prefabs/battle-player":3,"../prefabs/dialogue-box":4,"../prefabs/face-player":5}],10:[function(require,module,exports){
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
},{}],11:[function(require,module,exports){
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
},{}],12:[function(require,module,exports){
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
},{}],13:[function(require,module,exports){
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
        this.goToRoom('rmFirstScenario');
    },

    update: function() {},

    // Agregar cuadro de diálogo
    createDialogue: function(msg, question1, question2, question3, question4) {
        // Crea el objeto si no existe
        if (this.dialogueBox === undefined) {
            this.dialogueBox = new DialogueBox(this.game);
            this.game.add.existing(this.dialogueBox);
            // Indicar que el jugador está hablando
            if (this.player !== undefined) this.player.isTalking = true;
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
            // Luego de una animación, destruir el objeto
            fadeOut.onComplete.add(function() {
                this.dialogueBox.destroy(true);
                delete this.dialogueBox;
                // Indicar que el jugador ya no está hablando
                if (this.player !== undefined) this.player.isTalking = false;
            }, this);
        }
    },

    // Ir a un room diferente
    goToRoom: function(room) {
        this.saveLocation();
        this.game.state.start(room);
    },

    // Guardar ubicación actual de jugador
    saveLocation: function() {
        this.game.previousRoom = this.game.state.current;
        if (this.playerX !== undefined) {
            this.playerX = this.player.x;
            this.playerY = this.player.y;
        }
    },

    shutdown: function() {
        // Borrar cualquier diálogo que haya quedado creado
        if (this.dialogueBox !== undefined) {
            this.dialogueBox.destroy(true);
            delete this.dialogueBox;
        }
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
        switch (iDialogue) {
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
                }, this);
                this.dialogueBox.txtQuestion2.events.onInputDown.addOnce(function() {
                    this.startEvent(iDialogue + 1, 2);
                }, this);
                this.dialogueBox.txtQuestion3.events.onInputDown.addOnce(function() {
                    this.startEvent(iDialogue + 1, 3);
                }, this);
                this.dialogueBox.txtQuestion4.events.onInputDown.addOnce(function() {
                    this.startEvent(iDialogue + 1, 4);
                }, this);
                break;

            case 2:
                switch (answer) {
                    case 1:
                        this.createDialogue(["Option 1 chosen"]);
                        break;
                    case 2:
                        this.createDialogue(["Option 2 chosen"]);
                        break;
                    case 3:
                        this.createDialogue(["Option 3 chosen"]);
                        break;
                    case 4:
                        this.createDialogue(["Option 4 chosen"]);
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
                }, this);
                this.dialogueBox.txtQuestion2.events.onInputDown.addOnce(function() {
                    this.startEvent(iDialogue + 1, 2);
                }, this);
                this.dialogueBox.txtQuestion3.events.onInputDown.addOnce(function() {
                    this.startEvent(iDialogue + 1, 3);
                }, this);
                this.dialogueBox.txtQuestion4.events.onInputDown.addOnce(function() {
                    this.startEvent(iDialogue + 1, 4);
                }, this);
                break;

            case 4:
                switch (answer) {
                    case 1:
                        this.createDialogue(["Option 1 chosen"]);
                        break;
                    case 2:
                        this.createDialogue(["Option 2 chosen"]);
                        break;
                    case 3:
                        this.createDialogue(["Option 3 chosen"]);
                        break;
                    case 4:
                        this.createDialogue(["Option 4 chosen"]);
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
                    "answers accordingly."
                ]);

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

        // Coordenadas donde aparece el jugador
        this.playerX = typeof this.playerX !== 'undefined' ? this.playerX : this.game.world.centerX;
        this.playerY = typeof this.playerY !== 'undefined' ? this.playerY : this.game.world.centerY;

        // Creamos el jugador
        this.player = new Player(this.game, this.playerX, this.playerY);
        this.game.add.existing(this.player);

        // Grupo que contendrá todos los Npcs
        this.NPCs = this.game.add.group();

        // Crear los npcs
        this.guard1 = new Npc.Guard1(this.game, 200, this.game.world.centerY);
        this.NPCs.add(this.guard1);
        this.guard1.events.onInputDown.add(function() {
            this.guard1Dialogue(1);
        }, this);

    }

    this.update = function() {
        // object1, object2, collideCallback, processCallback, callbackContext
        this.game.physics.arcade.collide(this.player, this.NPCs, function(obj1, obj2) {
            obj2.body.velocity.x = 0;
            obj2.body.velocity.y = 0;
        }, null, this);

    }

    this.render = function() {
        //this.game.debug.spriteInfo(this.player, 32, 32);
    }

    this.guard1Dialogue = function(iDialogue, answer) {
        switch (iDialogue) {
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
                    "So you wanna go night night nigga?"
                ];
                var question1 = "Yes";
                var question2 = "No";

                this.createDialogue(msg, question1, question2);

                this.dialogueBox.txtQuestion1.events.onInputDown.addOnce(function() {
                    this.goToRoom('battle');
                }, this);
                this.dialogueBox.txtQuestion2.events.onInputDown.addOnce(function() {
                    console.log("Pendiente: Arreglar el salto que ocurre en los diálogos.");
                    this.destroyDialogue();
                }, this);
                break;
        }
    }

}

module.exports = Play;
},{"../prefabs/dialogue-box":4,"../prefabs/npc":6,"../prefabs/panel":7,"../prefabs/player":8}],14:[function(require,module,exports){
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

        // ------------------------
        // Cargar aquí assets del juego
        // ------------------------
        // UI
        this.load.image('logojackal', 'assets/img/logo-jackal.png');  // this = Pickartist
        this.load.image('fondo-mainmenu', 'assets/img/background-mainmenu.png');
        this.load.image('btn-comenzar', 'assets/img/btn-comenzar.png');
        this.load.image('btn-puntajes', 'assets/img/btn-puntajes.png');
        this.load.image('btn-creditos', 'assets/img/btn-creditos.png');
        this.load.image('panel', 'assets/img/panel-dialog.png');
        this.load.image('panel-top', 'assets/img/ui-paneltop.png');
        this.load.image('panel-bottom', 'assets/img/ui-panelbottom.png');
        this.load.image('panel-battlestatus', 'assets/img/ui-panelbottom2.png');
        this.load.image('panel-hpcontainer', 'assets/img/ui-hpcontainer.png');

        // Sprites
        this.load.image('skeleton', 'assets/img/skeleton.png');

        // Tilesets
        this.load.image('escena1', 'assets/img/escena-temp.png');
        // Spritesheets
        this.game.load.spritesheet('player', 'assets/img/player1.png', 32, 32);
        this.game.load.spritesheet('heroe', 'assets/img/heroe01.png', 32, 32);
        this.game.load.spritesheet('heroe-batalla', 'assets/img/heroe01-batalla.png', 96, 96);
        this.game.load.spritesheet('heroe-faces', 'assets/img/face-heroes.png', 96, 96);
        // Fondos
        this.load.image('battle-grass', 'assets/img/battleback-1.png');

        // Scripts
        this.game.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');

        // Configurar fuente
        this.game.paragraphFont = {
            font: "19px Molengo",
            fill: "#ffffff",
            align: "left",
            stroke: "black",
            strokeThickness: 1
        };

        // Cargar preguntas de batalla
        var self = this;
        
        $.getJSON('js/questions.json', { format: "json" })
            .done(function(data) {
                data.question.forEach(function(element, index){
                    self.game.questions.push(element);
                }, this);
            });

    },
    create: function() {
        this.preloadBar.cropEnabled = false;
    },
    update: function() {
        if (!!this.ready) {
            // Iniciar MainMenu
            this.game.state.start('play');
        }
    },
    onLoadComplete: function() {
        this.ready = true;
    }

};

module.exports = Preload;
},{}]},{},[1])