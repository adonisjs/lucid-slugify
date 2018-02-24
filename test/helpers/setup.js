'use strict'

/**
 * adonis-lucid-slug
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const path = require('path')
const fs = require('fs')
const { registrar, ioc } = require('@adonisjs/fold')
const { setupResolver, Config } = require('@adonisjs/sink')

module.exports = {
  up: function () {
    setupResolver()
    ioc.bind('Adonis/Src/Config', () => {
      const config = new Config()

      config.set('database', {
        connection: process.env.DB,
        mysql: {
          client: 'mysql',
          connection: {
            host: '127.0.0.1',
            user: 'root',
            password: '',
            database: 'lucid-slug'
          }
        },
        sqlite: {
          client: 'sqlite3',
          connection: {
            filename: path.join(__dirname, 'db.sqlite3')
          }
        },
        pg: {
          client: 'pg',
          connection: {
            host: '127.0.0.1',
            user: 'harminder',
            password: ''
          }
        }
      })

      return config
    })

    return registrar
      .providers([
        '@adonisjs/lucid/providers/LucidProvider'
      ])
      .registerAndBoot()
      .then(() => {
        return ioc.use('Database').schema.createTable('posts', (table) => {
          table.increments()
          table.integer('author_id')
          table.string('title')
          table.string('slug').unique()
          table.string('seo-title')
          table.string('seo-slug').unique()
          table.timestamps()
        })
      })
  },

  down () {
    return ioc
      .use('Database')
      .schema
      .dropTable('posts')
      .then(() => {
        if (process.env.DB === 'sqlite') {
          fs.unlinkSync(path.join(__dirname, 'db.sqlite3'))
        }
      })
  }
}
