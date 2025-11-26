/**
 * Extension の設定
 */
export type SlugExtensionConfig = {
  /**
   * unique制約エラー時の最大リトライ回数
   * @default 10
   */
  maxRetries?: number;

  /**
   * リトライ間隔（ms）
   * @default 100
   */
  retryDelay?: number;

  /**
   * デフォルト生成モード
   * - 'auto': 数値インクリメント (hello-world-2, hello-world-3)
   * - 'random': ランダム文字列 (hello-world-a3x9k2)
   * @default 'auto'
   */
  defaultGenerationMode?: 'auto' | 'random';

  /**
   * ランダム文字列の長さ
   * @default 8
   */
  randomLength?: number;

  /**
   * slug の最大長
   * @default 255
   */
  maxLength?: number;

  /**
   * モデルごとの設定
   */
  models?: Record<string, ModelSlugConfig>;
}

/**
 * モデルごとの slug 設定
 */
export type ModelSlugConfig = {
  /**
   * フィールド名をキーとした slug 設定のマップ
   */
  fields: Record<string, FieldSlugConfig>;
}

/**
 * フィールドごとの slug 設定
 */
export type FieldSlugConfig = {
  /**
   * slug の生成元となる依存フィールド名の配列
   * 例: ['title'] または ['firstName', 'lastName']
   */
  from: string[];

  /**
   * slug の prefix（固定文字列のみ）
   * 例: 'blog-'
   */
  prefix?: string;

  /**
   * slug の postfix（固定文字列のみ）
   * 例: '-item'
   */
  postfix?: string;

  /**
   * 生成モード
   * - 'auto': 数値インクリメント
   * - 'random': ランダム文字列
   * @default config.defaultGenerationMode
   */
  mode?: 'auto' | 'random';

  /**
   * unique制約の有無
   * true の場合、重複時に自動的にリトライして一意な slug を生成
   * @default true
   */
  unique?: boolean;

  /**
   * 依存フィールドが空の場合にエラーを投げるか
   * - true: エラーを投げる
   * - false: ランダム文字列を生成
   * @default false
   */
  required?: boolean;

  /**
   * このフィールド固有の最大長
   * 指定しない場合は config.maxLength を使用
   */
  maxLength?: number;
}
