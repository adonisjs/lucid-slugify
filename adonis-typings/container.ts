/*
 * @adonisjs/lucid-slugify
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Core/Application' {
  import LucidSlugify from '@ioc:Adonis/Addons/LucidSlugify'

  interface ContainerBindings {
    'Adonis/Addons/LucidSlugify': typeof LucidSlugify
  }
}
