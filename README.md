# @adonisjs/lucid-slugify

> Use Lucid models to create URL-safe unique slugs and persist them in the database.

<br />

[![gh-workflow-image]][gh-workflow-url] [![npm-image]][npm-url] ![][typescript-image] [![license-image]][license-url]

## Introduction

Generating slugs is easy, but keeping them unique is hard. This package abstracts the hard parts and gives you a simple API to create and persist unique slugs to the database.

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

You can use one of the following strategies to prevent duplicate slugs even when the titles are the same.

### dbIncrement

The `dbIncrement` strategy performs a select query to find similar slugs and appends a counter when a duplicate slug is found. Given you have a database table with the following slugs:

- Creating a post with `slug=hello-world` will result in `hello-world-6`.
- Similarly, creating a post with `slug=introduction-to-social-auth` will result in `introduction-to-social-auth-5`.

```
+----+-----------------------------+-------------------------------+
| id | title                       | slug                          |
+----+-----------------------------+-------------------------------+
| 1  | Hello world                 | hello-world                   |
| 2  | Hello world                 | hello-world-5                 |
| 3  | Hello world                 | hello10world                  |
| 4  | Hello world                 | hello-10-world                |
| 5  | Introduction to social auth | introduction-to-social-auth   |
| 6  | Introduction to social auth | introduction-to-social-auth-4 |
| 7  | Hello world                 | hello-world-2                 |
| 8  | Hello world fanny           | hello-world-fanny             |
| 9  | Hello world                 | post-hello-world              |
| 10 | Hello world                 | post-11am-hello-world11       |
| 11 | Hello world                 | post-11am-hello-world         |
| 12 | Introduction to social auth | introdUction-to-Social-auTH-1 |
+----+-----------------------------+-------------------------------+
```

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

## Available options

Following is the list of available options accepted by the `@slugify` decorator.

<table>
<tr>
  <td colspan="2"><code>{</code></td>
</tr>
<tr>
  <td valign="top"><code>"fields":</code></td>
  <td>
    <p>
    An array of source fields to use for generating the slug. The value of multiple fields is concatenated using the <code>config.separator</code> property.
    </p>
  </td>
</tr>
<tr>
  <td valign="top"><code>"strategy":</code></td>
  <td>
    <p>
    Reference to a pre-existing strategy or a factory function that returns a custom strategy implementation.
    </p>
  </td>
</tr>
<tr>
  <td valign="top"><code>"allowUpdates":</code></td>
  <td>
    <p>
    A boolean to enable updates. <strong>Updates are disabled by default</strong>.
    </p>
  </td>
</tr>
<tr>
  <td valign="top"><code>"maxLength":</code></td>
  <td>
    <p>
    The maximum length for the generated slug. The final slug value can be slightly over the defined <code>maxLength</code> in the following scenarios.
    </p>
    <p>
      <strong>No max length is applied by default.</strong>
    </p>
  <ul>
  <li>
    When <code>completeWords</code> is set to true.
  </li>
  <li>
    When using the <code>dbIncrement</code> strategy. The counter value is appended after trimming the value for the <code>maxLength</code>.
  </li>
  </ul>
  </td>
</tr>
<tr>
  <td valign="top"><code>"completeWords":</code></td>
  <td>
    <p>
    A boolean that forces to complete the words when applying the <code>maxLength</code> property. Completing words will generate a slug larger than the <code>maxLength</code>. So, keep some buffer between the maxLength property and the database storage size.
    </p>
    <p>
      <strong>Complete words are disabled by default.</strong>
    </p>
  </td>
</tr>
<tr>
  <td valign="top"><code>"separator":</code></td>
  <td>
    <p>
    The separator to use for creating the slug. <strong>A dash <code>-</code> is used by default.</strong>
    </p>
  </td>
</tr>
<tr>
  <td valign="top"><code>"transformer":</code></td>
  <td>
    <p>
    A custom function to convert non-string data types to a string value. For example, if the source field from which the slug is generated is a boolean, then we will convert it to <code>"1"</code> or <code>"0"</code>.
    </p>
    <p>
    By defining the <code>transformer</code> property, you can decide how different data types can be converted to a string.
    </p>
  </td>
</tr>
<tr>
  <td colspan="2"><code>}</code></td>
</tr>
</table>

## Using custom strategies

Custom strategies can be used if you want to handle the uniqueness of slugs yourself. A strategy must implement the [SlugifyStrategyContract](https://github.com/adonisjs/lucid-slugify/blob/3.x/src/types.ts#L130).

```ts
import { SlugifyStrategyContract } from '@adonisjs/lucid-slugify/types'

export class MyCustomStrategy implements SlugifyStrategyContract {
  maxLengthBuffer: number = 0

  async makeSlugUnique(modelInstance: LucidRow, field: string, value: string): string {}
}
```

The `makeSlugUnique` method receives the following arguments.

- `modelInstance`: Reference to the model instance that will be persisted in the database
- `field`: The name of the field for which the unique slug will be created.
- `value`: The base value to convert to a unique value.

Once you have created the strategy, you can use it with the `@slugify` decorator, as shown in the following example.

```ts
export default class Post extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  @slugify({
    strategy: () => {
      return new MyCustomStrategy()
    },
    fields: ['title'],
  })
  declare slug: string
}
```

## Self creating slugs

The default implementation used by Lucid slugify for creating slugs works great with English words. However, if you are using Non-Latin alphabets, replace the implementation for creating slugs with a custom one.

You can override the static `slugify` method on the `Slugifier` class. The following code has to be executed only once.

```ts
import { Slugifier } from '@adonisjs/lucid-slugify'

/**
 * Make sure to install the "transliteration" package
 */
import { slugify } from 'transliteration'

Slugifier.slugify = function (value, options) {
  return slugify(value, {
    separator: options.separator,
    lowercase: options.lower,
  })
}
```

## Contributing

One of the primary goals of AdonisJS is to have a vibrant community of users and contributors who believe in the principles of the framework.

We encourage you to read the [contribution guide](https://github.com/adonisjs/.github/blob/main/docs/CONTRIBUTING.md) before contributing to the framework.

## Code of Conduct

To ensure that the AdonisJS community is welcoming to all, please review and abide by the [Code of Conduct](https://github.com/adonisjs/.github/blob/main/docs/CODE_OF_CONDUCT.md).

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
