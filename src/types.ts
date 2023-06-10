import { DateTime } from 'luxon'

export type SessionId = string & { readonly isSessionId: unique symbol }

export type Session<UserId, Meta> = {
  id: SessionId

  /**
   * A friendly label of the session.
   */
  label: string

  /**
   * The ID of the user that the session is associated with.
   */
  userId: UserId

  /**
   * The date and time when the session was last accessed.
   */
  lastUsedAt: DateTime

  /**
   * Additional metadata associated with the session.
   */
  meta: Meta
}

export interface ISessions<UserId, Meta = {}> {
  /**
   * Returns the ID of the authenticated user if there exists one for a given session.
   */
  getUserIdFromSession(session: SessionId | null): Promise<UserId | null>

  /**
   * Returns meta information associated with a given session.
   */
  getSessionMeta(session: SessionId | null): Promise<Meta | null>

  /**
   * Returns all sessions associated a given user.
   */
  getSessionsForUser(id: UserId): Promise<Session<UserId, Meta>[]>

  /**
   * Creates a new session for a given user and returns the session identifier.
   */
  createSession(input: { userId: UserId; label: string; meta: Meta }): Promise<SessionId>

  /**
   * Destroys a session if there exists one.
   */
  destroySession(session: SessionId): Promise<void>

  /**
   * Lists all sessions in the system starting with the least recently accessed one.
   */
  listSessions(): Promise<Session<UserId, Meta>[]>
}
