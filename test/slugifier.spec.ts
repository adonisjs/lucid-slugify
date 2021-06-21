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

import { Slugifier } from '../src/Slugifier'
import { DbIncrement } from '../src/Strategies/DbIncrement'
import { setupApplication, fs, setupDb, cleanDb, clearDb } from '../test-helpers'

let app: ApplicationContract

test.group('Slugifier', (group) => {
  group.beforeEach(async () => {
    app = await setupApplication()
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
    const { BaseModel } = app.container.resolveBinding('Adonis/Lucid/Orm')
    const Database = app.container.resolveBinding('Adonis/Lucid/Database')

    class Post extends BaseModel {
      public title: string
      public slug: string
    }
    Post.boot()
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})

    const post = new Post()
    post.title = 'hello world'

    const dbIncrement = new DbIncrement(Database, { strategy: 'dbIncrement', fields: ['title'] })
    const slugifier = new Slugifier(dbIncrement, Post, 'slug', {
      fields: ['title'],
      strategy: 'dbIncrement',
    })

    const slug = await slugifier.makeSlug(post)
    assert.equal(slug, 'hello-world')
  })

  test('generate unique slug when a similar one already exists', async (assert) => {
    const { BaseModel } = app.container.resolveBinding('Adonis/Lucid/Orm')
    const Database = app.container.resolveBinding('Adonis/Lucid/Database')

    class Post extends BaseModel {
      public title: string
      public slug: string
    }
    Post.boot()
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})

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

    const post = new Post()
    post.title = 'hello world'

    const dbIncrement = new DbIncrement(Database, { strategy: 'dbIncrement', fields: ['title'] })
    const slugifier = new Slugifier(dbIncrement, Post, 'slug', {
      fields: ['title'],
      strategy: 'dbIncrement',
    })

    const slug = await slugifier.makeSlug(post)
    assert.equal(slug, 'hello-world-1')
  })

  test('generate slug from multiple columns', async (assert) => {
    const { BaseModel } = app.container.resolveBinding('Adonis/Lucid/Orm')
    const Database = app.container.resolveBinding('Adonis/Lucid/Database')

    class Post extends BaseModel {
      public title: string
      public createdAt: string
      public slug: string
    }

    Post.boot()
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})
    Post.$addColumn('createdAt', {})

    const post = new Post()
    post.title = 'hello world'
    post.createdAt = '2020-10-20'

    const dbIncrement = new DbIncrement(Database, {
      strategy: 'dbIncrement',
      fields: ['title', 'createdAt'],
    })
    const slugifier = new Slugifier(dbIncrement, Post, 'slug', {
      fields: ['title', 'createdAt'],
      strategy: 'dbIncrement',
    })

    const slug = await slugifier.makeSlug(post)
    assert.equal(slug, 'hello-world-2020-10-20')
  })

  test('do not generate slug when one of the columns are not defined', async (assert) => {
    const { BaseModel } = app.container.resolveBinding('Adonis/Lucid/Orm')
    const Database = app.container.resolveBinding('Adonis/Lucid/Database')

    class Post extends BaseModel {
      public title: string
      public createdAt: string
      public slug: string
    }

    Post.boot()
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})
    Post.$addColumn('createdAt', {})

    const post = new Post()
    post.title = 'hello world'

    const dbIncrement = new DbIncrement(Database, {
      strategy: 'dbIncrement',
      fields: ['title', 'createdAt'],
    })
    const slugifier = new Slugifier(dbIncrement, Post, 'slug', {
      fields: ['title', 'createdAt'],
      strategy: 'dbIncrement',
    })

    const slug = await slugifier.makeSlug(post)
    assert.isNull(slug)
  })

  test('cast booleans to string', async (assert) => {
    const { BaseModel } = app.container.resolveBinding('Adonis/Lucid/Orm')
    const Database = app.container.resolveBinding('Adonis/Lucid/Database')

    class Post extends BaseModel {
      public title: string
      public isActive: boolean
      public slug: string
    }

    Post.boot()
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})
    Post.$addColumn('isActive', {})

    const post = new Post()
    post.title = 'hello world'
    post.isActive = true

    const dbIncrement = new DbIncrement(Database, {
      strategy: 'dbIncrement',
      fields: ['title', 'isActive'],
    })
    const slugifier = new Slugifier(dbIncrement, Post, 'slug', {
      fields: ['title', 'isActive'],
      strategy: 'dbIncrement',
    })

    const slug = await slugifier.makeSlug(post)
    assert.equal(slug, 'hello-world-1')
  })

  test('cast numbers to string', async (assert) => {
    const { BaseModel } = app.container.resolveBinding('Adonis/Lucid/Orm')
    const Database = app.container.resolveBinding('Adonis/Lucid/Database')

    class Post extends BaseModel {
      public title: string
      public teamId: number
      public slug: string
    }

    Post.boot()
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})
    Post.$addColumn('teamId', {})

    const post = new Post()
    post.title = 'hello world'
    post.teamId = 42

    const dbIncrement = new DbIncrement(Database, {
      strategy: 'dbIncrement',
      fields: ['title', 'teamId'],
    })
    const slugifier = new Slugifier(dbIncrement, Post, 'slug', {
      strategy: 'dbIncrement',
      fields: ['title', 'teamId'],
    })

    const slug = await slugifier.makeSlug(post)
    assert.equal(slug, 'hello-world-42')
  })
})
