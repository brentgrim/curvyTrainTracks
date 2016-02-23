//Tried to simplify main.js by leaving some functions here.
Array.prototype.peek = function() {
    return this[this.length-1];
}

function makeCheckBox(name, appendTo, callback) {
    var span = document.createElement("SPAN");
    var label = document.createTextNode(name);
    var button = document.createElement("INPUT");
    span.appendChild(button);
    span.appendChild(label);
    span.style.width = '150px';
    span.style.display = "inline-block";
    button.setAttribute("type", "checkbox");
    button.checked = false;
    if (callback) button.addEventListener("change",callback);
    if (appendTo) appendTo.appendChild(span);
    return button;
}

function makeSlider(name, width, appendTo, callback ) {
    var p = document.createElement("p");
    p.innerHTML = name;
    var slider2 = document.createElement("input");
    slider2.setAttribute("type", "range");
    slider2.style.width = (width-250) + "px";
    slider2.min = 0;
    slider2.max =  1;
    slider2.step = .01;
    slider2.value = 0.5;
    p.appendChild(slider2);

    var sp =  document.createElement("span");
    p.appendChild(sp)

    if (callback) slider2.addEventListener("input",function(){ sp.innerHTML = slider2.value; callback();});
    if (appendTo) appendTo.appendChild(p);
    return slider2;
}

function drawTrain(ctx,width,height){        
		//body
        ctx.beginPath();
        ctx.rect(-width*.75,-height*.5,width*1.5,height*1);
        ctx.fillStyle = "steelblue";
        ctx.fill();
		//shovel thing?
        ctx.beginPath();
        ctx.moveTo(width*.5,-height*.3);
        ctx.lineTo(width*.8, -height*.7);
        ctx.lineTo(width*.8,  height*.7);
        ctx.lineTo(width*.5, height*.3);
        ctx.fillStyle = "silver";
        ctx.fill();
        //smokestack
		ctx.beginPath();
        ctx.arc(width/2,0,height/4,0,2*Math.PI);
        ctx.fillStyle = "black";
        ctx.fill();
    }

function normalize(x,y){
        var len = Math.sqrt(x*x+y*y);
        return [x/len, y/len];
}
