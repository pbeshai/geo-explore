var canvas = d3.select('#map');
var context = canvas.node().getContext("2d");
var pointRadius = 3;

// pass canvas context into the path generator so it draws on canvas
var path = d3.geoPath().context(context);

// the us-10m dataset already has this projection applied to it, so we do
// not need to apply it to the path generator, but we do need it for
// to place the data points correctly.
var projection = d3.geoAlbersUsa()
  .scale(1280)
  .translate([480, 300]);


// data variables to be populated when data is loaded
var usTopo;
var nationGeo;
var statesGeo;
var postOffices;
var quadtree;

// read in the dimensions from the canvas attributes
var width = +canvas.attr('width');
var height = +canvas.attr('height');

// initialize zoom
var zoomTransform = d3.zoomIdentity;

// initialize a tooltip
var tip = d3.select(canvas.node().parentNode).append('div')
  .attr('class', 'tooltip');

// update the tooltip
function updateTip(d) {
  if (!d) {
    tip.style('opacity', 0);
  } else {
    // capitalize the state name
    var state = d.state.split(' ').map(function (state) {
      return state[0].toUpperCase() + state.slice(1)
    }).join(' ');

    // show post office name and state
    var html = '<h3>' + d.name + '</h3><div>' + state + '</div>';
    // update the conents
    tip.html(html);

    tip
      .style('top', (zoomTransform.applyY(d.y) - tip.node().offsetHeight - pointRadius - 6) + 'px')
      .style('left', (zoomTransform.applyX(d.x) - tip.node().offsetWidth / 2 + 1) + 'px')
      .style('opacity', 1)
  }
}

function updateCanvas() {
  // save the context state
  context.save();

  // clear anything drawn on the canvas
  context.clearRect(0, 0, width, height);

  context.save();
  // apply zoom transform
  context.translate(zoomTransform.x, zoomTransform.y);
  context.scale(zoomTransform.k, zoomTransform.k);

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

  context.restore();

  // draw in a circle for each post office
  context.fillStyle = '#000';
  context.globalAlpha = 0.2;
  postOffices.forEach(function (d) {
    context.beginPath();
    context.arc(zoomTransform.applyX(d.x), zoomTransform.applyY(d.y), pointRadius, 0, 2 * Math.PI);
    context.fill();
  });


  // restore the context state
  context.restore();
}

function zoomed() {
  zoomTransform = d3.event.transform;
  updateTip(); // hide the tooltip on zoom
  updateCanvas();

  // log the transform to see what is happening
  console.log('Zoomed. Scale =', approx(zoomTransform.k), 'Translate x =',
    approx(zoomTransform.x), 'y =', approx(zoomTransform.y));

  // helper function just for logging purposes to more readable numbers
  function approx(d) {
    return Math.round(1000 * d) / 1000;
  }
}

function display(error, usTopoData, postOfficeData) {
  if (error) {
    console.error(error);
    return;
  }
  postOffices = postOfficeData;
  console.log('postOffices', postOffices, postOffices[0]);

  usTopo = usTopoData;
  console.log('usTopo', usTopo);

  // convert the nation topology to a GeoJSON FeatureCollection
  nationGeo = topojson.feature(usTopo, usTopo.objects.nation);
  console.log('nationGeo', nationGeo);

  // convert states to GeoJSON MultiLineString
  statesGeo = topojson.mesh(usTopo, usTopo.objects.states,
    // exclude exterior lines with an a !== b filter
    function(a, b) { return a !== b; });
  console.log('statesGeo', statesGeo);


  // convert from latitude and longitude to x and y on the map
  postOffices.forEach(function(d) {
    var p = projection([+d.lon, +d.lat]);
    if (p) {
      d.x = p[0];
      d.y = p[1];
    }
  });

  // the zoom handler. We set the min and max zoom levels with the scaleExtent
  // and the min and max x and y values with the translateExtent. The translate
  // extent makes it so we can only pan when zoomed in.
  var zoom = d3.zoom()
    .scaleExtent([1, 8])
    .translateExtent([[0, 0], [width, height]])
    .on('zoom', zoomed);

  // add the zoom functionality to the canvas element
  canvas.call(zoom);

  // build quadtree for hover behavior
  quadtree = d3.quadtree()
    .x(function (d) { return d.x; })
    .y(function (d) { return d.y; })
    .addAll(postOffices);

  // listen on mouse move to see if we are over a point
  canvas.on('mousemove', function () {
    var mouse = d3.mouse(this);
    var hitBox = [
      zoomTransform.invert([mouse[0] - pointRadius, mouse[1] - pointRadius]),
      zoomTransform.invert([mouse[0] + pointRadius, mouse[1] + pointRadius]),
    ];
    var underMouse = visUtils.filterInRectFromQuadtree(quadtree, hitBox, quadtree.x(), quadtree.y());

    // update the tooltip to show the first element or hide if none
    updateTip(underMouse[0]);
  });

  // update the canvas with the data
  updateCanvas();
}

// load the TopoJSON data file
// us-10m.v1.json is from the us-atlas project and is projected using geoAlbersUsa
// to fit a 960x600 viewport and is simplified.
d3.queue()
  .defer(d3.json, 'us-10m.v1.json')
  .defer(d3.csv, 'post_offices_with_states.csv')
  .await(display);
