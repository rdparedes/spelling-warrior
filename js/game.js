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
    Phaser.Sprite.call(this, game, x, y, enemyType);

    switch (enemyType) {
        case 'skeleton':
            // Stats del enemigo
            this.stats = {
                maxHp: 12,
                hp: 12,
                attack: 4,
                speed: 2,
                level: 2,
                xp: 6,
                score: 25
            };
            this.attacks = {
            	// Nombre ataque: [fuerza, probabilidad de uso]
            	'normal': [1, 85],
            	'strong': [2, 15]
            };
            // Cargar Sonidos
            this.attackSound = this.game.add.audio('attack-blow1', 1);
            break;
        case 'dark-knight':
            // Stats del enemigo
            this.stats = {
                maxHp: 42,
                hp: 42,
                attack: 12,
                speed: 3,
                level: 6,
                xp: 30,
                score: 95
            };
            this.attacks = {
                // Nombre ataque: [fuerza, probabilidad de uso]
                'normal': [1, 85],
                'strong': [2, 15]
            };
            // Cargar Sonidos
            this.attackSound = this.game.add.audio('attack-blow2', 1);
            break;
        case 'dragon-knight':
            // Stats del enemigo
            this.stats = {
                maxHp: 98,
                hp: 98,
                attack: 20,
                speed: 3,
                level: 10,
                xp: 96,
                score: 255
            };
            this.attacks = {
                // Nombre ataque: [fuerza, probabilidad de uso]
                'normal': [1, 85],
                'strong': [2, 15]
            };
            this.attackSound = this.game.add.audio('attack-hack2', 1);
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
        this.attackSound.play();

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

// Audio
var attackSound;
var missSound;

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

    // ------------------------
    // Cargar Sonidos
    // ------------------------
    attackSound = this.game.add.audio('attack-01', 0.5);
    missSound = this.game.add.audio('miss', 1);

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
        this.attackType == 'correct' ? attackSound.play() : missSound.play();
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
            if (enemy.stats.hp <= 0) {
               enemy.kill();
            }

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

var clickSound;

var DialogueBox = function(game, position, isTransparent) {

    Phaser.Group.call(this, game);

    // Posición del panel
    switch (position) {
        case 'low':
            var panelX = this.game.camera.view.centerX;
            var panelY = this.game.camera.y + 324;
            break;

        case 'battle':
            var panelX = this.game.camera.view.centerX + this.game.camera.width / 4 - 3;
            var panelY = this.game.camera.y + 346;
            break;

        default:
            var panelX = this.game.camera.view.centerX;
            var panelY = this.game.camera.y + 324;
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

    // Sonido click
    clickSound = this.game.add.audio('click', 1, false);
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
                    this.txtQuestion1.events.onInputDown.addOnce(function() { clickSound.play(); });
                    this.txtQuestion1.events.onInputOver.add(function() { this.txtQuestion1.addColor('yellow', 0); }, this);
                    this.txtQuestion1.events.onInputOut.add(function() { this.txtQuestion1.clearColors(); }, this);
                }
                if (question2 !== undefined) {
                    this.txtQuestion2.inputEnabled = true;
                    this.txtQuestion2.x = textX + 25;
                    this.txtQuestion2.y = textY + 35;
                    this.txtQuestion2.visible = true;
                    this.txtQuestion2.events.onInputDown.addOnce(function() { clickSound.play(); });
                    this.txtQuestion2.events.onInputOver.add(function() { this.txtQuestion2.addColor('yellow', 0); }, this);
                    this.txtQuestion2.events.onInputOut.add(function() { this.txtQuestion2.clearColors(); }, this);
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
                    this.txtQuestion3.events.onInputDown.addOnce(function() { clickSound.play(); });
                    this.txtQuestion3.events.onInputOver.add(function() { this.txtQuestion3.addColor('yellow', 0); }, this);
                    this.txtQuestion3.events.onInputOut.add(function() { this.txtQuestion3.clearColors(); }, this);
                }
                if (question4 !== undefined) {
                    this.txtQuestion4.inputEnabled = true;
                    this.txtQuestion4.x = secondColX;
                    this.txtQuestion4.y = textY + 35;
                    this.txtQuestion4.visible = true;
                    this.txtQuestion4.events.onInputDown.addOnce(function() { clickSound.play(); });
                    this.txtQuestion4.events.onInputOver.add(function() { this.txtQuestion4.addColor('yellow', 0); }, this);
                    this.txtQuestion4.events.onInputOut.add(function() { this.txtQuestion4.clearColors(); }, this);
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

var walkSpeed = 60;

var Npc = function(game, x, y) {

    Phaser.Sprite.call(this, game, x, y, 'people');

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

// NPC Hob
Npc.Hob = function(game, x, y, frame) {

    Npc.call(this, game, x, y);

    // Agregar animaciones de personaje
    this.animations.add('hob_walk_up', [43, 42, 43, 44], 10, true);
    this.animations.add('hob_walk_right', [31, 30, 31, 32], 10, true);
    this.animations.add('hob_walk_down', [7, 6, 7, 8], 10, true);
    this.animations.add('hob_walk_left', [19, 18, 19, 20], 10, true);

    this.animations.play('hob_walk_down');
    this.animations.stop();

};

Npc.Hob.prototype = Object.create(Phaser.Sprite.prototype);
Npc.Hob.prototype.constructor = Npc.Hob;

// NPC Monster
Npc.Monster = function(game, x, y, monsterType, group, index, playerTarget) {

    Npc.call(this, game, x, y);
    this.loadTexture('sprites1');
    this.monsterType = monsterType;
    this.group = group;
    this.index = index;
    this.target = playerTarget;

    this.stepCounter = 0;
    this.stepMax = 80;
    this.targetX = 0;
    this.targetY = 0;

    switch (this.monsterType) {
        case 'skeleton':
            // Agregar animaciones de personaje
            this.animations.add('monster_walk_up', [43, 42, 43, 44], 10, true);
            this.animations.add('monster_walk_right', [31, 30, 31, 32], 10, true);
            this.animations.add('monster_walk_down', [7, 8, 7, 8], 10, true);
            this.animations.add('monster_walk_left', [19, 18, 19, 20], 10, true);
            break;
        case 'dark-knight':
            // Agregar animaciones de personaje
            this.animations.add('monster_walk_up', [40, 39, 40, 41], 10, true);
            this.animations.add('monster_walk_right', [28, 27, 28, 29], 10, true);
            this.animations.add('monster_walk_down', [4, 3, 4, 5], 10, true);
            this.animations.add('monster_walk_left', [16, 15, 16, 17], 10, true);
            break;
        case 'dragon-knight':
            // Agregar animaciones de personaje
            this.animations.add('monster_walk_up', [46, 45, 46, 47], 10, true);
            this.animations.add('monster_walk_right', [34, 33, 34, 35], 10, true);
            this.animations.add('monster_walk_down', [10, 9, 10, 11], 10, true);
            this.animations.add('monster_walk_left', [22, 21, 22, 23], 10, true);
            break;
    }

    this.animations.play('monster_walk_down');
    this.animations.stop();

};

Npc.Monster.prototype = Object.create(Phaser.Sprite.prototype);
Npc.Monster.prototype.constructor = Npc.Monster;

Npc.Monster.prototype.update = function() {

    this.stepCounter++;

    // Si ha llegado a su target, debe detenerse
    if (Phaser.Rectangle.contains(this.body, this.targetX, this.targetY)){
        this.body.velocity.setTo(0, 0);
        this.animations.stop(null, true);
    }
    
    if (this.stepCounter == this.stepMax) {
        this.stepCounter = 0;
        // Sólo si se está en cámara
        if (this.x >= this.game.camera.x 
            && this.x <= (this.game.camera.x + this.game.camera.width)
            && this.y >= this.game.camera.y
            && this.y <= (this.game.camera.y + this.game.camera.height))
        {
            // Moverse hacia el jugador sólo si se está cerca del mismo, caso contrario, moverse aleatoriamente
            if (this.game.physics.arcade.distanceBetween(this, this.target) <= 150) {
                this.targetX = this.target.x;
                this.targetY = this.target.y;
                this.game.physics.arcade.moveToXY(this, this.targetX, this.targetY, walkSpeed);
            } else {

                this.targetX = Math.floor(Math.random() * (this.game.camera.width + this.game.camera.x)) + this.game.camera.x;
                this.targetY = Math.floor(Math.random() * (this.game.camera.height + this.game.camera.y)) + this.game.camera.y;
                this.game.physics.arcade.moveToXY(this, this.targetX, this.targetY, walkSpeed);
            }

            var angleBetween = this.game.physics.arcade.angleToXY(this, this.targetX, this.targetY);
            switch (true) {
                case (angleBetween >= -0.75 && angleBetween <= 0.75):
                    this.animations.play('monster_walk_right');
                    break;
                case (angleBetween >= 0.76 && angleBetween <= 2.25):
                    this.animations.play('monster_walk_down');
                    break;
                case (angleBetween >= 2.26 || angleBetween <= -2.26):
                    this.animations.play('monster_walk_left');
                    break;
                case (angleBetween >= -2.25 && angleBetween <= -0.76):
                    this.animations.play('monster_walk_up');
                    break;
            }
        }
    }
    
};

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
    Phaser.Sprite.call(this, game, x, y, 'sprites1', frame);
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
            xClick = position.x + this.game.camera.x;
            yClick = position.y + this.game.camera.y;
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
            }
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

var battleSong;
var victorySong;
var correctSound;
var incorrectSound;
var monsterSound;

var hpMaxWidth = 84;
var actionQueue = [];

function Battle() {}

Battle.prototype = {
    init: function(monsterType, targetNPC) {
        this.monsterType = typeof monsterType !== 'undefined' ? monsterType : 'skeleton';
    },
    create: function() {
        // Set bounds
        this.game.world.setBounds(0, 0, 600, 400);

        // Sonidos y Música
        correctSound = this.game.add.audio('correct', 0.5, false);
        incorrectSound = this.game.add.audio('incorrect', 1, false);
        monsterSound = this.game.add.audio('monster', 1, false);

        battleSong = this.game.add.audio('battle', 1, true);
        victorySong = this.game.add.audio('victory', 1, false);

        battleSong.play('', 0, 1, true);

        // variables
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
        this.loadEnemies(this.enemies, this.monsterType, 3);

        // ------------------------
        // Cargar Jugador
        // ------------------------
        this.battlePlayer = new BattlePlayer(this.game, this.game.world.width - 150, 240);
        this.game.add.existing(this.battlePlayer);

        //Comenzar turnos
        this.enemies.forEach(function(enemy) {
            enemy.battleTimer.start();
            enemy.events.onKilled.addOnce(function() {
                this.monsterDie(enemy);
            }, this);
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
            correctSound.play();
            this.showBattleMessage("Correct answer");
            this.battlePlayer.attackType = 'correct';
        } else {
            incorrectSound.play();
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

    monsterDie: function (enemy) {
        monsterSound.play();
    },

    // Acción que se ejecuta al ganar combate
    win: function() {
        battleSong.stop();
        victorySong.play();

        this.battlePlayer.animations.play('player_victory');
        this.showBattleMessage('Victory!', false);

        this.game.input.onDown.addOnce(function() {
            this.game.player.experience += this.xpGained;
            this.showBattleMessage('Gained ' + this.xpGained + ' points of experience', false);
            while (this.game.player.experience >= this.game.player.xpCap) {
                this.leveledUp = true;
                this.game.player.level++;
                this.game.player.stats.maxHp += Math.floor(this.game.player.stats.maxHp * 30/100);
                this.game.player.stats.hp = this.game.player.stats.maxHp;
                this.game.player.stats.attack += Math.floor(this.game.player.stats.attack * 30/100);
                this.game.player.stats.defense += Math.floor(this.game.player.stats.defense * 30/100);
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
                this.game.player.score += this.enemies[i].stats.score;
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
        // Detener canción
        battleSong.stop();
        victorySong.stop();
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

var gameoverSong;

function GameOver() {}

GameOver.prototype = {
    preload: function() {

    },
    create: function() {
        // Música
        gameoverSong = this.game.add.audio('gameover', 1, false);
        gameoverSong.play();

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
    },
    shutdown: function() {
        // Detener canción
        gameoverSong.stop();
    }
};
module.exports = GameOver;
},{}],12:[function(require,module,exports){
'use strict';

function Menu() {}

var theme;
var clickSound;

var imgLogo;
var imgMain;
var btnStart;
var btnHiScores;
var btnCredits;

Menu.prototype = {

    create: function() {
        var style = {
            font: '65px Arial',
            fill: '#ffffff',
            align: 'center'
        };

        // Cargar sprites
        imgLogo = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'logojackal');
        imgLogo.anchor.setTo(0.5, 0.5);

        // Ocultar 1ra imagen después de 2 segundos
        // Mostrar menú principal
        this.game.time.events.add(Phaser.Timer.SECOND * 2, function() {

            var spr_bg = this.game.add.graphics(0, 0);
            spr_bg.beginFill('#000', 1);
            spr_bg.drawRect(0, 0, this.game.width, this.game.height);
            spr_bg.alpha = 0;
            spr_bg.endFill();

            var fadeIn = this.game.add.tween(spr_bg).to({
                alpha: 1
            }, 500, Phaser.Easing.Linear.None, true);

            fadeIn.onComplete.addOnce(function() {
                imgMain = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'fondo-mainmenu');
                imgMain.anchor.setTo(0.5, 0.5);

                // Agregar botones
                btnStart = this.game.add.button(this.game.width / 2, 200, 'btn-start', this.comenzarClick, this, 2, 0, 1);
                btnStart.anchor.setTo(0.5, 0.5);
                btnHiScores = this.game.add.button(this.game.width / 2, 258, 'btn-hiscores', this.puntajesClick, this, 2, 0, 1);
                btnHiScores.anchor.setTo(0.5, 0.5);
                btnCredits = this.game.add.button(this.game.width / 2, 316, 'btn-credits', this.creditosClick, this, 2, 0, 1);
                btnCredits.anchor.setTo(0.5, 0.5);
                    
                var spr_bg = this.game.add.graphics(0, 0);
                spr_bg.beginFill('#000', 1);
                spr_bg.drawRect(0, 0, this.game.width, this.game.height);
                spr_bg.alpha = 1;
                spr_bg.endFill();

                var fadeOut = this.game.add.tween(spr_bg).to({
                    alpha: 0
                }, 500, Phaser.Easing.Linear.None, true);

            }, this);
        }, this);

        theme = this.game.add.audio('theme', 1, true);
        clickSound = this.game.add.audio('click', 1, false);

        theme.play();
    },

    comenzarClick: function() {
        // Sonar click
        clickSound.play();
        // Handler del botón comenzar juego
        // Iniciar el estado Game
        this.game.state.start('play');
        theme.stop();
    },

    puntajesClick: function() {
        // Sonar click
        clickSound.play();
    },

    creditosClick: function() {
        // Sonar click
        clickSound.play();
    },

};

module.exports = Menu;
},{}],13:[function(require,module,exports){
'use strict';

var DialogueBox = require('../prefabs/dialogue-box');
var Panel = require('../prefabs/panel');
var Player = require('../prefabs/player');
var Npc = require('../prefabs/npc');

var PANEL_FADE_TIME = 100;
var fadeColor = '#000';
var battleintroSound;
var TRANSITION_DURATION = 500;

// Inicio de play
function Play() {}

Play.prototype = {

    teleported: false,  // Switch para indicar que ya se ha iniciado el teleport

    create: function() {
        // Set bounds
        this.game.world.setBounds(0, 0, 600, 400);

        // Poner salud del jugador a 100%
        this.game.player.stats.hp = this.game.player.stats.maxHp;

        // Iniciar el sistema de física y poner la gravedad en 0
        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        // Agregar todas las escenas
        this.game.state.add('rmFirstScene', RmFirstScene);
        this.game.state.add('rmFirstScenario', RmFirstScenario);

        // Ir a la primera escena: Creación del personaje
        this.goToRoom('rmFirstScene');
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
    goToRoom: function(room, fade, monsterType, targetNPC) {
        this.saveLocation();

        if (monsterType !== undefined)
            battleintroSound.play();

        if (fade) {
            this.fadeToRoom(room, monsterType, targetNPC);
        } else {
            this.game.state.start(room, true, false, monsterType);
        }
    },

    fadeToRoom: function(nextState, monsterType, targetNPC) {
        // Si se entra a batalla, el fade es blanco, caso contrario es negro
        (monsterType === undefined) ? (fadeColor = '#000000') : (fadeColor = '#ffffff');

        console.log("fading with color " + fadeColor);

        var spr_bg = this.game.add.graphics(0, 0);
        spr_bg.fixedToCamera = true;
        spr_bg.beginFill(fadeColor, 1);
        spr_bg.drawRect(0, 0, this.game.camera.width, this.game.camera.height);
        spr_bg.alpha = 0;
        spr_bg.endFill();

        var fadeIn = this.game.add.tween(spr_bg).to({ 
            alpha: 1 
        }, TRANSITION_DURATION, Phaser.Easing.Linear.None, true);

        fadeIn.onComplete.add(function() {
            this.changeState(nextState, monsterType, targetNPC);
        }, this)

    },

    changeState: function (nextState, monsterType, targetNPC) {
        this.game.state.start(nextState, true, false, monsterType);
        this.fadeOut();
    },

    fadeOut: function() {        
        var spr_bg = this.game.add.graphics(0, 0);
        spr_bg.beginFill(fadeColor, 1);
        spr_bg.drawRect(0, 0, this.game.width, this.game.height);
        spr_bg.alpha = 1;
        spr_bg.endFill();

        var fadeOut = this.game.add.tween(spr_bg).to({
            alpha: 0
        }, 500, Phaser.Easing.Linear.None);

        fadeOut.onComplete.add(function() {
            console.log("mu");
        }, this);
        fadeOut.start();
    },

    // Guardar ubicación actual de jugador
    saveLocation: function() {
        this.game.previousRoom = this.game.state.current;
        if (this.playerX !== undefined) {
            this.playerX = this.player.x;
            this.playerY = this.player.y;
        }
    },

    shutdown: function(self) {
        self = typeof self !== 'undefined' ? self : this;

        // Borrar cualquier diálogo que haya quedado creado
        if (self.dialogueBox !== undefined) {
            self.dialogueBox.destroy(true);
            delete self.dialogueBox;
        }
    }

};


// ESCENA: PRIMERA (CREAR PERSONAJE)
///

RmFirstScene.prototype = new Play();

function RmFirstScene() {

    this.create = function() {
        this.startEvent(1);
    },

    this.startEvent = function(iDialogue, answer) {
        switch (iDialogue) {
            case 1:
                var msg = [
                    "Are you a student or a teacher?"
                ];
                var question1 = "Teacher";
                var question2 = "Student";
                this.createDialogue(msg, question1, question2);

                this.dialogueBox.txtQuestion1.events.onInputDown.addOnce(function() {
                    this.startEvent(iDialogue + 1, 1);
                }, this);
                this.dialogueBox.txtQuestion2.events.onInputDown.addOnce(function() {
                    this.startEvent(iDialogue + 1, 2);
                }, this);
                break;

            case 2:
                this.createDialogue(["Welcome to this game's beta version... Thank you",
                    "for playing it!" 
                ]);
                this.game.input.onDown.addOnce(function() {
                    this.startEvent(iDialogue + 1);
                }, this);
                break;

            case 3:
                this.createDialogue(["I have tried to capture the essence of old RPG",
                    "games and mix it with english learning. This game has all the",
                    "elements found in classics like Final Fantasy, such as the dia-",
                    "logue system, real time battles, letter by letter rendering" 
                ]);
                this.game.input.onDown.addOnce(function() {
                    this.startEvent(iDialogue + 1);
                }, this);
                break;

            case 4:
                this.createDialogue(["and much more. The goal is to get to the final boss at the",
                    "other end of the level without dying. Defeat the monsters and",
                    "try to answer the questions as fast as possible."
                ]);
                this.game.input.onDown.addOnce(function() {
                    this.startEvent(iDialogue + 1);
                }, this);
                break;

            case 5:
                this.createDialogue(["Starting game..."]);
                this.game.input.onDown.addOnce(function() {
                    this.destroyDialogue();
                    this.goToRoom('rmFirstScenario', true);
                }, this);
                break;
        }
    }

}


// ESCENA: CUARTO DEL PERSONAJE
///

RmFirstScenario.prototype = new Play();

function RmFirstScenario() {

    var fieldSong;

    var layerGround;
    var layerUnder;
    var layerOver;
    var mapOver;

    var UI;
    var levelText;
    var scoreText;

    var NPCs;

    this.create = function() {

        // Música
        fieldSong = this.game.add.audio('field', 1, true);
        fieldSong.play('', 0, 1, true);

        battleintroSound = this.game.add.audio('battle-intro', 1, false);

        // Tileset
        if (this.map === undefined){
            this.map = this.game.add.tilemap('firstScene-map');
            this.map.addTilesetImage('mountain01');
        }
        
        // Crear capas
        layerGround = this.map.createLayer('Ground');
        layerUnder = this.map.createLayer('Under');

        // Crear colisiones
        this.createCollisions();

        // Ajustar juego al tamaño del mapa
        layerGround.resizeWorld();

        // Coordenadas donde aparece el jugador
        this.playerX = typeof this.playerX !== 'undefined' ? this.playerX : this.game.world.centerX;
        this.playerY = typeof this.playerY !== 'undefined' ? this.playerY : this.game.world.height - 96;

        // Creamos el jugador
        this.player = new Player(this.game, this.playerX, this.playerY);
        this.game.add.existing(this.player);

        // Grupo que contendrá todos los Npcs
        NPCs = this.game.add.group();
        NPCs.monsters = this.game.add.group();

        // Crear los npcs
        // Monstruos
        this.map.objects.Enemigo1.forEach(function(element, index){
            NPCs.monsters.add(new Npc.Monster(this.game, element.x, element.y, 'skeleton', 'Enemigo1', index, this.player));
        }, this);
        this.map.objects.Enemigo2.forEach(function(element, index){
            NPCs.monsters.add(new Npc.Monster(this.game, element.x, element.y, 'dark-knight', 'Enemigo2', index, this.player));
        }, this);
        this.map.objects.Enemigo3.forEach(function(element, index){
            NPCs.monsters.add(new Npc.Monster(this.game, element.x, element.y, 'dragon-knight', 'Enemigo3', index, this.player));
        }, this);

        // NPC hob
        NPCs.hob = new Npc.Hob(this.game, 200, this.game.world.height-200);
        NPCs.add(NPCs.hob);
        NPCs.hob.events.onInputDown.add(function() {
            this.guard1Dialogue(1);
        }, this);

        // Capa por encima de Jugador y NPCS
        mapOver = this.game.add.tilemap('firstScene-map');
        mapOver.addTilesetImage('mountain01');
        layerOver = mapOver.createLayer('Over');

        // UI
        UI = this.game.add.group();
        levelText = this.game.add.text(0, 0, "Level: ", this.game.paragraphFont, UI);
        scoreText = this.game.add.text(0, 20, "Score: ", this.game.paragraphFont, UI);

        // Cámara
        this.game.camera.follow(this.player);

        // Volver a poner en falso el switch de teleportación
        this.teleported = false;
    },

    this.update = function() {

        // Reposicionar UI
        UI.x = this.game.camera.view.x + this.game.camera.view.width - 100;
        UI.y = this.game.camera.view.y + 10;
        levelText.setText("Level " + this.game.player.level); 
        scoreText.setText("Score: " + this.game.player.score);

        // object1, object2, collideCallback, processCallback, callbackContext
        this.game.physics.arcade.collide(this.player, NPCs, function(obj1, obj2) {
            obj2.body.velocity.setTo (0,0);
        }, null, this);

        this.game.physics.arcade.collide(this.player, NPCs.monsters, function(obj1, obj2) {
            obj2.body.velocity.setTo (0,0);
            // Si choca con monstruo, entrar en combate
            if (!this.teleported) {
                // Eliminar NPC con el que se acaba de colisionar
                this.map.objects[obj2.group].splice(obj2.index, 1);
                // Poner switch de teleportación en On
                this.teleported = true;
                this.goToRoom('battle', true, obj2.monsterType, obj2);    
            }
        }, null, this);

        this.game.physics.arcade.collide(this.player, layerUnder);
        this.game.physics.arcade.collide(NPCs.monsters, layerUnder);

    },

    this.render = function() {
        //this.game.debug.spriteInfo(this.player, 32, 32);
    },

    this.createCollisions = function() {
        // Setear sprites con los que se colisiona
        this.map.setCollisionBetween(3, 4, true, layerUnder);
        this.map.setCollisionBetween(8, 9, true, layerUnder);
        this.map.setCollision(18, true, layerUnder);
        this.map.setCollisionBetween(21, 26, true, layerUnder);
        this.map.setCollision(33, true, layerUnder);
        this.map.setCollision(38, true, layerUnder);
        this.map.setCollision(49, true, layerUnder);
        this.map.setCollision(54, true, layerUnder);
        this.map.setCollisionBetween(65, 66, true, layerUnder);
        this.map.setCollisionBetween(69, 74, true, layerUnder);
        this.map.setCollisionBetween(81, 90, true, layerUnder);
        this.map.setCollisionBetween(98, 101, true, layerUnder);
        this.map.setCollisionBetween(104, 105, true, layerUnder);
        this.map.setCollision(113, true, layerUnder);
        this.map.setCollision(116, true, layerUnder);
        this.map.setCollision(161, true, layerUnder);
        this.map.setCollision(164, true, layerUnder);
        this.map.setCollision(177, true, layerUnder);
        this.map.setCollision(180, true, layerUnder);
        this.map.setCollision(193, true, layerUnder);
        this.map.setCollision(196, true, layerUnder);
        this.map.setCollision(204, true, layerUnder);
        this.map.setCollision(206, true, layerUnder);
        this.map.setCollisionBetween(209, 212, true, layerUnder);
        this.map.setCollisionBetween(220, 222, true, layerUnder);
        this.map.setCollisionBetween(225, 231, true, layerUnder);
        this.map.setCollisionBetween(234, 240, true, layerUnder);
        this.map.setCollisionBetween(242, 243, true, layerUnder);
        this.map.setCollisionBetween(244, 256, true, layerUnder);
    },

    this.guard1Dialogue = function(iDialogue, answer) {
        switch (iDialogue) {
            case 1:
                var msg = [
                    "Hello, my name is Hob. I'm a guard from the old",
                    "Empire days. I can teach you how to get to the end of",
                    "this mountain."
                ];

                this.createDialogue(msg);
                this.game.input.onDown.addOnce(function() {
                    this.guard1Dialogue(iDialogue + 1);
                }, this);
                break;

            case 2:
                var msg = [
                    "Do you want to try the combat system?"
                ];
                var question1 = "Yes";
                var question2 = "No";

                this.createDialogue(msg, question1, question2);

                this.dialogueBox.txtQuestion1.events.onInputDown.addOnce(function() {
                    this.goToRoom('battle', true);
                }, this);
                this.dialogueBox.txtQuestion2.events.onInputDown.addOnce(function() {
                    console.log("Pendiente: Arreglar el salto que ocurre en los diálogos.");
                    this.destroyDialogue();
                }, this);
                break;
        }
    },

    this.shutdown = function() {
        Play.prototype.shutdown(this);
        fieldSong.stop();
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
        this.load.image('fondo-mainmenu', 'assets/img/background-mainmenu.jpg');
        this.load.spritesheet('btn-start', 'assets/img/btn-start.png', 256, 48);
        this.load.spritesheet('btn-hiscores', 'assets/img/btn-hiscores.png', 256, 48);
        this.load.spritesheet('btn-credits', 'assets/img/btn-credits.png', 256, 48);
        this.load.image('panel', 'assets/img/panel-dialog.png');
        this.load.image('panel-top', 'assets/img/ui-paneltop.png');
        this.load.image('panel-bottom', 'assets/img/ui-panelbottom.png');
        this.load.image('panel-battlestatus', 'assets/img/ui-panelbottom2.png');
        this.load.image('panel-hpcontainer', 'assets/img/ui-hpcontainer.png');

        // Sprites
        this.load.image('skeleton', 'assets/img/skeleton.png');
        this.load.image('dark-knight', 'assets/img/darkknight.png');
        this.load.image('dragon-knight', 'assets/img/dragonknight.png');

        // Mapas
        this.game.load.tilemap('firstScene-map', 'assets/maps/mapForest1.json', null, Phaser.Tilemap.TILED_JSON);
        this.load.image('mountain01', 'assets/maps/mountain01.png');

        // Spritesheets
        this.game.load.spritesheet('people', 'assets/img/player1.png', 32, 32);
        this.game.load.spritesheet('sprites1', 'assets/img/sprites1.png', 32, 32);
        this.game.load.spritesheet('heroe-batalla', 'assets/img/heroe01-batalla.png', 96, 96);
        this.game.load.spritesheet('heroe-faces', 'assets/img/face-heroes.png', 96, 96);

        // Fondos
        this.load.image('battle-grass', 'assets/img/battleback-1.png');

        // Audio
        this.game.load.audio('theme', 'assets/music/Death Is Just Another Path.ogg');
        this.game.load.audio('battle', 'assets/music/Battle.ogg');
        this.game.load.audio('field', 'assets/music/Field.ogg');
        this.game.load.audio('victory', 'assets/music/Victory1.ogg');
        this.game.load.audio('gameover', 'assets/music/Gameover.ogg');

        // Efectos de sonido
        this.game.load.audio('click', 'assets/sound/action1.ogg');
        this.game.load.audio('correct', 'assets/sound/correct.ogg');
        this.game.load.audio('incorrect', 'assets/sound/incorrect.ogg');
        this.game.load.audio('battle-intro', 'assets/sound/Intro-battle.ogg');
        this.game.load.audio('monster', 'assets/sound/monster.ogg');
        this.game.load.audio('attack-01', 'assets/sound/095-Attack07.ogg');
        this.game.load.audio('attack-blow1', 'assets/sound/attack-enemy.ogg');
        this.game.load.audio('attack-blow2', 'assets/sound/attack-enemy2.ogg');
        this.game.load.audio('attack-hack2', 'assets/sound/attack-enemy3.ogg');
        this.game.load.audio('miss', 'assets/sound/miss.ogg');

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
            this.game.state.start('menu');
        }
    },
    onLoadComplete: function() {
        this.ready = true;
    }

};

module.exports = Preload;
},{}]},{},[1])