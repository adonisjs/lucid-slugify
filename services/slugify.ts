/*
 * @adonisjs/lucid-slugify
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from '@adonisjs/core/services/app'
import { SlugifyDecorator } from '../src/types.js'

let slugify: SlugifyDecorator

await app.booted(async () => {
  slugify = await app.container.make('slugify.decorator')
})

export { slugify as default }
