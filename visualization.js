"use strict";

//the SVG element to add visual content to
var svg = d3
  .select("#visContainer")
  .append("svg")
  .attr("height", 280) //can adjust size as desired
  .attr("width", 480);
// .style("border", "1px solid gray"); //comment out to remove border

//the SVG element to add visual content to
d3.selectAll(".plot")
  .append("svg")
  .attr("height", 480) //can adjust size as desired
  .attr("width", 400);

var svg2 = d3
  .select("#typeplot")
  .append("svg")
  .attr("height", 900) //can adjust size as desired
  .attr("width", 520);

/* Your script goes here */

function get_API_URI() {
  // get current date and time
  var today = new Date();
  //var date =today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  var datePast =
    today.getFullYear() +
    "-" +
    (today.getMonth() + 1) +
    "-" +
    (today.getDate() - 1);
  //var time =today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  // construct the API URI
  return (
    "https://data.seattle.gov/resource/grwu-wqtk.json?$where=datetime%20between%20%27" +
    datePast +
    "T" +
    "00:00:00" +
    "%27%20and%20%27" +
    datePast +
    "T" +
    "23:59:59" +
    "%27"
  );
}
var seattle911API = get_API_URI();
//console.log(seattle911API)

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

// Filter data given the distance to the target's latitude and longitude, and visualize filtered markers on map, and made plots
function filterData(data, targetLat, targetLon, dist) {
  markerGroup.clearLayers();
  var filteredData = [];
  data.forEach(function (item) {
    if (item.latitude && item.longitude) {
      if (
        calcCrow(item.latitude, item.longitude, targetLat, targetLon) <= dist
      ) {
        filteredData.push(item);
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
  //console.log(filteredData);
  plotType(filteredData);
  plotByHour(filteredData);
}

// load the lasted data and filtered data
async function load911Data(uri, targetLat, targetLon, dist) {
  d3.select("#subtitle")
    .append("h4")
    .text("Please wait while fetching and calculating data");
  var calls = await d3.json(uri);
  filterData(calls, targetLat, targetLon, dist);
  d3.select("#subtitle").text(
    "There is a 6-hour delay for the API to update incidences, so the graphs shown are based on yesterday"
  );
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
button_city.on("click", function () {
  mymap.removeLayer(circle);
  load911Data(seattle911API, DOWNTOWN_LAT, DOWNTOWN_LON, 20);
  mymap.setView([DOWNTOWN_LAT, DOWNTOWN_LON], 11.5);
});

var button_uw = d3.select("#uw");
button_uw.on("click", function () {
  load911Data(seattle911API, RED_SQUARE_LAT, RED_SQUARE_LON, 3);
  addCircle(RED_SQUARE_LAT, RED_SQUARE_LON, 1500);
  mymap.setView([RED_SQUARE_LAT, RED_SQUARE_LON], 11.5);
});

var button_dt = d3.select("#downtown");
button_dt.on("click", function () {
  load911Data(seattle911API, DOWNTOWN_LAT, DOWNTOWN_LON, 2.5);
  addCircle(DOWNTOWN_LAT, DOWNTOWN_LON, 1000);
  mymap.setView([DOWNTOWN_LAT, DOWNTOWN_LON], 11.5);
});

var button_north = d3.select("#north");
button_north.on("click", function () {
  load911Data(seattle911API, NORTH_LAT, NORTH_LON, 4);
  addCircle(NORTH_LAT, NORTH_LON, 2000);
  mymap.setView([NORTH_LAT, NORTH_LON], 11);
});

var button_south = d3.select("#south");
button_south.on("click", function () {
  load911Data(seattle911API, SOUTH_LAT, SOUTH_LON, 5);
  addCircle(SOUTH_LAT, SOUTH_LON, 2000);
  mymap.setView([SOUTH_LAT, SOUTH_LON], 11);
});

/* incident type analysis */

function plotType(calls) {
  d3.select("#number").text("# of Calls");

  // extract data with incident type and frequencies
  let uniqueTypes = new Set();
  calls.forEach(function (item) {
    uniqueTypes.add(item.type);
  });
  var summary = [];
  uniqueTypes.forEach(function (i) {
    var dict = {
      type: i,
      freq: 0
    };
    summary.push(dict);
  });

  for (var i = 0; i < calls.length; i++) {
    var curtType = calls[i].type;
    for (var j = 0; j < summary.length; j++) {
      if (summary[j]["type"] == curtType) {
        summary[j]["freq"] = summary[j]["freq"] + 1;
      }
    }
  }

  // axis builder function
  var freqMax = d3.max(summary, function (d) {
    return d.freq;
  });
  var freqMin = d3.min(summary, function (d) {
    return d.freq;
  });
  var calWidth = d3
    .scaleLinear()
    .domain([0, freqMax]) // sleep interval
    .range([0, 480]); // pixel interval
  var xAxisFunc = d3.axisTop(calWidth).ticks(10, ".0f"); // add axis on the top

  // color scale
  var colorScale = d3
    .scaleLinear()
    .domain([freqMin, freqMax])
    .range(["#C8DEEC", "#227BB7"]);

  var axisGroup = svg2
    .append("g")
    .attr("class", "xAxis")
    .attr("transform", "translate(20,30)")
    .call(xAxisFunc);
  svg2
    .append("text")
    .attr("transform", "translate(20, 50)")
    .text("# of calls");

  var rects = svg2.selectAll("rect").data(summary, function (d) {
    return d.type;
  });

  var present = rects
    .enter()
    .append("rect")
    .attr("width", 0)
    .attr("fill", function (d) {
      return colorScale(d.freq);
    })
    .merge(rects);

  present
    .transition()
    .duration(500)
    .attr("x", 20)
    .attr("y", function (d, i) {
      console.log(d);
      return 20 + (i + 0.5) * 30;
    })
    .attr("width", function (d) {
      return calWidth(d.freq);
    })
    .attr("height", 26);

  rects
    .exit()
    .transition()
    .duration(500)
    .attr("width", 0)
    .remove();

  // update the text
  var texts = svg2.selectAll(".types").data(summary, function (d) {
    return d.type;
  });
  present = texts
    .enter()
    .append("text")
    .attr("class", "types")
    .merge(texts);

  present
    .transition()
    .duration(500)
    .text(function (d) {
      return d.type + ": " + d.freq;
    })
    .attr("fill", "black")
    .attr("font-size", "12")
    .attr("x", 120)
    .attr("y", function (d, i) {
      return 38 + (i + 0.5) * 30;
    });

  texts.exit().remove();

  svg2.call(xAxisFunc);
}

/*display incidents number within 24 hour in last day */

function plotByHour(rawData) {
  //set up chart
  var margin = { top: 10, right: 10, bottom: 60, left: 50 };
  var width = 600;
  var height = 400;
  //clear
  var chart = d3.select(".chart").html("");
  var chart = d3
    .select(".chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  //add labels
  chart
    .append("text")
    .attr(
      "transform",
      "translate(-35," + (height + margin.bottom) / 2 + ") rotate(-90)"
    )
    .text("# of calls");
  chart
    .append("text")
    .attr(
      "transform",
      "translate(" + width / 2 + "," + (height + margin.bottom - 5) + ")"
    )
    .text("Time(hour)");
  //Scalars
  var xScalar = d3.scaleBand().range([0, width]);
  var yScalar = d3.scaleLinear().range([height, 0]);
  //Axes
  var xAxis = d3.axisBottom(xScalar);
  var yAxis = d3.axisLeft(yScalar);
  //set up axes
  //left axis
  chart
    .append("g")
    .attr("class", "y axis")
    .call(yAxis);
  //bottom axis
  chart
    .append("g")
    .attr("class", "xAxis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", function (d) {
      return "rotate(-65)";
    });
  // construct empty obj
  var countByHour = {};
  for (var i = 0; i < 24; i++) {
    countByHour[i] = 0;
  }
  // count by hour
  for (var i = 0; i < rawData.length; i++) {
    var hour = new Date(rawData[i]["datetime"]).getHours();
    countByHour[hour]++;
  }
  // transform obj to array for faster visulization
  var data = [];
  for (var i = 0; i < 24; i++) {
    data.push({ hour: i + ":00", count: countByHour[i] });
  }
  // subtitle
  var today = new Date();
  var datetime =
    today.getFullYear() +
    "-" +
    (today.getMonth() + 1) +
    "-" +
    (today.getDate() - 1);
  d3.select("#timeNow").text("Based on: " + datetime);
  //set domain for the x axis
  xScalar.domain(
    data.map(function (d) {
      return d.hour;
    })
  );
  //set domain for y axis
  yScalar.domain([
    0,
    d3.max(data, function (d) {
      return +d.count;
    })
  ]);

  //get the width of each bar
  var barWidth = width / data.length;
  //select all bars on the graph, take them out, and exit the previous data set.
  //then you can add/enter the new data set
  var bars = chart
    .selectAll(".bar")

    .remove()
    .exit()
    .data(data);

  // color scale
  var colorScale = d3
    .scaleLinear()
    .domain([
      d3.min(data, function (d) {
        return yScalar(d.count);
      }),
      d3.max(data, function (d) {
        return yScalar(d.count);
      })
    ])
    .range(["#C8DEEC", "#227BB7"]);

  //now actually give each rectangle the corresponding data
  bars
    .enter()
    .append("rect")

    .attr("class", "bar")
    .attr("x", function (d, i) {
      return i * barWidth + 1;
    })
    .attr("y", function (d) {
      return yScalar(d.count);
    })
    .transition()
    .duration(1500)
    .attr("height", function (d) {
      return height - yScalar(d.count);
    })
    .attr("width", barWidth - 1)
    // .attr("fill", "rgb(51,119,225)");
    .attr("fill", function (d) {
      return colorScale(height - yScalar(d.count));
    });

  //left axis
  chart.select(".y").call(yAxis);
  //bottom axis
  chart
    .select(".xAxis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", function (d) {
      return "rotate(-65)";
    });
} //end bar chart 2
