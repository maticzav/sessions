import { RedisClientType, createClient } from 'redis'

// RedisSessions (best for production environment).
const redis: RedisClientType = createClient({
  socket: {
    host: 'localhost',
    port: 6379,
  },
  password: 'redis',
})

import { InMemorySessions } from '../src/stores/inmemory'
import { RedisSessions } from '../src/stores/redis'
import { ISessions } from '../src/types'

import { SessionUtils } from '../src/utils'
import { filter } from './utils'

type SessionId = string
type Meta =
  | {
      string: string
      number: number
      boolean: boolean
      array: string[]
      object: { [key: string]: string }
    }
  | {}

const STORES: { label: string; sessions: () => Promise<ISessions<SessionId, Meta>>; cleanup: () => Promise<void> }[] = [
  { label: 'inmemory', sessions: async () => new InMemorySessions<SessionId, Meta>(), cleanup: async () => {} },
  {
    label: 'redis',
    sessions: async () => {
      if (!redis.isReady) {
        await redis.connect()
      }

      await redis.flushDb()
      return new RedisSessions<SessionId, Meta>({ redis })
    },
    cleanup: async () => {
      await redis.flushDb()
      await redis.quit()
    },
  },
]

for (const { label, sessions, cleanup } of STORES) {
  describe(`${label} store`, () => {
    let store: ISessions<SessionId, Meta>

    beforeEach(async () => {
      store = await sessions()
    })

    afterAll(async () => {
      await cleanup()
    })

    test('correctly finds user from a given session id', async () => {
      const validSessionId = await store.createSession({
        userId: 'user-id',
        label: 'test',
        meta: {},
      })

      await expect(store.getUserIdFromSession(validSessionId)).resolves.not.toBeNull()

      const invalidSessionId = SessionUtils.toSessionId('invalid-session-id')

      await expect(store.getUserIdFromSession(invalidSessionId)).resolves.toBeNull()
    })

    test('correctly parses userId from a given session id', async () => {
      const userId = 'user-id'
      const sessionId = await store.createSession({
        userId,
        label: 'test',
        meta: {},
      })

      await expect(store.getUserIdFromSession(sessionId)).resolves.toEqual(userId)
    })

    test('correctly parses meta from a given session id', async () => {
      const meta = {
        string: 'string',
        number: 1,
        boolean: true,
        array: ['string', 'string'],
        object: {
          string: 'string',
        },
      }

      const sessionId = await store.createSession({
        userId: 'user-id',
        label: 'test',
        meta,
      })

      await expect(store.getSessionMeta(sessionId)).resolves.toEqual(meta)
    })

    test('correctly destroys a session', async () => {
      const sessionId = await store.createSession({
        userId: 'user-id',
        label: 'test',
        meta: {},
      })

      await store.destroySession(sessionId)

      await expect(store.getUserIdFromSession(sessionId)).resolves.toBeNull()
    })

    test('correctly lists all sessions', async () => {
      await store.createSession({ userId: 'user-id', label: '#1', meta: {} })
      await store.createSession({ userId: 'user-id', label: '#2', meta: {} })
      await store.createSession({ userId: 'user-id', label: '#3', meta: {} })

      await expect(
        // We filter out random values and dates.
        store.listSessions().then((r) => r.map((o) => filter(o, ['label', 'userId']))),
      ).resolves.toEqual([
        {
          label: '#3',
          userId: 'user-id',
        },
        {
          label: '#2',
          userId: 'user-id',
        },
        {
          label: '#1',
          userId: 'user-id',
        },
      ])
    })

    test('correclty lists sessions for a given user', async () => {
      const userId = 'user-id'

      await store.createSession({ userId, label: '#1', meta: {} })
      await store.createSession({ userId, label: '#2', meta: {} })
      await store.createSession({ userId, label: '#3', meta: {} })

      const otherUserId = 'other-user-id'
      await store.createSession({ userId: otherUserId, label: '#1', meta: {} })
      await store.createSession({ userId: otherUserId, label: '#2', meta: {} })

      await expect(
        // We filter out random values and dates.
        store.getSessionsForUser(userId).then((r) => r.map((o) => filter(o, ['label', 'userId']))),
      ).resolves.toEqual([
        {
          label: '#3',
          userId: 'user-id',
        },
        {
          label: '#2',
          userId: 'user-id',
        },
        {
          label: '#1',
          userId: 'user-id',
        },
      ])
    })
  })
}
