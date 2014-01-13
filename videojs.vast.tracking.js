(function() {
    videojs.Player.tracking = [];
    videojs.Player.tracking.active = false;

    videojs.Player.prototype.launchTracking = function(eName) { 
        
        var url = '';
        
        if(eName === 'clickThrough')
        {
            console.log(this.vast.ads[0].creatives[0]);
            var urls = this.vast.ads[0].creatives[0].clickTracking;
            
            for(var i in urls)
            {   
                url = urls[i];
                console.log("[VAST Tracking] "+eName+" ("+url+")");
                this.addPixel(url);
            }
        }
        else
        {       
            url = this.vast.ads[0].creatives[0].tracking[eName]; 
            console.log("[VAST Tracking] "+eName+" ("+url+")");
            this.addPixel(url);
        }

        
    };
    
    videojs.Player.prototype.addPixel = function(url) {
        var pixel = document.createElement('img');
        
        pixel.style.display = 'none';
        pixel.setAttribute('src', url);

        document.getElementsByTagName('body')[0].appendChild(pixel);
        console.log(pixel);
    };
    
    
    videojs.plugin('tracking', function(options) {
        if (options == null) {
            options = {};
        }

        loaded = function() {    
            
            if(false && !this.vast.isAdPlaying)
            {
                if(this.tracking.isActive === true)
                {
                    endtracking.call(this);
                }
                              
                return false;
            }
            
            var vjs = this;  
            
            console.log('[VAST Tracking] tracking prêt...');
            
            this.tracking.pPercent  = this.tracking.pProgress = false;
                 
            if (document.addEventListener) {
                this.vast.skipButton.addEventListener(
                    'click',
                    function(){  vjs.launchTracking('skip'); endtracking.call(vjs); },
                    false
                );
                this.vast.clickThrough.addEventListener(
                    'click',
                    function(){  vjs.launchTracking('clickThrough'); },
                    false
                );
                    
            } else if (document.attachEvent) {
                this.vast.skipButton.attachEvent(
                    'onclick', 
                    function(){  vjs.launchTracking('skip'); endtracking.call(vjs); }
                );
                this.vast.clickThrough.attachEvent(
                    'onclick', 
                    function(){  vjs.launchTracking('clickThrough'); }
                );
            }
            
            this.on("pause", pause);
            this.on("play", resume);
            this.on("volumechange", volumechange);
            this.on("fullscreenchange", fullscreenchange);
            this.on("timeupdate", timeupdate);
            this.on("timeupdate", rewind);
            this.on("ended", endtracking);
            
            this.tracking.isActive = true;
        };  
       
        volumechange = function() {
            var muted = this.muted();       
            if(muted)
            {
                 this.launchTracking('mute');
            }
            else
            {
                this.launchTracking('unmute');
            }      
        };

        pause = function() {                    
            this.launchTracking('pause');       
        };
        
        firstplay = function() {                    
                 
        };
        
        resume = function() {
            this.launchTracking('resume');       
        };
                
        rewind = function() {
            if(this.tracking.pProgress !== false && this.tracking.pProgress > this.currentTime() )
            {             
                this.launchTracking('rewind');
            }
            this.tracking.pProgress = this.currentTime();
        };
        
        fullscreenchange = function() {                        
            if(this.isFullScreen)
            {
                this.launchTracking('fullscreen');
            }
            else
            {
                this.launchTracking('exitFullscreen');
            }      
        };

        timeupdate = function() {
            var cTime = this.currentTime();
            var cPercent = cTime / this.duration();

            if(cPercent < 0.25 && this.tracking.pPercent === false)
            {   
                this.launchTracking('start');
            }
            else if(cPercent >= 0.25 && this.tracking.pPercent < 0.25)
            {
                this.launchTracking('firstQuartile');
            }
            else if(cPercent >= 0.5 && this.tracking.pPercent < 0.5)
            {
                this.launchTracking('midpoint');
            }
            else if(cPercent > 0.75 && this.tracking.pPercent < 0.75)
            {
                this.launchTracking('thirdQuartile');
            }
            else if(cPercent == 1)
            {
                this.launchTracking('complete');
               
            }

            this.tracking.pPercent = cPercent;       
        };

        endtracking = function() {
            console.log("[VAST Tracking] fin du tracking");
            
            this.off("pause", pause);
            this.off("play", resume);
            this.off("volumechange", volumechange);
            this.off("fullscreenchange", fullscreenchange);
            this.off("timeupdate", timeupdate);
            this.off("timeupdate", rewind);
            this.off("ended", endtracking);
            
            this.tracking.isActive = false;
            
        };


        this.on("loadedmetadata", loaded);

    });

}).call(this);
