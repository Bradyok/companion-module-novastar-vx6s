// NovaStar-VX6S

var tcp = require('../../tcp');
var instance_skel = require('../../instance_skel');
var debug;
var log;

function instance(system, id, config) {
	var self = this;

	// super-constructor
	instance_skel.apply(this, arguments);

	self.actions(); // export actions

	return self;
}

instance.prototype.CHOICES_INPUTS = [
	{ id: '0', label: 'HDMI 1' },
	{ id: '1', label: 'HDMI 2' },
	{ id: '2', label: 'SDI 1' },
	{ id: '3', label: 'SDI 2' },
	{ id: '4', label: 'DVI 1' },
	{ id: '5', label: 'DVI 2' },
	{ id: '6', label: 'USB' }
]

instance.prototype.CHOICES_DISPLAY_MODES = [
	{ id: '0', label: 'Normal' },
	{ id: '1', label: 'Freeze' },
	{ id: '2', label: 'Black' }
]


instance.prototype.updateConfig = function(config) {
	var self = this;

	self.config = config;
	self.init_tcp();
}

instance.prototype.init = function() {
	var self = this;

	debug = self.debug;
	log = self.log;

	self.init_tcp();
}

instance.prototype.init_tcp = function() {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
		delete self.socket;
	}

	if (self.config.port === undefined) {
		self.config.port = 5200;
	}

	if (self.config.host) {
		self.socket = new tcp(self.config.host, self.config.port);

		self.socket.on('status_change', function (status, message) {
			self.status(status, message);
		});

		self.socket.on('error', function (err) {
			debug('Network error', err);
			self.log('error','Network error: ' + err.message);
		});

		self.socket.on('connect', function () {
			let cmd = new Buffer([0x55,0xAA,0x00,0x00,0xFE,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x02,0x00,0x00,0x00,0x02,0x00,0x57,0x56]);
			self.socket.send(cmd);
			debug('Connected');
		});

		// if we get any data, display it to stdout
		self.socket.on('data', function(buffer) {
			//var indata = buffer.toString('hex');
			//future feedback can be added here
			//console.log(indata);
			console.log('Buffer:', buffer);
		});

	}
};

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;

	return [
		{
			type: 'text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'This module will connect to a NovaStar VX6S LED Processor.'
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'IP Address',
			width: 6,
			default: '192.168.0.1',
			regex: self.REGEX_IP
		}
	]
};

// When module gets deleted
instance.prototype.destroy = function() {
	var self = this;

	if (self.socket !== undefined) {
		self.socket.destroy();
	}

	debug('destroy', self.id);
}

instance.prototype.actions = function() {
	var self = this;

	self.system.emit('instance_actions', self.id, {
		
		'change_input': {
			label: 'Change Input',
			options:
			[
				{
					type: 'dropdown',
					label: 'Input',
					id: 'input',
					default: '0',
					choices: self.CHOICES_INPUTS
				}
			]
		},
		'change_display_mode': {
			label: 'Change Display Mode',
			options:
			[
				{
					type: 'dropdown',
					label: 'Display Mode',
					id: 'display_mode',
					default: '0',
					choices: self.CHOICES_DISPLAY_MODES
				}
			]
		},
		'pip_onoff': {
			label: 'Turn Picture In Picture (PIP) On or Off',
			options:
			[
				{
					type: 'dropdown',
					label: 'On/Off',
					id: 'value',
					default: '0',
					choices:
					[
						{ id: '0', label: 'Off' },
						{ id: '1', label: 'On' }
					]
				}
			]
		}
		
	});
}

instance.prototype.action = function(action) {

	var self = this;
	var cmd;
	var options = action.options;
	
	var lf = '\u000a';
	
	switch(action.action) {
		case 'change_input':
			switch(options.input) {
				case '0':
					//HDMI1
					cmd = new Buffer([0x55,0xAA,0x00,0x88,0xFE,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x12,0x00,0x02,0x13,0x03,0x00,0x00,0x00,0x11,0x17,0x57]);
					break;
				case '1':
					//HDMI2
					cmd = new Buffer([0x55,0xAA,0x00,0xA8,0xFE,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x12,0x00,0x02,0x13,0x03,0x00,0x01,0x00,0x12,0x39,0x57]);
					break;
				case '2':
					//SDI1
					cmd = new Buffer([0x55,0xAA,0x00,0xC4,0xFE,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x12,0x00,0x02,0x13,0x03,0x00,0x02,0x00,0x31,0x75,0x57]);
					break;
				case '3':
					//SDI2
					cmd = new Buffer([0x55,0xAA,0x00,0xD4,0xFE,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x12,0x00,0x02,0x13,0x03,0x00,0x03,0x00,0x32,0x87,0x57]);
					break;
				case '4':
					//DVI1
					cmd = new Buffer([0x55,0xAA,0x00,0xD6,0xFE,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x12,0x00,0x02,0x13,0x03,0x00,0x04,0x00,0x01,0x59,0x57]);
					break;
				case '5':
					//DVI2
					cmd = new Buffer([0x55,0xAA,0x00,0xD7,0xFE,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x12,0x00,0x02,0x13,0x03,0x00,0x06,0x00,0x02,0x5d,0x57]);
					break;
				case '6':
					//USB
					cmd = new Buffer([0x55,0xAA,0x00,0xD9,0xFE,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x12,0x00,0x02,0x13,0x03,0x00,0x07,0x00,0x00,0x54,0x57]);
					break;				
			}
			break;
		case 'change_display_mode':
			switch(options.display_mode) {
				case '0':
					//Normal
					cmd = new Buffer([0x55,0xAA,0x00,0x00,0xFE,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x50,0x00,0x20,0x02,0x01,0x00,0x02,0xC7,0x56]);
					break;
				case '1':
					//Freeze
					cmd = new Buffer([0x55,0xAA,0x00,0x00,0xFE,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x50,0x00,0x20,0x02,0x01,0x00,0x02,0xC8,0x56]);
					break;
				case '2':
					//Black
					cmd = new Buffer([0x55,0xAA,0x00,0x00,0xFE,0x00,0x00,0x00,0x00,0x00,0x01,0x00,0x50,0x00,0x20,0x02,0x01,0x00,0x02,0xC9,0x56]);
					break;
			}
			break;
		case 'pip_onoff':
			switch(options.value) {
				case '0':
					//Off
					cmd = new Buffer([0x55,0xAA,0x00,0x00,0xFE,0xFF,0x00,0x00,0x00,0x00,0x01,0x00,0x30,0x00,0x20,0x02,0x01,0x00,0x00,0xA6,0x57]);
					break;
				case '1':
					//On
					cmd = new Buffer([0x55,0xAA,0x00,0x00,0xFE,0xFF,0x00,0x00,0x00,0x00,0x01,0x00,0x30,0x00,0x20,0x02,0x01,0x00,0x01,0xA7,0x57]);
			break;
			}
			break;
	}

	if (cmd !== undefined) {
		if (self.socket !== undefined && self.socket.connected) {
			self.socket.send(cmd);
		} else {
			debug('Socket not connected :(');
		}

	}
};

instance_skel.extendedBy(instance);
exports = module.exports = instance;