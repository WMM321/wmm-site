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

// 预览草稿（同步版本）
function previewDraft(filename) {
  // 1. 安全路径校验
  assertSafePath(filename);

  const draftPath = path.join(DRAFTS_FOLDER, filename);
  const postPath = path.join(POSTS_FOLDER, filename);

  let filepath;
  let location;

  if (fileExists(draftPath)) {
    filepath = draftPath;
    location = '草稿箱';
  } else if (fileExists(postPath)) {
    filepath = postPath;
    location = '已发布';
  } else {
    console.error(`错误：文件不存在：${filename}`);
    process.exit(1);
  }

  // 2. 读取文件内容
  const content = fs.readFileSync(filepath, 'utf-8');
  const { data, body } = parseFrontmatter(content);

  // 3. 验证 frontmatter
  const validation = validateFrontmatter(data);

  // 4. 统计信息
  const wordCount = body.trim().split(/\s+/).length;
  const charCount = body.length;

  // 5. 显示预览信息
  console.log(`\n📄 文件预览：${filename}`);
  console.log(`📁 位置：${location}`);
  console.log(`\n--- Frontmatter ---`);
  console.log(`标题：${data.title || '(未设置)'}`);
  console.log(`发布日期：${data.published || '(未设置)'}`);
  console.log(`描述：${data.description || '(未设置)'}`);
  console.log(`标签：${Array.isArray(data.tags) ? data.tags.join(', ') : '(未设置)'}`);
  console.log(`分类：${data.category || '(未设置)'}`);
  console.log(`草稿状态：${data.draft ? '是' : '否'}`);
  console.log(`来源类型：${data.source_type || 'original'}`);

  if (!validation.valid) {
    console.log(`\n⚠️  缺少必填字段：${validation.missing.join(', ')}`);
  } else {
    console.log(`\n✅ Frontmatter 验证通过`);
  }

  console.log(`\n--- 统计信息 ---`);
  console.log(`字数：${wordCount}`);
  console.log(`字符数：${charCount}`);
  console.log(`\n--- 正文预览 ---`);
  console.log(body.substring(0, 500) + (body.length > 500 ? '...' : ''));
}

// 发布草稿 - 原子性操作（同步版本）
function publishDraft(filename) {
  // 1. 安全路径校验
  assertSafePath(filename);
  const draftPath = path.join(DRAFTS_FOLDER, filename);
  const targetPath = path.join(POSTS_FOLDER, filename);

  let targetWritten = false;
  try {
    // 2. 检查源文件是否存在
    if (!fileExists(draftPath)) {
      console.error(`错误：草稿文件不存在：${filename}`);
      process.exit(1);
    }

    // 3. 读取草稿文件
    const content = fs.readFileSync(draftPath, 'utf-8');
    const { data, body } = parseFrontmatter(content);

    // 4. 修改 draft 状态
    data.draft = false;

    // 5. 验证必填字段
    const validation = validateFrontmatter(data);
    if (!validation.valid) {
      console.error(`错误：缺少必填字段：${validation.missing.join(', ')}`);
      console.error('请先完善 frontmatter 再发布');
      process.exit(1);
    }

    // 6. 生成新内容
    const newContent = generateFrontmatter(data, body);

    // 7. 确保 posts 目录存在
    ensureDir(POSTS_FOLDER);

    // 8. 检查目标文件是否已存在
    if (fileExists(targetPath)) {
      console.error(`错误：目标文件已存在：${filename}`);
      console.error('如果要覆盖，请先手动删除目标文件');
      process.exit(1);
    }

    // 9. 写入目标文件（先 modify）
    fs.writeFileSync(targetPath, newContent, 'utf-8');
    targetWritten = true;

    // 10. 验证写入成功
    const verifyContent = fs.readFileSync(targetPath, 'utf-8');
    if (verifyContent !== newContent) {
      throw new Error('文件写入验证失败');
    }

    // 11. 删除源文件（后 delete）
    fs.unlinkSync(draftPath);

    // 12. 显示成功信息
    console.log(`✅ 文章已发布：${data.title}`);
    console.log(`📁 位置：${targetPath}`);
    console.log(`\n下一步：`);
    console.log(`  1. 运行 pnpm run build 验证构建`);
    console.log(`  2. 运行 git add . && git commit -m "feat: 添加文章 ${filename}"`);
    console.log(`  3. 运行 git push origin master 推送到远程`);

  } catch (error) {
    console.error(`❌ 发布失败：${error.message}`);

    // 只有在目标文件已写入且源文件仍存在时才回滚
    if (targetWritten && fileExists(draftPath)) {
      try {
        fs.unlinkSync(targetPath);
        console.log('↩️  已回滚操作');
      } catch (rollbackError) {
        console.error(`⚠️  回滚失败：${rollbackError.message}`);
        console.error(`目标文件可能需要手动删除：${targetPath}`);
      }
    }

    process.exit(1);
  }
}

// 取消发布 - 原子性操作（同步版本）
function unpublishDraft(filename) {
  // 1. 安全路径校验
  assertSafePath(filename);
  const postPath = path.join(POSTS_FOLDER, filename);
  const targetPath = path.join(DRAFTS_FOLDER, filename);

  let targetWritten = false;

  try {
    // 2. 检查源文件是否存在
    if (!fileExists(postPath)) {
      console.error(`错误：已发布文件不存在：${filename}`);
      process.exit(1);
    }

    // 3. 读取已发布文件
    const content = fs.readFileSync(postPath, 'utf-8');
    const { data, body } = parseFrontmatter(content);

    // 4. 修改 draft 状态
    data.draft = true;

    // 5. 生成新内容
    const newContent = generateFrontmatter(data, body);

    // 6. 确保草稿箱目录存在
    ensureDir(DRAFTS_FOLDER);

    // 7. 检查目标文件是否已存在
    if (fileExists(targetPath)) {
      console.error(`错误：草稿箱中已存在同名文件：${filename}`);
      console.error('请先处理草稿箱中的文件');
      process.exit(1);
    }

    // 8. 写入草稿箱（先 modify）
    fs.writeFileSync(targetPath, newContent, 'utf-8');
    targetWritten = true;

    // 9. 验证写入成功
    const verifyContent = fs.readFileSync(targetPath, 'utf-8');
    if (verifyContent !== newContent) {
      throw new Error('文件写入验证失败');
    }

    // 10. 删除源文件（后 delete）
    fs.unlinkSync(postPath);

    // 11. 显示成功信息
    console.log(`✅ 已取消发布：${data.title}`);
    console.log(`📁 位置：${targetPath}`);
    console.log(`\n文章已移回草稿箱，可以继续编辑`);

  } catch (error) {
    console.error(`❌ 取消发布失败：${error.message}`);

    // 只有在目标文件已写入且源文件仍存在时才回滚
    if (targetWritten && fileExists(postPath)) {
      try {
        fs.unlinkSync(targetPath);
        console.log('↩️  已回滚操作');
      } catch (rollbackError) {
        console.error(`⚠️  回滚失败：${rollbackError.message}`);
        console.error(`草稿文件可能需要手动删除：${targetPath}`);
      }
    }

    process.exit(1);
  }
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
