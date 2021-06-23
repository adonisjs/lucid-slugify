/*
 * @adonisjs/lucid-slugify
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../../adonis-typings/index.ts" />

import { nanoid } from 'nanoid'
import { LucidModel } from '@ioc:Adonis/Lucid/Orm'
import { SlugifyStrategyContract } from '@ioc:Adonis/Addons/LucidSlugify'

import { SimpleStrategy } from './Simple'

/**
 * A Short id strategy that appends a shortid to the base slug
 */
export class ShortIdStrategy extends SimpleStrategy implements SlugifyStrategyContract {
  protected maxLengthBuffer = 11

  /**
   * Add shortid to the slug
   */
  public async makeSlugUnique(_: LucidModel, __: string, slug: string) {
    return `${slug}-${nanoid(this.maxLengthBuffer - 1)}`
  }
}
