/**
 * SimpleCast API JSONP Proxy 2012
 * @author Matt Null
 */

var express = require('express');
var app = express()
  , http = require('http')
  , server = http.createServer(app)
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

var weatherMap = {
	'Mostly Cloudy' : 'cloud',
	'Chance Thunderstorm' : 'chancetstorms',
	'Slight Chc Thunderstorms' : 'chancetstorms',
	'Chance Showers' : 'rain',
	'Slight Chc Showers' : 'chancerain',
	'Partly Cloudy' : 'partlycloudy',
	'Mostly Sunny' : 'sun'
};

var processForecastData = function(res){

	var normalizedData = {};
	normalizedData.forecast = {};

	var forecast = res.Forecast;
	var period = forecast.period;

	normalizedData.location = forecast.$;

	//forecast
	for(var i = 0; i < period.length; i++){    2
		var day = period[i].valid[0].split(' ')[0];

		normalizedData.forecast[day] = normalizedData.forecast[day] ? normalizedData.forecast[day] : {};
		normalizedData.forecast[day].temp = normalizedData.forecast[day].temp ? normalizedData.forecast[day].temp : {};

		if(period[i].temp[0].$.hilo == 'L'){
			normalizedData.forecast[day].temp.low = period[i].temp[0]._;
		}
		else{
			normalizedData.forecast[day].temp.high = period[i].temp[0]._;
		}
		
		normalizedData.forecast[day].weather = period[i].weather[0];
		normalizedData.forecast[day].summary = period[i].text[0];
		
		var pop = period[i]['pop'];
		normalizedData.forecast[day].percentChanceOfPrecipitation = pop;
		normalizedData.forecast[day].icon = weatherMap[period[i].weather[0]];
	}

	return normalizedData;
};

app.get('/forecast', function(req, res){
	/**
	 lat - 40.04547 
	 lon - -105.28385109999999
	*/

	var lat = req.param('lat') || '';
	var lon = req.param('lon') || '';
	var callback = req.param('callback') || '';

	if(!lat || !lon){
		res.write('{"error" : "Provide latitude and longitude."}');
		res.end();
	}

	var options = {
		host: 'forecast.weather.gov',
		port: 80,
		path: '/MapClick.php?lat='+lat+'&lon='+lon+'&unit=0&lg=english&FcstType=xml',
		method: 'GET'
	};
	
	var parser = new xml2js.Parser();
	var req = http.get(options, function(r) {
		r.setEncoding('utf8');
		r.on('data', function (chunk) {
			parser.parseString(chunk, function (err, result) {
		        res.writeHead(200, {"Content-Type": "application/json"});
		        if(callback){
		        	res.write(callback+'('+JSON.stringify(processForecastData(result))+');');
		        }
		        else{
		        	res.write(JSON.stringify(processForecastData(result)));
		        }
		        res.end();
		    });
			
		});
	});
	
});

app.get('/current', function(req, res){

});
console.log("Express server listening on port " + 3333);
