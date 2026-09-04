import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  FileCheck2,
  Fingerprint,
  Globe2,
  HeartHandshake,
  Languages,
  LockKeyhole,
  MapPin,
  Network,
  Route,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  approveProposal,
  commitApprovedProposal,
  createProposal,
  scanProviderContent,
} from './domain/engine'
import { createInitialState } from './domain/state'
import type {
  AppState,
  AuditEvent,
  CommitReceipt,
  HouseholdProfile,
  ProfileField,
  Proposal,
} from './domain/types'
import { registerWebMcpTools, type WebMcpStatus } from './webmcp/register'

type Locale = 'en' | 'ar'
type PlanningConstraints = Partial<
  Pick<
    HouseholdProfile,
    'adults' | 'children' | 'monthlyIncome' | 'postalArea' | 'mobilityNeeds' | 'languages'
  >
>

const copy = {
  en: {
    eyebrow: 'A life-event workspace with privacy boundaries',
    title: 'Tell your story once. Keep every decision.',
    intro:
      'Your agent turns one urgent life event into a coordinated plan across four provider simulations—not four repeated intakes—while you control every field and final action.',
    collaboration:
      'Agent path: structured WebMCP tools. Human path: the same visible controls.',
    principles: ['Ask once', 'Reveal less', 'Compare openly', 'Approve exactly'],
    principlesLabel: 'Project principles',
    build: 'Build my plan',
    review: 'Review disclosures',
    approve: 'Approve selected applications',
    reject: 'Reject and clear plan',
    commit: 'Commit approved plan',
    staged: 'Applications are staged',
    stagedBody: 'Nothing has been sent. Review the exact data each provider requested.',
    committed: 'Applications committed',
    committedBody: 'Single-use approval consumed. Receipts are now available.',
    language: 'العربية',
    capsule: 'Private intent capsule',
    local: 'Held in this browser',
    agentScope:
      'Your chosen agent can read planning constraints. Providers receive only approved fields.',
    deadline: 'Within 72 hours',
    network: 'Service network simulation',
    networkBody: 'Four fictional provider simulations. One coordinated plan.',
    journey: 'Your coordinated week',
    disclosures: 'Minimum disclosure review',
    blocked: 'Blocked',
    approved: 'Purpose verified',
    audit: 'Visible action trail',
    humanGate: 'Human authority gate',
    humanGateBody: 'Agents can prepare. Only you can approve.',
    synthetic: 'Synthetic demo data · no real applications',
    footer:
      'Working WebMCP demonstration. Fictional provider simulations. Deterministic decisions. Human authority.',
    outcomeKicker: '02 / COORDINATED OUTCOME',
    privacyLabel: 'PRIVACY / PURPOSE BOUND',
    auditLabel: 'LIVE / EXPLAINABLE',
    networkKicker: '02 / OPEN SERVICE WEB',
    providersLabel: 'Fictional service providers',
    conflictBody: 'The 09:00 shelter slot was moved around an existing commitment.',
    gateOpen: 'OPEN',
    gateLocked: 'LOCKED',
    localBadge: 'LOCAL',
    intentLabel: 'INTENT / 72H',
    webMcpTools: 'tools',
    previewMode: 'preview mode',
    registering: 'registering',
    protocolError: 'connection error',
    proofLabel: 'Coordination proof',
    storyMetric: 'Story told once',
    servicesMetric: 'Services staged',
    servicesCommittedMetric: 'Services committed',
    conflictsMetric: 'Conflicts avoided',
    overreachMetric: 'Overreach blocked',
    earlySendMetric: 'Sent before approval',
  },
  ar: {
    eyebrow: 'مساحة لتنسيق أحداث الحياة بحدود خصوصية واضحة',
    title: 'احكِ قصتك مرة واحدة. واحتفظ بكل قرار.',
    intro:
      'يحوّل وكيلك حدثًا طارئًا واحدًا إلى خطة منسقة عبر أربع محاكيات لجهات الخدمة—بدل أربعة نماذج متكررة—مع بقاء كل حقل وقرار نهائي تحت سيطرتك.',
    collaboration:
      'مسار الوكيل: أدوات WebMCP منظمة. مسار الإنسان: عناصر التحكم المرئية نفسها.',
    principles: ['اسأل مرة واحدة', 'اكشف أقل قدر', 'قارن بشفافية', 'وافق بدقة'],
    principlesLabel: 'مبادئ المشروع',
    build: 'أنشئ خطتي',
    review: 'راجع مشاركة البيانات',
    approve: 'وافق على الطلبات المختارة',
    reject: 'ارفض الخطة وامسحها',
    commit: 'نفّذ الخطة المعتمدة',
    staged: 'طلبات جاهزة للمراجعة',
    stagedBody: 'لم يُرسل شيء. راجع بالضبط ما طلبته كل جهة.',
    committed: 'تم تنفيذ الطلبات',
    committedBody: 'استُهلكت الموافقة أحادية الاستخدام وأصبحت الإيصالات جاهزة.',
    language: 'English',
    capsule: 'كبسولة النية الخاصة',
    local: 'محفوظة داخل هذا المتصفح',
    agentScope:
      'يمكن لوكيلك المختار قراءة قيود التخطيط، ولا تستلم الجهات إلا الحقول التي وافقت عليها.',
    deadline: 'خلال 72 ساعة',
    network: 'محاكاة شبكة الخدمات',
    networkBody: 'أربع محاكيات لجهات خيالية. خطة واحدة منسقة.',
    journey: 'أسبوعك المنسق',
    disclosures: 'مراجعة الحد الأدنى من البيانات',
    blocked: 'محظور',
    approved: 'الغرض موثّق',
    audit: 'سجل إجراءات مرئي',
    humanGate: 'بوابة القرار البشري',
    humanGateBody: 'يمكن للوكيل التجهيز، وأنت وحدك توافق.',
    synthetic: 'بيانات تجريبية خيالية · لا توجد طلبات حقيقية',
    footer:
      'تجربة WebMCP عاملة. محاكيات جهات خيالية. قرارات حتمية. السلطة للإنسان.',
    outcomeKicker: '02 / النتيجة المنسقة',
    privacyLabel: 'الخصوصية / مرتبطة بالغرض',
    auditLabel: 'مباشر / قابل للتفسير',
    networkKicker: '02 / شبكة خدمات مفتوحة',
    providersLabel: 'جهات خدمة خيالية',
    conflictBody: 'نُقل موعد السكن 09:00 لعدم تعارضه مع التزام موجود.',
    gateOpen: 'مفتوح',
    gateLocked: 'مغلق',
    localBadge: 'محلي',
    intentLabel: 'النية / 72 ساعة',
    webMcpTools: 'أدوات',
    previewMode: 'وضع المعاينة',
    registering: 'جارٍ التسجيل',
    protocolError: 'خطأ في الاتصال',
    proofLabel: 'دليل التنسيق',
    storyMetric: 'قصة رُويت مرة واحدة',
    servicesMetric: 'خدمات جاهزة',
    servicesCommittedMetric: 'خدمات منفّذة',
    conflictsMetric: 'تعارضات تم تجنبها',
    overreachMetric: 'طلب زائد محظور',
    earlySendMetric: 'لم يُرسل قبل الموافقة',
  },
} as const

