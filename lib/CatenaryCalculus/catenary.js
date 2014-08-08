var G = 9.81

/*
Funciones generales para calcular una catenaria
*/

var catenaria = function (x,a,c1,c2){
  switch(arguments.length) {
    case 1:
      a = 1;
    case 2:
      c1 = 0;
    case 3:
      c2 = 0;
      break;
  }
  return a*(Math.exp((x-c1)/a) + Math.exp(-(x-c1)/a))/2 + c2;
};

function parabola(x,a,c1,c2){
  switch(arguments.length) {
    case 1:
      a = 1;
    case 2:
      c1 = 0;
    case 3:
      c2 = 0;
      break;
  }
  return a+Math.pow(x-c1,2)/(2*a) + c2;
};


function resuelveParabola(a,x1,y1,x2,y2) {
  var c1 = a*(y2-y1)/(x1-x2) + (x1+x2)/2;
  var c2 = y1-parabola(x1,a,c1);
  return [c1,c2];
};

var CableLA56 = {
  elasticModulus: 7.9641*Math.pow(10,10),
  dilationCoefficient: 0.00001910,     
  section: 54.60,
  linearDensity: 0.189,   
  diameter: 9.5
}

var cableHalcon = {
    elasticModulus: 7730*1000000*G,
    dilationCoefficient: 0.00001899,     
    section: 281.10,
    linearDensity: 0.9746,   
    diameter: 21.793
}


function Conditions() {

  // optional values
  this.iceCoefficient = 0;
  this.iceWidth = 0;
  this.windPressure = 0;

  // output values
  this.loadRate = 0;
  this.tension = 0;
  this.sag = 0;
};



function Tramo(cable, initialConditions, finalConditions) {

  this.cable = cable;
  this.initialConditions = initialConditions;
  this.finalConditions = finalConditions;

  this.loadRate = function (situation) {

    var conditions;
    if(situation == 1)           conditions = this.initialConditions;
    else if (situation == 2)     conditions = this.finalConditions;
    else                         console.log('No se en que condiciones calcular loadRate');

    var ph = conditions.iceCoefficient*Math.sqrt(this.cable.diameter);
    var pv = conditions.windPressure * (this.cable.diameter/1000 + 2*conditions.iceWidth); //note that diameter is converted to meters
    var p  = this.cable.linearDensity;

    pApparent = Math.sqrt((p+ph)*(p+ph) + pv*pv);
    m = pApparent / p;

    conditions.loadRate = m; // we store the value, just in case

    return m;
  };

  this.sag = function() {
    this.solveChangeEquation();
    return this.initialConditions.span*this.initialConditions.span*this.cable.linearDensity*this.finalConditions.loadRate*G / (8*this.finalConditions.tension);
  };

  this.a = function() {
    return this.finalConditions.tension/(G*this.cable.linearDensity*this.finalConditions.loadRate);
  };

  this.solveChangeEquation = function () {
    this.loadRate(1);
    this.loadRate(2);

    var x = solveGeneralChangeEquation(this.A(), this.B()); // x is the solution in Kg / mm^2
    var tension = x * G * this.cable.section;  // tension is x converted to Newtons

    //console.log('K: ', this.K(), 'A: ', this.A(), 'B: ', this.B(), 't: ', x, 'tension: ', tension/G);
    
    this.finalConditions.tension = tension;
    return tension;
  };


  // the following functions are needen only when solving the change equation.
  this.A = function() {
    var deltaT = this.finalConditions.temperature - this.initialConditions.temperature;
    var a = this.cable.dilationCoefficient * deltaT * this.cable.elasticModulus/(1000000*G);

    return a-this.K();
  };

  this.B = function() {
    var a = this.finalConditions.span * this.finalConditions.loadRate * this.cable.linearDensity / (1000*this.cable.section);
    var b = this.cable.elasticModulus / (24*G)
    var c = Math.pow(a,2) * b;

    return c;
  }


  this.K = function() {
    var a = this.initialConditions.tension/(G*this.cable.section);
    var b = this.initialConditions.span*this.initialConditions.loadRate*this.cable.linearDensity/(this.initialConditions.tension*1000);
    var c = Math.pow(b,2)*this.cable.elasticModulus*G/24;

    //console.log('k = a - c, donde a y c son: ', a,c);

    var K = a-c;    
    return K;
  };

  this.table = function (minima, maxima, salto) {
    var numeroEntradas = Math.floor((maxima-minima)/salto)+2;
    var table=[];
    var entrada=[];
    for(var i=0; i<numeroEntradas; i++) {
      temperature = minima + i*salto;
      this.finalConditions.temperature   = temperature;
      entrada = [temperature,  this.solveChangeEquation(), this.sag()];
      table.push(entrada);
    };
    return table;
  };
};


var solveGeneralChangeEquation = function(A,B) {
  var evalua = function(x) {
    return x*x*(x+A) - B;
  }
  
  //iteracion inicial
  var a = Math.pow(B, 1/3); 
  
  if(evalua(a) > 0) {
    while(evalua(a)>0) {
      a = a/2;
    }
    b = 2*a;
  }

  else {
    b = 2*a;
    while(evalua(b)<0) {
      b = 2*b;
    }
  }

  // ahora ya tengo un intervalo en el cual se encuentra mi raiz
  var precision = 0.000001;
  do {
    var c = (a+b)/2;

    if(evalua(c)>0) b = c;
    else            a = c;

  } while(b-a > precision);

  return c;
  
}

