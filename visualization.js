"use strict";

//the SVG element to add visual content to
var svg = d3
  .select("#visContainer")
  .append("svg")
  .attr("height", 780) //can adjust size as desired
  .attr("width", 600)
  .style("border", "1px solid gray"); //comment out to remove border

//the SVG element to add visual content to
var svg2 = d3
  .select("#visContainer2")
  .append("svg")
  .attr("height", 480) //can adjust size as desired
  .attr("width", 600)
  .style("border", "1px solid gray"); //comment out to remove border

/* Your script goes here */

const seattle911API =
  "https://data.seattle.gov/resource/grwu-wqtk.json?$where=datetime%20is%20not%20null&$order=datetime%20desc&$limit=50";

// Create the map object, set the view and zoom
const mymap = L.map("visContainer").setView([47.604311, -122.331734], 11.5);

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

async function load911Data(uri) {
  var calls = await d3.json(uri);
  console.log(calls);
  renderMap(calls);
}

var button_city = d3.select("#city");
button_city.on("click", function() {
  load911Data(seattle911API);
});
