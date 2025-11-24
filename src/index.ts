import type { Router } from 'vue-router'
import type { Middleware } from './types'

export * from './types'

export async function handleMiddlewares(...[to, from]: Parameters<Parameters<Router['beforeEach']>[0]>) {
	// If the user is navigating to the same route, skip the middlewares
	// Check path, query, params, and name - but not hash (hash is typically for scroll position)
	const isSamePath = to.path === from.path
	const isSameName = to.name === from.name
	const isSameQuery = JSON.stringify(to.query) === JSON.stringify(from.query)
	const isSameParams = JSON.stringify(to.params) === JSON.stringify(from.params)

	if (isSamePath && isSameName && isSameQuery && isSameParams)
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
