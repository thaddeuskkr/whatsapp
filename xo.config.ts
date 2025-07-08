import { type FlatXoConfig } from 'xo';

const xoConfig: FlatXoConfig = [{
	rules: {
		'capitalized-comments': ['off'],
		'new-cap': ['off'],
		'@stylistic/object-curly-spacing': ['off'],
		'@typescript-eslint/naming-convention': ['off'],
		'@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
	},
}];

export default xoConfig;
