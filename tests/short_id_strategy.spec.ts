/*
 * @adonisjs/lucid-slugify
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { BaseModel } from '@adonisjs/lucid/orm'

import { ShortIdStrategy } from '../src/strategies/short_id.js'

test.group('ShortId Strategy', () => {
  test('generate slug', async ({ assert }) => {
    class Post extends BaseModel {
      declare title: string
      declare slug: string
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

  test('slug maxLength must take shortId length into account', async ({ assert }) => {
    class Post extends BaseModel {
      declare title: string
      declare slug: string
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
