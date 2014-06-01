var GESTURES = {
	KEYTAP : "keyTap",
	SWIPERIGHT: "swipeRight",
	SWIPELEFT: "swipeLeft",
	SWIPEUP: "swipeUp",
	SWIPEDOWN: "swipeDown",
	CIRCLE: "circle",
	GRAB: "grab",
	PINCH: "pinch",

	TURNUP: "turnUp",
	TURNDOWN: "turnDown",
	TURNRIGHT: "turnRight",
	TURNLEFT: "turnLeft",
	EXPLOSION: "explosion",
	BOOM : "boom"
};

var CONFIG = {
	PINCH_BOUDARY: 0.8,
	GRAB_BOUDARY: 0.8,
	LOWER_BOUNDARY: 0.25,
	UPPER_BOUNDARY: 0.75,
	FRAME_GROUP_COUNT : 17
};

function getPredefinedGestureInfo(gesture) {

	if (gesture.type == "keyTap") {
		return { name: GESTURES.KEYTAP };
	}

	if (gesture.type == "swipe") {
		//Classify swipe as either horizontal or vertical
		var isHorizontal = Math.abs(gesture.direction[0]) > Math.abs(gesture.direction[1]);
		//Classify as right-left or up-down
		if (isHorizontal) {
			if (gesture.direction[0] > 0) {
				return { name: GESTURES.SWIPERIGHT };
			} else {
				return GESTURES.SWIPELEFT;
			}
		} else { //vertical
			if (gesture.direction[1] > 0) {
				return { name: GESTURES.SWIPEUP };
			} else {
				return { name: GESTURES.SWIPEDOWN };
			}
		}
	}

	if (gesture.type == "circle") {
		return { name: GESTURES.CIRCLE, value: gesture.radius };
	}

	return "";
}

function getComputedGestureInfo(hand) {

	if (hand.grabStrength > CONFIG.GRAB_BOUDARY) {
		return { name: GESTURES.GRAB };
	}

	if (hand.pinchStrength > CONFIG.PINCH_BOUDARY) {
		return { name: GESTURES.PINCH };
	}

	if (hand.direction[1] > CONFIG.LOWER_BOUNDARY && hand.direction[1] < CONFIG.UPPER_BOUNDARY) {
		return { name: GESTURES.TURNUP, value: hand.direction[1] };
	}

	if (hand.direction[1] < -CONFIG.LOWER_BOUNDARY && hand.direction[1] > -CONFIG.UPPER_BOUNDARY) {
		return { name: GESTURES.TURNDOWN, value: hand.direction[1] };
	}

	if (hand.direction[0] > CONFIG.LOWER_BOUNDARY && hand.direction[0] < CONFIG.UPPER_BOUNDARY) {
		return { name: GESTURES.TURNRIGHT, value: hand.direction[0] };
	}

	if (hand.direction[0] < -CONFIG.LOWER_BOUNDARY && hand.direction[0] > -CONFIG.UPPER_BOUNDARY) {
		return { name: GESTURES.TURNLEFT, value: hand.direction[0] };
	}

	return "";
}



function findBoomInFrames(frames)
{
	var firstGrabFound = false;
	var explosionFound = false;
	var secondGrabFound = false;

	for (var i in frames) {

		var frame = frames[i];
		var hand = frame.hands[0];
		if (hand) {

			// the explosion has higher priority so calculate that first
			var handRadius = hand.sphereRadius;
			if (handRadius > 100) {
				explosionFound = true;
			}

			var gestureInfo = getComputedGestureInfo(hand);

			if (gestureInfo.name === GESTURES.GRAB) {
				if (!firstGrabFound) {
					firstGrabFound = true;
				}
				else if (explosionFound){
					secondGrabFound = true;
				}
			}
		}
	}

	return firstGrabFound && explosionFound && secondGrabFound;
}

function IdentifyGesture(frames) {

	var gesturesHit = {};

	gesturesHit[GESTURES.KEYTAP] = 0;
	gesturesHit[GESTURES.SWIPERIGHT] = 0;
	gesturesHit[GESTURES.SWIPELEFT] = 0;
	gesturesHit[GESTURES.SWIPEUP] = 0;
	gesturesHit[GESTURES.SWIPEDOWN] = 0;
	gesturesHit[GESTURES.CIRCLE] = 0;
	gesturesHit[GESTURES.GRAB] = 0;
	gesturesHit[GESTURES.pinch] = 0;
	gesturesHit[GESTURES.turnUp] = 0;
	gesturesHit[GESTURES.turnDown] = 0;
	gesturesHit[GESTURES.turnRight] = 0;
	gesturesHit[GESTURES.turnLeft] = 0;

	var frequency = {};  // array of frequency.
	var max1 = 0;  // holds the max frequency.
	var result1 = {};   // holds the max frequency element.
	var max2 = 0;  // holds the max frequency.
	var result2 = {};   // holds the max frequency element.

	var boom = findBoomInFrames(frames);
	if (boom) {
		return { name: GESTURES.BOOM };
	}
	for (var i in frames) {

		var frame = frames[i];

		// Get all predefined gestures
		for (var j in frame.gestures) {

			var gesture = frame.gestures[j];

			var gestureInfo = getPredefinedGestureInfo(gesture);

			// the tap gesture is a once only gesture so cannot make the majority, threfore it has much greater priority:
			if (gestureInfo.name === GESTURES.KEYTAP) {
				return gestureInfo;
			}

			var gestureName = gestureInfo.name;

			if (gestureName != "") {
				frequency[gestureName] = (frequency[gestureName] || 0) + 1; // increment frequency.

				if (frequency[gestureName] > max1) { // is this frequency > max so far ?
					max1 = frequency[gestureName];  // update max.
					result1 = gestureInfo;          // update result.
				}
			}
		}

		// get all computed single gestures
		if (frame.hands.length > 0) {
			var hand = frame.hands[0];

			var gestureInfo = getComputedGestureInfo(hand);
			var gestureName = gestureInfo.name;

			if (gestureName != "") {
				frequency[gestureName] = (frequency[gestureName] || 0) + 1; // increment frequency.

				if (frequency[gestureName] > max2) { // is this frequency > max so far ?
					max2 = frequency[gestureName];  // update max.
					result2 = gestureInfo;          // update result.
				}
			}
		}
	}

	if (max1 > max2) {
		return result1;
	}
	else {
		return result2;
	} 
}

var frames = [];

exports.processFrame = function (frame) {
	var framesCount = frames.length;
	frames[framesCount] = frame;
	framesCount++;

	if (framesCount > CONFIG.FRAME_GROUP_COUNT) {
		var gesture = IdentifyGesture(frames);

		frames = [];
		framesCount = 0;

		return gesture;
	}

	return null;
}
