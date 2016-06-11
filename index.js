var http = require('http');
var fs = require('fs');
var _ = require('underscore');
var Backbone = require('backbone');
var Dice = require('dice');

var Character = Backbone.Model.extend({
	initialize: function() {
		var instance = this;

		var data = JSON.parse(fs.readFileSync(__dirname + '/data.json'));

		// step one: generate attributes
		(function() {
			var changes = {};

			console.log('generating attributes');

			_.each(data.attributes, function(attribute) {
				changes[attribute] = instance._roll('3d6');
			});

			instance.set(changes);
		})();

		// step two: determine characteristics
		(function() {
			// race
			(function() {
				var races = Object.keys(data.characteristics.race);
				console.log('determining race');
				instance.set({race: races[instance._roll('1d' + races.length) - 1]});
			})();

			// attribute adjustments
			(function() {
				var adjustments = data.characteristics.race[instance.get('race')].attribute_adjustments;
				var callback = function(adjustment, attribute) {
					if ( adjustment !== '-0' ) {
						changes[attribute] = eval(instance.get(attribute) + adjustment);
					}
				};
				var changes = {};

				console.log('applying racial attribute adjustments');
				_.each(adjustments, callback);
				return instance.set(changes);
			})();

			// sex
			(function() {
				var roll = function() {
					var result = instance._roll('1d8');

					if (_.contains([1, 3, 5], result)) {
						return instance.set({sex: 'male'});
					}

					if (_.contains([2, 4, 6], result)) {
						return instance.set({sex: 'female'});
					}

					if (_.contains([7, 8], result)) {
						if (is_reroll) {
							return instance.set({sex: 'intersex'});
						} else {
							is_reroll = true;
							return roll();
						}
					}
				};
				var is_reroll = false;

				console.log('determining sex');
				return roll();
			})();

			// detailed appearance
			(function() {
				console.log('determining appearance');

				var features = data.characteristics.distinguishing_features;
				var formulas = data.characteristics.race[instance.get('race')];
				var changes = {
					height: instance._roll(formulas.height),
					weight: instance._roll(formulas.weight),
					base_age: instance._roll(formulas.base_age),
					distinguishing_features: []
				};
				var max_features = 1;
				var roll = function() {
					var result = instance._roll('1d100');
					var feature = features[result - 1];

					console.log('feature roll', result);

					if (result === 75) {
						console.log('rolled 75');
						max_features += 2;
						return roll();
					}

					if (result === 100) {
						console.log('rolled 100');
						max_features += 3;
						return roll();
					}

					if (_.contains(changes['distinguishing_features'], feature)) {
						return roll();
					}

					changes['distinguishing_features'].push(feature);

					if (changes['distinguishing_features'].length < max_features) {
						return roll();
					}
				};

				roll();
				return instance.set(changes);
			})();
		})();

		// step three: discover origins
		(function() {
			var changes = {};

			console.log('discovering origins');

			_.each(data.origins, function(options, origin) {
				changes[origin] = options[instance._roll('1d' + options.length) - 1];
			});

			instance.set(changes);
			// TODO Provincial Origins
		})();

		// TODO step 4
		// TODO step 5
		// TODO step 6
		// TODO step 7
	},

	/**
	 * like Dice.roll except returns sum of rolls and also handles adding to the sum e.g. '2d6+10'
	 * NOTE if you only want one die, you MUST start the formula with '1' e.g. '1d6' - otherwise Dice.roll assumes 2 dice
	 */
	_roll: function(formula) {
		var rolls = Dice.roll(formula);
		var addition = parseInt(formula.split('+')[1]) || 0;
		var sum = function(array) {return array.reduce((a, b) => a + b, 0)};

		console.log('rolling ' + formula + ': ' + rolls.join(', '));

		return sum(rolls) + addition;
	},

	set: function(attributes, options) {
		console.log(attributes);

		return Backbone.Model.prototype.set.call(this, attributes, options);
	}
});

//console.log(new Character);

http.createServer(function(req, res) {
	console.log = function(msg) {
		if (typeof msg === 'object') {
			msg = JSON.stringify(msg, null, 4);
		}
		return res.write(msg + "\n");
	}

	var c = new Character;

	console.log('final stats');

	console.log(c);

	res.end();
}).listen(process.env.PORT || 5000);
