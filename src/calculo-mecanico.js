var div = document.getElementById('divCatenaria');
var scene;

var cable = CableLA56;

var conditions1 = new Conditions();
var conditions2 = new Conditions();



var tramo;
var range;
var sceneRange;
var constantes;
var catenariaInicialGraph;
var catenariaNuevaGraph;
var posteIzquierdoGraph;
var posteDerechoGraph;
var arrow1, arrow2;
var topLine, bottomLine1, bottomLine2;
var construido = false;
var height = 30;


var construirDibujo = function (form) {

  //var botonConstruir = 
  document.getElementById("botonConstruir").style.display = 'none';
  document.getElementById("outputPanel").style.display = 'block';
  document.getElementById("cableTable").className="col-sm-6";
  document.getElementById("cableTableDescription").className="col-sm-6";
  document.getElementById("temperatureTableDescription").style.display = 'block';

  construido = true;

  var span = form.span.value;
  var temperature = form.temperature.value;
  var windPressure = form.windPressure.value;
  var tension = form.tension.value;

  var tensionOutput = document.getElementById('outputTension');
  var sagOutput     = document.getElementById('outputSag');

  conditions1.span = span;
  conditions1.temperature = temperature;
  conditions1.windPressure = windPressure;
  conditions1.tension = tension;
  
  conditions2.span = span;
  conditions2.temperature = temperature;
  conditions2.windPressure = windPressure;
  
  range      = SD.rangeMaker({xMin: -conditions1.span/2, xMax: conditions1.span/2, yMin: 0, yMax: 35});
  sceneRange = SD.rangeMaker({xMin: -conditions1.span/2-15, xMax: conditions1.span/2+10, yMin: 0, yMax: 35});

  tramo = new Tramo(cable, conditions1, conditions2);
  tramo.sag();

  constantes = resuelveParabola(tramo.a(), -conditions1.span/2,30, conditions1.span/2, 30);
  catenariaInicialGraph = CD.parabolaGraphMaker({a: tramo.a(), c1: constantes[0], c2: constantes[1], range:range});
  catenariaNuevaGraph   = CD.parabolaGraphMaker({a: tramo.a(), c1: constantes[0], c2: constantes[1], range:range});
  posteIzquierdoGraph   = CD.fancyPoleMaker({x: -conditions1.span/2, height: height});
  posteDerechoGraph     = CD.fancyPoleMaker({x: +conditions1.span/2, height: height});

  arrow1       = SD.lineMaker({x1:-span/2-5,  x2:-span/2-5, y1:height, y2: catenariaInicialGraph.f(0), style: '>-<', arrowSize:1, width:"1px"});
  arrow2       = SD.lineMaker({x1:-span/2-10, x2:-span/2-10, y1:height, y2: catenariaNuevaGraph.f(0), style: '>-<', arrowSize:1, width:"1px"});
  topLine      = SD.lineMaker({x1:-span/2-12, x2: span/2, y1: height, y2: height, style: '--', width:"1px"});
  bottomLine1  = SD.lineMaker({x1:-span/2-12, x2: span/2, y1: catenariaInicialGraph.f(0), y2: catenariaInicialGraph.f(0), style: '--', width:"1px"});
  bottomLine2  = SD.lineMaker({x1:-span/2-12, x2: span/2, y1: catenariaNuevaGraph.f(0), y2: catenariaNuevaGraph.f(0), style: '--', width:"1px"});

  scene = SD.sceneMaker({div: div, range: sceneRange});

  catenariaNuevaGraph.color = '#1e88ab';

  scene.add(catenariaInicialGraph);
  scene.add(catenariaNuevaGraph);
  scene.add(posteIzquierdoGraph);
  scene.add(posteDerechoGraph);

  scene.add(arrow1);
  scene.add(arrow2);
  scene.add(topLine);
  scene.add(bottomLine1);
  scene.add(bottomLine2);

  scene.plotSVG(posteIzquierdoGraph);

  tableCreate(0,24);

  outputSag.innerHTML = ''+tramo.sag().toFixed(2)+' metros';
  outputTension.innerHTML = ''+tramo.finalConditions.tension.toFixed(2)+' Newtons';
  document.getElementById("temperatureTableDescription").innerHTML = '<strong>Tabla 2.</strong> Para un rango \
      de temperaturas de 0 a 25 <sup>º</sup>C, mostramos la tensión y la flecha obtenidas, teniendo en cuenta \
      que estamos trabajando con un vano de ' +span+ ' metros, y que en condiciones iniciales teníamos una    \
      tensión de ' +tension+ 'N, una temperatura de '+temperature+ '<sup>º</sup>C y una presión de viento de  \
      ' +windPressure+ 'N/m<sup>2</sup>.';
  
};

var actualizarDibujo = function (form) {

  var temperature = form.temperature2.value;
  var windPressure = form.windPressure2.value;

  tramo.finalConditions.temperature = temperature;
  tramo.finalConditions.windPressure = windPressure;

  tramo.finalConditions.tension = tramo.solveChangeEquation();
  
  constantes = resuelveParabola(tramo.a(), -conditions1.span/2,30, conditions1.span/2, 30);

  catenariaNuevaGraph.a = tramo.a();
  catenariaNuevaGraph.c1 = constantes[0];
  catenariaNuevaGraph.c2 = constantes[1];
  catenariaNuevaGraph.color = '#1e88ab';
  
  arrow1.y2 = catenariaInicialGraph.f(0);
  arrow2.y2 = catenariaNuevaGraph.f(0);

  bottomLine1.y1 = arrow1.y2;
  bottomLine1.y2 = arrow1.y2;
  
  bottomLine2.y1 = arrow2.y2;
  bottomLine2.y2 = arrow2.y2;

  scene.plotSVG();
  outputSag.innerHTML = ''+tramo.sag().toFixed(2)+' metros';
  outputTension.innerHTML = ''+tramo.finalConditions.tension.toFixed(0)+' Newtons';
};      

var tablaConstruida = false;
function tableCreate(min, max){
  tablaConstruida = true;
  //var body=document.getElementsByTagName('body')[0];
  var tbl=document.getElementById('temperatureTable');
  //tbl.style.width='100%';
  //tbl.setAttribute('border','1');
  var tbdy=document.createElement('tbody');
  var outputTable = tramo.table(min,max,5);
  var titulo = ['Temperatura (<sup>º</sup>C)', 'Tension (N)', 'Flecha (m)'];
  var tr=document.createElement('tr');

  for(var i=-1;i<outputTable.length;i++){
    var tr=document.createElement('tr');
    if(i==-1) {
      for(var j=0;j<titulo.length;j++){
	      var th=document.createElement('th');
	      th.innerHTML = titulo[j];
	      tr.appendChild(th);
      }
    }
    else {
      for(var j=0;j<outputTable[i].length;j++){
	      var td=document.createElement('td');
        if (j==0 || j==1 ) {
          td.innerHTML = outputTable[i][j].toFixed(0);
        } else {
          td.innerHTML = outputTable[i][j].toFixed(2);
        }
	      tr.appendChild(td)
      }
    }
    tbdy.appendChild(tr);
  }
  tbl.appendChild(tbdy);
  //body.appendChild(tbl)
}
