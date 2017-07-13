var latitude = 38.8932;
var longitude = -77.0369;
var zoom = 14;

// intialize Leaflet on the #map element, centered on our lat/long and zoom level
var map = L.map('map').setView([latitude, longitude], zoom);

// try: toner, toner-lite, toner-hybrid, toner-lines, terrain
var layer = new L.StamenTileLayer('toner-lite');

// add the stamen layer to the map
map.addLayer(layer);
