# Sessions

> Sessions contains a set of different session management classes.

Each sessions variant implements a general `ISessions` interface and may be swapped in as a replacement for any existing sessions provider.

## Quick Start

> NOTE: Examples below use `trpc` and `fastify`, but the API is completely framework agnostic and should be easy to port to any other server framework.

````ts

type SessionMeta = {
	// anything that's serializable
}

// InMemorySessions (best for local development).
const sessions = new InMemorySessions<string, SessionMeta>()

import { RedisClientType, createClient } from 'redis'

// RedisSessions (best for production environment).
const redis: RedisClientType = createClient({
  socket: {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    host: process.env.REDIS_HOST!,
    port: 6379,
  },
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  password: process.env.REDIS_PASSWORD!,
})

const sessions = new RedisSessions<string, SessionMeta>({ redis })


export type Context = {
	/**
	 * The session ID of the authenticated user if there exists one.
	 */
  session: SessionId | null

  /**
   * Access to session related services.
   */
  sessions: ISessions<string, SessionMeta>
}


// Create a context with a shared sessions instance.
await server.register(fastifyTRPCPlugin, {
	prefix: '/trpc',
	logLevel: 'debug',
	trpcOptions: {
		router: root,
		createContext: ({ req, res }: CreateFastifyContextOptions): Context => {
			const session = SessionUtils.getSessionIdFromAuthToken(req.headers.authorization)

			return { sessions, session }
		},
	},
})

// Getting session from request header.
const session = SessionUtils.getSessionIdFromAuthToken(req.headers.authorization)

const userId = await ctx.sessions.getUserIdFromSession(session)
const meta = await ctx.sessions.getSessionMeta(session)

// Creating sessions and getting tokens.
const session = await ctx.sessions.createSession({
	userId: user.id,
	label: input.label,
	meta: {},
})
const token = SessionUtils.getAuthTokenForSessionId(session)

// Destroying sesssions.
await ctx.sessions.destroySession(ctx.session)

// Listing sessions of a given user.
const userId = await ctx.sessions.getUserIdFromSession(session)
const allUserSessions = await ctx.sessions.getSessionsForUser(userId)

// Listing all sessions in the system.
const allExistingSessions = await sessions.listSessions()
```

### License

MIT @ Matic Zavadlal
````
