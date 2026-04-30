// backend/src/services/ai/lesson-generator.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenAiService } from './openai.service';
import { CacheService } from '../cache/cache.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LessonGeneratorService {
  constructor(
    private prisma: PrismaService,
    private openai: OpenAiService,
    private cache: CacheService,
    private config: ConfigService,
  ) {}

  /**
   * 为学生生成课程
   * 1. 检查缓存
   * 2. 如果没有 -> 调用AI生成
   * 3. 保存到数据库
   * 4. 缓存结果
   */
  async generateLesson(
    studentId: string,
    curriculumNodeId: string,
    difficultyLevel?: number,
  ) {
    // 检查缓存
    const cacheKey = `lesson:${studentId}:${curriculumNodeId}:${difficultyLevel || 1}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 获取课程节点信息
    const curriculumNode = await this.prisma.curriculumNode.findUnique({
      where: { id: curriculumNodeId },
      include: {
        subject: true,
        learningObjectives: true,
      },
    });

    if (!curriculumNode) {
      throw new Error('课程节点不存在');
    }

    // 获取学生信息
    const student = await this.prisma.studentProfile.findUnique({
      where: { id: studentId },
    });

    // 构建prompt
    const prompt = this.buildLessonPrompt(
      curriculumNode,
      student,
      difficultyLevel || 1,
    );

    // 调用AI生成课程
    const aiResponse = await this.openai.generateLesson(prompt);
    const lessonContent = this.parseLessonResponse(aiResponse);

    // 保存到数据库
    const lesson = await this.prisma.lesson.create({
      data: {
        curriculumNodeId: curriculumNodeId,
        title: lessonContent.title,
        description: lessonContent.description,
        content: lessonContent.content,
        difficultyLevel: difficultyLevel || 1,
        estimatedMinutes: lessonContent.estimatedMinutes,
      },
    });

    // 缓存（24小时）
    await this.cache.set(cacheKey, lesson, 86400);

    return lesson;
  }

  /**
   * 为学生生成今日课程（4个科目）
   */
  async generateDailyLessons(studentId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { id: studentId },
    });

    // 检查今天是否已生成
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingPlan = await this.prisma.dailyPlan.findUnique({
      where: {
        studentId_planDate: {
          studentId,
          planDate: today,
        },
      },
    });

    if (existingPlan) {
      return existingPlan;
    }

    // 获取学生的自适应配置
    const adaptiveConfig = await this.prisma.adaptiveConfig.findUnique({
      where: { studentId },
    });

    const difficulty = adaptiveConfig?.currentDifficulty || 2;

    // 为4个科目获取课程节点
    const subjects = ['Math', 'Science', 'English', 'Social Studies'];
    const curriculumNodes = await this.prisma.curriculumNode.findMany({
      where: {
        grade: student.grade,
        subject: {
          name: { in: subjects },
        },
      },
      include: { subject: true },
    });

    // 为每个科目选择一个合适的节点
    const selectedNodes = {};
    for (const subject of subjects) {
      const subjectNodes = curriculumNodes.filter(
        (n) => n.subject.name === subject,
      );
      if (subjectNodes.length > 0) {
        // 简单地选择第一个，实际可以基于学生的mastery选择
        selectedNodes[subject] = subjectNodes[0];
      }
    }

    // 生成4个课程
    const lesson1 = selectedNodes['Math']
      ? await this.generateLesson(studentId, selectedNodes['Math'].id, difficulty)
      : null;

    const lesson2 = selectedNodes['Science']
      ? await this.generateLesson(studentId, selectedNodes['Science'].id, difficulty)
      : null;

    const lesson3 = selectedNodes['English']
      ? await this.generateLesson(studentId, selectedNodes['English'].id, difficulty)
      : null;

    const lesson4 = selectedNodes['Social Studies']
      ? await this.generateLesson(studentId, selectedNodes['Social Studies'].id, difficulty)
      : null;

    // 创建每日计划
    const plan = await this.prisma.dailyPlan.create({
      data: {
        studentId,
        planDate: today,
        lesson1Id: lesson1?.id,
        lesson2Id: lesson2?.id,
        lesson3Id: lesson3?.id,
        lesson4Id: lesson4?.id,
      },
    });

    return plan;
  }

  /**
   * 构建AI提示
   */
  private buildLessonPrompt(
    curriculumNode: any,
    student: any,
    difficulty: number,
  ) {
    const difficultyDescriptions = {
      1: '非常简单，适合初学者',
      2: '简单，适合大多数学生',
      3: '中等，需要一些思考',
      4: '困难，需要深入理解',
      5: '非常困难，挑战性问题',
    };

    return `
你是一位经验丰富的K-12教师。请为以下课程生成一堂课程内容。

【课程信息】
科目: ${curriculumNode.subject.name}
年级: ${student.grade}
单元: ${curriculumNode.unit}
主题: ${curriculumNode.topic}
学习目标: ${curriculumNode.learningObjectives.map((o: any) => o.objective).join('; ')}

【学生信息】
年级: ${student.grade}
省份: ${student.province}
难度级别: ${difficulty} (${difficultyDescriptions[difficulty]})

【要求】
请生成一堂结构化的课程，包含以下部分，并用JSON格式返回：
{
  "title": "课程标题",
  "description": "简短描述",
  "content": {
    "introduction": "引入部分 - 激发学生兴趣",
    "mainContent": "主要内容 - 清晰的解释和例子",
    "examples": ["例子1", "例子2", "例子3"],
    "keyPoints": ["要点1", "要点2", "要点3"],
    "summary": "总结 - 关键收获",
    "interactiveActivity": "互动活动建议"
  },
  "estimatedMinutes": 15
}

确保内容：
1. 适合${student.grade}年级学生的认知水平
2. 包含真实的、贴近加拿大学生生活的例子
3. 符合困难级别${difficulty}
4. 符合学习目标
5. 引人入胜且教育性强
    `;
  }

  /**
   * 解析AI响应
   */
  private parseLessonResponse(response: string) {
    try {
      // 提取JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法解析AI响应');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        title: parsed.title || '未命名课程',
        description: parsed.description || '',
        content: parsed.content || {},
        estimatedMinutes: parsed.estimatedMinutes || 15,
      };
    } catch (error) {
      console.error('解析错误:', error);
      // 返回默认值
      return {
        title: '课程',
        description: '正在加载内容...',
        content: { introduction: response },
        estimatedMinutes: 15,
      };
    }
  }
}
