'use strict'

/**
 * adonis-lucid-slug
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

/**
 * Returns the unique slug by querying the DB for
 * related slugs
 *
 * @method
 *
 * @param  {String} field
 * @param  {String} value
 * @param  {Model} model
 *
 * @return {String}
 */
module.exports = async (field, value) => {
  return `${value}-${require('shortid').generate()}`
}
