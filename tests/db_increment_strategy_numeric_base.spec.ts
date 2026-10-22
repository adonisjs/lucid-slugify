import { test } from '@japa/runner'

import { DbIncrementStrategy } from '../src/strategies/db_increment.js'

function createModelClient(dialect: string, version: string, rows: Record<string, string>[]) {
  const query = {
    select() {
      return this
    },
    whereRaw() {
      return this
    },
    orderBy() {
      return this
    },
    limit() {
      return this
    },
    pojo() {
      return this
    },
    async exec() {
      return rows
    },
  }

  const client = {
    dialect: { name: dialect, version },
    modelQuery() {
      return query
    },
    raw(value: string) {
      return value
    },
  }

  const model = {
    $adapter: { modelClient: () => client },
    $columnsDefinitions: new Map([['slug', { columnName: 'slug' }]]),
  }

  return { row: { constructor: model }, client }
}

test.group('DbIncrementStrategy | numeric base slug', () => {
  for (const dialect of ['mysql', 'postgres']) {
    test(`does not treat digits in an existing base slug as its counter (${dialect})`, async ({
      assert,
    }) => {
      const { row } = createModelClient(dialect, dialect === 'mysql' ? '8.0' : '16.0', [
        { slug: 'article2' },
      ])

      const strategy = new DbIncrementStrategy({ separator: '-' })
      const result = await strategy.makeSlugUnique(row as never, 'slug', 'article2')

      assert.equal(result, 'article2-1')
    })
  }

  test('uses the greatest actual suffix counter when the base ends in digits', async ({
    assert,
  }) => {
    const { row } = createModelClient('postgres', '16.0', [
      { slug: 'article2' },
      { slug: 'article2-4' },
      { slug: 'article2-1' },
    ])

    const strategy = new DbIncrementStrategy({ separator: '-' })
    const result = await strategy.makeSlugUnique(row as never, 'slug', 'article2')

    assert.equal(result, 'article2-5')
  })
})
