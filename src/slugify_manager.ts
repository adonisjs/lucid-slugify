/*
 * @adonisjs/lucid-slugify
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Exception } from '@adonisjs/core/exceptions'
import type { Database } from '@adonisjs/lucid/database'

import { SimpleStrategy } from './strategies/simple.js'
import { ShortIdStrategy } from './strategies/short_id.js'
import { DbIncrementStrategy } from './strategies/db_increment.js'
import type { ExtendCallback, SlugifyConfig, StrategiesList } from './types.js'

/**
 * Slugify manager manages the lifecycle of strategies
 */
export class SlugifyManager {
  /**
   * A private map of strategies added from outside in.
   */
  private extendedStrategies: Map<string, ExtendCallback> = new Map()

  constructor(protected db: Database) {}

  /**
   * Make extended strategy instance
   */
  private makeExtendedStrategy(strategy: string, config: SlugifyConfig) {
    if (!this.extendedStrategies.has(strategy)) {
      throw new Exception(`"${strategy}" is not a valid slugify strategy`, {
        code: 'E_INVALID_SLUGIFY_STRATEGY',
        status: 500,
      })
    }

    return this.extendedStrategies.get(strategy)!(this, config)
  }

  /**
   * Makes an instance of the given strategy
   */
  use(strategy: keyof StrategiesList, config: SlugifyConfig) {
    switch (strategy) {
      case 'simple':
        return new SimpleStrategy(config)
      case 'dbIncrement':
        return new DbIncrementStrategy(this.db, config)
      case 'shortId':
        return new ShortIdStrategy(config)
      default:
        return this.makeExtendedStrategy(strategy, config)
    }
  }

  /**
   * Extend by adding custom strategies
   */
  extend(strategy: string, callback: ExtendCallback) {
    this.extendedStrategies.set(strategy, callback)
  }
}
