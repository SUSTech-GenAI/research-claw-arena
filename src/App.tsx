import {ReactNode, useEffect, useState} from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Github,
  Trophy,
  Zap,
  Clock,
  CheckCircle,
  Star,
  Lightbulb,
  PenTool,
  Image as ImageIcon,
  FlaskConical,
  ChevronRight,
} from 'lucide-react';

type Locale = 'en' | 'zh-CN';
type PageId = 'leaderboards' | 'arena';
type ArenaId = 'idea' | 'experiment' | 'writing' | 'plotting';
type RoundId =
  | 'idea-round-1'
  | 'experiment-round-1'
  | 'writing-round-1'
  | 'plotting-round-1';
type RoundStatus = 'ready' | 'comingSoon';

const LOCALE_STORAGE_KEY = 'research-claw-arena-locale';
const LOCALE_QUERY_KEY = 'lang';

const CLAWS = [
  {
    id: 'claw-claude3',
    name: 'Claw-Claude-3',
    version: 'Opus',
    color: '#8b5cf6',
    scores: {
      idea: 95,
      writing: 98,
      plotting: 80,
      experiment: 82,
      tokenEff: 75,
      timeEff: 70,
      completion: 95,
      quality: 96,
    },
  },
  {
    id: 'claw-gpt4',
    name: 'Claw-GPT-4',
    version: 'Turbo',
    color: '#10b981',
    scores: {
      idea: 92,
      writing: 95,
      plotting: 88,
      experiment: 85,
      tokenEff: 70,
      timeEff: 65,
      completion: 98,
      quality: 94,
    },
  },
  {
    id: 'claw-gemini15',
    name: 'Claw-Gemini-1.5',
    version: 'Pro',
    color: '#3b82f6',
    scores: {
      idea: 90,
      writing: 92,
      plotting: 85,
      experiment: 90,
      tokenEff: 85,
      timeEff: 88,
      completion: 92,
      quality: 90,
    },
  },
  {
    id: 'claw-llama3',
    name: 'Claw-Llama-3',
    version: '70B',
    color: '#f59e0b',
    scores: {
      idea: 85,
      writing: 88,
      plotting: 70,
      experiment: 75,
      tokenEff: 95,
      timeEff: 92,
      completion: 88,
      quality: 85,
    },
  },
];

const clawsWithOverall = CLAWS.map((claw) => {
  const capabilityAvg =
    (claw.scores.idea + claw.scores.writing + claw.scores.plotting + claw.scores.experiment) / 4;
  const performanceAvg =
    (claw.scores.tokenEff + claw.scores.timeEff + claw.scores.completion + claw.scores.quality) / 4;
  const overall = Math.round((capabilityAvg + performanceAvg) / 2);
  return {...claw, overall, capabilityAvg, performanceAvg};
}).sort((a, b) => b.overall - a.overall);

