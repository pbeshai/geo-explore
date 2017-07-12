var svg = d3.select('#map')
var g = svg.append('g');

// read in the dimensions from the SVG attributes
var width = +svg.attr('width');
var height = +svg.attr('height');

// callback used after the zoom updates (pan or zoom)
function zoomed() {
  // we apply a transform directly to the SVG's main <g> tag which in effect
  // will scale and translate everything directly. This is also known as
  // "geometric zooming". For an example of "semantic zooming", see
  // https://bl.ocks.org/mbostock/3680957
  g.attr('transform', d3.event.transform);

  // log the transform to see what is happening
  console.log('Zoomed. Scale =', approx(d3.event.transform.k), 'Translate x =',
    approx(d3.event.transform.x), 'y =', approx(d3.event.transform.y));

  // helper function just for logging purposes to more readable numbers
  function approx(d) {
    return Math.round(1000 * d) / 1000;
  }
}

function display(error, usTopo) {
  if (error) {
    console.error(error);
    return;
  }
  console.log('usTopo', usTopo);

  // convert the nation topology to a GeoJSON FeatureCollection
  var nationGeo = topojson.feature(usTopo, usTopo.objects.nation);
  console.log('nationGeo', nationGeo);

  // convert states to GeoJSON MultiLineString
  var statesGeo = topojson.mesh(usTopo, usTopo.objects.states,
    // exclude exterior lines with an a !== b filter
    function(a, b) { return a !== b; });
  console.log('statesGeo', statesGeo);

  // path generator - converts GeoJSON feature or geometry to SVG path `d`
  var path = d3.geoPath();

  // add in a rectangle for a colored background
  g.append('rect')
    .attr('class', 'background')
    .attr('width', width)
    .attr('height', height);

  // draw in the nation path
  g.append('path')
    .datum(nationGeo)
    .attr('class', 'nation')
    .attr('d', path);

  // draw in the states path
  g.append('path')
    .datum(statesGeo)
    .attr('class', 'states')
    .attr('d', path);


  // the zoom handler. We set the min and max zoom levels with the scaleExtent
  // and the min and max x and y values with the translateExtent. The translate
  // extent makes it so we can only pan when zoomed in.
  var zoom = d3.zoom()
    .scaleExtent([1, 8])
    .translateExtent([[0, 0], [width, height]])
    .on('zoom', zoomed);

  // add in zoom functionality to the svg element
  svg.call(zoom);
}

// load the TopoJSON data file
// us-10m.v1.json is from the us-atlas project and is projected using geoAlbersUsa
// to fit a 960x600 viewport and is simplified.
d3.queue()
  .defer(d3.json, 'us-10m.v1.json')
  .await(display);
