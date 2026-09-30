import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'EN' | 'ES' | 'FR' | 'DE' | 'PT' | 'AR' | 'ZH' | 'JA' | 'KO' | 'RU' | 'HI' | 'TR' | 'IT' | 'NL' | 'ID';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const LANGUAGES = [
  { code: 'EN', name: 'English', flag: '🇺🇸' },
  { code: 'ES', name: 'Español', flag: '🇪🇸' },
  { code: 'FR', name: 'Français', flag: '🇫🇷' },
  { code: 'DE', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'PT', name: 'Português', flag: '🇵🇹' },
  { code: 'AR', name: 'العربية', flag: '🇸🇦' },
  { code: 'ZH', name: '简体中文', flag: '🇨🇳' },
  { code: 'JA', name: '日本語', flag: '🇯🇵' },
  { code: 'KO', name: '한국어', flag: '🇰🇷' },
  { code: 'RU', name: 'Русский', flag: '🇷🇺' },
  { code: 'HI', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'TR', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'IT', name: 'Italiano', flag: '🇮🇹' },
  { code: 'NL', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'ID', name: 'Bahasa Indonesia', flag: '🇮🇩' }
] as const;

const translations: Record<Language, Record<string, string>> = {
  EN: {
    dashboard: "Dashboard",
    home: "Home",
    fund: "Fund",
    invest: "Invest",
    withdraw: "Withdraw",
    help: "Help",
    me: "Me",
    profile: "Profile",
    settings: "Settings",
    terminate: "Logout",
    search_assets: "SEARCH ASSETS",
    authenticated_as: "Authenticated as",
    status: "Status",
    view_privileges: "View Privileges",
    notifications: "Notifications",
    view_all: "View All",
    no_notifications: "No new notifications",
    mark_all_read: "Mark all as read",
    language: "Language",
    welcome_back: "Welcome back",
    total_balance: "Total Balance",
    available_balance: "Available Balance",
    invested_funds: "Invested Funds",
    locked_rewards: "Locked Rewards",
    recent_transactions: "Recent Transactions",
    market_overview: "Market Overview",
    top_assets: "Top Assets",
    performance: "Performance",
    about_us: "About Us",
    how_it_works: "How It Works",
    reviews: "Reviews",
    blog: "Blog",
    signin: "Sign In",
    signup: "Get Started",
    hero_badge: "Secure Quantitative Portfolio Node",
    hero_title: "Institutional Grade Algorithmic Yield Platform",
    hero_subtitle: "Allocate capital into secure automated trading nodes powered by elite quantitative models. Earn risk-adjusted yields with guaranteed threshold limits.",
    deploy_capital: "Deploy Capital",
    explore_portal: "Explore Portal",
    join_newsletter: "Join the Wave Newsletter",
    newsletter_placeholder: "Your Email Address",
    subscribe: "Subscribe",
    welcome_wave_press: "Welcome to Wave Press",
    submitting: "Submitting...",
    continue_reading: "Continue Reading",
    why_choose_us: "Why Choose Us",
    recent_investments: "Recent Investments Log",
    realtime_activity: "Real-time Node Operations",
    active_plans: "Active Investment Nodes"
  },
  ES: {
    dashboard: "Panel",
    home: "Inicio",
    fund: "Fondos",
    invest: "Invertir",
    help: "Ayuda",
    me: "Yo",
    profile: "Perfil",
    settings: "Ajustes",
    terminate: "Cerrar sesión",
    search_assets: "BUSCAR ACTIVOS",
    authenticated_as: "Autenticado como",
    status: "Estado",
    view_privileges: "Ver Privilegios",
    notifications: "Notificaciones",
    view_all: "Ver todo",
    no_notifications: "Sin notificaciones nuevas",
    mark_all_read: "Marcar todo como leído",
    language: "Idioma",
    welcome_back: "Bienvenido de nuevo",
    total_balance: "Saldo Total",
    available_balance: "Saldo Disponible",
    invested_funds: "Fondos Invertidos",
    locked_rewards: "Recompensas Bloqueadas",
    recent_transactions: "Transacciones Recientes",
    market_overview: "Resumen del Mercado",
    top_assets: "Activos Principales",
    performance: "Rendimiento",
    about_us: "Sobre Nosotros",
    how_it_works: "Cómo Funciona",
    reviews: "Opiniones",
    blog: "Blog",
    signin: "Iniciar Sesión",
    signup: "Empezar",
    hero_badge: "Nodo de Cartera Cuantitativa Segura",
    hero_title: "Plataforma de Rendimiento Algorítmico Profesional",
    hero_subtitle: "Asigne capital en nodos de negociación automatizados guiados por modelos cuantitativos de élite. Obtenga rendimientos estables con límites protegidos.",
    deploy_capital: "Desplegar Capital",
    explore_portal: "Explorar Portal",
    join_newsletter: "Únete al boletín de Wave",
    newsletter_placeholder: "Su dirección de correo electrónico",
    subscribe: "Suscribirse",
    welcome_wave_press: "Bienvenido a Wave Press",
    submitting: "Enviando...",
    continue_reading: "Continuar leyendo",
    why_choose_us: "Por Qué Elegirnos",
    recent_investments: "Registro de Inversiones Recientes",
    realtime_activity: "Operaciones de Nodos en Tiempo Real",
    active_plans: "Nodos de Inversión Activos"
  },
  FR: {
    dashboard: "Tableau de bord",
    home: "Accueil",
    fund: "Fonds",
    invest: "Investir",
    help: "Aide",
    me: "Moi",
    profile: "Profil",
    settings: "Paramètres",
    terminate: "Déconnexion",
    search_assets: "RECHERCHER DES ACTIFS",
    authenticated_as: "Authentifié en tant que",
    status: "Statut",
    view_privileges: "Voir les privilèges",
    notifications: "Notifications",
    view_all: "Voir tout",
    no_notifications: "Aucune nouvelle notification",
    mark_all_read: "Tout marquer comme lu",
    language: "Langue",
    welcome_back: "Bon retour",
    total_balance: "Solde Total",
    available_balance: "Solde Disponible",
    invested_funds: "Fonds Investis",
    locked_rewards: "Récompenses Verrouillées",
    recent_transactions: "Transactions Récentes",
    market_overview: "Aperçu du Marché",
    top_assets: "Meilleurs Actifs",
    performance: "Performance",
    about_us: "À Propos",
    how_it_works: "Comment Ça Marche",
    reviews: "Avis",
    blog: "Blog",
    signin: "Se Connecter",
    signup: "Commencer",
    hero_badge: "Nœud de Portefeuille Quantitatif Sécurisé",
    hero_title: "Plateforme Algorithmique de Qualité Institutionnelle",
    hero_subtitle: "Allouez votre capital dans des nœuds de trading automatisés et sécurisés. Obtenez des rendements optimisés avec des limites garanties.",
    deploy_capital: "Déployer le Capital",
    explore_portal: "Explorer le Portail",
    join_newsletter: "Rejoignez la Newsletter de Wave",
    newsletter_placeholder: "Votre adresse e-mail",
    subscribe: "S'abonner",
    welcome_wave_press: "Bienvenue sur Wave Press",
    submitting: "Envoi...",
    continue_reading: "Continuer la lecture",
    why_choose_us: "Pourquoi Nous Choisir",
    recent_investments: "Registre des Investissements Récents",
    realtime_activity: "Opérations de Nœud en Temps Réel",
    active_plans: "Nœuds d'Investissement Actifs"
  },
  DE: {
    dashboard: "Dashboard",
    home: "Startseite",
    fund: "Fonds",
    invest: "Investieren",
    help: "Hilfe",
    me: "Ich",
    profile: "Profil",
    settings: "Einstellungen",
    terminate: "Abmelden",
    search_assets: "VERMÖGENSWERTE SUCHEN",
    authenticated_as: "Authentifiziert als",
    status: "Status",
    view_privileges: "Privilegien anzeigen",
    notifications: "Benachrichtigungen",
    view_all: "Alle anzeigen",
    no_notifications: "Keine neuen Benachrichtigungen",
    mark_all_read: "Alle als gelesen markieren",
    language: "Sprache",
    welcome_back: "Willkommen zurück",
    total_balance: "Gesamtguthaben",
    available_balance: "Verfügbares Guthaben",
    invested_funds: "Investierte Mittel",
    locked_rewards: "Gesperrte Belohnungen",
    recent_transactions: "Letzte Transaktionen",
    market_overview: "Marktübersicht",
    top_assets: "Top-Assets",
    performance: "Leistung",
    about_us: "Über uns",
    how_it_works: "Wie es funktioniert",
    reviews: "Bewertungen",
    blog: "Blog",
    signin: "Anmelden",
    signup: "Erste Schritte",
    hero_badge: "Sicherer Quantitativer Portfolioknoten",
    hero_title: "Algorithmische Renditeplattform für Institutionen",
    hero_subtitle: "Weisen Sie Kapital in sicheren automatisierten Handelsknoten zu. Erzielen Sie risikoadjustierte Renditen mit garantierten Mindestgrenzen.",
    deploy_capital: "Kapital einsetzen",
    explore_portal: "Portal erkunden",
    join_newsletter: "Melden Sie sich für den Wave-Newsletter an",
    newsletter_placeholder: "Ihre E-Mail-Adresse",
    subscribe: "Abonnieren",
    welcome_wave_press: "Willkommen bei Wave Press",
    submitting: "Wird gesendet...",
    continue_reading: "Weiterlesen",
    why_choose_us: "Warum uns wählen",
    recent_investments: "Letzte Investitionen",
    realtime_activity: "Echtzeit-Knotenoperationen",
    active_plans: "Aktive Investmentknoten"
  },
  PT: {
    dashboard: "Painel",
    home: "Início",
    fund: "Fundos",
    invest: "Investir",
    help: "Ajuda",
    me: "Eu",
    profile: "Perfil",
    settings: "Configurações",
    terminate: "Sair",
    search_assets: "BUSCAR ACTIVOS",
    authenticated_as: "Autenticado como",
    status: "Status",
    view_privileges: "Ver Privilégios",
    notifications: "Notificações",
    view_all: "Ver tudo",
    no_notifications: "Sem novas notificações",
    mark_all_read: "Marcar todas como lidas",
    language: "Idioma",
    welcome_back: "Bem-vindo de volta",
    total_balance: "Saldo Total",
    available_balance: "Saldo Disponível",
    invested_funds: "Fundos Investidos",
    locked_rewards: "Recompensas Bloqueadas",
    recent_transactions: "Transações Recentes",
    market_overview: "Visão Geral do Mercado",
    top_assets: "Principais Ativos",
    performance: "Desempenho",
    about_us: "Sobre Nós",
    how_it_works: "Como Funciona",
    reviews: "Avaliações",
    blog: "Blog",
    signin: "Entrar",
    signup: "Começar",
    hero_badge: "Nó de Portfólio Quantitativo Seguro",
    hero_title: "Plataforma de Rendimento de Nível Institucional",
    hero_subtitle: "Aloque capital em nós de negociação automatizados seguros. Ganhe rendimentos ajustados ao risco com limites garantidos.",
    deploy_capital: "Alocar Capital",
    explore_portal: "Explorar Portal",
    join_newsletter: "Participe da Newsletter da Wave",
    newsletter_placeholder: "Seu Endereço de E-mail",
    subscribe: "Inscrever-se",
    welcome_wave_press: "Bem-vindo ao Wave Press",
    submitting: "Enviando...",
    continue_reading: "Continuar lendo",
    why_choose_us: "Por que nos escolher",
    recent_investments: "Registro de Investimentos Recentes",
    realtime_activity: "Operações de Nós em Tempo Real",
    active_plans: "Nós de Investimento Ativos"
  },
  AR: {
    dashboard: "لوحة التحكم",
    home: "الرئيسية",
    fund: "التمويل",
    invest: "الاستثمار",
    help: "المساعدة",
    me: "أنا",
    profile: "الملف الشخصي",
    settings: "الإعدادات",
    terminate: "تسجيل الخروج",
    search_assets: "البحث عن الأصول",
    authenticated_as: "مصادق كـ",
    status: "الحالة",
    view_privileges: "عرض الامتيازات",
    notifications: "الإشعارات",
    view_all: "عرض الكل",
    no_notifications: "لا توجد إشعارات جديدة",
    mark_all_read: "تحديد الكل كمقروء",
    language: "اللغة",
    welcome_back: "مرحبًا بعودتك",
    total_balance: "إجمالي الرصيد",
    available_balance: "الرصيد المتاح",
    invested_funds: "الأموال المستثمرة",
    locked_rewards: "المكافآت المؤمنة",
    recent_transactions: "المعاملات الأخيرة",
    market_overview: "نظرة عامة على السوق",
    top_assets: "أفضل الأصول",
    performance: "الأداء",
    about_us: "من نحن",
    how_it_works: "كيف يعمل",
    reviews: "التقييمات",
    blog: "المدونة",
    signin: "تسجيل الدخول",
    signup: "البدء",
    hero_badge: "عقدة محفظة كمية آمنة",
    hero_title: "منصة عوائد خوارزمية متميزة",
    hero_subtitle: "خصص رأس مالك في عقد تداول مؤتمتة آمنة مدعومة بنماذج كمية رفيعة المستوى. اكسب عوائد مضمونة بمرونة تامة.",
    deploy_capital: "توزيع رأس المال",
    explore_portal: "استكشاف البوابة",
    join_newsletter: "انضم إلى نشرة Wave الإخبارية",
    newsletter_placeholder: "بريدك الإلكتروني",
    subscribe: "اشتراك",
    welcome_wave_press: "مرحبًا بكم في Wave Press",
    submitting: "جاري الإرسال...",
    continue_reading: "متابعة القراءة",
    why_choose_us: "لماذا تختارنا",
    recent_investments: "سجل الاستثمارات الأخيرة",
    realtime_activity: "عمليات العقد المباشرة",
    active_plans: "عقد الاستثمار النشطة"
  },
  ZH: {
    dashboard: "控制面板",
    home: "系统主页",
    fund: "资金存取",
    invest: "执行投资",
    help: "帮助支持",
    me: "个人中心",
    profile: "个人资料",
    settings: "系统设置",
    terminate: "退出登录",
    search_assets: "搜索全球资产",
    authenticated_as: "身份验证为",
    status: "节点状态",
    view_privileges: "查看权限",
    notifications: "消息通知",
    view_all: "查看全部",
    no_notifications: "暂无新消息",
    mark_all_read: "全部标记为已读",
    language: "切换语言",
    welcome_back: "欢迎您回来",
    total_balance: "账户总资产",
    available_balance: "可用余额",
    invested_funds: "已投资金",
    locked_rewards: "锁定奖励",
    recent_transactions: "最近交易明细",
    market_overview: "市场大盘概况",
    top_assets: "全球热门资产",
    performance: "节点年化业绩",
    about_us: "关于我们",
    how_it_works: "运作原理",
    reviews: "用户真实评价",
    blog: "博客说明",
    signin: "登录系统",
    signup: "立即开始",
    hero_badge: "安全量化投资组合节点",
    hero_title: "机构级算法量化收益平台",
    hero_subtitle: "将您的资金部署至由顶级量化模型驱动的安全自动交易节点中。获取无风险及保障限额的稳健资产回馈。",
    deploy_capital: "部署节点资本",
    explore_portal: "探索数字门户",
    join_newsletter: "订阅 Wave 官方动态",
    newsletter_placeholder: "您的电子邮件地址",
    subscribe: "立即订阅",
    welcome_wave_press: "欢迎访问 Wave 媒体空间",
    submitting: "正在提交...",
    continue_reading: "继续阅读",
    why_choose_us: "核心品牌优势",
    recent_investments: "最近全球投资日志",
    realtime_activity: "实时交易节点运营",
    active_plans: "当前运行的投资节点"
  },
  JA: {
    dashboard: "ダッシュボード",
    home: "ホーム",
    fund: "資金管理",
    invest: "資産運用",
    help: "サポート",
    me: "マイページ",
    profile: "プロフィール設定",
    settings: "システム環境設定",
    terminate: "ログアウト成し遂げる",
    search_assets: "デジタル資産検索",
    authenticated_as: "認証済みのアカウント",
    status: "アクティブ状態",
    view_privileges: "特権を閲覧",
    notifications: "通知履歴",
    view_all: "すべて表示",
    no_notifications: "新しい通知はありません",
    mark_all_read: "すべて既読にする",
    language: "表示言語",
    welcome_back: "お帰りなさいませ",
    total_balance: "ポートフォリオ総高",
    available_balance: "ウォレット残高",
    invested_funds: "運用中資金額",
    locked_rewards: "ロック中獲得報酬",
    recent_transactions: "取引履歴一覧",
    market_overview: "グローバル市場サマリー",
    top_assets: "トレンド注目アセット",
    performance: "期待される実績値",
    about_us: "企業情報・使命",
    how_it_works: "運用の仕組み",
    reviews: "利用者の実績評価",
    blog: "公式ブログ",
    signin: "サインイン",
    signup: "アカウントを作成",
    hero_badge: "セキュアなクオンツ運用ポートフォリオ",
    hero_title: "機関投資家向けの定量的収益エンジン",
    hero_subtitle: "トップエリートのクオンツモデルが駆動する全自動ボット。リスクヘッジ機能を完備した資産形成をお約束します。",
    deploy_capital: "資金の投下を開始する",
    explore_portal: "システムに入る",
    join_newsletter: "ニュースレターに登録する",
    newsletter_placeholder: "有効なメールアドレスを入力してください",
    subscribe: "安全に購読する",
    welcome_wave_press: "Wave ニュースハブへようこそ",
    submitting: "サーバー送信中...",
    continue_reading: "記事本文を読む",
    why_choose_us: "Waveが選ばれる理由",
    recent_investments: "最近のアセット運用ログ",
    realtime_activity: "AI自動ノード実行フェーズ",
    active_plans: "稼働中のポートフォリオアセット"
  },
  KO: {
    dashboard: "대시보드",
    home: "홈화면",
    fund: "자산운용",
    invest: "투자수행",
    help: "고객지원",
    me: "내정보",
    profile: "프로필 관리",
    settings: "시스템설정",
    terminate: "안전하게 로그아웃",
    search_assets: "실시간 아셋 검색",
    authenticated_as: "보안 계정인증 완료",
    status: "등급상태",
    view_privileges: "보안 권한조회",
    notifications: "모든 알림목록",
    view_all: "전체 목록보기",
    no_notifications: "수신된 새로운 메세지가 없습니다",
    mark_all_read: "전체 읽음처리",
    language: "언어선택",
    welcome_back: "정상 복귀를 축하합니다",
    total_balance: "누적 총 순자산",
    available_balance: "출금가능 실시간 액수",
    invested_funds: "활성화 채널 노드자금",
    locked_rewards: "적립된 잠금 리워드",
    recent_transactions: "최근 입출금거래 명세",
    market_overview: "세계 시장 동향분석",
    top_assets: "고성과 가상자산 등급",
    performance: "누적 종합 성과지표",
    about_us: "자문 및 프로토콜 소개",
    how_it_works: "스마트 시스템 가이드",
    reviews: "실제 고객 체험수기",
    blog: "미디어 릴리즈",
    signin: "보안인증 로그인",
    signup: "즉시 플랜개시",
    hero_badge: "보안 양적 포트폴리오 프로토콜",
    hero_title: "기관 등급의 분산형 자동 수익 모델",
    hero_subtitle: "빅데이터 최첨단 금융 봇이 운용하는 알고리즘 노드에 위탁하세요. 철저한 하드 캡 제한으로 기획된 안정 수익을 제공합니다.",
    deploy_capital: "자금 실전 전개",
    explore_portal: "콘솔 대시보드 진입",
    join_newsletter: "실시간 중요 통신문 수신",
    newsletter_placeholder: "당신의 활성 이메일 정보",
    subscribe: "소식 구독하기",
    welcome_wave_press: "독창적인 미디어 저장소",
    submitting: "데이터 동기화 중...",
    continue_reading: "백서 및 릴리즈 보기",
    why_choose_us: "독자적인 기술 경쟁력",
    recent_investments: "최신 입찰투자 트랜잭션",
    realtime_activity: "스마트 노드 엔진 실행상황",
    active_plans: "작동되고 있는 네트워크 노드"
  },
  RU: {
    dashboard: "Панель",
    home: "Главная",
    fund: "Депозиты",
    invest: "Инвестиции",
    help: "Поддержка",
    me: "Мой аккаунт",
    profile: "Информация профиля",
    settings: "Настройки конфиденциальности",
    terminate: "Выйти из системы",
    search_assets: "ПОИСК ДОСТУПНЫХ АКТИВОВ",
    authenticated_as: "Сессия авторизована для",
    status: "Статус аккаунта",
    view_privileges: "Разрешенные лимиты",
    notifications: "Системные уведомления",
    view_all: "Развернуть список",
    no_notifications: "Новых уведомлений нет",
    mark_all_read: "Пометить всё прочитанным",
    language: "Интерфейс",
    welcome_back: "Рады приветствовать снова",
    total_balance: "Общий размер портфеля",
    available_balance: "Средства для вывода",
    invested_funds: "Инвестировано в пулы",
    locked_rewards: "Заблокированные дивиденды",
    recent_transactions: "История недавних переводов",
    market_overview: "Динамика биржевого рынка",
    top_assets: "Главные крипто-активы",
    performance: "Фактическая эффективность",
    about_us: "Наша миссия и команда",
    how_it_works: "Методология работы",
    reviews: "Реальные отзывы клиентов",
    blog: "Официальный блог",
    signin: "Авторизоваться",
    signup: "Запустить контракт",
    hero_badge: "Защищенный Квантовый Инвестиционный Портфель",
    hero_title: "Алгоритмический Робот-Конвейер Государственного Класса",
    hero_subtitle: "Распределяйте капитал в инновационные торговые роботы под управлением опытных аналитиков. Фиксируйте прибыль без рисков.",
    deploy_capital: "Активировать депозит",
    explore_portal: "Открыть терминал",
    join_newsletter: "Оформите подписку на инсайды Wave",
    newsletter_placeholder: "Ваша действующая почта",
    subscribe: "Подтвердить подписку",
    welcome_wave_press: "Добро пожаловать в Пресс-центр Wave",
    submitting: "Отправка на узел...",
    continue_reading: "Продолжить ознакомление",
    why_choose_us: "Преимущества нашего терминала",
    recent_investments: "Журнал международных вложений",
    realtime_activity: "Запущенные вычисления нод",
    active_plans: "Активированные пулы доходности"
  },
  HI: {
    dashboard: "डैशबोर्ड",
    home: "होमपेज",
    fund: "फंड सुरक्षा",
    invest: "निवेश योजना",
    help: "ग्राहक सहायता",
    me: "मेरा प्रोफ़ाइल",
    profile: "पहचान कस्टमाइज करें",
    settings: "सिस्टम सेटिंग्स",
    terminate: "सत्र समाप्त करें",
    search_assets: "ग्लोबल एसेट सर्च",
    authenticated_as: "सफल सत्यापित उपयोगकर्ता",
    status: "प्रोफ़ाइल स्तर",
    view_privileges: "अधिकार पत्र देखें",
    notifications: "महत्वपूर्ण सूचनाएं",
    view_all: "सभी विवरण दिखाएं",
    no_notifications: "कोई नया अपडेट नहीं है",
    mark_all_read: "सभी को पढ़ा हुआ चिह्नित करें",
    language: "भाषा बदलें",
    welcome_back: "सत्र में पुनः स्वागत है",
    total_balance: "सकल कुल आस्तियां",
    available_balance: "निकासी योग्य राशि",
    invested_funds: "सक्रिय निवेश पूंजी",
    locked_rewards: "सुरक्षित लॉक रिवार्ड्स",
    recent_transactions: "हाल की वित्तीय गतिविधियां",
    market_overview: "वैश्विक बाजार की स्थिति",
    top_assets: "सर्वश्रेष्ठ प्रदर्शनकारी एसेट्स",
    performance: "अनुमानित कुल लाभ",
    about_us: "परिचय एवं दर्शन",
    how_it_works: "सिस्टम की कार्यप्रणाली",
    reviews: "ग्राहक रेटिंग और समीक्षाएं",
    blog: "मीडिया ब्लॉग",
    signin: "लॉग इन करें",
    signup: "निवेश शुरू करें",
    hero_badge: "सुरक्षित मात्रात्मक निवेश पोर्टफोलियो",
    hero_title: "संस्थागत स्तर का स्वचालित ट्रेडिंग रोबोट",
    hero_subtitle: "अग्रणी मात्रात्मक मॉडल द्वारा संचालित स्वचालित प्रणालियों में पूंजी लगाएं। न्यूनतम जोखिम के साथ निश्चित दैनिक आय अर्जित करें।",
    deploy_capital: "पूंजी निवेश की शुरुआत करें",
    explore_portal: "कंट्रोल डेस्क खोलें",
    join_newsletter: "Wave समाचार पत्र की सदस्यता लें",
    newsletter_placeholder: "अपना प्रामाणिक ईमेल दर्ज करें",
    subscribe: "सदस्यता लें",
    welcome_wave_press: "Wave प्रेस गैलरी में आपका स्वागत है",
    submitting: "भेजा जा रहा है...",
    continue_reading: "आगे पढ़ें",
    why_choose_us: "हम सर्वश्रेष्ठ क्यों हैं",
    recent_investments: "नवीनतम वैश्विक निवेश लेनदेन",
    realtime_activity: "वास्तविक समय नोड गतिविधियां",
    active_plans: "संचालित निवेश नोड्स"
  },
  TR: {
    dashboard: "Yönetim Paneli",
    home: "Anasayfa",
    fund: "Varlık Aktarımı",
    invest: "Yatırımı Yönet",
    help: "Hızlı Destek",
    me: "Kullanıcı Profili",
    profile: "Hesap Bilgileri",
    settings: "Güvenlik Ayarları",
    terminate: "Oturumu Güvenle Kapat",
    search_assets: "YATIRIM ARAÇLARI TARAMASI",
    authenticated_as: "Kimlik doğrulama kanalı",
    status: "Referans Derecesi",
    view_privileges: "Hacim İzinleri",
    notifications: "Sistem Mesajları",
    view_all: "Hepsini Göster",
    no_notifications: "Herhangi bir yeni bildiriminiz kalmadı",
    mark_all_read: "Tümünü okundu olarak onayla",
    language: "Dil Tercihi",
    welcome_back: "Panele tekrar hoş geldiniz",
    total_balance: "Toplam Hesap Değeri",
    available_balance: "Çekilebilir Likit Bakiye",
    invested_funds: "Portföy Havuzundaki Tutar",
    locked_rewards: "Tahsis Edilen Bloklu Ödüller",
    recent_transactions: "Son Gerçekleşen Akışlar",
    market_overview: "Finansal Piyasalar Özeti",
    top_assets: "Öne Çıkan Enstrümanlar",
    performance: "Ortalama Kazanç İvmesi",
    about_us: "Vizyonumuz ve Altyapı",
    how_it_works: "Platform Nasıl Çalışır",
    reviews: "Yatırımcı Geri Bildirimleri",
    blog: "Kurumsal Duyurular",
    signin: "Kullanıcı Girişi",
    signup: "Sermaye Dağıt",
    hero_badge: "Güvenli Yapay Zeka Tabanlı Portföy",
    hero_title: "Kurumsal Sınıf Algoritmik Getiri Merkezi",
    hero_subtitle: "Gelişmiş analitik sistemlerle entegre çalışan akıllı havuzlara katılın. Maksimum kar marjı ile kesintisiz faaliyete başlayın.",
    deploy_capital: "Likidite Sağlamaya Başla",
    explore_portal: "Sisteme Giriş Yap",
    join_newsletter: "Gelişmelerden ve Haberlerden Bilgi Alın",
    newsletter_placeholder: "İrtibat kurulacak e-posta adresiniz",
    subscribe: "Hemen Kaydol",
    welcome_wave_press: "Wave Yayın Odası Dünyasına Giriş",
    submitting: "İşlem altyapıya aktarılıyor...",
    continue_reading: "Detaylı Makaleye Git",
    why_choose_us: "Bizi Tercih Etme Nedenleriniz",
    recent_investments: "Son Tamamlanan Yatırımlar",
    realtime_activity: "Canlı Yapay Zeka Düğüm Aktiviteleri",
    active_plans: "Etkin Kripto Para Havuzları"
  },
  IT: {
    dashboard: "Console Navigazione",
    home: "Pagina Home",
    fund: "Deposito & Prelievi",
    invest: "Configura Investimento",
    help: "Centro Supporto",
    me: "Area Riservata",
    profile: "Gestione Anagrafica",
    settings: "Impostazioni Sicurezza",
    terminate: "Esci dell'Applicativo",
    search_assets: "MOSTRA LISTINO ASSETS",
    authenticated_as: "Certificato di autenticità per",
    status: "Grado di Fiducia",
    view_privileges: "Visualizza Limiti Massimi",
    notifications: "Pannello Avvisi",
    view_all: "Esplora Messaggi",
    no_notifications: "Nessun avviso da segnalare",
    mark_all_read: "Archivia e leggi tutto",
    language: "Imposta Lingua",
    welcome_back: "Esperienza avviata con successo",
    total_balance: "Capitale Totale Registrato",
    available_balance: "Liquidità Immediata",
    invested_funds: "Capitale Vincolato in Nodi",
    locked_rewards: "Dividendi in Accumulo",
    recent_transactions: "Operazioni Contabili Recenti",
    market_overview: "Flussi Finanziari in Tempo Reale",
    top_assets: "Valute Preferite dai Bot",
    performance: "Progresso Totale Profilo",
    about_us: "Progetto e Linee Guida",
    how_it_works: "Guida Interattiva",
    reviews: "Testimonianze Certificate",
    blog: "Notiziario Interno",
    signin: "Accedi",
    signup: "Apri Posizione",
    hero_badge: "Nodo Blindato ad Alto Rendimento Quantitativo",
    hero_title: "Stazione Digitale per Algoritmi ad Accumulo Fisso",
    hero_subtitle: "Vincola quote nei nodi commerciali autogestiti. Sfrutta parametri a basso rischio di default approvati dagli esperti.",
    deploy_capital: "Alimentare il Portafoglio",
    explore_portal: "Accedi alla Stazione",
    join_newsletter: "Ricevi Informazioni Strategiche in Tempo Reale",
    newsletter_placeholder: "Inserire indirizzo email preferito",
    subscribe: "Invia Richiesta Iscrizione",
    welcome_wave_press: "Sala Stampa Wave Network",
    submitting: "Protocollo in inoltro...",
    continue_reading: "Esamina la Documentazione",
    why_choose_us: "Cosa Ci Differenzia dagli Altri",
    recent_investments: "Storico Posizioni Minerarie",
    realtime_activity: "Elaborazione Pipeline Quantitative",
    active_plans: "Nodi Operativi Correnti"
  },
  NL: {
    dashboard: "Gebruikers Dashboard",
    home: "Startpagina",
    fund: "Financiële Transacties",
    invest: "Investering Starten",
    help: "Klantenservice Desk",
    me: "Account Menu",
    profile: "Persoonlijk Profiel",
    settings: "Systeemvoorkeuren",
    terminate: "Sessie Veilig Beëindigen",
    search_assets: "ZOEKEN NAAR ACTIVA",
    authenticated_as: "Geautoriseerd onder ID",
    status: "Toegangsstatus",
    view_privileges: "Bekijk Account Rechten",
    notifications: "Systeemberichten",
    view_all: "Volledig overzicht",
    no_notifications: "U heeft momenteel geen nieuwe waarschuwingen",
    mark_all_read: "Alles markeren als gelezen",
    language: "Taal Selectie",
    welcome_back: "Fijn dat u er weer bent",
    total_balance: "Cumulatief Account Saldo",
    available_balance: "Opneembare Gelden",
    invested_funds: "Kapitaal in Actieve Markten",
    locked_rewards: "Gereserveerde Bonussen",
    recent_transactions: "Verloop van Rekeningafschriften",
    market_overview: "Financieel Marktoverzicht",
    top_assets: "Best Presterende Activa",
    performance: "Behaalde Rendementsscores",
    about_us: "Doelen en Doelstellingen",
    how_it_works: "Uitleg van het Platform",
    reviews: "Feedback van Deelnemers",
    blog: "Persberichten & Nieuws",
    signin: "Inloggen",
    signup: "Abonneerservice Activeren",
    hero_badge: "Gegarandeerd Kwantitatief Netwerkknooppunt",
    hero_title: "Professioneel Robotgestuurd Handelsplatform",
    hero_subtitle: "Zet vermogen uit op geautomatiseerde handelsaccounts. Ontvang stabiele opbrengsten met maximale vangnetfilters.",
    deploy_capital: "Investeringsfonds Voeden",
    explore_portal: "Open de Beheersomgeving",
    join_newsletter: "Op de hoogte blijven van Wave Updates",
    newsletter_placeholder: "E-mailadres voor toezending",
    subscribe: "Registreren",
    welcome_wave_press: "Perscentrum van Wave Network",
    submitting: "Systeem synchroniseert...",
    continue_reading: "Informatiepagina Openen",
    why_choose_us: "Waarom U Voor Ons Moet Kiezen",
    recent_investments: "Boekingen van Recente Investeringen",
    realtime_activity: "Voortgang van AI-Processen",
    active_plans: "Lopende Productiepools"
  },
  ID: {
    dashboard: "Dasbor Pengguna",
    home: "Halaman Depan",
    fund: "Manajemen Saldo",
    invest: "Mulai Investasi",
    help: "Layanan Pelanggan",
    me: "Akun Saya",
    profile: "Identitas Diri",
    settings: "Konfigurasi Sistem",
    terminate: "Keluar Lebih Aman",
    search_assets: "PENCARIAN ASET TERSEDIA",
    authenticated_as: "Otorisasi akun atas nama",
    status: "Status Anggota",
    view_privileges: "Periksa Akses Istimewa",
    notifications: "Pemberitahuan Sistem",
    view_all: "Review Semua Pesan",
    no_notifications: "Tidak ada pesan konfirmasi masuk",
    mark_all_read: "Simpulkan semua telah dibaca",
    language: "Pilih Bahasa",
    welcome_back: "Koneksi berhasil dipulihkan",
    total_balance: "Total Akumulasi Portofolio",
    available_balance: "Baki Kas yang Bisa Ditarik",
    invested_funds: "Modal Aktif dalam Kontrak",
    locked_rewards: "Akumulasi Bonus Terkunci",
    recent_transactions: "Catatan Arus Kas Terakhir",
    market_overview: "Tinjauan Volume Perdagangan",
    top_assets: "Instrumen Favorit Algoritma",
    performance: "Laporan Kinerja Transaksi",
    about_us: "Informasi Manajemen",
    how_it_works: "Skema dan Aliran Sistem",
    reviews: "Rating dan Testimoni Nyata",
    blog: "Rangkuman Berita Pasar",
    signin: "Silakan Masuk",
    signup: "Mulai Program",
    hero_badge: "Daftar Portofolio Kuantitatif yang Diproteksi",
    hero_title: "Stasiun Alokasi Dana Arbitrase Multi-Pasar",
    hero_subtitle: "Delegasikan saldo ke robot perdagangan otomatis. Dapatkan persentase yield harian yang konsisten dengan asuransi batas harian.",
    deploy_capital: "Aktifkan Node Saldo",
    explore_portal: "Buka Dasbor Portal",
    join_newsletter: "Dapatkan Insight Informasi Langsung dari Server",
    newsletter_placeholder: "Alamat email penampung Anda",
    subscribe: "Konfirmasi Berlangganan",
    welcome_wave_press: "Ruang Media Wave Network",
    submitting: "Sedang diproses...",
    continue_reading: "Buka Lembaran Rilis",
    why_choose_us: "Keunggulan Mutlak Layanan Kami",
    recent_investments: "Log Posisi Transaksi Global",
    realtime_activity: "Eksekusi Arbitrase Pemrosesan Langsung",
    active_plans: "Daftar Node Investasi Berjalan"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('nexus_language') as Language) || 'EN';
  });

  useEffect(() => {
    localStorage.setItem('nexus_language', language);

    // RTL handling for Arabic
    const isRTL = language === 'AR';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language.toLowerCase();

    const getGoogleTranslateCode = (lang: string) => {
      const l = lang.toLowerCase();
      if (l === 'zh') return 'zh-CN';
      return l;
    };

    const targetLang = getGoogleTranslateCode(language);
    const cookieValue = language === 'EN' ? '/en/en' : `/en/${targetLang}`;

    const enforceCookies = () => {
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      const rootDomain = parts.length > 1 ? '.' + parts.slice(-2).join('.') : '';
      const domains = [hostname, '.' + hostname, rootDomain].filter(Boolean);

      if (language === 'EN') {
        document.cookie = `googtrans=/en/en; path=/; SameSite=Lax;`;
        domains.forEach(domain => {
          document.cookie = `googtrans=/en/en; path=/; domain=${domain}; SameSite=Lax;`;
        });
      } else {
        document.cookie = `googtrans=${cookieValue}; path=/; SameSite=Lax;`;
        domains.forEach(domain => {
          document.cookie = `googtrans=${cookieValue}; path=/; domain=${domain}; SameSite=Lax;`;
        });
      }
    };

    enforceCookies();

    // Setup global Translate Callback
    (window as any).googleTranslateElementInit = () => {
      try {
        if ((window as any).google && (window as any).google.translate) {
          let div = document.getElementById('google_translate_element');
          if (!div) {
            div = document.createElement('div');
            div.id = 'google_translate_element';
            div.style.cssText = "position: fixed; top: -1000px; left: -1000px; width: 1px; height: 1px; overflow: hidden; opacity: 0; pointer-events: none; z-index: -9999;";
            document.body.appendChild(div);
          }
          new (window as any).google.translate.TranslateElement({
            pageLanguage: 'en',
            layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
          }, 'google_translate_element');
        }
      } catch (e) {
        console.error("Google Translate Init Error:", e);
      }
    };

    // Load google translate widget script if not present
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }

    let translateDiv = document.getElementById('google_translate_element');
    if (!translateDiv) {
      const div = document.createElement('div');
      div.id = 'google_translate_element';
      div.style.cssText = "position: fixed; top: -1000px; left: -1000px; width: 1px; height: 1px; overflow: hidden; opacity: 0; pointer-events: none; z-index: -9999;";
      document.body.appendChild(div);
    } else {
      translateDiv.style.cssText = "position: fixed; top: -1000px; left: -1000px; width: 1px; height: 1px; overflow: hidden; opacity: 0; pointer-events: none; z-index: -9999;";
    }

    if (!document.getElementById('google-translate-styles')) {
      const style = document.createElement('style');
      style.id = 'google-translate-styles';
      style.innerHTML = `
        .goog-te-banner-frame.skiptranslate,
        iframe[class*="goog-te-banner-frame"],
        .goog-te-banner-frame,
        .goog-te-balloon-frame,
        .goog-te-gadget-icon,
        .goog-te-gadget-simple img,
        #goog-gt-tt,
        .goog-te-spinner-pos {
          display: none !important;
        }
        body {
          top: 0px !important;
        }
        .skiptranslate {
          display: none !important;
        }
        body > .skiptranslate {
          display: none !important;
        }
        .goog-tooltip, .goog-tooltip:hover {
          display: none !important;
        }
        .goog-text-highlight {
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
      `;
      document.head.appendChild(style);
    }

    if ((window as any).google && (window as any).google.translate && (window as any).google.translate.TranslateElement) {
      (window as any).googleTranslateElementInit();
    }

    const updateTranslateWidget = () => {
      enforceCookies();
      try {
        const selectEl = document.querySelector('select.goog-te-combo') as HTMLSelectElement;
        if (selectEl) {
          const expectedVal = language === 'EN' ? 'en' : targetLang;
          if (selectEl.value !== expectedVal) {
            selectEl.value = expectedVal;
            selectEl.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
          } else if (language !== 'EN') {
            // Re-fire change event to force translate newly mounted React nodes
            selectEl.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
          }
        } else {
          if ((window as any).google && (window as any).google.translate && (window as any).google.translate.TranslateElement) {
            (window as any).googleTranslateElementInit();
          }
        }
      } catch (err) {
        console.error("Widget update error:", err);
      }
    };

    updateTranslateWidget();
    const interval = setInterval(updateTranslateWidget, 400);

    // Observe React DOM mutations to catch new component mounts
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const observer = new MutationObserver(() => {
      if (language === 'EN') return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        updateTranslateWidget();
      }, 250);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearInterval(interval);
      observer.disconnect();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [language]);

  const t = (key: string): string => {
    // Check if the key direct matches translations
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    // Perform robust phrase matching (lowercase and robust trims)
    const cleanedKey = key.trim().toLowerCase().replace(/[._-\s]+/g, '_');
    if (translations[language] && translations[language][cleanedKey]) {
      return translations[language][cleanedKey];
    }
    // Check exact matches on original translations keys
    const match = Object.keys(translations['EN']).find(k => k.toLowerCase() === cleanedKey);
    if (match && translations[language][match]) {
      return translations[language][match];
    }

    // Direct string match mapping to protect dynamic paragraphs on home
    const stringMap: Record<Language, Record<string, string>> = {
      EN: {},
      ES: {
        "About Us": "Sobre Nosotros",
        "How It Works": "Cómo Funciona",
        "Reviews": "Opiniones",
        "Blog": "Blog",
        "Help": "Ayuda",
        "Sign In": "Iniciar Sesión",
        "Get Started": "Empezar",
        "I Understand And Agree To The Investment Terms": "Entiendo y Acepto los Términos de Inversión",
        "Confirm Investment": "Confirmar Inversión",
        "Double click to confirm your capital commitment block.": "Haga doble clic para confirmar su bloque de compromiso de capital.",
        "Secure Neural Link Encryption Active": "Cifrado de Enlace Neural Seguro Activo",
        "Capital Allocation Node": "Nodo de Asignación de Capital",
        "Welcome back": "Bienvenido de nuevo",
        "Secure Quantitative Portfolio Node": "Nodo de Cartera Cuantitativa Segura",
        "Institutional Grade Algorithmic Yield Platform": "Plataforma de Rendimiento Algorítmico Profesional",
        "Allocate capital into secure automated trading nodes powered by elite quantitative models. Earn risk-adjusted yields with guaranteed threshold limits.": "Asigne capital en nodos de negociación automatizados guiados por modelos cuantitativos de élite. Obtenga rendimientos estables con límites protegidos.",
        "Deploy Capital": "Desplegar Capital",
        "Explore Portal": "Explorar Portal",
        "Join the Wave Newsletter": "Únete al boletín de Wave",
        "Your Email Address": "Su dirección de correo electrónico",
        "Subscribe": "Suscribirse",
        "Welcome to Wave Press": "Bienvenido a Wave Press",
        "Continue Reading": "Continuar leyendo"
      },
      FR: {
        "About Us": "À Propos",
        "How It Works": "Comment Ça Marche",
        "Reviews": "Avis",
        "Blog": "Blog",
        "Help": "Aide",
        "Sign In": "Se Connecter",
        "Get Started": "Commencer",
        "I Understand And Agree To The Investment Terms": "Je Comprends et J'Accepte les Conditions d'Investissement",
        "Confirm Investment": "Confirmer l'Investissement",
        "Double click to confirm your capital commitment block.": "Double-cliquez pour confirmer votre engagement de capital.",
        "Secure Neural Link Encryption Active": "Chiffrement du Lien Neural Sécurisé Actif",
        "Capital Allocation Node": "Nœud d'Allocation de Capital",
        "Welcome back": "Bon retour",
        "Secure Quantitative Portfolio Node": "Nœud de Portefeuille Quantitatif Sécurisé",
        "Institutional Grade Algorithmic Yield Platform": "Plateforme Algorithmique de Qualité Institutionnelle",
        "Allocate capital into secure automated trading nodes powered by elite quantitative models. Earn risk-adjusted yields with guaranteed threshold limits.": "Allouez votre capital dans des nœuds de trading automatisés et sécurisés. Obtenez des rendements optimisés avec des limites garanties.",
        "Deploy Capital": "Déployer le Capital",
        "Explore Portal": "Explorer le Portail",
        "Join the Wave Newsletter": "Rejoignez la Newsletter de Wave",
        "Your Email Address": "Votre adresse e-mail",
        "Subscribe": "S'abonner",
        "Welcome to Wave Press": "Bienvenue sur Wave Press",
        "Continue Reading": "Continuer la lecture"
      },
      DE: {
        "About Us": "Über uns",
        "How It Works": "Wie es funktioniert",
        "Reviews": "Bewertungen",
        "Blog": "Blog",
        "Help": "Hilfe",
        "Sign In": "Anmelden",
        "Get Started": "Erste Schritte",
        "I Understand And Agree To The Investment Terms": "Ich verstehe und stimme den Anlagebedingungen zu",
        "Confirm Investment": "Investition bestätigen",
        "Double click to confirm your capital commitment block.": "Doppelklicken Sie, um Ihre Kapitalzusage zu bestätigen.",
        "Secure Neural Link Encryption Active": "Sichere neurale Verbindungsverschlüsselung aktiv",
        "Capital Allocation Node": "Kapitalallokationsknoten",
        "Welcome back": "Willkommen zurück",
        "Secure Quantitative Portfolio Node": "Sicherer Quantitativer Portfolioknoten",
        "Institutional Grade Algorithmic Yield Platform": "Algorithmische Renditeplattform für Institutionen",
        "Allocate capital into secure automated trading nodes powered by elite quantitative models. Earn risk-adjusted yields with guaranteed threshold limits.": "Weisen Sie Kapital in sicheren automatisierten Handelsknoten zu. Erzielen Sie risikoadjustierte Renditen mit garantierten Mindestgrenzen.",
        "Deploy Capital": "Kapital einsetzen",
        "Explore Portal": "Portal erkunden",
        "Join the Wave Newsletter": "Melden Sie sich für den Wave-Newsletter an",
        "Your Email Address": "Ihre E-Mail-Adresse",
        "Subscribe": "Abonnieren",
        "Welcome to Wave Press": "Willkommen bei Wave Press",
        "Continue Reading": "Weiterlesen"
      },
      PT: {
        "About Us": "Sobre Nós",
        "How It Works": "Como Funciona",
        "Reviews": "Avaliações",
        "Blog": "Blog",
        "Help": "Ajuda",
        "Sign In": "Entrar",
        "Get Started": "Começar",
        "I Understand And Agree To The Investment Terms": "Eu Entendo e Concordo com os Termos de Investimento",
        "Confirm Investment": "Confirmar Investimento",
        "Double click to confirm your capital commitment block.": "Clique duas vezes para confirmar o bloco de compromisso de capital.",
        "Secure Neural Link Encryption Active": "Criptografia de Link Neural Segura Ativa",
        "Capital Allocation Node": "Nó de Alocação de Capital",
        "Welcome back": "Bem-vindo de volta",
        "Secure Quantitative Portfolio Node": "Nó de Portfólio Quantitativo Seguro",
        "Institutional Grade Algorithmic Yield Platform": "Plataforma de Rendimento de Nível Institucional",
        "Allocate capital into secure automated trading models. Earn risk-adjusted yields with guaranteed threshold limits.": "Aloque capital em nós de negociação automatizados seguros. Ganhe rendimentos ajustados ao risco com limites garantidos.",
        "Deploy Capital": "Alocar Capital",
        "Explore Portal": "Explorar Portal",
        "Join the Wave Newsletter": "Participe da Newsletter da Wave",
        "Your Email Address": "Seu Endereço de E-mail",
        "Subscribe": "Inscrever-se",
        "Welcome to Wave Press": "Bem-vindo ao Wave Press",
        "Continue Reading": "Continuar lendo"
      },
      AR: {
        "About Us": "من نحن",
        "How It Works": "كيف يعمل",
        "Reviews": "التقييمات",
        "Blog": "المدونة",
        "Help": "المساعدة",
        "Sign In": "تسجيل الدخول",
        "Get Started": "ابدأ الآن",
        "I Understand And Agree To The Investment Terms": "أفهم وأوافق على شروط الاستثمار",
        "Confirm Investment": "تأكيد الاستثمار",
        "Double click to confirm your capital commitment block.": "انقر نقرًا مزدوجًا لتأكيد التزامك برأس المال.",
        "Secure Neural Link Encryption Active": "تشفير الرابط العصبي الآمن نشط",
        "Capital Allocation Node": "عقدة تخصيص رأس المال",
        "Welcome back": "مرحباً بعودتك",
        "Secure Quantitative Portfolio Node": "عقدة محفظة كمية آمنة",
        "Institutional Grade Algorithmic Yield Platform": "منصة عوائد خوارزمية متميزة",
        "Allocate capital into secure automated trading nodes powered by elite quantitative models. Earn risk-adjusted yields with guaranteed threshold limits.": "خصص رأس مالك في عقد تداول مؤتمتة آمنة مدعومة بنماذج كمية رفيعة المستوى. اكسب عوائد مضمونة بمرونة تامة.",
        "Deploy Capital": "توزيع رأس المال",
        "Explore Portal": "استكشاف البوابة",
        "Join the Wave Newsletter": "انضم إلى نشرة Wave الإخبارية",
        "Your Email Address": "بريدك الإلكتروني",
        "Subscribe": "اشتراك",
        "Welcome to Wave Press": "مرحبًا بكم في Wave Press",
        "Continue Reading": "متابعة القراءة"
      },
      ZH: {
        "About Us": "关于我们",
        "How It Works": "运作原理",
        "Reviews": "用户评价",
        "Blog": "博客说明",
        "Help": "帮助支持",
        "Sign In": "登录系统",
        "Get Started": "立即开始",
        "I Understand And Agree To The Investment Terms": "本人理解并同意上述投资服务协议条款",
        "Confirm Investment": "确认执行投资",
        "Double click to confirm your capital commitment block.": "双击以确认您的节点资金投资部署承诺。",
        "Secure Neural Link Encryption Active": "安全神经加密传输信道已启用",
        "Capital Allocation Node": "资金配置执行结算节点",
        "Welcome back": "欢迎您回来",
        "Secure Quantitative Portfolio Node": "安全量化投资组合节点",
        "Institutional Grade Algorithmic Yield Platform": "机构级算法量化收益平台",
        "Allocate capital into secure automated trading nodes powered by elite quantitative models. Earn risk-adjusted yields with guaranteed threshold limits.": "将您的资金部署至由顶级量化模型驱动的安全自动交易节点中。获取无风险及保障限额的稳健资产回馈。",
        "Deploy Capital": "部署节点资本",
        "Explore Portal": "探索数字门户",
        "Join the Wave Newsletter": "订阅 Wave 官方动态",
        "Your Email Address": "您的电子邮件地址",
        "Subscribe": "立即订阅",
        "Welcome to Wave Press": "欢迎访问 Wave 媒体空间",
        "Continue Reading": "继续阅读"
      },
      JA: {
        "About Us": "会社概要",
        "How It Works": "運用の仕組み",
        "Reviews": "利用者の評判",
        "Blog": "公式ブログ",
        "Help": "サポート",
        "Sign In": "サインイン",
        "Get Started": "開始する",
        "I Understand And Agree To The Investment Terms": "投資の規則および規約を理解し同意します",
        "Confirm Investment": "運用の実行を承認",
        "Double click to confirm your capital commitment block.": "ダブルクリックして資本投入を最終確定します。",
        "Secure Neural Link Encryption Active": "セキュアな暗号化通信チャネルが確立されています",
        "Capital Allocation Node": "資本配分コントラクトノード",
        "Welcome back": "お帰りなさいませ",
        "Secure Quantitative Portfolio Node": "セキュアなクオンツ運用ポートフォリオ",
        "Institutional Grade Algorithmic Yield Platform": "機関投資家向けの定量的収益エンジン",
        "Allocate capital into secure automated trading nodes powered by elite quantitative models. Earn risk-adjusted yields with guaranteed threshold limits.": "トップエリートのクオンツモデルが駆動する全自動ボット。リスクヘッジ機能を完備した資産形成をお約束します。",
        "Deploy Capital": "資金の投下を開始する",
        "Explore Portal": "システムに入る",
        "Join the Wave Newsletter": "ニュースレターに登録する",
        "Your Email Address": "メールアドレスを入力",
        "Subscribe": "購読する",
        "Welcome to Wave Press": "Wave ニュースハブへようこそ",
        "Continue Reading": "記事本文を読む"
      },
      KO: {
        "About Us": "회사 소개",
        "How It Works": "스마트 가이드",
        "Reviews": "고객 후기",
        "Blog": "미디어 릴리즈",
        "Help": "고객지원",
        "Sign In": "로그인",
        "Get Started": "플랜 개시",
        "I Understand And Agree To The Investment Terms": "양적 자산위탁 투자 약관을 충실히 이해하고 동의합니다",
        "Confirm Investment": "투자 전개 승인",
        "Double click to confirm your capital commitment block.": "더블클릭하여 블록체인 노드 자본위탁을 최종 전개합니다.",
        "Secure Neural Link Encryption Active": "암호화 노드 채널 전송 활성화 완료",
        "Capital Allocation Node": "실시간 자본할당 시스템 노드",
        "Welcome back": "정상 복귀 완료",
        "Secure Quantitative Portfolio Node": "보안 양적 포트폴리오 프로토콜",
        "Institutional Grade Algorithmic Yield Platform": "기관 등급의 분산형 자동 수익 모델",
        "Allocate capital into secure automated trading nodes powered by elite quantitative models. Earn risk-adjusted yields with guaranteed threshold limits.": "빅데이터 최첨단 금융 봇이 운용하는 알고리즘 노드에 위탁하세요. 철저한 하드 캡 제한으로 기획된 안정 수익을 제공합니다.",
        "Deploy Capital": "자금 실전 전개",
        "Explore Portal": "대시보드 콘솔 진입",
        "Join the Wave Newsletter": "실시간 중요 통신문 수신",
        "Your Email Address": "당신의 이메일 정보",
        "Subscribe": "소식 구독하기",
        "Welcome to Wave Press": "독창적인 미디어 저장소",
        "Continue Reading": "백서 및 릴리즈 보기"
      },
      RU: {
        "About Us": "О нас",
        "How It Works": "Как работает",
        "Reviews": "Отзывы",
        "Blog": "Блог",
        "Help": "Помощь",
        "Sign In": "Войти",
        "Get Started": "Начать",
        "I Understand And Agree To The Investment Terms": "Я Понимаю и Согласен с Условиями Инвестирования",
        "Confirm Investment": "Подтвердить Инвестиции",
        "Double click to confirm your capital commitment block.": "Дважды нажмите, чтобы подтвердить размещение своего депозита.",
        "Secure Neural Link Encryption Active": "Безопасное нейросетевое сквозное шифрование активно",
        "Capital Allocation Node": "Выделенный узел управления вкладом",
        "Welcome back": "Рады приветствовать снова",
        "Secure Quantitative Portfolio Node": "Защищенный Квантовый Инвестиционный Портфель",
        "Institutional Grade Algorithmic Yield Platform": "Алгоритмический Робот-Конвейер Государственного Класса",
        "Allocate capital into secure automated trading nodes powered by elite quantitative models. Earn risk-adjusted yields with guaranteed threshold limits.": "Распределяйте капитал в инновационные торговые роботы под управлением опытных аналитиков. Фиксируйте прибыль без рисков.",
        "Deploy Capital": "Активировать депозит",
        "Explore Portal": "Открыть терминал",
        "Join the Wave Newsletter": "Оформите подписку на инсайды Wave",
        "Your Email Address": "Ваша действующая почта",
        "Subscribe": "Подтвердить подписку",
        "Welcome to Wave Press": "Добро пожаловать в Пресс-центр Wave",
        "Continue Reading": "Продолжить ознакомление"
      },
      HI: {
        "About Us": "हमारे बारे में",
        "How It Works": "कार्यप्रणाली",
        "Reviews": "समीक्षाएं",
        "Blog": "ब्लॉग",
        "Help": "सहायता",
        "Sign In": "लॉग इन",
        "Get Started": "शुरू करें",
        "I Understand And Agree To The Investment Terms": "मैं निवेश की सभी नियम और शर्तों को सहमत और स्वीकार करता हूँ",
        "Confirm Investment": "निवेश राशि लॉक करें",
        "Double click to confirm your capital commitment block.": "अपनी पूंजी निवेश ब्लॉक की पुष्टि के लिए दो बार क्लिक करें।",
        "Secure Neural Link Encryption Active": "सुरक्षित न्यूरल लिंक एन्क्रिप्शन सक्रिय है",
        "Capital Allocation Node": "सक्रिय नोड विन्यास प्रणाली",
        "Welcome back": "सत्र चालू है",
        "Secure Quantitative Portfolio Node": "सुरक्षित मात्रात्मक निवेश पोर्टफोलियो",
        "Institutional Grade Algorithmic Yield Platform": "संस्थागत स्तर का स्वचालित ट्रेडिंग रोबोट",
        "Allocate capital into secure automated trading nodes powered by elite quantitative models. Earn risk-adjusted yields with guaranteed threshold limits.": "अग्रणी मात्रात्मक मॉडल द्वारा संचालित स्वचालित प्रणालियों में पूंजी लगाएं। न्यूनतम जोखिम के साथ निश्चित दैनिक आय अर्जित करें।",
        "Deploy Capital": "पूंजी निवेश की शुरुआत करें",
        "Explore Portal": "कंट्रोल डेस्क खोलें",
        "Join the Wave Newsletter": "Wave समाचार पत्र की सदस्यता लें",
        "Your Email Address": "अपना ईमेल दर्ज करें",
        "Subscribe": "सदस्यता लें",
        "Welcome to Wave Press": "Wave प्रेस गैलरी में आपका स्वागत है",
        "Continue Reading": "आगे पढ़ें"
      },
      TR: {
        "About Us": "Hakkımızda",
        "How It Works": "Nasıl Çalışır",
        "Reviews": "Değerlendirmeler",
        "Blog": "Blog",
        "Help": "Destek",
        "Sign In": "Giriş Yap",
        "Get Started": "Hemen Başla",
        "I Understand And Agree To The Investment Terms": "Yatırım Protokolü Sözleşme Şartlarını Onaylıyorum",
        "Confirm Investment": "Havuz Paylaşımını Onayla",
        "Double click to confirm your capital commitment block.": "Sermaye havuz tahsisinizi onaylamak için çift tıklayınız.",
        "Secure Neural Link Encryption Active": "Kriptolama altyapısı aktif olarak çalışmaktadır",
        "Capital Allocation Node": "Sermaye Bölüştürme Sunucu Düğümü",
        "Welcome back": "Panele tekrar ulaşıldı",
        "Secure Quantitative Portfolio Node": "Güvenli Yapay Zeka Tabanlı Portföy",
        "Institutional Grade Algorithmic Yield Platform": "Kurumsal Sınıf Algoritmik Getiri Merkezi",
        "Allocate capital into secure automated trading nodes powered by elite quantitative models. Earn risk-adjusted yields with guaranteed threshold limits.": "Gelişmiş analitik sistemlerle entegre çalışan havuzlara katılın. Maksimum kar marjı ile kesintisiz faaliyete başlayın.",
        "Deploy Capital": "Likidite Sağlamaya Başla",
        "Explore Portal": "Sisteme Giriş Yap",
        "Join the Wave Newsletter": "Gelişmelerden ve Haberlerden Bilgi Alın",
        "Your Email Address": "İrtibat e-posta adresiniz",
        "Subscribe": "Hemen Kaydol",
        "Welcome to Wave Press": "Wave Yayın Odası Dünyasına Giriş",
        "Continue Reading": "Detaylı Makaleye Git"
      },
      IT: {
        "About Us": "Chi Siamo",
        "How It Works": "Come Funziona",
        "Reviews": "Recensioni",
        "Blog": "Blog",
        "Help": "Aiuto",
        "Sign In": "Accedi",
        "Get Started": "Inizia",
        "I Understand And Agree To The Investment Terms": "Comprendo e Accetto i Termini e Condizioni di Investimento",
        "Confirm Investment": "Conferma Allocazione Capitale",
        "Double click to confirm your capital commitment block.": "Doppio click per trasmettere il blocco di garanzia dell'investimento.",
        "Secure Neural Link Encryption Active": "Connessione di cifratura militare attiva",
        "Capital Allocation Node": "Nodo Principale Distribuzione Fondi",
        "Welcome back": "Esperienza avviata",
        "Secure Quantitative Portfolio Node": "Nodo Blindato ad Alto Rendimento Quantitativo",
        "Institutional Grade Algorithmic Yield Platform": "Stazione Digitale per Algoritmi ad Accumulo Fisso",
        "Allocate capital into secure automated trading nodes powered by elite quantitative models. Earn risk-adjusted yields with guaranteed threshold limits.": "Vincola quote nei nodi commerciali autogestiti. Sfrutta parametri a basso rischio di default approvati dagli esperti.",
        "Deploy Capital": "Alimentare il Portafoglio",
        "Explore Portal": "Accedi alla Stazione",
        "Join the Wave Newsletter": "Ricevi Informazioni Strategiche in Tempo Real",
        "Your Email Address": "Inserire email",
        "Subscribe": "Invia Richiesta Iscrizione",
        "Welcome to Wave Press": "Sala Stampa Wave Network",
        "Continue Reading": "DOCS"
      },
      NL: {
        "About Us": "Over Ons",
        "How It Works": "Hoe het Werkt",
        "Reviews": "Beoordelingen",
        "Blog": "Blog",
        "Help": "Help",
        "Sign In": "Inloggen",
        "Get Started": "Aan de Slag",
        "I Understand And Agree To The Investment Terms": "Ik Begrijp en Ga Akkoord met de Investeringsvoorwaarden",
        "Confirm Investment": "Investeringsorder Definitief Bevestigen",
        "Double click to confirm your capital commitment block.": "Dubbelklik om de overboeking naar de geselecteerde knoop te valideren.",
        "Secure Neural Link Encryption Active": "Inbraakvrije dataverbinding actief",
        "Capital Allocation Node": "Primaire Toewijzingstransactie",
        "Welcome back": "Fijn dat u er bent",
        "Secure Quantitative Portfolio Node": "Gegarandeerd Kwantitatief Netwerkknooppunt",
        "Institutional Grade Algorithmic Yield Platform": "Professioneel Robotgestuurd Handelsplatform",
        "Allocate capital into secure automated trading nodes powered by elite quantitative models. Earn risk-adjusted yields with guaranteed threshold limits.": "Zet vermogen uit op geautomatiseerde handelsaccounts. Ontvang stabiele opbrengsten met maximale vangnetfilters.",
        "Deploy Capital": "Investeringsfonds Voeden",
        "Explore Portal": "Open de Beheersomgeving",
        "Join the Wave Newsletter": "Op de hoogte blijven van Wave Updates",
        "Your Email Address": "E-mailadres",
        "Subscribe": "Registreren",
        "Welcome to Wave Press": "Perscentrum van Wave Network",
        "Continue Reading": "Info"
      },
      ID: {
        "About Us": "Tentang Kami",
        "How It Works": "Cara Kerja",
        "Reviews": "Testimoni",
        "Blog": "Blog",
        "Help": "Bantuan",
        "Sign In": "Masuk",
        "Get Started": "Mulai",
        "I Understand And Agree To The Investment Terms": "Saya Memahami dan Menyetujui Seluruh Ketentuan Investasi",
        "Confirm Investment": "Konfirmasi Eksekusi Kontrak",
        "Double click to confirm your capital commitment block.": "Sentuh ganda untuk melakukan komitmen penguncian saldo modal pada server.",
        "Secure Neural Link Encryption Active": "Protokol keamanan komunikasi militer tersambung",
        "Capital Allocation Node": "Node Utama Alokasi Pembagian Hasil",
        "Welcome back": "Akses dipulihkan",
        "Secure Quantitative Portfolio Node": "Daftar Portofolio Kuantitatif yang Diproteksi",
        "Institutional Grade Algorithmic Yield Platform": "Stasiun Alokasi Dana Arbitrase Multi-Pasar",
        "Allocate capital into secure automated trading nodes powered by elite quantitative models. Earn risk-adjusted yields with guaranteed threshold limits.": "Delegasikan saldo ke robot perdagangan otomatis. Dapatkan persentase yield harian yang konsisten dengan asuransi batas harian.",
        "Deploy Capital": "Aktifkan Node Saldo",
        "Explore Portal": "Dasbor Portal",
        "Join the Wave Newsletter": "Dapatkan Insight Informasi Langsung dari Server",
        "Your Email Address": "Alamat email",
        "Subscribe": "Konfirmasi Berlangganan",
        "Welcome to Wave Press": "Ruang Media Wave Network",
        "Continue Reading": "Putusan Whitepaper"
      }
    };

    if (stringMap[language] && stringMap[language][key]) {
      return stringMap[language][key];
    }

    return translations[language][key] || translations['EN'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
