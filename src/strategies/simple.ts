/*
 * @adonisjs/lucid-slugify
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import string from '@adonisjs/core/helpers/string'
import { LucidModel } from '@adonisjs/lucid/types/model'

import type { SlugifyConfig, SlugifyStrategy } from '../types.js'

/**
 * A simple strategy to generate slugs
 */
export class SimpleStrategy implements SlugifyStrategy {
  protected separator: string
  protected maxLengthBuffer = 0

  constructor(private config: SlugifyConfig) {
    this.separator = this.config.separator || '-'
  }

  /**
   * Makes the slug out the value string
   */
  makeSlug(_: LucidModel, __: string, value: string) {
    let baseSlug = string.slug(value, {
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
  async makeSlugUnique(_: LucidModel, __: string, slug: string) {
    return slug
  }
}
