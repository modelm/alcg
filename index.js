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
				'charisma',
			];

			_.each(attributes, function(attribute) {
				instance.set(attribute, instance._roll('3d6'));
			});
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

				return instance.set('race', races[result - 1]);
			})();

			var sex = (function() {
				var is_reroll = false;

				var roll = function() {
					var result = instance._roll('1d8');

					if (_.contains([1, 3, 5], result)) {
						return instance.set('sex', 'male');
					}

					if (_.contains([2, 4, 6], result)) {
						return instance.set('sex', 'female');
					}

					if (_.contains([7, 8], result)) {
						if (is_reroll) {
							return instance.set('sex', 'intersex');
						} else {
							is_reroll = true;
							return roll();
						}
					}
				};

				return roll();
			})();

			var appearance = (function() {
				var formulas = {
					'human': {
						height: '3d6+60',
						weight: '6d20+100',
						base_age: '1d8+15'
					},
					'ais\'lun': {
						height: '3d6+36',
						weight: '5d20+90',
						base_age: '1d20+30'
					},
					'viantu': {
						height: '3d6+36',
						weight: '5d20+50',
						base_age: '1d6+5'
					},
					'djenndan': {
						height: '3d6+84',
						weight: '6d20+280',
						base_age: '1d8+12'
					},
					'kahlnissá': {
						height: '3d6+60',
						weight: '5d20+90',
						base_age: '1d12+15'
					},
					'pulnagá': {
						height: '3d6+60',
						weight: '5d20+100',
						base_age: '1d10+15'
					}
				}

				instance.set('height', instance._roll(formulas[instance.get('race')].height));
				instance.set('weight', instance._roll(formulas[instance.get('race')].weight));
				instance.set('base_age', instance._roll(formulas[instance.get('race')].base_age));
			})();
		})();

		// TODO left off at "Distinguishing Features"
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
       }
});

http.createServer(function(req, res) {
       res.write(new Character);
       console.log(new Character);
}).listen(process.env.PORT || 5000);
