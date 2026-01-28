# C盘数据迁移助手 (Silver Intergalactic) 项目规范

## 1. 技术栈
- **Framework**: Electron + Vue 3 + TypeScript
- **UI**: Element Plus + Tailwind CSS
- **Build**: Vite + electron-builder
- **Store**: electron-store

## 2. 核心规范
- **语言**: 强制中文 (注释/Commit)。
- **构建**: 产出为 Portable EXE ('output/')。
- **权限**: 必须 Admin 权限。
- **安全**: 迁移前检查 Symlink (防止重复迁移)。
- **数据**:
  - 导出方案去除 'lastRun'。
  - 历史记录保留详尽错误日志。
