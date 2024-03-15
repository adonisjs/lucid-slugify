/*
 * @adonisjs/lock
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { fileURLToPath } from 'node:url'
import { IgnitorFactory } from '@adonisjs/core/factories'
import Configure from '@adonisjs/core/commands/configure'

const BASE_URL = new URL('../tmp/', import.meta.url)

test.group('Configure', (group) => {
  group.each.setup(({ context }) => {
    context.fs.baseUrl = BASE_URL
    context.fs.basePath = fileURLToPath(BASE_URL)
  })

  group.each.timeout(0)

  test('publish provider and env variables', async ({ assert, fs }) => {
    const ignitor = new IgnitorFactory()
      .withCoreProviders()
      .withCoreConfig()
      .create(fs.baseUrl, {
        importer: (filePath) => {
          if (filePath.startsWith('./') || filePath.startsWith('../')) {
            return import(new URL(filePath, fs.baseUrl).href)
          }

          return import(filePath)
        },
      })

    const app = ignitor.createApp('console')
    await app.init()
    await app.boot()

    await fs.createJson('tsconfig.json', {})
    await fs.create('adonisrc.ts', `export default defineConfig({})`)

    const ace = await app.container.make('ace')
    ace.prompt
      .trap('Select the storage layer you want to use')
      .assertFails('', 'Please select a store')
      .assertPasses('redis')
      .chooseOption(1)

    const command = await ace.create(Configure, ['../index.js'])
    await command.exec()

    await assert.fileContains('adonisrc.ts', '@adonisjs/lucid-slugify/slugify_provider')
  })
})
