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
var dt = 0.5;
var bodies = [];
var simWorker;

function Vector(x, y, z) {
	'use strict';
	this.x = x || 0;
	this.y = y || 0;
	this.z = z || 0;
}

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

	if (typeof(simWorker) === 'undefined') {
		simWorker = new Worker('worker.js');
		// simWorker = new Worker('http://s.codepen.io/nelsyeung/pen/jPgWaV.js');
	}

	simulate();
}

function stopSim() {
	'use strict';
	$startBtn.disabled = false;
	$stopBtn.disabled = true;

	if (typeof(simWorker) !== 'undefined') {
		simWorker.terminate();
		simWorker = undefined;
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

	stopSim();
	startSim();
}

function generate() {
	'use strict';
	var bodiesInput = document.getElementById('bodies-input').value;
	var v = bodiesInput / 12;

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

	stopSim();
	startSim();
}

function simulate() {
	'use strict';
	if (window.Worker) {
		if (typeof(simWorker) !== 'undefined') {
			simWorker.postMessage([G, dt, bodies]);

			simWorker.onmessage = function(e) {
				bodies = e.data[0];
				draw();
				setTimeout(simulate, 20);
			};
		}
	}
	else {
		document.body.innerHTML = 'This simulation requires a newer browser. Your browser does not support Web Workers.';
	}
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

		radius = Math.round(zoom * body.radius * (body.currPos.z + viewDist) / viewDist);

		x = Math.round((x - minX) / (maxX - minX) * winWidth);
		y = Math.round((y - minY) / (maxY - minY) * winHeight);

		if (radius <= 0) {
			radius = 0;
		}

		ctx.beginPath();
		ctx.arc(x, y, radius, 2 * Math.PI, false);
		ctx.fillStyle = 'white';
		ctx.fill();
	}
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
