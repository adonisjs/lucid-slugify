/*
 * @adonisjs/lucid-slugify
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../../adonis-typings/index.ts" />

import { LucidModel, LucidRow } from '@ioc:Adonis/Lucid/Orm'
import { string } from '@poppinss/utils/build/helpers'
import { SlugifyConfig, SlugifyStrategyContract } from '@ioc:Adonis/Addons/LucidSlugify'

/**
 * A simple strategy to generate slugs
 */
export class SimpleStrategy implements SlugifyStrategyContract {
  protected separator = this.config.separator || '-'
  protected maxLengthBuffer = 0

  constructor(protected config: SlugifyConfig) {}

  /**
   * Makes the slug out the value string
   */
  public makeSlug(_: LucidModel, __: string, value: string, ___: LucidRow) {
    let baseSlug = string.toSlug(value, {
      replacement: this.separator,
      lower: true,
      strict: true,
    })

    /**
     * Limit to defined characters
     */
    if (this.config.maxLength) {
      baseSlug = string.truncate(baseSlug, this.config.maxLength - this.maxLengthBuffer, {
        completeWords: this.config.completeWords,
        suffix: '',
      })
    }

    return baseSlug
  }

  /**
   * Returns the slug as it is
   */
  public async makeSlugUnique(_: LucidModel, __: string, slug: string, ___: LucidRow) {
    return slug
  }
}
