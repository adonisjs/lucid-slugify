/*
 * @adonisjs/lucid-slugify
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import dotenv from 'dotenv'
import { join } from 'node:path'
import { getActiveTest } from '@japa/runner'
import { Emitter } from '@adonisjs/core/events'
import { BaseModel } from '@adonisjs/lucid/orm'
import { Database } from '@adonisjs/lucid/database'
import { AppFactory } from '@adonisjs/core/factories/app'
import { LoggerFactory } from '@adonisjs/core/factories/logger'
import { ConnectionConfig } from '@adonisjs/lucid/types/database'

dotenv.config()

/**
 * Returns config based upon DB set in environment variables
 */
export function getConfig(basePath: string): ConnectionConfig {
  switch (process.env.DB) {
    case 'sqlite':
      return {
        client: 'sqlite',
        connection: {
          filename: join(basePath, 'db.sqlite'),
        },
        useNullAsDefault: true,
        debug: false,
      }
    case 'mysql':
      return {
        client: 'mysql',
        connection: {
          host: process.env.MYSQL_HOST as string,
          port: Number(process.env.MYSQL_PORT),
          database: process.env.DB_NAME as string,
          user: process.env.MYSQL_USER as string,
          password: process.env.MYSQL_PASSWORD as string,
        },
        useNullAsDefault: true,
      }
    case 'mysql_legacy':
      return {
        client: 'mysql',
        version: '5.7',
        connection: {
          host: process.env.MYSQL_LEGACY_HOST as string,
          port: Number(process.env.MYSQL_LEGACY_PORT),
          database: process.env.DB_NAME as string,
          user: process.env.MYSQL_LEGACY_USER as string,
          password: process.env.MYSQL_LEGACY_PASSWORD as string,
        },
        useNullAsDefault: true,
      }
    case 'pg':
      return {
        client: 'pg',
        connection: {
          host: process.env.PG_HOST as string,
          port: Number(process.env.PG_PORT),
          database: process.env.DB_NAME as string,
          user: process.env.PG_USER as string,
          password: process.env.PG_PASSWORD as string,
        },
        useNullAsDefault: true,
      }
    case 'mssql':
      return {
        client: 'mssql',
        connection: {
          user: process.env.MSSQL_USER as string,
          server: process.env.MSSQL_SERVER as string,
          password: process.env.MSSQL_PASSWORD as string,
          database: 'master',
          options: {
            enableArithAbort: true,
          },
        },
        debug: true,
        pool: {
          min: 0,
          idleTimeoutMillis: 300,
        },
      }
    default:
      throw new Error(`Missing test config for ${process.env.DB} connection`)
  }
}

/**
 * Setup database initial state for testing
 */
export async function setupDb(db: Database) {
  const test = getActiveTest()!

  await test.context.fs.mkdir('config')

  const hasPostsTable = await db.connection().schema.hasTable('posts')
  if (!hasPostsTable) {
    await db.connection().schema.createTable('posts', (table) => {
      table.increments()
      table.string('title').nullable()
      table.string('slug').nullable()
    })
  }

  test.cleanup(async () => {
    await db.connection().schema.dropTableIfExists('posts')
  })
}

/**
 * Clean database post testing
 */
export async function cleanDb(db: Database) {
  await db.connection().schema.dropTableIfExists('posts')
}

/**
 * Clear database post testing
 */
export async function clearDb(db: Database) {
  await db.connection().truncate('posts', true)
}

/**
 * Create Database instance for testing
 */
export function createDatabase() {
  const test = getActiveTest()
  if (!test) {
    throw new Error('Cannot use "createDatabase" outside of a Japa test')
  }

  const app = new AppFactory().create(test.context.fs.baseUrl, () => {})
  const logger = new LoggerFactory().create()
  const emitter = new Emitter(app)
  const db = new Database(
    {
      connection: 'primary',
      connections: {
        primary: getConfig(test.context.fs.basePath),
      },
    },
    logger,
    emitter
  )

  test.cleanup(() => db.manager.closeAll())
  BaseModel.$adapter = db.modelAdapter()
  return db
}
