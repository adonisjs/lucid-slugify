## Registering provider

Make sure to register the slugify provider inside `start/app.js`

```js
const providers = [
  '@adonisjs/lucid-slugify/providers/SlugifyProvider'
]
```

## Usage

Once done you can access register the trait as follows.

```js
const Model = use('Model')

class Post extends Model {
  static boot () {
    this.addTrait('@provider:Lucid/Slugify', {
      fields: {
        slug: 'title'
      },
      strategy: 'dbIncrement'
    })
  }
}
```
