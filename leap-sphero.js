/* jshint node:true */

// Set this to the device Sphero connects as on your computer
var device = '/dev/cu.Sphero-YBW-RN-SPP';

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
    if (frame.gestures.length) {
      var g = frame.gestures[0];

      if (g.type == 'swipe' && g.state ==='stop') {
        handleSwipe(g);
      }
      if (g.type == 'keyTap' && g.state ==='stop') {
        console.log('keyTap');
        handleTap(g);
      }
      if (g.type == 'circle') {
        console.log('circle');
        handleCircle(g);
      }

    }
  });

  var colors = [ C.BLACK, C.BLUE, C.GREEN, C.ORANGE, C.PINK, C.PURPLE, C.RED, C.WHITE, C.YELLOW ];
  var cur_color = 0;

  var handleTap = function(g) {
	  sphero.setRGB(colors[cur_color++]);
	  if (cur_color > colors.length-1)
		  cur_color = 0;
  };

  var drawCircle = function(g) {
	  var step = 0;

	  var step = function() {
		  sphero.setHeading(10);
		  step++;
		  if (step<36)
			  setTimeout(step, 100);
	  }

	  step();
  };

  var handleCircle = function(g) {
    sphero.write(spheron.commands.api.setHeading(30, { resetTimeout:true }));
  };

  var handleSwipe = function(g) {
    var X = g.position[0] - g.startPosition[0];
    var Y = g.position[1] - g.startPosition[1];
    var Z = g.position[2] - g.startPosition[2];

    var aX = Math.abs(X);
    var aY = Math.abs(Y);
    var aZ = Math.abs(Z);

    var big = Math.max(aX, aY, aZ);
    var direction = '?';

    if (aX === big) {
      direction = 'RIGHT';
      if (X < 0) {
        direction = 'LEFT';
      }
    } else if (aY === big) {
      direction = 'UP';
      if (Y < 0) {
        direction = 'DOWN';
      }
    } else if (aZ === big) {
      direction = 'REVERSE';
      if (Z < 0) {
        direction = 'FORWARD';
      }
    }

    switch (direction) {
      case 'LEFT':
        sphero.heading = 270;
        sphero.roll(128, 270, 1);
        if (safeMode) {
          setTimeout(function() {
            stopSphero(sphero);
          }, 2000);
        }
        break;
      case 'RIGHT':
        sphero.heading = 90;
        sphero.roll(128, 90, 1);
        if (safeMode) {
          setTimeout(function() {
            stopSphero(sphero);
          }, 2000);
        }
        break;
      case 'UP':
        sphero.runMacro(flipMacroId);
        break;
      case 'DOWN':
        stopSphero(sphero);
        break;
      case 'FORWARD':
        sphero.heading = 0;
        sphero.roll(128, 0, 1);
        if (safeMode) {
          setTimeout(function() {
            stopSphero(sphero);
          }, 2000);
        }
        break;
      case 'REVERSE':
        sphero.heading = 180;
        sphero.roll(128, 180, 1);
        if (safeMode) {
          setTimeout(function() {
            stopSphero(sphero);
          }, 2000);
        }

        break;

    }

    console.log('Direction: %s', direction);
  }

  controller.connect();
  console.log('waiting for Leap Motion connection...');
};


var stopSphero = function(sphero) {
  sphero.abortMacro();
  sphero.roll(0,sphero.heading||0,0);
};

var ball = spheron.sphero().resetTimeout(true);
ball.open(device);
ball.saveTemporaryMacro(flip.done());

console.log("waiting for Sphero connection...");
ball.on('open', function() {
  console.log('connected to Sphero');
  ball.setRGB(spheron.toolbelt.COLORS.PURPLE).setBackLED(255);
  controlSphero(ball);
});
