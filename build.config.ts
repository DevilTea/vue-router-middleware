import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
	entries: [
		'src/index',
	],
	declaration: true,
	clean: true,
	rollup: {
		emitCJS: true,
		dts: {
			tsconfig: './tsconfig.lib.json',
		},
	},
})
