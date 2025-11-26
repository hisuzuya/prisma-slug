import * as fs from 'fs';
import * as path from 'path';
import type { SlugExtensionConfig, FieldSlugConfig } from '../types';

/**
 * スキーマファイル内の /// @slug アノテーションを解析
 */
interface SlugAnnotation {
  from?: string[];
  prefix?: string;
  postfix?: string;
  mode?: 'auto' | 'random';
  unique?: boolean;
  required?: boolean;
  maxLength?: number;
}

/**
 * /// @slug アノテーションをパース
 */
function parseSlugAnnotation(line: string): SlugAnnotation | null {
  const match = line.match(/\/\/\/\s*@slug(?:\((.*)\))?/);
  if (!match) return null;

  const annotation: SlugAnnotation = {};

  if (!match[1]) {
    // @slug のみの場合、デフォルト設定
    return annotation;
  }

  const optionsStr = match[1];

  // from: ['field1', 'field2'] のようなパターンをパース
  const fromMatch = optionsStr.match(/from:\s*\[([^\]]+)\]/);
  if (fromMatch) {
    annotation.from = fromMatch[1]
      .split(',')
      .map(s => s.trim().replace(/['"]/g, ''));
  }

  // prefix: 'value' のパターン（固定文字列のみ）
  const prefixMatch = optionsStr.match(/prefix:\s*(?:'([^']+)'|"([^"]+)")/);
  if (prefixMatch) {
    annotation.prefix = prefixMatch[1] || prefixMatch[2];
  }

  // postfix: 'value' のパターン（固定文字列のみ）
  const postfixMatch = optionsStr.match(/postfix:\s*(?:'([^']+)'|"([^"]+)")/);
  if (postfixMatch) {
    annotation.postfix = postfixMatch[1] || postfixMatch[2];
  }

  // mode: 'auto' | 'random'
  const modeMatch = optionsStr.match(/mode:\s*'([^']+)'/);
  if (modeMatch && (modeMatch[1] === 'auto' || modeMatch[1] === 'random')) {
    annotation.mode = modeMatch[1];
  }

  // unique: true | false
  const uniqueMatch = optionsStr.match(/unique:\s*(true|false)/);
  if (uniqueMatch) {
    annotation.unique = uniqueMatch[1] === 'true';
  }

  // required: true | false
  const requiredMatch = optionsStr.match(/required:\s*(true|false)/);
  if (requiredMatch) {
    annotation.required = requiredMatch[1] === 'true';
  }

  // maxLength: 100
  const maxLengthMatch = optionsStr.match(/maxLength:\s*(\d+)/);
  if (maxLengthMatch) {
    annotation.maxLength = parseInt(maxLengthMatch[1], 10);
  }

  return annotation;
}

/**
 * Prisma スキーマファイルからslug設定を抽出
 */
export function parseSchemaFile(schemaPath: string): SlugExtensionConfig {
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  const lines = schemaContent.split('\n');

  const config: SlugExtensionConfig = {
    models: {},
  };

  let currentModel: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // model 定義を検出
    const modelMatch = line.match(/^model\s+(\w+)\s*\{/);
    if (modelMatch) {
      currentModel = modelMatch[1];
      continue;
    }

    // model の終了を検出
    if (line === '}' && currentModel) {
      currentModel = null;
      continue;
    }

    // 同じ行にアノテーション（fieldName String @unique /// @slug(...)）
    if (currentModel && line.includes('/// @slug')) {
      const annotation = parseSlugAnnotation(line);
      const fieldMatch = line.match(/^(\w+)\s+/);

      if (annotation && fieldMatch) {
        const fieldName = fieldMatch[1];

        if (!config.models) {
          config.models = {};
        }
        if (!config.models[currentModel]) {
          config.models[currentModel] = { fields: {} };
        }

        const fieldConfig: FieldSlugConfig = {
          from: annotation.from || [],
        };

        if (annotation.prefix !== undefined) fieldConfig.prefix = annotation.prefix;
        if (annotation.postfix !== undefined) fieldConfig.postfix = annotation.postfix;
        if (annotation.mode !== undefined) fieldConfig.mode = annotation.mode;
        if (annotation.unique !== undefined) fieldConfig.unique = annotation.unique;
        if (annotation.required !== undefined) fieldConfig.required = annotation.required;
        if (annotation.maxLength !== undefined) fieldConfig.maxLength = annotation.maxLength;

        config.models[currentModel].fields[fieldName] = fieldConfig;
      }
    }
  }

  return config;
}

/**
 * プロジェクトルートから schema.prisma を自動検出
 */
export function findSchemaFile(startDir: string = process.cwd()): string | null {
  const commonPaths = [
    path.join(startDir, 'prisma', 'schema.prisma'),
    path.join(startDir, 'schema.prisma'),
    path.join(startDir, '..', 'prisma', 'schema.prisma'),
  ];

  for (const schemaPath of commonPaths) {
    if (fs.existsSync(schemaPath)) {
      return schemaPath;
    }
  }

  return null;
}

/**
 * 自動的にスキーマファイルを検出して設定を読み込む
 */
export function autoLoadSchemaConfig(schemaPath?: string): SlugExtensionConfig {
  const resolvedPath = schemaPath || findSchemaFile();

  if (!resolvedPath) {
    return { models: {} };
  }

  try {
    return parseSchemaFile(resolvedPath);
  } catch (error) {
    console.warn('[prisma-extension-slug] Failed to parse schema file:', error);
    return { models: {} };
  }
}
