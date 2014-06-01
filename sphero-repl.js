var settings = require('./settings.js');

var spheron = require('spheron');
var repl = require('repl');

function scare(sphero) {
	sphero.roll(255, 0);

	setTimeout(function() {
		sphero.roll(255, 180, 10);

		setTimeout(function() {
			sphero.roll(0, 0, 10);
		}, 500);
	}, 500);
}

function startSphero(spheroPort, callback) {
	var sphero = spheron.sphero();
	sphero.resetTimeout(true);
	sphero.on('open', function(err) {
		if (err) throw err;
		console.log('Connected to Sphero...');
		callback(sphero);
	});

	sphero.on('error', function(error) {
		console.log(error);
	});

	sphero.on('end', function() {
		console.log('Connection has ended');
	});

	console.log('Connecting to Sphero...');

	sphero.open(spheroPort);
}

function startRepl(sphero) {
	var context = repl.start('Spher⊚n > ').context;
	context.s = context.sphero = sphero;
	context.C = spheron.toolbelt.COLORS;
	context.scare = scare;
}

startSphero(settings.device, startRepl);
