
// var projection = d3.geoAlbersUsa()
//   .scale(1280)
//   .translate([480, 300]);


var canvas = d3.select('#map');
var context = canvas.node().getContext("2d");
var us = null;

// pass in context to path generator
var path = d3.geoPath()
  .context(context);

var width = +canvas.attr('width');
var height = +canvas.attr('height');
var zoomTransform = d3.zoomIdentity;

function display(error, data) {
  console.log(error)

  var zoom = d3.zoom()
    .scaleExtent([1,8])
    .on('zoom', zoomed);

  us = data;
  this.canvas.call(zoom);

  updateCanvas();
}

function updateCanvas() {
  context.save();
  context.clearRect(0, 0, width, height);
  context.translate(zoomTransform.x, zoomTransform.y);
  context.scale(zoomTransform.k, zoomTransform.k);
  context.beginPath();
  path(topojson.feature(us, us.objects.nation));
  context.fillStyle = '#ddd';
  context.fill();
  path(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }));
  context.strokeStyle = '#fff';
  context.stroke();
  context.restore();
}

function zoomed() {
  context.clearRect(0, 0, width, height);
  zoomTransform = d3.event.transform;
  updateCanvas();
}

d3.queue()
  .defer(d3.json, 'us-10m.v1.json')
  .await(display);
