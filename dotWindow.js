/**
 implements a window where there are a bunch of dots that can  be dragged around
 **/

function DotWindow(_canvas, _ptArray, _drawType) {
    "use strict";
    if (!this) throw Error("DotWindow not called as Constructor");

    if (_drawType) _drawType = _drawType.toLowerCase();

    // we can do GL or HTML5 Canvas
    if ((_drawType == "gl") || (_drawType=="webgl") ) {
        this.ctxType = "webgl";
    } else {
        this.ctxType = "2d";
    }

    var that = this;
    this.canvas = _canvas || document.createElement("canvas");
    this.points = _ptArray || [];

    // the main things we need
    this.selected = null;

    // dragging state - since we might get events
    // this is the ID of a point - or null if we're not dragging
    this.dragging = null;

    // keep lists of functions to call at various times
    this.userDraw = [];
    this.onChange = [];

    // keys - warning: these get attached to the window!
    this.keys = {8: dotWindow_deleteKey}

    // for redraw, we'll use this to "schedule" something -
    // if this is not null/undefined, it's the results of a setTimeOut
    // that will do the redraw
    this.scheduledRedraw = null;

    // set up events as method calls
    this.canvas.addEventListener("click", function (e) {
        that.click(e);
    });
    this.canvas.addEventListener("mousedown", function (e) {
        that.mousedown(e);
    });
    this.canvas.addEventListener("mousemove", function (e) {
        that.mousemove(e);
    });
    this.canvas.addEventListener("mouseup", function (e) {
        that.mouseup(e);
    });

    // set up keystroke handler
    window.addEventListener("keydown", function (e) {
        that.keypress(e);
    }, true);

    // draw the initial state
    this.scheduleRedraw();
}

