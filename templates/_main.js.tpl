'use strict';

window.onload = function () {
	
  	var game = new Phaser.Game(<%= gameWidth %>, <%= gameHeight %>, Phaser.AUTO, '<%= _.slugify(projectName) %>');

	// Variables globales
	game.playerName = "";
	game.lives = 3;
	game.score = 0;

	game.PANEL_LOW_Y = 400 - 64; // Posición en Y del panel cuando es bajo
	game.PANEL_FADE_TIME = 100; // Tiempo de fade in y out del panel
	game.PANEL_TEXT_X = 128;
	game.PANEL_TEXT_Y = 400 - 116;	// Posición en Y del texto de diálogo cuando es bajo


  // Game States
  <% _.forEach(gameStates, function(gameState) {  %>game.state.add('<%= gameState.shortName %>', require('./states/<%= gameState.shortName %>'));
  <% }); %>

  game.state.start('boot');
};