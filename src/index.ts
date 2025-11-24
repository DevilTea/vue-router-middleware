import type { Router } from 'vue-router'
import type { Middleware } from './types'

export * from './types'

export async function handleMiddlewares(...[to, from]: Parameters<Parameters<Router['beforeEach']>[0]>) {
	// If the user is navigating to the same route, skip the middlewares
	if (to.fullPath === from.fullPath && to.name === from.name)
		return true

	// Early exit if no matched routes
	if (to.matched.length === 0)
		return true

	// Collect middlewares efficiently
	const middlewares: Middleware[] = []
	for (const matched of to.matched) {
		const middleware = matched.meta?.middleware
		if (middleware) {
			if (Array.isArray(middleware))
				middlewares.push(...middleware)
			else
				middlewares.push(middleware)
		}
	}

	// Early exit if no middlewares
	if (middlewares.length === 0)
		return true

	for (const middleware of middlewares) {
		const result = await middleware(to, from)
		const shouldContinue = result === true || result == null

		if (shouldContinue)
			continue

		return result
	}

	return true
}

export function defineMiddleware(middleware: Middleware) {
	return middleware
}
