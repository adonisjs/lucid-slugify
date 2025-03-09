/*
 * @adonisjs/lucid-slugify
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { nanoid } from 'nanoid'
import type { LucidRow } from '@adonisjs/lucid/types/model'
import type { SlugifyStrategyContract } from '../types.js'

/**
 * The ShortIdStrategy creates unique slugs by appending a nanoid
 * at the end of the slug value
 */
export class ShortIdStrategy implements SlugifyStrategyContract {
  #config: { separator: string }

  maxLengthBuffer: number = 11

  constructor(config: { separator?: string }) {
    this.#config = { separator: '-', ...config }
  }

  /**
   * Converts an existing slug to a unique slug by appending
   * nanoid to it
   */
  async makeSlugUnique(_: LucidRow, __: string, slug: string): Promise<string> {
    return `${slug}${this.#config.separator}${nanoid(this.maxLengthBuffer - 1)}`
  }
}
