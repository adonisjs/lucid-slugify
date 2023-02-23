/*
 * @adonisjs/lucid-slugify
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../../adonis-typings/index.ts" />

import { Exception } from '@poppinss/utils'
import { LucidModel, LucidRow, ModelQueryBuilderContract } from '@ioc:Adonis/Lucid/Orm'
import { DatabaseContract } from '@ioc:Adonis/Lucid/Database'
import { SlugifyConfig, SlugifyStrategyContract } from '@ioc:Adonis/Addons/LucidSlugify'
import { types } from '@poppinss/utils/build/helpers'
import { SimpleStrategy } from './Simple'

/**
 * Uses a counter variable to make slugs unique
 */
export class DbIncrementStrategy extends SimpleStrategy implements SlugifyStrategyContract {
  private counterName = 'lucid_slugify_counter'

  constructor(private db: DatabaseContract, config: SlugifyConfig) {
    super(config)
  }

  private onQuery(query: ModelQueryBuilderContract<LucidModel>, row: LucidRow) {
    if (types.isFunction(this.config.onQuery)) {
      this.config.onQuery(query, row)
    }
  }

  /**
   * Makes the slug by inspecting multiple similar rows in JavaScript
   */
  private makeSlugFromMultipleRows(slug: string, field: string, rows: LucidRow[]) {
    /**
     * No matching rows found and hence no counter is required
     */
    if (!rows.length) {
      return slug
    }

    /**
     * Find the rows that already has a counter
     */
    const slugs = rows.reduce<number[]>((result, row) => {
      const tokens = row[field].toLowerCase().split(`${slug}${this.separator}`)
      if (tokens.length === 2) {
        const counter = Number(tokens[1])
        if (!isNaN(counter)) {
          result = result.concat(counter)
        }
      }
      return result
    }, [])

    /**
     * If no rows with counter found, use "1" as the counter
     */
    if (!slugs.length) {
      return `${slug}${this.separator}1`
    }

    /**
     * Find the max counter and plus 1 to it
     */
    return `${slug}${this.separator}${Math.max(...slugs) + 1}`
  }

  /**
   * Makes the slug unique by using the runtime slug counter field
   */
  private makeSlugFromCounter(slug: string, rows: LucidRow[]) {
    /**
     * No matching rows found. Consider the slug as it is
     */
    if (!rows.length) {
      return slug
    }

    /**
     * First row has the counter and hence consider it
     */
    let counter = rows[0].$extras[this.counterName]
    if (counter) {
      return `${slug}${this.separator}${counter + 1}`
    }

    /**
     * Second row has the counter and hence consider it
     */
    if (rows[1]) {
      counter = rows[1].$extras[this.counterName]
      return `${slug}${this.separator}${counter + 1}`
    }

    return `${slug}${this.separator}1`
  }

  /**
   * Returns the slug for sqlite
   */
  private async getSlugForSqlite(
    model: LucidModel,
    field: string,
    columnName: string,
    slug: string,
    row: LucidRow
  ) {
    const query = model
      .query()
      .select(field)
      // raw where clause should using the column name
      .whereRaw('lower(??) = ?', [columnName, slug])
      .orWhereRaw('lower(??) like ?', [columnName, `${slug}${this.separator}%`])

    this.onQuery(query, row)

    const rows = await query.exec()

    return this.makeSlugFromMultipleRows(slug, field, rows)
  }

  /**
   * Returns the slug for MYSQL < 8.0
   */
  private async getSlugForOldMysql(
    model: LucidModel,
    field: string,
    columnName: string,
    slug: string,
    row: LucidRow
  ) {
    const query = model
      .query()
      .select(field)
      .where(field, slug)
      // raw where clause should using the column name
      .orWhereRaw(`?? REGEXP ?`, [columnName, `^${slug}(${this.separator}[0-9]*)?$`])

    this.onQuery(query, row)

    const rows = await query.exec()

    return this.makeSlugFromMultipleRows(slug, field, rows)
  }

