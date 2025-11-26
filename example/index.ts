import { PrismaClient } from "@prisma/client";
import { slugExtension } from "../dist";
import * as path from "path";

// スキーマファイルから自動的に設定を読み込む
const prisma = new PrismaClient().$extends(
  slugExtension({
    schemaPath: path.join(__dirname, "prisma", "schema.prisma"),
    maxLength: 255,
  })
);

// テスト用のアサーション関数
function expect(actual: string, expected: string, testName: string) {
  if (actual === expected) {
    console.log(`✓ ${testName}`);
    console.log(`  実際の値: "${actual}"`);
  } else {
    console.error(`✗ ${testName}`);
    console.error(`  期待値: "${expected}"`);
    console.error(`  実際の値: "${actual}"`);
    throw new Error(`Test failed: ${testName}`);
  }
}

async function main() {
  console.log('=== Slug Extension Validation Tests ===\n');

  let testCount = 0;
  let passedCount = 0;

  try {
    // データをクリア
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    // ========================================
    // テスト1: 複数のソースフィールド
    // @slug(from: ['firstName', 'lastName'])
    // ========================================
    console.log('【テスト1】User: 複数のソースフィールド\n');
    const user1 = await prisma.user.create({
      data: {
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
      },
    });
    expect(user1.username, 'john-doe', '複数フィールドの結合: John + Doe → john-doe');
    testCount++; passedCount++;

    // ========================================
    // テスト2: 1つの投稿で全てのスラグパターンをテスト
    // ========================================
    console.log('\n【テスト2】Post: 1つのレコードで全スラグパターンをテスト\n');
    const post1 = await prisma.post.create({
      data: {
        title: 'Hello World',
        content: 'Test content',
        authorId: user1.id,
      },
    });

    // 基本的なスラグ
    expect(post1.slug, 'hello-world', '基本スラグ: Hello World → hello-world');
    testCount++; passedCount++;

    // プレフィックス付き
    expect(post1.slugWithPrefix, 'blog-hello-world', 'プレフィックス: Hello World → blog-hello-world');
    testCount++; passedCount++;

    // ポストフィックス付き
    expect(post1.slugWithPostfix, 'hello-world-post', 'ポストフィックス: Hello World → hello-world-post');
    testCount++; passedCount++;

    // 両方
    expect(post1.slugWithBoth, 'article-hello-world-item', 'プレフィックス+ポストフィックス: Hello World → article-hello-world-item');
    testCount++; passedCount++;

    // maxLength
    if (post1.slugShort.length <= 20) {
      console.log(`✓ maxLength オーバーライド`);
      console.log(`  スラッグ: "${post1.slugShort}" (長さ: ${post1.slugShort.length} ≤ 20)`);
      testCount++; passedCount++;
    } else {
      throw new Error(`slugShort length ${post1.slugShort.length} exceeds maxLength 20`);
    }

    // mode: 'random'
    console.log(`✓ mode: 'random'`);
    console.log(`  スラッグ: "${post1.slugRandom}"`);
    if (post1.slugRandom && post1.slugRandom.length > 0) {
      testCount++; passedCount++;
    } else {
      throw new Error('slugRandom generation failed');
    }

    // required
    expect(post1.slugRequired, 'hello-world', 'required: Hello World → hello-world');
    testCount++; passedCount++;

    // ========================================
    // テスト3: 特殊文字の除去
    // ========================================
    console.log('\n【テスト3】特殊文字の除去\n');
    const post2 = await prisma.post.create({
      data: {
        title: 'Hello @World! #Test',
        content: 'Special chars',
        authorId: user1.id,
      },
    });
    expect(post2.slug, 'hello-world-test', '特殊文字の除去: Hello @World! #Test → hello-world-test');
    testCount++; passedCount++;

    // ========================================
    // テスト4: 日本語の変換
    // ========================================
    console.log('\n【テスト4】日本語の変換\n');
    const post3 = await prisma.post.create({
      data: {
        title: 'こんにちは世界',
        content: 'Japanese content',
        authorId: user1.id,
      },
    });
    console.log(`✓ 日本語の変換`);
    console.log(`  タイトル: "こんにちは世界", スラッグ: "${post3.slug}"`);
    if (post3.slug && post3.slug.length > 0) {
      testCount++; passedCount++;
    } else {
      throw new Error('Japanese slug generation failed');
    }

    // ========================================
    // テスト5: 空白の正規化
    // ========================================
    console.log('\n【テスト5】空白の正規化\n');
    const post4 = await prisma.post.create({
      data: {
        title: '  Multiple   Spaces   Here  ',
        content: 'Spaces test',
        authorId: user1.id,
      },
    });
    expect(post4.slug, 'multiple-spaces-here', '連続する空白はハイフン1つに: "  Multiple   Spaces   Here  " → multiple-spaces-here');
    testCount++; passedCount++;

    // ========================================
    // テスト6: 手動スラッグ指定
    // ========================================
    console.log('\n【テスト6】手動スラッグ指定\n');
    const post5 = await prisma.post.create({
      data: {
        title: 'Manual Slug Post',
        slug: 'my-custom-slug',
        content: 'Manual slug test',
        authorId: user1.id,
      },
    });
    expect(post5.slug, 'my-custom-slug', '手動指定のスラッグはそのまま使用される');
    testCount++; passedCount++;

    // ========================================
    // テスト7: 更新時のスラグ再生成
    // ========================================
    console.log('\n【テスト7】更新時のスラッグ再生成\n');
    const updatedPost = await prisma.post.update({
      where: { id: post1.id },
      data: { title: 'Updated Title' },
    });
    expect(updatedPost.slug, 'updated-title', 'title 更新で slug も更新: Updated Title → updated-title');
    testCount++; passedCount++;

    // ========================================
    // テスト8: ソースフィールド以外の更新では slug が変更されない
    // ========================================
    console.log('\n【テスト8】ソースフィールド以外の更新\n');
    const beforeSlug = post2.slug;
    const contentUpdatedPost = await prisma.post.update({
      where: { id: post2.id },
      data: { content: 'Updated content only' },
    });
    expect(contentUpdatedPost.slug, beforeSlug, 'content のみの更新では slug は変更されない');
    testCount++; passedCount++;

    // ========================================
    // テスト9: 長いテキストのトリミング
    // ========================================
    console.log('\n【テスト9】長いテキストのトリミング\n');
    const longTitle = 'This is a very long title that exceeds the maximum length and should be truncated properly';
    const post6 = await prisma.post.create({
      data: {
        title: longTitle,
        content: 'Long title test',
        authorId: user1.id,
      },
    });
    if (post6.slug.length <= 255 && post6.slugShort.length <= 20) {
      console.log(`✓ 長いテキストのトリミング`);
      console.log(`  slug: ${post6.slug.length}文字 (≤ 255)`);
      console.log(`  slugShort: ${post6.slugShort.length}文字 (≤ 20)`);
      testCount++; passedCount++;
    } else {
      throw new Error('Slug length validation failed');
    }

    // ========================================
    // テスト10: required: true (空のソースフィールドでエラー)
    // ========================================
    console.log('\n【テスト10】required: true (空のソースフィールドでエラー)\n');
    try {
      await prisma.post.create({
        data: {
          title: '',
          content: 'Empty title test',
          authorId: user1.id,
        },
      });
      throw new Error('Expected error for empty required field');
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('Required fields')) {
        console.log(`✓ required フィールドのバリデーション`);
        console.log(`  空のタイトルで正しくエラーが発生した`);
        testCount++; passedCount++;
      } else {
        throw error;
      }
    }

    // ========================================
    // テスト11: 重複スラッグの処理
    // ========================================
    console.log('\n【テスト11】重複スラッグの処理\n');
    try {
      await prisma.post.create({
        data: {
          title: 'Updated Title', // post1 と同じタイトル
          content: 'Duplicate test',
          authorId: user1.id,
        },
      });
      console.log(`✓ 重複スラッグの処理`);
      console.log(`  同じタイトルでも作成できた`);
      testCount++; passedCount++;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        console.log(`✓ 重複スラッグの処理`);
        console.log(`  ユニーク制約により重複が防止された(期待通り)`);
        testCount++; passedCount++;
      } else {
        throw error;
      }
    }

    // ========================================
    // 全テスト完了
    // ========================================
    console.log('\n========================================');
    console.log(`\n✅ 全テスト完了: ${passedCount}/${testCount} 成功\n`);
    console.log('========================================');

  } catch (error) {
    console.error('\n❌ テストが失敗しました\n');
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
