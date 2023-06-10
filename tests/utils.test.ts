import { SessionUtils } from '../src/utils'

describe('utils', () => {
  test('correctly parses and formats session auth token', () => {
    const random = Math.random().toString(16)
    const sessionId = SessionUtils.toSessionId(random)

    const authToken = SessionUtils.getAuthTokenForSessionId(sessionId)
    const parsedSessionId = SessionUtils.getSessionIdFromAuthToken(authToken)

    expect(parsedSessionId).toEqual(sessionId)
  })
})
