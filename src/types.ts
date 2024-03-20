import type { LucidModel, LucidRow } from '@adonisjs/lucid/types/model'
import { SlugifyManager } from './slugify_manager.js'

/**
 * The interface every strategy must adhere to
 */
export interface SlugifyStrategy {
  /**
   * Make slug for a given field and value
   */
  makeSlug(model: LucidModel, field: string, value: string): string

  /**
   * Make the slug created by the "makeSlug" method unique.
   */
  makeSlugUnique(model: LucidModel, field: string, value: string): Promise<string> | string
}

/**
 * Config accepted by the strategies and the slugify
 * decorator
 */
export type SlugifyConfig = {
  strategy: keyof StrategiesList | SlugifyStrategy
  fields: string[]
  maxLength?: number
  completeWords?: boolean
  allowUpdates?: boolean | ((model: LucidRow) => boolean)
  separator?: string
  transformer?: (value: any) => string
} & Record<string, any>

/**
 * We do not define these in the user land code. Because renaming the
 * key inside the following interface doesn't translate that change
 * to runtime.
 *
 * In other words the strategies names are fixed and we use this interface
 * to allow other packages to add custom strategies
 */
export interface StrategiesList {
  simple: SlugifyStrategy
  dbIncrement: SlugifyStrategy
  shortId: SlugifyStrategy
}

/**
 * Shape of the extend callback
 */
export type ExtendCallback = (manager: SlugifyManager, config: SlugifyConfig) => SlugifyStrategy

/**
 * Slugify decorator
 */
export type SlugifyDecorator = (options: SlugifyConfig) => (target: any, property: any) => void
