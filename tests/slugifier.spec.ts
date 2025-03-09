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
import type { LucidRow } from '@adonisjs/lucid/types/model'

import { Slugifier } from '../src/slugifier.js'

const NOOP_STRATEGY = {
  maxLengthBuffer: 0,
  async makeSlugUnique(_: LucidRow, __: string, value: string) {
    return value
  },
}

test.group('Slugifier | makeSlug', () => {
  test('generate slug for a model', async ({ assert }) => {
    class Post extends BaseModel {
      declare title: string
      declare slug: string
    }
    Post.boot()
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})

    const post = new Post()
    post.title = 'hello world'

    const slugifier = new Slugifier(Post, 'slug', NOOP_STRATEGY, { fields: ['title'] })
    const slug = await slugifier.makeSlug(post)
    assert.equal(slug, 'hello-world')
  })

  test('generate slug using multiple columns', async ({ assert }) => {
    class Post extends BaseModel {
      declare seriesName: string
      declare title: string
      declare slug: string
    }
    Post.boot()
    Post.$addColumn('seriesName', {})
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})

    const post = new Post()
    post.title = 'hello world'
    post.seriesName = 'Introduction to the world'

    const slugifier = new Slugifier(Post, 'slug', NOOP_STRATEGY, {
      fields: ['seriesName', 'title'],
    })
    const slug = await slugifier.makeSlug(post)
    assert.equal(slug, 'introduction-to-the-world-hello-world')
  })

  test('return null when the value for one of the fields is null', async ({ assert }) => {
    class Post extends BaseModel {
      declare seriesName: string | null
      declare title: string
      declare slug: string
    }
    Post.boot()
    Post.$addColumn('seriesName', {})
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})

    const post = new Post()
    post.title = 'hello world'
    post.seriesName = null

    const slugifier = new Slugifier(Post, 'slug', NOOP_STRATEGY, {
      fields: ['seriesName', 'title'],
    })
    const slug = await slugifier.makeSlug(post)
    assert.isNull(slug)
  })

  test('return null when the value for one of the fields is undefined', async ({ assert }) => {
    class Post extends BaseModel {
      declare seriesName: string | null
      declare title: string
      declare slug: string
    }
    Post.boot()
    Post.$addColumn('seriesName', {})
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})

    const post = new Post()
    post.title = 'hello world'

    const slugifier = new Slugifier(Post, 'slug', NOOP_STRATEGY, {
      fields: ['seriesName', 'title'],
    })
    const slug = await slugifier.makeSlug(post)
    assert.isNull(slug)
  })

  test('cast non-string values to a string', async ({ assert }) => {
    class Post extends BaseModel {
      declare title: string
      declare isPromoted: boolean
      declare promotionId: number
      declare createdAt: Date
      declare slug: string
    }
    Post.boot()
    Post.$addColumn('title', {})
    Post.$addColumn('isPromoted', {})
    Post.$addColumn('promotionId', {})
    Post.$addColumn('createdAt', {})
    Post.$addColumn('slug', {})

    const post = new Post()
    post.title = 'hello world'
    post.isPromoted = true
    post.promotionId = 1
    post.createdAt = new Date()

    const slugifier = new Slugifier(Post, 'slug', NOOP_STRATEGY, {
      fields: ['title', 'isPromoted', 'promotionId', 'createdAt'],
    })
    const slug = await slugifier.makeSlug(post)
    assert.equal(
      slug,
      `hello-world-1-1-${post.createdAt
        .toJSON()
        .replace(/[:\.]+/g, '')
        .toLowerCase()}`
    )
  })

  test('cast non-string values using a custom transform function', async ({ assert }) => {
    class Post extends BaseModel {
      declare title: string
      declare isPromoted: boolean
      declare promotionId: number
      declare createdAt: Date
      declare slug: string
    }
    Post.boot()
    Post.$addColumn('title', {})
    Post.$addColumn('isPromoted', {})
    Post.$addColumn('promotionId', {})
    Post.$addColumn('createdAt', {})
    Post.$addColumn('slug', {})

    const post = new Post()
    post.title = 'hello world'
    post.isPromoted = true
    post.promotionId = 1
    post.createdAt = new Date()

    const slugifier = new Slugifier(Post, 'slug', NOOP_STRATEGY, {
      fields: ['title', 'isPromoted', 'promotionId', 'createdAt'],
      transformer(_, __, value) {
        if (value instanceof Date) {
          return value.toISOString()
        }
        return String(value)
      },
    })
    const slug = await slugifier.makeSlug(post)
    assert.equal(
      slug,
      `hello-world-true-1-${post.createdAt
        .toISOString()
        .replace(/[:\.]+/g, '')
        .toLowerCase()}`
    )
  })

  test('truncate value at maxLength', async ({ assert }) => {
    class Post extends BaseModel {
      declare title: string
      declare slug: string
    }
    Post.boot()
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})

    const post = new Post()
    post.title = 'Introduction to AdonisJS'

    const slugifier = new Slugifier(Post, 'slug', NOOP_STRATEGY, {
      fields: ['title'],
      maxLength: 10,
      completeWords: true,
    })
    const slug = await slugifier.makeSlug(post)
    assert.equal(slug, 'introduction')
  })
})

