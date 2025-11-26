/**
 * Slug 生成時にエラーが発生した場合に投げられる例外
 */
export class SlugGenerationError extends Error {
  constructor(
    public readonly reason: string,
    public readonly attempts?: number
  ) {
    super(
      `Failed to generate unique slug: ${reason}` +
      (attempts ? ` (after ${attempts} attempts)` : '')
    );
    this.name = 'SlugGenerationError';
  }
}

/**
 * Slug Extension の設定が不正な場合に投げられる例外
 */
export class SlugConfigurationError extends Error {
  constructor(message: string) {
    super(`Slug configuration error: ${message}`);
    this.name = 'SlugConfigurationError';
  }
}
