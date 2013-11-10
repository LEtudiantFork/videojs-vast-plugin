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

    if (player.ads === undefined) {
        console.log("VAST requires videojs-contrib-ads");
        return;
    }

    // If we don't have a VAST url, just bail out.
    if(options.url === undefined) {
      return;
    }

    player.on('contentupdate', function(){
      fetchVAST(options.url, function(ads){
        if(ads.length > 0) {
          player.vast.ad = ads[0];
          player.trigger('adsready');
        }
      });
    });

    player.on('readyforpreroll', function() {
      player.ads.startLinearAdMode();

      // play your linear ad content
      var adSources = player.vast.ad.sources();

      player.src(adSources);
      player.one('durationchange', function(){
        player.play();
      });

      player.one('click', player.vast.click);

      var skipButton = document.createElement("div");
      skipButton.className = "vast-skip-button";
      player.vast.skipButton = skipButton;
      player.el().appendChild(skipButton);

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

      skipButton.onclick = function(e) {
        e.stopPropagation();
        if((' ' + player.vast.skipButton.className + ' ').indexOf(' enabled ') === -1) {
          return;
        }
        player.trigger('ended');
      };

      player.one('ended', function() {
        player.vast.skipButton.parentNode.removeChild(player.vast.skipButton);
        player.off('click', player.vast.click);
        player.ads.endLinearAdMode();
      });
    });

    player.vast.click = function(e) {
      window.open(player.vast.ad.linear().clickThrough);
    };
  };

  vjs.plugin('vast', vastPlugin);
}(window.videojs));