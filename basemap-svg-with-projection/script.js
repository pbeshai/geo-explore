var svg = d3.select('#map')
var g = svg.append('g');

// read in the dimensions from the SVG attributes
var width = +svg.attr('width');
var height = +svg.attr('height');

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

  // project the data using geoAlbersUsa, fit to whatever dimensions our SVG is.
  var projection = d3.geoAlbersUsa()
    .fitSize([width, height], nationGeo);

  // path generator - converts GeoJSON feature or geometry to SVG path `d`
  var path = d3.geoPath(projection);

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
}

// load the TopoJSON data file
// us-10m.no-projection.json is from the us-atlas project but has not been projected.
d3.queue()
  .defer(d3.json, 'us-10m.no-projection.json')
  .await(display);
