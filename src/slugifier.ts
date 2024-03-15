/*
 * @adonisjs/lucid-slugify
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { LucidModel, LucidRow } from '@adonisjs/lucid/types/model'

import type { SlugifyStrategy, SlugifyConfig } from './types.js'

/**
 * Makes the slug for a given model and field
 */
export class Slugifier {
  private separator: string

  constructor(
    private strategy: SlugifyStrategy,
    private model: LucidModel,
    private field: string,
    private config: SlugifyConfig
  ) {
    this.separator = this.config.separator || '-'
  }

  /**
   * Transform a given value to a string
   */
  private transformValueToSlugString(value: any): string {
    /**
     * Use the transformer if configured
     */
    if (typeof this.config.transformer === 'function') {
      return this.config.transformer(value)
    }

    if (value === true) {
      return '1'
    }

    if (value === false) {
      return '0'
    }

    return String(value)
  }

  /**
   * Returns the slug value from the configured fields
   */
  private getSlugValue(row: LucidRow): string | null {
    const slugValues: string[] = []
    let hasNullValues: boolean = false

    for (let field of this.config.fields) {
      const value = (row as any)[field]
      if (value === null || value === undefined) {
        hasNullValues = true
        break
      } else {
        slugValues.push(this.transformValueToSlugString(value))
      }
    }

    return hasNullValues ? null : slugValues.join(this.separator)
  }

  /**
   * Makes a slug for a given instance of model
   */
  async makeSlug(row: LucidRow) {
    const slugValue = this.getSlugValue(row)
    if (!slugValue) {
      return null
    }

    return this.strategy.makeSlugUnique(
      this.model,
      this.field,
      this.strategy.makeSlug(this.model, this.field, slugValue)
    )
  }
}
