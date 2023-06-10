import { SessionId } from './types'

export namespace SessionUtils {
  /**
   * Returns a session ID from an HTTP Authorization header if the header contains it.
   *
   * NOTE: If the token contains also the "Bearer " prefix, it will be stripped.
   */
  export function getSessionIdFromAuthToken(header?: string): SessionId | null {
    if (!header) {
      return null
    }

    const raw = header.replace('Bearer ', '')
    return raw as SessionId
  }

  /**
   * Returns the HTTP Authorization header that should be used to associate a given session.
   */
  export function getAuthTokenForSessionId(sessionId: SessionId): string {
    return sessionId as string
  }

  /**
   * Returns a Session identifier from the raw string.
   */
  export function toSessionId(raw: string): SessionId {
    return raw as SessionId
  }
}
