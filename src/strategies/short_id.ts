/*
 * @adonisjs/lucid-slugify
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { nanoid } from 'nanoid'
import type { LucidModel } from '@adonisjs/lucid/types/model'

import { SimpleStrategy } from './simple.js'
import type { SlugifyStrategy } from '../types.js'

/**
 * A Short id strategy that appends a shortid to the base slug
 */
export class ShortIdStrategy extends SimpleStrategy implements SlugifyStrategy {
  protected maxLengthBuffer = 11

  /**
   * Add shortid to the slug
   */
  async makeSlugUnique(_: LucidModel, __: string, slug: string) {
    return `${slug}-${nanoid(this.maxLengthBuffer - 1)}`
  }
}
