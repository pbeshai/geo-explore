var svg = d3.select('#map')
var g = svg.append('g');
var gMap = g.append('g').attr('class', 'map-group');
var gPoints = g.append('g').attr('class', 'points');

// read in the dimensions from the SVG attributes
var width = +svg.attr('width');
var height = +svg.attr('height');

// callback used after the zoom updates (pan or zoom)
function zoomed() {
  // we apply a transform directly to the SVG's map <g> tag which in effect
  // will scale and translate the map, but doesn't affect the points. We
  // need to translate the points as well but not scale them to accomplish
  // semantic zooming.
  gMap.attr('transform', d3.event.transform);

  // update the position of each point -- kind of slow with 20,000 points,
  // so we cut down to 3000 points for this svg example.
  gPoints.selectAll('.point')
    .attr('transform', function (d) {
      return 'translate(' + d3.event.transform.applyX(d.x) + ',' + d3.event.transform.applyY(d.y) + ')';
    });
}

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

  // convert states to GeoJSON MultiLineString
  var statesGeo = topojson.mesh(usTopo, usTopo.objects.states,
    // exclude exterior lines with an a !== b filter
    function(a, b) { return a !== b; });
  console.log('statesGeo', statesGeo);

  // path generator - converts GeoJSON feature or geometry to SVG path `d`
  var path = d3.geoPath();

  // the us-10m dataset already has this projection applied to it, so we do
  // not need to apply it to the path generator, but we do need it for
  // to place the data points correctly.
  var projection = d3.geoAlbersUsa()
    .scale(1280)
    .translate([480, 300]);

  // for performance reasons, let's cut down to 3000 points
  postOfficeData = d3.shuffle(postOfficeData).slice(0, 3000)

  postOfficeData.forEach(function(d) {
    var p = projection([+d.lon, +d.lat]);
    if (p) {
      d.x = p[0];
      d.y = p[1];
    }
  });

  // add in a rectangle for a colored background
  gMap.append('rect')
    .attr('class', 'background')
    .attr('width', width)
    .attr('height', height);

  // draw in the nation path
  gMap.append('path')
    .datum(nationGeo)
    .attr('class', 'nation')
    .attr('d', path);

  // draw in the states path
  gMap.append('path')
    .datum(statesGeo)
    .attr('class', 'states')
    .attr('d', path);

  // prepare the tooltip
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .html(function(d) {
      // capitalize the state name
      var state = d.state.split(' ').map(function (state) {
        return state[0].toUpperCase() + state.slice(1)
      }).join(' ');

      // show post office name and state
      return '<h3>' + d.name + '</h3><div>' + state + '</div>';
    });

  svg.call(tip);

  // add in the points
  gPoints.selectAll('.point')
    .data(postOfficeData)
    .enter()
    .append('circle')
    .attr('class', 'point')
    .attr('r', 3)
    .attr('opacity', 0.2)
    .attr('transform', function (d) { return 'translate(' + d.x + ', ' + d.y + ')'; })
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide);

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
// post_offices_with_states.csv includes locations and names of post offices across USA.
d3.queue()
  .defer(d3.json, 'us-10m.v1.json')
  .defer(d3.csv, 'post_offices_with_states.csv')
  .await(display);
