export const register = function(Handlebars) {
    const helpers = {
        inc(value, options) {
            return parseInt(value) + 1;
        },
        compare(lvalue, operator, rvalue, options) {
            const operators = {
                '==': (l, r) => l == r,
                '===': (l, r) => l === r,
                '!=': (l, r) => l != r,
                '!==': (l, r) => l !== r,
                '<': (l, r) => l < r,
                '>': (l, r) => l > r,
                '<=': (l, r) => l <= r,
                '>=': (l, r) => l >= r,
                'typeof': (l, r) => typeof l == r
            };

            if (!operators[operator]) {
                throw new Error(`Handlebars Helper 'compare' doesn't know the operator ${operator}`);
            }

            const result = operators[operator](lvalue, rvalue);

            return result ? options.fn(this) : options.inverse(this);
        }
    };

    if (Handlebars && typeof Handlebars.registerHelper === 'function') {
        for (const prop in helpers) {
            Handlebars.registerHelper(prop, helpers[prop]);
        }
    } else {
        return helpers;
    }
};

export const helpers = register(null);

