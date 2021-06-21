/*
 * @adonisjs/lucid-slugify
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { DbIncrement } from '../src/Strategies/DbIncrement'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { setupApplication, fs, setupDb, cleanDb, clearDb } from '../test-helpers'

let app: ApplicationContract

test.group('Db Increment Strategy', (group) => {
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

  test('generate slug', async (assert) => {
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
    const uniqueSlug = await dbIncrement.makeSlugUnique(Post, 'slug', 'hello-world')
    assert.equal(uniqueSlug, 'hello-world')
  })

  test('add counter to existing duplicate slug', async (assert) => {
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

    const dbIncrement = new DbIncrement(Database, { strategy: 'dbIncrement', fields: ['title'] })
    const uniqueSlug = await dbIncrement.makeSlugUnique(Post, 'slug', 'hello-world')
    assert.equal(uniqueSlug, 'hello-world-1')
  })

  test('perform case insensitive search', async (assert) => {
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

    const dbIncrement = new DbIncrement(Database, { strategy: 'dbIncrement', fields: ['title'] })
    const uniqueSlug = await dbIncrement.makeSlugUnique(Post, 'slug', 'hello-world')
    assert.equal(uniqueSlug, 'hello-world-1')
  })

  test('ignore in between numeric values when generating counter', async (assert) => {
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

    const dbIncrement = new DbIncrement(Database, { strategy: 'dbIncrement', fields: ['title'] })
    const uniqueSlug = await dbIncrement.makeSlugUnique(Post, 'slug', 'post-11am-hello-world')
    assert.equal(uniqueSlug, 'post-11am-hello-world-1')
  })

  test('generate unique slug when counter was manually tweaked', async (assert) => {
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
    ])

    const dbIncrement = new DbIncrement(Database, { strategy: 'dbIncrement', fields: ['title'] })
    const uniqueSlug = await dbIncrement.makeSlugUnique(Post, 'slug', 'hello-world')
    assert.equal(uniqueSlug, 'hello-world-5')
  })
})

test.group('Db Increment Strategy | custom separator', (group) => {
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

  test('generate slug', async (assert) => {
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

    const dbIncrement = new DbIncrement(Database, {
      strategy: 'dbIncrement',
      fields: ['title'],
      separator: '_',
    })
    const uniqueSlug = await dbIncrement.makeSlugUnique(Post, 'slug', 'hello_world')
    assert.equal(uniqueSlug, 'hello_world')
  })

  test('add counter to existing duplicate slug', async (assert) => {
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

    const dbIncrement = new DbIncrement(Database, {
      strategy: 'dbIncrement',
      fields: ['title'],
      separator: '_',
    })
    const uniqueSlug = await dbIncrement.makeSlugUnique(Post, 'slug', 'hello_world')
    assert.equal(uniqueSlug, 'hello_world_1')
  })

  test('perform case insensitive search', async (assert) => {
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

    const dbIncrement = new DbIncrement(Database, {
      strategy: 'dbIncrement',
      fields: ['title'],
      separator: '_',
    })
    const uniqueSlug = await dbIncrement.makeSlugUnique(Post, 'slug', 'hello_world')
    assert.equal(uniqueSlug, 'hello_world_1')
  })

  test('ignore in between numeric values when generating counter', async (assert) => {
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

    const dbIncrement = new DbIncrement(Database, {
      strategy: 'dbIncrement',
      fields: ['title'],
      separator: '_',
    })
    const uniqueSlug = await dbIncrement.makeSlugUnique(Post, 'slug', 'post_11am_hello_world')
    assert.equal(uniqueSlug, 'post_11am_hello_world_1')
  })

  test('generate unique slug when counter was manually tweaked', async (assert) => {
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

    const dbIncrement = new DbIncrement(Database, {
      strategy: 'dbIncrement',
      fields: ['title'],
      separator: '_',
    })
    const uniqueSlug = await dbIncrement.makeSlugUnique(Post, 'slug', 'hello_world')
    assert.equal(uniqueSlug, 'hello_world_5')
  })
})
