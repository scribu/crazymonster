/* jshint node:true */

// Set this to the device Sphero connects as on your computer
var settings = require('./settings.js');
var processFrame = require('./gestures.js').processFrame;

var safeMode = true; //Turn this off if Sphero is in water or you like to live dangerously!


var Leap = require('leapjs');
var spheron = require('spheron');
var macro = spheron.commands.macro;
var C = spheron.toolbelt.COLORS;

function flip(sphero) {
	var t;

	function turnOrange() {
		sphero.setRGB(C.ORANGE);
		t = setTimeout(turnRed, 300);
	}
	t = setTimeout(turnOrange, 100);

	function turnRed() {
		sphero.setRGB(C.RED);
	}

	sphero.setRawMotorValues(0x01, 255, 0x01, 255);
	function breakM() {
		// sphero.setRawMotorValues(0x03, 0, 0x03, 255);
		sphero.setStabalisation(true);
		clearTimeout(t);
		sphero.setRGB(C.BLACK);
	}
	setTimeout(breakM, 2000);
}

function rollSphero(sphero, heading) {
	sphero.roll(128, heading, 1);
	if (safeMode) {
		setTimeout(function() {
			stopSphero(sphero);
		}, 2000);
	}
}

var stopSphero = function(sphero) {
	sphero.abortMacro();
	sphero.roll(0,sphero.heading||0,0);
};

var handleTap = (function() {
	var colors = [ C.BLACK, C.BLUE, C.GREEN, C.ORANGE, C.PINK, C.PURPLE, C.RED, C.WHITE, C.YELLOW ];
	var cur_color = 0;

	return function(sphero) {
		sphero.setRGB(colors[cur_color++]);
		if (cur_color > colors.length-1)
			cur_color = 0;
	}
}());

var drawCircle = function(sphero) {
	var i = 0;

	function step() {
		sphero.setHeading(10);
		i++;
		if (i<36)
			setTimeout(step, 100);
	}

	step();
};

var controlSphero = function(sphero) {

	var controller = new Leap.Controller({frameEventName:'deviceFrame', enableGestures:true});

	controller.on('connect', function() {
		console.log('connected to leap motion');
	});
	controller.on('protocol', function(p) {
		console.log('protocol', p);
	});
	controller.on('ready', function() {
		console.log('ready');
	});
	controller.on('blur', function() {
		console.log('blur?');
	});
	controller.on('focus', function() {
		console.log('focus?');
	});
	controller.on('streamingStarted', function() {
		console.log('device connected');
	});
	controller.on('streamingStopped', function() {
		console.log('device disconnected');
	});
	controller.on('frame', function(frame) {
		var gesture = processFrame(frame);
		if (gesture !== null) {
			console.log(gesture);
			handleGesture(gesture);
		}
	});

	var handleGesture = function(g) {
		sphero.abortMacro();

		switch (g.name) {
			case 'swipeLeft':
				rollSphero(sphero, 270);
			break;
			case 'swipeRight':
				rollSphero(sphero, 90);
			break;
			case 'turnLeft':
				sphero.setHeading(225);
			break;
			case 'turnRight':
				sphero.setHeading(45);
			break;
			case 'turnDown':
				rollSphero(sphero, 0);
			break;
			case 'turnUp':
				rollSphero(sphero, 180);
			break;
			case 'swipeDown':
				stopSphero(sphero);
			break;
			case 'grab':
				sphero.runMacro(255);
				flip(sphero);
			break;
			case 'keyTap':
				handleTap(sphero);
			break;
		}
	}

	controller.connect();
	console.log('waiting for Leap Motion connection...');
};

var ball = spheron.sphero().resetTimeout(true);
ball.open(settings.device);

console.log("waiting for Sphero connection...");
ball.on('open', function() {
	console.log('connected to Sphero');
	ball.setRGB(spheron.toolbelt.COLORS.PURPLE).setBackLED(255);
	controlSphero(ball);
});
