/**
 * DOM
 */
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var $zoom = document.getElementById('zoom');
var $bodies = document.getElementById('bodies');
var $startBtn = document.getElementById('start-btn');
var $stopBtn = document.getElementById('stop-btn');

/**
 * Grid size
 */
var winWidth = window.innerWidth;
var winHeight = window.innerHeight;
var minX = 0;
var maxX = winWidth;
var minY = 0;
var maxY = winHeight;
var viewDist = 200;
var zoom = 1;

/**
 * Simulation variables
 */
var G = 1;
var dt = 0.3;
var bodies = [];
var requestId;

window.requestAnimFrame = (function(){
	'use strict';
	return window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.msRequestAnimationFrame;
})();

/**
 * Vector library
 */
function Vector(x, y, z) {
	'use strict';
	this.x = x || 0;
	this.y = y || 0;
	this.z = z || 0;
}

Vector.add = function(a, b) {
	'use strict';
	if (b instanceof Vector) {
		return new Vector(a.x + b.x, a.y + b.y, a.z + b.z);
	}
	else {
		return new Vector(a.x + b, a.y + b, a.z + b);
	}
};

Vector.subtract = function (a, b) {
	'use strict';
	if (b instanceof Vector) {
		return new Vector(a.x - b.x, a.y - b.y, a.z - b.z);
	}
	else {
		return new Vector(a.x - b, a.y - b, a.z - b);
	}
};

Vector.multiply = function (a, b) {
	'use strict';
	if (b instanceof Vector) {
		return new Vector(a.x * b.x, a.y * b.y, a.z * b.z);
	}
	else {
		return new Vector(a.x * b, a.y * b, a.z * b);
	}
};

Vector.divide = function (a, b) {
	'use strict';
	if (b instanceof Vector) {
		return new Vector(a.x / b.x, a.y / b.y, a.z / b.z);
	}
	else {
		return new Vector(a.x / b, a.y / b, a.z / b);
	}
};

Vector.magnitude = function (a) {
	'use strict';
	return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
};

function Body(radius, mass, pos, velocity) {
	'use strict';
	this.radius = radius;
	this.mass = mass;
	this.prevPos = pos;
	this.currPos = pos;
	this.velocity = velocity;
	this.accel = new Vector();
}

function startSim() {
	'use strict';
	$startBtn.disabled = true;
	$stopBtn.disabled = false;

	if (bodies.length > 0 && !requestId) {
		requestAnimFrame(calculate);
	}
}

function stopSim() {
	'use strict';
	$startBtn.disabled = false;
	$stopBtn.disabled = true;

	if (requestId) {
		window.cancelAnimationFrame(requestId);
		requestId = undefined;
	}
}

function simple() {
	'use strict';
	bodies = [];
	bodies.push(new Body(10, 10000, new Vector(0, 0, 0), new Vector(0, 0 , 0)));
	bodies.push(new Body(5, 500, new Vector(0, -100, 0), new Vector(-10, 0, 0)));
	bodies.push(new Body(5, 500, new Vector(0, 100, 0), new Vector(10, 0 , 0)));
	bodies.push(new Body(5, 500, new Vector(0, 0, -100), new Vector(0, -10, 0)));
	bodies.push(new Body(5, 500, new Vector(0, 0, 100), new Vector(0, 10 , 0)));

	minX = 0;
	maxX = winWidth;
	minY = 0;
	maxY = winHeight;
	zoom = 1;
	$zoom.innerHTML = 'Zoom: 100%';
	$bodies.innerHTML = 'Bodies: ' + bodies.length;

	stop();
	requestAnimFrame(calculate);
}

function generate() {
	'use strict';
	var bodiesInput = document.getElementById('bodies-input').value;
	var v = bodiesInput / 10;

	bodies = [];

	for (var n=0; n < bodiesInput; ++n) {
		bodies.push(new Body(5, 200,
			new Vector(Math.random() * winWidth - winWidth / 2, // Position
				Math.random() * winHeight - winHeight / 2,
				Math.random() * viewDist - viewDist / 2),
			new Vector(Math.random() * v - v/2, // Velocity
				Math.random() * v - v / 2,
				Math.random() * v - v/2)
			)
		);
	}

	minX = 0;
	maxX = winWidth;
	minY = 0;
	maxY = winHeight;
	zoom = 1;
	$zoom.innerHTML = 'Zoom: 100%';
	$bodies.innerHTML = 'Bodies: ' + bodies.length;

	stop();
	requestAnimFrame(calculate);
}

