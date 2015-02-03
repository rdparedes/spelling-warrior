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