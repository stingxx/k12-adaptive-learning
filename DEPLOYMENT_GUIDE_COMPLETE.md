# 🚀 K-12 AI 自适应学习平台 - 完整的云部署指南

本指南涵盖以下部署方案：
- ✅ **Heroku** (最简单，推荐新手)
- ✅ **AWS** (企业级，可扩展)
- ✅ **DigitalOcean** (性价比高)
- ✅ **Railway** (开发者友好)
- ✅ **Render** (简单快速)

---

## 📋 前置要求（所有方案通用）

```bash
# 1. Git账户
- GitHub 账户 (https://github.com/signup)

# 2. OpenAI API密钥
- 访问 https://platform.openai.com/api-keys
- 获取 sk-xxx 格式的API密钥

# 3. 本地工具
- Git CLI (https://git-scm.com/download)
- Docker (可选，用于本地测试)
```

---

## 🚀 方案1：Heroku部署（最简单）

Heroku是最简单的部署方案，完全免费试用（信用卡验证）。

### 步骤1：准备GitHub仓库

```bash
# 1. 创建GitHub仓库
访问 https://github.com/new
仓库名: k12-adaptive-learning
勾选: Public
勾选: Initialize with README

# 2. 克隆到本地
git clone https://github.com/YOUR_USERNAME/k12-adaptive-learning.git
cd k12-adaptive-learning

# 3. 添加文件
# 从上面下载的脚本运行
bash setup-complete-project.sh

# 4. 推送到GitHub
git add .
git commit -m "Initial commit: K-12 Learning Platform"
git push origin main
```

### 步骤2：连接Heroku

```bash
# 1. 访问Heroku
https://www.heroku.com/

# 2. 注册账户
点击 "Sign up" → 填写邮箱、密码、用途
验证邮箱 → 完成注册

# 3. 登录仪表板
https://dashboard.heroku.com/apps
```

### 步骤3：创建和配置应用

```bash
# 在Heroku仪表板上：

# 1. 创建后端应用
点击 "New" → "Create new app"
App name: k12-learning-backend
Dyno type: Eco (免费)
点击 "Create app"

# 2. 连接GitHub
进入 "Deploy" 标签
选择 "GitHub" 作为部署方法
搜索 "k12-adaptive-learning"
点击 "Connect"

# 3. 添加数据库
进入 "Resources" 标签
搜索 "Heroku Postgres"
点击并选择 "Hobby Dev - Free"
确认并继续

# 4. 添加Redis
搜索 "Heroku Data for Redis"
选择 "Premium 0" (免费试用)

# 5. 设置环境变量
进入 "Settings" 标签
点击 "Reveal Config Vars"
添加以下变量：

OPENAI_API_KEY=sk-your-actual-key-here
JWT_SECRET=your-super-secret-key
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.herokuapp.com
```

### 步骤4：配置前端

```bash
# 1. 在Heroku创建前端应用
点击 "New" → "Create new app"
App name: k12-learning-frontend
Dyno type: Eco (免费)

# 2. 部署前端
进入 "Deploy" 标签
选择GitHub并连接
选择分支 "main"
勾选 "Automatic deploys"

# 3. 设置前端环境变量
进入 "Settings" → "Reveal Config Vars"

NEXT_PUBLIC_API_URL=https://k12-learning-backend.herokuapp.com
```

### 步骤5：部署

```bash
# 推送到GitHub将自动触发部署
git push origin main

# 查看部署日志
在Heroku仪表板上进入 "Activity" 或 "Logs"

# 访问应用
前端: https://k12-learning-frontend.herokuapp.com
后端API: https://k12-learning-backend.herokuapp.com/api/docs
```

**Heroku优点：**
- ✅ 最简单，一键部署
- ✅ 内置数据库支持
- ✅ 自动HTTPS
- ✅ 不需要Docker知识
- ✅ 免费试用（$7/月起）

**Heroku缺点：**
- ❌ 免费应用会休眠
- ❌ 性能不如其他方案
- ❌ 不支持自定义域名（免费）

---

## 🏢 方案2：AWS部署（企业级）

AWS提供企业级解决方案，包括EC2、RDS、ElastiCache等。

### 步骤1：创建AWS账户

```bash
# 访问AWS
https://aws.amazon.com/

# 点击 "Create an AWS Account"
# 填写邮箱、密码、账户名
# 验证邮箱
# 添加支付方式

# 完成验证并登录
```

### 步骤2：启动EC2实例

```bash
# 1. 进入EC2控制台
https://console.aws.amazon.com/ec2/

# 2. 启动实例
点击 "Instances" → "Launch instances"

配置:
- 名称: k12-learning-server
- AMI: Ubuntu Server 22.04 LTS (免费)
- 实例类型: t3.micro (免费层)
- 密钥对: 创建新的 → k12-key.pem → 下载
- 安全组: 创建新的
  - 允许 SSH (22): 0.0.0.0/0
  - 允许 HTTP (80): 0.0.0.0/0
  - 允许 HTTPS (443): 0.0.0.0/0
  - 允许 3000: 0.0.0.0/0
  - 允许 3001: 0.0.0.0/0

# 3. 启动实例
点击 "Launch instance"
等待实例启动（看到"running"状态）
```

