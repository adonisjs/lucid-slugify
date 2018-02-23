'use strict'

/**
 * adonis-lucid-slug
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const test = require('japa')
const { dbIncrement } = require('../src/Strategies')
const setup = require('./helpers/setup')

test.group('db increment', (group) => {
  group.before(async () => {
    await setup.up()
  })

  group.beforeEach(async () => {
    await use('Database').beginGlobalTransaction()
  })

  group.afterEach(() => {
    use('Database').rollbackGlobalTransaction()
  })

  group.after(async () => {
    await setup.down()
  })

  test('generate a unique slug when there is no existing slug', async (assert) => {
    const Model = use('Model')

    class Post extends Model {}
    Post._bootIfNotBooted()

    const slug = await dbIncrement('slug', 'hello-world', new Post())
    assert.equal(slug, 'hello-world')
  })

  test('increment slug when one already exists', async (assert) => {
    const Model = use('Model')
    class Post extends Model {}
    Post._bootIfNotBooted()

    await Post.create({ title: 'Hello world', slug: 'hello-world' })
    const slug = await dbIncrement('slug', 'hello-world', new Post())
    assert.equal(slug, 'hello-world-1')
  })

  test('increment slug based upon the last row', async (assert) => {
    const Model = use('Model')
    class Post extends Model {}
    Post._bootIfNotBooted()

    await Post.create({ title: 'Hello world', slug: 'hello-world' })
    await Post.create({ title: 'Hello world', slug: 'hello-world-2' })

    const slug = await dbIncrement('slug', 'hello-world', new Post())
    assert.equal(slug, 'hello-world-3')
  })

  /**
   * Below are the edge cases SQLITE cannot work with, since REGEXP is not
   * support by sqlite
   */
  if (process.env.DB !== 'sqlite') {
    test('increment when incremental slugs with similar slug exists', async (assert) => {
      const Model = use('Model')
      class Post extends Model {}
      Post._bootIfNotBooted()

      await Post.create({ title: 'Hello world', slug: 'hello-world' })
      await Post.create({ title: 'Hello world', slug: 'hello-world-1' })
      await Post.create({ title: 'Hello world', slug: 'hello-world-finny' })

      const slug = await dbIncrement('slug', 'hello-world', new Post())
      assert.equal(slug, 'hello-world-2')
    })

    test('increment when same slugs with similar slug exists', async (assert) => {
      const Model = use('Model')
      class Post extends Model {}
      Post._bootIfNotBooted()

      await Post.create({ title: 'Hello world', slug: 'hello-world' })
      await Post.create({ title: 'Hello world', slug: 'hello-world-finny' })

      const slug = await dbIncrement('slug', 'hello-world', new Post())
      assert.equal(slug, 'hello-world-1')
    })

    test('return same slugs when similar slug exists', async (assert) => {
      const Model = use('Model')
      class Post extends Model {}
      Post._bootIfNotBooted()

      await Post.create({ title: 'Hello world', slug: 'hello-world-finny' })

      const slug = await dbIncrement('slug', 'hello-world', new Post())
      assert.equal(slug, 'hello-world')
    })
  }
})
