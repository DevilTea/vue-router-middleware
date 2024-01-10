# @deviltea/vue-router-middleware

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![License][license-src]][license-href]

A simple router middleware system implemented by beforeEach guard.

## Install

```bash
npm install @deviltea/vue-router-middleware
```

## Usage

```ts
import { createRouter, createWebHistory } from 'vue-router'
import { createHandleMiddlewares, defineMiddleware } from '@deviltea/vue-router-middleware'

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/',
			component: () => import('./views/Home.vue'),
			meta: {
				// The property "middleware" could be a function or an array of functions.
				middleware: defineMiddleware((to, from) => {
					// Do something
					// Like a "beforeEnter" guard, if return false, the navigation will be aborted.
					// If return another route, the navigation will be redirected to the route.
					// If return nothing or true, it will continue to the next middleware.
					// All of the things above work the same way with async functions and Promises.
				})
			}
		},
		// Example of using an array of functions.
		{
			path: '/',
			component: () => import('./views/Home.vue'),
			meta: {
				middleware: [
					middleware1,
					middleware2,
					middleware3
				]
			}
		}
	]
})

router.beforeEach(createHandleMiddlewares())
```

## License

[MIT](./LICENSE) License © 2023-PRESENT [DevilTea](https://github.com/DevilTea)


<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/@deviltea/vue-router-middleware?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/@deviltea/vue-router-middleware
[npm-downloads-src]: https://img.shields.io/npm/dm/@deviltea/vue-router-middleware?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/@deviltea/vue-router-middleware
[bundle-src]: https://img.shields.io/bundlephobia/minzip/@deviltea/vue-router-middleware?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=@deviltea/vue-router-middleware
[license-src]: https://img.shields.io/github/license/DevilTea/vue-router-middleware.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/DevilTea/vue-router-middleware/blob/main/LICENSE
