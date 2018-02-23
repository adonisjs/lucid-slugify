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
const { shortId } = require('../src/Strategies')

test.group('short id', (group) => {
  test('append short id to the slug', async (assert) => {
    const slug = await shortId('slug', 'hello-world')
    assert.match(slug, /hello-world-\w+/)
  })

  test('generate different shortid within same span', async (assert) => {
    const slug = await shortId('slug', 'hello-world')
    const slug1 = await shortId('slug', 'hello-world')
    const slug2 = await shortId('slug', 'hello-world')
    const slug3 = await shortId('slug', 'hello-world')

    assert.notEqual(slug, slug1)
    assert.notEqual(slug, slug2)
    assert.notEqual(slug, slug3)
    assert.notEqual(slug1, slug2)
    assert.notEqual(slug1, slug3)
    assert.notEqual(slug2, slug3)
  })
})
