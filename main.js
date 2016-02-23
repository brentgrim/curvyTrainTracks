//tried to make this class only include method calls and html logic, but it is still really messy
window.onload = function() {
    "use strict";
    var body = document.body;
    var width = 800;

    var canvas = document.createElement("canvas");
    canvas.setAttribute("width",width);
    canvas.setAttribute("height",600);
    canvas.style.border = "1px solid";
    body.appendChild(canvas);


    var slider2 = makeSlider("tension: ", width, body, function(){
        cc.resample();
        ttc.setMax(dw.points.length);
        dw.scheduleRedraw();
    });

    slider2.min = 0;
    slider2.max =  1;
    slider2.step = .01;
    slider2.value = 0.5;

    
	var dotList =[[100,300], [100,100], [150,150], [300,100], [300,300], [250,250]];
    var ttc = new TrainTimeController(width,body,dotList.length);
	var dw = new DotWindow(canvas, dotList);
    var cc =  new catmullRomCurve();
    cc.controlPoints = dw.points;
    cc.resample();
    dw.scheduleRedraw();


    var controls = document.createElement("div");
    controls.style.border = "1px solid black";
    controls.style.padding = "5px";
    controls.style.marginTop = "5px";
    controls.style.marginBottom = "5px";
    controls.style.display = "block";
    controls.style.width = (width-10) +"px";    
    body.appendChild(controls);
  
    var asRails = makeCheckBox("AsRails",controls,dw.scheduleRedraw());

    dw.onChange.push(function(dw) {
        cc.resample();
        ttc.setMax(dw.points.length);
    });

    ttc.onchange.push(function() {dw.scheduleRedraw();});

    var puff = new steam();

    var lastTime = 0;
    var savedCtx = undefined;
    function myDraw(e){
        window.requestAnimationFrame(myDraw);
        puff.update( (e-lastTime) / 1000);
        lastTime = e;
    }
    myDraw(0);
		
    //draws the train and track
    dw.userDraw.push(function(ctx,dotWindow) {
        savedCtx = ctx;
        cc.ta = slider2.value;
		
		//doesn't work perfectly, but is pretty close
        if (asRails.checked) {
            cc.samples.forEach(function (e, i) {
				ctx.save();
			    ctx.translate(e[0], e[1]);
				var rotation = Math.atan2(e[0], e[1]);
				ctx.rotate(rotation);
				ctx.beginPath();
				ctx.moveTo(-10,0);
				ctx.rotate(rotation);
				ctx.lineTo(10,0);
				ctx.strokeStyle = "brown";
				ctx.lineWidth = 5;
				ctx.stroke();
			    ctx.restore();	
            });
			ctx.save();
            ctx.strokeStyle = "black";
            ctx.linewidth = 2;
            ctx.beginPath();
            var last = cc.samples.length-1;
            ctx.moveTo(cc.samples[last][0],cc.samples[last][1]);
            cc.samples.forEach(function (e, i) {
                ctx.lineTo(e[0],e[1]-6);
            });
            ctx.stroke();
            ctx.restore();
			 
			ctx.save();
            ctx.strokeStyle = "black";
            ctx.linewidth = 2;
            ctx.beginPath();
            var last = cc.samples.length-1;
            ctx.moveTo(cc.samples[last][0],cc.samples[last][1]);
            cc.samples.forEach(function (e, i) {
                ctx.lineTo(e[0],e[1]+6);
            });
            ctx.stroke();
            ctx.restore();
	
        } else {
            ctx.save();
            ctx.strokeStyle = "black";
            ctx.linewidth = 5;
            ctx.beginPath();
            var last = cc.samples.length-1;
            ctx.moveTo(cc.samples[last][0],cc.samples[last][1]);
            cc.samples.forEach(function (e, i) {
                ctx.lineTo(e[0],e[1]);
            });
            ctx.stroke();
            ctx.restore();	 
        }

		var t =  cc.arcLength(ttc.getTime());
        var pos = cc.eval(t);
        var rotation = Math.atan2(pos[3], pos[2]);

		//draw train 
        ctx.save();
        ctx.translate(pos[0],pos[1]);
        ctx.rotate(rotation);
        drawTrain(ctx,25,20);
        ctx.restore();

		//draw steam coming from engine
        var tangent = normalize(pos[2],pos[3]);
        puff.center = [ pos[0] + tangent[0]*7,pos[1] + tangent[1]*7] ;
        puff.draw(ctx);

    });
}