const categoryIcons = {
  shelter: HeartHandshake,
  food: Sparkles,
  health: ShieldCheck,
  transport: Route,
}

const categoryNames = {
  shelter: { en: 'shelter', ar: 'سكن' },
  food: { en: 'food', ar: 'غذاء' },
  health: { en: 'health', ar: 'صحة' },
  transport: { en: 'transport', ar: 'نقل' },
} as const

const programArabic: Record<string, { title: string; summary: string }> = {
  'haven-72': {
    title: 'غرفة عائلية لمدة 72 ساعة',
    summary: 'غرفة خاصة ومهيأة للحركة ريثما تُرتب خطة سكن أطول.',
  },
  'pantry-week': {
    title: 'طرد بقالة لسبعة أيام',
    summary: 'طرد غذائي مرن ثقافيًا ومناسب لحجم الأسرة.',
  },
  'clinic-access': {
    title: 'فحص صحي للأسرة',
    summary: 'استقبال متعدد اللغات مع غرفة استشارة مهيأة للحركة.',
  },
  'route-pass': {
    title: 'تصريح لخمس رحلات',
    summary: 'نقل من الباب إلى الباب للمواعيد المؤكدة لخدمات الدعم.',
  },
}

const phaseNames: Record<AppState['phase'], { en: string; ar: string }> = {
  idle: { en: 'IDLE', ar: 'جاهز' },
  planned: { en: 'PLANNED', ar: 'مُجهّز' },
  reviewing: { en: 'REVIEWING', ar: 'قيد المراجعة' },
  approved: { en: 'APPROVED', ar: 'مُعتمد' },
  committed: { en: 'COMMITTED', ar: 'مُنفّذ' },
}

