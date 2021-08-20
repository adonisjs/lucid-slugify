/*
 * @adonisjs/lucid-slugify
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { SimpleStrategy } from '../src/Strategies/Simple'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { setupApplication, fs } from '../test-helpers'

let app: ApplicationContract

test.group('Simple Strategy', (group) => {
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

    const simpleStrategy = new SimpleStrategy({
      strategy: 'simple',
      fields: ['title'],
    })

    assert.equal(simpleStrategy.makeSlug(Post, 'slug', 'Hello world'), 'hello-world')
  })

  test('trim slug after defined maxLength', async (assert) => {
    const { BaseModel } = app.container.resolveBinding('Adonis/Lucid/Orm')

    class Post extends BaseModel {
      public title: string
      public slug: string
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

  test('complete words when trimming slug', async (assert) => {
    const { BaseModel } = app.container.resolveBinding('Adonis/Lucid/Orm')

    class Post extends BaseModel {
      public title: string
      public slug: string
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

  test('remove single quotes and question marks from the slug', async (assert) => {
    const { BaseModel } = app.container.resolveBinding('Adonis/Lucid/Orm')

    class Post extends BaseModel {
      public title: string
      public slug: string
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
