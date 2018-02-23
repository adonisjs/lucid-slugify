'use strict'

/**
 * adonis-lucid-slugify
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const test = require('japa')
const Slugify = require('../src/Slugify')
const setup = require('./helpers/setup')
const format = require('./helpers/format')
const { ioc } = require('@adonisjs/fold')

test.group('Slugify', (group) => {
  group.before(async () => {
    await setup.up()
    ioc.bind('Lucid/Slugify', () => {
      return new Slugify()
    })
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

  test('throw exception when options are not defined', (assert) => {
    const Model = use('Model')
    class Post extends Model {
      static boot () {
        super.boot()
        this.addTrait('@provider:Lucid/Slugify', null)
      }
    }

    const fn = () => Post._bootIfNotBooted()
    assert.throw(fn, 'E_INVALID_PARAMETER: Make sure to pass options object as 2nd parameter to Lucid/Slugify trait')
  })

  test('throw exception when fields are defined not strategy is missing', (assert) => {
    const Model = use('Model')
    class Post extends Model {
      static boot () {
        super.boot()
        this.addTrait('@provider:Lucid/Slugify', { fields: { slug: 'title' } })
      }
    }

    const fn = () => Post._bootIfNotBooted()
    assert.throw(fn, 'E_INVALID_PARAMETER: Make sure to pass strategy under options object to Lucid/Slugify trait')
  })

  test('bind beforeCreate and beforeUpdate hooks', (assert) => {
    const Model = use('Model')
    class Post extends Model {
      static boot () {
        super.boot()
        this.addTrait('@provider:Lucid/Slugify', { fields: { slug: 'title' }, strategy: 'dbIncrement' })
      }
    }

    Post._bootIfNotBooted()

    assert.lengthOf(Post.$hooks.before._handlers.create, 1)
    assert.lengthOf(Post.$hooks.before._handlers.update, 1)
  })

  test('before saving the model generate slug for single field', async (assert) => {
    const Model = use('Model')
    class Post extends Model {
      static boot () {
        super.boot()
        this.addTrait('@provider:Lucid/Slugify', {
          fields: { slug: 'title' },
          strategy: 'dbIncrement'
        })
      }
    }

    Post._bootIfNotBooted()
    const post = await Post.create({ title: 'Hello world' })
    assert.equal(post.slug, 'hello-world')
  })

  test('before saving the model generate slug for multiple field', async (assert) => {
    const Model = use('Model')
    class Post extends Model {
      static boot () {
        super.boot()
        this.addTrait('@provider:Lucid/Slugify', {
          fields: {
            slug: 'title',
            'seo-slug': 'seo-title'
          },
          strategy: 'dbIncrement'
        })
      }
    }

    Post._bootIfNotBooted()
    const post = await Post.create({ title: 'Hello world', 'seo-title': 'Greeting from world' })
    assert.equal(post.slug, 'hello-world')
    assert.equal(post['seo-slug'], 'greeting-from-world')
  })

  test('do not generate slug on update when actual field has not been changed', async (assert) => {
    const Model = use('Model')
    class Post extends Model {
      static boot () {
        super.boot()
        this.addTrait('@provider:Lucid/Slugify', {
          fields: {
            slug: 'title',
            'seo-slug': 'seo-title'
          },
          strategy: 'dbIncrement'
        })
      }
    }

    Post._bootIfNotBooted()
    let postQuery = null
    Post.onQuery((query) => (postQuery = query))

    const post = await Post.create({ title: 'Hello world' })
    post['seo-title'] = 'Hey world'
    await post.save()

    assert.equal(postQuery.sql, format.query('update `posts` set `seo-title` = ?, `seo-slug` = ? where `id` = ?'))
    assert.deepEqual(postQuery.bindings, ['Hey world', 'hey-world', post.id])
  })

  test('generate slug on update when actual field has been changed', async (assert) => {
    const Model = use('Model')
    class Post extends Model {
      static boot () {
        super.boot()
        this.addTrait('@provider:Lucid/Slugify', {
          fields: {
            slug: 'title',
            'seo-slug': 'seo-title'
          },
          strategy: 'dbIncrement'
        })
      }
    }

    Post._bootIfNotBooted()
    let postQuery = null
    Post.onQuery((query) => (postQuery = query))

    const post = await Post.create({ title: 'Hello world' })
    post['seo-title'] = 'Hey world'
    post['title'] = 'New world'
    await post.save()

    assert.equal(postQuery.sql, format.query('update `posts` set `title` = ?, `slug` = ?, `seo-title` = ?, `seo-slug` = ? where `id` = ?'))
    assert.deepEqual(postQuery.bindings, ['New world', 'new-world', 'Hey world', 'hey-world', post.id])
  })

  test('do not bind update hook when disableUpdates is passed', (assert) => {
    const Model = use('Model')
    class Post extends Model {
      static boot () {
        super.boot()
        this.addTrait('@provider:Lucid/Slugify', {
          fields: {
            slug: 'title',
            'seo-slug': 'seo-title'
          },
          disableUpdates: true,
          strategy: 'dbIncrement'
        })
      }
    }

    Post._bootIfNotBooted()
    assert.lengthOf(Post.$hooks.before._handlers.create, 1)
    assert.notProperty(Post.$hooks.before._handlers, 'update')
  })

  test('do not bind hooks when fields are not defined', (assert) => {
    const Model = use('Model')
    class Post extends Model {
      static boot () {
        super.boot()
        this.addTrait('@provider:Lucid/Slugify', {
          strategy: 'dbIncrement'
        })
      }
    }

    Post._bootIfNotBooted()
    assert.notProperty(Post.$hooks.before._handlers, 'update')
    assert.notProperty(Post.$hooks.before._handlers, 'create')
  })

  test('define strategy as a raw function', async (assert) => {
    const Model = use('Model')
    class Post extends Model {
      static boot () {
        super.boot()
        this.addTrait('@provider:Lucid/Slugify', {
          fields: { slug: 'title' },
          strategy: function (field, value, modelInstance) {
            return `${modelInstance.author_id}-${value}`
          }
        })
      }
    }

    Post._bootIfNotBooted()

    const post = new Post()
    post.author_id = 10
    post.title = 'Hello world'
    await post.save()

    assert.equal(post.slug, '10-hello-world')
  })
})
