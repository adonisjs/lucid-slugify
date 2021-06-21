/*
 * @adonisjs/lucid-slugify
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../../adonis-typings/index.ts" />

import { LucidModel } from '@ioc:Adonis/Lucid/Orm'
import { SlugifyConfig, SlugifyManagerContract } from '@ioc:Adonis/Addons/LucidSlugify'
import { Slugifier } from '../Slugifier'

/**
 * Slugify classes exposes the "slugifyDecorator" method to be used
 * a decorator. The class is used so that we can inject the
 * slugifyManager via constructor. slugifyManager is required
 * to resolve strategies
 */
export class Slugify {
  constructor(private slugifyManager: SlugifyManagerContract) {}

  /**
   * To be exported from the container as a decorator
   */
  public slugifyDecorator(config: SlugifyConfig) {
    /**
     * Resolve strategy as soon as someone uses the decorator
     */
    const strategy =
      typeof config.strategy === 'string'
        ? this.slugifyManager.use(config.strategy, config)
        : config.strategy

    return function decorateAsSlugify(target: any, property: string) {
      const Model = target.constructor as LucidModel

      /**
       * Boot the model if not already booted
       */
      Model.boot()

      /**
       * Create slug before the model is persisted
       */
      Model.before('create', async function (row) {
        const rowModel = row.constructor as LucidModel

        /**
         * Do not set slug when already defined manually
         */
        if (row[property]) {
          return
        }

        const slug = await new Slugifier(strategy, rowModel, property, config).makeSlug(row)
        if (slug) {
          row[property] = slug
        }
      })

      /**
       * Create slug before the model is updated, only when allowUpdates
       * is set to true.
       */
      if (config.allowUpdates) {
        Model.before('update', async function (row) {
          const rowModel = row.constructor as LucidModel

          /**
           * Do not set slug when already defined manually
           */
          if (row.$dirty[property] !== undefined) {
            return
          }

          /**
           * Do not set slug when none of the sources are changed
           */
          if (!config.fields.find((field) => row.$dirty[field] !== undefined)) {
            return
          }

          const slug = await new Slugifier(strategy, rowModel, property, config).makeSlug(row)
          if (slug) {
            row[property] = slug
          }
        })
      }
    }
  }
}
