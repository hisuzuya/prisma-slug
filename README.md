# Prisma Slug Extension

[日本語ドキュメント (Japanese Documentation)](./README.ja.md)

Prisma Client Extension for automatic slug generation with support for prefix/postfix, multiple generation modes, and dependency tracking.

## Features

- 🚀 **Automatic slug generation** from dependent fields
- 🔗 **Prefix/Postfix support** with fixed strings or field references
- 🔄 **Smart updates** - regenerates only when dependent fields change
- ✏️ **Manual override** - respects explicitly provided slug values
- 📏 **Length control** - configurable maximum length (default: 255)
- 🎯 **Type-safe** - fully typed TypeScript implementation
- ⚙️ **Flexible configuration** - per-field and per-model settings

## Installation

```bash
npm install prisma-extension-slug
```

## Quick Start

### 1. Add `/// @slug` annotations to your Prisma schema

```prisma
model Post {
  id    Int    @id @default(autoincrement())
  title String
  slug  String @unique /// @slug(from: ['title']) // titleから自動生成されます
}

model User {
  id        Int    @id @default(autoincrement())
  firstName String
  lastName  String
  username  String @unique /// @slug(from: ['firstName', 'lastName']) // firstName + lastNameから自動生成されます
}
```

### 2. Apply the extension

```typescript
import { PrismaClient } from '@prisma/client';
import { slugExtension } from 'prisma-extension-slug';

// Configuration is automatically loaded from schema.prisma
const prisma = new PrismaClient().$extends(slugExtension());
```

### 3. Use it!

```typescript
// Slug is automatically generated
const post = await prisma.post.create({
  data: {
    title: 'Hello World',
  },
});
console.log(post.slug); // "hello-world"

// Updates regenerate the slug
const updated = await prisma.post.update({
  where: { id: post.id },
  data: { title: 'New Title' },
});
console.log(updated.slug); // "new-title"
```

## Configuration

### Schema Annotation Syntax

Use `/// @slug(options)` comments on the same line as the field definition:

```prisma
model Post {
  title String
  slug  String @unique /// @slug(from: ['title'])
}
```

#### Available Annotation Options

```typescript
/// @slug(from: ['field1', 'field2'])
// Multiple source fields
// Input: { field1: 'Hello', field2: 'World' } → Output: "hello-world"

/// @slug(from: ['title'], prefix: 'blog-')
// Fixed string prefix
// Input: { title: 'My Post' } → Output: "blog-my-post"

/// @slug(from: ['name'], postfix: '-item')
// Fixed string postfix
// Input: { name: 'Product' } → Output: "product-item"

/// @slug(from: ['name'], prefix: 'prod-', postfix: '-item')
// Prefix and postfix combined
// Input: { name: 'Laptop' } → Output: "prod-laptop-item"

/// @slug(from: ['title'], mode: 'auto')
// Generation mode (default)
// Input: { title: 'Hello World' } → Output: "hello-world"

/// @slug(from: ['title'], mode: 'random')
// Generation mode with random suffix
// Input: { title: 'Hello World' } → Output: "hello-world-a3x9k2"

/// @slug(from: ['title'], required: true)
// Require non-empty source fields (throws error if empty)
// Input: { title: '' } → Error: "Required fields [title] for slug field are empty"

/// @slug(from: ['title'], maxLength: 20)
// Override global maxLength
// Input: { title: 'This is a very long title' } → Output: "this-is-a-very-long"
```

#### Generation Modes

**`mode: 'auto'` (default)**
- Generates a clean slug from the source fields without any random suffix
- Example: `"hello-world"` from `title: "Hello World"`
- Best for human-readable URLs and when source fields are already unique

**`mode: 'random'`**
- Appends a random 8-character suffix to the generated slug
- Example: `"hello-world-a3x9k2"` from `title: "Hello World"`
- Useful when:
  - Source fields may have duplicates
  - You need guaranteed uniqueness with short slugs
  - You want to obscure sequential patterns
