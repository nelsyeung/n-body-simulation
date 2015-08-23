function Vector(x, y, z) {
	'use strict';
	this.x = x || 0;
	this.y = y || 0;
	this.z = z || 0;
}

Vector.add = function(a, b) {
	'use strict';
	if (typeof b.x !== 'undefined') {
		return new Vector(a.x + b.x, a.y + b.y, a.z + b.z);
	}
	else {
		return new Vector(a.x + b, a.y + b, a.z + b);
	}
};

Vector.subtract = function (a, b) {
	'use strict';
	if (typeof b.x !== 'undefined') {
		return new Vector(a.x - b.x, a.y - b.y, a.z - b.z);
	}
	else {
		return new Vector(a.x - b, a.y - b, a.z - b);
	}
};

Vector.multiply = function (a, b) {
	'use strict';
	if (typeof b.x !== 'undefined') {
		return new Vector(a.x * b.x, a.y * b.y, a.z * b.z);
	}
	else {
		return new Vector(a.x * b, a.y * b, a.z * b);
	}
};

Vector.divide = function (a, b) {
	'use strict';
	if (typeof b.x !== 'undefined') {
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

function calculate(G, dt, bodies) {
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

	postMessage([bodies]);
}

onmessage = function (e) {
	'use strict';
	calculate(e.data[0], e.data[1], e.data[2]);
};
