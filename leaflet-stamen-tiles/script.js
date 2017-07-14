var latitude = 38.8932;
var longitude = -77.0369;
var zoom = 14;

// intialize Leaflet on the #map element, centered on our lat/long and zoom level
var map = L.map('map').setView([latitude, longitude], zoom);

// try: toner, toner-lite, toner-hybrid, toner-lines, terrain
// see: http://maps.stamen.com/#toner/12/37.7706/-122.3782
var layer = new L.StamenTileLayer('toner-lite');

// add the stamen layer to the map
map.addLayer(layer);