- Note: Collisions are still possible but rare. See [Handling Unique Constraint Violations](#handling-unique-constraint-violations) for retry logic

#### Complete Example

```prisma
model Product {
  id       Int    @id @default(autoincrement())
  name     String
  category String
  sku      String @unique /// @slug(from: ['name'], prefix: ['category'], mode: 'random', maxLength: 50)
}
```

### Extension Options

```typescript
import { slugExtension } from 'prisma-extension-slug';

const prisma = new PrismaClient().$extends(
  slugExtension({
    schemaPath: './prisma/schema.prisma',  // Optional: custom schema path (default: auto-detect)
    maxLength: 255,                        // Optional: maximum slug length (default: 255)
  })
);
```

**Options:**
- `schemaPath`: Path to your Prisma schema file (auto-detected if not specified)
- `maxLength`: Maximum length for generated slugs (default: 255)

## Examples

### Basic Usage

Schema:
```prisma
model Post {
  id    Int    @id @default(autoincrement())
  title String
  slug  String @unique /// @slug(from: ['title'])
}
```

Code:
```typescript
const prisma = new PrismaClient().$extends(slugExtension());

const post = await prisma.post.create({
  data: { title: 'My First Post' },
});
// post.slug === "my-first-post"
```

### Multiple Source Fields

Schema:
```prisma
model User {
  firstName String
  lastName  String
  username  String @unique /// @slug(from: ['firstName', 'lastName'])
}
```

Code:
```typescript
const user = await prisma.user.create({
  data: {
    firstName: 'John',
    lastName: 'Doe',
  },
});
// user.username === "john-doe"
```

### Fixed Prefix

Schema:
```prisma
model Post {
  title String
  slug  String @unique /// @slug(from: ['title'], prefix: 'blog-')
}
```

Code:
```typescript
const post = await prisma.post.create({
  data: { title: 'Hello' },
});
// post.slug === "blog-hello"
```

### Prefix and Postfix Combined

Schema:
```prisma
model Product {
  name String
  sku  String @unique /// @slug(from: ['name'], prefix: 'prod-', postfix: '-item')
}
```

Code:
```typescript
const product = await prisma.product.create({
  data: {
    name: 'Laptop',
  },
});
// product.sku === "prod-laptop-item"
```

### Manual Override

```typescript
// Explicitly provided slugs are not overwritten
const post = await prisma.post.create({
  data: {
    title: 'Hello World',
    slug: 'custom-slug',
  },
});
// post.slug === "custom-slug" (not "hello-world")
```

### Conditional Regeneration

```typescript
// Slug is only regenerated when dependent fields change
const post = await prisma.post.create({
  data: { title: 'Hello' },
});
// post.slug === "hello"

// Update non-dependent field - slug stays the same
const updated1 = await prisma.post.update({
  where: { id: post.id },
  data: { content: 'New content' },
});
// updated1.slug === "hello" (unchanged)

// Update dependent field - slug is regenerated
const updated2 = await prisma.post.update({
  where: { id: post.id },
  data: { title: 'New Title' },
});
// updated2.slug === "new-title" (changed)
```

## How It Works

The extension uses Prisma's query hooks to intercept `create`, `update`, and `upsert` operations:

1. **On create**: Generates slug from source fields if not manually provided
2. **On update**: Regenerates slug only if dependent fields changed
3. **Smart detection**: Skips generation if slug is explicitly provided
4. **Length control**: Automatically truncates to maximum length
5. **Empty handling**: Uses random string if source fields are empty (unless `required: true`)

## Slug Generation Rules

- Converts to lowercase
- Replaces spaces and underscores with hyphens
- Removes non-alphanumeric characters (except hyphens)
- Removes consecutive hyphens
- Trims leading/trailing hyphens
- Enforces maximum length (truncates and removes trailing hyphens)

## Limitations

### Unique Constraint Handling

Currently, the extension cannot perform automatic retry with suffix incrementation (e.g., `slug-2`, `slug-3`) due to Prisma query hook limitations. The extension relies on database-level unique constraints.

**Recommendation**: Define `@unique` constraint in your Prisma schema and let the database handle uniqueness. If a duplicate slug is generated, Prisma will throw a unique constraint violation error that you can handle in your application code.

#### Handling Unique Constraint Violations

When using `mode: 'random'` with a short `maxLength`, collisions may occur. Here's how to handle them:

```typescript
import { Prisma } from '@prisma/client';

async function createPostWithRetry(data: { title: string }, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await prisma.post.create({ data });
    } catch (error) {
      // Check if it's a unique constraint violation
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        attempt < maxRetries - 1
      ) {
        // Retry - the extension will generate a new random suffix
        continue;
      }
      // If it's not a unique violation or max retries reached, throw the error
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

// Usage
const post = await createPostWithRetry({ title: 'Hello World' });
```

This approach works because each retry triggers a new slug generation with a different random suffix.

### Nested Operations

The extension processes top-level create/update operations. Nested creates (e.g., `create: { ... }` within a relation) will also trigger slug generation.

## TypeScript Support

The extension is fully typed and exports all necessary types:

```typescript
import {
  slugExtension,
  SlugExtensionConfig,
  ModelSlugConfig,
  FieldSlugConfig,
  SlugGenerationError,
  SlugConfigurationError,
} from 'prisma-extension-slug';
```

## Error Handling

```typescript
import { SlugGenerationError, SlugConfigurationError } from 'prisma-extension-slug';

try {
  const post = await prisma.post.create({
    data: { title: '' },  // Empty title with required: true
  });
} catch (error) {
  if (error instanceof SlugConfigurationError) {
    console.error('Configuration error:', error.message);
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Run example
cd example
npm install
npx prisma migrate dev
npx tsx index.ts
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Related

- [Prisma Client Extensions Documentation](https://www.prisma.io/docs/concepts/components/prisma-client/client-extensions)
- [Prisma Schema Documentation](https://www.prisma.io/docs/concepts/components/prisma-schema)
