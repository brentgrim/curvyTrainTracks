/* animation support for the train
 * this creates a slider that moves forward in time and lets you go from 0 N (in points), stepping at a
 * uniform rate
 * at any time, you can ask for the value (between 0 and N)
 */
function TrainTimeController(width,installTo, initialSteps) {
    "use strict";
    if (!this) {
        throw Error("TrainTimeController not used as a constructor");
    }
    if (!width) {
        width = 600;
    }
    if (!initialSteps) {
        initialSteps = 4;
    }
    // keep the closures happy
    var ttc = this;

    // to make this do stuff, add callbacks to these lists
    this.onchange = [];

    this.div = document.createElement("div");
    this.div.style.border = "1px solid black";
    this.div.style.padding = "5px";
    this.div.style.marginTop = "5px";
    this.div.style.marginBottom = "5px";
    this.div.style.display = "block";
    this.div.style.width = (width-10) +"px";    // account for padding

    this.run = document.createElement("input");
    this.run.setAttribute("type", "checkbox");
    this.run.value = 0;
    this.run.addEventListener("change", checkboxCallback);
    this.div.appendChild(this.run);

    this.text = document.createElement("input");
    this.text.setAttribute("type", "text");
    this.text.setAttribute("size", "4");
    this.text.checked = false;
    this.text.addEventListener("change", textInput);
    this.text.value = 0;
    this.div.appendChild(this.text);

    this.slider = document.createElement("input");
    this.slider.setAttribute("type", "range");
    this.slider.style.width = (width-250) + "px";
    this.slider.min = 0;
    this.slider.max =  initialSteps;
    this.slider.step = .001;
    this.slider.value = 0;
    this.slider.addEventListener("input",sliderInput);
    this.div.appendChild(this.slider);

    this.speed = document.createElement("input");
    this.speed.setAttribute("type", "range");
    this.speed.style.width =  "100px";
    this.speed.min = 0.2;
    this.speed.max =  7;
    this.speed.step = .1;
    this.speed.value = .2;
    this.speed.addEventListener("input",sliderInput);
    this.div.appendChild(this.speed);

    this.stepTimeout = null;

    function sliderInput(evt) {
        var val = ttc.slider.value/100;
        ttc.text.value = Math.floor(val*1000)/1000;
        ttc.onchange.forEach(function(f) { f(ttc);});
    }


    function textInput(evt) {
        ttc.goto(Number(ttc.text.value));
    }

    function checkboxCallback() {
        if (ttc.run.value) {
            ttc.scheduleStep();
        } else {
            if (ttc.stepTimeout) {
                window.cancelTimeout(ttc.stepTimeout);
                ttc.stepTimeout = null;
            }
        }
    }

    if (installTo) {
        installTo.appendChild(this.div);
    }
}

TrainTimeController.prototype.goto = function(u) {
    var gu = u % this.slider.max;
    this.text.value = Math.floor(gu*1000)/1000;
    this.slider.value = gu;
    var ttc = this;
    ttc.onchange.forEach(function(f) { f(ttc);});
}

TrainTimeController.prototype.setMax = function(m) {
    this.slider.max = m;
}

TrainTimeController.prototype.getTime = function() {
    return Number(this.slider.value);
}

TrainTimeController.prototype.step = function() {
    var stepSize = Number(this.speed.value/100);
    this.goto(this.getTime() + stepSize);
}

TrainTimeController.prototype.scheduleStep = function() {
    if (!this.stepTimeout) {
        var that=this;
        that.stepTimeout = window.setTimeout(function() {
            that.stepTimeout = null;
            that.step();
            if (that.run.checked) {
                that.scheduleStep();
            }
        }, 25);
    }
}