/*
 * @adonisjs/lucid-slugify
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { LucidRow } from '@adonisjs/lucid/types/model'
import type { SlugifyStrategyContract } from '../types.js'

/**
 * The SimpleStrategy returns the slug value as it is.
 */
export class SimpleStrategy implements SlugifyStrategyContract {
  maxLengthBuffer: number = 0

  /**
   * Returns the slug as it is
   */
  async makeSlugUnique(_: LucidRow, __: string, slug: string): Promise<string> {
    return slug
  }
}
