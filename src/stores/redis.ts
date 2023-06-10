import * as crypto from 'crypto'
import { DateTime } from 'luxon'
import { RedisClientType } from 'redis'

import { Session, SessionId, ISessions } from '../types'

/**
 * Key containing all active session identifiers.
 */
const SESSIONS_KEY = 'auth.sessions'

/**
 * Prefix added to session identifier key.
 */
const SESSION_PREFIX = 'auth.session:'

/**
 * Utility class that manages user sessions in Redis database.
 */
export class RedisSessions<UserId extends string = string, Meta = {}> implements ISessions<UserId, Meta> {
  private _redis: RedisClientType

  constructor({ redis }: { redis: RedisClientType }) {
    this._redis = redis
  }

  private async _ensureConnected(): Promise<void> {
    if (this._redis.isReady) {
      return
    }
    await this._redis.connect()
  }

  public async getUserIdFromSession(sessionId: SessionId | null): Promise<UserId | null> {
    if (sessionId == null) {
      return null
    }

    await this._ensureConnected()

    const userId = await this._redis.HGET(sessionId, 'user')
    if (!userId) {
      return null
    }

    await this._redis.HSET(sessionId, 'lastUsedAt', DateTime.utc().toISO())

    return userId as UserId
  }

  public async getSessionMeta(sessionId: SessionId | null): Promise<Meta | null> {
    if (sessionId == null) {
      return null
    }

    await this._ensureConnected()

    const meta = await this._redis.HGET(sessionId, 'meta')
    if (!meta) {
      return null
    }

    await this._redis.HSET(sessionId, 'lastUsedAt', DateTime.utc().toISO())

    return JSON.parse(meta) as Meta
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

    await this._ensureConnected()

    // https://redis.io/commands/hset/
    await this._redis.HSET(sessionId, [
      // NOTE: Make sure that keys match the ones below in `destroySession`!
      'user',
      userId,
      'label',
      label,
      'lastUsedAt',
      DateTime.utc().toISO(),
      'meta',
      JSON.stringify(meta),
    ])

    await this._redis.SADD(SESSIONS_KEY, sessionId)

    return sessionId
  }

  public async destroySession(sessionId: SessionId): Promise<void> {
    await this._ensureConnected()

    // NOTE: Make sure to delete all keys in the session hash!
    await this._redis.HDEL(sessionId, ['user', 'label', 'lastUsedAt', 'meta'])
    await this._redis.SREM(SESSIONS_KEY, sessionId)
  }

  /**
   * List of all sessions belonging to the user with a given id.
   */
  public async getSessionsForUser(userId: UserId): Promise<Session<UserId, Meta>[]> {
    await this._ensureConnected()

    const allSessions: Session<UserId, Meta>[] = await this.listSessions()
    const userSessions = allSessions.filter((session) => session.userId === userId)

    return userSessions
  }

  public async listSessions(): Promise<Session<UserId, Meta>[]> {
    await this._ensureConnected()

    const sessionIds = await this._redis.SMEMBERS(SESSIONS_KEY)
    const sessions: Session<UserId, Meta>[] = []

    for (const sessionId of sessionIds) {
      const session = await this._redis.HGETALL(sessionId)
      if (!session || !session['user']) {
        continue
      }

      sessions.push({
        id: sessionId as SessionId,
        userId: session.user as UserId,
        label: session.label,
        lastUsedAt: DateTime.fromISO(session.lastUsedAt),
        meta: JSON.parse(session.meta) as Meta,
      })
    }

    return sessions.sort((a, b) => b.lastUsedAt.toMillis() - a.lastUsedAt.toMillis())
  }

  /**
   * Returns a unique session id.
   */
  private getSessionId(): SessionId {
    const rand = crypto.randomBytes(16).toString('hex')
    return `${SESSION_PREFIX}${rand}` as SessionId
  }
}