const actorNames: Record<AuditEvent['actor'], { en: string; ar: string }> = {
  agent: { en: 'AGENT', ar: 'الوكيل' },
  human: { en: 'HUMAN', ar: 'الإنسان' },
  system: { en: 'SYSTEM', ar: 'النظام' },
}

const auditActionNames: Record<string, string> = {
  'Capsule ready': 'الكبسولة جاهزة',
  'Planning constraints updated': 'تم تحديث قيود التخطيط',
  'Plan staged': 'تم تجهيز الخطة',
  'Overreach blocked': 'تم منع طلب زائد',
  'Provider instruction quarantined': 'تم عزل تعليمات الجهة',
  'Review opened': 'بدأت المراجعة',
  'Exact proposal approved': 'تمت الموافقة على المقترح المحدد',
  'Plan rejected': 'رُفضت الخطة',
  'Applications committed': 'تم تنفيذ الطلبات',
}

function displayProgram(
  program: { id: string; title: string; summary: string },
  locale: Locale,
): { title: string; summary: string } {
  if (locale === 'ar' && programArabic[program.id]) return programArabic[program.id]
  return { title: program.title, summary: program.summary }
}

function displaySlot(slot: string, locale: Locale): string {
  if (locale === 'en') return slot
  return slot
    .replace(/^Mon/, 'الاثنين')
    .replace(/^Tue/, 'الثلاثاء')
    .replace(/^Wed/, 'الأربعاء')
}

function displayConflictCount(count: number, locale: Locale): string {
  if (locale === 'en') return `${count} ${count === 1 ? 'conflict' : 'conflicts'} avoided`
  if (count === 0) return 'لم توجد تعارضات'
  if (count === 1) return 'تم تجنب تعارض واحد'
  if (count === 2) return 'تم تجنب تعارضين'
  return `تم تجنب ${count} تعارضات`
}

