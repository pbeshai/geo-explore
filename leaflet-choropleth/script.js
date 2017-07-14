var latitude = 37.0902;
var longitude = -95.7129;
var zoom = 4;

// intialize Leaflet on the #map element, centered on our lat/long and zoom level
var map = L.map('map').setView([latitude, longitude], zoom);

// to use mapbox tiles, we need an access token.
// sign up for one here: https://www.mapbox.com/studio/account/tokens/
var mapboxAccessToken = 'pk.eyJ1IjoicGV0ZXJib2NvdXAiLCJhIjoiY2o1Mnc2eDhvMDBpeTJ4cG5hdzFmNTFmeiJ9.r1oblW_7pK24AQFA_afkVA';

// Mapbox has a number of tileset and styles available to choose from, or you
// can make your own. (https://www.mapbox.com/api-documentation/#maps)
// Preset ones include: mapbox.streets, mapbox.light, mapbox.dark, mapbox.satellite,
//   mapbox.streets-satellite, mapbox.wheatpaste, mapbox.streets-basic,
//   mapbox.comic, mapbox.outdoors, mapbox.run-bike-hike, mapbox.pencil,
//   mapbox.pirates, mapbox.emerald, mapbox.high-contrast
var mapboxTilesetId = 'mapbox.light';

// add the tile layer to our map
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: mapboxTilesetId,
    accessToken: mapboxAccessToken
}).addTo(map);

// a global to hold our custom information control showing details about states
// Note this is styled via CSS
var info = L.control();

info.onAdd = function (map) {
  this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
  this.update();
  return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function (props) {
  this._div.innerHTML = '<h4>US Population Density</h4>' +  (props ?
    '<b>' + props.name + '</b><br />' + props.density + ' people / mi<sup>2</sup>'
    : 'Hover over a state');
};

info.addTo(map);

// a global to hold our geojson layer
var geojson;


// callback when mousing over a feature to highlight it
function highlightFeature(e) {
  var layer = e.target;

  layer.setStyle({
    weight: 2,
    color: '#fff',
    opacity: 1,
    dashArray: '',
    fillOpacity: 0.7,
  });

  // IE, Edge and Opera have issues with bringing to front so ignore on them
  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }

  // update the info panel
  info.update(layer.feature.properties);
}

// reset style when not hovering
function resetHighlight(e) {
  geojson.resetStyle(e.target);

  // reset the info panel
  info.update();

}

// zoom to the selected feature on click
function zoomToFeature(e) {
  map.fitBounds(e.target.getBounds());
}

// add handlers to our choropleth data
function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: zoomToFeature
  });
}

function display(error, statesGeo) {
  if (error) {
    console.error(error);
    return;
  }
  console.log('statesGeo', statesGeo);

  // create a color scale to use for coloring in states based on density
  var colorScale = d3.scaleThreshold()
    .domain([1, 10, 50, 200, 500, 1000])
    .range(d3.schemeYlGnBu[7]);

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

  // add the states GeoJSON data to the map
  geojson = L.geoJson(statesGeo, { style: style, onEachFeature: onEachFeature }).addTo(map);
}

// load the GeoJSON data file
// us_states_density.json is from http://leafletjs.com/examples/choropleth/
d3.queue()
  .defer(d3.json, 'us_states_density.json')
  .await(display);


