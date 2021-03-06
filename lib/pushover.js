var https = require('https'),
url = require('url'),
qs = require('querystring'),
p_url = 'https://api.pushover.net/1/messages.json';

function setDefaults(o) {
	var def = [
		'priority',
		'device',
		'title',
		'timestamp',
		'sound',
		'url_title'
	];

	var i = 0; l = def.length;
	for (; i < l; i++) {
		if (!o[def[i]]) {
			o[def[i]] = '';
		}
	}

	return o;
}

function Pushover(opts) {
	var self = this;
	this.token = opts.token;
	this.user = opts.user;
	this.sounds = {
		"pushover":"Pushover (default)",
		"bike":"Bike",
		"bugle":"Bugle",
		"cashregister":"Cash Register",
		"classical":"Classical",
		"cosmic":"Cosmic",
		"falling":"Falling",
		"gamelan":"Gamelan",
		"incoming":"Incoming",
		"intermission":"Intermission",
		"magic":"Magic",
		"mechanical":"Mechanical",
		"pianobar":"Piano Bar",
		"siren":"Siren",
		"spacealarm":"Space Alarm",
		"tugboat":"Tug Boat",
		"alien":"Alien Alarm (long)",
		"climb":"Climb (long)",
		"persistent":"Persistent (long)",
		"echo":"Pushover Echo (long)",
		"updown":"Up Down (long)",
		"none":"None (silent)"
	};

	if (opts.debug) {
		this.debug = opts.debug;
	}

	if (opts.onerror) {
		this.onerror = opts.onerror;
	}

	self.updateSounds();
	if (opts.update_sounds) {
		setInterval(function() {
			self.updateSounds();
		}, 86400000);
	}
};

Pushover.prototype.errors = function(d) {
	if (typeof d === 'string') {
		d = JSON.parse(d);
	}

	if (d.errors) {
		if (this.onerror) {
			this.onerror.call(null, d.errors[0])
		} else {
			throw new Error(d.errors[0]);
		}
	}
}

Pushover.prototype.updateSounds = function() {
	var self = this, data = '';
	var surl = 'https://api.pushover.net/1/sounds.json?token=' + self.token;
	var req = https.request(url.parse(surl) , function(res) {
		res.on('end', function() {
			var j = JSON.parse(data);
			self.errors(data);
			self.sounds = j.sounds;
		});

		res.on('data', function(chunk) {
			data += chunk;
		});

		res.on('error', function(e) {
			err = e;
		});
	});
	req.write('');
	req.end();
};

Pushover.prototype.send = function(obj, fn) {
	var self = this;
	var o = url.parse(p_url);
	o.method = "POST";

	obj = setDefaults(obj);

	if (! self.sounds[ obj.sound ]) {
		obj.sound = 'pushover';
	}

	var req_string = {
		token: self.token || obj.token,
		user: self.user || obj.user
	};

	var p;
	for (p in obj) {
		req_string[ p ] = obj[p];
	}

	req_string = qs.stringify(req_string);

	o.headers = {
		'Content-Length': req_string.length
	};	

	var req = https.request(o, function(res) {
		if (self.debug) {
			console.log(res.statusCode);
		}
		var err;
		var data = '';
		res.on('end', function() {
			self.errors(data);
			if (fn) {
				fn.call(null, err, data);
			}
		});

		res.on('data', function(chunk) {
			data += chunk;
		});

		res.on('error', function(e) {
			err = e;
		});
	});

	if (self.debug) {
		console.log (req_string);
	}
	req.write(req_string);
	req.end();
};

exports = module.exports = Pushover;
