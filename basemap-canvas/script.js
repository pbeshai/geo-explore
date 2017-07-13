var canvas = d3.select('#map');
var context = canvas.node().getContext("2d");

// pass canvas context into the path generator so it draws on canvas
var path = d3.geoPath().context(context);

// data variables to be populated when data is loaded
var usTopo;
var nationGeo;
var statesGeo;

// read in the dimensions from the canvas attributes
var width = +canvas.attr('width');
var height = +canvas.attr('height');

function updateCanvas() {
  // save the context state
  context.save();

  // clear anything drawn on the canvas
  context.clearRect(0, 0, width, height);

  // draw in the nation
  context.beginPath();
  path(nationGeo);
  context.fillStyle = '#e6e6e6';
  context.fill();

  // draw in the state boundaries
  context.beginPath();
  path(statesGeo);
  context.strokeStyle = '#fff';
  context.stroke();

  // restore the context state
  context.restore();
}

function display(error, data) {
  if (error) {
    console.error(error);
    return;
  }

  usTopo = data;
  console.log('usTopo', usTopo);

  // convert the nation topology to a GeoJSON FeatureCollection
  nationGeo = topojson.feature(usTopo, usTopo.objects.nation);
  console.log('nationGeo', nationGeo);

  // convert states to GeoJSON MultiLineString
  statesGeo = topojson.mesh(usTopo, usTopo.objects.states,
    // exclude exterior lines with an a !== b filter
    function(a, b) { return a !== b; });
  console.log('statesGeo', statesGeo);

  // update the canvas with the data
  updateCanvas();
}

// load the TopoJSON data file
// us-10m.v1.json is from the us-atlas project and is projected using geoAlbersUsa
// to fit a 960x600 viewport and is simplified.
d3.queue()
  .defer(d3.json, 'us-10m.v1.json')
  .await(display);
