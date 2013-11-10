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

  firePixel = function(uri) {
    var type = Object.prototype.toString.call(uri);
    switch (type) {
      case '[object String]':
        console.log(uri);
        break;
      case '[object Array]':
        for(var i in uri) {
          console.log(uri[i]);
        }
        break;
      default:
        throw new Error("Unrecognized uri type: " + type);
    }
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
      player.trigger('adtimeout');
      return;
    }

    player.on('contentupdate', function(){
      fetchVAST(options.url, function(ads){
        if(ads.length > 0) {
          player.vast.ad = ads[0];
          player.trigger('adsready');
        } else {
          player.trigger('adtimeout');
        }
      });
    });

    player.on('readyforpreroll', function() {
      player.ads.startLinearAdMode();

      // play your linear ad content
      var adSources = player.vast.ad.sources();

      player.src(adSources);
      player.vast.linearEvent('creativeView');
      firePixel(player.vast.ad.impressions);

      player.one('durationchange', function(){
        player.play();
      });

      player.one('click', player.vast.click);

      var skipButton = document.createElement("div");
      skipButton.className = "vast-skip-button";
      player.vast.skipButton = skipButton;
      player.el().appendChild(skipButton);

      var timeupdateEvents = {
        0   : 'start',
        0.25: 'firstQuartile',
        0.5 : 'midpoint',
        0.75: 'thirdQuartile'
      };

      player.on("timeupdate", function(){
        var timeLeft = Math.ceil(settings.skip - player.currentTime());
        var percentage = player.currentTime() / player.duration();
        for (var threshold in timeupdateEvents) {
          if(threshold < percentage) {
            player.vast.linearEvent(timeupdateEvents[threshold]);
            delete timeupdateEvents[threshold];
          }
        }
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
      var linearAd = player.vast.ad.linear();
      firePixel(linearAd.clickTracking);
      window.open(linearAd.clickThrough);
    };

    player.vast.linearEvent = function(eventName) {
      if (player.vast.ad === undefined) {
        return;
      }
      var uri = player.vast.ad.linear().tracking[eventName];
      if (uri !== undefined) {
        firePixel(uri);
      }
    };
  };

  vjs.plugin('vast', vastPlugin);
}(window.videojs));