function displayAudit(item: AuditEvent, locale: Locale): { action: string; detail: string } {
  if (locale === 'en') return { action: item.action, detail: item.detail }

  const numbers = item.detail.match(/\d+/g) ?? []
  const fingerprint = item.detail.match(/fp_[a-f0-9]+/)?.[0]
  const provider = item.detail.match(/^(.+?) returned instruction-like content/)?.[1]
  const details: Record<string, string> = {
    'Capsule ready': 'بيانات الأسرة الخيالية محفوظة محليًا في هذا المتصفح.',
    'Planning constraints updated': `تغيّر ${numbers[0] ?? 'بعض'} من حقول التخطيط الموافق عليها، وبقيت الحقول الحساسة محجوبة.`,
    'Plan staged': `جُهزت ${numbers[0] ?? '4'} طلبات، وتُجنب ${numbers[1] ?? '2'} من تعارضات المواعيد.`,
    'Overreach blocked': 'طلبت Common Table رقم الهوية دون غرض معلن.',
    'Provider instruction quarantined': `أعادت ${provider ?? 'إحدى الجهات'} محتوى يشبه التعليمات، فحُجب عن الوكيل.`,
    'Review opened': 'يراجع الشخص كل حقل قبل الموافقة.',
    'Exact proposal approved': `الموافقة مرتبطة بـ ${fingerprint ?? 'بصمة المقترح'} وتنتهي خلال خمس دقائق.`,
    'Plan rejected': 'رفض الشخص المقترح المجهز ومسحه.',
    'Applications committed': `صدرت ${numbers[0] ?? '4'} إيصالات واستُهلك رمز الموافقة.`,
  }

  return {
    action: auditActionNames[item.action] ?? item.action,
    detail: details[item.action] ?? item.detail,
  }
}

const fieldNames: Record<string, { en: string; ar: string }> = {
  adults: { en: 'Adults', ar: 'البالغون' },
  children: { en: 'Children', ar: 'الأطفال' },
  monthlyIncome: { en: 'Monthly income', ar: 'الدخل الشهري' },
  postalArea: { en: 'Postal area', ar: 'المنطقة' },
  mobilityNeeds: { en: 'Mobility needs', ar: 'احتياجات الحركة' },
  languages: { en: 'Languages', ar: 'اللغات' },
  governmentId: { en: 'Government ID', ar: 'رقم الهوية' },
  healthNotes: { en: 'Health notes', ar: 'ملاحظات صحية' },
}

const purposeNames: Record<string, { en: string; ar: string }> = {
  'Room capacity': { en: 'Room capacity', ar: 'سعة الغرفة' },
  'Family placement': { en: 'Family placement', ar: 'تسكين الأسرة' },
  'Program eligibility': { en: 'Program eligibility', ar: 'أهلية البرنامج' },
  'Parcel size': { en: 'Parcel size', ar: 'حجم السلة' },
  'Collection point assignment': { en: 'Collection point assignment', ar: 'تحديد نقطة الاستلام' },
  'Appointment duration': { en: 'Appointment duration', ar: 'مدة الموعد' },
  'Pediatric staffing': { en: 'Pediatric staffing', ar: 'تجهيز طاقم الأطفال' },
  'Accessible room allocation': { en: 'Accessible room allocation', ar: 'تخصيص غرفة مهيأة' },
  'Interpreter allocation': { en: 'Interpreter allocation', ar: 'توفير مترجم' },
  'Route planning': { en: 'Route planning', ar: 'تخطيط المسار' },
  'Vehicle accessibility': { en: 'Vehicle accessibility', ar: 'تهيئة المركبة' },
}

function displayFieldValue(profile: HouseholdProfile, field: ProfileField, locale: Locale): string {
  const value = profile[field]
  if (field === 'monthlyIncome' && typeof value === 'number') {
    return `$${new Intl.NumberFormat('en-US').format(value)}`
  }
  if (field === 'mobilityNeeds') {
    return value ? (locale === 'ar' ? 'تهيئة للحركة' : 'Step-free') : (locale === 'ar' ? 'لا يوجد' : 'None')
  }
  if (field === 'postalArea' && locale === 'ar' && value === 'North Quarter') return 'الحي الشمالي'
  if (Array.isArray(value)) {
    if (locale === 'ar') {
      return value.map((item) => ({ Arabic: 'العربية', English: 'الإنجليزية' })[item] ?? item).join('، ')
    }
    return value.join(', ')
  }
  return String(value)
}

