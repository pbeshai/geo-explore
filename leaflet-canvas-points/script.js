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
      popupContent: '<h3>' + postOffice.name + '</h3><div>' + state + '</div>' + postOffice.lat + ', ' + postOffice.lon,
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

function tile2long(x,z) { return (x/Math.pow(2,z)*360-180); }

function tile2lat(y,z) {
    var n=Math.PI-2*Math.PI*y/Math.pow(2,z);
    return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
}

// from https://gis.stackexchange.com/questions/17278/calculate-lat-lon-bounds-for-individual-tile-generated-from-gdal2tiles
function tileToLatLng(tilePoint) {
  var lng = tilePoint.x / Math.pow(2, tilePoint.z) * 360 - 180;
  var n = Math.PI - 2 * Math.PI * tilePoint.y / Math.pow(2, tilePoint.z);
  var lat = 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));

  return L.latLng(lat, lng);
}

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

  // limit to 1000 for now
  // postOfficeData = d3.shuffle(postOfficeData).slice(0, 30);
  postOfficeData = postOfficeData.slice(0, 5);
  console.log('postOfficeData', postOfficeData, postOfficeData[0]);

  // wrap the features as a FeatureCollection
  var postOfficeGeo = { type: 'FeatureCollection', features: postOfficeData.map(convertToGeoJSONFeature) };
  console.log('postOfficeGeo', postOfficeGeo, postOfficeGeo.features[0]);

  // style the points
  var geojsonMarkerOptions = function (feature) {
    return {
      radius: pointRadius,
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
  })
  // .addTo(map);

  L.GridLayer.CanvasCircles = L.GridLayer.extend({
    createTile: function (coords) {
      var tile = document.createElement('canvas');

      var tileSize = this.getTileSize();
      tile.setAttribute('width', tileSize.x);
      tile.setAttribute('height', tileSize.y);

      var context = tile.getContext('2d');

      // draw the points within this lat lng
      var tileMinLatLng = tileToLatLng(coords);
      // console.log(coords, tileMinLatLng);
      var tileMaxLatLng = tileToLatLng({ x: coords.x + 1, y: coords.y + 1, z: coords.z });
      // console.log(tileMinLatLng, tileMaxLatLng);

      var minLat = Math.min(tileMinLatLng.lat, tileMaxLatLng.lat);
      var minLng = Math.min(tileMinLatLng.lng, tileMaxLatLng.lng);
      var maxLat = Math.max(tileMinLatLng.lat, tileMaxLatLng.lat);
      var maxLng = Math.max(tileMinLatLng.lng, tileMaxLatLng.lng);

      // filter to the right points
      var filteredPoints = postOfficeData.filter(function (d) {
        return minLat <= d.lat && d.lat < maxLat &&
          minLng <= d.lon && d.lon < maxLng;
      });

      if (filteredPoints.length) {
        console.log(minLat, maxLat, minLng, maxLng)
      }
      console.log('cpTLP', map.containerPointToLayerPoint([0, 0]));
      context.fillStyle = '#0f0';
      // context.globalAlpha = 0.2;
      filteredPoints.forEach(function (d) {
        context.beginPath();
        const point = map.latLngToLayerPoint(d.latLng);
        console.log('d =', d.latLng, point);
        context.arc(point.x, point.y, pointRadius * 10, 0, 2 * Math.PI);
        context.fill();
      });


      return tile;
    }
  });

  map.addLayer(new L.GridLayer.CanvasCircles());
}

L.GridLayer.DebugCoords = L.GridLayer.extend({
  createTile: function (coords) {
    var tile = document.createElement('div');
    var tileSize = this.getTileSize();
    var coordString = [coords.x, coords.y, coords.z].join(', ');
    var latLng = tileToLatLng(coords);
    // var latLng = map.layerPointToLatLng(tilePoint);
    tile.innerHTML = coordString + '<br/>' + latLng;
    tile.style.outline = '1px solid red';
    return tile;
  }
});

L.gridLayer.debugCoords = function(opts) {
  return new L.GridLayer.DebugCoords(opts);
};

map.addLayer( L.gridLayer.debugCoords() );

// post_offices_with_states.csv includes locations and names of post offices across USA.
d3.queue()
  .defer(d3.csv, 'post_offices_with_states.csv')
  .await(display);
