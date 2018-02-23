# Adonis Lucid Slugify

This addon adds the functionality to generate unique `slugs` for multiple fields when saving them to the database using Lucid models.

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Coveralls][coveralls-image]][coveralls-url]

## Installation
Make sure to install it using `adonis install` over `npm` or `yarn`.

```bash
adonis install @adonisjs/lucid-slugify

# yarn
adonis install @adonisjs/lucid-slugify --yarn
```

Next, make sure to read the [instructions.md](instructions.md) file.

## Features ⭐️

1. Url friendly strings.
2. Handles unicode
3. Works seamlessly with updates
4. Uniqueness guaranteed.

## Using trait ✍️

```js
const Model = use('Model')

class Post extends Model {
  static boot () {
    this.addTrait('@provider:Lucid/Slugify', {
      fields: { slug: 'title' },
      strategy: 'dbIncrement',
      disableUpdates: false
    })
  }
}
```

#### Options

<table>
<tr>
  <td colspan="2"><code>{</code></td>
</tr>
<tr>
  <td valign="top"><code>"fields":</code></td>
  <td>
    <p>key/value pair of fields, you want to generate slugs for..</p>
    <p>The <code>key</code> is the slug field and <code>value</code> is the field whose value will be used for generating the slug</p>
  </td>
</tr>
<tr>
  <td valign="top"><code>"strategy":</code></td>
  <td>
    <p>It can be raw function or one of the predefined strategies.</p>
  </td>
</tr>
<tr>
  <td valign="top"><code>"disableUpdates":</code></td>
  <td>
    <p>Depending upon your app, you may never want slugs to change. So disable the <code>update</code> hook.</p>
  </td>
</tr>
<tr>
  <td colspan="2"><code>}</code></td>
</tr>
</table>

## In action 🤾🏻‍♂️
Let's use the post model and generate a new slug.

```js
const post = new Post()
post.title = 'Adonis 101'
await post.save()

console.log(post.slug) // adonis-101
```

On update it will re-generate the slug, only if the value of the actual field has been changed.

```js
const post = await Post().find(1)
await post.save() // noop

post.title = 'A new title'
await post.save() // slug re-generated

console.log(post.slug) // a-new-title
```

## Strategies 👩🏻‍🔬

Generating unique slugs is a hard problem, since each application has unique requirements and constraints. So instead of defining a single strategy to generate slugs, the add-on keeps it flexible to define custom strategies. 

2 different strategies are shipped by default and here's how they work.

---

### dbIncrement

The `dbIncrement` strategy adds a counter to the slugs, when duplicate slugs are found.

**Works great with `mysql` and `pg`, whereas `sqlite` has some edge cases.**

Let's assume a post with `slug -> hello_world` already exists.

```
+----+-------------+-------------+
| id | title       | slug        |
+----+-------------+-------------+
| 1  | Hello world | hello-world |
+----+-------------+-------------+
```

Now if we will add a new slug, it will add `-1`, `-2` respectively to it.

```
+----+-------------+---------------+
| id | title       | slug          |
+----+-------------+---------------+
| 1  | Hello world | hello-world   |
| 2  | Hello world | hello-world-1 |
| 3  | Hello world | hello-world-2 |
+----+-------------+---------------+
```

As mentioned above, this strategy fails in some edge cases when using `sqlite`. Let's take the following database table structure.

```
+----+-------------------+-------------------+
| id | title             | slug              |
+----+-------------------+-------------------+
| 1  | Hello world       | hello-world       |
| 2  | Hello world       | hello-world-1     |
| 3  | Hello world       | hello-world-2     |
| 4  | Hello world fanny | hello-world-fanny |
+----+-------------------+-------------------+
```

In sqlite adding a new post with **Hello world** title will fail and here's why.

1. The strategy will find latest row from the database matching `slug LIKE hello-world%`.
2. The return row will be `hello-world-fanny` and not `hello-world-2` and hence the counter logic will fail.
3. In **MySQL** and **PostgreSQL**, we make use of **Regular expressions** `REGEXP ^hello-world(-[0-9*])?$` and pull the correct row.


---

### shortId

This strategy works great regardless of the database engine in use, the only downside is, the URL's are not as pretty as `dbIncrement` strategy.

**Make sure to install [shortid](https://www.npmjs.com/package/shortid) as dependency before using it**

```
+----+-------------+----------------------+
| id | title       | slug                 |
+----+-------------+----------------------+
| 1  | Hello world | hello-world-23TplPdS |
+----+-------------+----------------------+
```

The random number after the actual slug is generated using [shortid](https://www.npmjs.com/package/shortid) and it ensures uniqueness.

## Defining custom strategies 👨🏻‍💻

You can define your strategies just by defining a function, and here's what a strategy is responsible for.

1. It receives the base slug generated by the core library.
2. It should return back a string ensuring the return value is unique.

```js
this.addTrait('@provider:Lucid/Slugify', {
  fields: { slug: 'title' },
  strategy: async (field, value, modelInstance) => {
    return `${modelInstance.author_id}-${value}`
  }
})
```

The above is a simple implementation where we prepend the `author_id` to slug and ofcourse, we assumed that `author_id` will be set on the model instance.

```js
const post = new Post()
post.author_id = auth.user.id

post.title = 'Spacex Launch'
await post.save()

console.log(post.slug) // 1-spacex-launch
```

## How about more strategies?
You just need to find the one that fits your needs. Wordpress has been generating slugs for years and here's a screenshot of options they give.

![](http://res.cloudinary.com/adonisjs/image/upload/q_100/v1519408955/wp-slug-options_viughs.png)

## Tests
The code is tested with `mysql`, `pg` and `sqlite` only. Tests are written using [japa](https://github.com/thetutlage/japa).


[npm-image]: https://img.shields.io/npm/v/@adonisjs/lucid-slugify.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@adonisjs/lucid-slugify

[travis-image]: https://img.shields.io/travis/adonisjs/adonis-lucid-slugify/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/adonisjs/adonis-lucid-slugify

[coveralls-image]: https://img.shields.io/coveralls/adonisjs/adonis-lucid-slugify/develop.svg?style=flat-square
[coveralls-url]: https://coveralls.io/github/adonisjs/adonis-lucid-slugify
