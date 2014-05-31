/* jshint node:true */

// Set this to the device Sphero connects as on your computer
var settings = require('./settings.js');

var safeMode = true; //Turn this off if Sphero is in water or you like to live dangerously!


var Leap = require('leapjs');
var spheron = require('spheron');
var macro = spheron.commands.macro;
var C = spheron.toolbelt.COLORS;

var flipMacroId = 101;
var flip = spheron.macro(flipMacroId);
flip.append(macro.sendRawMotorCommands(0x01, 255, 0x01, 255, 60));
flip.append(macro.setRGB(C.RED, 60));
flip.append(macro.goto(flip.id()));

function IdentifyGesture(frame) {
            var detectedMove;

            if (frame.hands.length > 0) {
                if (frame.hands[0].grabStrength > 0.8) {
                    return "grab";
                }

                if (frame.hands[0].pinchStrength > 0.8) {
                    return "pinch";
                }

                if (frame.hands[0].direction[1] > 0.45 && frame.hands[0].direction[1] < 0.65) {
                    return "turnUp";
                }

                if (frame.hands[0].direction[1] < -0.45 && frame.hands[0].direction[1] > -0.65) {
                    return "turnDown";
                }

                if (frame.hands[0].direction[0] > 0.45 && frame.hands[0].direction[1] < 0.65) {
                    return "turnRight";
                }

                if (frame.hands[0].direction[0] < -0.45 && frame.hands[0].direction[1] > -0.65) {
                    return "turnLeft";
                }
            }
           
            for (var i = 0; i < frame.gestures.length; i++) {
                var gesture = frame.gestures[i];

                if (gesture.type == "swipe") {
                    //Classify swipe as either horizontal or vertical
                    var isHorizontal = Math.abs(gesture.direction[0]) > Math.abs(gesture.direction[1]);
                    //Classify as right-left or up-down
                    if (isHorizontal) {
                        if (gesture.direction[0] > 0) {
                            detectedMove = "swipeRight";
                        } else {
                            detectedMove = "swipeLeft";
                        }
                    } else { //vertical
                        if (gesture.direction[1] > 0) {
                            detectedMove = "swipeUp";
                        } else {
                            detectedMove = "swipeDown";
                        }
                    }
                }

                if (gesture.type == "keyTap") {
                    return gesture.type;
                }
            }

            return detectedMove;
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
		var gesture = IdentifyGesture(frame);
		console.log(gesture);
		handleGesture(gesture);
	});

	var handleGesture = function(g) {
		switch (g) {
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
			case 'turnForward':
				rollSphero(sphero, 0);
			break;
			case 'turnBackward':
				rollSphero(sphero, 180);
			break;
			case 'swipeDown':
				stopSphero(sphero);
			break;
			case 'grab':
				sphero.runMacro(flipMacroId);
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
	ball.saveTemporaryMacro(flip.done());
	console.log('connected to Sphero');
	ball.setRGB(spheron.toolbelt.COLORS.PURPLE).setBackLED(255);
	controlSphero(ball);
});
