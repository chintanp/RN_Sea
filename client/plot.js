/* keep history of old charts for comparison? */
var charts = []

function timeChart(id, data, title, ylabel) {

    // clear chart if it already exists
    // otherwise hover events will not work
    var old = charts.filter(function( obj ) {
        return obj.id == id;
    });

    if (old.length > 0) {
        old.forEach(function(c) {
            c.chart.destroy();
        })
    }

    // Find the maximum in y for proper plot edges
    var maxY = Math.max.apply(Math, data.map(function(o) { return o.y }));

    // create new chart
	var ctx = document.getElementById(id);
	var chart = new Chart(ctx, {
		type: 'line',
		data: {
			datasets: [{
				data: data,
				strokeColor: "rgba(151,187,205,1)",
				borderColor: "rgba(151,187,205,0.8)"
			}]
		},
		options: {
			scales: {
				xAxes: [{
					type: 'linear',
					position: 'bottom',
					scaleLabel :{
						display :true,
						labelString : "Real Imp."
					},
					gridLines: {
						display:false
					}
				}],
				yAxes: [{
					scaleLabel :{
						display :true,
						labelString : ylabel
					},
					gridLines: {
						display:false
					},
					ticks: {
						min : 0,
                        max : maxY,
                        stepSize : 0.005
					}
				}]
			},
			title: {
				display: true,
				text: title
			},
            responsive: true,
            maintainAspectRatio: false
		}
	});
    charts.push({
        id: id,
        chart: chart
    });
}


var gauge;
function fadeGauge(fade){

    // clear chart if it already exists
    if(gauge != null) {
        gauge.destroy();
    }

    // create new gauge
	gauge = c3.generate({
		bindto: '#gauge',
		data: {
			columns: [
				['data', 0]
			],
			type: 'gauge',
			onclick: function (d, i) { console.log("onclick", d, i); },
			onmouseover: function (d, i) { console.log("onmouseover", d, i); },
			onmouseout: function (d, i) { console.log("onmouseout", d, i); }
		},
		gauge: {
			label: {
				format: function(value, ratio) {
					return value.toFixed(3);
				},
				show: true // to turn off the min/max labels.
			},
		min: 0, // 0 is default
		max: .05, // 100 is default
		units: ' %',
		// width: 20 // for adjusting arc thickness
		},
		color: {
			pattern: ['#60B044', '#F6C600', '#F97600', '#FF0000'], // the three color levels for the percentage values.
			threshold: {
				unit: 'value', // percentage is default
				max: .01, // 100 is default
				values: [.015, .03, .045, .05]
			}
		},
		// size: {
		// 	height: 100
		// },
        transition: {
          duration: 2000
        },
		title: {
		  text: 'Capacity Fade'
		}
	});

	gauge.load({
		columns: [['data', fade]]
	});
}
