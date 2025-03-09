/*
 * @adonisjs/lucid
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'node:path'
import { test } from '@japa/runner'
import { Env } from '@adonisjs/core/env'
import { fileURLToPath } from 'node:url'
import { Database } from '@adonisjs/lucid/database'
import { AppFactory } from '@adonisjs/core/factories/app'
import { EmitterFactory } from '@adonisjs/core/factories/events'
import { LoggerFactory } from '@adonisjs/core/factories/logger'
import type { ConnectionConfig, QueryClientContract } from '@adonisjs/lucid/types/database'

await Env.create(new URL('../', import.meta.url), {})

export const APP_ROOT = new URL('./tmp', import.meta.url)
export const SQLITE_BASE_PATH = fileURLToPath(APP_ROOT)

const logger = new LoggerFactory().create()
const app = new AppFactory().create(APP_ROOT)
const emitter = new EmitterFactory().create(app)
export const db = new Database(
  {
    connection: 'primary',
    connections: {
      primary: getConnectionConfig(),
    },
  },
  logger,
  emitter
)

/**
 * Returns the config for constructing a new connection based
 * upon the "process.env.DB" value.
 */
export function getConnectionConfig<T extends 'pg' | 'sqlite' | 'mysql' | 'legacy_mysql' | 'mssql'>(
  client: T | undefined = process.env.DB as T
): ConnectionConfig {
  switch (client) {
    case 'sqlite' as const:
      return {
        client: 'better-sqlite3',
        connection: {
          filename: join(SQLITE_BASE_PATH, 'better-sqlite-db.sqlite'),
        },
        asyncStackTraces: true,
        useNullAsDefault: true,
        debug: !!process.env.DEBUG,
      }
    case 'mysql':
      return {
        client: 'mysql2' as const,
        connection: {
          host: process.env.MYSQL_HOST as string,
          port: Number(process.env.MYSQL_PORT),
          database: process.env.MYSQL_DATABASE as string,
          user: process.env.MYSQL_USER as string,
          password: process.env.MYSQL_PASSWORD as string,
        },
        asyncStackTraces: true,
        debug: !!process.env.DEBUG,
      }
    case 'legacy_mysql':
      return {
        client: 'mysql2' as const,
        version: '5.7',
        connection: {
          host: process.env.LEGACY_MYSQL_HOST as string,
          port: Number(process.env.LEGACY_MYSQL_PORT),
          database: process.env.LEGACY_MYSQL_DATABASE as string,
          user: process.env.LEGACY_MYSQL_USER as string,
          password: process.env.LEGACY_MYSQL_PASSWORD as string,
        },
        asyncStackTraces: true,
        debug: !!process.env.DEBUG,
      }
    case 'pg':
      return {
        client: 'pg' as const,
        connection: {
          host: process.env.PG_HOST as string,
          port: Number(process.env.PG_PORT),
          database: process.env.PG_DATABASE as string,
          user: process.env.PG_USER as string,
          password: process.env.PG_PASSWORD as string,
        },
        asyncStackTraces: true,
        debug: !!process.env.DEBUG,
      }
    case 'mssql':
      return {
        client: 'mssql' as const,
        connection: {
          server: process.env.MSSQL_HOST as string,
          port: Number(process.env.MSSQL_PORT! as string),
          user: process.env.MSSQL_USER as string,
          password: process.env.MSSQL_PASSWORD as string,
          database: 'master',
          options: {
            enableArithAbort: true,
          },
        },
        asyncStackTraces: true,
        debug: !!process.env.DEBUG,
      }
    default:
      throw new Error(`Config not defined by the ${client} client`)
  }
}

/**
 * Prepares tables for testing.
 */
export const dbSetup = test.macro(async (t, client: QueryClientContract) => {
  async function cleanup() {
    await client.schema.dropTableIfExists('posts')
    await client.schema.dropTableIfExists('articles')
    await client.schema.dropTableIfExists('products')
  }

  t.cleanup(cleanup)
  await cleanup()

  /**
   * Creating neccessary tables
   */
  await client.schema.createTable('posts', (table) => {
    table.increments()
    table.string('title')
    table.string('slug').unique()
  })

  await client.schema.createTable('articles', (table) => {
    table.increments()
    table.string('title')
    table.string('slug').unique()
  })

  await client.schema.createTable('products', (table) => {
    table.increments()
    table.string('handle')
    table.string('slug').unique()
  })
})

/**
 * Prepares tables for testing.
 */
export const seed = test.macro(async (t, client: QueryClientContract) => {
  async function cleanup() {
    await client.truncate('posts')
  }

  t.cleanup(cleanup)
  await cleanup()

  /**
   * Creating neccessary tables
   */
  await client.table('posts').insert([
    {
      title: 'Hello world',
      slug: 'hello-world',
    },
    {
      title: 'Hello world',
      slug: 'hello-world-5',
    },
    {
      title: 'Hello world',
      slug: 'hello10world',
    },
    {
      title: 'Hello world',
      slug: 'hello-10-world',
    },
    {
      title: 'Introduction to social auth',
      slug: 'introduction-to-social-auth',
    },
    {
      title: 'Introduction to social auth',
      slug: 'introduction-to-social-auth-4',
    },
    {
      title: 'Hello world',
      slug: 'hello-world-2',
    },
    {
      title: 'Hello world fanny',
      slug: 'hello-world-fanny',
    },
    {
      title: 'Hello world',
      slug: 'post-hello-world',
    },
    {
      title: 'Hello world',
      slug: 'post-11am-hello-world11',
    },
    {
      title: 'Hello world',
      slug: 'post-11am-hello-world',
    },
    {
      title: 'Introduction to social auth',
      slug: 'introdUction-to-Social-auTH-1',
    },
  ])
})
