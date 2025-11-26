/**
 * データから指定されたフィールドの値を抽出
 *
 * @param data レコードのデータ
 * @param fieldNames フィールド名の配列
 * @returns フィールド値の配列（空値は除外）
 */
export function extractFieldValues(
  data: Record<string, unknown>,
  fieldNames: string[]
): string[] {
  return fieldNames.map(name => {
    const value = data[name];
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  }).filter(Boolean);
}

/**
 * 指定されたフィールドのいずれかが変更されているかチェック
 *
 * @param data レコードのデータ
 * @param fieldNames フィールド名の配列
 * @returns いずれかのフィールドが変更されている場合 true
 */
export function hasChangedFields(
  data: Record<string, unknown>,
  fieldNames: string[]
): boolean {
  return fieldNames.some(name => data[name] !== undefined);
}

/**
 * 指定されたフィールドがすべて空かチェック
 *
 * @param data レコードのデータ
 * @param fieldNames フィールド名の配列
 * @returns すべて空の場合 true
 */
export function areAllFieldsEmpty(
  data: Record<string, unknown>,
  fieldNames: string[]
): boolean {
  return fieldNames.every(name => {
    const value = data[name];
    return value === null || value === undefined || value === '';
  });
}
