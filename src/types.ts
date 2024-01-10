import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'

type MaybeArray<T> = T | T[]

type MaybePromise<T> = T | Promise<T>

export type Middleware = (to: RouteLocationNormalized, from: RouteLocationNormalized) => MaybePromise<void | RouteLocationRaw | boolean>

declare module 'vue-router' {
	interface RouteMeta {
		middleware?: MaybeArray<Middleware>
	}
}
