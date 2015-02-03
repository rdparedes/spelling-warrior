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