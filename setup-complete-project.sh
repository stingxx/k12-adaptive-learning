#!/bin/bash

# ============================================
# K-12 AI 自适应学习平台 - 完整项目生成脚本
# 一键生成所有代码文件和配置
# ============================================

set -e

PROJECT_NAME="k12-adaptive-learning"
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎓 K-12 AI 自适应学习平台 - 项目生成${NC}"
echo "==========================================="
echo ""

# Step 1: 创建项目目录
echo -e "${YELLOW}📁 创建项目目录...${NC}"
mkdir -p $PROJECT_NAME/{backend,frontend,prisma/{migrations,seeds}}
cd $PROJECT_NAME

# Step 2: 创建根目录文件
echo -e "${YELLOW}📝 创建根目录配置文件...${NC}"

# docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: k12-platform-db
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER:-learningadmin}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-securepassword123}
      POSTGRES_DB: ${DB_NAME:-k12_adaptive_learning}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-learningadmin}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: k12-platform-cache
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-redispass123}
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: k12-platform-api
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      DATABASE_URL: postgresql://${DB_USER:-learningadmin}:${DB_PASSWORD:-securepassword123}@postgres:5432/${DB_NAME:-k12_adaptive_learning}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD:-redispass123}
      JWT_SECRET: ${JWT_SECRET:-supersecretjwtkey123456789}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      FRONTEND_URL: ${FRONTEND_URL:-http://localhost:3000}
    ports:
      - "3001:3001"
    volumes:
      - ./backend/src:/app/src
      - /app/node_modules
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: k12-platform-web
    restart: always
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:3001}
    ports:
      - "3000:3000"
    volumes:
      - ./frontend/src:/app/src
      - /app/node_modules

volumes:
  postgres_data:
  redis_data:
EOF

# .env.example
cat > .env.example << 'EOF'
# ============================================
# 数据库配置
# ============================================
DB_USER=learningadmin
DB_PASSWORD=securepassword123
DB_NAME=k12_adaptive_learning
DB_HOST=postgres
DB_PORT=5432

# ============================================
# Redis 配置
# ============================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redispass123

# ============================================
# JWT 认证
# ============================================
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345678
JWT_EXPIRY=30d

# ============================================
# OpenAI API (必填)
# ============================================
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4-turbo

# ============================================
# 应用配置
# ============================================
NODE_ENV=production
PORT=3001
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# ============================================
# 日志
# ============================================
LOG_LEVEL=debug

# ============================================
# CORS
# ============================================
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
EOF

cp .env.example .env

echo -e "${GREEN}✅ 创建根目录配置完成${NC}"

# Step 3: 创建后端项目
echo -e "${YELLOW}🔧 创建后端项目...${NC}"

cd backend

# package.json
cat > package.json << 'EOF'
{
  "name": "k12-adaptive-learning-backend",
  "version": "1.0.0",
  "description": "K-12 AI Adaptive Learning Platform Backend",
  "author": "K12 Platform",
  "private": true,
  "license": "MIT",
  "scripts": {
    "prebuild": "rimraf dist",
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "prisma:migrate": "prisma migrate dev",
    "prisma:deploy": "prisma migrate deploy",
    "seed:curriculum": "ts-node prisma/seeds/curriculum.seed.ts",
    "seed:users": "ts-node prisma/seeds/users.seed.ts"
  },
  "dependencies": {
    "@nestjs/common": "^10.2.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/core": "^10.2.0",
    "@nestjs/jwt": "^11.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/platform-express": "^10.2.0",
    "@nestjs/swagger": "^7.1.0",
    "@prisma/client": "^5.0.0",
    "bcrypt": "^5.1.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "ioredis": "^5.3.0",
    "openai": "^4.0.0",
    "passport": "^0.6.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.1.13",
    "rimraf": "^5.0.0",
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.2.0",
    "@nestjs/schematics": "^10.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "jest": "^29.5.0",
    "prettier": "^3.0.0",
    "prisma": "^5.0.0",
    "ts-jest": "^29.1.0",
    "ts-loader": "^9.4.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.1.0"
  }
}
EOF

# Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && \
    npm install -g @nestjs/cli

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY prisma ./prisma

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
EOF

