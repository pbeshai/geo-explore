var latitude = 37.0902;
var longitude = -95.7129;
var zoom = 4;

// intialize Leaflet on the #map element, centered on our lat/long and zoom level
var map = L.map('map', { minZoom: 3, maxZoom: 7 }).setView([latitude, longitude], zoom);

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

// converts a post office into a GeoJson feature point
function convertToGeoJSONFeature(postOffice) {
  // capitalize the state name
  var state = postOffice.state.split(' ').map(function (state) {
    return state[0].toUpperCase() + state.slice(1)
  }).join(' ');

  var geojsonFeature = {
    type: 'Feature',
    properties: {
      name: postOffice.name,
      amenity: 'Post Office',
      popupContent: '<h3>' + postOffice.name + '</h3><div>' + state + '</div>',
      state: state,
      stateFips: postOffice.stateFips,
      stateAbbr: postOffice.stateAbbr,
    },
    geometry: {
      type: 'Point',
      coordinates: [postOffice.lon, postOffice.lat],
    },
    id: postOffice.id,
  };

  return geojsonFeature;
}

function onEachFeature(feature, layer) {
  // does this feature have a property named popupContent?
  if (feature.properties && feature.properties.popupContent) {
    layer.bindPopup(feature.properties.popupContent);
  }
}

function display(error, postOfficeData) {
  if (error) {
    console.error(error);
    return;
  }
  // limit to 1000 for now
  postOfficeData = d3.shuffle(postOfficeData).slice(0, 3000);
  console.log('postOfficeData', postOfficeData, postOfficeData[0]);

  // wrap the features as a FeatureCollection
  var postOfficeGeo = { type: 'FeatureCollection', features: postOfficeData.map(convertToGeoJSONFeature) };
  console.log('postOfficeGeo', postOfficeGeo, postOfficeGeo.features[0]);

  // style the points
  var geojsonMarkerOptions = function (feature) {
    return {
      radius: 3,
      fillColor: colorScale(feature.geometry.coordinates[1]),
      color: '#fff',
      weight: 1,
      opacity: 0,
      fillOpacity: 0.8
    };
  }

  // add the points to the map as a geojson layer
  L.geoJSON(postOfficeGeo, {
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, geojsonMarkerOptions(feature));
    },
    onEachFeature: onEachFeature,
  }).addTo(map);
}

// post_offices_with_states.csv includes locations and names of post offices across USA.
d3.queue()
  .defer(d3.csv, 'post_offices_with_states.csv')
  .await(display);
