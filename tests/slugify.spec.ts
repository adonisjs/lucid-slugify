/*
 * @adonisjs/lucid-slugify
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { FileSystem } from '@japa/file-system'
import { Adapter, BaseModel, column } from '@adonisjs/lucid/orm'

import { slugify } from '../src/decorators/slugify.js'
import { db, dbSetup, seed, SQLITE_BASE_PATH } from './helpers.js'

const fs = new FileSystem(SQLITE_BASE_PATH)

/**
 * Uses dbIncrement strategy
 */
class Post extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  @slugify({
    strategy: 'dbIncrement',
    allowUpdates: true,
    fields: ['title'],
  })
  declare slug: string
}
Post.useAdapter(new Adapter(db))

/**
 * Uses shortId strategy
 */
class Article extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  @slugify({
    strategy: 'shortId',
    allowUpdates: true,
    fields: ['title'],
  })
  declare slug: string
}
Article.useAdapter(new Adapter(db))

/**
 * Uses simple strategy
 */
class Product extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare handle: string

  @column()
  @slugify({
    allowUpdates: true,
    fields: ['handle'],
  })
  declare slug: string
}
Product.useAdapter(new Adapter(db))

test.group('Decorators | slugify | dbIncrement', (group) => {
  group.setup(async () => {
    await fs.mkdir('./')
  })

  group.teardown(async () => {
    await db.manager.closeAll()
    await fs.remove('./')
  })

  test('create unique slug', async ({ assert }) => {
    const connection = db.connection()
    await dbSetup(connection)
    await seed(connection)

    const post = new Post()
    post.title = 'Hello world'
    await post.save()

    assert.equal(post.slug, 'hello-world-6')
  })

  test('update existing slug', async ({ assert }) => {
    const connection = db.connection()
    await dbSetup(connection)
    await seed(connection)

    const post = new Post()
    post.title = 'Hello world'
    await post.save()

    assert.equal(post.slug, 'hello-world-6')

    post.title = 'Hello world fanny'
    await post.save()

    assert.equal(post.slug, 'hello-world-fanny-1')
  })
})

test.group('Decorators | slugify | shortId', (group) => {
  group.setup(async () => {
    await fs.mkdir('./')
  })

  group.teardown(async () => {
    await db.manager.closeAll()
    await fs.remove('./')
  })

  test('create unique slug', async ({ assert }) => {
    const connection = db.connection()
    await dbSetup(connection)

    const article = new Article()
    article.title = 'Hello world'
    await article.save()

    assert.match(article.slug, /hello-world-[a-zA-Z0-9-_]{10,11}/)
  })

  test('update existing slug', async ({ assert }) => {
    const connection = db.connection()
    await dbSetup(connection)

    const article = new Article()
    article.title = 'Hello world'
    await article.save()

    assert.match(article.slug, /hello-world-[a-zA-Z0-9-_]{10,11}/)

    article.title = 'Hello world fanny'
    await article.save()

    assert.match(article.slug, /hello-world-fanny-[a-zA-Z0-9-_]{10,11}/)
  })
})

test.group('Decorators | slugify | simple', (group) => {
  group.setup(async () => {
    await fs.mkdir('./')
  })

  group.teardown(async () => {
    await db.manager.closeAll()
    await fs.remove('./')
  })

  test('do not create unique slugs', async ({ assert }) => {
    const connection = db.connection()
    await dbSetup(connection)

    const product = new Product()
    product.handle = 'Black T-shirt'
    await product.save()

    assert.equal(product.slug, 'black-t-shirt')
  })
})
