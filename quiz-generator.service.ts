// backend/src/services/ai/quiz-generator.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenAiService } from './openai.service';

@Injectable()
export class QuizGeneratorService {
  constructor(
    private prisma: PrismaService,
    private openai: OpenAiService,
  ) {}

  /**
   * 为课程生成测验
   */
  async generateQuiz(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        curriculumNode: {
          include: { subject: true, learningObjectives: true },
        },
      },
    });

    if (!lesson) {
      throw new Error('课程不存在');
    }

    // 构建prompt
    const prompt = this.buildQuizPrompt(lesson);

    // 调用AI生成测验
    const aiResponse = await this.openai.generateQuiz(prompt);
    const quizData = this.parseQuizResponse(aiResponse);

    // 创建测验记录
    const quiz = await this.prisma.quiz.create({
      data: {
        lessonId,
        title: `${lesson.title} - 测验`,
        description: `检验关于${lesson.curriculumNode.topic}的理解`,
        passingScore: 70,
        allowRetake: true,
      },
    });

    // 创建题目
    const questions = quizData.questions;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await this.prisma.question.create({
        data: {
          quizId: quiz.id,
          questionOrder: i + 1,
          type: q.type,
          question: q.question,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          acceptedAnswers: q.acceptedAnswers || [q.correctAnswer],
          explanation: q.explanation,
          difficulty: lesson.difficultyLevel,
        },
      });
    }

    return {
      quizId: quiz.id,
      questionCount: questions.length,
    };
  }

  /**
   * 评分学生答案
   */
  async scoreQuizAttempt(
    studentId: string,
    quizId: string,
    answers: Array<{ questionId: string; answer: string }>,
  ) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) {
      throw new Error('测验不存在');
    }

    // 创建尝试记录
    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId,
        studentId,
        startedAt: new Date(),
        score: 0, // 稍后更新
        passed: false, // 稍后更新
      },
    });

    // 评分每个问题
    let totalScore = 0;
    const detailedResults = [];

    for (const studentAnswer of answers) {
      const question = quiz.questions.find((q) => q.id === studentAnswer.questionId);

      if (!question) {
        continue;
      }

      // 判断是否正确
      let isCorrect = false;

      if (question.type === 'MCQ') {
        // 选择题：直接比较
        isCorrect = studentAnswer.answer.toUpperCase() === question.correctAnswer.toUpperCase();
      } else if (question.type === 'SHORT_ANSWER') {
        // 短答题：检查接受的答案
        const normalized = studentAnswer.answer.toLowerCase().trim();
        isCorrect = question.acceptedAnswers.some(
          (accepted) => accepted.toLowerCase().trim() === normalized,
        );
      } else if (question.type === 'MATH_PROBLEM') {
        // 数学题：可以使用表达式评估
        isCorrect = this.evaluateMathAnswer(studentAnswer.answer, question.correctAnswer);
      }

      // 记录答案
      await this.prisma.quizAttemptAnswer.create({
        data: {
          attemptId: attempt.id,
          questionId: question.id,
          studentAnswer: studentAnswer.answer,
          isCorrect,
        },
      });

      if (isCorrect) {
        totalScore += 100 / answers.length;
      }

      detailedResults.push({
        questionId: question.id,
        question: question.question,
        studentAnswer: studentAnswer.answer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
      });
    }

    // 更新尝试记录的最终分数
    const finalScore = Math.round(totalScore);
    const passed = finalScore >= quiz.passingScore;

    await this.prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        score: finalScore,
        passed,
      },
    });

    // 更新技能映射
    const student = await this.prisma.studentProfile.findUnique({
      where: { id: studentId },
    });

    const skillName = 'General Knowledge'; // 可以根据课程内容改进
    
    let skillMap = await this.prisma.skillMap.findUnique({
      where: {
        studentId_skillName: {
          studentId,
          skillName,
        },
      },
    });

    if (!skillMap) {
      skillMap = await this.prisma.skillMap.create({
        data: {
          studentId,
          skillName,
          skillCategory: 'General',
          masteryLevel: 0,
        },
      });
    }

    // 更新mastery level
    const correctCount = detailedResults.filter((r) => r.isCorrect).length;
    const newMastery = Math.round(
      (skillMap.masteryLevel * skillMap.attempts + finalScore) / (skillMap.attempts + 1),
    );

    await this.prisma.skillMap.update({
      where: { id: skillMap.id },
      data: {
        masteryLevel: newMastery,
        attempts: skillMap.attempts + 1,
        correctAnswers: skillMap.correctAnswers + correctCount,
        lastPracticeAt: new Date(),
      },
    });

    // 根据分数调整难度
    await this.adjustStudentDifficulty(studentId, finalScore);

    return {
      attemptId: attempt.id,
      score: finalScore,
      passed,
      passingScore: quiz.passingScore,
      results: detailedResults,
      newMasteryLevel: newMastery,
    };
  }

  /**
   * 根据分数调整学生难度
   */
  private async adjustStudentDifficulty(studentId: string, score: number) {
    let config = await this.prisma.adaptiveConfig.findUnique({
      where: { studentId },
    });

    if (!config) {
      config = await this.prisma.adaptiveConfig.create({
        data: { studentId },
      });
    }

    // 难度调整逻辑
    if (score >= 85 && config.currentDifficulty < 5) {
      config.consecutiveCorrect++;
      if (config.consecutiveCorrect >= 3) {
        // 连续3次高分，升级难度
        await this.prisma.adaptiveConfig.update({
          where: { studentId },
          data: {
            currentDifficulty: config.currentDifficulty + 1,
            consecutiveCorrect: 0,
            challengeMode: true,
            lastAdjustedAt: new Date(),
          },
        });
      }
    } else if (score < 60 && config.currentDifficulty > 1) {
      // 分数太低，降级
      await this.prisma.adaptiveConfig.update({
        where: { studentId },
        data: {
          currentDifficulty: Math.max(1, config.currentDifficulty - 1),
          consecutiveCorrect: 0,
          challengeMode: false,
          lastAdjustedAt: new Date(),
        },
      });
    } else {
      // 重置连续正确计数
      await this.prisma.adaptiveConfig.update({
        where: { studentId },
        data: {
          consecutiveCorrect: 0,
        },
      });
    }
  }

  /**
   * 评估数学答案
   */
  private evaluateMathAnswer(studentAnswer: string, correctAnswer: string): boolean {
    // 简单的数值比较
    try {
      const student = parseFloat(studentAnswer.trim());
      const correct = parseFloat(correctAnswer.trim());
      // 允许0.01的误差
      return Math.abs(student - correct) < 0.01;
    } catch {
      return false;
    }
  }

  /**
   * 构建测验prompt
   */
  private buildQuizPrompt(lesson: any) {
    return `
你是一位教育评估专家。请为以下课程生成5道测验题目。

【课程信息】
标题: ${lesson.title}
主题: ${lesson.curriculumNode.topic}
学习目标: ${lesson.curriculumNode.learningObjectives.map((o: any) => o.objective).join('; ')}

【要求】
生成5道题目，混合以下类型：
- 2道选择题 (MCQ)
- 2道简短答题 (SHORT_ANSWER)
- 1道数学题 (MATH_PROBLEM，如果适用)

返回格式为JSON数组：
[
  {
    "type": "MCQ",
    "question": "问题文本",
    "options": ["A) 选项A", "B) 选项B", "C) 选项C", "D) 选项D"],
    "correctAnswer": "B",
    "explanation": "为什么B是正确答案的解释"
  },
  {
    "type": "SHORT_ANSWER",
    "question": "请解释...",
    "correctAnswer": "完整答案",
    "acceptedAnswers": ["答案变体1", "答案变体2"],
    "explanation": "答案解释"
  },
  {
    "type": "MATH_PROBLEM",
    "question": "2 + 2 = ?",
    "correctAnswer": "4",
    "explanation": "基本的加法"
  }
]

确保：
1. 题目符合课程内容
2. 题目清晰明确
3. 难度适当
4. 有详细的解释
    `;
  }

  /**
   * 解析测验响应
   */
  private parseQuizResponse(response: string) {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('无法解析');
      }
      const questions = JSON.parse(jsonMatch[0]);
      return { questions };
    } catch (error) {
      console.error('解析错误:', error);
      return {
        questions: [
          {
            type: 'MCQ',
            question: '这是一个示例问题',
            options: ['A) 选项A', 'B) 选项B', 'C) 选项C', 'D) 选项D'],
            correctAnswer: 'B',
            explanation: '这是一个示例解释',
          },
        ],
      };
    }
  }
}

