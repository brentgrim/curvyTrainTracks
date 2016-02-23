function catmullRomCurve(nSamples){
    this.nSamples = nSamples || 24;
    this.controlPoints = [];
    this.samples = [];
    this.cumulativeLength = [];
    this.ta = 0.3;
    this.catmullRom = function (s,p0,p1,p2,p3){
        var ta = this.ta;
        var s2 = s*s;
        var s3 = s*s*s;
		//|   0    1    0    0 
		//|  -s    0    s    0
		//|  2s   s-3  3-2s -s 
		//|  -s   2-s  s-2   s  
        return p1 + s * ( -ta*p0 + ta*p2) + s2 * ( 2*ta*p0 + (ta-3)*p1+(3-2*ta)*p2-ta*p3)
            + s3 * (-ta*p0 + (2-ta)*p1+ (ta-2)*p2 + ta*p3);
    }

    this.catmullRomDerivative = function (s,p0,p1,p2,p3){
        var ta = this.ta;
        var s2 = 2*s;
        var s3 = 3*s*s;
        s = 1;
        return s * ( -ta*p0 + ta*p2) + s2 * ( 2*ta*p0 + (ta-3)*p1+(3-2*ta)*p2-ta*p3)
            + s3 * (-ta*p0 + (2-ta)*p1+ (ta-2)*p2 + ta*p3);
    }
}

catmullRomCurve.prototype.resample = function() {
    this.samples = [];
    this.cumulativeLength = [];
    var that = this;
    var P0 = this.controlPoints[this.controlPoints.length-1];
    var lastLength = 0;
    var lastPoint = this.controlPoints[0];
    for( var i = 0; i < this.controlPoints.length; i++) {
        var P1 = this.controlPoints[i];
        var P2 = this.controlPoints[ (i+1) % this.controlPoints.length ];
        var P3 = this.controlPoints[ (i+2) % this.controlPoints.length ];
        for( var j = 0; j < this.nSamples; j++) {
            var e = [];
			e[0] = this.catmullRom(j / this.nSamples, P0[0], P1[0], P2[0], P3[0]);
            e[1] = this.catmullRom(j / this.nSamples, P0[1], P1[1], P2[1], P3[1]);
            this.samples.push(e);
            var difX = e[0] - lastPoint[0];
            var difY = e[1] - lastPoint[1];
            var length = Math.sqrt(difX * difX + difY * difY);
            lastLength = lastLength+length;
            that.cumulativeLength.push(lastLength);
            lastPoint = e;
        }
        P0 = P1;
    }
    var difX = this.controlPoints[0][0] - lastPoint[0];
    var difY = this.controlPoints[0][1] - lastPoint[1];
    var length = Math.sqrt(difX*difX + difY*difY);
    that.cumulativeLength.push(lastLength+length);
};




catmullRomCurve.prototype.eval = function(t) {
    if( t >= this.controlPoints.length){
        t -= this.controlPoints.length;
    }
    if( t < 0){
        t += this.controlPoints.length;
       
    }
    var low = Math.floor(t);
    var tt = t - low;
    var pli = low-1;
    if( pli < 0 ){
        pli += this.controlPoints.length;
    }
    var P1 = this.controlPoints[pli];
    var P2 = this.controlPoints[low];
    var P3 = this.controlPoints[ (low+1) % this.controlPoints.length];
    var P4 = this.controlPoints[ (low+2) % this.controlPoints.length];

    var rX = this.catmullRom(tt, P1[0], P2[0], P3[0], P4[0]);
    var rY = this.catmullRom(tt, P1[1], P2[1], P3[1], P4[1]);

    var derX = this.catmullRomDerivative(tt, P1[0], P2[0], P3[0], P4[0]);
    var derY = this.catmullRomDerivative(tt, P1[1], P2[1], P3[1], P4[1]);
    return [rX, rY, derX, derY];
};

catmullRomCurve.prototype.arcLength = function(t) {
    if( t == 0 ){
        return 0;
    }
    if( t >= this.controlPoints.length){
        t -= this.controlPoints.length;
    }
    if( t < 0){
        t += this.controlPoints.length;
    }

    var numPoints = this.controlPoints.length;
    t = t / numPoints;

    var ll = t * this.cumulativeLength.peek();
    var kk = Math.abs(binarySearch(this.cumulativeLength,ll));
    var u = (ll-this.cumulativeLength[kk]) / (this.cumulativeLength[kk+1]-this.cumulativeLength[kk]);
    var linInter = (kk+u)/this.cumulativeLength.length*numPoints;
    return linInter;

    function binarySearch(ar, el) {
        var m = 0;
        var n = ar.length - 1;
        while (m <= n) {
            var k = (n + m) >> 1;
            var cmp = el - ar[k];
            if (cmp > 0) {
                m = k + 1;
            } else if(cmp < 0) {
                n = k - 1;
            } else {
                return k;
            }
        }
        return -m+1;
    }
};