### 步骤3：连接到服务器

```bash
# 1. 下载密钥后，修改权限
chmod 400 k12-key.pem

# 2. 获取服务器IP
在EC2控制台找到实例
复制 "Public IPv4 address"

# 3. SSH连接
ssh -i k12-key.pem ubuntu@YOUR_SERVER_IP

# 4. 更新系统
sudo apt update
sudo apt upgrade -y
```

### 步骤4：安装Docker和Docker Compose

```bash
# 在服务器上运行

# 1. 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 2. 添加用户到docker组
sudo usermod -aG docker ubuntu

# 3. 安装Docker Compose
sudo apt install -y docker-compose

# 4. 验证
docker --version
docker-compose --version
```

### 步骤5：克隆项目和部署

```bash
# 在服务器上

# 1. 克隆GitHub仓库
git clone https://github.com/YOUR_USERNAME/k12-adaptive-learning.git
cd k12-adaptive-learning

# 2. 创建.env文件
cat > .env << 'EOF'
DB_USER=learningadmin
DB_PASSWORD=your-strong-password-here
DB_NAME=k12_adaptive_learning
REDIS_PASSWORD=your-strong-redis-password
JWT_SECRET=your-super-secret-jwt-key
OPENAI_API_KEY=sk-your-actual-key-here
FRONTEND_URL=http://YOUR_SERVER_IP:3000
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:3001
NODE_ENV=production
EOF

# 3. 启动所有服务
docker-compose up -d --build

# 4. 初始化数据库
docker-compose exec backend npm run prisma:deploy
docker-compose exec backend npm run seed:curriculum

# 5. 验证
docker-compose ps

# 应该显示所有容器都是 "Up"
```

### 步骤6：配置域名和HTTPS

```bash
# 1. 购买域名（可选）
可以从Namecheap、GoDaddy等购买

# 2. 配置DNS
指向你的服务器IP地址

# 3. 安装Nginx反向代理
sudo apt install nginx

# 4. 配置Nginx
sudo nano /etc/nginx/sites-available/default

# 添加以下配置：
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# 5. 重启Nginx
sudo nginx -s reload

# 6. 安装SSL证书（Let's Encrypt）
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 7. 设置自动续期
sudo systemctl enable certbot.timer
```

### 步骤7：创建RDS数据库（可选，更安全）

```bash
# 替代本地PostgreSQL的更好方案

# 1. 进入RDS控制台
https://console.aws.amazon.com/rds/

# 2. 创建数据库
点击 "Create database"
- Engine: PostgreSQL
- Version: 14.6
- Template: Free tier
- Instance ID: k12-learning-db
- Username: learningadmin
- Password: your-strong-password

# 3. 修改.env
DATABASE_URL=postgresql://learningadmin:password@your-rds-endpoint:5432/k12_adaptive_learning

# 4. 重启容器
docker-compose down
docker-compose up -d
```

**AWS优点：**
- ✅ 企业级性能
- ✅ 可高度扩展
- ✅ 高可靠性
- ✅ 自动备份

**AWS缺点：**
- ❌ 配置复杂
- ❌ 学习曲线陡峭
- ❌ 成本较高（$10+/月）

---

## 💎 方案3：DigitalOcean部署（推荐）

DigitalOcean提供性价比最高的方案，$5/月起。

### 步骤1：创建DigitalOcean账户

```bash
# 访问DigitalOcean
https://www.digitalocean.com/

# 点击 "Sign Up"
# 用邮箱或GitHub账户注册
# 添加支付方式
```

### 步骤2：创建Droplet

```bash
# 在DigitalOcean仪表板

# 1. 点击 "Create" → "Droplets"

# 2. 选择配置
- OS: Ubuntu 22.04 LTS
- Plan: Basic ($6/月) 或 Standard ($12/月)
- CPU: 2 vCPU
- RAM: 2GB
- Storage: 60GB

# 3. 选择数据中心
选择离用户最近的地区

# 4. 身份验证
勾选 "New SSH Key"
点击 "New SSH Key"
粘贴你的公钥（或生成新的）

# 5. 设置主机名
k12-learning-droplet

# 6. 点击 "Create Droplet"
```

### 步骤3：部署应用

```bash
# 连接到Droplet
ssh root@YOUR_DROPLET_IP

# 1. 更新系统
apt update && apt upgrade -y

# 2. 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install -y docker-compose

# 3. 克隆项目
git clone https://github.com/YOUR_USERNAME/k12-adaptive-learning.git
cd k12-adaptive-learning

# 4. 配置.env（同AWS方案）
# ... (参考AWS步骤5)

# 5. 启动应用
docker-compose up -d --build

# 6. 配置域名和SSL（使用Nginx）
# ... (参考AWS步骤6)
```

