//constant variables, could either hardcode here or called with method
var genRate = .02
var maxAge = 1.8;
var scaleSpeed = 4;
var moveSpeed = 15;
var radius = 3;

function steam(){
    this.center = [0,0];
    this.clouds = [];
}

steam.prototype.update = function(time) {
    this.clouds.forEach(function (e) {
        e.update(time);
    });
    this.clouds.push( new cloud(this.center[0], this.center[1], Math.random()+0.5) );
	
	var stillClouds = [];
    this.clouds.forEach(function (eachCloud) {
        if(eachCloud.active){
            stillClouds.push(eachCloud);
        }
    });
	this.clouds = stillClouds;
};
steam.prototype.draw = function(ctx){
    this.clouds.forEach(function (e) {
        if(e.active){
            ctx.beginPath();
			var opacity = (maxAge-e.age)/maxAge;
			ctx.fillStyle = 'rgba(0, 0, 0, '+ opacity/10 +')';
            ctx.arc(e.x+.1, e.y+.2, e.scale*radius,0,1.5*Math.PI);
			ctx.fill();
			ctx.arc(e.x, e.y, e.scale*radius,0,2*Math.PI);
			ctx.fill();
			ctx.arc(e.x+.2, e.y+.1, e.scale*radius,0,1*Math.PI);
            ctx.fill();
        }
    });
}

function cloud(x,y, scale){
    this.x = x;
    this.y = y;
    this.scale = scale | 1;
    this.age = 0;
    this.active = true;
    this.speedX = Math.random()*moveSpeed - moveSpeed/2;
    this.speedY = Math.random()*moveSpeed - moveSpeed/2;
}

cloud.prototype.update = function(time){
    this.age += time;
    if( this.age > maxAge){
        this.active = false;
    }
	else{
        this.scale += scaleSpeed*time;
        this.x += this.speedX*time;
        this.y += this.speedY*time;
    }
}