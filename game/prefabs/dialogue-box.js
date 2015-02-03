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