# @adonisjs/lucid-slugify

> Use Lucid models to create URL-safe unique slugs and persist them in the database.

<br />

[![gh-workflow-image]][gh-workflow-url] [![npm-image]][npm-url] ![][typescript-image] [![license-image]][license-url]

## Introduction

Generating slugs is easy, but keeping them unique is hard. This package abstracts the complex parts and gives you a simple API to create and persist unique slugs to the database.

Lucid slugify exports the `@slugify` decorator, which you can use on the model fields to mark them as slugs and define the source fields from which the slug should be generated. Under the hood, the decorator registers `beforeCreate` and `beforeUpdate` hooks to compute the slug and persist it to the database.

In the following example, we mark the `slug` field as the slug and compute its value using the `title` field. We also use the [dbIncrement](#dbincrement) strategy to keep slugs unique.

```ts
import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { slugify } from '@adonisjs/lucid-slugify'

export default class Post extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  @slugify({
    strategy: 'dbIncrement',
    fields: ['title'],
  })
  declare slug: string
}
```

## Installation and usage

You can install the `@adonisjs/lucid-slugify` package from the npm packages registry. Ensure your application uses `@adonisjs/core@6` and `@adonisjs/lucid@21`.

```sh
npm i @adonisjs/lucid-slugify
```

```sh
yarn add @adonisjs/lucid-slugify
```

```sh
pnpm add @adonisjs/lucid-slugify
```

Once done, you can mark a field as a slug using the `@slugify` decorator. Make sure to specify the source field(s) from which the slug should be generated.

```ts
import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

// 👇 Import decorator
import { slugify } from '@adonisjs/lucid-slugify'

export default class Post extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  // 👇 Use it on a column
  @slugify({
    fields: ['title'],
  })
  declare slug: string
}
```

## Uniqueness of slug

In the previous example, if two posts are created with the same `title`, they will have the same `slug` value.

This won't be a problem if you are the only author of your blog since you can always rename titles or might never write two articles with the same title.

However, if it's a community blog or forum, the chances of creating two or more posts with the same title are quite high.

To prevent duplicate slugs, even when the titles are the same, you can use one of the following strategies.

### dbIncrement

The `dbIncrement` strategy performs a select query to find similar slugs and appends a counter when a duplicate slug is found. Given you have a database table with the following slugs:

- Creating a post with `slug=hello-world` will result in `hello-world-6`.
- Similarly, creating a post with `slug=introduction-to-social-auth` will result in `introduction-to-social-auth-5`.

| id  | title                       | slug                          |
| --- | --------------------------- | ----------------------------- |
| 1   | Hello world                 | hello-world                   |
| 2   | Hello world                 | hello-world-5                 |
| 3   | Hello world                 | hello10world                  |
| 4   | Hello world                 | hello-10-world                |
| 5   | Introduction to social auth | introduction-to-social-auth   |
| 6   | Introduction to social auth | introduction-to-social-auth-4 |
| 7   | Hello world                 | hello-world-2                 |
| 8   | Hello world fanny           | hello-world-fanny             |
| 9   | Hello world                 | post-hello-world              |
| 10  | Hello world                 | post-11am-hello-world11       |
| 11  | Hello world                 | post-11am-hello-world         |
| 12  | Introduction to social auth | introdUction-to-Social-auTH-1 |

### shortId

The `shortId` strategy appends a **10-digit short id** to the slug to make it unique. This strategy does not perform any additional database queries.

```ts
export default class Post extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  @slugify({
    strategy: 'shortId',
    fields: ['title'],
  })
  declare slug: string
}
```

```
+----+-------------+------------------------+
| id | title       | slug                   |
+----+-------------+------------------------+
| 1  | Hello world | hello-world-yRPZZIWGgC |
+----+-------------+------------------------+
```

## Updating slugs

By default, slugs are not updated when you update a model instance, and this is how it should be when slugs are used to look up a record, as changing a slug will result in a broken URL.

However, if slugs are not primarily used to look up records, you may want to update them.

You can enable updates by using the `allowUpdates` flag.

```ts
export default class Post extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  @slugify({
    strategy: 'dbIncrement',
    fields: ['title'],
    allowUpdates: true, // 👈
  })
  declare slug: string
}
```

## Null values and slug generation

The `slugify` decorator does not generate slugs when the value of one or more source fields is `undefined` or `null`.

## Available options

## Contributing

One of the primary goals of AdonisJS is to have a vibrant community of users and contributors who believe in the principles of the framework.

We encourage you to read the [contribution guide](https://github.com/adonisjs/.github/blob/main/docs/CONTRIBUTING.md) before contributing to the framework.

## Code of Conduct

In order to ensure that the AdonisJS community is welcoming to all, please review and abide by the [Code of Conduct](https://github.com/adonisjs/.github/blob/main/docs/CODE_OF_CONDUCT.md).

## License

AdonisJS Lucid slugify is open-sourced software licensed under the [MIT license](LICENSE.md).

[gh-workflow-image]: https://img.shields.io/github/actions/workflow/status/adonisjs/lucid-slugify/checks.yml?style=for-the-badge
[gh-workflow-url]: https://github.com/adonisjs/lucid-slugify/actions/workflows/checks.yml 'Github action'
[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[typescript-url]: "typescript"
[npm-image]: https://img.shields.io/npm/v/@adonisjs/lucid-slugify.svg?style=for-the-badge&logo=npm
[npm-url]: https://npmjs.org/package/@adonisjs/lucid-slugify 'npm'
[license-image]: https://img.shields.io/npm/l/@adonisjs/lucid-slugify?color=blueviolet&style=for-the-badge
[license-url]: LICENSE.md 'license'