DotWindow.prototype.redraw = function() {
    "use strict";
    var that = this;

    if (that.ctxType == "2d") {
        var ctx = that.canvas.getContext(that.ctxType);
        // clear the canvas
        that.canvas.width = that.canvas.width;

        ctx.save();

        // do the user drawing - first, so the dots get drawn first
        that.userDraw.forEach(function (e) {
            e(ctx, that);
        });

        // draw the dots
        that.points.forEach(function (pt, i) {
            ctx.save();
            var x = pt.x || pt[0];
            var y = pt.y || pt[1];
            var size = pt.size || 5;
            var selected = ( (that.selected) === i);


            var color = selected ? "rgb(255,0,0)" : "rgb(0,0,255)";
            ctx.translate(x, y);
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.rect(-size, -size, size * 2, size * 2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });
        ctx.restore();
    } else {       // replicate everything, since it's done via twgl
        var gl = twgl.getWebGLContext(that.canvas);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if (!that.dotShader) {
            var vertexSource = ""+
                "precision highp float;" +
                "attribute vec2 pos;" +
                "uniform float width;" +
                "uniform float height;" +
                    "uniform float cx;" +
                    "uniform float cy;" +
                "void main(void) {" +
                "  gl_Position = vec4( ( (cx+pos.x) / width)-1.0 , 1.0-( (cy+pos.y) / height), 0,1) ;" +
                 "}";
            var fragmentSource = "" +
                "precision highp float;" +
                "uniform vec3 color;" +
                "void main(void) {" +
                "  gl_FragColor = vec4(color, 1.0);" +
                "}";
            this.dotShader = twgl.createProgramInfo(gl, [vertexSource, fragmentSource]);
        }
        if (!that.dotBuffers) {
            // make this big - so we can allocate once
             var arrays = {
                pos : { numComponents:2, data: [-5,-5, 5,-5, -5,5,  5,-5, -5,5, 5,5]}
            }
            that.dotBuffers = twgl.createBufferInfoFromArrays(gl,arrays);
        }
        gl.useProgram(this.dotShader.program);
        twgl.setBuffersAndAttributes(gl,this.dotShader,this.dotBuffers);

        // the user draw functions happen first 
        that.userDraw.forEach(function (e) {
            e(gl, that);
        });

        // now draw the dots
        that.points.forEach(function (pt, i) {
            var x = pt.x || pt[0];
            var y = pt.y || pt[1];
            var size = pt.size || 5;
            var selected = ( (that.selected) === i);

            var color = selected ? [1,0,0] : [1,1,0];
            twgl.setUniforms(that.dotShader,
                {
                    width: that.canvas.width/2, height: that.canvas.height/2,
                    cx: x, cy: y, color: color
                });
            twgl.drawBufferInfo(gl, gl.TRIANGLES, that.dotBuffers);
        });
    }

    // allow this to happen again
    that.scheduledRedraw = null;
};

// make a redraw happen at the appropriate time
DotWindow.prototype.scheduleRedraw = function() {
    "use strict";
    if (this.scheduledRedraw === null) {
        var that=this;
        this.scheduledRedraw = setTimeout(function() {that.redraw()}, 0);
    }
};

// call this whenever the list changes - it does more than redraw
DotWindow.prototype.listChanged = function() {
    "use strict";

    var that = this;
    this.onChange.forEach(function(f) {f(that);});
    this.scheduleRedraw();
}

// change the selected point
DotWindow.prototype.setSelection = function(point) {
    "use strict";

}

// given the mouse x,y see if we are close to something
DotWindow.prototype.pick = function(pos) {
    "use strict";

    this.selected = null;
    var that = this;
    this.points.forEach(function(pt,i) {
        var x = pt.x || pt[0];
        var y = pt.y || pt[1];
        var size = pt.size || 5;

        if ( (pos[0] > x-size) && (pos[0] < x+size) && (pos[1] > y-size && pos[1] < y+size) ) {
            that.selected = i;
        }
    });
}

// terminate dragging
DotWindow.prototype.endDrag = function() {
    "use strict";

    this.dragging = null;
    this.listChanged();
}

// what to do with a click event
DotWindow.prototype.click = function(event) {
    "use strict";
}

// get the position of an event
DotWindow.prototype.mousePosition = function(event) {
    var rect = this.canvas.getBoundingClientRect();
    return [ event.clientX - rect.left, event.clientY - rect.top];
};

// make a new point - you might over-ride this - for now it's a simple 2D thing
DotWindow.prototype.newPoint = function(pos) {
    "use strict";
    return pos;
}

// what to do with mouse events
DotWindow.prototype.mousedown = function(event) {
    "use strict";
    var pos = this.mousePosition(event);

    var newPoint = this.newPoint(pos);

    if (event.shiftKey) {
        if (this.selected == null) {
            this.points.push(newPoint);
            this.selected = this.points.length - 1;
        } else {
            this.points.splice(this.selected+1,0,newPoint);
            this.selected = this.selected+1;
        }
    } else {
        this.pick(pos);
    }

    if (this.selected != null) {
        this.dragging = pos;
    }

    this.listChanged();
}

DotWindow.prototype.keypress = function(event) {
    var func = this.keys[event.keyCode];
    if (func) {
        func(this,event);
        event.preventDefault();
    }
}

// what to do with a mouse move event
DotWindow.prototype.mousemove = function(event) {
    "use strict";

    // if we missed the mouse up, let's be sure
    if ((!event.buttons) && this.dragging) {
        this.endDrag();
    }

    if (this.dragging && (this.selected != null)) {
        var pos = this.mousePosition(event);
        this.points[this.selected][0] = pos[0];
        this.points[this.selected][1] = pos[1];
        this.listChanged();
    }
}

// what to do with a mouse move event
DotWindow.prototype.mouseup = function(event) {
    "use strict";

    if (this.dragging) {
        this.endDrag();
    }
}

/////////////////////////////////////////////////////////////////
// Examples of user functions that will be useful
// an example user draw function
function dotWindow_connect(ctx,dotwindow) {
    ctx.save();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    if (dotwindow.points.length) {
        ctx.beginPath();
        dotwindow.points.forEach(function(pt,i) {
            var x = pt.x || pt[0];
            var y = pt.y || pt[1];
            if (i) { ctx.lineTo(x,y); }
            else   { ctx.moveTo(x,y); }
        });
        ctx.stroke();
    }
}

// a version of connect in GL - how ugly!
function dotWindow_connectGL(gl,dotwindow) {
    "use strict";
        if (!dotwindow.lineShader) {
            // horrifying - use the position to say which end of the line
            // pass the variables as uniforms
            var vertexSource = ""+
                "precision highp float;" +
                "attribute vec2 pos;" +
                "uniform float width;" +
                "uniform float height;" +
                "uniform float x1;" +
                "uniform float x2;" +
                "uniform float y1;" +
                "uniform float y2;" +
                "void main(void) {" +
                "  gl_Position = vec4( ( (x1*pos.x+x2*pos.y) / width)-1.0 , 1.0-( (y1*pos.x+y2*pos.y) / height), 0,1) ;" +
                 "}";
            var fragmentSource = "" +
                "precision highp float;" +
                "uniform vec3 color;" +
                "void main(void) {" +
                "  gl_FragColor = vec4(color, 1.0);" +
                "}";
            dotwindow.lineShader = twgl.createProgramInfo(gl, [vertexSource, fragmentSource]);
        }
        if (!dotwindow.lineBuffers) {
            // make this big - so we can allocate once
             var arrays = {
                pos : { numComponents:2, data: [1,0, 0,1]}
            }
            dotwindow.lineBuffers = twgl.createBufferInfoFromArrays(gl,arrays);
        }
        gl.useProgram(dotwindow.lineShader.program);
        twgl.setBuffersAndAttributes(gl,dotwindow.lineShader,dotwindow.lineBuffers);

        var i;
        for (i=0; i<dotwindow.points.length-1; i++)  {
            var x1 = dotwindow.points[i].x || dotwindow.points[i][0];
            var y1 = dotwindow.points[i].y || dotwindow.points[i][1];
            var x2 = dotwindow.points[i+1].x || dotwindow.points[i+1][0];
            var y2 = dotwindow.points[i+1].y || dotwindow.points[i+1][1];

            twgl.setUniforms(dotwindow.lineShader,
                {
                    width: dotwindow.canvas.width/2, height: dotwindow.canvas.height/2,
                    x1: x1, y1: y1, x2: x2, y2: y2, color: [1,1,1]
                });
            twgl.drawBufferInfo(gl, gl.LINES, dotwindow.lineBuffers);
        }
    }

// note - this one is installed by default
function dotWindow_deleteKey(dotWindow, evt) {
    if (dotWindow.selected != null) {
        dotWindow.points.splice(dotWindow.selected,1);
        dotWindow.selected = null;
        dotWindow.listChanged();
    }
}