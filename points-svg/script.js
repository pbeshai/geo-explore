
var projection = d3.geoAlbersUsa()
  .scale(1280)
  .translate([480, 300]);

var path = d3.geoPath();

var svg = d3.select('#map')
var g = svg.append('g');
var width = +svg.attr('width');
var height = +svg.attr('height');

function display(error, us, data) {
  console.log(error)

  var zoom = d3.zoom()
    .scaleExtent([1,8])
    .on('zoom', zoomed);

  g.append('rect')
    .attr('class', 'background')
    .attr('width', width)
    .attr('height', height);

  g.append('path')
    .datum(topojson.feature(us, us.objects.nation))
    .attr('class', 'nation')
    .attr('d', path);

  g.append('path')
    .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
    .attr('class', 'states')
    .attr('d', path);

  var points = g.append('g')
    .attr('class', 'points');

  points.selectAll('.point')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', function(d) { return })


  svg.call(zoom);
}

function zoomed() {
  g.attr('transform', d3.event.transform);
}

d3.queue()
  .defer(d3.json, 'us-10m.v1.json')
  .defer(d3.csv, 'post_offices.csv')
  .await(display);
