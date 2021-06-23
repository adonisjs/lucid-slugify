/*
 * @adonisjs/lucid-slugify
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../../adonis-typings/index.ts" />

import { Exception } from '@poppinss/utils'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import {
  SlugifyConfig,
  StrategiesList,
  ExtendCallback,
  SlugifyManagerContract,
} from '@ioc:Adonis/Addons/LucidSlugify'

/**
 * Slugify manager manages the lifecycle of strategies
 */
export class SlugifyManager implements SlugifyManagerContract {
  /**
   * A private map of strategies added from outside in.
   */
  private extendedStrategies: Map<string, ExtendCallback> = new Map()

  constructor(public application: ApplicationContract) {}

  /**
   * Makes an instance of the simple strategy
   */
  private makeSimpleStrategy(config: SlugifyConfig) {
    const { SimpleStrategy } = require('../Strategies/Simple')
    return new SimpleStrategy(config)
  }

  /**
   * Makes an instance of the dbIncrement strategy
   */
  private makeDbIncrementStrategy(config: SlugifyConfig) {
    const { DbIncrementStrategy } = require('../Strategies/DbIncrement')
    return new DbIncrementStrategy(
      this.application.container.resolveBinding('Adonis/Lucid/Database'),
      config
    )
  }

  /**
   * Makes an instance of the shortid strategy
   */
  private makeShortIdStrategy(config: SlugifyConfig) {
    const { ShortIdStrategy } = require('../Strategies/ShortId')
    return new ShortIdStrategy(config)
  }

  /**
   * Make extended strategy instance
   */
  private makeExtendedStrategy(strategy: string, config: SlugifyConfig) {
    if (!this.extendedStrategies.has(strategy)) {
      throw new Exception(
        `"${strategy}" is not a valid slugify strategy`,
        500,
        'E_INVALID_SLUGIFY_STRATEGY'
      )
    }

    return this.extendedStrategies.get(strategy)!(this, config)
  }

  /**
   * Makes an instance of the given strategy
   */
  public use(strategy: keyof StrategiesList, config: SlugifyConfig) {
    switch (strategy) {
      case 'simple':
        return this.makeSimpleStrategy(config)
      case 'dbIncrement':
        return this.makeDbIncrementStrategy(config)
      case 'shortId':
        return this.makeShortIdStrategy(config)
      default:
        return this.makeExtendedStrategy(strategy, config)
    }
  }

  /**
   * Extend by adding custom strategies
   */
  public extend(strategy: string, callback: ExtendCallback) {
    this.extendedStrategies.set(strategy, callback)
  }
}
