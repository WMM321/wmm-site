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

function createDraft(title) {
  throw new Error('create 命令尚未实现（TODO）');
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

// 运行主函数
main();