const translations = {
  en: {
    htmlLang: 'en',
    siteTitle: 'Research Claw Arena',
    pageSuffix: 'Page',
    navTitle: 'Navigate',
    githubLabel: 'View on GitHub',
    languageToggle: {
      english: 'EN',
      chinese: '中文',
    },
    pages: {
      leaderboards: {
        label: 'Leaderboards',
        description: 'Ranking view and score breakdowns',
      },
      arena: {
        label: 'Arena',
        description: 'Arena tracks and round selection',
      },
    },
    leaderboards: {
      badge: 'Leaderboards',
      title: 'Evaluating Research Agents',
      intro:
        'This page compares the capabilities of various research claws across benchmark dimensions. The current leaderboard focuses on capability scope and performance metrics, then expands into chart overlays and detailed score profiles.',
      capabilityDimension: 'Capability Dimension',
      performanceDimension: 'Performance Dimension',
      leaderboardTitle: 'Arena Leaderboard',
      scoresOutOfHundred: 'Scores out of 100',
      table: {
        rank: 'Rank',
        model: 'Model',
        overall: 'Overall',
        capabilities: 'Capabilities',
        performance: 'Performance',
        idea: 'Idea',
        writing: 'Write',
        plotting: 'Plot',
        experiment: 'Exp',
        tokens: 'Tokens',
        time: 'Time',
        completion: 'Comp',
        quality: 'Qual',
      },
      comparisonTitle: 'Visual Comparison',
      charts: {
        capabilityTitle: 'Capability Scope',
        performanceTitle: 'Performance Metrics',
        capabilitySubjects: {
          idea: 'Idea Gen',
          writing: 'Writing',
          plotting: 'Plotting',
          experiment: 'Experiment',
        },
        performanceSubjects: {
          tokens: 'Token Eff',
          time: 'Time Eff',
          completion: 'Completion',
          quality: 'Quality',
        },
      },
      profilesTitle: 'Detailed Profiles',
      profileSections: {
        capabilities: 'Capabilities',
        performance: 'Performance',
        overallScore: 'Overall Score',
      },
      scoreLabels: {
        idea: 'Idea Gen',
        writing: 'Writing',
        plotting: 'Plotting',
        experiment: 'Experiment',
        tokens: 'Tokens',
        time: 'Time',
        completion: 'Completion',
        quality: 'Quality',
      },
    },
    arena: {
      badge: 'Arena',
      title: 'Arena Tracks',
      intro:
        'Switch between arena tracks and browse the published rounds for each track. The Chinese version shares the same structure and interactions as the English version.',
      tracksTitle: 'Competition Tracks',
      enterTrack: 'Enter track',
      statuses: {
        available: 'Available',
        ready: 'Ready',
        comingSoon: 'Coming Soon',
        selected: 'Selected',
      },
      roundPickerTitle: 'Select a comparison round',
      roundDetailsTitle: 'Round Details',
      participants: 'Participants',
      participantCount: '4 claws',
    },
    arenaCards: {
      idea: {
        title: 'Idea Generation',
        blurb: 'Compare prompt ideation rounds and select a benchmark round for direct model matchups.',
      },
      experiment: {
        title: 'Experiment',
        blurb: 'Browse experiment design rounds and keep the track structure ready for future benchmark releases.',
      },
      writing: {
        title: 'Writing',
        blurb: 'Track writing-focused rounds for drafting, revision, and structured research communication.',
      },
      plotting: {
        title: 'Plotting',
        blurb: 'Reserve figure and plotting rounds for future visualization-heavy comparisons.',
      },
    },
    rounds: {
      idea: [
        {
          id: 'idea-round-1' as const,
          label: 'Round 1',
          subtitle: 'First Round',
          prompt: 'Baseline ideation prompts with the current four research claws.',
          status: 'ready' as const,
          details:
            'This round compares first-pass research idea generation quality, novelty, and actionability across the current four claws.',
        },
      ],
      experiment: [
        {
          id: 'experiment-round-1' as const,
          label: 'Round 1',
          subtitle: 'Coming Soon',
          prompt: 'Experiment protocol comparisons will be added here when the benchmark rubric is finalized.',
          status: 'comingSoon' as const,
          details:
            'This track is reserved for experimental design, ablation planning, and methodology comparison rounds.',
        },
      ],
      writing: [
        {
          id: 'writing-round-1' as const,
          label: 'Round 1',
          subtitle: 'Coming Soon',
          prompt: 'Writing evaluation rounds will appear here after the shared drafting templates are locked.',
          status: 'comingSoon' as const,
          details:
            'This track will focus on technical writing clarity, structure, and revision quality for research outputs.',
        },
      ],
      plotting: [
        {
          id: 'plotting-round-1' as const,
          label: 'Round 1',
          subtitle: 'Coming Soon',
          prompt: 'Plotting rounds will cover chart design, visual reasoning, and figure communication once published.',
          status: 'comingSoon' as const,
          details:
            'This track is for figure planning, plotting choices, and chart storytelling under research constraints.',
        },
      ],
    },
    footer: {
      builtForPages: 'Built for GitHub Pages.',
      note: 'Metrics are simulated for demonstration purposes.',
    },
  },
  'zh-CN': {
    htmlLang: 'zh-CN',
    siteTitle: 'Research Claw Arena 中文版',
    pageSuffix: '页面',
    navTitle: '导航',
    githubLabel: '查看 GitHub',
    languageToggle: {
      english: 'EN',
      chinese: '中文',
    },
    pages: {
      leaderboards: {
        label: '排行榜',
        description: '排名视图与分数拆解',
      },
      arena: {
        label: '竞技场',
        description: '竞技场赛道与回合选择',
      },
    },
    leaderboards: {
      badge: '排行榜',
      title: '研究智能体评测',
      intro:
        '这个页面用于比较不同 Research Claw 在各项基准维度上的表现。当前排行榜聚焦能力范围与性能指标，并延伸到图表对比和详细画像卡片。',
      capabilityDimension: '能力维度',
      performanceDimension: '性能维度',
      leaderboardTitle: '竞技场排行榜',
      scoresOutOfHundred: '评分满分 100',
      table: {
        rank: '排名',
        model: '模型',
        overall: '总分',
        capabilities: '能力',
        performance: '性能',
        idea: '创意',
        writing: '写作',
        plotting: '绘图',
        experiment: '实验',
        tokens: 'Token',
        time: '时间',
        completion: '完成',
        quality: '质量',
      },
      comparisonTitle: '可视化对比',
      charts: {
        capabilityTitle: '能力范围',
        performanceTitle: '性能指标',
        capabilitySubjects: {
          idea: '创意生成',
          writing: '写作',
          plotting: '绘图',
          experiment: '实验',
        },
        performanceSubjects: {
          tokens: 'Token 效率',
          time: '时间效率',
          completion: '完成率',
          quality: '质量',
        },
      },
      profilesTitle: '详细画像',
      profileSections: {
        capabilities: '能力',
        performance: '性能',
        overallScore: '综合得分',
      },
      scoreLabels: {
        idea: '创意',
        writing: '写作',
        plotting: '绘图',
        experiment: '实验',
        tokens: 'Token',
        time: '时间',
        completion: '完成',
        quality: '质量',
      },
    },
    arena: {
      badge: '竞技场',
      title: '竞技场赛道',
      intro:
        '你可以在不同竞技场赛道之间切换，并查看每条赛道已经发布的 round。中文版和英文版使用同一套页面结构与交互逻辑。',
      tracksTitle: '赛道列表',
      enterTrack: '进入赛道',
      statuses: {
        available: '可用',
        ready: '就绪',
        comingSoon: '即将上线',
        selected: '已选择',
      },
      roundPickerTitle: '选择对比回合',
      roundDetailsTitle: '回合详情',
      participants: '参赛 Claws',
      participantCount: '4 个 Claws',
    },
    arenaCards: {
      idea: {
        title: '创意生成',
        blurb: '查看创意生成相关的对比回合，并为模型对战选择具体 benchmark round。',
      },
      experiment: {
        title: '实验设计',
        blurb: '浏览实验设计赛道的回合结构，为后续评测内容预留好入口。',
      },
      writing: {
        title: '写作',
        blurb: '跟踪写作赛道中的草稿、修订和科研表达类回合。',
      },
      plotting: {
        title: '绘图',
        blurb: '为未来偏可视化的图表与绘图对比预留赛道与回合结构。',
      },
    },
    rounds: {
      idea: [
        {
          id: 'idea-round-1' as const,
          label: 'Round 1',
          subtitle: '第一回合',
          prompt: '当前四个 Research Claw 的基础创意生成题组。',
          status: 'ready' as const,
          details: '这一回合主要比较四个 Claw 在研究想法生成上的新颖性、可执行性和首轮输出质量。',
        },
      ],
      experiment: [
        {
          id: 'experiment-round-1' as const,
          label: 'Round 1',
          subtitle: '即将上线',
          prompt: '实验设计赛道的回合内容会在 benchmark 规则确定后补充到这里。',
          status: 'comingSoon' as const,
          details: '该赛道将聚焦实验方案设计、消融规划和方法学对比。',
        },
      ],
      writing: [
        {
          id: 'writing-round-1' as const,
          label: 'Round 1',
          subtitle: '即将上线',
          prompt: '写作赛道的回合会在统一写作模板敲定之后发布。',
          status: 'comingSoon' as const,
          details: '该赛道将关注科研写作的清晰度、结构和修订质量。',
        },
      ],
      plotting: [
        {
          id: 'plotting-round-1' as const,
          label: 'Round 1',
          subtitle: '即将上线',
          prompt: '绘图赛道会在相关任务正式发布后补充图表设计与可视化表达回合。',
          status: 'comingSoon' as const,
          details: '该赛道将覆盖图形规划、绘图选择以及科研图表叙事能力。',
        },
      ],
    },
    footer: {
      builtForPages: '已部署到 GitHub Pages。',
      note: '当前指标为演示数据。',
    },
  },
} as const;

