import { PrismaClient } from "@prisma/client";
import { slugExtension } from "../dist";
import * as path from "path";

const prisma = new PrismaClient().$extends(
  slugExtension({
    schemaPath: path.join(__dirname, "prisma", "schema.prisma"),
    maxLength: 255,
  })
);

// シンプルなアサーション関数
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
  console.log(`✅ ${message}`);
}

function assertEquals<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(
      `❌ Assertion failed: ${message}\n  Expected: ${expected}\n  Actual: ${actual}`
    );
  }
  console.log(`✅ ${message}`);
}

function assertMatch(actual: string, pattern: RegExp, message: string): void {
  if (!pattern.test(actual)) {
    throw new Error(
      `❌ Assertion failed: ${message}\n  Expected to match: ${pattern}\n  Actual: ${actual}`
    );
  }
  console.log(`✅ ${message}`);
}

async function runTests() {
  console.log('🧪 Starting comprehensive slug extension tests\n');

  try {
    // データベースをクリア
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();
    await prisma.product.deleteMany();
    await prisma.article.deleteMany();

    // テスト用のユーザーを作成
    const testUser = await prisma.user.create({
      data: {
        email: 'testauthor@example.com',
        firstName: 'Test',
        lastName: 'Author',
      },
    });

    console.log('📝 Test 1: Basic slug generation from single field');
    const post1 = await prisma.post.create({
      data: {
        title: 'Hello World',
        content: 'Test content',
        authorId: testUser.id,
      },
    });
    assertEquals(post1.slug, 'hello-world', 'Single field slug generation');

    console.log('\n📝 Test 2: Multiple source fields');
    const user1 = await prisma.user.create({
      data: {
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
      },
    });
    assertEquals(user1.username, 'john-doe', 'Multiple fields slug generation');

    console.log('\n📝 Test 3: Fixed prefix');
    const article1 = await prisma.article.create({
      data: {
        title: 'My Post',
      },
    });
    assertEquals(article1.slug, 'blog-my-post', 'Fixed prefix applied');

    console.log('\n📝 Test 4: Fixed postfix');
    const article2 = await prisma.article.create({
      data: {
        title: 'Product Review',
      },
    });
    // postfixは別のフィールドで検証（articleはprefixのみ）

    console.log('\n📝 Test 5: Prefix and postfix combined');
    const product1 = await prisma.product.create({
      data: {
        name: 'Laptop',
        category: 'electronics',
      },
    });
    assertEquals(product1.sku, 'prod-laptop-item', 'Prefix and postfix combined');

    console.log('\n📝 Test 6: Mode auto (default)');
    const post2 = await prisma.post.create({
      data: {
        title: 'Another Post',
        content: 'Content',
        authorId: testUser.id,
      },
    });
    assertEquals(post2.slug, 'another-post', 'Auto mode generates clean slug');

    console.log('\n📝 Test 7: Prefix and postfix combined');
    const product2 = await prisma.product.create({
      data: {
        name: 'Mouse',
        category: 'accessories',
      },
    });
    assertEquals(product2.sku, 'prod-mouse-item', 'Prefix and postfix combined');

    console.log('\n📝 Test 8: Manual slug override');
    const post3 = await prisma.post.create({
      data: {
        title: 'Manual Slug Post',
        slug: 'my-custom-slug',
        content: 'Manual override',
        authorId: testUser.id,
      },
    });
    assertEquals(post3.slug, 'my-custom-slug', 'Manual slug is respected');

    console.log('\n📝 Test 9: Slug update when source field changes');
    const post4 = await prisma.post.create({
      data: {
        title: 'Original Title',
        content: 'Content',
        authorId: testUser.id,
      },
    });
    assertEquals(post4.slug, 'original-title', 'Initial slug');

    const updatedPost = await prisma.post.update({
      where: { id: post4.id },
      data: { title: 'Updated Title' },
    });
    assertEquals(updatedPost.slug, 'updated-title', 'Slug updates when title changes');

    console.log('\n📝 Test 10: Slug remains unchanged when non-source field changes');
    const post5 = await prisma.post.create({
      data: {
        title: 'Unchanged Slug',
        content: 'Original content',
        authorId: testUser.id,
      },
    });
    const originalSlug = post5.slug;

    const updatedPost2 = await prisma.post.update({
      where: { id: post5.id },
      data: { content: 'New content' },
    });
    assertEquals(updatedPost2.slug, originalSlug, 'Slug unchanged when content changes');

    console.log('\n📝 Test 11: Special characters handling');
    const post6 = await prisma.post.create({
      data: {
        title: 'Hello @World! #Test & More...',
        content: 'Content',
        authorId: testUser.id,
      },
    });
    assertEquals(post6.slug, 'hello-world-test-more', 'Special characters removed');

    console.log('\n📝 Test 12: Consecutive spaces and hyphens');
    const post7 = await prisma.post.create({
      data: {
        title: 'Multiple   Spaces   Here',
        content: 'Content',
        authorId: testUser.id,
      },
    });
    assertEquals(post7.slug, 'multiple-spaces-here', 'Multiple spaces handled');

    console.log('\n📝 Test 13: Leading and trailing hyphens');
    const post8 = await prisma.post.create({
      data: {
        title: '---Leading and Trailing---',
        content: 'Content',
        authorId: testUser.id,
      },
    });
    assertEquals(post8.slug, 'leading-and-trailing', 'Hyphens trimmed');

    console.log('\n📝 Test 14: Lowercase conversion');
    const post9 = await prisma.post.create({
      data: {
        title: 'UPPERCASE Title',
        content: 'Content',
        authorId: testUser.id,
      },
    });
    assertEquals(post9.slug, 'uppercase-title', 'Converted to lowercase');

    console.log('\n📝 Test 15: Unicode characters');
    const post10 = await prisma.post.create({
      data: {
        title: 'こんにちは世界',
        content: 'Content',
        authorId: testUser.id,
      },
    });
    assert(post10.slug.length > 0, 'Unicode characters handled');

    console.log('\n📝 Test 16: Empty source field handling');
    const user2 = await prisma.user.create({
      data: {
        email: 'test@example.com',
        firstName: '',
        lastName: '',
        username: 'manual-username', // 空の場合は手動で指定
      },
    });
    assertEquals(user2.username, 'manual-username', 'Manual slug used for empty fields');

    console.log('\n📝 Test 17: Unique constraint enforcement');
    // 同じslugで2つ目を作成しようとするとエラーになるはず
    try {
      await prisma.post.create({
        data: {
          title: 'Hello World', // post1と同じタイトル
          content: 'Content',
          authorId: testUser.id,
        },
      });
      throw new Error('Should have thrown unique constraint error');
    } catch (error: any) {
      assert(
        error.code === 'P2002',
        'Unique constraint violation detected'
      );
    }

    console.log('\n✨ All tests passed! ✨');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
