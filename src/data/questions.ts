export interface Question {
  id: number;
  topic: string;
  value: number;
  question: string;
  correctAnswers: string[];
  is_modifier?: boolean;
  modifier_value?: number;
  timer_sec?: number;
}

export interface TopicGroup {
  topic: string;
  questions: Question[];
}

export const ROUND_QUESTIONS: Question[] = [
  // Тема 1: Мобильная связь
  {
    id: 1,
    topic: "Мобильная связь",
    value: 100,
    question: "Как называется короткое текстовое сообщение в мобильной сети?",
    correctAnswers: ["смс", "sms", "сообщение", "эсемес"],
  },
  {
    id: 2,
    topic: "Мобильная связь",
    value: 200,
    question: "Какая цифра традиционно обозначает связь пятого поколения?",
    correctAnswers: ["5", "5g", "пять"],
  },
  {
    id: 3,
    topic: "Мобильная связь",
    value: 300,
    question: "Как называется небольшая пластиковая или цифровая карта, идентифицирующая абонента?",
    correctAnswers: ["сим", "симка", "сим карта", "sim", "esim", "сим-карта"],
  },
  {
    id: 4,
    topic: "Мобильная связь",
    value: 400,
    question: "Как называется услуга, позволяющая использовать связь за пределами домашнего региона?",
    correctAnswers: ["роуминг", "roaming"],
  },
  {
    id: 5,
    topic: "Мобильная связь",
    value: 500,
    question: "Какой стандарт беспроводной передачи данных назван в честь датского короля?",
    correctAnswers: ["bluetooth", "блютуз", "блютус"],
  },

  // Тема 2: Кино и сериалы
  {
    id: 6,
    topic: "Кино и сериалы",
    value: 100,
    question: "Как зовут джедая, учителя Люка Скайуокера, говорившего с необычным порядком слов?",
    correctAnswers: ["йода", "yoda", "магистр йода"],
  },
  {
    id: 7,
    topic: "Кино и сериалы",
    value: 200,
    question: "Какая вселенная включает Железного Человека, Тора и Капитана Америку?",
    correctAnswers: ["марвел", "marvel", "мстители"],
  },
  {
    id: 8,
    topic: "Кино и сериалы",
    value: 300,
    question: "В каком фильме персонаж Леонардо Ди Каприо крутит волчок, чтобы проверить реальность?",
    correctAnswers: ["начало", "inception"],
  },
  {
    id: 9,
    topic: "Кино и сериалы",
    value: 400,
    question: "Как зовут главного героя сериала «Во все тяжкие», учителя химии?",
    correctAnswers: ["уолтер уайт", "хайзенберг", "гейзенберг", "уолтер", "walter white"],
  },
  {
    id: 10,
    topic: "Кино и сериалы",
    value: 500,
    question: "Какой культовый фильм Квентина Тарантино открывается танцем под песню «You Never Can Tell»?",
    correctAnswers: ["криминальное чтиво", "pulp fiction"],
  },

  // Тема 3: Технологии и интернет
  {
    id: 11,
    topic: "Технологии",
    value: 100,
    question: "Как называется поисковый гигант, чьё название произошло от числа со 100 нулями?",
    correctAnswers: ["гугл", "google", "googol"],
  },
  {
    id: 12,
    topic: "Технологии",
    value: 200,
    question: "Какая операционная система со значком зелёного робота разработана для смартфонов?",
    correctAnswers: ["android", "андроид"],
  },
  {
    id: 13,
    topic: "Технологии",
    value: 300,
    question: "Как называется вредоносная программа, маскирующаяся под полезное приложение?",
    correctAnswers: ["троян", "троянский конь", "trojan"],
  },
  {
    id: 14,
    topic: "Технологии",
    value: 400,
    question: "Как называется глобальная сеть распределённых блоков данных, на которой работает криптовалюта?",
    correctAnswers: ["блокчейн", "blockchain"],
  },
  {
    id: 15,
    topic: "Технологии",
    value: 500,
    question: "Какой язык разметки является основой для создания всех веб-страниц?",
    correctAnswers: ["html", "хтмл"],
  },

  // Тема 4: Музыка и звук
  {
    id: 16,
    topic: "Музыка",
    value: 100,
    question: "Сколько основных нот в классической музыкальной гамме?",
    correctAnswers: ["7", "семь"],
  },
  {
    id: 17,
    topic: "Музыка",
    value: 200,
    question: "Как называется переносное устройство для прослушивания музыки через наушники?",
    correctAnswers: ["плеер", "плейер", "mp3 плеер", "ipod", "айпод"],
  },
  {
    id: 18,
    topic: "Музыка",
    value: 300,
    question: "Какой струнный инструмент имеет четыре струны и настраивается с помощью смычка?",
    correctAnswers: ["скрипка", "виолончель", "альт", "контрабас"],
  },
  {
    id: 19,
    topic: "Музыка",
    value: 400,
    question: "Как называется музыкальный стриминговый сервис от МТС?",
    correctAnswers: ["мтс музыка", "строки", "music"],
  },
  {
    id: 20,
    topic: "Музыка",
    value: 500,
    question: "Какая группа из Ливерпуля стала легендой рок-музыки 60-х годов?",
    correctAnswers: ["the beatles", "beatles", "битлз", "битлы"],
  },

  // Тема 5: Игры и поп-культура
  {
    id: 21,
    topic: "Игры",
    value: 100,
    question: "Как зовут синего ежа из культовой серии видеоигр компании SEGA?",
    correctAnswers: ["соник", "sonic"],
  },
  {
    id: 22,
    topic: "Игры",
    value: 200,
    question: "Как называется кубическая игра-песочница, созданная Маркусом Перссоном?",
    correctAnswers: ["майнкрафт", "minecraft"],
  },
  {
    id: 23,
    topic: "Игры",
    value: 300,
    question: "В какой популярной игре игроки ищут предателя на космическом корабле?",
    correctAnswers: ["among us", "амонг ас", "амонгас"],
  },
  {
    id: 24,
    topic: "Игры",
    value: 400,
    question: "Как зовут водопроводчика в красной кепке, спасающего принцессу Пич?",
    correctAnswers: ["марио", "mario", "супер марио"],
  },
  {
    id: 25,
    topic: "Игры",
    value: 500,
    question: "Как называется фэнтезийная ролевая игра про ведьмака Геральта из Ривии?",
    correctAnswers: ["ведьмак", "the witcher", "witcher"],
  },
];

export const getTopicsWithQuestions = (questions: Question[] = ROUND_QUESTIONS): TopicGroup[] => {
  const map = new Map<string, Question[]>();

  for (const q of questions) {
    if (!map.has(q.topic)) {
      map.set(q.topic, []);
    }
    map.get(q.topic)!.push(q);
  }

  return Array.from(map.entries()).map(([topic, qs]) => ({
    topic,
    questions: qs.sort((a, b) => a.value - b.value),
  }));
};

export const checkAnswerCorrectness = (userAnswer: string, correctAnswers: string[]): boolean => {
  const normalized = userAnswer
    .toLowerCase()
    .trim()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, "")
    .replace(/\s+/g, " ");

  if (!normalized) return false;

  return correctAnswers.some((ans) => {
    const normAns = ans
      .toLowerCase()
      .trim()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, "")
      .replace(/\s+/g, " ");

    return (
      normalized === normAns ||
      normalized.includes(normAns) ||
      normAns.includes(normalized)
    );
  });
};