function isLocale(value: string | null): value is Locale {
  return value === 'en' || value === 'zh-CN';
}

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const urlLocale = new URLSearchParams(window.location.search).get(LOCALE_QUERY_KEY);
  if (isLocale(urlLocale)) {
    return urlLocale;
  }

  const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (isLocale(savedLocale)) {
    return savedLocale;
  }

  return window.navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
}

function syncLocale(locale: Locale, title: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  if (locale === 'zh-CN') {
    url.searchParams.set(LOCALE_QUERY_KEY, locale);
  } else {
    url.searchParams.delete(LOCALE_QUERY_KEY);
  }

  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.documentElement.lang = translations[locale].htmlLang;
  document.title = title;
}

function buildCapabilityData(text: (typeof translations)[Locale]) {
  return [
    {
      subject: text.leaderboards.charts.capabilitySubjects.idea,
      'Claw-Claude-3': 95,
      'Claw-GPT-4': 92,
      'Claw-Gemini-1.5': 90,
      'Claw-Llama-3': 85,
    },
    {
      subject: text.leaderboards.charts.capabilitySubjects.writing,
      'Claw-Claude-3': 98,
      'Claw-GPT-4': 95,
      'Claw-Gemini-1.5': 92,
      'Claw-Llama-3': 88,
    },
    {
      subject: text.leaderboards.charts.capabilitySubjects.plotting,
      'Claw-Claude-3': 80,
      'Claw-GPT-4': 88,
      'Claw-Gemini-1.5': 85,
      'Claw-Llama-3': 70,
    },
    {
      subject: text.leaderboards.charts.capabilitySubjects.experiment,
      'Claw-Claude-3': 82,
      'Claw-GPT-4': 85,
      'Claw-Gemini-1.5': 90,
      'Claw-Llama-3': 75,
    },
  ];
}

