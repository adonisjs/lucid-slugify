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

import { DbIncrementStrategy } from '../src/strategies/db_increment.js'
import { createDatabase, setupDb } from './helpers.js'

test.group('Db Increment Strategy', () => {
  test('generate slug', async ({ assert }) => {
    const db = createDatabase()
    await setupDb(db)

    class Post extends BaseModel {
      declare title: string
      declare slug: string
    }

    Post.boot()
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})

    const dbIncrement = new DbIncrementStrategy(db, {
      strategy: 'dbIncrement',
      fields: ['title'],
    })
    const uniqueSlug = await dbIncrement.makeSlugUnique(Post, 'slug', 'hello-world')
    assert.equal(uniqueSlug, 'hello-world')
  })

  test('add counter to existing duplicate slug', async ({ assert }) => {
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

    const dbIncrement = new DbIncrementStrategy(db, {
      strategy: 'dbIncrement',
      fields: ['title'],
    })
    const uniqueSlug = await dbIncrement.makeSlugUnique(Post, 'slug', 'hello-world')
    assert.deepEqual(uniqueSlug, 'hello-world-1')
  })

  test('perform case insensitive search', async ({ assert }) => {
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
        slug: 'heLlo-World',
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

    const dbIncrement = new DbIncrementStrategy(db, {
      strategy: 'dbIncrement',
      fields: ['title'],
    })
    const uniqueSlug = await dbIncrement.makeSlugUnique(Post, 'slug', 'hello-world')
    assert.equal(uniqueSlug, 'hello-world-1')
  })

  test('ignore in between numeric values when generating counter', async ({ assert }) => {
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
        slug: 'post-hello-world',
      },
      {
        title: 'Hello world',
        slug: 'post-11am-hello-world11',
      },
      {
        title: 'Hello world',
        slug: 'post-11am-hello-world',
      },
    ])

    const dbIncrement = new DbIncrementStrategy(db, {
      strategy: 'dbIncrement',
      fields: ['title'],
    })
    const uniqueSlug = await dbIncrement.makeSlugUnique(Post, 'slug', 'post-11am-hello-world')
    assert.equal(uniqueSlug, 'post-11am-hello-world-1')
  })

  test('generate unique slug when counter was manually tweaked', async ({ assert }) => {
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
        title: 'Hello world 1',
        slug: 'hello-world-1',
      },
      {
        title: 'Hello world 4',
        slug: 'hello-world-4',
      },
      {
        title: 'Hello world fanny',
        slug: 'hello-world-fanny',
      },
    ])

    const dbIncrement = new DbIncrementStrategy(db, {
      strategy: 'dbIncrement',
      fields: ['title'],
    })
    const uniqueSlug = await dbIncrement.makeSlugUnique(Post, 'slug', 'hello-world')
    assert.equal(uniqueSlug, 'hello-world-5')
  })
})

test.group('Db Increment Strategy | custom separator', () => {
  test('generate slug', async ({ assert }) => {
    const db = createDatabase()
    await setupDb(db)

    class Post extends BaseModel {
      declare title: string
      declare slug: string
    }
    Post.boot()
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})

    const dbIncrement = new DbIncrementStrategy(db, {
      strategy: 'dbIncrement',
      fields: ['title'],
      separator: '_',
    })
    const uniqueSlug = await dbIncrement.makeSlugUnique(Post, 'slug', 'hello_world')
    assert.equal(uniqueSlug, 'hello_world')
  })

  test('add counter to existing duplicate slug', async ({ assert }) => {
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
        slug: 'hello_world',
      },
      {
        title: 'Hello world',
        slug: 'hello_10_world',
      },
      {
        title: 'Hello world',
        slug: 'hello10world',
      },
    ])

    const dbIncrement = new DbIncrementStrategy(db, {
      strategy: 'dbIncrement',
      fields: ['title'],
      separator: '_',
    })
    const uniqueSlug = await dbIncrement.makeSlugUnique(Post, 'slug', 'hello_world')
    assert.equal(uniqueSlug, 'hello_world_1')
  })

  test('perform case insensitive search', async ({ assert }) => {
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
        slug: 'heLlo_World',
      },
      {
        title: 'Hello world',
        slug: 'hello_10_world',
      },
      {
        title: 'Hello world',
        slug: 'hello10world',
      },
    ])

    const dbIncrement = new DbIncrementStrategy(db, {
      strategy: 'dbIncrement',
      fields: ['title'],
      separator: '_',
    })
    const uniqueSlug = await dbIncrement.makeSlugUnique(Post, 'slug', 'hello_world')
    assert.equal(uniqueSlug, 'hello_world_1')
  })

  test('ignore in between numeric values when generating counter', async ({ assert }) => {
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
        slug: 'post_hello_world',
      },
      {
        title: 'Hello world',
        slug: 'post_11am_hello_world11',
      },
      {
        title: 'Hello world',
        slug: 'post_11am_hello_world',
      },
    ])

    const dbIncrement = new DbIncrementStrategy(db, {
      strategy: 'dbIncrement',
      fields: ['title'],
      separator: '_',
    })
    const uniqueSlug = await dbIncrement.makeSlugUnique(Post, 'slug', 'post_11am_hello_world')
    assert.equal(uniqueSlug, 'post_11am_hello_world_1')
  })

  test('generate unique slug when counter was manually tweaked', async ({ assert }) => {
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
        slug: 'hello_world',
      },
      {
        title: 'Hello world 1',
        slug: 'hello_world_1',
      },
      {
        title: 'Hello world 4',
        slug: 'hello_world_4',
      },
    ])

    const dbIncrement = new DbIncrementStrategy(db, {
      strategy: 'dbIncrement',
      fields: ['title'],
      separator: '_',
    })
    const uniqueSlug = await dbIncrement.makeSlugUnique(Post, 'slug', 'hello_world')
    assert.equal(uniqueSlug, 'hello_world_5')
  })
})