### 步骤4：设置Managed Database（可选）

```bash
# 使用DigitalOcean Managed Database而不是容器内的PostgreSQL

# 1. 创建Managed Database
点击 "Create" → "Databases"
- Engine: PostgreSQL 14
- Plan: Starter ($15/月)

# 2. 获取连接字符串
DATABASE_URL=postgresql://...

# 3. 更新Droplet的.env
```

---

## 🚄 方案4：Railway部署（最快）

Railway是最现代的部署平台，支持自动部署。

### 步骤1：连接GitHub

```bash
# 访问Railway
https://railway.app/

# 使用GitHub账户登录
```

### 步骤2：部署

```bash
# 1. 创建新项目
点击 "New Project"

# 2. 连接GitHub仓库
选择 "GitHub"
授权Railway
选择 "k12-adaptive-learning"

# 3. Railroad会自动检测
点击 "Add Services"
添加:
- PostgreSQL
- Redis

# 4. 配置环境变量
点击每个Service的 "Variables"
添加所有必需的环境变量

# 5. 配置启动命令
Backend Service → "Settings"
Start Command: npm run start:prod

# 6. 自动部署
将代码推送到GitHub
Railway会自动部署
```

**Railway优点：**
- ✅ 最简单的部署
- ✅ 自动化程度最高
- ✅ 很好的开发者体验
- ✅ $5/月起

---

## 🎨 方案5：Render部署

Render是另一个简单的选项，支持免费层。

### 步骤1：创建账户并部署

```bash
# 访问Render
https://render.com/

# 使用GitHub登录

# 1. 创建新的Web Service
点击 "New +"  →  "Web Service"
连接GitHub仓库

# 2. 配置
- Name: k12-learning-api
- Build Command: npm install && npm run build
- Start Command: npm run start:prod
- Environment: Node

# 3. 添加环境变量
# ...

# 4. 创建PostgreSQL实例
点击 "New +" →  "PostgreSQL"
```

---

## 🔧 通用故障排除

### 容器无法启动

```bash
# 查看日志
docker-compose logs backend
docker-compose logs frontend

# 检查端口占用
lsof -i :3000
lsof -i :3001

# 重启所有容器
docker-compose restart
```

### 数据库连接失败

```bash
# 检查数据库容器
docker-compose ps postgres

# 查看数据库日志
docker-compose logs postgres

# 重新初始化
docker-compose exec backend npm run prisma:deploy
```

### OpenAI API错误

```bash
# 验证API密钥
echo $OPENAI_API_KEY

# 检查API配额
访问 https://platform.openai.com/account/usage
```

### 前端无法连接API

```bash
# 检查NEXT_PUBLIC_API_URL是否正确
docker-compose logs frontend

# 确保后端正在运行
curl http://localhost:3001/api/health
```

---

## 📊 成本对比

| 平台 | 最低成本 | 优点 | 缺点 |
|------|---------|------|------|
| **Heroku** | $7/月 | 最简单 | 性能一般 |
| **AWS** | $5/月 | 企业级 | 复杂 |
| **DigitalOcean** | $5/月 | 性价比高 | 需要配置 |
| **Railway** | $5/月 | 开发友好 | 较新 |
| **Render** | 免费起 | 免费层 | 限制多 |

---

## 🎯 推荐方案

### 🌟 新手：Heroku
- 最简单
- 一键部署
- 无需Docker知识

### 💼 中级：Railway 或 DigitalOcean
- 性价比高
- 相对简单
- 更好的性能

### 🏢 企业：AWS
- 最可靠
- 可高度扩展
- 最灵活

---

## ✅ 部署检查清单

- [ ] GitHub仓库已创建和推送
- [ ] OpenAI API密钥已配置
- [ ] 数据库已初始化
- [ ] 前端可以访问
- [ ] 后端API可以响应
- [ ] 测试端点: GET /api/health
- [ ] 数据库有表（检查pg_tables）
- [ ] 可以注册新用户
- [ ] 可以生成课程
- [ ] 测验可以提交

---

## 🚀 下一步

部署后：

1. **监控应用**
   - 设置错误告警
   - 监控API响应时间
   - 监控数据库性能

2. **扩展功能**
   - 添加更多课程内容
   - 改进UI/UX
   - 添加分析和报告

3. **优化性能**
   - 启用CDN
   - 优化数据库查询
   - 增加缓存层

---

## 📞 获取帮助

- 📖 查看[官方文档](./COMPLETE_PROJECT_GUIDE.md)
- 🐛 GitHub Issues
- 💬 社区讨论

---

**祝部署顺利！** 🎉
