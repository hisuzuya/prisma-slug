import * as crypto from 'crypto';

/**
 * セキュアなランダム文字列を生成
 *
 * @param length 文字列の長さ（デフォルト: 8）
 * @returns ランダムな英数字文字列（小文字のみ）
 */
export function generateRandomString(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  // Node.js の crypto モジュールを使用してセキュアに生成
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }

  return result;
}
