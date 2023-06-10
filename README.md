# authsessions

> authsessions contains a set of different framework-agnostic session management classes.

Each sessions variant implements a general `ISessions` interface and may be swapped in as a replacement for any existing sessions provider.

- `InMemorySessions`
- `RedisSessions`

> All sessions are easily replacable! All of them work the same, and only have different persistance settings.

You can learn more about Protocol Oriented Programming in [this great WWDC talk](https://developer.apple.com/videos/play/wwdc2015/408/).

#### Installing

```sh
npm i authsessions

pnpm i authsessions

yarn add authsessions
```

## Quick Start

> NOTE: Examples below use `trpc` and `fastify`, but the API is completely framework agnostic and should be easy to port to any other server framework.

#### Defining Types

```ts
type SessionId = number
type SessionMeta = {
  // anything that's serializable
}
```

#### Creating Session Stores

```ts
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
```

#### Creating Context

By creating a context, you let the routes in your GraphQL or REST server access the same store.

> I usually incldue the parsed session information in the context as well, so that I don't need to repeat it in each route separately.

```ts
export type Context = {
  session: SessionId | null

  // NOTE: We use a generic interface. This way, we can replace the implementation depending on our needs.
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
```

#### Manipulating Sessions

```ts
// Getting session from request header.
const session = SessionUtils.getSessionIdFromAuthToken(req.headers.authorization)

// Getting Session Information
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

```

```