function setZoom() {
	'use strict';
	zoom = (winWidth / (maxX - minX) + winHeight / (maxY - minY)) / 2;
	$zoom.innerHTML = 'Zoom: ' + (zoom * 100).toFixed(2) + ' %';
}

function draw() {
	'use strict';
	var body;
	var x, y;
	var radius;

	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	$bodies.innerHTML = 'Bodies: ' + bodies.length;

	for (var i = 0; i < bodies.length; ++i) {
		body = bodies[i];
		x = body.currPos.x + maxX / 2;
		y = body.currPos.y + maxY / 2;

		if (x < minX && zoom > 0.1) {
			minX = x;
			setZoom();
		}

		if (x > maxX && zoom > 0.1) {
			maxX = x;
			setZoom();
		}

		if (y < minY && zoom > 0.1) {
			minY = y;
			setZoom();
		}

		if (y > maxY && zoom > 0.1) {
			maxY = y;
			setZoom();
		}

		radius = zoom * body.radius * (body.currPos.z + viewDist) / viewDist;

		x = (x - minX) / (maxX - minX) * winWidth;
		y = (y - minY) / (maxY - minY) * winHeight;

		if (radius <= 0) {
			radius = 0.1;
		}

		ctx.beginPath();
		ctx.arc(x, y, radius, 2 * Math.PI, false);
		ctx.fillStyle = 'white';
		ctx.fill();
	}
}

/**
 * Main calculation function
 */
function calculate() {
	'use strict';
	var body;
	var dR, dv, da;
	var p1, p2, totalMass;
	var accel;
	var magnitude;
	var numBodies = bodies.length;
	var collision;

	for (var i = 0; i < bodies.length; ++i) {
		body = bodies[i];
		body.accel = new Vector();
		body.prevPos = body.currPos;
		collision = false;

		for (var j = 0; j < bodies.length; ++j) {
			if (i === j) {
				continue;
			}

			dR = Vector.subtract(bodies[j].prevPos, body.prevPos);
			magnitude = Vector.magnitude(dR);

			// Inelastic collision
			if (magnitude <= body.radius + bodies[j].radius) {
				collision = true;
				p1 = Vector.multiply(body.velocity, body.mass);
				p2 = Vector.multiply(bodies[j].velocity, bodies[j].mass);
				totalMass = body.mass + bodies[j].mass;
				dv = Vector.divide(Vector.add(p1, p2), totalMass);

				if (bodies[j].radius > body.radius) {
					body.currPos = bodies[j].currPos;
					body.radius = Math.pow(body.radius, 1 / 3) + bodies[j].radius;
				}
				else {
					body.radius = Math.pow(bodies[j].radius, 1 / 3) + body.radius;
				}

				body.mass = totalMass;
				bodies.splice(j, 1);
				$bodies.innerHTML = 'Bodies: ' + bodies.length;
				break;
			}
			else {
				accel = Vector.multiply(dR, (G * bodies[j].mass / Math.pow(magnitude, 3)));
				body.accel = Vector.add(body.accel, accel);
			}
		}

		if (collision) {
			body.velocity = dv;
			dR = Vector.multiply(body.velocity, dt);
		}
		else {
			dv = Vector.multiply(body.accel, dt);
			dR = Vector.multiply(body.velocity, dt);
			dR = Vector.add(dR, Vector.multiply(dv, 0.5 * dt));
			body.velocity = Vector.add(body.velocity, dv);
		}

		body.currPos = Vector.add(body.currPos, dR);
	}

	draw();

	requestId = requestAnimFrame(calculate);
}

window.onresize = function () {
	'use strict';
	winWidth = window.innerWidth;
	winHeight = window.innerHeight;
	ctx.canvas.width = winWidth;
	ctx.canvas.height = winHeight;
};

window.onload = function () {
	'use strict';
	ctx.canvas.width = winWidth;
	ctx.canvas.height = winHeight;
	simple();
};