function buildPerformanceData(text: (typeof translations)[Locale]) {
  return [
    {
      subject: text.leaderboards.charts.performanceSubjects.tokens,
      'Claw-Claude-3': 75,
      'Claw-GPT-4': 70,
      'Claw-Gemini-1.5': 85,
      'Claw-Llama-3': 95,
    },
    {
      subject: text.leaderboards.charts.performanceSubjects.time,
      'Claw-Claude-3': 70,
      'Claw-GPT-4': 65,
      'Claw-Gemini-1.5': 88,
      'Claw-Llama-3': 92,
    },
    {
      subject: text.leaderboards.charts.performanceSubjects.completion,
      'Claw-Claude-3': 95,
      'Claw-GPT-4': 98,
      'Claw-Gemini-1.5': 92,
      'Claw-Llama-3': 88,
    },
    {
      subject: text.leaderboards.charts.performanceSubjects.quality,
      'Claw-Claude-3': 96,
      'Claw-GPT-4': 94,
      'Claw-Gemini-1.5': 90,
      'Claw-Llama-3': 85,
    },
  ];
}

function buildPages(text: (typeof translations)[Locale]) {
  return [
    {
      id: 'leaderboards' as const,
      label: text.pages.leaderboards.label,
      description: text.pages.leaderboards.description,
      icon: Trophy,
    },
    {
      id: 'arena' as const,
      label: text.pages.arena.label,
      description: text.pages.arena.description,
      icon: FlaskConical,
    },
  ];
}

function buildArenaCards(text: (typeof translations)[Locale]) {
  return [
    {
      id: 'idea' as const,
      title: text.arenaCards.idea.title,
      blurb: text.arenaCards.idea.blurb,
      accent: 'bg-blue-50 text-blue-700 border-blue-100',
      icon: Lightbulb,
      status: 'available' as const,
    },
    {
      id: 'experiment' as const,
      title: text.arenaCards.experiment.title,
      blurb: text.arenaCards.experiment.blurb,
      accent: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      icon: FlaskConical,
      status: 'comingSoon' as const,
    },
    {
      id: 'writing' as const,
      title: text.arenaCards.writing.title,
      blurb: text.arenaCards.writing.blurb,
      accent: 'bg-amber-50 text-amber-700 border-amber-100',
      icon: PenTool,
      status: 'comingSoon' as const,
    },
    {
      id: 'plotting' as const,
      title: text.arenaCards.plotting.title,
      blurb: text.arenaCards.plotting.blurb,
      accent: 'bg-violet-50 text-violet-700 border-violet-100',
      icon: ImageIcon,
      status: 'comingSoon' as const,
    },
  ];
}

