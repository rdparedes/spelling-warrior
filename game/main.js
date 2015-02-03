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