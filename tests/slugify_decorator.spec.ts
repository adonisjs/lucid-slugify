/*
 * @adonisjs/lucid-slugify
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { LucidRow } from '@adonisjs/lucid/types/model'
import { BaseModel, column } from '@adonisjs/lucid/orm'

import { Slugify } from '../src/decorators/slugify.js'
import { createDatabase, setupDb } from './helpers.js'
import { SlugifyManager } from '../src/slugify_manager.js'

test.group('Slugify Decorator', () => {
  test('generate slug for a model', async ({ assert }) => {
    const db = createDatabase()
    await setupDb(db)

    const slugifyManager = new SlugifyManager(db)
    const slugify = new Slugify(slugifyManager)

    class Post extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare title: string

      @column()
      @slugify.slugifyDecorator({ strategy: 'dbIncrement', fields: ['title'] })
      declare slug: string
    }

    const post = new Post()
    post.title = 'Hello world'
    await post.save()

    await post.refresh()
    assert.equal(post.slug, 'hello-world')
  })

  test('do not set slug when defined manually', async ({ assert }) => {
    const db = createDatabase()
    await setupDb(db)

    const slugifyManager = new SlugifyManager(db)
    const slugify = new Slugify(slugifyManager)

    class Post extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare title: string

      @column()
      @slugify.slugifyDecorator({ strategy: 'dbIncrement', fields: ['title'] })
      declare slug: string
    }

    const post = new Post()
    post.title = 'Hello world'
    post.slug = 'user-defined-slug'
    await post.save()

    await post.refresh()
    assert.equal(post.slug, 'user-defined-slug')
  })

  test('do not set slug when source is undefined', async ({ assert }) => {
    const db = createDatabase()
    await setupDb(db)

    const slugifyManager = new SlugifyManager(db)
    const slugify = new Slugify(slugifyManager)

    class Post extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare title: string

      @column()
      @slugify.slugifyDecorator({ strategy: 'dbIncrement', fields: ['title'] })
      declare slug: string
    }

    const post = new Post()
    await post.save()

    await post.refresh()
    assert.isNull(post.slug)
  })

  test('generate unique slug when a similar one already exists', async ({ assert }) => {
    const db = createDatabase()
    await setupDb(db)

    const slugifyManager = new SlugifyManager(db)
    const slugify = new Slugify(slugifyManager)

    class Post extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare title: string

      @column({ columnName: 'slug' })
      @slugify.slugifyDecorator({ strategy: 'dbIncrement', fields: ['title'] })
      declare aDifferentPropertyName: string
    }

    await Post.createMany([
      {
        title: 'Hello world',
        aDifferentPropertyName: 'hello-world',
      },
      {
        title: 'Hello world',
        aDifferentPropertyName: 'hello-10-world',
      },
      {
        title: 'Hello world',
        aDifferentPropertyName: 'hello10world',
      },
    ])

    const post = new Post()
    post.title = 'Hello world'
    await post.save()

    await post.refresh()
    assert.equal(post.aDifferentPropertyName, 'hello-world-1')
  })

  test('do not update slug when source changes', async ({ assert }) => {
    const db = createDatabase()
    await setupDb(db)

    const slugifyManager = new SlugifyManager(db)
    const slugify = new Slugify(slugifyManager)

    class Post extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare title: string

      @column()
      @slugify.slugifyDecorator({ strategy: 'dbIncrement', fields: ['title'] })
      declare slug: string
    }

    await Post.createMany([
      {
        title: 'Hello world',
        slug: 'hello-world',
      },
      {
        title: 'Hello world',
        slug: 'hello-10-world',
      },
      {
        title: 'Hello world',
        slug: 'hello10world',
      },
    ])

    const post = await Post.findOrFail(1)
    post.title = 'A new title'
    await post.save()

    await post.refresh()
    assert.equal(post.slug, 'hello-world')
  })

  test('update slug when allowUpdates is set to true', async ({ assert }) => {
    const db = createDatabase()
    await setupDb(db)

    const slugifyManager = new SlugifyManager(db)
    const slugify = new Slugify(slugifyManager)

    class Post extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare title: string

      @column()
      @slugify.slugifyDecorator({ strategy: 'dbIncrement', fields: ['title'], allowUpdates: true })
      declare slug: string
    }

    await Post.createMany([
      {
        title: 'Hello world',
        slug: 'hello-world',
      },
      {
        title: 'Hello world',
        slug: 'hello-10-world',
      },
      {
        title: 'Hello world',
        slug: 'hello10world',
      },
    ])

    const post = await Post.findOrFail(1)
    post.title = 'A new title'
    await post.save()

    await post.refresh()
    assert.equal(post.slug, 'a-new-title')
  })

  test('update slug when allowUpdates function returns true', async ({ assert }) => {
    const db = createDatabase()
    await setupDb(db)

    const slugifyManager = new SlugifyManager(db)
    const slugify = new Slugify(slugifyManager)

    class Post extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare title: string

      @column()
      @slugify.slugifyDecorator({
        strategy: 'dbIncrement',
        fields: ['title'],
        allowUpdates: (model: LucidRow) => {
          const post = model as Post
          assert.instanceOf(post, Post)
          return true
        },
      })
      declare slug: string
    }

    await Post.createMany([
      {
        title: 'Hello world',
        slug: 'hello-world',
      },
      {
        title: 'Hello world',
        slug: 'hello-10-world',
      },
      {
        title: 'Hello world',
        slug: 'hello10world',
      },
    ])

    const post = await Post.findOrFail(1)
    post.title = 'A new title'
    await post.save()

    await post.refresh()
    assert.equal(post.slug, 'a-new-title')
  })

  test('do not update slug when allowUpdates function returns false', async ({ assert }) => {
    const db = createDatabase()
    await setupDb(db)

    const slugifyManager = new SlugifyManager(db)
    const slugify = new Slugify(slugifyManager)

    class Post extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare title: string

      @column()
      @slugify.slugifyDecorator({
        strategy: 'dbIncrement',
        fields: ['title'],
        allowUpdates: (model: LucidRow) => {
          const post = model as Post
          assert.instanceOf(post, Post)
          return false
        },
      })
      declare slug: string
    }

    await Post.createMany([
      {
        title: 'Hello world',
        slug: 'hello-world',
      },
      {
        title: 'Hello world',
        slug: 'hello-10-world',
      },
      {
        title: 'Hello world',
        slug: 'hello10world',
      },
    ])

    const post = await Post.findOrFail(1)
    post.title = 'A new title'
    await post.save()

    await post.refresh()
    assert.equal(post.slug, 'hello-world')
  })

  test('do not update slug when defined manually', async ({ assert }) => {
    const db = createDatabase()
    await setupDb(db)

    const slugifyManager = new SlugifyManager(db)
    const slugify = new Slugify(slugifyManager)

    class Post extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare title: string

      @column()
      @slugify.slugifyDecorator({ strategy: 'dbIncrement', fields: ['title'], allowUpdates: true })
      declare slug: string
    }

    await Post.createMany([
      {
        title: 'Hello world',
        slug: 'hello-world',
      },
      {
        title: 'Hello world',
        slug: 'hello-10-world',
      },
      {
        title: 'Hello world',
        slug: 'hello10world',
      },
    ])

    const post = await Post.findOrFail(1)
    post.title = 'A new title'
    post.slug = 'the-old-slug'
    await post.save()

    await post.refresh()
    assert.equal(post.slug, 'the-old-slug')
  })

  test('do not update slug when source is untouched', async ({ assert }) => {
    const db = createDatabase()
    await setupDb(db)

    const slugifyManager = new SlugifyManager(db)
    const slugify = new Slugify(slugifyManager)

    class Post extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare title: string

      @column()
      @slugify.slugifyDecorator({ strategy: 'dbIncrement', fields: ['title'], allowUpdates: true })
      declare slug: string
    }

    await Post.createMany([
      {
        title: 'Hello world',
        slug: 'hello-world',
      },
      {
        title: 'Hello world',
        slug: 'hello-10-world',
      },
      {
        title: 'Hello world',
        slug: 'hello10world',
      },
    ])

    const post = await Post.findOrFail(1)
    await post.save()

    await post.refresh()
    assert.equal(post.slug, 'hello-world')
  })

  test('do not update slug when source is set to null', async ({ assert }) => {
    const db = createDatabase()
    await setupDb(db)

    const slugifyManager = new SlugifyManager(db)
    const slugify = new Slugify(slugifyManager)

    class Post extends BaseModel {
      @column({ isPrimary: true })
      declare id: number

      @column()
      declare title: string | null

      @column()
      @slugify.slugifyDecorator({ strategy: 'dbIncrement', fields: ['title'], allowUpdates: true })
      declare slug: string
    }

    await Post.createMany([
      {
        title: 'Hello world',
        slug: 'hello-world',
      },
      {
        title: 'Hello world',
        slug: 'hello-10-world',
      },
      {
        title: 'Hello world',
        slug: 'hello10world',
      },
    ])

    const post = await Post.findOrFail(1)
    post.title = null
    await post.save()

    await post.refresh()
    assert.equal(post.slug, 'hello-world')
  })
})
