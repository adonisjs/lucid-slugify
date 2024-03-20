/*
 * @adonisjs/lucid-slugify
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from '@adonisjs/core/services/app'
import { SlugifyManager } from '../src/slugify_manager.js'

let slugifyManager: SlugifyManager

await app.booted(async () => {
  slugifyManager = await app.container.make('slugify.manager')
})

export { slugifyManager as default }
