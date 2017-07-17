var latitude = 38.8932;
var longitude = -77.0369;
var zoom = 14;
var latitude = 42.3601;
var longitude = -71.0589;

// intialize Leaflet on the #map element, centered on our lat/long and zoom level
var map = L.map('map').setView([latitude, longitude], zoom);

// use open streetmap tiles
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
