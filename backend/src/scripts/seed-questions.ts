import prisma from '../config/database';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 엑셀 파일에서 문제 데이터를 읽어서 데이터베이스에 저장하는 스크립트
 * 
 * 엑셀 파일 형식:
 * - 시험유형 (공무원/변호사시험/사법시험)
 * - 시험년도 (예: 2023)
 * - 문제번호 (예: 1)
 * - 카테고리 (예: 총론)
 * - 문제내용 (전체 문제 텍스트)
 * - 선택지1, 선택지2, 선택지3, 선택지4, 선택지5
 * - 정답 (1~5)
 * - 해설
 * - 판례 (선택사항)
 * - 키워드 (쉼표로 구분, 예: "형법총론,고의,과실")
 * - 난이도 (쉬움/보통/어려움/전문가)
 */

interface QuestionData {
  시험유형: string;
  시험년도: number;
  문제번호: number;
  카테고리: string;
  문제내용: string;
  선택지1: string;
  선택지2: string;
  선택지3: string;
  선택지4: string;
  선택지5?: string;
  정답: number;
  해설: string;
  판례?: string;
  키워드: string;
  난이도: string;
}

// 시험 유형 매핑
const examTypeMap: { [key: string]: string } = {
  '공무원': 'CIVIL_SERVICE',
  '변호사시험': 'BAR_EXAM',
  '사법시험': 'JUDICIAL_EXAM',
  '연습문제': 'PRACTICE',
};

// 난이도 매핑
const difficultyMap: { [key: string]: string } = {
  '쉬움': 'EASY',
  '보통': 'MEDIUM',
  '어려움': 'HARD',
  '전문가': 'EXPERT',
};

async function seedQuestionsFromExcel(filePath: string) {
  console.log('📚 문제 데이터 입력 시작...');

  try {
    // 엑셀 파일 읽기
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData: QuestionData[] = XLSX.utils.sheet_to_json(worksheet);

    console.log(`✅ ${jsonData.length}개의 문제를 발견했습니다.`);

    let successCount = 0;
    let errorCount = 0;

    for (const row of jsonData) {
      try {
        // 카테고리 찾기 또는 생성
        let category = await prisma.category.findFirst({
          where: { name: row.카테고리 },
        });

        if (!category) {
          category = await prisma.category.create({
            data: {
              name: row.카테고리,
              description: `${row.카테고리} 관련 문제`,
              order: 0,
            },
          });
          console.log(`  ✨ 새 카테고리 생성: ${row.카테고리}`);
        }

        // 선택지 배열 생성
        const choices = [
          { id: 1, text: row.선택지1 },
          { id: 2, text: row.선택지2 },
          { id: 3, text: row.선택지3 },
          { id: 4, text: row.선택지4 },
        ];

        if (row.선택지5) {
          choices.push({ id: 5, text: row.선택지5 });
        }

        // 키워드 배열 생성
        const keywords = row.키워드
          ? row.키워드.split(',').map((k: string) => k.trim())
          : [];

        // 시험 유형 변환
        const examType = examTypeMap[row.시험유형] || 'PRACTICE';
        const difficulty = difficultyMap[row.난이도] || 'MEDIUM';

        // 문제 생성
        await prisma.question.create({
          data: {
            categoryId: category.id,
            examType: examType as any,
            examYear: row.시험년도,
            questionNumber: row.문제번호,
            content: row.문제내용,
            choices: choices as any,
            correctAnswer: row.정답,
            explanation: row.해설,
            caseLaw: row.판례 || null,
            keywords: keywords,
            difficulty: difficulty as any,
            isPublic: true,
          },
        });

        successCount++;
        console.log(
          `  ✅ 문제 추가: ${row.시험유형} ${row.시험년도}년 ${row.문제번호}번`
        );
      } catch (error) {
        errorCount++;
        console.error(
          `  ❌ 오류 발생 (${row.시험유형} ${row.시험년도}년 ${row.문제번호}번):`,
          error
        );
      }
    }

    console.log('\n📊 결과:');
    console.log(`  ✅ 성공: ${successCount}개`);
    console.log(`  ❌ 실패: ${errorCount}개`);
    console.log('  🎉 문제 데이터 입력 완료!\n');
  } catch (error) {
    console.error('❌ 엑셀 파일 읽기 실패:', error);
    throw error;
  }
}

