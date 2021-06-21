/*
 * @adonisjs/lucid-slugify
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'path'
import dotenv from 'dotenv'
import { Filesystem } from '@poppinss/dev-utils'
import { Application } from '@adonisjs/core/build/standalone'
import { ConnectionConfig, DatabaseContract } from '@ioc:Adonis/Lucid/Database'

dotenv.config()
export const fs = new Filesystem(join(__dirname, '__app'))

/**
 * Returns config based upon DB set in environment variables
 */
export function getConfig(): ConnectionConfig {
  switch (process.env.DB) {
    case 'sqlite':
      return {
        client: 'sqlite',
        connection: {
          filename: join(fs.basePath, 'db.sqlite'),
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
 * Setup the application
 */
export async function setupApplication(
  additionalProviders?: string[],
  environment: 'web' | 'repl' | 'test' = 'test'
) {
  await fs.add('.env', '')
  await fs.add(
    'config/app.ts',
    `
    export const appKey = 'averylong32charsrandomsecretkey',
    export const http = {
      cookie: {},
      trustProxy: () => true,
    }
  `
  )

  await fs.add(
    'config/database.ts',
    `const databaseConfig = {
      connection: 'primary',
      connections: {
        primary: ${JSON.stringify(getConfig())}
      }
    }
    export default databaseConfig`
  )

  const app = new Application(fs.basePath, environment, {
    aliases: {
      App: './app',
    },
    providers: ['@adonisjs/core', '@adonisjs/lucid'].concat(additionalProviders || []),
  })

  await app.setup()
  await app.registerProviders()
  await app.bootProviders()
  return app
}

/**
 * Setup database initial state for testing
 */
export async function setupDb(db: DatabaseContract) {
  const hasPostsTable = await db.connection().schema.hasTable('posts')
  if (!hasPostsTable) {
    await db.connection().schema.createTable('posts', (table) => {
      table.increments()
      table.string('title').nullable()
      table.string('slug').nullable()
    })
  }
}

/**
 * Cleandb database post testing
 */
export async function cleanDb(_db: DatabaseContract) {
  // await db.connection().schema.dropTableIfExists('posts')
}

/**
 * Cleardb database post testing
 */
export async function clearDb(db: DatabaseContract) {
  await db.connection().truncate('posts', true)
}
