#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 配置常量
const DRAFTS_FOLDER = path.join(__dirname, '..', '草稿箱');
const POSTS_FOLDER = path.join(__dirname, '..', 'src', 'content', 'posts');

// 命令行参数解析
const args = process.argv.slice(2);
const command = args[0];
const target = args[1]; // create 时为标题，其他命令时为文件名

// 路径安全校验：防止路径遍历攻击
function assertSafePath(userInput) {
  const resolved = path.resolve(DRAFTS_FOLDER, userInput);
  if (!resolved.startsWith(path.resolve(DRAFTS_FOLDER)) &&
      !resolved.startsWith(path.resolve(POSTS_FOLDER))) {
    throw new Error(`不安全的路径: ${userInput}（路径遍历被拒绝）`);
  }
  return resolved;
}

// Frontmatter 解析 - 零外部依赖
export function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, body: content };
  }

  const yamlStr = match[1];
  const body = match[2];

  // 简单的 YAML 解析（只支持基本格式）
  const data = {};
  const lines = yamlStr.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();

    // 处理数组格式
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(v => {
        v = v.trim();
        // 去除元素两端的引号
        if ((v.startsWith('"') && v.endsWith('"')) ||
            (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        return v;
      });
    }
    // 处理布尔值
    else if (value === 'true') {
      value = true;
    }
    else if (value === 'false') {
      value = false;
    }
    // 处理日期格式
    else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      // 保持为字符串，后续验证时再转换
    }
    // 处理带引号的字符串
    else if ((value.startsWith('"') && value.endsWith('"')) ||
             (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    data[key] = value;
  }

  return { data, body };
}

// Frontmatter 生成
export function generateFrontmatter(data, body) {
  const lines = [];

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.join(', ')}]`);
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else if (typeof value === 'string' && value.includes(':')) {
      // 包含冒号的字符串需要引号
      lines.push(`${key}: "${value}"`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }

  return `---\n${lines.join('\n')}\n---\n${body}`;
}

// 检查文件是否存在（同步版本）
export function fileExists(filepath) {
  try {
    fs.accessSync(filepath);
    return true;
  } catch {
    return false;
  }
}

// 确保目录存在（同步版本）
export function ensureDir(dirpath) {
  try {
    fs.mkdirSync(dirpath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

// 生成文件名
export function generateFilename(title) {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/g, '-') // 保留中文和英文数字
    .replace(/^-+|-+$/g, ''); // 移除首尾的连字符

  return `${date}-${slug}.md`;
}

// 验证 frontmatter 必填字段
export function validateFrontmatter(data) {
  const requiredFields = ['title', 'published', 'description', 'tags', 'category'];
  const missing = [];

  for (const field of requiredFields) {
    if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
      missing.push(field);
    }
  }

  return {
    valid: missing.length === 0,
    missing
  };
}

// 显示帮助信息
function showHelp() {
  console.log(`
草稿箱管理工具

用法：
  node scripts/draft-manager.js <command> [arguments]

命令：
  create <title>           创建新草稿
  preview <filename>       预览草稿信息
  publish <filename>       发布草稿到 posts 目录
  unpublish <filename>     取消发布，移回草稿箱
  list                     显示所有草稿状态
  status <filename>        显示单个草稿详情
  help                     显示此帮助信息

示例：
  node scripts/draft-manager.js create "我的第一篇文章"
  node scripts/draft-manager.js publish "2026-06-24-我的第一篇文章.md"
  node scripts/draft-manager.js list
  `);
}

// --- 以下为待实现的命令函数 ---

// 创建草稿（同步版本，与项目风格一致）
function createDraft(title) {
  // 1. 确保草稿箱目录存在
  ensureDir(DRAFTS_FOLDER);

  // 2. 生成文件名
  const filename = generateFilename(title);
  const filepath = path.join(DRAFTS_FOLDER, filename);

  // 3. 检查文件是否已存在
  if (fileExists(filepath)) {
    console.error(`错误：草稿已存在：${filename}`);
    process.exit(1);
  }

  // 4. 创建 frontmatter 模板
  const today = new Date().toISOString().split('T')[0];
  const data = {
    title: title,
    published: today,
    description: '',
    image: '',
    tags: [],
    category: '',
    draft: true,
    source_type: 'original',
    source_url: '',
    source_author: '',
    source_platform: ''
  };

  const body = '\n\n在此处开始写作...\n';
  const content = generateFrontmatter(data, body);

  // 5. 写入文件
  fs.writeFileSync(filepath, content, 'utf-8');

  // 6. 显示成功信息
  console.log(`✅ 草稿已创建：${filename}`);
  console.log(`📁 位置：${filepath}`);
  console.log(`\n下一步：`);
  console.log(`  1. 在 Obsidian 中打开文件`);
  console.log(`  2. 编辑 frontmatter（标题、描述、标签等）`);
  console.log(`  3. 开始写作`);
  console.log(`  4. 完成后运行：node scripts/draft-manager.js publish "${filename}"`);
}

function previewDraft(filename) {
  assertSafePath(filename);
  throw new Error('preview 命令尚未实现（TODO）');
}

function publishDraft(filename) {
  assertSafePath(filename);
  throw new Error('publish 命令尚未实现（TODO）');
}

function unpublishDraft(filename) {
  assertSafePath(filename);
  throw new Error('unpublish 命令尚未实现（TODO）');
}

function listDrafts() {
  throw new Error('list 命令尚未实现（TODO）');
}

function showStatus(filename) {
  assertSafePath(filename);
  throw new Error('status 命令尚未实现（TODO）');
}

// 主函数
function main() {
  if (!command || command === 'help') {
    showHelp();
    return;
  }

  try {
    switch (command) {
      case 'create':
        if (!target) {
          console.error('错误：请提供文章标题');
          process.exit(1);
        }
        createDraft(target);
        break;

      case 'preview':
        if (!target) {
          console.error('错误：请提供文件名');
          process.exit(1);
        }
        previewDraft(target);
        break;

      case 'publish':
        if (!target) {
          console.error('错误：请提供文件名');
          process.exit(1);
        }
        publishDraft(target);
        break;

      case 'unpublish':
        if (!target) {
          console.error('错误：请提供文件名');
          process.exit(1);
        }
        unpublishDraft(target);
        break;

      case 'list':
        listDrafts();
        break;

      case 'status':
        if (!target) {
          console.error('错误：请提供文件名');
          process.exit(1);
        }
        showStatus(target);
        break;

      default:
        console.error(`错误：未知命令 '${command}'`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(`错误：${error.message}`);
    process.exit(1);
  }
}

// 运行主函数（仅直接执行时，非 import 时）
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  main();
}
