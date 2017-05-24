/********************************************/
/*  Tracker of time in view of DOM element  */
/********************************************/
/*  Tracker constructor get one attribute   */
/* selector of div. For now support id and  */
/* class.                                   */
/********************************************/

/*
* Init tracker object.
*
* In order not to use $u or etc, was write a simplified function of select tracking element.
*/
var Tracker = function (advSelector) {

    this.advSelector = advSelector;
    this.element = this.getTrackedElement();
    this.inView = false;
    this.inViewRepeat = true;

    this.pageActive = true;
    this.sendTime = null;
    this.inView_time = null;
    this.prevTime = 0;

    /*
    * At the reach next seconds value it will update time in view on server.
    */

    this.durationSendTime = [1, 3, 5, 10, 30, 45, 60, 120, 180, 240, 300];
    this.durationSended = [false, false, false, false, false, false, false, false, false, false, false];
    this.trackTimeActive = false;

    if (!this.element) {
        console.log('Element not found');
        return
    }

    this.initTracking();

};

/*
* Get element by element selector.
*/
Tracker.prototype.getTrackedElement = function () {

    var element = undefined;

    if (this.advSelector.startsWith('.')) {

        var elements = document.getElementsByClassName(this.advSelector.slice(1));

        if (elements.length > 0) {
            element = elements[0];
        }

    } else if (this.advSelector.startsWith('#')) {

        element = document.getElementById(this.advSelector.slice(1));

    }

    return element

};

/*
* Add event listener for checking element in view.
*/
Tracker.prototype.initTracking = function () {

    this.inviewChecker = this.inviewChecker.bind(this);

    window.addEventListener('scroll',  this.inviewChecker, false);
    window.addEventListener('resize',  this.inviewChecker, false);
    window.addEventListener('touchend', this.inviewChecker, false);
    window.addEventListener('touchstart', this.inviewChecker, false);
    window.addEventListener('touchmove', this.inviewChecker, false);

    this.inviewChecker();

};

/*
* Behavior depending of element in view.
*/
Tracker.prototype.inviewChecker = function () {

    this.inView = !!this.inviewCheck(this.element);

    if (this.inView && this.inViewRepeat) {

        console.log('Element in view');
        this.inViewRepeat = false;
        this.startTime = new Date();
        this.startTracker();

    } else if (!this.inView && !this.inViewRepeat) {

        this.inViewRepeat = true;
        this.startTime = new Date();
        if (this.inView_time > 0) {
            this.prevTime = this.inView_time;
            this.updateTimeInView();
        }

    }

};

/*
* Check element in view.
*/
Tracker.prototype.inviewCheck = function () {

    var el = this.element;

    if (!el) {
        return 0;
    }

    var top = el.offsetTop;
    var left = el.offsetLeft;
    var width = el.offsetWidth;
    var height = el.offsetHeight;

    while(el.offsetParent) {
        el = el.offsetParent;
        top += el.offsetTop;
        left += el.offsetLeft;
    }

    var visibility;
    if((1 - (window.pageYOffset - top) / height) <= 1) {
        visibility = (1 - (window.pageYOffset - top)/height);
    } else if(((window.innerHeight + window.pageYOffset - top) / height) <= 1) {
        visibility = ((window.innerHeight + window.pageYOffset - top) / height);
    } else {
        visibility = 1;
    }

    return Math.max(0, visibility);

};


/*
* Check time in view.
* If reached the needed volume calls function for update time in view on server.
*/
Tracker.prototype.startTracker = function () {

    /*
    * Check the element in view and update time in view on server when page hide for desktop.
    */
    setInterval(function () {

      if (document.hidden && this.inView) {

        this.pageActive = false;

        if (this.inView_time > 0) {
          this.updateTimeInView();
        }

        this.prevTime = this.inView_time;
        this.sendTime = false;
        this.inView = false;

      } else if (!document.hidden) {

        if (this.inviewCheck() > 0 && !this.inView) {
            this.inView = true;
            this.startTime = new Date();
        }

        this.pageActive = true;
      }

    }.bind(this), 100);

    if (!this.trackTimeActive) {
        this.trackTimeActive = true;
        setInterval(function () {
            if (this.inView && this.startTime && this.pageActive) {

                if (this.prevTime == 0 || !this.prevTime) {
                    this.inView_time = (new Date() - this.startTime) / 1000;
                } else {
                    this.inView_time = ((new Date() - this.startTime) / 1000) + this.prevTime;
                }

                if (this.inView_time > 1) {
                    this.sendTime = 0
                }
                for (var i in this.durationSendTime) {
                    if (this.inView_time > this.durationSendTime[i]) {
                        this.sendTime = i;
                    }
                }

                if (this.sendTime && this.durationSendTime[parseInt(this.sendTime)] && this.durationSended[parseInt(this.sendTime)] == false || !this.sendTime) {
                    if (this.inView_time > 0) {

                        this.updateTimeInView();

                    }
                    this.durationSended[parseInt(this.sendTime)] = true;
                }
            }
        }.bind(this), 1000);
    }

    /*
    * On close tab calls function for update time in view on server.
    */
    window.onbeforeunload = function (e) {
        e.preventDefault();
        if (this.inView_time > 0) {
          this.updateTimeInView();
        }
    }.bind(this);

    /*
    * On hide tab for mobile calls function for update time in view on server.
    */
    document.pagehide = function () {
        if (this.inView_time > 0) {
          this.updateTimeInView();
        }
    }.bind(this);

};

/*
* Here should be request to update time in view.
*/
Tracker.prototype.updateTimeInView = function () {
    console.log(this.inView_time);
};

/*
* Create instance of Tracker with selector;
*/
var tracker = new Tracker('.advertorial');


