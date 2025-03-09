/*
 * @adonisjs/lucid-slugify
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { createError } from '@adonisjs/core/exceptions'

export const E_UNSUPPORTED_DB_DIALECT = createError<[string]>(
  '%s dialect is not supported by the "dbIncrement" strategy',
  'E_UNSUPPORTED_DB_DIALECT'
)