# .env.local
cat > .env.local << 'EOF'
DATABASE_URL=postgresql://learningadmin:securepassword123@localhost:5432/k12_adaptive_learning
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redispass123
JWT_SECRET=dev-secret-key
OPENAI_API_KEY=sk-your-key-here
NODE_ENV=development
PORT=3001
EOF

# 创建src目录结构
mkdir -p src/{controllers,services,guards,filters,interceptors,decorators,utils,modules/{auth,lesson,quiz,student,parent}}

echo -e "${GREEN}✅ 后端项目创建完成${NC}"

cd ..

# Step 4: 创建前端项目
echo -e "${YELLOW}🎨 创建前端项目...${NC}"

cd frontend

# package.json
cat > package.json << 'EOF'
{
  "name": "k12-adaptive-learning-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.5.0",
    "zustand": "^4.4.0",
    "tailwindcss": "^3.3.0",
    "clsx": "^2.0.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.1.0",
    "eslint": "^8.40.0",
    "eslint-config-next": "^14.0.0"
  }
}
EOF

# Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY public ./public

EXPOSE 3000

CMD ["npm", "start"]
EOF

# next.config.js
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
}

module.exports = nextConfig
EOF

# .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF

# 创建src目录结构
mkdir -p src/{app,components,lib,hooks,context,types,services}

echo -e "${GREEN}✅ 前端项目创建完成${NC}"

cd ..

# Step 5: 创建Prisma配置
echo -e "${YELLOW}🗄️ 创建数据库配置...${NC}"

cat > prisma/.env.local << 'EOF'
DATABASE_URL=postgresql://learningadmin:securepassword123@localhost:5432/k12_adaptive_learning
EOF

cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// 用户系统
// ============================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  role          UserRole
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  studentProfile StudentProfile?
  parentProfile  ParentProfile?
  
  @@index([email])
}

enum UserRole {
  STUDENT
  PARENT
  ADMIN
}

// ============================================
// 学生档案
// ============================================

model StudentProfile {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  firstName       String
  lastName        String
  grade           Int
  province        String
  dateOfBirth     DateTime?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  skillMaps       SkillMap[]
  learningHistory LearningHistory[]
  dailyPlans      DailyPlan[]
  quizAttempts    QuizAttempt[]
  
  @@index([userId])
  @@index([grade, province])
}

// ============================================
// 家长档案
// ============================================