// 샘플 문제 데이터 생성
async function createSampleQuestions() {
  console.log('📝 샘플 문제 생성 중...\n');

  // 카테고리 생성
  const categories = [
    { name: '형법총론', description: '형법의 기본 원리와 이론' },
    { name: '형법각론', description: '개별 범죄에 관한 내용' },
    { name: '형사소송법', description: '형사 절차에 관한 법' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  console.log('✅ 카테고리 생성 완료\n');

  // 샘플 문제
  const sampleQuestions = [
    {
      categoryName: '형법총론',
      examType: 'BAR_EXAM',
      examYear: 2023,
      questionNumber: 1,
      content: `다음 중 형법의 시간적 적용범위에 관한 설명으로 옳지 않은 것은?`,
      choices: [
        { id: 1, text: '범죄 후 법률의 변경에 의하여 그 행위가 범죄를 구성하지 아니하거나 형이 구법보다 경한 때에는 신법에 의한다.' },
        { id: 2, text: '재판확정 후 법률의 변경에 의하여 그 행위가 범죄를 구성하지 아니한 때에는 형의 집행을 면제한다.' },
        { id: 3, text: '형법은 원칙적으로 행위시법주의를 취하고 있다.' },
        { id: 4, text: '신법이 구법보다 형이 중한 경우에도 신법을 적용하는 것이 원칙이다.' },
      ],
      correctAnswer: 4,
      explanation: `형법 제1조 제2항은 "범죄 후 법률의 변경에 의하여 그 행위가 범죄를 구성하지 아니하거나 형이 구법보다 경한 때에는 신법에 의한다"고 규정하여 피고인에게 유리한 소급효를 인정하고 있습니다. 따라서 신법이 구법보다 형이 중한 경우에는 구법을 적용하는 것이 원칙입니다.

① 형법 제1조 제2항 전문에 해당합니다.
② 형법 제1조 제3항에 해당합니다.
③ 형법은 원칙적으로 범죄 시의 법률을 적용하는 행위시법주의를 취하고 있습니다.
④ 틀렸습니다. 신법이 구법보다 형이 중한 경우 구법을 적용합니다.`,
      caseLaw: '대법원 2008도10479 판결',
      keywords: ['행위시법', '소급효금지', '형법총론', '시간적적용범위'],
      difficulty: 'MEDIUM',
    },
    {
      categoryName: '형법총론',
      examType: 'CIVIL_SERVICE',
      examYear: 2023,
      questionNumber: 15,
      content: `형법 제16조의 법률의 착오에 관한 설명으로 옳은 것은?`,
      choices: [
        { id: 1, text: '자기의 행위가 법령에 의하여 죄가 되지 아니하는 것으로 오인한 행위는 그 오인에 정당한 이유가 없는 경우에도 벌하지 아니한다.' },
        { id: 2, text: '법률의 착오는 고의를 조각하는 효과가 있다.' },
        { id: 3, text: '법률의 부지는 용서되지 않는다는 것이 원칙이다.' },
        { id: 4, text: '법률의 착오와 사실의 착오는 법적 효과가 동일하다.' },
      ],
      correctAnswer: 3,
      explanation: `형법 제16조는 "자기의 행위가 법령에 의하여 죄가 되지 아니하는 것으로 오인한 행위는 그 오인에 정당한 이유가 있는 때에는 벌하지 아니한다"고 규정하고 있습니다. 이는 법률의 부지는 용서되지 않는다는 원칙(ignorantia juris non excusat)의 예외를 인정한 것입니다.

① 정당한 이유가 있는 경우에만 벌하지 않습니다.
② 법률의 착오는 원칙적으로 고의를 조각하지 않습니다.
③ 정답입니다. 다만 정당한 이유가 있는 경우 예외를 인정합니다.
④ 사실의 착오는 고의를 조각하지만 법률의 착오는 원칙적으로 고의를 조각하지 않습니다.`,
      caseLaw: '대법원 2007도8582 판결',
      keywords: ['법률의착오', '위법성의착오', '고의', '형법총론'],
      difficulty: 'MEDIUM',
    },
    {
      categoryName: '형법각론',
      examType: 'BAR_EXAM',
      examYear: 2024,
      questionNumber: 5,
      content: `절도죄의 성립요건에 관한 설명으로 옳지 않은 것은?`,
      choices: [
        { id: 1, text: '타인의 재물을 절취하여야 한다.' },
        { id: 2, text: '불법영득의 의사가 있어야 한다.' },
        { id: 3, text: '폭행 또는 협박의 수단을 사용하여야 한다.' },
        { id: 4, text: '타인의 점유를 배제하고 자기 또는 제3자의 점유로 옮겨야 한다.' },
      ],
      correctAnswer: 3,
      explanation: `절도죄는 타인의 재물을 절취함으로써 성립하는 범죄로, 폭행이나 협박을 수반하지 않는 재산범죄입니다. 폭행이나 협박을 수단으로 하는 경우는 강도죄에 해당합니다.

① 절도죄의 객체는 타인의 재물입니다.
② 절도죄는 불법영득의 의사를 요구합니다.
③ 틀렸습니다. 절도죄는 폭행이나 협박 없이 몰래 훔치는 것입니다. 폭행·협박을 수반하면 강도죄입니다.
④ 점유이전, 즉 타인의 점유를 배제하고 자기 점유로 옮기는 것이 절취행위입니다.`,
      caseLaw: '대법원 2009도6930 판결',
      keywords: ['절도죄', '불법영득의사', '점유이전', '형법각론'],
      difficulty: 'EASY',
    },
  ];

  for (const q of sampleQuestions) {
    const category = await prisma.category.findFirst({
      where: { name: q.categoryName },
    });

    if (!category) {
      console.error(`❌ 카테고리를 찾을 수 없습니다: ${q.categoryName}`);
      continue;
    }

    await prisma.question.create({
      data: {
        categoryId: category.id,
        examType: q.examType as any,
        examYear: q.examYear,
        questionNumber: q.questionNumber,
        content: q.content,
        choices: q.choices as any,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        caseLaw: q.caseLaw,
        keywords: q.keywords,
        difficulty: q.difficulty as any,
        isPublic: true,
      },
    });

    console.log(
      `  ✅ 샘플 문제 생성: ${q.examType} ${q.examYear}년 ${q.questionNumber}번`
    );
  }

  console.log('\n🎉 샘플 문제 생성 완료!\n');
}

// 메인 실행
async function main() {
  const args = process.argv.slice(2);

  if (args[0] === 'sample') {
    // 샘플 문제 생성
    await createSampleQuestions();
  } else if (args[0] && args[0].endsWith('.xlsx')) {
    // 엑셀 파일에서 문제 불러오기
    const filePath = path.resolve(args[0]);
    if (!fs.existsSync(filePath)) {
      console.error('❌ 파일을 찾을 수 없습니다:', filePath);
      process.exit(1);
    }
    await seedQuestionsFromExcel(filePath);
  } else {
    console.log(`
사용법:
  
  1. 샘플 문제 생성:
     npm run seed:questions sample

  2. 엑셀 파일에서 문제 불러오기:
     npm run seed:questions 문제목록.xlsx

엑셀 파일 형식:
  - 시트 이름: 아무거나
  - 열 제목 (첫 번째 행):
    시험유형 | 시험년도 | 문제번호 | 카테고리 | 문제내용 | 선택지1 | 선택지2 | 선택지3 | 선택지4 | 선택지5 | 정답 | 해설 | 판례 | 키워드 | 난이도

  - 시험유형: 공무원, 변호사시험, 사법시험, 연습문제
  - 난이도: 쉬움, 보통, 어려움, 전문가
  - 키워드: 쉼표로 구분 (예: "형법총론,고의,과실")
    `);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ 오류 발생:', error);
  process.exit(1);
});
