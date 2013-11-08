(function(vjs) {
  var
  extend = function(obj) {
    var arg, i, k;
    for (i = 1; i < arguments.length; i++) {
      arg = arguments[i];
      for (k in arg) {
        if (arg.hasOwnProperty(k)) {
          obj[k] = arg[k];
        }
      }
    }
    return obj;
  },

  defaults = {
    skip: 5,
  },

  vastPlugin = function(options) {
    var player = this;
    var settings = extend({}, defaults, options || {});

    player.vast.start = function(ad) {
      if(player.vast.timeout !== undefined) {
        clearTimeout(player.vast.timeout);
      }
      player.vast.originalSources = player.options().sources;
      var newSources = [];
      var adSources = ad.sources();
      for(var i=0; i<adSources.length; i++) {
        var source = adSources[i];
        for(var j=0; j<player.vast.originalSources.length; j++) {
          if(player.vast.originalSources[j].type === source.type) {
            newSources.push(source);
            break;
          }
        }
      }
      player.src(newSources);
      player.play();
      player.controlBar.progressControl.el().style.display = "none";
      player.one('ended', player.vast.end);

      var skipButton = document.createElement("div");
      skipButton.className = "vast-skip-button";
      player.vast.skipButton = skipButton;
      player.el().appendChild(skipButton);
      
      skipButton.onclick = function(e) {
        player.vast.end();
      };

      player.on("timeupdate", function(){
        var timeLeft = Math.ceil(settings.skip - player.currentTime());
        if(timeLeft > 0) {
          player.vast.skipButton.innerHTML = "Skip in " + timeLeft + "...";
        } else {
          if((' ' + player.vast.skipButton.className + ' ').indexOf(' enabled ') === -1){
            player.vast.skipButton.className += " enabled";
            player.vast.skipButton.innerHTML = "Skip";
          }
        }
      });

    };

    player.vast.end = function() {
      if(player.vast.originalSources !== undefined) {
        player.src(player.vast.originalSources);
        player.load();
        player.vast.originalSources = undefined;
      }
      if(player.vast.skipButton !== undefined) {
        player.vast.skipButton.parentNode.removeChild(player.vast.skipButton);
      }
      player.controlBar.progressControl.el().style.display = "block";
      player.play();
    };

    // If we don't have a VAST url, just bail out.
    if(options.url === undefined) {
      return;
    }

    /* If autoplay is on, we don't want the video to start playing before the preroll loads.
     * This is a hack, but it seems to work */
    player.one('loadstart', function(e){
      if (player.options().autoplay === true) {
        player.pause();
      }
    });

    // If we don't get a vast doc in the next 2 seconds, just play the video.
    player.vast.timeout = setTimeout(function(){
      player.vast.end();
    }, 2000);

    // Fetch the vast document
    fetchVAST(options.url, function(ads){
      if(ads.length > 0) {
        player.vast.start(ads[0]);
      }
    });
  };

  vjs.plugin('vast', vastPlugin);
}(window.videojs));