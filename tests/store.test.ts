import { InMemorySessions } from '../src/stores/inmemory'
import { SessionUtils } from '../src/utils'
import { filter } from './utils'

describe('inmemory', () => {
  test('correctly finds user from a given session id', async () => {
    const sessions = new InMemorySessions<string, {}>()

    const validSessionId = await sessions.createSession({
      userId: 'user-id',
      label: 'test',
      meta: {},
    })

    await expect(sessions.getUserIdFromSession(validSessionId)).resolves.not.toBeNull()

    const invalidSessionId = SessionUtils.toSessionId('invalid-session-id')

    await expect(sessions.getUserIdFromSession(invalidSessionId)).resolves.toBeNull()
  })

  test('correctly parses userId from a given session id', async () => {
    const sessions = new InMemorySessions<string, {}>()

    const userId = 'user-id'
    const sessionId = await sessions.createSession({
      userId,
      label: 'test',
      meta: {},
    })

    await expect(sessions.getUserIdFromSession(sessionId)).resolves.toEqual(userId)
  })

  test('correctly parses meta from a given session id', async () => {
    // NOTE: We want to test all serializable types here.

    const sessions = new InMemorySessions<
      string,
      {
        string: string
        number: number
        boolean: boolean
        array: string[]
        object: { [key: string]: string }
      }
    >()

    const meta = {
      string: 'string',
      number: 1,
      boolean: true,
      array: ['string', 'string'],
      object: {
        string: 'string',
      },
    }

    const sessionId = await sessions.createSession({
      userId: 'user-id',
      label: 'test',
      meta,
    })

    await expect(sessions.getSessionMeta(sessionId)).resolves.toEqual(meta)
  })

  test('correctly destroys a session', async () => {
    const sessions = new InMemorySessions<string, {}>()

    const sessionId = await sessions.createSession({
      userId: 'user-id',
      label: 'test',
      meta: {},
    })

    await sessions.destroySession(sessionId)

    await expect(sessions.getUserIdFromSession(sessionId)).resolves.toBeNull()
  })

  test('correctly lists all sessions', async () => {
    const sessions = new InMemorySessions<string, {}>()

    await sessions.createSession({ userId: 'user-id', label: '#1', meta: {} })
    await sessions.createSession({ userId: 'user-id', label: '#2', meta: {} })
    await sessions.createSession({ userId: 'user-id', label: '#3', meta: {} })

    await expect(
      // We filter out random values and dates.
      sessions.listSessions().then((r) => r.map((o) => filter(o, ['label', 'userId']))),
    ).resolves.toMatchInlineSnapshot(`
      [
        {
          "label": "#1",
          "userId": "user-id",
        },
        {
          "label": "#2",
          "userId": "user-id",
        },
        {
          "label": "#3",
          "userId": "user-id",
        },
      ]
    `)
  })

  test('correclty lists sessions for a given user', async () => {
    const sessions = new InMemorySessions<string, {}>()

    const userId = 'user-id'

    await sessions.createSession({ userId, label: '#1', meta: {} })
    await sessions.createSession({ userId, label: '#2', meta: {} })
    await sessions.createSession({ userId, label: '#3', meta: {} })

    const otherUserId = 'other-user-id'
    await sessions.createSession({ userId: otherUserId, label: '#1', meta: {} })
    await sessions.createSession({ userId: otherUserId, label: '#2', meta: {} })

    await expect(
      // We filter out random values and dates.
      sessions.getSessionsForUser(userId).then((r) => r.map((o) => filter(o, ['label', 'userId']))),
    ).resolves.toMatchInlineSnapshot(`
      [
        {
          "label": "#1",
          "userId": "user-id",
        },
        {
          "label": "#2",
          "userId": "user-id",
        },
        {
          "label": "#3",
          "userId": "user-id",
        },
      ]
    `)
  })
})
