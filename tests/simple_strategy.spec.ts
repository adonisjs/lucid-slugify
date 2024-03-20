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

import { SimpleStrategy } from '../src/strategies/simple.js'

test.group('Simple Strategy', () => {
  test('generate slug', async ({ assert }) => {
    class Post extends BaseModel {
      declare title: string
      declare slug: string
    }
    Post.boot()
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})

    const simpleStrategy = new SimpleStrategy({
      strategy: 'simple',
      fields: ['title'],
    })

    assert.deepEqual(simpleStrategy.makeSlug(Post, 'slug', 'Hello world'), 'hello-world')
  })

  test('trim slug after defined maxLength', async ({ assert }) => {
    class Post extends BaseModel {
      declare title: string
      declare slug: string
    }
    Post.boot()
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})

    const simpleStrategy = new SimpleStrategy({
      strategy: 'simple',
      fields: ['title'],
      maxLength: 40,
    })

    const slug = simpleStrategy.makeSlug(
      Post,
      'slug',
      'This is a long title that needs to be trimmed before written to db'
    )
    assert.equal(slug, 'this-is-a-long-title-that-needs-to-be-tr')
    assert.lengthOf(slug, 40)
  })

  test('complete words when trimming slug', async ({ assert }) => {
    class Post extends BaseModel {
      declare title: string
      declare slug: string
    }
    Post.boot()
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})

    const simpleStrategy = new SimpleStrategy({
      strategy: 'simple',
      fields: ['title'],
      maxLength: 40,
      completeWords: true,
    })

    const slug = simpleStrategy.makeSlug(
      Post,
      'slug',
      'This is a long title that needs to be trimmed before written to db'
    )
    assert.equal(slug, 'this-is-a-long-title-that-needs-to-be-trimmed')
    assert.lengthOf(slug, 45)
  })

  test('remove single quotes and question marks from the slug', async ({ assert }) => {
    class Post extends BaseModel {
      declare title: string
      declare slug: string
    }
    Post.boot()
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})

    const simpleStrategy = new SimpleStrategy({
      strategy: 'simple',
      fields: ['title'],
    })

    assert.equal(
      simpleStrategy.makeSlug(Post, 'slug', `How's weather & life?`),
      'hows-weather-and-life'
    )
  })
})
