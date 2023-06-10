import * as crypto from 'crypto'
import { DateTime } from 'luxon'

import { Session, SessionId, ISessions } from './types'

/**
 * Utility class that manages user sessions in memory.
 */
export class InMemorySessions<UserId = string, Meta = {}> implements ISessions<UserId, Meta> {
  private sessions: Map<SessionId, Session<UserId, Meta>> = new Map()

  public async getUserIdFromSession(sessionId: SessionId | null): Promise<UserId | null> {
    if (sessionId == null) {
      return null
    }

    const session = this.sessions.get(sessionId)
    if (!session) {
      return null
    }

    session.lastUsedAt = DateTime.utc()
    return session.userId
  }

  public async getSessionMeta(sessionId: SessionId | null): Promise<Meta | null> {
    if (sessionId == null) {
      return null
    }

    const session = this.sessions.get(sessionId)
    if (!session) {
      return null
    }

    session.lastUsedAt = DateTime.utc()
    return session.meta
  }

  public async createSession({
    userId,
    label,
    meta,
  }: {
    userId: UserId
    label: string
    meta: Meta
  }): Promise<SessionId> {
    const sessionId = this.getSessionId()
    this.sessions.set(sessionId, {
      id: sessionId,
      label,
      userId,
      lastUsedAt: DateTime.utc(),
      meta,
    })
    return sessionId
  }

  public async destroySession(session: SessionId): Promise<void> {
    this.sessions.delete(session)
  }

  /**
   * List of all sessions belonging to the user with a given id.
   */
  public async getSessionsForUser(userId: UserId): Promise<Session<UserId, Meta>[]> {
    const sessions: Session<UserId, Meta>[] = []

    this.sessions.forEach((session) => {
      if (session.userId === userId) {
        sessions.push(session)
      }
    })

    return sessions
  }

  public async listSessions(): Promise<Session<UserId, Meta>[]> {
    return Array.from(this.sessions.values())
  }

  private getSessionId(): SessionId {
    const raw = crypto.randomBytes(16).toString('hex')
    return raw as SessionId
  }
}