test.group('Slugifier | createSlug', () => {
  test('set slug property', async ({ assert }) => {
    class Post extends BaseModel {
      declare title: string
      declare slug: string
    }
    Post.boot()
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})

    const post = new Post()
    post.title = 'hello world'

    const slugifier = new Slugifier(Post, 'slug', NOOP_STRATEGY, { fields: ['title'] })
    await slugifier.createSlug(post)
    assert.equal(post.slug, 'hello-world')
  })

  test('do not set slug property when already defined manually', async ({ assert }) => {
    class Post extends BaseModel {
      declare title: string
      declare slug: string
    }
    Post.boot()
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})

    const post = new Post()
    post.title = 'hello world'
    post.slug = 'foo-world'

    const slugifier = new Slugifier(Post, 'slug', NOOP_STRATEGY, { fields: ['title'] })
    await slugifier.createSlug(post)
    assert.equal(post.slug, 'foo-world')
  })

  test('do not set slug property when one of the sources are not defined', async ({ assert }) => {
    class Post extends BaseModel {
      declare title: string
      declare slug: string
    }
    Post.boot()
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})

    const post = new Post()

    const slugifier = new Slugifier(Post, 'slug', NOOP_STRATEGY, { fields: ['title'] })
    await slugifier.createSlug(post)
    assert.isUndefined(post.slug)
  })
})

test.group('Slugifier | updateSlug', () => {
  test('update slug property when one of its source value has been changed', async ({ assert }) => {
    class Post extends BaseModel {
      declare seriesName: string
      declare title: string
      declare slug: string
    }
    Post.boot()
    Post.$addColumn('seriesName', {})
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})

    const post = new Post()
    post.seriesName = '101 introduction'
    post.title = 'hello world'
    post.slug = 'hello-world'
    post.$isPersisted = true
    post.$hydrateOriginals()

    post.title = 'hi world'

    const slugifier = new Slugifier(Post, 'slug', NOOP_STRATEGY, {
      fields: ['seriesName', 'title'],
      allowUpdates: true,
    })
    await slugifier.updateSlug(post)
    assert.equal(post.slug, '101-introduction-hi-world')
  })

  test('do not update slug when none of its sources have not been modified', async ({ assert }) => {
    class Post extends BaseModel {
      declare seriesName: string
      declare title: string
      declare slug: string
    }
    Post.boot()
    Post.$addColumn('seriesName', {})
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})

    const post = new Post()
    post.seriesName = '101 introduction'
    post.title = 'hello world'
    post.slug = 'hello-world'
    post.$isPersisted = true
    post.$hydrateOriginals()

    const slugifier = new Slugifier(Post, 'slug', NOOP_STRATEGY, {
      fields: ['seriesName', 'title'],
      allowUpdates: true,
    })
    await slugifier.updateSlug(post)
    assert.equal(post.slug, 'hello-world')
  })

  test('update slug when one all of its sources have not been modified', async ({ assert }) => {
    class Post extends BaseModel {
      declare seriesName: string
      declare title: string
      declare slug: string
    }
    Post.boot()
    Post.$addColumn('seriesName', {})
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})

    const post = new Post()
    post.seriesName = '101 introduction'
    post.title = 'hello world'
    post.slug = 'hello-world'
    post.$isPersisted = true
    post.$hydrateOriginals()

    post.title = 'hi world'
    post.seriesName = '101 introductions'

    const slugifier = new Slugifier(Post, 'slug', NOOP_STRATEGY, {
      fields: ['seriesName', 'title'],
      allowUpdates: true,
    })
    await slugifier.updateSlug(post)
    assert.equal(post.slug, '101-introductions-hi-world')
  })

  test('do not perform update when allowUpdates are disabled', async ({ assert }) => {
    class Post extends BaseModel {
      declare seriesName: string
      declare title: string
      declare slug: string
    }
    Post.boot()
    Post.$addColumn('seriesName', {})
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})

    const post = new Post()
    post.seriesName = '101 introduction'
    post.title = 'hello world'
    post.slug = 'hello-world'
    post.$isPersisted = true
    post.$hydrateOriginals()

    post.title = 'hi world'
    post.seriesName = '101 introductions'

    const slugifier = new Slugifier(Post, 'slug', NOOP_STRATEGY, {
      fields: ['seriesName', 'title'],
      allowUpdates: () => false,
    })
    await slugifier.updateSlug(post)
    assert.equal(post.slug, 'hello-world')
  })

  test('do not perform update when slug property is modified manually', async ({ assert }) => {
    class Post extends BaseModel {
      declare seriesName: string
      declare title: string
      declare slug: string
    }
    Post.boot()
    Post.$addColumn('seriesName', {})
    Post.$addColumn('title', {})
    Post.$addColumn('slug', {})

    const post = new Post()
    post.seriesName = '101 introduction'
    post.title = 'hello world'
    post.slug = 'hello-world'
    post.$isPersisted = true
    post.$hydrateOriginals()

    post.title = 'hi world'
    post.seriesName = '101 introductions'
    post.slug = 'hi-world'

    const slugifier = new Slugifier(Post, 'slug', NOOP_STRATEGY, {
      fields: ['seriesName', 'title'],
      allowUpdates: () => true,
    })
    await slugifier.updateSlug(post)
    assert.equal(post.slug, 'hi-world')
  })
})
