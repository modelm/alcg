var http = require('http');
var _ = require('underscore');
var Backbone = require('backbone');
var Dice = require('dice');

var Character = Backbone.Model.extend({
	initialize: function() {
		var instance = this;

		// attributes
		var step1 = (function() {
			var attributes = [
				'strength',
				'endurance',
				'agility',
				'precision',
				'intelligence',
				'wisdom',
				'perception',
				'charisma'
			];
			var changes = {};

			_.each(attributes, function(attribute) {
				changes[attribute] = instance._roll('3d6');
			});

			console.log('generating attributes');

			instance.set(changes);
		})();

		// characteristics
		var step2 = (function(){
			var race = (function() {
				var races = [
					'human',
					'ais\'lun',
					'viantu',
					'djenndan',
					'kahlnissá',
					'pulnagá'
				];

				var result = instance._roll('1d6');

				console.log('determining race');

				return instance.set({race: races[result - 1]});
			})();

			var racial_adjustments = (function() {
				var formulas = { /* str   end   agi   pre   int   wis   per   cha */
					'human':     [ '-0', '-0', '-0', '-0', '-0', '-0', '-0', '-0' ],
					'ais\'lun':  [ '-0', '+2', '-2', '-0', '-1', '+1', '+2', '-0' ],
					'viantu':    [ '-2', '-1', '+2', '+2', '+1', '-0', '-0', '-0' ],
					'djenndan':  [ '+2', '+2', '-1', '-2', '-0', '-0', '+1', '-0' ],
					'kahlnissá': [ '-1', '-2', '+2', '-0', '+2', '-0', '+1', '-0' ],
					'pulnagá':   [ '-0', '-0', '+1', '+1', '+1', '-1', '-1', '-0' ]
				};
				var attributes = [
					'strength',
					'endurance',
					'agility',
					'precision',
					'intelligence',
					'wisdom',
					'perception',
					'charisma'
				];
				var changes = {};

				_.each(attributes, function(attribute, key) {
					var adjustment = formulas[instance.get('race')][key];

					if ( adjustment !== '-0' ) {
						changes[attribute] = eval(instance.get(attribute) + adjustment);
					}
				});

				console.log('applying racial adjustments');

				return instance.set(changes);
			})();

			var sex = (function() {
				var is_reroll = false;

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

				console.log('determining sex');

				return roll();
			})();

			var appearance = (function() {
				var formulas = {
					'human': {
						height:   '3d6+60',
						weight:   '6d20+100',
						base_age: '1d8+15'
					},
					'ais\'lun': {
						height:   '3d6+36',
						weight:   '5d20+90',
						base_age: '1d20+30'
					},
					'viantu': {
						height:   '3d6+36',
						weight:   '5d20+50',
						base_age: '1d6+5'
					},
					'djenndan': {
						height:   '3d6+84',
						weight:   '6d20+280',
						base_age: '1d8+12'
					},
					'kahlnissá': {
						height:   '3d6+60',
						weight:   '5d20+90',
						base_age: '1d12+15'
					},
					'pulnagá': {
						height:   '3d6+60',
						weight:   '5d20+100',
						base_age: '1d10+15'
					}
				};
				var features = [
					'Deep scar across left cheek',
					'Birthmark in prominent location',
					'Upturned nose',
					'Cleft palate/cleft lip',
					'Lazy eye',
					'Pierced lip or stretched lip plate',
					'Walks on edges or balls of feet',
					'Extremely hirsute',
					'Freckled skin/skin spots',
					'Striking, patterned face paint',
					'Dwarfism (adjust height/weight accordingly)',
					'Excessive and/or intense blinking',
					'Ocular heterochromia',
					'Frequent habitual coughing',
					'Mumbles and/or trails off at the end of speech',
					'Deep pock marks in face and skin',
					'Ragged scar diagonally across entire face',
					'Always repeats the last word others speak',
					'Cauliflower ear/torn ear',
					'Very large hands',
					'Symmetrical scars across both cheeks',
					'Webbed fingers and/or toes',
					'Abnormally tall (height +20 inches)',
					'Speaks with an unusually low-pitched voice',
					'Roll 2 features here (cumulative)',
					'Speaks with an unusually high-pitched voice',
					'Burn scars on face and/or shoulder',
					'Extra digit on hands and/or feet',
					'An asynchronous gait',
					'Wide neck and/or sloped shoulders',
					'Appears much older than actual age',
					'Concave or sunken patch of skin',
					'Dyed hair and/or fur',
					'Missing several teeth',
					'Geometric scarification on body and/or face',
					'Blemished or bumpy skin',
					'Pronounced overbite',
					'Habitually sways back and forth',
					'Incredibly small, rounded ears',
					'Missing two fingers from right hand',
					'Shaved eyebrows',
					'Impeccable poise and/or clear-headedness',
					'Very short arms and/or legs',
					'Very long arms and/or legs',
					'An odd, but not displeasing smell',
					'Whip scars across back',
					'One eye appears higher than the other',
					'Cracks knuckles and/or neck frequently',
					'Pronounced double chin',
					'Remarkably indistinct (no distinguishing features)',
					'Ritually tattooed body',
					'Vitiligo',
					'Missing two fingers from left hand',
					'Darkened, raised moles on face and/or body',
					'Shockingly narrow shoulders',
					'Abnormally short (height -20 inches)',
					'Four clearly visible scars from stab wounds',
					'Deeply curved spine',
					'Pronounced underbite',
					'Shaved head',
					'Ritual or symbolic branding on arms/legs',
					'Deep scar across right cheek',
					'Incredibly large, elongated ears',
					'Pronounced albinism',
					'Noticeably upright posture',
					'Tall warts on face and neck',
					'Stretched ear piercings',
					'Nearly hairless with translucent skin',
					'Clouded/scarred/damaged right eye',
					'Burn scars on arms and/or body',
					'A habit of staring',
					'Large and/or bulbous nose',
					'Very large, gapped teeth',
					'Pointed, jutting chin',
					'Roll 2 features here (cumulative)',
					'Remarkably wide-set facial features',
					'Pierced septum with elaborate jewelry',
					'Patchy baldness',
					'Stands in close proximity to others while talking',
					'Split tongue',
					'Mutters or vocalizes to self',
					'Broken nose that healed in a misshapen way',
					'Scars from an animal bite',
					'Clouded/scarred/damaged left eye',
					'Very small hands',
					'Missing one ear',
					'Multiple ear piercings (at least eight)',
					'Nose frequently makes whistling sound',
					'Noticeably dry, cracked, or scaly skin',
					'Frequently squints and/or furrows brow',
					'Teeth filed to points',
					'Pierced nasal bridge',
					'Unusual, strangely colored eyes',
					'Ritually tattooed face',
					'Matted or dreaded hair and/or fur',
					'Beady eyes',
					'Remarkably close-set facial features',
					'Colored nails',
					'Habitually touches head',
					'Roll 3 features here (cumulative)'
				];
				var changes = {
					height:   instance._roll(formulas[instance.get('race')].height),
					weight:   instance._roll(formulas[instance.get('race')].weight),
					base_age: instance._roll(formulas[instance.get('race')].base_age),
					distinguishing_features: []
				};
				var feature_roll = function() {
					var result = instance._roll('1d100');
					var feature = features[result - 1];

					if (result === 75) {
						feature_count += 2;
						return feature_roll();
					}

					if (result === 100) {
						feature_count += 3;
						return feature_roll();
					}

					if (_.contains(changes['distinguishing_features'], feature)) {
						return feature_roll();
					}

					changes['distinguishing_features'].push(feature);

					if (changes['distinguishing_features'].length < feature_count) {
						return feature_roll();
					}
				}
				var feature_count = 1;

				feature_roll();

				console.log('determining appearance');

				return instance.set(changes);
			})();
		})();

	},

	/**
	 * like Dice.roll except returns sum of rolls and also handles adding to the sum e.g. '2d6+10'
	 * NOTE if you only want one die, you MUST start the formula with '1' e.g. '1d6' - otherwise Dice.roll assumes 2 dice
	 */
	_roll: function(formula) {
		var rolls = Dice.roll(formula);
		var addition = parseInt(formula.split('+')[1]) || 0;
		var sum = function(array) {return array.reduce((a, b) => a + b, 0)};

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
