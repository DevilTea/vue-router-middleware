import type { Router } from 'vue-router'
import type { Middleware } from './types'

export * from './types'

export async function handleMiddlewares(...[to, from]: Parameters<Parameters<Router['beforeEach']>[0]>) {
	// If the user is navigating to the same route, skip the middlewares
	if (to.fullPath === from.fullPath)
		return true

	const middlewares = to.matched.flatMap(({ meta }) => meta?.middleware ?? [])

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
