/*
 * @adonisjs/lucid-slugify
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Addons/LucidSlugify' {
  import { LucidModel, LucidRow, ModelQueryBuilderContract } from '@ioc:Adonis/Lucid/Orm'
  import { ApplicationContract } from '@ioc:Adonis/Core/Application'

  /**
   * Config accepted by the strategies and the slugify
   * decorator
   */
  export type SlugifyConfig = {
    strategy: keyof StrategiesList | SlugifyStrategyContract
    fields: string[]
    maxLength?: number
    completeWords?: boolean
    allowUpdates?: boolean | ((model: LucidRow) => boolean)
    separator?: string
    transformer?: (value: any) => string
    onQuery?: (query: ModelQueryBuilderContract<LucidModel>, row: LucidRow) => void
  } & Record<string, any>

  /**
   * The interface every strategy must adhere to
   */
  export interface SlugifyStrategyContract {
    /**
     * Make slug for a given field and value
     */
    makeSlug(model: LucidModel, field: string, value: string, row: LucidRow): string

    /**
     * Make the slug created by the "makeSlug" method unique.
     */
    makeSlugUnique(
      model: LucidModel,
      field: string,
      value: string,
      row: LucidRow
    ): Promise<string> | string
  }

  /**
   * We do not define these in the user land code. Because renaming the
   * key inside the following interface doesn't translate that change
   * to runtime.
   *
   * In other words the strategies names are fixed and we use this interface
   * to allow other packages to add custom strategies
   */
  export interface StrategiesList {
    simple: SlugifyStrategyContract
    dbIncrement: SlugifyStrategyContract
    shortId: SlugifyStrategyContract
  }

  /**
   * Shape of the extend callback
   */
  export type ExtendCallback = (
    manager: SlugifyManagerContract,
    config: SlugifyConfig
  ) => SlugifyStrategyContract

  /**
   * Manager to work
   */
  export interface SlugifyManagerContract {
    application: ApplicationContract

    /**
     * Pull instance of a given strategy
     */
    use(strategy: keyof StrategiesList, config: SlugifyConfig): SlugifyStrategyContract

    /**
     * Extend by adding a custom strategy
     */
    extend(strategy: keyof StrategiesList, callback: ExtendCallback): void
  }

  /**
   * Slugify decorator
   */
  export type SlugifyDecorator = (options?: SlugifyConfig) => (target: any, property: any) => void

  export const slugify: SlugifyDecorator
  export const Slugify: SlugifyManagerContract
}
