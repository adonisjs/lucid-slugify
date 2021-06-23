/*
 * @adonisjs/lucid-slugify
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { ShortIdStrategy } from '../src/Strategies/ShortId'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { setupApplication, fs } from '../test-helpers'

let app: ApplicationContract

test.group('ShortId Strategy', (group) => {
  group.beforeEach(async () => {
    app = await setupApplication()
  })

  group.after(async () => {
    await fs.cleanup()
  })

  test('generate slug', async (assert) => {
    const { BaseModel } = app.container.resolveBinding('Adonis/Lucid/Orm')

    class Post extends BaseModel {
      public title: string
      public slug: string
    }
    Post.boot()
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})

    const shortIdStrategy = new ShortIdStrategy({
      strategy: 'shortId',
      fields: ['title'],
    })

    const slug = shortIdStrategy.makeSlug(Post, 'slug', 'Hello world')
    const uniqueSlug = await shortIdStrategy.makeSlugUnique(Post, 'slug', slug)
    assert.match(uniqueSlug, /hello-world-.*/)
  })

  test('slug maxLength must take shortId length into account', async (assert) => {
    const { BaseModel } = app.container.resolveBinding('Adonis/Lucid/Orm')

    class Post extends BaseModel {
      public title: string
      public slug: string
    }
    Post.boot()
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})

    const shortIdStrategy = new ShortIdStrategy({
      strategy: 'shortId',
      fields: ['title'],
      maxLength: 40,
    })

    const slug = shortIdStrategy.makeSlug(
      Post,
      'slug',
      'This is a long title that needs to be trimmed before written to db'
    )
    assert.equal(slug, 'this-is-a-long-title-that-nee')
    assert.lengthOf(slug, 29)
  })
})
