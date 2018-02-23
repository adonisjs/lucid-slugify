'use strict'

/**
 * adonis-lucid-slug
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

module.exports = {
  query (query) {
    return process.env.DB === 'pg' ? query.replace(/`/g, '"') : query
  }
}
