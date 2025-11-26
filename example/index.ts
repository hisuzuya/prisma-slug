import { PrismaClient } from "@prisma/client";
import { slugExtension } from "../dist";
import * as path from "path";

// スキーマファイルから自動的に設定を読み込む
// schema.prisma 内の /// @slug アノテーションが使用されます
const prisma = new PrismaClient().$extends(
  slugExtension({
    // スキーマファイルのパスを明示的に指定（省略可能）
    schemaPath: path.join(__dirname, "prisma", "schema.prisma"),
    // slug の最大長（デフォルト: 255）
    maxLength: 255,
  })
);

async function main() {
  console.log('=== Slug Extension Demo ===\n');

  // データをクリア
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
  await prisma.product.deleteMany();

  // 1. User 作成（firstName + lastName から username を自動生成）
  console.log('1. Creating user...');
  const user1 = await prisma.user.create({
    data: {
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
    },
  });
  console.log(`   User: ${user1.firstName} ${user1.lastName} -> username: "${user1.username}"`);

  // 2. Post 作成（title から slug を自動生成）
  console.log('\n2. Creating posts...');
  const post1 = await prisma.post.create({
    data: {
      title: 'Hello World',
      content: 'This is my first post',
      authorId: user1.id,
    },
  });
  console.log(`   Created: "${post1.title}" -> slug: "${post1.slug}"`);

  // 3. 別の Post を作成
  const post2 = await prisma.post.create({
    data: {
      title: 'Second Post',
      content: 'Another post',
      authorId: user1.id,
    },
  });
  console.log(`   Created: "${post2.title}" -> slug: "${post2.slug}"`);

  // 3. Post 更新（title 変更で slug も自動更新）
  console.log('\n2. Updating post...');
  const updatedPost = await prisma.post.update({
    where: { id: post1.id },
    data: { title: 'Updated Title' },
  });
  console.log(`   Updated: "${updatedPost.title}" -> slug: "${updatedPost.slug}"`);

  // 4. User の username を確認
  console.log('\n3. Fetching user...');
  const user = await prisma.user.findUnique({
    where: { email: 'john@example.com' },
  });
  console.log(`   User: ${user?.firstName} ${user?.lastName} -> username: "${user?.username}"`);

  // 5. Product 作成（category を prefix にした SKU 生成）
  console.log('\n4. Creating products...');
  const product = await prisma.product.create({
    data: {
      name: 'Laptop',
      category: 'electronics',
    },
  });
  console.log(`   Product: "${product.name}" -> SKU: "${product.sku}"`);

  // 6. 手動で slug を指定した場合（自動生成されない）
  console.log('\n5. Creating post with manual slug...');
  const manualPost = await prisma.post.create({
    data: {
      title: 'Manual Slug Post',
      slug: 'my-custom-slug',
      content: 'This post has a manually specified slug',
      authorId: post1.authorId,
    },
  });
  console.log(`   Created: "${manualPost.title}" -> slug: "${manualPost.slug}"`);

  // 7. content のみ更新（slug は変更されない）
  console.log('\n6. Updating post content only (slug should not change)...');
  const contentUpdatedPost = await prisma.post.update({
    where: { id: post2.id },
    data: { content: 'Updated content only' },
  });
  console.log(`   Post: "${contentUpdatedPost.title}" -> slug: "${contentUpdatedPost.slug}" (unchanged)`);

  console.log('\n=== Demo Complete ===');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
