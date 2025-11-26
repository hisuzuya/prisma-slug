# Prisma Slug Extension

依存フィールドからの自動 slug 生成、プレフィックス/ポストフィックスのサポート、複数の生成モード、依存関係の追跡をサポートする Prisma Client Extension。

## 機能

- 🚀 **自動 slug 生成** - 依存フィールドから自動生成
- 🔗 **プレフィックス/ポストフィックスのサポート** - 固定文字列
- 🔄 **スマート更新** - 依存フィールドが変更された時のみ再生成
- ✏️ **手動オーバーライド** - 明示的に指定された slug 値を尊重
- 📏 **長さ制御** - 設定可能な最大長（デフォルト: 255）
- 🎯 **型安全** - 完全に型付けされた TypeScript 実装
- ⚙️ **柔軟な設定** - フィールドごと、モデルごとの設定

## インストール

```bash
npm install prisma-extension-slug
```

## クイックスタート

### 1. Prisma スキーマに `/// @slug` アノテーションを追加

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

### 2. Extension を適用

```typescript
import { PrismaClient } from "@prisma/client";
import { slugExtension } from "prisma-extension-slug";

// schema.prisma から設定が自動的に読み込まれます
const prisma = new PrismaClient().$extends(slugExtension());
```

### 3. 使用例

```typescript
// slugが自動生成されます
const post = await prisma.post.create({
  data: {
    title: "Hello World",
  },
});
console.log(post.slug); // "hello-world"

// 更新時にslugが再生成されます
const updated = await prisma.post.update({
  where: { id: post.id },
  data: { title: "New Title" },
});
console.log(updated.slug); // "new-title"
```

## 設定

### スキーマアノテーション構文

フィールド定義と同じ行に `/// @slug(options)` コメントを記述します:

```prisma
model Post {
  title String
  slug  String @unique /// @slug(from: ['title'])
}
```

#### 利用可能なアノテーションオプション

```typescript
/// @slug(from: ['field1', 'field2'])
// 複数のソースフィールド
// 入力: { field1: 'Hello', field2: 'World' } → 出力: "hello-world"

/// @slug(from: ['title'], prefix: 'blog-')
// 固定文字列プレフィックス
// 入力: { title: 'My Post' } → 出力: "blog-my-post"

/// @slug(from: ['name'], postfix: '-item')
// 固定文字列ポストフィックス
// 入力: { name: 'Product' } → 出力: "product-item"

/// @slug(from: ['name'], prefix: 'prod-', postfix: '-item')
// プレフィックスとポストフィックスの組み合わせ
// 入力: { name: 'Laptop' } → 出力: "prod-laptop-item"

/// @slug(from: ['title'], mode: 'auto')
// 生成モード（デフォルト）
// 入力: { title: 'Hello World' } → 出力: "hello-world"

/// @slug(from: ['title'], mode: 'random')
// ランダムサフィックス付き生成モード
// 入力: { title: 'Hello World' } → 出力: "hello-world-a3x9k2"

/// @slug(from: ['title'], required: true)
// ソースフィールドが空でないことを要求（空の場合エラー）
// 入力: { title: '' } → エラー: "Required fields [title] for slug field are empty"

/// @slug(from: ['title'], maxLength: 20)
// グローバルmaxLengthを上書き
// 入力: { title: 'This is a very long title' } → 出力: "this-is-a-very-long"
```

#### 生成モード

**`mode: 'auto'` （デフォルト）**
- ソースフィールドからランダムサフィックスなしのクリーンなslugを生成
- 例: `title: "Hello World"` から `"hello-world"`
- 人間が読みやすいURLに最適で、ソースフィールドが既にユニークな場合に使用

**`mode: 'random'`**
- 生成されたslugに8文字のランダムサフィックスを追加
- 例: `title: "Hello World"` から `"hello-world-a3x9k2"`
- 以下の場合に有用:
  - ソースフィールドに重複がある可能性がある
  - 短いslugで確実な一意性が必要
  - 連続パターンを隠したい
