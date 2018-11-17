var register = function(Handlebars) {
    var helpers = {
        inc: function(value, options) {
            return parseInt(value) + 1;
        },
        /**
         * Example usage for compare helper
         *
         * {{#compare "Test" "Test"}}
         *   Default comparison of "==="
         * {{/compare}}
         *
         * {{#compare Database.Tables.Count ">" 5}}
         *   There are more than 5 tables
         * {{/compare}}
         */
        compare: function(lvalue, operator, rvalue, options) {
            var operators, results;

            if (arguments.length < 3) {
                throw new Error("Handlerbars Helper 'compare' needs 2 parameters");
            }

            if (options === undefined) {
                options = rvalue;
                rvalue = operator;
                operator = "===";
            }

            operators = {
                '==': function(l, r) {return l == r; },
                '===': function (l, r) { return l === r; },
                '!=': function (l, r) { return l != r; },
                '!==': function (l, r) { return l !== r; },
                '<': function (l, r) { return l < r; },
                '>': function (l, r) { return l > r; },
                '<=': function (l, r) { return l <= r; },
                '>=': function (l, r) { return l >= r; },
                'typeof': function (l, r) { return typeof l == r; }
            };

            if (!operators[operator]) {
                throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);
            }

            result = operators[operator](lvalue, rvalue);

            if (result) {
                return options.fn(this);
            }
            else {
                return options.inverse(this);
            }
        }
    };

    if (Handlebars && typeof Handlebars.registerHelper === 'function') {
        // register helpers
        for (var prop in helpers) {
            Handlebars.registerHelper(prop, helpers[prop]);
        }
    }
    else {
        // just return helpers object if we can't register helpers here
        return helpers;
    }
};

module.exports.register = register;
module.exports.helpers = register(null);
