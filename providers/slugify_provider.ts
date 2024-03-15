/*
 * @adonisjs/lucid-slugify
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference types="@adonisjs/lucid/database_provider" />

import type { ApplicationService } from '@adonisjs/core/types'

import { SlugifyDecorator } from '../src/types.js'
import type { SlugifyManager } from '../src/slugify_manager.js'

declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    'slugify.manager': SlugifyManager
    'slugify.decorator': SlugifyDecorator
  }
}

export default class SlugifyProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton('slugify.manager', async () => {
      const db = await this.app.container.make('lucid.db')
      const { SlugifyManager } = await import('../src/slugify_manager.js')

      return new SlugifyManager(db)
    })

    this.app.container.singleton('slugify.decorator', async (resolver) => {
      const { Slugify } = await import('../src/decorators/slugify.js')
      const slugify = new Slugify(await resolver.make('slugify.manager'))

      return slugify.slugifyDecorator.bind(slugify)
    })
  }
}