function event(
  action: string,
  detail: string,
  actor: AuditEvent['actor'] = 'human',
  tone: AuditEvent['tone'] = 'neutral',
): AuditEvent {
  return {
    id: `${action}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    at: Date.now(),
    actor,
    action,
    detail,
    tone,
  }
}

function App() {
  const [locale, setLocale] = useState<Locale>('en')
  const [state, setState] = useState<AppState>(() => createInitialState())
  const [webMcp, setWebMcp] = useState<{ status: WebMcpStatus; count: number }>({
    status: 'registering',
    count: 0,
  })
  const stateRef = useRef(state)
  const t = copy[locale]

  useEffect(() => {
    stateRef.current = state
  }, [state])

  const buildPlan = useCallback((incoming?: Proposal) => {
    setState((current) => {
      const proposal = incoming ?? createProposal(current.profile, current.programs)
      const quarantinedProviders = current.programs.filter(
        (program) => !scanProviderContent(program.providerNotice).safe,
      )
      return {
        ...current,
        phase: 'planned',
        proposal,
        approval: null,
        receipts: [],
        audit: [
          ...current.audit,
          event(
            'Plan staged',
            `${proposal.applications.length} applications prepared; ${proposal.plan.avoidedConflicts} schedule conflicts avoided.`,
            'agent',
            'safe',
          ),
          event(
            'Overreach blocked',
            'Common Table requested Government ID without a declared purpose.',
            'system',
            'warning',
          ),
          ...quarantinedProviders.map((program) =>
            event(
              'Provider instruction quarantined',
              `${program.provider} returned instruction-like content; it was withheld from the agent.`,
              'system',
              'warning',
            ),
          ),
        ],
      }
    })
  }, [])

  const updatePlanningConstraints = useCallback((incoming: PlanningConstraints) => {
    setState((current) => ({
      ...current,
      phase: 'idle',
      profile: { ...current.profile, ...incoming },
      proposal: null,
      approval: null,
      receipts: [],
      audit: [
        ...current.audit,
        event(
          'Planning constraints updated',
          `${Object.keys(incoming).length} approved planning fields changed; sensitive fields remained withheld.`,
          'agent',
          'safe',
        ),
      ],
    }))
  }, [])

  const reviewDisclosures = useCallback(() => {
    setState((current) => ({
      ...current,
      phase: 'reviewing',
      audit: [
        ...current.audit,
        event('Review opened', 'The person is reviewing every field before approval.'),
      ],
    }))
  }, [])

  const approve = useCallback(() => {
    setState((current) => {
      if (!current.proposal) return current
      return {
        ...current,
        phase: 'approved',
        approval: approveProposal(current.proposal),
        audit: [
          ...current.audit,
          event(
            'Exact proposal approved',
            `Approval is bound to ${current.proposal.fingerprint} and expires in five minutes.`,
            'human',
            'safe',
          ),
        ],
      }
    })
  }, [])

  const reject = useCallback(() => {
    setState((current) => ({
      ...current,
      phase: 'idle',
      proposal: null,
      approval: null,
      receipts: [],
      audit: [
        ...current.audit,
        event('Plan rejected', 'The person rejected and cleared the staged proposal.'),
      ],
    }))
  }, [])

  const commit = useCallback(
    (incoming?: { receipts: CommitReceipt[]; approval: AppState['approval'] }) => {
      setState((current) => {
        if (!current.proposal || !current.approval) return current
        const result = incoming ?? commitApprovedProposal(current.proposal, current.approval)
        if (!result.approval) return current
        return {
          ...current,
          phase: 'committed',
          receipts: result.receipts,
          approval: result.approval,
          audit: [
            ...current.audit,
            event(
              'Applications committed',
              `${result.receipts.length} receipts issued; approval token consumed.`,
              'agent',
              'safe',
            ),
          ],
        }
      })
    },
    [],
  )

  const toolDispatch = useCallback(
    (action: string, payload?: unknown) => {
      if (action === 'update-profile') updatePlanningConstraints(payload as PlanningConstraints)
      if (action === 'plan') buildPlan(payload as Proposal)
      if (action === 'review') reviewDisclosures()
      if (action === 'commit')
        commit(payload as { receipts: CommitReceipt[]; approval: AppState['approval'] })
    },
    [buildPlan, commit, reviewDisclosures, updatePlanningConstraints],
  )

  useEffect(() => {
    return registerWebMcpTools(
      () => stateRef.current,
      toolDispatch,
      (status, count) => setWebMcp({ status, count }),
    )
  }, [state.phase, toolDispatch])

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
  }, [locale])

  const proposal = state.proposal
  const blockedFieldCount =
    proposal?.applications.reduce(
      (total, application) => total + application.disclosure.blockedFields.length,
      0,
    ) ?? 0
  const householdSize = state.profile.adults + state.profile.children
  const capsuleNeed =
    locale === 'ar'
      ? `أسبوع آمن لأسرة من ${householdSize} أفراد`
      : `A safe week for a household of ${householdSize}`

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label={locale === 'ar' ? 'الصفحة الرئيسية ONCE' : 'ONCE home'}>
          ONCE
        </a>
        <div className="topbar-actions">
          <div className={`protocol-status status-${webMcp.status}`} role="status">
            <span className="status-pulse" />
            {webMcp.status === 'ready'
              ? `WebMCP · ${webMcp.count} ${t.webMcpTools}`
              : webMcp.status === 'unavailable'
                ? `WebMCP · ${t.previewMode}`
                : `WebMCP · ${webMcp.status === 'error' ? t.protocolError : t.registering}`}
          </div>
          <button
            className="language-button"
            type="button"
            onClick={() => setLocale((current) => (current === 'en' ? 'ar' : 'en'))}
          >
            <Languages size={16} />
            {t.language}
          </button>
        </div>
      </header>

      <main id="top">
        {proposal && (
          <section className="outcome-proof" aria-label={t.proofLabel} aria-live="polite">
            <div className="outcome-metric metric-story">
              <strong>1</strong>
              <span>{t.storyMetric}</span>
            </div>
            <div className="outcome-metric">
              <strong>{proposal.applications.length}</strong>
              <span>
                {state.phase === 'committed' ? t.servicesCommittedMetric : t.servicesMetric}
              </span>
            </div>
            <div className="outcome-metric">
              <strong>{proposal.plan.avoidedConflicts}</strong>
              <span>{t.conflictsMetric}</span>
            </div>
            <div className="outcome-metric metric-warning">
              <strong>{blockedFieldCount}</strong>
              <span>{t.overreachMetric}</span>
            </div>
            <div className="outcome-metric metric-zero">
              <strong>0</strong>
              <span>{t.earlySendMetric}</span>
            </div>
          </section>
        )}
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow">
              <span>01</span>
              {t.eyebrow}
            </div>
            <h1 id="hero-title">{t.title}</h1>
            <p className="hero-intro">{t.intro}</p>
            <p className="collaboration-note">
              <Network size={16} aria-hidden="true" />
              {t.collaboration}
            </p>

            <div className="hero-actions">
              {state.phase === 'idle' && (
                <button className="primary-action" type="button" onClick={() => buildPlan()}>
                  {t.build}
                  <ArrowRight aria-hidden="true" />
                </button>
              )}
              {state.phase === 'planned' && (
                <button className="primary-action" type="button" onClick={reviewDisclosures}>
                  {t.review}
                  <ScanSearch aria-hidden="true" />
                </button>
              )}
              {state.phase === 'reviewing' && (
                <>
                  <button className="primary-action" type="button" onClick={approve}>
                    {t.approve}
                    <UserRoundCheck aria-hidden="true" />
                  </button>
                  <button className="secondary-action" type="button" onClick={reject}>
                    {t.reject}
                  </button>
                </>
              )}
              {state.phase === 'approved' && (
                <button className="primary-action" type="button" onClick={() => commit()}>
                  {t.commit}
                  <FileCheck2 aria-hidden="true" />
                </button>
              )}
              <p className="synthetic-note">
                <CircleAlert size={15} /> {t.synthetic}
              </p>
            </div>
          </div>

          <div className="capsule-wrap" aria-label={t.capsule}>
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <article className="capsule-card">
              <div className="capsule-topline">
                <div>
                  <span className="micro-label">{t.intentLabel}</span>
                  <h2>{t.capsule}</h2>
                </div>
                <Fingerprint size={34} strokeWidth={1.4} />
              </div>
              <p className="capsule-need">“{capsuleNeed}”</p>
              <div className="capsule-facts">
                <span><HeartHandshake size={15} /> {state.profile.adults} + {state.profile.children}</span>
                <span><MapPin size={15} /> {displayFieldValue(state.profile, 'postalArea', locale)}</span>
                <span><CalendarDays size={15} /> {t.deadline}</span>
              </div>
              <div className="privacy-seal">
                <LockKeyhole size={16} />
                <span>{t.local}</span>
                <strong>{t.localBadge}</strong>
              </div>
              <p className="capsule-scope">{t.agentScope}</p>
            </article>
          </div>
        </section>

        <section className="principle-strip" aria-label={t.principlesLabel}>
          {t.principles.map((principle, index) => (
            <div key={principle}><strong>0{index + 1}</strong><span>{principle}</span></div>
          ))}
        </section>

        {state.phase !== 'idle' ? (
          <section className="workspace" aria-live="polite">
            <div className="workspace-heading">
              <div>
                <span className="section-kicker">{t.outcomeKicker}</span>
                <h2>{state.phase === 'committed' ? t.committed : t.staged}</h2>
                <p>{state.phase === 'committed' ? t.committedBody : t.stagedBody}</p>
              </div>
              <div className={`phase-stamp phase-${state.phase}`}>
                {state.phase === 'committed' ? <BadgeCheck /> : <ShieldCheck />}
                {phaseNames[state.phase][locale]}
              </div>
            </div>

            <div className="workspace-grid">
              <div className="plan-panel paper-panel">
                <div className="panel-title">
                  <div>
                    <span className="micro-label">
                      {locale === 'ar'
                        ? `الخطة / ${proposal?.applications.length ?? 0} محطات`
                        : `PLAN / ${String(proposal?.applications.length ?? 0).padStart(2, '0')} STOPS`}
                    </span>
                    <h3>{t.journey}</h3>
                  </div>
                  <Route />
                </div>
                <ol className="timeline">
                  {proposal?.applications.map((application, index) => {
                    const Icon = categoryIcons[application.category]
                    return (
                      <li key={application.programId}>
                        <div className="timeline-marker" style={{ '--accent': state.programs[index].accent } as CSSProperties}>
                          <Icon size={17} />
                        </div>
                        <div className="timeline-copy">
                          <span>{displaySlot(application.slotLabel, locale)}</span>
                          <strong>{displayProgram({ id: application.programId, title: application.title, summary: '' }, locale).title}</strong>
                          <small>{application.provider}</small>
                        </div>
                        {state.phase === 'committed' ? <Check className="row-check" /> : <ChevronRight className="row-arrow" />}
                      </li>
                    )
                  })}
                </ol>
                <div className="conflict-note">
                  <CalendarDays size={18} />
                  <div>
                    <strong>{displayConflictCount(proposal?.plan.avoidedConflicts ?? 0, locale)}</strong>
                    <span>{t.conflictBody}</span>
                  </div>
                </div>
              </div>

              <div className="trust-panel paper-panel">
                <div className="panel-title">
                  <div>
                    <span className="micro-label">{t.privacyLabel}</span>
                    <h3>{t.disclosures}</h3>
                  </div>
                  <LockKeyhole />
                </div>

                <div className="disclosure-list">
                  {proposal?.applications.map((application) => {
                    const program = state.programs.find((item) => item.id === application.programId)!
                    return (
                    <article className="disclosure-row" key={application.programId}>
                      <div className="provider-monogram">{application.provider.slice(0, 2).toUpperCase()}</div>
                      <div className="disclosure-copy">
                        <strong>{application.provider}</strong>
                        <div className="field-chips">
                          {application.disclosure.approvedFields.map((field) => (
                            <span className="field-approved" key={field}>
                              <Check size={12} />
                              <span className="field-detail">
                                <b>{fieldNames[field][locale]}</b>
                                <em>{displayFieldValue(state.profile, field, locale)}</em>
                                <small>{purposeNames[program.fieldPurposes[field]!]?.[locale] ?? program.fieldPurposes[field]}</small>
                              </span>
                            </span>
                          ))}
                          {application.disclosure.blockedFields.map(({ field }) => (
                            <span className="field-blocked" key={field}>
                              <LockKeyhole size={12} />
                              <span className="field-detail">
                                <b>{fieldNames[field][locale]} · {t.blocked}</b>
                                <em>{locale === 'ar' ? 'لم تتم المشاركة' : 'Not shared'}</em>
                                <small>{locale === 'ar' ? 'لا يوجد غرض معلن' : 'No declared purpose'}</small>
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </article>
                  )})}
                </div>

                <div className="human-gate">
                  <UserRoundCheck size={22} />
                  <div>
                    <strong>{t.humanGate}</strong>
                    <span>{t.humanGateBody}</span>
                  </div>
                  <span className="gate-state">
                    {state.phase === 'approved' || state.phase === 'committed' ? t.gateOpen : t.gateLocked}
                  </span>
                </div>
              </div>

              <aside className="audit-panel">
                <div className="panel-title inverse">
                  <div>
                    <span className="micro-label">{t.auditLabel}</span>
                    <h3>{t.audit}</h3>
                  </div>
                  <Network />
                </div>
                <div className="audit-events">
                  {state.audit.slice().reverse().map((item) => {
                    const localized = displayAudit(item, locale)
                    return (
                      <article className={`audit-event tone-${item.tone}`} key={item.id}>
                        <span className="audit-dot" />
                        <div>
                          <small>{actorNames[item.actor][locale]}</small>
                          <strong>{localized.action}</strong>
                          <p>{localized.detail}</p>
                        </div>
                      </article>
                    )
                  })}
                </div>
                {state.receipts.length > 0 && (
                  <div className="receipt-stack">
                    {state.receipts.map((receipt) => (
                      <span key={receipt.id}>
                        <FileCheck2 size={14} /> {receipt.id}
                      </span>
                    ))}
                  </div>
                )}
              </aside>
            </div>
          </section>
        ) : (
          <section className="network-preview">
            <div className="network-copy">
              <span className="section-kicker">{t.networkKicker}</span>
              <h2>{t.network}</h2>
              <p>{t.networkBody}</p>
            </div>
            <div className="provider-track" aria-label={t.providersLabel}>
              {state.programs.map((program, index) => {
                const Icon = categoryIcons[program.category]
                const localized = displayProgram(program, locale)
                return (
                  <article className="provider-card" key={program.id} style={{ '--accent': program.accent } as CSSProperties}>
                    <div className="provider-index">0{index + 1}</div>
                    <Icon />
                    <span>{categoryNames[program.category][locale]}</span>
                    <strong>{program.provider}</strong>
                    <p>{localized.summary}</p>
                  </article>
                )
              })}
            </div>
          </section>
        )}
      </main>

      <footer>
        <div className="wordmark compact">ONCE</div>
        <p>{t.footer}</p>
        <div><Globe2 size={15} /> EN / AR</div>
      </footer>
    </div>
  )
}

export default App