- 注意: 衝突は稀ですが可能性があります。リトライロジックについては [ユニーク制約違反の処理](#ユニーク制約違反の処理) を参照してください

#### 完全な例

```prisma
model Product {
  id       Int    @id @default(autoincrement())
  name     String
  category String
  sku      String @unique /// @slug(from: ['name'], prefix: 'prod-', postfix: '-item', mode: 'random', maxLength: 50)
}
```

### Extension オプション

```typescript
import { slugExtension } from "prisma-extension-slug";

const prisma = new PrismaClient().$extends(
  slugExtension({
    schemaPath: "./prisma/schema.prisma", // オプション: カスタムスキーマパス（デフォルト: 自動検出）
    maxLength: 255, // オプション: slug の最大長（デフォルト: 255）
  })
);
```

**オプション:**

- `schemaPath`: Prisma スキーマファイルのパス（指定しない場合は自動検出）
- `maxLength`: 生成される slug の最大長（デフォルト: 255）

## 使用例

### 基本的な使用方法

スキーマ:

```prisma
model Post {
  id    Int    @id @default(autoincrement())
  title String
  slug  String @unique /// @slug(from: ['title'])
}
```

コード:

```typescript
const prisma = new PrismaClient().$extends(slugExtension());

const post = await prisma.post.create({
  data: { title: "My First Post" },
});
// post.slug === "my-first-post"
```

### 複数のソースフィールド

スキーマ:

```prisma
model User {
  firstName String
  lastName  String
  username  String @unique /// @slug(from: ['firstName', 'lastName'])
}
```

コード:

```typescript
const user = await prisma.user.create({
  data: {
    firstName: "John",
    lastName: "Doe",
  },
});
// user.username === "john-doe"
```

### 固定プレフィックス

スキーマ:

```prisma
model Post {
  title String
  slug  String @unique /// @slug(from: ['title'], prefix: 'blog-')
}
```

コード:

```typescript
const post = await prisma.post.create({
  data: { title: "Hello" },
});
// post.slug === "blog-hello"
```

### プレフィックスとポストフィックスの組み合わせ

スキーマ:

```prisma
model Product {
  name String
  sku  String @unique /// @slug(from: ['name'], prefix: 'prod-', postfix: '-item')
}
```

コード:

```typescript
const product = await prisma.product.create({
  data: {
    name: 'Laptop',
  },
});
// product.sku === "prod-laptop-item"
```

### 手動オーバーライド

```typescript
// 明示的に指定されたslugは上書きされません
const post = await prisma.post.create({
  data: {
    title: "Hello World",
    slug: "custom-slug",
  },
});
// post.slug === "custom-slug" ("hello-world"ではない)
```

### 条件付き再生成

```typescript
// slugは依存フィールドが変更された時のみ再生成されます
const post = await prisma.post.create({
  data: { title: "Hello" },
});
// post.slug === "hello"

// 非依存フィールドを更新 - slugは変更されません
const updated1 = await prisma.post.update({
  where: { id: post.id },
  data: { content: "New content" },
});
// updated1.slug === "hello" (変更なし)

// 依存フィールドを更新 - slugが再生成されます
const updated2 = await prisma.post.update({
  where: { id: post.id },
  data: { title: "New Title" },
});
// updated2.slug === "new-title" (変更あり)
```

## 仕組み

Extension は、Prisma のクエリフックを使用して`create`、`update`、`upsert`操作をインターセプトします:

1. **作成時**: 手動で指定されていない場合、ソースフィールドから slug を生成
2. **更新時**: 依存フィールドが変更された場合のみ slug を再生成
3. **スマート検出**: slug が明示的に指定されている場合は生成をスキップ
4. **長さ制御**: 自動的に最大長に切り詰める
5. **空の処理**: ソースフィールドが空の場合、ランダム文字列を使用（`required: true`の場合を除く）

## Slug 生成ルール

- 小文字に変換
- スペースとアンダースコアをハイフンに置換
- 英数字以外の文字を削除（ハイフンを除く）
- 連続するハイフンを削除
- 先頭・末尾のハイフンをトリミング
- 最大長を適用（切り詰めて末尾のハイフンを削除）

## 制限事項

### ユニーク制約の処理

現在、Extension は、Prisma のクエリフック制限により、サフィックスの自動インクリメント（例: `slug-2`、`slug-3`）によるリトライを実行できません。Extension はデータベースレベルのユニーク制約に依存しています。

**推奨**: Prismaスキーマで`@unique`制約を定義し、データベースにユニーク性を処理させてください。重複したslugが生成された場合、Prismaはユニーク制約違反エラーをスローしますので、アプリケーションコードでそれを処理できます。

#### ユニーク制約違反の処理

`mode: 'random'` を短い `maxLength` で使用する場合、衝突が発生する可能性があります。以下のように処理できます：

```typescript
import { Prisma } from '@prisma/client';

async function createPostWithRetry(data: { title: string }, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await prisma.post.create({ data });
    } catch (error) {
      // ユニーク制約違反かチェック
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        attempt < maxRetries - 1
      ) {
        // リトライ - Extension が新しいランダムサフィックスを生成します
        continue;
      }
      // ユニーク違反でない場合、または最大リトライ回数に達した場合はエラーをスロー
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

// 使用例
const post = await createPostWithRetry({ title: 'Hello World' });
```

このアプローチは、各リトライで Extension が異なるランダムサフィックスを持つ新しい slug を生成するため機能します。

### ネストされた操作

Extension は、トップレベルの create/update 操作を処理します。ネストされた create（例: リレーション内の`create: { ... }`）も slug 生成をトリガーします。

## TypeScript サポート

Extension は完全に型付けされており、必要なすべての型をエクスポートしています:

```typescript
import {
  slugExtension,
  SlugExtensionConfig,
  ModelSlugConfig,
  FieldSlugConfig,
  SlugGenerationError,
  SlugConfigurationError,
} from "prisma-extension-slug";
```

## エラーハンドリング

```typescript
import {
  SlugGenerationError,
  SlugConfigurationError,
} from "prisma-extension-slug";

try {
  const post = await prisma.post.create({
    data: { title: "" }, // required: true で空のtitle
  });
} catch (error) {
  if (error instanceof SlugConfigurationError) {
    console.error("設定エラー:", error.message);
  }
}
```

## 開発

```bash
# 依存関係のインストール
npm install

# Extensionのビルド
npm run build

# サンプルの実行
cd example
npm install
npx prisma migrate dev
npx tsx index.ts
```

## ライセンス

MIT

## コントリビューション

コントリビューションを歓迎します！お気軽に Pull Request を提出してください。

## 関連リンク

- [Prisma Client Extensions ドキュメント](https://www.prisma.io/docs/concepts/components/prisma-client/client-extensions)
- [Prisma Schema ドキュメント](https://www.prisma.io/docs/concepts/components/prisma-schema)
