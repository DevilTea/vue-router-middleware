import type { RouteLocationNormalized } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import { defineMiddleware, handleMiddlewares } from '../src/index'

describe('defineMiddleware', () => {
	it('should return the middleware function as-is', () => {
		const middleware = vi.fn()
		const result = defineMiddleware(middleware)
		expect(result).toBe(middleware)
	})
})

describe('handleMiddlewares', () => {
	const createRoute = (
		path: string,
		name: string,
		middlewares: any[] = [],
		options: {
			hash?: string
			query?: Record<string, any>
			params?: Record<string, any>
		} = {},
	): RouteLocationNormalized => {
		const { hash = '', query = {}, params = {} } = options
		const queryStr = Object.keys(query).length > 0 ? `?${new URLSearchParams(query).toString()}` : ''
		const fullPath = `${path}${queryStr}${hash}`

		return {
			fullPath,
			path,
			name,
			matched: middlewares.length > 0
				? [{ meta: { middleware: middlewares } } as any]
				: [],
			meta: {},
			params,
			query,
			hash,
			redirectedFrom: undefined,
		}
	}

	it('should return true when navigating to the same route', async () => {
		const to = createRoute('/home', 'home')
		const from = createRoute('/home', 'home')
		const result = await handleMiddlewares(to, from)
		expect(result).toBe(true)
	})

	it('should skip middlewares when only hash changes', async () => {
		const middleware = vi.fn().mockResolvedValue(true)
		const to = createRoute('/docs', 'docs', [middleware], { hash: '#api' })
		const from = createRoute('/docs', 'docs', [], { hash: '#intro' })
		const result = await handleMiddlewares(to, from)

		// Hash-only changes should skip middlewares (hash is for scroll position)
		expect(middleware).not.toHaveBeenCalled()
		expect(result).toBe(true)
	})

	it('should execute middlewares when only query changes', async () => {
		const middleware = vi.fn().mockResolvedValue(true)
		const to = createRoute('/search', 'search', [middleware], { query: { q: 'react' } })
		const from = createRoute('/search', 'search', [], { query: { q: 'vue' } })
		const result = await handleMiddlewares(to, from)

		// Middlewares should execute for query changes (correct behavior)
		expect(middleware).toHaveBeenCalledWith(to, from)
		expect(result).toBe(true)
	})

	it('should execute middlewares when query has different number of keys', async () => {
		const middleware = vi.fn().mockResolvedValue(true)
		const to = createRoute('/search', 'search', [middleware], { query: { q: 'react', page: '1' } })
		const from = createRoute('/search', 'search', [], { query: { q: 'react' } })
		const result = await handleMiddlewares(to, from)

		// Different number of query keys should execute middlewares
		expect(middleware).toHaveBeenCalledWith(to, from)
		expect(result).toBe(true)
	})

	it('should return true when navigating to same route without name', async () => {
		const to = createRoute('/about', undefined as any)
		const from = createRoute('/about', undefined as any)
		const result = await handleMiddlewares(to, from)
		expect(result).toBe(true)
	})

	it('should execute middlewares when same fullPath but different name', async () => {
		const middleware = vi.fn().mockResolvedValue(true)
		const to = { ...createRoute('/admin', 'admin-new', [middleware]) }
		const from = { ...createRoute('/admin', 'admin-old') }
		const result = await handleMiddlewares(to, from)

		// Different route definitions should execute middlewares
		expect(middleware).toHaveBeenCalledWith(to, from)
		expect(result).toBe(true)
	})

	it('should return true when there are no middlewares', async () => {
		const to = createRoute('/about', 'about')
		const from = createRoute('/home', 'home')
		const result = await handleMiddlewares(to, from)
		expect(result).toBe(true)
	})

	it('should return true when there are no matched routes', async () => {
		const to = { ...createRoute('/404', '404'), matched: [] }
		const from = createRoute('/home', 'home')
		const result = await handleMiddlewares(to, from)
		expect(result).toBe(true)
	})

	it('should execute middleware and return true when middleware returns undefined', async () => {
		const middleware = vi.fn().mockResolvedValue(undefined)
		const to = createRoute('/about', 'about', [middleware])
		const from = createRoute('/home', 'home')
		const result = await handleMiddlewares(to, from)

		expect(middleware).toHaveBeenCalledWith(to, from)
		expect(result).toBe(true)
	})

	it('should execute middleware and return true when middleware returns true', async () => {
		const middleware = vi.fn().mockResolvedValue(true)
		const to = createRoute('/about', 'about', [middleware])
		const from = createRoute('/home', 'home')
		const result = await handleMiddlewares(to, from)

		expect(middleware).toHaveBeenCalledWith(to, from)
		expect(result).toBe(true)
	})

	it('should execute middleware and return false when middleware returns false', async () => {
		const middleware = vi.fn().mockResolvedValue(false)
		const to = createRoute('/about', 'about', [middleware])
		const from = createRoute('/home', 'home')
		const result = await handleMiddlewares(to, from)

		expect(middleware).toHaveBeenCalledWith(to, from)
		expect(result).toBe(false)
	})

	it('should execute middleware and return redirect route when middleware returns a route', async () => {
		const redirectRoute = { path: '/login' }
		const middleware = vi.fn().mockResolvedValue(redirectRoute)
		const to = createRoute('/about', 'about', [middleware])
		const from = createRoute('/home', 'home')
		const result = await handleMiddlewares(to, from)

		expect(middleware).toHaveBeenCalledWith(to, from)
		expect(result).toBe(redirectRoute)
	})

	it('should execute all middlewares in order when they all return true or undefined', async () => {
		const middleware1 = vi.fn().mockResolvedValue(true)
		const middleware2 = vi.fn().mockResolvedValue(undefined)
		const middleware3 = vi.fn().mockResolvedValue(true)

		const to = createRoute('/about', 'about', [middleware1, middleware2, middleware3])
		const from = createRoute('/home', 'home')
		const result = await handleMiddlewares(to, from)

		expect(middleware1).toHaveBeenCalledWith(to, from)
		expect(middleware2).toHaveBeenCalledWith(to, from)
		expect(middleware3).toHaveBeenCalledWith(to, from)
		expect(result).toBe(true)
	})

	it('should stop execution when middleware returns false', async () => {
		const middleware1 = vi.fn().mockResolvedValue(true)
		const middleware2 = vi.fn().mockResolvedValue(false)
		const middleware3 = vi.fn().mockResolvedValue(true)

		const to = createRoute('/about', 'about', [middleware1, middleware2, middleware3])
		const from = createRoute('/home', 'home')
		const result = await handleMiddlewares(to, from)

		expect(middleware1).toHaveBeenCalledWith(to, from)
		expect(middleware2).toHaveBeenCalledWith(to, from)
		expect(middleware3).not.toHaveBeenCalled()
		expect(result).toBe(false)
	})

	it('should stop execution when middleware returns a redirect route', async () => {
		const redirectRoute = { path: '/login' }
		const middleware1 = vi.fn().mockResolvedValue(true)
		const middleware2 = vi.fn().mockResolvedValue(redirectRoute)
		const middleware3 = vi.fn().mockResolvedValue(true)

		const to = createRoute('/about', 'about', [middleware1, middleware2, middleware3])
		const from = createRoute('/home', 'home')
		const result = await handleMiddlewares(to, from)

		expect(middleware1).toHaveBeenCalledWith(to, from)
		expect(middleware2).toHaveBeenCalledWith(to, from)
		expect(middleware3).not.toHaveBeenCalled()
		expect(result).toBe(redirectRoute)
	})

	it('should handle synchronous middlewares', async () => {
		const middleware = vi.fn().mockReturnValue(true)
		const to = createRoute('/about', 'about', [middleware])
		const from = createRoute('/home', 'home')
		const result = await handleMiddlewares(to, from)

		expect(middleware).toHaveBeenCalledWith(to, from)
		expect(result).toBe(true)
	})

	it('should return first redirect when middleware redirects', async () => {
		const redirectRoute = { path: '/login' }
		const middleware = vi.fn().mockResolvedValue(redirectRoute)

		const to = createRoute('/about', 'about', [middleware])
		const from = createRoute('/home', 'home')

		const result = await handleMiddlewares(to, from)
		expect(result).toBe(redirectRoute)
	})

	it('should handle middlewares defined as single function (not array)', async () => {
		const middleware = vi.fn().mockResolvedValue(true)
		const to = {
			...createRoute('/about', 'about'),
			matched: [{ meta: { middleware } } as any],
		}
		const from = createRoute('/home', 'home')
		const result = await handleMiddlewares(to, from)

		expect(middleware).toHaveBeenCalledWith(to, from)
		expect(result).toBe(true)
	})

	it('should handle route redirects with string paths', async () => {
		const middleware = vi.fn().mockResolvedValue('/login')
		const to = createRoute('/about', 'about', [middleware])
		const from = createRoute('/home', 'home')
		const result = await handleMiddlewares(to, from)

		expect(result).toBe('/login')
	})

	it('should handle route redirects with named routes', async () => {
		const redirectRoute = { name: 'login' }
		const middleware = vi.fn().mockResolvedValue(redirectRoute)
		const to = createRoute('/about', 'about', [middleware])
		const from = createRoute('/home', 'home')
		const result = await handleMiddlewares(to, from)

		expect(result).toBe(redirectRoute)
	})

	it('should handle route redirects with query and hash', async () => {
		const redirectRoute = { path: '/login', query: { redirect: '/about' }, hash: '#section' }
		const middleware = vi.fn().mockResolvedValue(redirectRoute)
		const to = createRoute('/about', 'about', [middleware])
		const from = createRoute('/home', 'home')
		const result = await handleMiddlewares(to, from)

		expect(result).toBe(redirectRoute)
	})

	it('should handle errors thrown in middleware', async () => {
		const error = new Error('Middleware error')
		const middleware = vi.fn().mockRejectedValue(error)
		const to = createRoute('/about', 'about', [middleware])
		const from = createRoute('/home', 'home')

		await expect(handleMiddlewares(to, from)).rejects.toThrow('Middleware error')
	})

	it('should handle multiple matched routes with different middlewares', async () => {
		const middleware1 = vi.fn().mockResolvedValue(true)
		const middleware2 = vi.fn().mockResolvedValue(true)

		const to = {
			...createRoute('/about/detail', 'about-detail'),
			matched: [
				{ meta: { middleware: middleware1 } } as any,
				{ meta: { middleware: middleware2 } } as any,
			],
		}
		const from = createRoute('/home', 'home')
		const result = await handleMiddlewares(to, from)

		expect(middleware1).toHaveBeenCalledWith(to, from)
		expect(middleware2).toHaveBeenCalledWith(to, from)
		expect(result).toBe(true)
	})

	it('should handle matched routes without middleware', async () => {
		const to = {
			...createRoute('/about', 'about'),
			matched: [{ meta: {} } as any],
		}
		const from = createRoute('/home', 'home')
		const result = await handleMiddlewares(to, from)

		expect(result).toBe(true)
	})

	it('should handle empty middleware array', async () => {
		const to = createRoute('/about', 'about', [])
		const from = createRoute('/home', 'home')
		const result = await handleMiddlewares(to, from)

		expect(result).toBe(true)
	})
})