function buildArenaRounds(text: (typeof translations)[Locale]) {
  return text.rounds;
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(() => getInitialLocale());
  const [activePage, setActivePage] = useState<PageId>('leaderboards');
  const [selectedClaws, setSelectedClaws] = useState<string[]>(clawsWithOverall.slice(0, 3).map((claw) => claw.id));
  const [activeArena, setActiveArena] = useState<ArenaId>('idea');
  const [activeRound, setActiveRound] = useState<RoundId>('idea-round-1');

  const text = translations[locale];
  const pages = buildPages(text);
  const arenaCards = buildArenaCards(text);
  const arenaRounds = buildArenaRounds(text);
  const capabilityData = buildCapabilityData(text);
  const performanceData = buildPerformanceData(text);
  const pageMeta = pages.find((page) => page.id === activePage)!;

  useEffect(() => {
    syncLocale(locale, text.siteTitle);
  }, [locale, text.siteTitle]);

  const toggleClaw = (id: string) => {
    if (selectedClaws.includes(id)) {
      if (selectedClaws.length > 1) {
        setSelectedClaws(selectedClaws.filter((clawId) => clawId !== id));
      }
      return;
    }

    if (selectedClaws.length < 4) {
      setSelectedClaws([...selectedClaws, id]);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 selection:bg-blue-200">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-600 p-2 text-white">
              <FlaskConical size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Research Claw Arena</h1>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
                {pageMeta.label} {text.pageSuffix}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-neutral-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setLocale('en')}
                className={`rounded px-2.5 py-1 text-sm font-medium transition-colors ${
                  locale === 'en' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {text.languageToggle.english}
              </button>
              <button
                type="button"
                onClick={() => setLocale('zh-CN')}
                className={`rounded px-2.5 py-1 text-sm font-medium transition-colors ${
                  locale === 'zh-CN' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {text.languageToggle.chinese}
              </button>
            </div>

            <a
              href="https://github.com/LetItBe12345/research-claw-arena"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-neutral-900"
            >
              <Github size={16} />
              <span className="hidden sm:inline">{text.githubLabel}</span>
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-neutral-400">{text.navTitle}</p>
            <nav className="flex gap-3 overflow-x-auto lg:flex-col">
              {pages.map((page) => {
                const Icon = page.icon;
                const active = page.id === activePage;

                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => setActivePage(page.id)}
                    className={`min-w-[190px] rounded-2xl border px-4 py-3 text-left transition-all lg:min-w-0 ${
                      active
                        ? 'border-blue-200 bg-blue-50 text-blue-900 shadow-sm'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-xl p-2 ${
                          active ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-500'
                        }`}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold">{page.label}</div>
                        <div className="text-xs text-neutral-500">{page.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="space-y-8">
          {activePage === 'leaderboards' ? (
            <LeaderboardsPage
              text={text}
              capabilityData={capabilityData}
              performanceData={performanceData}
              selectedClaws={selectedClaws}
              onToggleClaw={toggleClaw}
            />
          ) : (
            <ArenaPage
              text={text}
              arenaCards={arenaCards}
              arenaRounds={arenaRounds}
              activeArena={activeArena}
              activeRound={activeRound}
              onSelectArena={(arena) => {
                setActiveArena(arena);
                setActiveRound(arenaRounds[arena][0].id);
              }}
              onSelectRound={setActiveRound}
            />
          )}
        </main>
      </div>

      <footer className="mt-12 border-t border-neutral-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-neutral-500 sm:px-6 lg:px-8">
          <p>
            Research Claw Arena &copy; {new Date().getFullYear()}. {text.footer.builtForPages}
          </p>
          <p className="mt-2">{text.footer.note}</p>
        </div>
      </footer>
    </div>
  );
}

function LeaderboardsPage({
  text,
  capabilityData,
  performanceData,
  selectedClaws,
  onToggleClaw,
}: {
  text: (typeof translations)[Locale];
  capabilityData: Array<Record<string, string | number>>;
  performanceData: Array<Record<string, string | number>>;
  selectedClaws: string[];
  onToggleClaw: (id: string) => void;
}) {
  return (
    <>
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
            <Trophy size={16} />
            {text.leaderboards.badge}
          </div>
          <h2 className="mb-4 text-2xl font-bold">{text.leaderboards.title}</h2>
          <p className="mb-6 leading-relaxed text-neutral-600">{text.leaderboards.intro}</p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
              <Lightbulb size={16} />
              {text.leaderboards.capabilityDimension}
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
              <Zap size={16} />
              {text.leaderboards.performanceDimension}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <Trophy className="text-amber-500" size={20} />
            {text.leaderboards.leaderboardTitle}
          </h3>
          <span className="text-sm text-neutral-500">{text.leaderboards.scoresOutOfHundred}</span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">{text.leaderboards.table.rank}</th>
                  <th className="px-6 py-4 font-semibold">{text.leaderboards.table.model}</th>
                  <th className="bg-blue-50/50 px-6 py-4 text-center font-semibold">{text.leaderboards.table.overall}</th>
                  <th className="px-6 py-4 text-center font-semibold" colSpan={4}>
                    {text.leaderboards.table.capabilities}
                  </th>
                  <th className="px-6 py-4 text-center font-semibold" colSpan={4}>
                    {text.leaderboards.table.performance}
                  </th>
                </tr>
                <tr className="border-t border-neutral-100 text-[10px] text-neutral-400">
                  <th className="px-6 py-2"></th>
                  <th className="px-6 py-2"></th>
                  <th className="bg-blue-50/50 px-6 py-2"></th>
                  <th className="px-2 py-2 text-center" title={text.arenaCards.idea.title}>
                    {text.leaderboards.table.idea}
                  </th>
                  <th className="px-2 py-2 text-center" title={text.arenaCards.writing.title}>
                    {text.leaderboards.table.writing}
                  </th>
                  <th className="px-2 py-2 text-center" title={text.arenaCards.plotting.title}>
                    {text.leaderboards.table.plotting}
                  </th>
                  <th className="px-2 py-2 text-center" title={text.arenaCards.experiment.title}>
                    {text.leaderboards.table.experiment}
                  </th>
                  <th className="px-2 py-2 text-center" title={text.leaderboards.charts.performanceSubjects.tokens}>
                    {text.leaderboards.table.tokens}
                  </th>
                  <th className="px-2 py-2 text-center" title={text.leaderboards.charts.performanceSubjects.time}>
                    {text.leaderboards.table.time}
                  </th>
                  <th className="px-2 py-2 text-center" title={text.leaderboards.charts.performanceSubjects.completion}>
                    {text.leaderboards.table.completion}
                  </th>
                  <th className="px-2 py-2 text-center" title={text.leaderboards.charts.performanceSubjects.quality}>
                    {text.leaderboards.table.quality}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {clawsWithOverall.map((claw, idx) => (
                  <tr key={claw.id} className="transition-colors hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-700'
                            : idx === 1
                              ? 'bg-neutral-200 text-neutral-700'
                              : idx === 2
                                ? 'bg-orange-100 text-orange-800'
                                : 'text-neutral-500'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{backgroundColor: claw.color}}></div>
                        <span className="font-semibold text-neutral-900">{claw.name}</span>
                        <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                          {claw.version}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap bg-blue-50/30 px-6 py-4 text-center">
                      <span className="text-base font-bold text-blue-700">{claw.overall}</span>
                    </td>
                    <td className="px-2 py-4 text-center font-mono text-neutral-600">{claw.scores.idea}</td>
                    <td className="px-2 py-4 text-center font-mono text-neutral-600">{claw.scores.writing}</td>
                    <td className="px-2 py-4 text-center font-mono text-neutral-600">{claw.scores.plotting}</td>
                    <td className="border-r border-neutral-100 px-2 py-4 text-center font-mono text-neutral-600">
                      {claw.scores.experiment}
                    </td>
                    <td className="px-2 py-4 text-center font-mono text-neutral-600">{claw.scores.tokenEff}</td>
                    <td className="px-2 py-4 text-center font-mono text-neutral-600">{claw.scores.timeEff}</td>
                    <td className="px-2 py-4 text-center font-mono text-neutral-600">{claw.scores.completion}</td>
                    <td className="px-2 py-4 text-center font-mono text-neutral-600">{claw.scores.quality}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h3 className="text-lg font-bold">{text.leaderboards.comparisonTitle}</h3>
          <div className="flex flex-wrap gap-2">
            {clawsWithOverall.map((claw) => (
              <button
                key={claw.id}
                type="button"
                onClick={() => onToggleClaw(claw.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  selectedClaws.includes(claw.id)
                    ? 'border-neutral-300 bg-white text-neutral-900 shadow-sm'
                    : 'border-transparent bg-transparent text-neutral-400 hover:text-neutral-600'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div
                    className={`h-2 w-2 rounded-full ${selectedClaws.includes(claw.id) ? '' : 'opacity-50'}`}
                    style={{backgroundColor: claw.color}}
                  ></div>
                  {claw.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard
            title={text.leaderboards.charts.capabilityTitle}
            icon={<Lightbulb size={18} className="text-blue-500" />}
            data={capabilityData}
            selectedClaws={selectedClaws}
          />
          <ChartCard
            title={text.leaderboards.charts.performanceTitle}
            icon={<Zap size={18} className="text-emerald-500" />}
            data={performanceData}
            selectedClaws={selectedClaws}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-lg font-bold">{text.leaderboards.profilesTitle}</h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {clawsWithOverall.map((claw) => (
            <div key={claw.id} className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <div className="border-b border-neutral-100 p-5" style={{borderTop: `4px solid ${claw.color}`}}>
                <div className="mb-2 flex items-start justify-between">
                  <h4 className="text-lg font-bold">{claw.name}</h4>
                  <span className="rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600">
                    {claw.version}
                  </span>
                </div>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-3xl font-bold leading-none" style={{color: claw.color}}>
                    {claw.overall}
                  </span>
                  <span className="mb-1 text-sm font-medium text-neutral-500">
                    {text.leaderboards.profileSections.overallScore}
                  </span>
                </div>
              </div>

              <div className="flex-1 bg-neutral-50/50 p-5">
                <div className="space-y-4">
                  <div>
                    <h5 className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-400">
                      {text.leaderboards.profileSections.capabilities}
                    </h5>
                    <div className="space-y-2">
                      <ScoreBar
                        label={text.leaderboards.scoreLabels.idea}
                        score={claw.scores.idea}
                        icon={<Lightbulb size={14} />}
                        color={claw.color}
                      />
                      <ScoreBar
                        label={text.leaderboards.scoreLabels.writing}
                        score={claw.scores.writing}
                        icon={<PenTool size={14} />}
                        color={claw.color}
                      />
                      <ScoreBar
                        label={text.leaderboards.scoreLabels.plotting}
                        score={claw.scores.plotting}
                        icon={<ImageIcon size={14} />}
                        color={claw.color}
                      />
                      <ScoreBar
                        label={text.leaderboards.scoreLabels.experiment}
                        score={claw.scores.experiment}
                        icon={<FlaskConical size={14} />}
                        color={claw.color}
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <h5 className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-400">
                      {text.leaderboards.profileSections.performance}
                    </h5>
                    <div className="space-y-2">
                      <ScoreBar
                        label={text.leaderboards.scoreLabels.tokens}
                        score={claw.scores.tokenEff}
                        icon={<Zap size={14} />}
                        color={claw.color}
                      />
                      <ScoreBar
                        label={text.leaderboards.scoreLabels.time}
                        score={claw.scores.timeEff}
                        icon={<Clock size={14} />}
                        color={claw.color}
                      />
                      <ScoreBar
                        label={text.leaderboards.scoreLabels.completion}
                        score={claw.scores.completion}
                        icon={<CheckCircle size={14} />}
                        color={claw.color}
                      />
                      <ScoreBar
                        label={text.leaderboards.scoreLabels.quality}
                        score={claw.scores.quality}
                        icon={<Star size={14} />}
                        color={claw.color}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function ArenaPage({
  text,
  arenaCards,
  arenaRounds,
  activeArena,
  activeRound,
  onSelectArena,
  onSelectRound,
}: {
  text: (typeof translations)[Locale];
  arenaCards: ReturnType<typeof buildArenaCards>;
  arenaRounds: ReturnType<typeof buildArenaRounds>;
  activeArena: ArenaId;
  activeRound: RoundId;
  onSelectArena: (arena: ArenaId) => void;
  onSelectRound: (round: RoundId) => void;
}) {
  const selectedArena = arenaCards.find((card) => card.id === activeArena)!;
  const selectedRounds = arenaRounds[activeArena];
  const selectedRound = selectedRounds.find((round) => round.id === activeRound) ?? selectedRounds[0];

  return (
    <>
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700">
            <FlaskConical size={16} />
            {text.arena.badge}
          </div>
          <h2 className="mb-4 text-2xl font-bold">{text.arena.title}</h2>
          <p className="leading-relaxed text-neutral-600">{text.arena.intro}</p>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{text.arena.tracksTitle}</h3>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {arenaCards.map((card) => {
            const Icon = card.icon;
            const active = activeArena === card.id;
            const statusLabel =
              card.status === 'available' ? text.arena.statuses.available : text.arena.statuses.comingSoon;

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => onSelectArena(card.id)}
                className={`rounded-2xl border bg-white p-6 text-left shadow-sm transition-all ${
                  active
                    ? 'border-blue-200 ring-2 ring-blue-100'
                    : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className={`rounded-2xl border px-3 py-2 ${card.accent}`}>
                    <Icon size={18} />
                  </div>
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    {statusLabel}
                  </span>
                </div>

                <h4 className="mb-2 text-xl font-bold">{card.title}</h4>
                <p className="mb-5 text-sm leading-relaxed text-neutral-600">{card.blurb}</p>

                <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
                  {text.arena.enterTrack}
                  <ChevronRight size={16} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-400">{selectedArena.title}</p>
              <h3 className="mt-2 text-lg font-bold">{text.arena.roundPickerTitle}</h3>
            </div>
            <div
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                selectedRound.status === 'ready'
                  ? 'border border-blue-100 bg-blue-50 text-blue-700'
                  : 'border border-neutral-200 bg-neutral-100 text-neutral-600'
              }`}
            >
              {selectedRound.status === 'ready' ? text.arena.statuses.ready : text.arena.statuses.comingSoon}
            </div>
          </div>

          <div className="grid gap-4">
            {selectedRounds.map((round) => {
              const active = round.id === activeRound;
              const badgeLabel = active
                ? text.arena.statuses.selected
                : round.status === 'ready'
                  ? text.arena.statuses.ready
                  : text.arena.statuses.comingSoon;

              return (
                <button
                  key={round.id}
                  type="button"
                  onClick={() => onSelectRound(round.id)}
                  className={`rounded-2xl border px-5 py-4 text-left transition-all ${
                    active
                      ? 'border-blue-200 bg-blue-50 text-blue-900 shadow-sm'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold">{round.label}</div>
                      <div className={`text-sm ${active ? 'text-blue-700' : 'text-neutral-500'}`}>{round.subtitle}</div>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                        active ? 'bg-white text-blue-700' : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {badgeLabel}
                    </div>
                  </div>
                  <p className={`mt-3 text-sm leading-relaxed ${active ? 'text-blue-800' : 'text-neutral-600'}`}>
                    {round.prompt}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-400">{text.arena.roundDetailsTitle}</p>
          <h3 className="mt-2 text-lg font-bold">
            {selectedRound.label} <span className="text-neutral-400">/ {selectedRound.subtitle}</span>
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-neutral-600">{selectedRound.prompt}</p>
          <p className="mt-3 text-sm leading-relaxed text-neutral-500">{selectedRound.details}</p>

          <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-800">{text.arena.participants}</span>
              <span className="text-xs uppercase tracking-[0.18em] text-neutral-400">{text.arena.participantCount}</span>
            </div>
            <div className="space-y-3">
              {clawsWithOverall.map((claw) => (
                <div key={claw.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: claw.color}}></div>
                    <span className="font-medium text-neutral-800">{claw.name}</span>
                  </div>
                  <span className="text-sm text-neutral-500">{claw.version}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ChartCard({
  title,
  icon,
  data,
  selectedClaws,
}: {
  title: string;
  icon: ReactNode;
  data: Array<Record<string, string | number>>;
  selectedClaws: string[];
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h4 className="mb-6 flex items-center gap-2 font-semibold text-neutral-700">
        {icon}
        {title}
      </h4>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#e5e5e5" />
            <PolarAngleAxis dataKey="subject" tick={{fill: '#525252', fontSize: 12}} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{fill: '#a3a3a3', fontSize: 10}} />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e5e5',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend wrapperStyle={{fontSize: '12px', paddingTop: '20px'}} />
            {clawsWithOverall
              .filter((claw) => selectedClaws.includes(claw.id))
              .map((claw) => (
                <Radar
                  key={claw.id}
                  name={claw.name}
                  dataKey={claw.name}
                  stroke={claw.color}
                  fill={claw.color}
                  fillOpacity={0.2}
                />
              ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ScoreBar({
  label,
  score,
  icon,
  color,
}: {
  label: string;
  score: number;
  icon: ReactNode;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex w-24 items-center gap-1.5 text-neutral-600">
        <span className="text-neutral-400">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">
        <div className="h-full rounded-full transition-all duration-500 ease-out" style={{width: `${score}%`, backgroundColor: color}} />
      </div>
      <div className="w-8 text-right font-mono text-xs font-medium text-neutral-700">{score}</div>
    </div>
  );
}
