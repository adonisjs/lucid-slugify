/*
 * @adonisjs/lucid-slugify
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { setupApplication, fs, setupDb, cleanDb, clearDb } from '../test-helpers'

let app: ApplicationContract

test.group('Slugifier', (group) => {
  group.beforeEach(async () => {
    app = await setupApplication(['../../providers/SlugifyProvider'])
    await setupDb(app.container.resolveBinding('Adonis/Lucid/Database'))
  })

  group.afterEach(async () => {
    await clearDb(app.container.resolveBinding('Adonis/Lucid/Database'))
  })

  group.after(async () => {
    await cleanDb(app.container.resolveBinding('Adonis/Lucid/Database'))
    await fs.cleanup()
  })

  test('generate slug for a model', async (assert) => {
    const { BaseModel, column } = app.container.resolveBinding('Adonis/Lucid/Orm')
    const { slugify } = app.container.resolveBinding('Adonis/Addons/LucidSlugify')

    class Post extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public title: string

      @column()
      @slugify({ strategy: 'dbIncrement', fields: ['title'] })
      public slug: string
    }

    const post = new Post()
    post.title = 'Hello world'
    await post.save()

    await post.refresh()
    assert.equal(post.slug, 'hello-world')
  })

  test('do not set slug when defined manually', async (assert) => {
    const { BaseModel, column } = app.container.resolveBinding('Adonis/Lucid/Orm')
    const { slugify } = app.container.resolveBinding('Adonis/Addons/LucidSlugify')

    class Post extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public title: string

      @column()
      @slugify({ strategy: 'dbIncrement', fields: ['title'] })
      public slug: string
    }

    const post = new Post()
    post.title = 'Hello world'
    post.slug = 'user-defined-slug'
    await post.save()

    await post.refresh()
    assert.equal(post.slug, 'user-defined-slug')
  })

  test('do not set slug when source is undefined', async (assert) => {
    const { BaseModel, column } = app.container.resolveBinding('Adonis/Lucid/Orm')
    const { slugify } = app.container.resolveBinding('Adonis/Addons/LucidSlugify')

    class Post extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public title: string

      @column()
      @slugify({ strategy: 'dbIncrement', fields: ['title'] })
      public slug: string
    }

    const post = new Post()
    await post.save()

    await post.refresh()
    assert.isNull(post.slug)
  })

  test('generate unique slug when a similar one already exists', async (assert) => {
    const { BaseModel, column } = app.container.resolveBinding('Adonis/Lucid/Orm')
    const { slugify } = app.container.resolveBinding('Adonis/Addons/LucidSlugify')

    class Post extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public title: string

      @column({ columnName: 'slug' })
      @slugify({ strategy: 'dbIncrement', fields: ['title'] })
      public aDifferentPropertyName: string
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

  test('do not update slug when source changes', async (assert) => {
    const { BaseModel, column } = app.container.resolveBinding('Adonis/Lucid/Orm')
    const { slugify } = app.container.resolveBinding('Adonis/Addons/LucidSlugify')

    class Post extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public title: string

      @column()
      @slugify({ strategy: 'dbIncrement', fields: ['title'] })
      public slug: string
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

  test('update slug when allowUpdates is set to true', async (assert) => {
    const { BaseModel, column } = app.container.resolveBinding('Adonis/Lucid/Orm')
    const { slugify } = app.container.resolveBinding('Adonis/Addons/LucidSlugify')

    class Post extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public title: string

      @column()
      @slugify({ strategy: 'dbIncrement', fields: ['title'], allowUpdates: true })
      public slug: string
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

  test('do not update slug when defined manually', async (assert) => {
    const { BaseModel, column } = app.container.resolveBinding('Adonis/Lucid/Orm')
    const { slugify } = app.container.resolveBinding('Adonis/Addons/LucidSlugify')

    class Post extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public title: string

      @column()
      @slugify({ strategy: 'dbIncrement', fields: ['title'], allowUpdates: true })
      public slug: string
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

  test('do not update slug when source is untouched', async (assert) => {
    const { BaseModel, column } = app.container.resolveBinding('Adonis/Lucid/Orm')
    const { slugify } = app.container.resolveBinding('Adonis/Addons/LucidSlugify')

    class Post extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public title: string

      @column()
      @slugify({ strategy: 'dbIncrement', fields: ['title'], allowUpdates: true })
      public slug: string
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

  test('do not update slug when source is set to null', async (assert) => {
    const { BaseModel, column } = app.container.resolveBinding('Adonis/Lucid/Orm')
    const { slugify } = app.container.resolveBinding('Adonis/Addons/LucidSlugify')

    class Post extends BaseModel {
      @column({ isPrimary: true })
      public id: number

      @column()
      public title: string | null

      @column()
      @slugify({ strategy: 'dbIncrement', fields: ['title'], allowUpdates: true })
      public slug: string
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
