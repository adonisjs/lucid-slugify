/*
 * @adonisjs/lucid-slugify
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import stringHelpers from '@adonisjs/core/helpers/string'
import type { LucidModel, ModelAttributes } from '@adonisjs/lucid/types/model'

import debug from './debug.js'
import type { SlugifierConfig, SlugifyStrategyContract } from './types.js'

/**
 * Slugifier expsoes the API to create unique slugs using a slugify strategy.
 * You can specify the model for which the slugs should be generated and
 * an array of fields to use for computing the slug raw value.
 *
 * @example
 * ```ts
 * const slugifier = new Slugifier(Post, 'slug', new ShortId(), {
 *   fields: ['title']
 * })
 *
 * const post = new Post()
 * post.title = 'Hello world'
 *
 * const slug = await slugifier.makeSlug(post)
 *
 * // Set the post.slug property
 * await slugifier.createSlug(post)
 *
 * // Set the post.slug property when its source fields has been modified
 * await slugifier.updateSlug(post)
 * ```
 */
export class Slugifier<Model extends LucidModel, SlugField extends keyof InstanceType<Model>> {
  /**
   * Convert a value to a URL-safe slug. Feel free to replace this
   * method with a custom implementation.
   */
  static slugify(
    value: string,
    options: {
      separator: string
      lower: boolean
    }
  ) {
    return stringHelpers.slug(value, {
      strict: true,
      lower: options.lower,
      replacement: options.separator,
    })
  }

  #slugField: SlugField
  #separator: string
  #model: Model
  #config: SlugifierConfig<InstanceType<Model>, SlugField>
  #strategy: SlugifyStrategyContract

  constructor(
    model: Model,
    slugField: SlugField,
    strategy: SlugifyStrategyContract,
    config: SlugifierConfig<InstanceType<Model>, SlugField>
  ) {
    this.#model = model
    this.#slugField = slugField
    this.#config = config
    this.#strategy = strategy
    this.#separator = this.#config.separator ?? '-'
  }

  /**
   * Transforms a given model attribute value to a string
   */
  #transformToString(
    modelInstance: InstanceType<Model>,
    field: keyof ModelAttributes<InstanceType<Model>>,
    value: unknown
  ): string {
    if (typeof this.#config.transformer === 'function') {
      return this.#config.transformer(modelInstance, field, value)
    }

    if (value === true) {
      return '1'
    }

    if (value === false) {
      return '0'
    }

    if (value instanceof Date) {
      return value.toJSON()
    }

    return String(value)
  }

  /**
   * Returns the value to be used for creating a slug by concatenating
   * the values of the source fields. Null is returned when the value
   * of one or more source fields is null or undefined.
   */
  #createSlugValue(modelInstance: InstanceType<Model>): string | null {
    const slugValues: string[] = []

    for (let field of this.#config.fields) {
      const value = modelInstance[field as keyof InstanceType<Model>]
      if (value === null || value === undefined) {
        debug('cannot create slug as "%s" property is set to %o', field, value)
        return null
      } else {
        slugValues.push(this.#transformToString(modelInstance, field, value))
      }
    }

    return slugValues.join(this.#separator)
  }

  /**
   * Transforms a string value to a URL-safe slug
   */
  #makeSlug(value: string) {
    let slug = Slugifier.slugify(value, {
      separator: this.#separator,
      lower: true,
    })

    /**
     * Truncate value to the maxLength
     */
    if (this.#config.maxLength) {
      slug = stringHelpers.truncate(slug, this.#config.maxLength - this.#strategy.maxLengthBuffer, {
        completeWords: this.#config.completeWords,
        suffix: '',
      })
    }

    return slug
  }

  /**
   * Create a new unique slug using the provided strategy and sets
   * the value for the "forField" property on the model instance.
   *
   * @note
   * This method does not issue a database query, instead it is meant
   * to be used within a `beforeCreate` hook
   *
   * @example
   * ```ts
   *
   * const post = new Post()
   * post.title = 'Hello world'
   *
   * await slugifier.createSlug(post)
   * post.slug // hello-world
   * ```
   */
  async createSlug(row: InstanceType<Model>) {
    const modelName = this.#model.name

    if (row[this.#slugField]) {
      debug(
        'skipping slug generation since "%s.%s" property already has a value',
        modelName,
        this.#slugField
      )
      return
    }

    const slug = await this.makeSlug(row)
    if (slug) {
      debug('setting slug value for "%s.%s" property to "%s"', modelName, this.#slugField, slug)
      row[this.#slugField] = slug as any
    }
  }

  /**
   * Updates the value for the existing slug property when its source
   * fields have been mutated.
   *
   * You can disable slug updates using the {@link SlugifierConfig.allowUpdates}
   * config option.
   *
   * @note
   * This method does not issue a database query, instead it is meant
   * to be used within a `beforeUpdate` hook.
   *
   * @example
   * ```ts
   *
   * const post = Post.findOrFail(1)
   * post.title = 'Updated title'
   *
   * await slugifier.updateSlug(post)
   * post.slug // updated-title
   * ```
   */
  async updateSlug(row: InstanceType<Model>) {
    const modelName = this.#model.name

    let allowUpdates =
      typeof this.#config.allowUpdates === 'function'
        ? this.#config.allowUpdates(row)
        : !!this.#config.allowUpdates

    /**
     * Skip if updates are disabled
     */
    if (!allowUpdates) {
      debug('updating slugs is disabled for "%s.%s" property', modelName, this.#slugField)
      return
    }

    /**
     * Skip if the slug property has been mutated manually.
     */
    if (row.isDirty(this.#slugField as any)) {
      debug(
        'skipping slug updation since "%s.%s" property has been updated manually',
        modelName,
        this.#slugField
      )
      return
    }

    /**
     * Skip if none of the source fields are dirty.
     */
    if (this.#config.fields.every((field) => !row.isDirty(field))) {
      return
    }

    /**
     * Update slug
     */
    const slug = await this.makeSlug(row)
    if (slug) {
      debug(
        'updating slug value for "%s.%s" property from "%s" to "%s"',
        modelName,
        this.#slugField,
        row[this.#slugField],
        slug
      )
      row[this.#slugField] = slug as any
    }
  }

  /**
   * Creates a slug for a given model instance using the values from
   * the source fields.
   *
   * A `null` value will be returned when one of the source fields
   * have `undefined` or `null` values.
   */
  async makeSlug(modelInstance: InstanceType<Model>) {
    const slugValue = this.#createSlugValue(modelInstance)
    if (!slugValue) {
      return null
    }

    return this.#strategy.makeSlugUnique(
      modelInstance,
      this.#slugField as string,
      this.#makeSlug(slugValue)
    )
  }
}
