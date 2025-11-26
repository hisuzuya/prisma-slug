import { Prisma } from '@prisma/client/extension';
import type { FieldSlugConfig } from './types';
import { generateSlugFromFields } from './generator/slug';
import { hasChangedFields, areAllFieldsEmpty } from './utils/fields';
import { SlugConfigurationError } from './utils/errors';
import { autoLoadSchemaConfig } from './parser/schema';

export { SlugGenerationError, SlugConfigurationError } from './utils/errors';

/**
 * slug フィールドを処理する共通ロジック
 */
async function processSlugFields(
  model: string,
  data: Record<string, any>,
  modelConfigs: Record<string, any>,
  maxLength: number,
  isUpdate: boolean = false
): Promise<void> {
  const modelConfig = modelConfigs[model];
  if (!modelConfig) {
    return;
  }

  for (const [fieldName, fieldConfig] of Object.entries(modelConfig.fields)) {
    // ユーザーが明示的に slug を指定している場合はスキップ
    if (data[fieldName] !== undefined) {
      continue;
    }

    // update の場合、依存フィールドが変更されているかチェック
    if (isUpdate && !hasChangedFields(data, (fieldConfig as FieldSlugConfig).from)) {
      continue;
    }

    // 依存フィールドがすべて空かチェック
    const allEmpty = areAllFieldsEmpty(data, (fieldConfig as FieldSlugConfig).from);
    if (allEmpty) {
      if ((fieldConfig as FieldSlugConfig).required) {
        throw new SlugConfigurationError(
          `Required fields [${(fieldConfig as FieldSlugConfig).from.join(', ')}] for slug field '${fieldName}' are empty`
        );
      }
      // required: false の場合は slug 生成をスキップ
      continue;
    }

    // slug を生成
    const fieldMaxLength = (fieldConfig as FieldSlugConfig).maxLength ?? maxLength;
    const baseSlug = generateSlugFromFields(
      (fieldConfig as FieldSlugConfig).from,
      data,
      {
        prefix: (fieldConfig as FieldSlugConfig).prefix,
        postfix: (fieldConfig as FieldSlugConfig).postfix,
        maxLength: fieldMaxLength,
      }
    );

    // 生成した slug を data に注入
    data[fieldName] = baseSlug;
  }
}

/**
 * Prisma Client Extension for automatic slug generation
 *
 * スキーマファイルから /// @slug アノテーションを自動的に読み込んでslugを生成します
 *
 * @param options.schemaPath スキーマファイルのパス（省略時は自動検出）
 * @param options.maxLength slug の最大長（デフォルト: 255）
 * @returns Prisma Client Extension
 */
export function slugExtension(options?: {
  schemaPath?: string;
  maxLength?: number;
}) {
  // スキーマファイルから設定を読み込み
  const schemaConfig = autoLoadSchemaConfig(options?.schemaPath);
  const maxLength = options?.maxLength ?? 255;
  const modelConfigs = schemaConfig.models ?? {};

  return Prisma.defineExtension({
    name: 'prisma-extension-slug',
    query: {
      $allModels: {
        async create({ model, operation, args, query }) {
          if (args.data && typeof args.data === 'object') {
            await processSlugFields(
              model,
              args.data as Record<string, any>,
              modelConfigs,
              maxLength,
              false
            );
          }

          return query(args);
        },

        async update({ model, operation, args, query }) {
          if (args.data && typeof args.data === 'object') {
            await processSlugFields(
              model,
              args.data as Record<string, any>,
              modelConfigs,
              maxLength,
              true
            );
          }

          return query(args);
        },

        async upsert({ model, operation, args, query }) {
          // create 用の slug を処理
          if (args.create && typeof args.create === 'object') {
            await processSlugFields(
              model,
              args.create as Record<string, any>,
              modelConfigs,
              maxLength,
              false
            );
          }

          // update 用の slug を処理
          if (args.update && typeof args.update === 'object') {
            await processSlugFields(
              model,
              args.update as Record<string, any>,
              modelConfigs,
              maxLength,
              true
            );
          }

          return query(args);
        },
      },
    },
  });
}