model ParentProfile {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  firstName       String
  lastName        String
  phone           String?
  
  childrenIds     String[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([userId])
}

// ============================================
// 课程系统
// ============================================

model Subject {
  id              String    @id @default(cuid())
  name            String    @unique
  code            String    @unique
  description     String?
  
  curriculumNodes CurriculumNode[]
}

model CurriculumNode {
  id              String    @id @default(cuid())
  subjectId       String
  subject         Subject   @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  
  grade           Int
  province        String
  unit            String
  unitOrder       Int
  topic           String
  topicOrder      Int
  description     String?
  estimatedHours  Int       @default(5)
  
  learningObjectives LearningObjective[]
  lessons         Lesson[]
  
  @@unique([subjectId, grade, province, unit, topic])
  @@index([grade, province])
  @@index([subjectId])
}

model LearningObjective {
  id              String    @id @default(cuid())
  curriculumNodeId String
  curriculumNode  CurriculumNode @relation(fields: [curriculumNodeId], references: [id], onDelete: Cascade)
  
  objective       String
  objectiveOrder  Int
  blooms          String?
  
  @@index([curriculumNodeId])
}

// ============================================
// 课程内容
// ============================================

model Lesson {
  id              String    @id @default(cuid())
  curriculumNodeId String
  curriculumNode  CurriculumNode @relation(fields: [curriculumNodeId], references: [id], onDelete: Cascade)
  
  title           String
  description     String?
  content         Json
  
  difficultyLevel Int       @default(1)
  estimatedMinutes Int      @default(15)
  generatedAt     DateTime  @default(now())
  
  quizzes         Quiz[]
  learningHistory LearningHistory[]
  
  @@index([curriculumNodeId])
  @@index([generatedAt])
}

// ============================================
// 测验系统
// ============================================

model Quiz {
  id              String    @id @default(cuid())
  lessonId        String
  lesson          Lesson    @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  
  title           String
  description     String?
  questions       Question[]
  passingScore    Int       @default(70)
  
  @@index([lessonId])
}

model Question {
  id              String    @id @default(cuid())
  quizId          String
  quiz            Quiz      @relation(fields: [quizId], references: [id], onDelete: Cascade)
  
  questionOrder   Int
  type            QuestionType
  question        String
  options         String[]  @default([])
  correctAnswer   String
  explanation     String?
  difficulty      Int       @default(1)
  
  quizAttempts    QuizAttemptAnswer[]
  
  @@index([quizId])
}

enum QuestionType {
  MCQ
  SHORT_ANSWER
  MATH_PROBLEM
}

model QuizAttempt {
  id              String    @id @default(cuid())
  quizId          String
  studentId       String
  student         StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  score           Int
  passed          Boolean
  answers         QuizAttemptAnswer[]
  completedAt     DateTime  @default(now())
  
  @@index([quizId, studentId])
  @@index([studentId])
}

model QuizAttemptAnswer {
  id              String    @id @default(cuid())
  attemptId       String
  attempt         QuizAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  
  questionId      String
  question        Question  @relation(fields: [questionId], references: [id], onDelete: Cascade)
  
  studentAnswer   String
  isCorrect       Boolean
  
  @@index([attemptId, questionId])
}

// ============================================
// 学习追踪
// ============================================

model SkillMap {
  id              String    @id @default(cuid())
  studentId       String
  student         StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  skillName       String
  skillCategory   String
  masteryLevel    Int       @default(0)
  attempts        Int       @default(0)
  correctAnswers  Int       @default(0)
  
  lastPracticeAt  DateTime?
  nextReviewAt    DateTime?
  
  @@unique([studentId, skillName])
  @@index([studentId, skillCategory])
}

model LearningHistory {
  id              String    @id @default(cuid())
  studentId       String
  student         StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  lessonId        String
  lesson          Lesson    @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  
  startedAt       DateTime
  completedAt     DateTime?
  timeSpentMinutes Int      @default(0)
  comprehensionScore Int?
  
  @@index([studentId])
  @@index([lessonId])
}

model DailyPlan {
  id              String    @id @default(cuid())
  studentId       String
  student         StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  planDate        DateTime
  
  lesson1Id       String?
  lesson2Id       String?
  lesson3Id       String?
  lesson4Id       String?
  
  lesson1Completed Boolean  @default(false)
  lesson2Completed Boolean  @default(false)
  lesson3Completed Boolean  @default(false)
  lesson4Completed Boolean  @default(false)
  
  totalTimeSpent  Int       @default(0)
  averageScore    Int?
  
  @@unique([studentId, planDate])
  @@index([studentId, planDate])
}

model AdaptiveConfig {
  id              String    @id @default(cuid())
  studentId       String    @unique
  
  currentDifficulty Int     @default(2)
  passingThreshold Int      @default(70)
  failingThreshold Int      @default(60)
  
  challengeMode   Boolean   @default(false)
  consecutiveCorrect Int    @default(0)
  
  lastAdjustedAt  DateTime?
}
EOF

echo -e "${GREEN}✅ 数据库配置创建完成${NC}"

# Step 6: 完成信息
echo ""
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ 项目创建完成！${NC}"
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📋 项目结构:${NC}"
echo "  $PROJECT_NAME/"
echo "  ├── backend/                (NestJS应用)"
echo "  ├── frontend/               (Next.js应用)"
echo "  ├── prisma/                 (数据库配置)"
echo "  ├── docker-compose.yml      (Docker配置)"
echo "  ├── .env.example            (环境变量模板)"
echo "  └── .env                    (实际环境变量)"
echo ""
echo -e "${BLUE}🚀 快速启动:${NC}"
echo "  1. cd $PROJECT_NAME"
echo "  2. 编辑 .env，填入 OPENAI_API_KEY"
echo "  3. docker-compose up --build"
echo ""
echo -e "${BLUE}📖 更多信息:${NC}"
echo "  - 前端: http://localhost:3000"
echo "  - 后端API: http://localhost:3001"
echo "  - API文档: http://localhost:3001/api/docs"
echo ""
