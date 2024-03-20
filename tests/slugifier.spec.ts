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

import { Slugifier } from '../src/slugifier.js'
import { createDatabase, setupDb } from './helpers.js'
import { DbIncrementStrategy } from '../src/strategies/db_increment.js'

test.group('Slugifier', () => {
  test('generate slug for a model', async ({ assert }) => {
    const db = createDatabase()
    await setupDb(db)

    class Post extends BaseModel {
      declare title: string
      declare slug: string
    }
    Post.boot()
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})

    const post = new Post()
    post.title = 'hello world'

    const dbIncrement = new DbIncrementStrategy(db, {
      strategy: 'dbIncrement',
      fields: ['title'],
    })
    const slugifier = new Slugifier(dbIncrement, Post, 'slug', {
      fields: ['title'],
      strategy: 'dbIncrement',
    })

    const slug = await slugifier.makeSlug(post)
    assert.equal(slug, 'hello-world')
  })

  test('generate unique slug when a similar one already exists', async ({ assert }) => {
    const db = createDatabase()
    await setupDb(db)

    class Post extends BaseModel {
      declare title: string
      declare slug: string
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

    const dbIncrement = new DbIncrementStrategy(db, {
      strategy: 'dbIncrement',
      fields: ['title'],
    })
    const slugifier = new Slugifier(dbIncrement, Post, 'slug', {
      fields: ['title'],
      strategy: 'dbIncrement',
    })

    const slug = await slugifier.makeSlug(post)
    assert.equal(slug, 'hello-world-1')
  })

  test('generate slug from multiple columns', async ({ assert }) => {
    const db = createDatabase()
    await setupDb(db)

    class Post extends BaseModel {
      declare title: string
      declare createdAt: string
      declare slug: string
    }

    Post.boot()
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})
    Post.$addColumn('createdAt', {})

    const post = new Post()
    post.title = 'hello world'
    post.createdAt = '2020-10-20'

    const dbIncrement = new DbIncrementStrategy(db, {
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

  test('do not generate slug when one of the columns are not defined', async ({ assert }) => {
    const db = createDatabase()
    await setupDb(db)

    class Post extends BaseModel {
      declare title: string
      declare createdAt: string
      declare slug: string
    }

    Post.boot()
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})
    Post.$addColumn('createdAt', {})

    const post = new Post()
    post.title = 'hello world'

    const dbIncrement = new DbIncrementStrategy(db, {
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

  test('cast booleans to string', async ({ assert }) => {
    const db = createDatabase()
    await setupDb(db)

    class Post extends BaseModel {
      declare title: string
      declare isActive: boolean
      declare slug: string
    }

    Post.boot()
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})
    Post.$addColumn('isActive', {})

    const post = new Post()
    post.title = 'hello world'
    post.isActive = true

    const dbIncrement = new DbIncrementStrategy(db, {
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

  test('cast numbers to string', async ({ assert }) => {
    const db = createDatabase()
    await setupDb(db)

    class Post extends BaseModel {
      declare title: string
      declare teamId: number
      declare slug: string
    }

    Post.boot()
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})
    Post.$addColumn('teamId', {})

    const post = new Post()
    post.title = 'hello world'
    post.teamId = 42

    const dbIncrement = new DbIncrementStrategy(db, {
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
