/*
 * @adonisjs/lucid-slugify
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { LucidModel, LucidRow, ModelAttributes } from '@adonisjs/lucid/types/model'

/**
 * Config accepted by the Slugifier class
 */
export type SlugifierConfig<Model extends LucidRow, SlugField extends keyof Model> = {
  /**
   * Specify the fields values to use for creating the slugs. If you specify multiple
   * fields, their values will be concatenated in the same order as they are defined
   * to compute the slug value.
   *
   * The values are concatenated using the {@link SlugifierConfig.separator}.
   *
   * @example
   * ```
   * fields: ['seriesName', 'title']
   * ```
   */
  fields: Exclude<keyof ModelAttributes<Model>, SlugField>[]

  /**
   * The maximum length for the slug value. The characters after the
   * defined length will be removed. Ideally, you must give some
   * breathing room to the slugifier with maxLength to create
   * unique slugs.
   *
   * For example: If the max length of the database column is 255,
   * then must keep the "maxLength" config to 230 or 240, so that
   * slugifier can append a counter or certain chars in order
   * to the make the slug unique.
   *
   * @default `Infinity`
   */
  maxLength?: number

  /**
   * Should the maxLength truncation allow the words to complete.
   *
   * @default `false`
   */
  completeWords?: boolean

  /**
   * The separator to use for concatenating values of multiple fields.
   *
   * @default `-`
   */
  separator?: string

  /**
   * Specify a custom transformer to convert rich datatypes of the model
   * to a String value. By default, we will call `String(value)` to
   * convert value to string
   */
  transformer?: (
    modelInstance: Model,
    field: keyof ModelAttributes<Model>,
    value: unknown
  ) => string

  /**
   * Should the slug value be updated when one of the source fields
   * are changed?
   *
   * By default, we will check the {@link SlugifierConfig.fields} under
   * the `Model.$dirty` properties and only update the slug when
   * one of the fields have been mutated/changed.
   *
   * You can also specify a custom callback function to determine if the
   * slug should be update at runtime.
   *
   * @example
   * ```ts
   * // disable updating slug
   * allowUpdates: false
   *
   * // tracking for source changes and update
   * allowUpdates: true
   *
   * // Implement conditional manually
   * allowUpdates: (model) => true
   * ```
   *
   * @default `false`
   */
  allowUpdates?: boolean | ((modelInstance: Model) => boolean)
}

/**
 * Configuration accepted by the Slugify decorator
 */
export type SlugifyConfig<Model extends LucidRow, SlugField extends keyof Model> = SlugifierConfig<
  Model,
  SlugField
> & {
  /**
   * Strategy to use for making the slugs unique. If you do not
   * want to make slugs unique, then you can ignore the strategy
   * option.
   *
   * - "dbIncrement": Appends a counter to duplicate slug values to make them
   *    unique. This strategy will query the database first to find similar
   *    slugs.
   * - "shortId": Appends a short id to every slug to make them unique
   * - <factoryFunction>: Return an instance of a custom strategy.
   */
  strategy?:
    | 'dbIncrement'
    | 'shortId'
    | ((
        model: LucidModel,
        propertyName: string,
        config: SlugifyConfig<Model, SlugField>
      ) => SlugifyStrategyContract)
}

/**
 * The contract every implementation of the slugify strategy should
 * implement.
 */
export interface SlugifyStrategyContract {
  /**
   * The number of the characters the strategy may add to the slug to make it
   * unique.
   */
  maxLengthBuffer: number

  /**
   * Convert the final slug value into a unique value that can be inserted
   * to the database.
   */
  makeSlugUnique(modelInstance: LucidRow, field: string, value: string): Promise<string> | string
}
