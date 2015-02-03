
// Configuración de la Web Font de Google a ser usada en el juego
WebFontConfig = {

    //  'active' means all requested fonts have finished loading
    //  We set a 1 second delay before calling 'createText'.
    //  For some reason if we don't the browser cannot render the text the first time it's created.
    // active: function() { game.time.events.add(Phaser.Timer.SECOND, createText, this); },

    //  The Google Fonts we want to load (specify as many as you like in the array)
    google: {
      families: ['Molengo']
    }

};

// Función para ir a pantalla completa
function GoFullScreen() {

    if (!document.fullscreenEnabled ||
        !document.webkitFullscreenEnabled ||
        !document.mozFullScreenEnabled ||
        !document.msFullscreenEnabled
    ) {
        var fsCanvas = document.getElementById('pickup-artist');
        if (fsCanvas.requestFullscreen)
            fsCanvas.requestFullscreen();
        else if (fsCanvas.webkitRequestFullscreen)
            fsCanvas.webkitRequestFullscreen();
        else if (fsCanvas.mozRequestFullScreen)
            fsCanvas.mozRequestFullScreen();
        else if (fsCanvas.msRequestFullscreen)
            fsCanvas.msRequestFullscreen();

        game.scale.startFullScreen(false);
    } else {
        game.scale.stopFullScreen();
    }
    
}