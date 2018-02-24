'use strict'

/**
 * adonis-lucid-slugify
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const { ServiceProvider } = require('@adonisjs/fold')

class SlugifyProvider extends ServiceProvider {
  register () {
    this.app.bind('Adonis/Addons/LucidSlugify', () => {
      const Slugify = require('../src/Slugify')
      return new Slugify()
    })
    this.app.alias('Adonis/Addons/LucidSlugify', 'Lucid/Slugify')
  }
}

module.exports = SlugifyProvider
