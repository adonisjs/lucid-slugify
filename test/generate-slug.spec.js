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
const generateSlug = require('../src/Slugify/generateSlug')
const { shortId } = require('../src/Strategies')
const setup = require('./helpers/setup')

test.group('Generate Slug', (group) => {
  group.before(async () => {
    await setup.up()
  })

  group.after(async () => {
    await setup.down()
  })

  test('throw exception when strategy is not a function', async (assert) => {
    assert.plan(1)

    try {
      await generateSlug({}, {}, { strategy: 'foo' })
    } catch ({ message }) {
      assert.match(message, /E_INVALID_PARAMETER: slug strategy must be a function/)
    }
  })

  test('generate slugs for the defined fields', async (assert) => {
    const attrs = { title: 'hello world' }
    const fields = { slug: 'title' }
    await generateSlug(attrs, attrs, { fields, strategy: shortId })
    assert.property(attrs, 'slug')
    assert.match(attrs.slug, /hello-world-\w+/)
  })

  test('generate slugs for the multiple defined fields', async (assert) => {
    const attrs = { title: 'hello world', seoTitle: 'hey world' }
    const fields = { slug: 'title', seoSlug: 'seoTitle' }
    await generateSlug(attrs, attrs, { fields, strategy: shortId })

    assert.property(attrs, 'slug')
    assert.match(attrs.slug, /hello-world-\w+/)

    assert.property(attrs, 'seoSlug')
    assert.match(attrs.seoSlug, /hey-world-\w+/)
  })

  test('do not generate slug when actual value is not defined', async (assert) => {
    const attrs = { title: 'hello world' }
    const fields = { slug: 'title', seoSlug: 'seoTitle' }
    await generateSlug(attrs, attrs, { fields, strategy: shortId })

    assert.property(attrs, 'slug')
    assert.match(attrs.slug, /hello-world-\w+/)

    assert.notProperty(attrs, 'seoSlug')
  })
})
