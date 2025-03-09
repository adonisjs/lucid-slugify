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
import { Adapter, BaseModel } from '@adonisjs/lucid/orm'

import { db, dbSetup, seed, SQLITE_BASE_PATH } from './helpers.js'
import { DbIncrementStrategy } from '../src/strategies/db_increment.js'

const fs = new FileSystem(SQLITE_BASE_PATH)
class Post extends BaseModel {
  declare id: number
  declare title: string
  declare slug: string
}
Post.useAdapter(new Adapter(db))
Post.boot()
Post.$addColumn('id', { isPrimary: true })
Post.$addColumn('title', {})
Post.$addColumn('slug', {})

test.group('Db increment strategy', (group) => {
  group.setup(async () => {
    await fs.mkdir('./')
  })

  group.teardown(async () => {
    await db.manager.closeAll()
    await fs.remove('./')
  })

  test('create unique slug without any existing data', async ({ assert }) => {
    const connection = db.connection()
    await dbSetup(connection)

    const strategy = new DbIncrementStrategy({ separator: '-' })
    const post = new Post()
    assert.equal(await strategy.makeSlugUnique(post, 'slug', 'hello-world'), 'hello-world')
    assert.equal(
      await strategy.makeSlugUnique(post, 'slug', 'hello-world-fanny'),
      'hello-world-fanny'
    )
    assert.equal(
      await strategy.makeSlugUnique(post, 'slug', 'post-11am-hello-world'),
      'post-11am-hello-world'
    )
    assert.equal(
      await strategy.makeSlugUnique(post, 'slug', 'introduction-to-social-auth'),
      'introduction-to-social-auth'
    )
  })

  test('create unique slug with existing data', async ({ assert }) => {
    const connection = db.connection()
    await dbSetup(connection)
    await seed(connection)

    const strategy = new DbIncrementStrategy({ separator: '-' })
    const post = new Post()
    assert.equal(await strategy.makeSlugUnique(post, 'slug', 'hello-world'), 'hello-world-6')
    assert.equal(
      await strategy.makeSlugUnique(post, 'slug', 'hello-world-fanny'),
      'hello-world-fanny-1'
    )
    assert.equal(
      await strategy.makeSlugUnique(post, 'slug', 'post-11am-hello-world'),
      'post-11am-hello-world-1'
    )
    assert.equal(
      await strategy.makeSlugUnique(post, 'slug', 'introduction-to-social-auth'),
      'introduction-to-social-auth-5'
    )
  })
})