  /**
   * Returns the slug for MYSQL >= 8.0
   */
  private async getSlugForMysql(
    model: LucidModel,
    _: string,
    columnName: string,
    slug: string,
    row: LucidRow
  ) {
    const query = model
      .query()
      .select(
        this.db.raw(
          `CAST(REGEXP_SUBSTR(${columnName}, '[0-9]+$') AS UNSIGNED) as ${this.counterName}`
        )
      )
      .whereRaw(`?? REGEXP ?`, [columnName, `^${slug}(${this.separator}[0-9]*)?$`])
      .orderBy(this.counterName, 'desc')

    this.onQuery(query, row)

    const rows = await query.exec()

    return this.makeSlugFromCounter(slug, rows)
  }

  /**
   * Returns the slug for mssql. With MSSQL it maybe is possible to use the
   * T-SQL with Patindex to narrow down the search query. But for now
   * I want to save time and not concern myself much with learning
   * T-SQL.
   *
   * If you use MSSQL and concerned with performance. Please take out time and
   * help improve the MSSQL query
   */
  private async getSlugForMssql(
    model: LucidModel,
    field: string,
    _: string,
    slug: string,
    row: LucidRow
  ) {
    const query = model
      .query()
      .select(field)
      .where(field, slug)
      .orWhere(field, 'like', `${slug}${this.separator}%`)

    this.onQuery(query, row)

    const rows = await query.exec()

    return this.makeSlugFromMultipleRows(slug, field, rows)
  }

  /**
   * Makes slug for PostgreSQL and redshift both. Redshift is not tested and
   * assumed to be compatible with PG.
   */
  private async getSlugForPg(
    model: LucidModel,
    _: string,
    columnName: string,
    slug: string,
    row: LucidRow
  ) {
    const query = model
      .query()
      .select(
        this.db.raw(`SUBSTRING(${columnName} from '[0-9]+$')::INTEGER as ${this.counterName}`)
      )
      .whereRaw(`?? ~* ?`, [columnName, `^${slug}(${this.separator}[0-9]*)?$`])
      .orderBy(this.counterName, 'desc')

    this.onQuery(query, row)

    const rows = await query.exec()

    return this.makeSlugFromCounter(slug, rows)
  }

  /**
   * Makes slug for Oracle. Oracle is not tested
   */
  private async getSlugForOracle(
    model: LucidModel,
    _: string,
    columnName: string,
    slug: string,
    row: LucidRow
  ) {
    const query = model
      .query()
      .select(
        this.db.raw(`TO_NUMBER(REGEXP_SUBSTR(${columnName}, '[0-9]+$')) as ${this.counterName}`)
      )
      .whereRaw(`REGEXP_LIKE(??, ?)`, [columnName, `^${slug}(${this.separator}[0-9]*)?$`])
      .orderBy(this.counterName, 'desc')

    this.onQuery(query, row)

    const rows = await query.exec()

    return this.makeSlugFromCounter(slug, rows)
  }

  /**
   * Converts an existing slug to a unique slug by inspecting the database
   */
  public async makeSlugUnique(model: LucidModel, field: string, slug: string, row: LucidRow) {
    model.boot()

    const column = model.$columnsDefinitions.get(field)!
    const dialect = model.$adapter.modelConstructorClient(model).dialect
    const columnName = column.columnName
    const dialectName = dialect.name
    const dialectVersion = Number(dialect.version)

    switch (dialectName) {
      case 'postgres':
      case 'redshift':
        return this.getSlugForPg(model, field, columnName, slug, row)
      case 'sqlite3':
        return this.getSlugForSqlite(model, field, columnName, slug, row)
      case 'mysql':
        return dialectVersion < 8
          ? this.getSlugForOldMysql(model, field, columnName, slug, row)
          : this.getSlugForMysql(model, field, columnName, slug, row)
      case 'mssql':
        return this.getSlugForMssql(model, field, columnName, slug, row)
      case 'oracledb':
        return this.getSlugForOracle(model, field, columnName, slug, row)
      default:
        throw new Exception(
          `"${dialectName}" database is not supported for the dbIncrement strategy`,
          500,
          'E_UNSUPPORTED_DBINCREMENT_DIALECT'
        )
    }
  }
}
