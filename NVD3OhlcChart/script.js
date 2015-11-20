/*
Created by Ralf Becher - ralf.becher@web.de - (c) 2015 irregular.bi, Leipzig, Germany
Tested on QV 11.2 SR12

TIQ Solutions takes no responsibility for any code.
Use at your own risk. 
*/

// This checks if the console is present, and if not it 
// sets it to an object with a blank function called log to
// prevent any error. Remove logging for production.
if(!window.console){ window.console = {log: function(){} }; } 

(function ($) {
	//own context, avoiding conflicts with other libraries, $=jQuery
	var _extension = 'NVD3OhlcChart';
    var _pathShort = 'Extensions/' + _extension + '/';
	var _pathLong = Qva.Remote + (Qva.Remote.indexOf('?') >= 0 ? '&' : '?') + 'public=only&name=' + _pathShort;
	// detect WebView mode (QlikView Desktop)
	var _webview = window.location.host === 'qlikview';
	var _path = (_webview ? _pathShort : _pathLong);

	// load all libraries as array, don't use nested Qva.LoadScript() calls
	Qv.LoadExtensionScripts([_path + 'js/d3.v3.min.js'], 
		function () {
			Qva.LoadCSS(_path + 'css/nv.d3.min.css');

			Qv.AddExtension(_extension, 
				function () {
					var candleStick = ((this.Layout.Text0.text.toString() * 1) > 0);
					// load css file
					
					// need a unique id to render chart
					var objId = this.Layout.ObjectId.replace("\\", "_"); // chart name in CSS class (eg "QvFrame Document_CH01")

					//console.log(objId);
					if (this.Data.Rows.length > 0) {
						var myDiv = $('<div />').css({
										overflow: 'hidden',
										height: this.GetHeight(),
										width: this.GetWidth()
									}).attr({
										id: objId
									}).appendTo($(this.Element).empty());


						// $(document.createElementNS('http://www.w3.org/2000/svg','svg')).css({
										// height: this.GetHeight(),
										// width: this.GetWidth()}).appendTo(myDiv);
						
						// sizing problem in browser
						d3.select('#'+objId).append('svg');
						
						// Transform data set
						var data = d3.nest()
									.key(function(d) { return "All"; })
									.entries(this.Data.Rows.map(function(row){
										return {
											"date" : convertToUnixTime(row[0].text), 
											"open" : parseFloat(row[1].data),
											"high" : parseFloat(row[2].data),
											"low" : parseFloat(row[3].data),
											"close" : parseFloat(row[4].data)
										}
									}));
						
						var chart;
						nv.addGraph(function() {
							// Select whether OHLC or Candlestick
							chart = (candleStick ? nv.models.candlestickBarChart() : chart = nv.models.ohlcBarChart())
								.x(function(d) { return d['date'] })
								.y(function(d) { return d['close'] })
								.duration(0)
								.margin({left: 75, bottom: 50, right: 30});												
											
							chart.xAxis
								.axisLabel("Dates")
								// use this tickformat for Sense Hypercube data
								.tickFormat(function(d) { return d3.time.format('%x')(new Date(d)) });

							chart.yAxis
								.axisLabel('Stock Price')
								.tickFormat(function(d,i){ return d3.format(',.2f')(d); });

							// call the chart
							d3.select('#'+objId+' svg')
									.datum(data)
									.transition().duration(0)
									.call(chart);
							nv.utils.windowResize(chart.update);

							return chart;
						});
						
					} else {
						this.Element.html('<p align="center"><b>No resulting rows to display..</b></p>');
					}						
			});
		});
		
		function convertToUnixTime(_text) {
			return (parseInt(_text)  - 25569)*86400*1000;
		}
		
		function findDate(_date, _arr, _offset) {
			for (var i = _offset, len = _arr.length; i < len; i++) {
				if (_arr[i][0] === _date) return i;
			}
			return -1;
		}
		
		function assignDefaultValues(dates, dataset, defaultValue) {
			var newData = [],
				sortDates = function(a,b){ return a > b ? 1 : -1; },
				sortValues = function(a,b){ return a[0] > b[0] ? 1 : -1; },
				i = -1;
				
			dates.sort(sortDates);
			$.each(dataset, function(index1, setObject){
				var newValues = [],
					lastPos = 0,
					i = -1;
				setObject.values.sort(sortValues);
				$.each(dates, function(index2, theDate){
					i = findDate(theDate, setObject.values, lastPos)
					if (i === -1) {
						newValues.push([theDate,defaultValue]);
					} else {
						newValues.push([theDate,setObject.values[i][1]]);
						lastPos = i;
					}
				});
				newData.push( { key: setObject.key, seriesIndex: setObject.seriesIndex, values: newValues });
			});
			return newData;
		}

})(jQuery);