/*
 * @adonisjs/lucid-slugify
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ApplicationContract } from '@ioc:Adonis/Core/Application'

export default class SlugifyProvider {
  constructor(protected application: ApplicationContract) {}

  public register() {
    this.application.container.bind('Adonis/Addons/LucidSlugify', () => {
      const { SlugifyManager } = require('../src/SlugifyManager')
      const { Slugify } = require('../src/Decorators/Slugify')

      const manager = new SlugifyManager(this.application)
      const slugify = new Slugify(manager)

      return {
        SlugifyManager: manager,
        slugify: slugify.slugifyDecorator.bind(slugify),
      }
    })
  }
}
