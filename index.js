var http = require('http');
var fs = require('fs');
var _ = require('underscore');
var Backbone = require('backbone');
var Dice = require('dice');

var CharacterGenerator = Backbone.Model.extend({
	initialize: function() {
		var instance = this;

		instance.data = JSON.parse(fs.readFileSync(__dirname + '/data.json'));

		// step one: generate attributes
		instance.generateAttributes();

		// step two: determine characteristics
		instance.determineCharacteristics();

		// step three: discover origins
		instance.discoverOrigins();

		// TODO step 4

		// step five: enounter pale stone
		instance.encounterPaleStone();

		// TODO step 6

		// TODO step 7
	},

	generateAttributes: function() {
		var instance = this;
		var changes = {};

		console.log('generating attributes');

		_.each(instance.data.attributes, function(attribute) {
			changes[attribute] = instance._roll('3d6');
		});

		instance.set(changes);
	},

	determineCharacteristics: function() {
		var instance = this;

		// race
		(function() {
			var races = Object.keys(instance.data.characteristics.race);
			console.log('determining race');
			instance.set({race: races[instance._roll('d' + races.length) - 1]});
		})();

		// attribute adjustments
		(function() {
			var adjustments = instance.data.characteristics.race[instance.get('race')].attribute_adjustments;
			var callback = function(adjustment, attribute) {
				changes[attribute] = eval(instance.get(attribute) + adjustment);
			};
			var changes = {};

			console.log('applying racial attribute adjustments');
			_.each(adjustments, callback);
			return instance.set(changes);
		})();

		// sex
		(function() {
			var roll = function() {
				var result = instance._roll('d8');

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
			var features = instance.data.characteristics.distinguishing_features;
			var formulas = instance.data.characteristics.race[instance.get('race')];
			var changes = {
				height: instance._roll(formulas.height),
				weight: instance._roll(formulas.weight),
				base_age: instance._roll(formulas.base_age),
				distinguishing_features: []
			};
			var num_features = 1;
			var roll = function() {
				var result = instance._roll('d' + features.length);
				var feature = features[result - 1];

				if (result === features.length * 3/4) {
					num_features += (num_features === 1) ? 1 : 2;
					return roll();
				}

				if (result === features.length) {
					num_features += (num_features === 1) ? 2 : 3;
					return roll();
				}

				if (_.contains(changes['distinguishing_features'], feature)) {
					return roll();
				}

				changes['distinguishing_features'].push(feature);

				if (changes['distinguishing_features'].length < num_features) {
					return roll();
				}
			};
			// TODO output log for determining height etc.
			// TODO handle features that adjust other attributes, e.g. abnormally tall/short

			console.log('determining appearance');
			roll();
			return instance.set(changes);
		})();
	},

	discoverOrigins: function() {
		var instance = this;
		var changes = {};

		console.log('discovering origins');

		_.each(instance.data.origins, function(options, origin) {
			changes[origin] = options[instance._roll('d' + options.length) - 1];
		});

		instance.set(changes);
	},

	encounterPaleStone: function() {
		var instance = this;
		var changes = {};
		var outcome_key = 'outcome_of_encounter';
		var results = [];
		var counts = [];

		console.log('encountering pale stone');

		// first roll for description, locale, exposure, and impact
		_.each(instance.data.pale_stone, function(options, pale_stone) {
			var result = instance._roll('d' + options.length) - 1;
			changes[pale_stone] = options[result];
			results.push(result);
		});

		// then determine outcome based on previous rolls
		_.each(results, function(i, result) {
			counts[i] = counts[i] ? counts[i] + 1 : 1;
		});

		// remove null elements
		counts = counts.filter(function(n){ return n != undefined }); 

		// all different
		if ((new Set(results)).size === results.length) {
			changes[outcome_key] = 'Your character’s encounter was painful, haunting, and traumatic (-2 Debility Resistance)';
		// all the same
		} else if (counts.length === 1) {
			changes[outcome_key] = 'Your character discovers an intrinsic bond with Pale Stone (+2 healing, character never ages).';
		// three of a kind
		} else if (_.contains(counts, 3)) {
			// TODO die
			changes[outcome_key] = 'Your character’s exposure causes painful lesions, internal bleeding, then death. (Roll death chart)';
		// one pair
		} else if (_.contains(counts, 2) && counts.length === 3) {
			changes[outcome_key] = 'Your character discovers a deep connection to Pale Stone, and can harness its energy. (+1 healing)';
		// two pair
		} else if (_.contains(counts, 2) && counts.length === 2) {
			// TODO adjust capacity
			changes[outcome_key] = 'Your character discovers an affinity for Pale Stone, and can harness its energy. (+2 healing)';
		}

		instance.set(changes);
	},

	/**
	 * like Dice.roll except:
	 * - defaults to 1 die rather than 2 dice when formula begins with 'd'
	 * - handles adding to the sum e.g. '2d6+10'
	 * - returns sum of rolls
	 */
	_roll: function(formula) {
		// Dice.roll defaults to two dice unless we specify otherwise
		formula = formula.replace(/^d/, '1d');

		var rolls = Dice.roll(formula);
		var addition = parseInt(formula.split('+')[1]) || 0;
		var sum = function(array) {return array.reduce((a, b) => a + b, 0)};

		console.log('rolling ' + formula + ': ' + rolls.join(', '));

		return sum(rolls) + addition;
	},

	set: function(attributes, options) {
		var instance = this;

		// handle values containing embedded rolls e.g. "[d6] adoptive siblings"
		_.each(attributes, function(attribute, key) {
			if (typeof attribute === 'string') {
				var d_regex = /\[([0-9]*d[0-9]+)\]/;
				var d_match = attribute.match(d_regex);

				if (d_match) {
					attributes[key] = attribute.replace(d_regex, instance._roll(d_match[1]));
				}
			}
		});

		console.log(attributes);

		return Backbone.Model.prototype.set.call(this, attributes, options);
	}
});

//console.log(new CharacterGenerator);

http.createServer(function(req, res) {
	console.log = function(msg) {
		if (typeof msg === 'object') {
			msg = JSON.stringify(msg, null, 4);
		}
		return res.write(msg + "\n");
	}

	var c = new CharacterGenerator;

	console.log('\n\nfinal stats');

	console.log(c);

	res.end();
}).listen(process.env.PORT || 5000);