// ============================================
// Quiz Controller
// ============================================

import { Controller, Post, Body, UseGuards, Request, Get, Param } from '@nestjs/common';

@Controller('api/quizzes')
@UseGuards(JwtAuthGuard)
export class QuizController {
  constructor(
    private quizGeneratorService: QuizGeneratorService,
    private prisma: PrismaService,
  ) {}

  /**
   * GET /api/quizzes/:id
   * 获取测验详情
   */
  @Get(':id')
  async getQuiz(@Param('id') quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          select: {
            id: true,
            questionOrder: true,
            type: true,
            question: true,
            options: true,
            // 不返回答案
          },
        },
      },
    });

    return quiz;
  }

  /**
   * POST /api/quizzes/:id/submit
   * 提交测验答案
   */
  @Post(':id/submit')
  async submitQuiz(
    @Request() req: any,
    @Param('id') quizId: string,
    @Body() body: { answers: Array<{ questionId: string; answer: string }> },
  ) {
    const studentId = req.user.id;

    const result = await this.quizGeneratorService.scoreQuizAttempt(
      studentId,
      quizId,
      body.answers,
    );

    return result;
  }

  /**
   * GET /api/quizzes/:id/attempts
   * 获取学生的测验尝试历史
   */
  @Get(':id/attempts')
  async getAttempts(
    @Request() req: any,
    @Param('id') quizId: string,
  ) {
    const studentId = req.user.id;

    const attempts = await this.prisma.quizAttempt.findMany({
      where: { quizId, studentId },
      orderBy: { completedAt: 'desc' },
      include: {
        answers: {
          include: { question: true },
        },
      },
    });

    return attempts;
  }
}
