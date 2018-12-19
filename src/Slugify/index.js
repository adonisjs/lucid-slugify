'use strict'

/**
 * adonis-lucid-slug
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const GE = require('@adonisjs/generic-exceptions')
const generateSlug = require('./generateSlug')
const Strategies = require('../Strategies')

/**
 * The slugify class is added a trait to any Lucid model. It will
 * register required hooks to auto generate unique slugs.
 *
 * @class Slugify
 *
 * @param {Model} Model
 * @param {Object} options
 */
class Slugify {
  register(Model, options) {
    if (!options || typeof (options) !== 'object') {
      throw GE.InvalidArgumentException.invalidParameter('Make sure to pass options object as 2nd parameter to Lucid/Slugify trait')
    }

    if (options.fields && !options.strategy) {
      throw GE.InvalidArgumentException.invalidParameter('Make sure to pass strategy under options object to Lucid/Slugify trait')
    }

    /**
     * Pulling strategy function
     *
     * @type {void}
     */
    const strategy = typeof (options.strategy) === 'string' ? Strategies[options.strategy] : options.strategy

    /**
     * Fields to be used for generating slug
     */
    const fields = options.fields

    /**
     * Do bind hooks when fields are not defined
     */
    if (!fields) {
      return
    }

    Model.addHook('beforeCreate', async (modelInstance) => {
      Object.keys(fields).map(field => {
        if (modelInstance.$attributes[field] != null) {
          delete fields[field]
        }
      })
      await generateSlug(modelInstance.$attributes, modelInstance.$attributes, { fields, strategy }, modelInstance)
    })

    /**
     * Bind only when updates are not disabled
     */
    if (!options.disableUpdates) {
      Model.addHook('beforeUpdate', async (modelInstance) => {
        Object.keys(fields).map(field => {
          if (modelInstance.dirty[field] != null) {
            delete fields[field]
          }
        })
        await generateSlug(modelInstance.dirty, modelInstance.$attributes, { fields, strategy }, modelInstance)
      })
    }
  }
}

module.exports = Slugify
