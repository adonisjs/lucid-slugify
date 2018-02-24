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
module.exports = async (field, value, modelInstance) => {
  const primaryKey = modelInstance.constructor.primaryKey
  const query = modelInstance.constructor.queryWithOutScopes()
  const { connectionClient } = query.db

  /**
   * Below are the different queries to be executed based upon the
   * database client in use
   */
  if (['mysql', 'mysql2', 'mariasql'].indexOf(connectionClient) > -1) {
    query.whereRaw(`?? REGEXP ?`, [field, `^${value}(-[0-9]*)?$`])
  } else if (connectionClient === 'pg') {
    query.whereRaw(`?? ~* ?`, [field, `^${value}(-[0-9]*)?$`])
  } else if (['oracle', 'strong-oracle'].indexOf(connectionClient) > -1) {
    query.whereRaw(`REGEXP_LIKE (??, ?)`, [field, `^${value}(-[0-9]*)?$`])
  } else {
    query.where(field, 'like', `${value}%`)
  }

  const [row] = await query.orderBy(primaryKey, 'desc').pluck(field).limit(1)

  if (!row) {
    return value
  }

  const slugTokens = row.split('-')
  const lastNum = Number(slugTokens[slugTokens.length - 1])

  return !lastNum || isNaN(lastNum) ? `${value}-1` : `${value}-${lastNum + 1}`
}
