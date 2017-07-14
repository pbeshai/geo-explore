// heavily inspired by http://leafletjs.com/examples/choropleth/
var latitude = 37.0902;
var longitude = -95.7129;
var zoom = 4;

// intialize Leaflet on the #map element, centered on our lat/long and zoom level
var map = L.map('map', { minZoom: 3, maxZoom: 7 }).setView([latitude, longitude], zoom);

// try: toner, toner-lite, toner-hybrid, toner-lines, terrain
var linesLayer = new L.StamenTileLayer('toner-lite');

// add the stamen layer to the map
map.addLayer(linesLayer);


map.createPane('labels');
map.getPane('labels').style.zIndex = 650;
map.getPane('labels').style.pointerEvents = 'none';

// try: toner, toner-lite, toner-hybrid, toner-lines, terrain
var labelsLayer = new L.StamenTileLayer('toner-labels', { pane: 'labels' });

// add the stamen layer to the map
map.addLayer(labelsLayer);


// define color out here so it can be shared by the legend and the choropleth
// create a color scale to use for coloring in states based on density
var colorScale = d3.scaleThreshold()
  .domain([0, 10, 20, 50, 100, 200, 500, 1000])
  .range(d3.schemeYlGnBu[9]);


// a global to hold our geojson layer
var geojson;

// color in each state based on density
function style(feature) {
  return {
    fillColor: colorScale(feature.properties.density),
    weight: 1,
    opacity: 0.5,
    color: 'white',
    fillOpacity: 0.8,
  };
}

function display(error, statesGeo) {
  if (error) {
    console.error(error);
    return;
  }
  console.log('statesGeo', statesGeo);

  // add the states GeoJSON data to the map
  geojson = L.geoJson(statesGeo, { style: style }).addTo(map);
}

// load the GeoJSON data file
// us_states_density.json is from http://leafletjs.com/examples/choropleth/
d3.queue()
  .defer(d3.json, 'us_states_density.json')
  .await(display);


