var latitude = 37.0902;
var longitude = -95.7129;
var zoom = 4;
var pointRadius = 3;
// intialize Leaflet on the #map element, centered on our lat/long and zoom level
var map = L.map('map', { minZoom: 3, maxZoom: 18 }).setView([latitude, longitude], zoom);

// to use mapbox tiles, we need an access token.
// sign up for one here: https://www.mapbox.com/studio/account/tokens/
var mapboxAccessToken = 'pk.eyJ1IjoicGV0ZXJib2NvdXAiLCJhIjoiY2o1Mnc2eDhvMDBpeTJ4cG5hdzFmNTFmeiJ9.r1oblW_7pK24AQFA_afkVA';

// Mapbox has a number of tileset and styles available to choose from, or you
// can make your own. (https://www.mapbox.com/api-documentation/#maps)
// Preset ones include: mapbox.streets, mapbox.light, mapbox.dark, mapbox.satellite,
//   mapbox.streets-satellite, mapbox.wheatpaste, mapbox.streets-basic,
//   mapbox.comic, mapbox.outdoors, mapbox.run-bike-hike, mapbox.pencil,
//   mapbox.pirates, mapbox.emerald, mapbox.high-contrast
var mapboxTilesetId = 'mapbox.dark';

// add the tile layer to our map
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: mapboxTilesetId,
    accessToken: mapboxAccessToken
}).addTo(map);

// define a color scale to color the points based on a property
var colorScale = d3.scaleSequential(d3.interpolateInferno).domain([55, 25]);

function display(error, postOfficeData) {
  if (error) {
    console.error(error);
    return;
  }
  // convert lat and lng to numbers
  postOfficeData.forEach(function (d) {
    d.lat = +d.lat;
    d.lon = +d.lon;
    d.latLng = L.latLng(d.lat, d.lon);
  });

  console.log('postOfficeData', postOfficeData, postOfficeData[0]);

  // use a CanvasLayer plugin from https://github.com/Sumbera/gLayers.Leaflet
  L.canvasLayer()
    .delegate({
      onDrawLayer: function onDrawLayer(info) {
        var canvas = info.canvas;
        var context = canvas.getContext('2d');
        var bounds = info.bounds;
        var map = info.layer._map;

        context.save();
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.globalAlpha = 0.4;

        postOfficeData.forEach(function (d) {
          if (bounds.contains(d.latLng)) {
            const point = map.latLngToContainerPoint(d.latLng);
            context.fillStyle = colorScale(d.lat);

            context.beginPath();
            context.arc(point.x, point.y, pointRadius, 0, 2 * Math.PI);
            context.fill();
          }
        })

        context.restore();
      }
    })
    .addTo(map);
}

// post_offices_with_states.csv includes locations and names of post offices across USA.
d3.queue()
  .defer(d3.csv, 'post_offices_with_states.csv')
  .await(display);
