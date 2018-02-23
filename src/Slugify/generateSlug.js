'use strict'

/**
 * adonis-lucid-slugify
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const slug = require('@slynova/slug')
const GE = require('@adonisjs/generic-exceptions')
const debug = require('debug')('adonis:lucid:slug')

/**
 * Generates slugs for attrs using a strategy
 *
 * @param  {Object} attrs
 * @param  {Object} options.fields
 * @param  {Function} options.strategy
 * @param  {String} model
 *
 * @return {void}
 */
module.exports = async (attrs, targetObject, { fields, strategy }, model) => {
  if (typeof (strategy) !== 'function') {
    throw GE.InvalidArgumentException.invalidParameter('slug strategy must be a function', strategy)
  }

  const fieldsToGenerateSlugsFor = Object.keys(fields).filter((field) => attrs[fields[field]])
  debug('generating slugs for %j', fieldsToGenerateSlugsFor)

  await Promise.all(fieldsToGenerateSlugsFor.map(async (field) => {
    const value = attrs[fields[field]]
    const valueSlug = await strategy(field, slug(value), model)
    targetObject[field] = valueSlug
  }))
}
