/**
 * SimpleCast API JSONP Proxy 2012
 * @author Matt Null
 */

var express = require('express');
var app = express()
  , http = require('http')
  , server = http.createServer(app)
  , fs = require('fs')
  , xml2js = require('xml2js');	


 // Configuration
app.configure(function(){
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname));
});

//start the server
server.listen(3333);

var processData = function(res){
	var normalizedData = {};
	normalizedData.data = [];
	normalizedData.forecast = {};
	
	var forecast = res.Forecast;
	var period = forecast.period;

	//forecast
	for(var i = 0; i < period.length; i++){    
		var day = period[i].valid[0].split(' ')[0];

		normalizedData.forecast[day] = normalizedData.forecast[day] ? normalizedData.forecast[day] : {};
		normalizedData.forecast[day].temp = normalizedData.forecast[day].temp ? normalizedData.forecast[day].temp : {};

		if(period[i].temp[0].$.hilo == 'L'){
			normalizedData.forecast[day].temp.low = period[i].temp[0]._;
		}
		else{
			normalizedData.forecast[day].temp.high = period[i].temp[0]._;
		}
	}

	return normalizedData;
};

app.get('/', function(req, res){
	
	var options = {
		host: 'forecast.weather.gov',
		port: 80,
		path: '/MapClick.php?lat=40.04547&lon=-105.28385109999999&unit=0&lg=english&FcstType=xml',
		method: 'GET'
	};
	
	var parser = new xml2js.Parser();
	var req = http.get(options, function(r) {
		r.setEncoding('utf8');
		r.on('data', function (chunk) {
			parser.parseString(chunk, function (err, result) {
		        res.writeHead(200, {"Content-Type": "application/json"});
		        res.write(JSON.stringify(processData(result)));
		        res.end();
		    });
			
		});
	});
	
});

app.get('/weather', function(req, res){	
	var callback = req.param('callback');
	var lat = req.param('lat') || '';
	var lon = req.param('lon') || '';
	var query = lat+','+lon;
	

	var almanacOptions = {
		host: 'api.wunderground.com',
		port: 80,
		path: 'http://api.wunderground.com/api/16ff6f53cb5fb58f/almanac/q/'+query+'.json',
		method: 'GET'
	};

	rest.getJSON(almanacOptions, function(status, almanac){
		
		var forecastOptions = {
			host: 'api.wunderground.com',
			port: 80,
			path: '/api/16ff6f53cb5fb58f/forecast10day/q/'+query+'.json',
			method: 'GET'
		};

		rest.getJSON(forecastOptions, function(status, forecast){
			
			res.set({
				'Content-Type': 'application/javascript',
			});

			//process data 
			var data = {};
			data.forecast = [];
			
			var f = forecast.forecast.simpleforecast.forecastday;
			
			for(var i = 0; i < f.length; i++){
				data.forecast.push({
					high : f[i].high.fahrenheit,
					low : f[i].low.fahrenheit,
					perc : f[i].pop,
					icon : f[i].icon,
					month : f[i].date.monthname,
					weekDay : f[i].date.weekday,
					day : f[i].date.day
				});
			}

			data.almanac = almanac.almanac;
			res.send(callback+'('+JSON.stringify(data)+');');
		});
	});

});

console.log("Express server listening on port " + 3333);
