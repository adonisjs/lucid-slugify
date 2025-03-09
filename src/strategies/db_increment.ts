/*
 * @adonisjs/lucid-slugify
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { LucidModel, LucidRow } from '@adonisjs/lucid/types/model'
import type { QueryClientContract } from '@adonisjs/lucid/types/database'

import debug from '../debug.js'
import { E_UNSUPPORTED_DB_DIALECT } from '../errors.js'
import type { SlugifyStrategyContract } from '../types.js'

/**
 * The DbIncrementStrategy creates unique slugs by querying the similar
 * existing slugs inside the database and appends a counter to them.
 * For example: If there is already a slug called "hello-world", then
 * another slug with the value will become "hello-world-1" and so on.
 */
export class DbIncrementStrategy implements SlugifyStrategyContract {
  #config: { separator: string }

  maxLengthBuffer: number = 3

  constructor(config: { separator?: string }) {
    this.#config = { separator: '-', ...config }
  }

  /**
   * Returns the counter from the rows fetched from the database by extracting
   * the counter from the slug value. We do it in JavaScript since certain
   * database dialects do not support Regular expressions.
   */
  #getCounter(slug: string, columnName: string, rows: Record<string, string>[]): number {
    /**
     * Extract counter from rows as an array of counters
     */
    const slugCounter = rows.reduce<number[]>((result, row) => {
      const tokens = row[columnName].toLowerCase().split(`${slug}${this.#config.separator}`)
      if (tokens.length === 2) {
        const counter = Number(tokens[1])
        if (!Number.isNaN(counter)) {
          result = result.concat(counter)
        }
      }
      return result
    }, [])

    return slugCounter.length ? Math.max(...slugCounter) : 0
  }

  /**
   * Makes the unique slug for the SQLite database
   */
  async #getSlugForSqlite(
    model: LucidModel,
    client: QueryClientContract,
    columnName: string,
    slugValue: string
  ): Promise<string> {
    const result = await client
      .modelQuery(model)
      .select(columnName)
      .whereRaw('lower(??) = ?', [columnName, slugValue])
      .orWhereRaw('lower(??) like ?', [columnName, `${slugValue}${this.#config.separator}%`])
      .pojo<Record<string, string>>()
      .exec()

    debug('sqlite: rows match slug "%s": %O', slugValue, result)

    if (!result.length) {
      return slugValue
    }

    const counter = this.#getCounter(slugValue, columnName, result)
    return `${slugValue}${this.#config.separator}${counter + 1}`
  }

  /**
   * Returns a unique slug for MYSQL >= 8.0 (aka 5.7)
   */
  async #getSlugForOldMysql(
    model: LucidModel,
    client: QueryClientContract,
    columnName: string,
    slugValue: string
  ) {
    const result = await client
      .modelQuery(model)
      .select(columnName)
      .where(columnName, slugValue)
      .orWhereRaw(`?? REGEXP ?`, [columnName, `^${slugValue}(${this.#config.separator}[0-9]*)?$`])
      .pojo<Record<string, string>>()
      .exec()

    debug('mysql 5.7: rows match slug "%s": %O', slugValue, result)
    if (!result.length) {
      return slugValue
    }

    const counter = this.#getCounter(slugValue, columnName, result)
    return `${slugValue}${this.#config.separator}${counter + 1}`
  }

  /**
   * Returns a unique slug for MYSQL >= 8.0
   */
  async #getSlugForMysql(
    model: LucidModel,
    client: QueryClientContract,
    columnName: string,
    slugValue: string
  ) {
    const result = await client
      .modelQuery(model)
      .select(
        client.raw(
          `CAST(REGEXP_SUBSTR(${columnName}, '[0-9]+$') AS UNSIGNED) as lucid_slugify_counter`
        )
      )
      .whereRaw(`?? REGEXP ?`, [columnName, `^${slugValue}(${this.#config.separator}[0-9]*)?$`])
      .orderBy('lucid_slugify_counter', 'desc')
      .pojo<{ lucid_slugify_counter: number }>()
      .exec()

    debug('mysql: matching slug counters "%s": %O', slugValue, result)

    if (!result.length) {
      return slugValue
    }

    const counter = result.find((row) => row.lucid_slugify_counter)?.lucid_slugify_counter ?? 0
    return `${slugValue}${this.#config.separator}${counter + 1}`
  }

  /**
   * Returns a unique slug for MSSQL.
   */
  async #getSlugForMssql(
    model: LucidModel,
    client: QueryClientContract,
    columnName: string,
    slugValue: string
  ) {
    const result = await client
      .modelQuery(model)
      .select(columnName)
      .where(columnName, slugValue)
      .orWhere(columnName, 'like', `${slugValue}${this.#config.separator}%`)
      .pojo<Record<string, string>>()
      .exec()

    debug('mssql 5.7: rows match slug "%s": %O', slugValue, result)
    if (!result.length) {
      return slugValue
    }

    const counter = this.#getCounter(slugValue, columnName, result)
    return `${slugValue}${this.#config.separator}${counter + 1}`
  }

  /**
   * Makes slug for PostgreSQL and RedShift both. Redshift is not tested and
   * assumed to be compatible with PostgreSQL.
   */
  async #getSlugForPg(
    model: LucidModel,
    client: QueryClientContract,
    columnName: string,
    slugValue: string
  ): Promise<string> {
    const result = await client
      .modelQuery(model)
      .select(
        client.raw(`SUBSTRING(${columnName} from '[0-9]+$')::INTEGER as lucid_slugify_counter`)
      )
      .whereRaw(`?? ~* ?`, [columnName, `^${slugValue}(${this.#config.separator}[0-9]*)?$`])
      .orderBy('lucid_slugify_counter', 'desc')
      .limit(2)
      .pojo<{ lucid_slugify_counter: number }>()
      .exec()

    debug('pg: matching slug counters "%s": %O', slugValue, result)

    if (!result.length) {
      return slugValue
    }

    const counter = result.find((row) => row.lucid_slugify_counter)?.lucid_slugify_counter ?? 0
    return `${slugValue}${this.#config.separator}${counter + 1}`
  }

  /**
   * Converts an existing slug to a unique slug by inspecting the database
   */
  async makeSlugUnique(modelInstance: LucidRow, field: string, slug: string): Promise<string> {
    /**
     * Need model constructor reference to create select
     * queries for the model.
     */
    const model = modelInstance.constructor as LucidModel

    /**
     * Get reference to model instance client. This way we will use
     * the same client as the one used to persist the model.
     */
    const client = model.$adapter.modelClient(modelInstance)

    /**
     * Get database column name for which we want to make the
     * select query
     */
    const columnName = model.$columnsDefinitions.get(field)!.columnName

    /**
     * Retreive dialect info to decide which query to issue for
     * finding matching slugs
     */
    const dialect = client.dialect
    const dialectName = dialect.name
    const dialectVersion = Number(dialect.version)

    switch (dialectName) {
      case 'postgres':
      case 'redshift':
        return this.#getSlugForPg(model, client, columnName, slug)
      case 'sqlite3':
      case 'better-sqlite3':
        return this.#getSlugForSqlite(model, client, columnName, slug)
      case 'mysql':
        return dialectVersion < 8
          ? this.#getSlugForOldMysql(model, client, columnName, slug)
          : this.#getSlugForMysql(model, client, columnName, slug)
      case 'mssql':
        return this.#getSlugForMssql(model, client, columnName, slug)
      default:
        throw new E_UNSUPPORTED_DB_DIALECT([dialectName])
    }
  }
}
