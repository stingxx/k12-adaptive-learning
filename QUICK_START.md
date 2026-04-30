# ⚡ 5分钟快速启动指南

## 🎯 目标
在5分钟内让整个K-12学习平台在本地运行。

---

## 📋 前置条件

你已经有：
- Docker和Docker Compose (https://www.docker.com/products/docker-desktop)
- Git (https://git-scm.com/)
- 一个OpenAI API密钥 (https://platform.openai.com/api-keys)

---

## 🚀 5个简单步骤

### 第1步：获取项目代码（1分钟）

```bash
# 方案A：克隆GitHub仓库
git clone https://github.com/YOUR_USERNAME/k12-adaptive-learning.git
cd k12-adaptive-learning

# 或方案B：从下载的setup脚本生成
bash setup-complete-project.sh
```

### 第2步：配置环境变量（1分钟）

```bash
# 复制环境模板
cp .env.example .env

# 编辑 .env 文件
# 重要！添加你的OpenAI API密钥
nano .env

# 必须修改这一行：
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**获取OpenAI密钥：**
1. 访问 https://platform.openai.com/api-keys
2. 点击 "Create new secret key"
3. 复制密钥
4. 粘贴到 .env 文件

### 第3步：启动所有服务（2分钟）

```bash
# 一键启动（包括数据库、缓存、前端、后端）
docker-compose up --build

# 看到这个消息说明启动成功：
# ✅ 应用在端口 3001 启动成功
# ✅ 应用在端口 3000 启动成功
```

### 第4步：初始化数据库（1分钟）

在**新的终端窗口**中运行（不要关闭原终端）：

```bash
cd k12-adaptive-learning

# 初始化数据库表
docker-compose exec backend npm run prisma:deploy

# 初始化课程数据
docker-compose exec backend npm run seed:curriculum

# 看到 "✅ 初始化完成" 说明成功
```

---

## ✅ 验证启动成功

访问以下URLs，都应该能打开：

| 应用 | URL | 预期 |
|------|-----|------|
| 📱 学生前端 | http://localhost:3000 | 看到学习平台首页 |
| 🔌 API文档 | http://localhost:3001/api/docs | 看到Swagger API文档 |
| ❤️ 健康检查 | http://localhost:3001/api/health | 看到 `{"status":"healthy"}` |

---

## 🎓 测试应用

### 1. 创建学生账户

```bash
# 打开 http://localhost:3000

# 点击"注册"
# 填写信息：
#   名字: 李明
#   邮箱: test@example.com
#   密码: test123
#   年级: 6 (六年级)
#   省份: 安大略 (ON)

# 点击"注册"
```

### 2. 查看今日课程

```bash
# 登录后自动看到4门课：
#   1️⃣ 数学
#   2️⃣ 科学
#   3️⃣ 英语
#   4️⃣ 社会研究
```

### 3. 学习一门课程

```bash
# 点击"数学"课程
# 看到AI生成的课程内容
# 课程内容包括：
#   - 学习目标
#   - 主要内容
#   - 关键概念
#   - 总结
```

### 4. 完成测验

```bash
# 课程下方有"做练习题"按钮
# 会显示5道随机题目
# 选择答案或输入答案
# 点击"提交答案"
# 立即显示：
#   - ✅/❌ 是否正确
#   - 得分（0-100分）
#   - 正确答案
#   - 详细讲解
```

---

## 🔧 常见问题

### Q: 出现"Connection refused"错误

**A:** 数据库还在启动
```bash
# 等待30秒让数据库完全启动
# 或查看日志
docker-compose logs postgres
```

### Q: OpenAI API报错

**A:** API密钥不正确或没有配额
```bash
# 检查密钥
cat .env | grep OPENAI_API_KEY

# 检查配额
访问 https://platform.openai.com/account/usage
```

### Q: 端口已被占用

**A:** 其他应用占用了3000或3001端口
```bash
# 改为使用其他端口
# 编辑 docker-compose.yml
# 改成：
#   "3002:3000"  (前端)
#   "3003:3001"  (后端)

# 然后重启
docker-compose down
docker-compose up --build
```

### Q: 数据库初始化失败

**A:** 
```bash
# 检查数据库是否启动
docker-compose ps postgres

# 查看数据库日志
docker-compose logs postgres

# 重新初始化
docker-compose exec backend npm run prisma:deploy
```

---

## 🛑 停止应用

```bash
# 保存数据的情况下停止
docker-compose down

# 完全删除（包括数据）
docker-compose down -v
```

---

## 📊 应用结构

```
┌─────────────────────────────────────────┐
│         浏览器                           │
│  (http://localhost:3000)                │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│    Next.js 前端 (Port 3000)              │
│  └─ 学生界面、家长监控、仪表板          │
└──────────────────┬──────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────┐
│    NestJS 后端 (Port 3001)              │
│  ├─ 课程API (/api/lessons)              │
│  ├─ 测验API (/api/quizzes)              │
│  ├─ 学生API (/api/students)             │
│  └─ AI服务 (OpenAI集成)                 │
└──────────────────┬──────────────────────┘
        │                      │
        ▼                      ▼
    PostgreSQL              Redis
    (Port 5432)         (Port 6379)
    (数据存储)          (缓存层)
```

---

## 🚀 下一步

### 本地开发

```bash
# 修改代码时自动重新加载
docker-compose up

# 查看实时日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 部署到云端

参考 **DEPLOYMENT_GUIDE_COMPLETE.md**

选择你喜欢的平台：
- 🌟 Heroku (最简单)
- 💎 Railway (最快)
- 💼 AWS (最强大)
- 🎯 DigitalOcean (最划算)

### 添加更多功能

所有源代码都在：
- **前端**: `./frontend/src/`
- **后端**: `./backend/src/`
- **数据库**: `./prisma/schema.prisma`

---

## 📞 获取帮助

1. **查看日志**: `docker-compose logs`
2. **查看文档**: COMPLETE_PROJECT_GUIDE.md
3. **API文档**: http://localhost:3001/api/docs
4. **GitHub Issues**: 提交问题

---

## ✨ 成功标志

如果你看到：

1. ✅ 前端加载了页面
2. ✅ 可以注册和登录
3. ✅ 看到4门课程
4. ✅ 可以开始学习
5. ✅ 可以完成测验并看到评分

**恭喜！你已经成功启动了K-12学习平台！** 🎉

---

## 🎓 现在可以：

- 🎯 学习课程内容
- 📝 完成练习题
- 📊 查看学习进度
- 🔄 重新挑战更难的题目
- 👨‍👩‍👧 分享给家人一起使用

**祝学习愉快！** 📚✨
