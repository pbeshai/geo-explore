var svg = d3.select('#map')
var g = svg.append('g');

// read in the dimensions from the SVG attributes
var width = +svg.attr('width');
var height = +svg.attr('height');

function display(error, usTopo, postOfficeData) {
  if (error) {
    console.error(error);
    return;
  }
  console.log('postOfficeData', postOfficeData, postOfficeData[0]);
  console.log('usTopo', usTopo);

  // convert the nation topology to a GeoJSON FeatureCollection
  var nationGeo = topojson.feature(usTopo, usTopo.objects.nation);
  console.log('nationGeo', nationGeo);

  // convert states to GeoJSON FeatureCollection
  var statesGeo = topojson.feature(usTopo, usTopo.objects.states,
    // exclude exterior lines with an a !== b filter
    function(a, b) { return a !== b; });
  console.log('statesGeo', statesGeo);

  // group post offices by state to get count
  var postOfficesByState = d3.nest()
    .key(function (d) { return d.stateFips; })
    .object(postOfficeData)
  console.log('postOfficesByState', postOfficesByState);

  // get an array of the number of post offices in each state
  var statePostOfficeCounts = Object.keys(postOfficesByState).map(function (key) {
    return postOfficesByState[key].length;
  })

  // find the max number of post offices in a state for our color scale
  var postOfficeCountMax = d3.max(statePostOfficeCounts);

  // create a color scale to use for coloring in states based on number of post offices
  // use the square root to apply an exponential transform
  var colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, Math.sqrt(postOfficeCountMax)]);

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

  // draw in the states path colored by number of post offices
  g.selectAll('.state').data(statesGeo.features).enter().append('path')
    .attr('class', 'states')
    .attr('d', path)
    .style('fill', function (d) {
      var postOfficesInState = postOfficesByState[d.id];
      var numPostOffices = postOfficesInState ? postOfficesInState.length : 0;

      // use the square root to apply an exponential transform
      return colorScale(Math.sqrt(numPostOffices));
    });
}

// load the TopoJSON data file
// us-10m.v1.json is from the us-atlas project and is projected using geoAlbersUsa
// to fit a 960x600 viewport and is simplified.
// post_offices_with_states.csv includes locations and names of post offices across USA.
d3.queue()
  .defer(d3.json, 'us-10m.v1.json')
  .defer(d3.csv, 'post_offices_with_states.csv')
  .await(display);
