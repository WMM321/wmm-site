#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 配置常量
const DRAFTS_FOLDER = path.join(__dirname, '..', '草稿箱');
const POSTS_FOLDER = path.join(__dirname, '..', 'src', 'content', 'posts');

// 命令行参数解析
const args = process.argv.slice(2);
const command = args[0];
const filename = args[1];
const title = args[1]; // 对于 create 命令，第二个参数是标题

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

// 主函数
async function main() {
  if (!command || command === 'help') {
    showHelp();
    return;
  }

  try {
    switch (command) {
      case 'create':
        if (!title) {
          console.error('错误：请提供文章标题');
          process.exit(1);
        }
        await createDraft(title);
        break;

      case 'preview':
        if (!filename) {
          console.error('错误：请提供文件名');
          process.exit(1);
        }
        await previewDraft(filename);
        break;

      case 'publish':
        if (!filename) {
          console.error('错误：请提供文件名');
          process.exit(1);
        }
        await publishDraft(filename);
        break;

      case 'unpublish':
        if (!filename) {
          console.error('错误：请提供文件名');
          process.exit(1);
        }
        await unpublishDraft(filename);
        break;

      case 'list':
        await listDrafts();
        break;

      case 'status':
        if (!filename) {
          console.error('错误：请提供文件名');
          process.exit(1);
        }
        await showStatus(filename);
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
