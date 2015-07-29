/* global control */
'use strict';

var HSA_list = [
    "Rodney Kamaliza",
    "Mercy Macholowe",
    "Luka M'bawa",
    "Ben Banda",
    "Cosmas Bakili",
    "Mackson Khalawako",
    "Gladys Kaselo",
    "Tobias Kadzoma",
    "Asnty Chikapaza",
    "George Koloko",
    "Mabvuto Mandere",
    "Acklen Mdoka",
    "Maxwel Kadzilawa",
    "Chisomo Chisada ", 
    "Beatrice Chikaoneka",
    "Charles Isaac",
    "George Chidulo",
    "Emma Muwa",
    "Pemphero Katondo",
    "Catherine Kazembe"
];

Array.prototype.contains = function(element){
    return this.indexOf(element) > -1;
};


function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

function display() {
  var month = scanQueries.getQueryParameter(scanQueries.month);
  var arr_month = month.split(',');
  var hsa = scanQueries.getQueryParameter(scanQueries.hsa_name);
  var arr_hsa = hsa.split(','); 

  var tri1 = 0;
  var tri2 = 0;
  var tri3 = 0;

  if (arr_hsa[0] !== "all") {
    HSA_list = arr_hsa;
  }

  HSA_list.forEach(function(entry) { 
    var recordList = scanQueries.getExistingRecordsByHSA(entry);
    if (recordList.getCount() > 0) {
      var edd_dates = recordList.getColumnData("EDD");
      var anc_v1s = recordList.getColumnData("ANC_v1");
      var hv1_dates = recordList.getColumnData("V1_date");

      var ids = recordList.getColumnData("clientID");
      var idsArr = JSON.parse(ids);
      var uniqueIDs = idsArr.filter(onlyUnique);

      uniqueIDs.forEach(function(uniqueID){
        var isDischar = scanQueries.isClientDischarComp(uniqueID);
        if (isDischar.getCount()>0) {
          //remove id if discharge completed
          var index = uniqueIDs.indexOf(uniqueID);
          if (index > -1) {
            uniqueIDs.splice(index, 1);
          }
        }
      });

      for (var i = 0; i < recordList.getCount(); i++) {
        var testHV1 = JSON.parse(hv1_dates);
        var hv1_date = testHV1[i].toString();
        var arr_hv1_date = hv1_date.split('/');

        if ((arr_month[0] == "all" || arr_month.contains(arr_hv1_date[1])) && uniqueIDs.contains(idsArr[i])) {
          var testEDD = JSON.parse(edd_dates);
          var testANC = JSON.parse(anc_v1s);

          var edd_date = testEDD[i].toString();
          var anc_v1 = testANC[i].toString();

          var arr_edd_date = edd_date.split('/');
          var data_edd = new Date("20"+arr_edd_date[2], arr_edd_date[1] , arr_edd_date[0]).getTime();

          var arr_anc_v1 = anc_v1.split('/');
          var data_anc_v1 = new Date("20"+arr_anc_v1[2], arr_anc_v1[1] , arr_anc_v1[0]).getTime();

          var days_pregnant = 252 - ((data_edd - data_anc_v1)/(1000*60*60*24));

          if (days_pregnant <= 82) {
            tri1++;
          } else if (days_pregnant <= 168) {
            tri2++;
          } else {
            tri3++;
          }

          //remove used id from uniqueIDs array
          var index = uniqueIDs.indexOf(idsArr[i]);
          if (index > -1) {
            uniqueIDs.splice(index, 1);
          }
        }
      }
    }
  });

  var margin = {top: 20, right: 30, bottom: 30, left: 40},
    width = 300 - margin.left - margin.right,
    height = 150 - margin.top - margin.bottom;

  var x = d3.scale.ordinal()
      .rangeRoundBands([0, width], .1);

  var y = d3.scale.linear()
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .tickFormat(d3.format("d"));

  var chart = d3.select(".chart")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var sum = tri1 + tri2 + tri3;
  var data = [
      {name: "1st", value: tri1},
      {name: "2nd", value: tri2},
      {name: "3rd", value: tri3}
    ];

  x.domain(data.map(function(d) { return d.name; }));
  y.domain([0, d3.max(data, function(d) { return d.value; })]);

  chart.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  chart.append("g")
      .attr("class", "y axis")
      .call(yAxis);

  chart.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d.name); })
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); })
      .attr("width", x.rangeBand());

  chart.selectAll(".bartext")
      .data(data)
    .enter()
    .append("text")
      .attr("class", "bartext")
      .attr("text-anchor", "middle")
      .attr("fill", "black")
      .attr("x", function(d,i) {
          return x(d.name)+x.rangeBand()/2;
      })
      .attr("y", function(d,i) {
          return y(d.value) - 5;
      })
      .text(function(d){
        if (sum == 0) {
          return "0.00%"
        } else {
          return (d.value*100/sum).toFixed(2) + "%"
        }        
      });
}
 