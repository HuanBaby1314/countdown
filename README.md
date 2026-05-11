# 倒计时 Chrome 扩展

一个帮助"摸鱼人"的倒计时插件，显示距离上班、下班、周末、假期和发工资的倒计时。

## 📸 功能预览

- ⏰ 距离上班/下班的实时倒计时
- 🎉 距离周末的倒计时
- 🎊 距离假期的倒计时（支持法定节假日和调休）
- 💰 距离发工资的倒计时
- 📅 当前时间和星期显示
- 💬 随机"摸鱼"鸡汤语句
- ⚙️ 可自定义上下班时间和发工资日期
- 🔔 上下班提醒通知

## 📁 项目结构

```
countdown-extension/
├── src/
│   ├── components/
│   │   └── SettingsPanel.vue    # 设置面板组件
│   ├── js/
│   │   ├── app.js              # 主应用程序逻辑
│   │   ├── background.js       # Chrome 扩展后台脚本
│   │   ├── config.js           # 配置文件
│   │   ├── holidays.js         # 假期数据
│   │   └── utils.js            # 工具函数
│   ├── css/
│   │   └── app.css             # 样式文件
│   ├── images/                 # 图标资源
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   ├── fonts/                  # 字体文件
│   │   ├── element-icons.woff
│   │   └── element-icons.ttf
│   ├── App.vue                 # 主应用组件
│   ├── main.js                 # 应用入口
│   └── index.html              # HTML 模板
├── manifest.json               # Chrome 扩展配置
├── package.json                # 项目依赖
├── webpack.config.js           # Webpack 配置
├── .babelrc                    # Babel 配置
├── .eslintrc.js                # ESLint 配置
├── .gitignore                  # Git 忽略文件
└── README.md                   # 项目说明
```

## 🚀 快速开始

### 前置要求

- Node.js >= 14.0.0
- npm >= 6.0.0 或 yarn >= 1.22.0
- Chrome 浏览器

### 安装步骤

1. **克隆或下载项目**
   ```bash
   git clone <repository-url>
   cd countdown-extension
   ```

2. **安装依赖**
   ```bash
   npm install
   # 或者使用 yarn
   yarn install
   ```

3. **开发模式**
   ```bash
   npm run dev
   ```
   这将启动 Webpack 监听模式，自动编译文件变化。

4. **构建生产版本**
   ```bash
   npm run build
   ```
   构建完成后，会在 `dist` 目录生成可部署的文件。

### 安装到 Chrome

1. 打开 Chrome 浏览器，进入扩展管理页面：`chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目的 `dist` 目录（如果已构建）或项目根目录（开发模式）
5. 扩展将自动安装并显示在浏览器工具栏

## ⚙️ 配置说明

### 默认配置

```javascript
{
  onWorkTime: '09:00',           // 上班时间
  offWorkTime: '18:00',          // 下班时间
  payOffDay: 10,                 // 发工资日期（每月几号）
  notificationsEnabled: true     // 是否启用通知
}
```

### 自定义配置

点击扩展弹出窗口中的"设置"按钮，可以自定义：
- 上班时间
- 下班时间
- 发工资日期
- 是否启用通知

## 🛠️ 技术栈

- **前端框架**: Vue.js 2.x
- **UI 组件库**: Element UI
- **日期处理**: Moment.js
- **构建工具**: Webpack 5
- **代码规范**: ESLint
- **浏览器兼容**: Chrome 80+, Firefox 78+, Safari 13+, Edge 80+

## 📝 开发指南

### 代码规范

项目使用 ESLint 进行代码规范检查：

```bash
# 检查代码规范
npm run lint

# 自动修复
npm run lint -- --fix
```

### 项目架构

#### 组件结构

- **App.vue**: 主应用组件，包含所有业务逻辑
- **SettingsPanel.vue**: 设置面板组件，用于配置

#### 模块划分

- **config.js**: 应用程序配置常量
- **utils.js**: 工具函数库
- **holidays.js**: 假期数据管理
- **background.js**: Chrome 扩展后台脚本

### 添加新功能

1. 在 `App.vue` 中添加新的数据和方法
2. 在模板中添加对应的 UI
3. 更新样式（如果需要）
4. 运行 `npm run lint` 检查代码规范
5. 测试功能是否正常

### 调试技巧

1. **查看后台脚本日志**
   - 打开 `chrome://extensions/`
   - 找到"倒计时"扩展
   - 点击"背景页"链接

2. **查看弹出窗口日志**
   - 右键点击扩展图标
   - 选择"检查弹出内容"

3. **使用 Vue DevTools**
   - 安装 Vue DevTools 浏览器扩展
   - 在弹出窗口中查看组件状态

## 🎨 样式定制

### 颜色方案

```javascript
// 主色调
primary: '#50bfff'      // 蓝色
danger: '#f56c6c'       // 红色（用于强调数字）
background: '#ecf8ff'   // 浅蓝色背景
text: '#303133'         // 深灰色文字
```

### 自定义样式

修改 `src/css/app.css` 或在组件的 `<style>` 标签中添加自定义样式。

## 📦 构建部署

### 开发环境

```bash
npm run dev
```

### 生产环境

```bash
npm run build
```

构建完成后，`dist` 目录包含所有需要的文件。

### 发布到 Chrome 网上应用店

1. 注册 Chrome 网上应用店开发者账号
2. 准备扩展图标和截图
3. 打包 `dist` 目录为 `.zip` 文件
4. 上传到 Chrome 网上应用店

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本项目
2. 创建功能分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'Add some feature'`
4. 推送到分支：`git push origin feature/your-feature`
5. 提交 Pull Request

### 代码规范

- 使用 2 个空格缩进
- 使用单引号
- 使用分号
- 遵循 ESLint 规则

## 📄 许可证

MIT License

## 🙏 致谢

- Vue.js - 渐进式 JavaScript 框架
- Element UI - Vue 2.0 的桌面端组件库
- Moment.js - 日期处理库
- Webpack - 模块打包工具

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件至：your-email@example.com

## 📋 更新日志

### v1.0.0 (2024-01-01)
- ✨ 初始版本发布
- ✨ 实现基本倒计时功能
- ✨ 支持自定义设置
- ✨ 显示假期倒计时
- ✨ 支持通知提醒

---

**享受你的摸鱼时光！** 🐟