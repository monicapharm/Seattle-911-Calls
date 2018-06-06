"use strict";

//the SVG element to add visual content to
var svg = d3
  .select("#visContainer")
  .append("svg")
  .attr("height", 780) //can adjust size as desired
  .attr("width", 600)
  .style("border", "1px solid gray"); //comment out to remove border

//the SVG element to add visual content to
d3.selectAll(".plot")
  .append("svg")
  .attr("height", 480) //can adjust size as desired
  .attr("width", 400)
  .style("border", "1px solid gray"); //comment out to remove border

// var svg2 =

// var svg3 =

/* Your script goes here */

function get_API_URI(){
  // get current date and time
  var today = new Date()
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var datePast = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+(today.getDate()-1)
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  // construct the API URI
  return 'https://data.seattle.gov/resource/grwu-wqtk.json?$where=datetime%20between%20%27'+datePast+'T'+time+'%27%20and%20%27'+date+'T'+time+'%27';

}
var seattle911API = get_API_URI();

// The geo location information of four main areas' center
const RED_SQUARE_LAT = 47.656115;
const RED_SQUARE_LON = -122.309416;

const DOWNTOWN_LAT = 47.607184;
const DOWNTOWN_LON = -122.332302;

const NORTH_LAT = 47.700265;
const NORTH_LON = -122.333592;

const SOUTH_LAT = 47.543075;
const SOUTH_LON = -122.326037;

// Create the map object, set the view and zoom
var mymap = L.map("visContainer").setView([47.604311, -122.331734], 11.5);

// Add the background tiles to the map
L.tileLayer(
  "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}",
  {
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: "mapbox.streets",
    accessToken:
      "pk.eyJ1Ijoibmlja2RlbmFyZGlzIiwiYSI6ImNqaGRla2pjMjBvYXgzNm13Yzc3aGIwM3kifQ.G2Tr-B7ppCNdj6xuM0Qc5A"
  }
).addTo(mymap);

// Render the map on screen
function renderMap(data) {
  // `data` is an array of objects
  // Add each object to the map if `latitude` and `longitude` are available
  // console.log(data);
  data.forEach(function(item) {
    if (item.latitude && item.longitude) {
      var marker = L.marker([item.latitude, item.longitude]).addTo(mymap);
      var day = moment(item.datetime);
      marker
        .bindPopup(
          "<b>" +
            item.type +
            "</b>" +
            "<br>" +
            day.fromNow() +
            "<br>" +
            item.address
        )
        .openPopup();
    }
  });
}

//This function takes in latitude and longitude of two location and returns the distance between them (in km)
function calcCrow(lat1, lon1, lat2, lon2) {
  var R = 6371; // km
  var dLat = toRad(lat2 - lat1);
  var dLon = toRad(lon2 - lon1);
  var lat1 = toRad(lat1);
  var lat2 = toRad(lat2);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
}
// Converts numeric degrees to radians
function toRad(Value) {
  return (Value * Math.PI) / 180;
}

//Future generated markers would be added into a marker group
var markerGroup = L.layerGroup().addTo(mymap);

// Filter data given the distance to the target's latitude and longitude, and visualize filtered markers on map
function filterData(data, targetLat, targetLon, dist) {
  markerGroup.clearLayers();
  data.forEach(function(item) {
    if (item.latitude && item.longitude) {
      if (
        calcCrow(item.latitude, item.longitude, targetLat, targetLon) <= dist
      ) {
        var marker = L.marker([item.latitude, item.longitude])
          .addTo(markerGroup)
          .addTo(mymap);
      } else {
        var marker = L.marker([item.latitude, item.longitude], {
          opacity: 0.25
        })
          .addTo(markerGroup)
          .addTo(mymap);
      }
      var day = moment(item.datetime);
      marker
        .bindPopup(
          "<b>" +
            item.type +
            "</b>" +
            "<br>" +
            day.fromNow() +
            "<br>" +
            item.address
        )
        .openPopup();
    }
  });
}

// load the lasted data and filtered data
async function load911Data(uri, targetLat, targetLon, dist) {
  var calls = await d3.json(uri);
  filterData(calls, targetLat, targetLon, dist);
}

// Add the circle that highlights the chosen area
var circle = L.circle([DOWNTOWN_LAT, DOWNTOWN_LON], {
  fillOpacity: 0
}).addTo(mymap);
function addCircle(centerLat, centerLon, rad) {
  mymap.removeLayer(circle);
  circle = L.circle([centerLat, centerLon], {
    color: "red",
    fillColor: "#f03",
    fillOpacity: 0.3,
    radius: rad
  }).addTo(mymap);
}

var button_city = d3.select("#city");
button_city.on("click", function() {
  mymap.removeLayer(circle);
  load911Data(seattle911API, DOWNTOWN_LAT, DOWNTOWN_LON, 20);
});

var button_uw = d3.select("#uw");
button_uw.on("click", function() {
  load911Data(seattle911API, RED_SQUARE_LAT, RED_SQUARE_LON, 3);
  addCircle(RED_SQUARE_LAT, RED_SQUARE_LON, 1500);
});

var button_dt = d3.select("#downtown");
button_dt.on("click", function() {
  load911Data(seattle911API, DOWNTOWN_LAT, DOWNTOWN_LON, 2.5);
  addCircle(DOWNTOWN_LAT, DOWNTOWN_LON, 1000);
});

var button_north = d3.select("#north");
button_north.on("click", function() {
  load911Data(seattle911API, NORTH_LAT, NORTH_LON, 4);
  addCircle(NORTH_LAT, NORTH_LON, 2000);
});

var button_south = d3.select("#south");
button_south.on("click", function() {
  load911Data(seattle911API, SOUTH_LAT, SOUTH_LON, 5);
  addCircle(SOUTH_LAT, SOUTH_LON, 2000);
});
