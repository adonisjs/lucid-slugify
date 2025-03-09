/*
 * @adonisjs/lucid-slugify
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { LucidModel, LucidRow } from '@adonisjs/lucid/types/model'

import debug from '../debug.js'
import { Slugifier } from '../slugifier.js'
import type { SlugifyConfig } from '../types.js'
import { SimpleStrategy } from '../strategies/simple.js'
import { ShortIdStrategy } from '../strategies/short_id.js'
import { DbIncrementStrategy } from '../strategies/db_increment.js'

declare module '@adonisjs/lucid/types/model' {
  export interface LucidModel {
    /**
     * A collection of slugifiers in use for a given model
     */
    $slugifiers: Map<string, Slugifier<LucidModel, any>>
  }
}

/**
 * Returns a factory builder to create strategies
 */
function getStrategyBuilder(strategy: SlugifyConfig<LucidRow, any>['strategy']) {
  let strategyFactory = typeof strategy === 'function' ? strategy : undefined

  /**
   * Create a strategy factory for magic string values
   */
  if (!strategyFactory) {
    switch (strategy) {
      case 'shortId':
        strategyFactory = (_, __, config) => new ShortIdStrategy(config)
        break
      case 'dbIncrement':
        strategyFactory = (_, __, config) => new DbIncrementStrategy(config)
        break
      default:
        strategyFactory = () => new SimpleStrategy()
    }
  }

  return strategyFactory
}

/**
 * Assigns a slugifier for a field when one already doesn't exists
 */
function assignSlugifier(
  model: LucidModel,
  property: keyof LucidRow & string,
  config: SlugifyConfig<LucidRow, any>
) {
  if (!model.$slugifiers.has(property)) {
    debug('initiating slugifier for "%s.%s"', model.name, property)
    model.$slugifiers.set(
      property,
      new Slugifier(
        model,
        property,
        getStrategyBuilder(config.strategy)(model, property, config),
        config
      )
    )
  }

  return model.$slugifiers.get(property)!
}

/**
 * Convert a Lucid model attribute to a slug field that is auto-computed
 * and persisted to the database.
 *
 * Slug generation relies on one or more source fields whose value is concatenated
 * and converted to a URL safe slug.
 *
 * You can keep slugs unique using different strategies.
 *
 * - "dbIncrement": Appends a counter to duplicate slug values to make them
 *    unique. This strategy will query the database first to find similar
 *    slugs.
 * - "shortId": Appends a short id to every slug to make them unique.
 */
export function slugify<Model extends LucidRow, TKey extends keyof Model & string>(
  config: SlugifyConfig<Model, TKey>
) {
  return function (target: Model, property: TKey) {
    const model = target.constructor as LucidModel
    model.boot()
    model.$slugifiers = model.$slugifiers ?? new Map()

    model.before('create', async (row) => {
      const slugifier = assignSlugifier(
        model,
        property as any,
        config as SlugifyConfig<LucidRow, any>
      )
      await slugifier.createSlug(row)
    })

    model.before('update', async (row) => {
      const slugifier = assignSlugifier(
        model,
        property as any,
        config as SlugifyConfig<LucidRow, any>
      )
      await slugifier.updateSlug(row)
    })
  }
}
