(function() {
    videojs.Player.tracking = [];
    videojs.Player.tracking.active = false;

    function addEvent(domElement, eName, callback) {
        if (document.addEventListener) {
            domElement.addEventListener(
                eName,
                function(){ callback(this); },
                false
            );
        } else if (document.attachEvent) {
            domElement.attachEvent(
                'on'+eName, 
                function(){ callback(this); }
            );
        }           
    }

    videojs.Player.prototype.launchTracking = function(eName) { 
        
        var urls = undefined;
        
        if(eName === 'clickThrough')
        {
            urls = this.vast.ads[0].creatives[0].clickTracking;           
        }
        else if(eName === 'impression')
        {
            urls = this.vast.ads[0].impressions;            
        }
        else
        {       
            urls = this.vast.ads[0].creatives[0].tracking[eName]; 
        }

        var url = '';
        for(var i in urls)
        {
            url = urls[i];
            console.log("[VAST Tracking] "+eName+" ("+url+")");
            this.addPixel(url);
        }  
        
    };
    
    videojs.Player.prototype.addPixel = function(url) {
        
        if(url === undefined)
        {
            return false;
        }
        
        var pixel = document.createElement('img');
        
        pixel.style.display = 'none';
        pixel.setAttribute('src', url);

        document.getElementsByTagName('body')[0].appendChild(pixel);
        
        return true;
    };
    
    
    videojs.plugin('tracking', function(options) {
        if (options == null) {
            options = {};
        }

        loaded = function() {    
            
            if(!this.vast.isAdPlaying)
            {
                if(this.tracking.isActive === true)
                {
                    endtracking.call(this);
                }
                              
                return false;
            }
            
            var vjs = this;  
            
            console.log('[VAST Tracking] tracking prêt...');
            
            this.tracking.pPercent  = this.tracking.pProgress = this.lastVolume = false;
                 
            addEvent(
                this.vast.skipButton,
                'click',
                function(el){ 
                    var classList = el.className.split(' ');
                    for(var i in classList)
                    {
                        if(classList[i] === 'enabled')
                        {
                            vjs.launchTracking('skip'); endtracking.call(vjs);
                            break;
                        }
                    }               
                }
            );
            // addEvent(
            //     this.vast.clickThrough,
            //     'click',
            //     function(){  
            //         vjs.launchTracking('clickThrough');
            //     }
            // );
            
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
            else if(this.lastVolume === 0)
            {
                this.launchTracking('unmute');
            }      
            
            this.lastVolume = this.volume();
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
                this.launchTracking('impression');
                this.launchTracking('createView'); 
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


        this.on("loadstart", loaded);

    });

}).call(this);
