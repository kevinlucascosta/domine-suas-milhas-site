export type CourseMissionCopy = {
  missionTitles: string[];
  missionTexts: string[];
  missionHub: string;
  missionHeadline: string;
  missionDescription: string;
  level: string;
  xpProgress: string;
  loadingXp: string;
  map: string;
  all: string;
  inProgress: string;
  completed: string;
  available: string;
  nextAction: string;
  completedMission: string;
  startMission: string;
  continueMission: string;
  viewLesson: string;
  startLesson: string;
  continueLesson: string;
  lessonComplete: string;
  courseLessonTitle: string;
  courseLessonText: string;
  questions: string;
  courseMap: string;
  learningTrail: string;
  trailHeadline: string;
  trailDescription: string;
  modules: string;
  allModules: string;
  completedModules: string;
  moduleInProgress: string;
  availableModules: string;
  moduleTitles: string[];
  moduleMeta: string[];
};

export const courseMissionCopy: Record<string, CourseMissionCopy> = {
  "pt-BR": { missionTitles: ["Complete seu perfil", "Assista à aula 01", "Faça o quiz do módulo 01", "Use o simulador"], missionTexts: ["Adicione foto e seus programas favoritos", "Fundamentos das milhas", "Teste o que você aprendeu", "Salve sua primeira projeção"], missionHub: "CENTRAL DE MISSÕES", missionHeadline: "Transforme intenção em hábito.", missionDescription: "Complete ações pequenas e acumule XP para desbloquear novas conquistas.", level: "NÍVEL", xpProgress: "SEU PROGRESSO DE XP", loadingXp: "Carregando XP...", map: "Mapa do curso", all: "Todas", inProgress: "Em andamento", completed: "Concluídas", available: "DISPONÍVEL", nextAction: "PRÓXIMA AÇÃO", completedMission: "Missão concluída", startMission: "Começar missão", continueMission: "Continuar missão", viewLesson: "Ver aula", startLesson: "Começar aula", continueLesson: "Continuar aula", lessonComplete: "CONCLUÍDA", courseLessonTitle: "Aula 01 · Fundamentos das milhas", courseLessonText: "2 PDFs no carrossel · revisão e desafio", questions: "questões", courseMap: "MAPA DO CURSO", learningTrail: "SUA TRILHA DE APRENDIZADO", trailHeadline: "Do primeiro ponto ao resgate perfeito.", trailDescription: "Avance pelos módulos e desbloqueie novas estratégias.", modules: "módulos", allModules: "Todos", completedModules: "Concluídos", moduleInProgress: "Em andamento", availableModules: "Disponível", moduleTitles: ["Fundamentos das milhas", "Programas de fidelidade", "Cartões que pontuam"], moduleMeta: ["4 aulas • 48 min", "5 aulas • 1h 15min", "6 aulas • 1h 32min"] },
  en: { missionTitles: ["Complete your profile", "Watch lesson 01", "Take the module 01 quiz", "Use the simulator"], missionTexts: ["Add a photo and your favorite programs", "Miles fundamentals", "Test what you learned", "Save your first estimate"], missionHub: "MISSION HUB", missionHeadline: "Turn intention into a habit.", missionDescription: "Complete small actions and earn XP to unlock new achievements.", level: "LEVEL", xpProgress: "YOUR XP PROGRESS", loadingXp: "Loading XP...", map: "Course map", all: "All", inProgress: "In progress", completed: "Completed", available: "AVAILABLE", nextAction: "NEXT ACTION", completedMission: "Mission completed", startMission: "Start mission", continueMission: "Continue mission", viewLesson: "View lesson", startLesson: "Start lesson", continueLesson: "Continue lesson", lessonComplete: "COMPLETED", courseLessonTitle: "Lesson 01 · Miles fundamentals", courseLessonText: "2 PDFs in the carousel · review and challenge", questions: "questions", courseMap: "COURSE MAP", learningTrail: "YOUR LEARNING PATH", trailHeadline: "From the first point to the perfect redemption.", trailDescription: "Move through the modules and unlock new strategies.", modules: "modules", allModules: "All", completedModules: "Completed", moduleInProgress: "In progress", availableModules: "Available", moduleTitles: ["Miles fundamentals", "Loyalty programs", "Rewarding cards"], moduleMeta: ["4 lessons • 48 min", "5 lessons • 1h 15min", "6 lessons • 1h 32min"] },
  "pt-PT": { missionTitles: ["Complete o seu perfil", "Veja a aula 01", "Faça o questionário do módulo 01", "Use o simulador"], missionTexts: ["Adicione uma foto e os seus programas favoritos", "Fundamentos das milhas", "Teste o que aprendeu", "Guarde a sua primeira projeção"], missionHub: "CENTRAL DE MISSÕES", missionHeadline: "Transforme a intenção em hábito.", missionDescription: "Complete pequenas ações e acumule XP para desbloquear novas conquistas.", level: "NÍVEL", xpProgress: "O SEU PROGRESSO DE XP", loadingXp: "A carregar XP...", map: "Mapa do curso", all: "Todas", inProgress: "Em curso", completed: "Concluídas", available: "DISPONÍVEL", nextAction: "PRÓXIMA AÇÃO", completedMission: "Missão concluída", startMission: "Começar missão", continueMission: "Continuar missão", viewLesson: "Ver aula", startLesson: "Começar aula", continueLesson: "Continuar aula", lessonComplete: "CONCLUÍDA", courseLessonTitle: "Aula 01 · Fundamentos das milhas", courseLessonText: "2 PDFs no carrossel · revisão e desafio", questions: "questões", courseMap: "MAPA DO CURSO", learningTrail: "O SEU PERCURSO DE APRENDIZAGEM", trailHeadline: "Do primeiro ponto ao resgate perfeito.", trailDescription: "Avance pelos módulos e desbloqueie novas estratégias.", modules: "módulos", allModules: "Todos", completedModules: "Concluídos", moduleInProgress: "Em curso", availableModules: "Disponível", moduleTitles: ["Fundamentos das milhas", "Programas de fidelização", "Cartões que acumulam pontos"], moduleMeta: ["4 aulas • 48 min", "5 aulas • 1h 15min", "6 aulas • 1h 32min"] },
  es: { missionTitles: ["Completa tu perfil", "Mira la lección 01", "Haz el quiz del módulo 01", "Usa el simulador"], missionTexts: ["Añade una foto y tus programas favoritos", "Fundamentos de las millas", "Prueba lo que aprendiste", "Guarda tu primera estimación"], missionHub: "CENTRAL DE MISIONES", missionHeadline: "Convierte la intención en hábito.", missionDescription: "Completa pequeñas acciones y gana XP para desbloquear nuevos logros.", level: "NIVEL", xpProgress: "TU PROGRESO DE XP", loadingXp: "Cargando XP...", map: "Mapa del curso", all: "Todas", inProgress: "En curso", completed: "Completadas", available: "DISPONIBLE", nextAction: "PRÓXIMA ACCIÓN", completedMission: "Misión completada", startMission: "Empezar misión", continueMission: "Continuar misión", viewLesson: "Ver lección", startLesson: "Empezar lección", continueLesson: "Continuar lección", lessonComplete: "COMPLETADA", courseLessonTitle: "Lección 01 · Fundamentos de las millas", courseLessonText: "2 PDF en el carrusel · revisión y desafío", questions: "preguntas", courseMap: "MAPA DEL CURSO", learningTrail: "TU RUTA DE APRENDIZAJE", trailHeadline: "Del primer punto al canje perfecto.", trailDescription: "Avanza por los módulos y desbloquea nuevas estrategias.", modules: "módulos", allModules: "Todos", completedModules: "Completados", moduleInProgress: "En curso", availableModules: "Disponible", moduleTitles: ["Fundamentos de las millas", "Programas de fidelidad", "Tarjetas que acumulan puntos"], moduleMeta: ["4 lecciones • 48 min", "5 lecciones • 1 h 15 min", "6 lecciones • 1 h 32 min"] },
  ja: { missionTitles: ["プロフィールを完成", "レッスン01を見る", "モジュール01のクイズに答える", "シミュレーターを使う"], missionTexts: ["写真とお気に入りのプログラムを追加", "マイルの基礎", "学んだことを試す", "最初の予測を保存"], missionHub: "ミッションセンター", missionHeadline: "意図を習慣に変えよう。", missionDescription: "小さな行動を完了してXPを獲得し、新しい達成を解除しましょう。", level: "レベル", xpProgress: "あなたのXP進捗", loadingXp: "XPを読み込み中...", map: "コースマップ", all: "すべて", inProgress: "進行中", completed: "完了", available: "利用可能", nextAction: "次のアクション", completedMission: "ミッション完了", startMission: "ミッションを始める", continueMission: "ミッションを続ける", viewLesson: "レッスンを見る", startLesson: "レッスンを始める", continueLesson: "レッスンを続ける", lessonComplete: "完了", courseLessonTitle: "レッスン01 · マイルの基礎", courseLessonText: "カルーセル内のPDF 2件 · 復習とチャレンジ", questions: "問", courseMap: "コースマップ", learningTrail: "あなたの学習パス", trailHeadline: "最初のポイントから完璧な特典交換へ。", trailDescription: "モジュールを進めて、新しい戦略を解除しましょう。", modules: "モジュール", allModules: "すべて", completedModules: "完了", moduleInProgress: "進行中", availableModules: "利用可能", moduleTitles: ["マイルの基礎", "ロイヤルティプログラム", "ポイントが貯まるカード"], moduleMeta: ["4レッスン • 48分", "5レッスン • 1時間15分", "6レッスン • 1時間32分"] },
  zh: { missionTitles: ["完成个人资料", "观看第01课", "完成模块01测验", "使用模拟器"], missionTexts: ["添加照片和常用计划", "里程基础", "测试所学内容", "保存第一次预测"], missionHub: "任务中心", missionHeadline: "把意愿变成习惯。", missionDescription: "完成小行动并积累XP，解锁新的成就。", level: "等级", xpProgress: "你的XP进度", loadingXp: "正在加载XP...", map: "课程地图", all: "全部", inProgress: "进行中", completed: "已完成", available: "可用", nextAction: "下一步行动", completedMission: "任务已完成", startMission: "开始任务", continueMission: "继续任务", viewLesson: "查看课程", startLesson: "开始课程", continueLesson: "继续课程", lessonComplete: "已完成", courseLessonTitle: "第01课 · 里程基础", courseLessonText: "轮播中的2个PDF · 复习和挑战", questions: "题", courseMap: "课程地图", learningTrail: "你的学习路径", trailHeadline: "从第一个积分到完美兑换。", trailDescription: "完成各模块并解锁新策略。", modules: "模块", allModules: "全部", completedModules: "已完成", moduleInProgress: "进行中", availableModules: "可用", moduleTitles: ["里程基础", "忠诚度计划", "可积累积分的信用卡"], moduleMeta: ["4节课 • 48分钟", "5节课 • 1小时15分钟", "6节课 • 1小时32分钟"] },
};
