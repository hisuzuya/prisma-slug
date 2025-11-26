import { generateRandomString } from './random';

/**
 * 文字列を URL セーフな slug に変換
 *
 * @param text 変換元の文字列
 * @param maxLength 最大長（デフォルト: 255）
 * @returns slug 化された文字列
 */
export function slugify(text: string, maxLength: number = 255): string {
  let slug = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')        // スペースとアンダースコアをハイフンに
    .replace(/[^\w\-]+/g, '')       // 英数字とハイフン以外を削除
    .replace(/\-\-+/g, '-')         // 連続したハイフンを1つに
    .replace(/^-+/, '')             // 先頭のハイフンを削除
    .replace(/-+$/, '');            // 末尾のハイフンを削除

  // 空文字列の場合はランダム文字列を生成
  if (!slug) {
    slug = generateRandomString(8);
  }

  // 最大長を超える場合は切り詰める
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength).replace(/-+$/, '');
  }

  return slug;
}

/**
 * 複数フィールドから slug を生成し、prefix/postfix を適用
 *
 * @param fields 依存フィールド名の配列
 * @param data レコードのデータ
 * @param options オプション
 * @returns 生成された slug
 */
export function generateSlugFromFields(
  fields: string[],
  data: Record<string, unknown>,
  options: {
    prefix?: string;
    postfix?: string;
    maxLength?: number;
  }
): string {
  // 1. フィールドの値を抽出
  const values = fields
    .map(f => {
      const value = data[f];
      return value ? String(value) : '';
    })
    .filter(Boolean);

  // 2. 結合して基本 slug を生成
  const baseSlug = slugify(values.join(' '));

  // 3. prefix/postfix を適用（固定文字列のみ）
  const prefix = options.prefix || '';
  const postfix = options.postfix || '';

  // 4. 最終的な slug を構築
  let finalSlug = [prefix, baseSlug, postfix]
    .filter(Boolean)
    .join('-')
    .replace(/\-\-+/g, '-');

  // 5. 最大長チェック
  const maxLength = options.maxLength ?? 255;
  if (finalSlug.length > maxLength) {
    finalSlug = finalSlug.substring(0, maxLength).replace(/-+$/, '');
  }

  return finalSlug;
}
