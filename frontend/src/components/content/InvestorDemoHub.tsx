import React, { useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { chainsService, type ChainResponse, type ChainSampleResponse } from '../../services/chainsService';

type DemoCard = {
  key: string;
  title: { en: string; ar: string };
  subtitle: { en: string; ar: string };
  screenshotSrc: string;
  status: 'mock' | 'working';
};

export default function InvestorDemoHub() {
  const { language, isRTL } = useLanguage();

  const t = (obj: { en: string; ar: string }) => (language === 'ar' ? obj.ar : obj.en);

  const demoCards: DemoCard[] = useMemo(
    () => [
      {
        key: 'strategic-planning',
        title: { en: 'Strategic Planning Desk', ar: 'مكتب التخطيط الاستراتيجي' },
        subtitle: { en: 'UI walkthrough (mocked visuals)', ar: 'عرض بصري (نماذج)' },
        screenshotSrc: '/att/landing-screenshots/strategic-planning.png',
        status: 'mock',
      },
      {
        key: 'ontology-graph',
        title: { en: 'Ontology + Knowledge Graph', ar: 'الأنطولوجيا ورسم المعرفة' },
        subtitle: { en: 'How knowledge is connected (mocked visuals)', ar: 'كيف ترتبط المعرفة (نماذج)' },
        screenshotSrc: '/att/landing-screenshots/ontology-graph.png',
        status: 'mock',
      },
      {
        key: 'indicators',
        title: { en: 'Indicators Dashboard', ar: 'لوحة المؤشرات' },
        subtitle: { en: 'Executive view (mocked visuals)', ar: 'منظور تنفيذي (نماذج)' },
        screenshotSrc: '/att/landing-screenshots/indicators-dashboard.png',
        status: 'mock',
      },
      {
        key: 'threads',
        title: { en: 'Collaboration Threads', ar: 'سلاسل التعاون' },
        subtitle: { en: 'How decisions become tasks (mocked visuals)', ar: 'تحويل القرارات إلى مهام (نماذج)' },
        screenshotSrc: '/att/landing-screenshots/threads3.png',
        status: 'mock',
      },
      {
        key: 'welcome',
        title: { en: 'Persona Experience (Noor)', ar: 'تجربة الشخصية (نور)' },
        subtitle: { en: 'Entry experience (working UI)', ar: 'تجربة الدخول (واجهة تعمل)' },
        screenshotSrc: '/att/landing-screenshots/noor-welcome.png',
        status: 'working',
      },
      {
        key: 'architecture',
        title: { en: 'Architecture Roadmap', ar: 'خارطة الطريق المعمارية' },
        subtitle: { en: 'System view (mocked visuals)', ar: 'عرض النظام (نماذج)' },
        screenshotSrc: '/att/landing-screenshots/architecture-roadmap.png',
        status: 'mock',
      },
    ],
    []
  );

  const liveChainKey = 'risk_operate_mode';

  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [sample, setSample] = useState<ChainSampleResponse | null>(null);
  const [result, setResult] = useState<ChainResponse | null>(null);

  const containerStyle: React.CSSProperties = {
    padding: '32px 40px',
    maxWidth: '1200px',
    margin: '0 auto',
    color: 'var(--component-text-primary)',
    fontFamily: 'var(--component-font-family)',
    direction: isRTL ? 'rtl' : 'ltr',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: 800,
    marginBottom: '10px',
    color: 'var(--component-text-primary)',
  };

  const subheaderStyle: React.CSSProperties = {
    fontSize: '15px',
    lineHeight: 1.7,
    color: 'var(--component-text-secondary)',
    marginBottom: '24px',
    maxWidth: '950px',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    margin: '22px 0 12px',
    color: 'var(--component-text-primary)',
  };

  const panelStyle: React.CSSProperties = {
    background: 'var(--component-panel-bg)',
    border: '1px solid var(--component-panel-border)',
    borderRadius: '14px',
    padding: '18px',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid var(--component-panel-border)',
    background: 'var(--component-bg-secondary)',
    color: 'var(--component-text-primary)',
    cursor: 'pointer',
    fontWeight: 700,
  };

  const pillStyle = (status: DemoCard['status']): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    border: '1px solid var(--component-panel-border)',
    background: status === 'working' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.04)',
    color: status === 'working' ? 'var(--component-color-success)' : 'var(--component-text-muted)',
  });

  const handleRunLive = async () => {
    setLiveLoading(true);
    setLiveError(null);
    setSample(null);
    setResult(null);

    try {
      const s = await chainsService.getSample(liveChainKey, 15);
      setSample(s);
      if (!s.has_sample || !s.id || !s.year) {
        setLiveError(
          t({
            en: 'No working sample found in the current database for this chain. The UI is fine; the dataset might be incomplete.',
            ar: 'لم يتم العثور على مثال يعمل في قاعدة البيانات الحالية لهذه السلسلة. الواجهة تعمل لكن البيانات قد تكون غير مكتملة.',
          })
        );
        return;
      }

      const r = await chainsService.executeChain(liveChainKey, s.id, s.year);
      setResult(r);
    } catch (err: any) {
      setLiveError(err?.message || String(err));
    } finally {
      setLiveLoading(false);
    }
  };

  const intro = {
    title: { en: 'Investor Walkthrough', ar: 'عرض المستثمر' },
    subtitle: {
      en: 'We show the full system visually (screens + desks). Most modules are mock walkthroughs, and we keep exactly one feature live to prove the platform connects to the database deterministically.',
      ar: 'نعرض النظام كاملاً بشكل بصري (شاشات + مكاتب). معظم الوحدات هي عرض نماذج، ونُبقي ميزة واحدة فقط تعمل فعلياً لإثبات الاتصال بقاعدة البيانات بشكل حتمي.',
    },
    liveTitle: { en: 'Live Proof (DB-backed)', ar: 'إثبات حي (من قاعدة البيانات)' },
    liveDesc: {
      en: 'This runs a verified deterministic business chain against Neo4j. No generated Cypher; it uses a known-safe query and auto-selects a working sample ID/year.',
      ar: 'يشغّل هذا سلسلة أعمال حتمية ومحققة على Neo4j. بدون توليد Cypher؛ يستخدم استعلاماً آمناً ومعروفاً ويختار تلقائياً معرف/سنة صالحين.',
    },
    visualsTitle: { en: 'System Visual Walkthrough', ar: 'عرض بصري للنظام' },
  };

  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>{t(intro.title)}</h1>
      <p style={subheaderStyle}>{t(intro.subtitle)}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', alignItems: 'start' }}>
        <div>
          <div style={sectionTitleStyle}>{t(intro.visualsTitle)}</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '12px',
            }}
          >
            {demoCards.map((card) => (
              <a
                key={card.key}
                href={card.screenshotSrc}
                target="_blank"
                rel="noreferrer"
                style={{
                  ...panelStyle,
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
                aria-label={t(card.title)}
                title={t(card.title)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ fontWeight: 800, color: 'var(--component-text-primary)' }}>{t(card.title)}</div>
                  <span style={pillStyle(card.status)}>
                    {card.status === 'working' ? t({ en: 'WORKING', ar: 'يعمل' }) : t({ en: 'MOCK', ar: 'نموذج' })}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--component-text-secondary)' }}>{t(card.subtitle)}</div>
                <div
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid var(--component-panel-border)',
                    background: 'var(--component-bg-primary)',
                  }}
                >
                  <img
                    src={card.screenshotSrc}
                    alt={t(card.title)}
                    style={{ width: '100%', display: 'block', objectFit: 'cover' }}
                    loading="lazy"
                  />
                </div>
              </a>
            ))}
          </div>
        </div>

        <div>
          <div style={sectionTitleStyle}>{t(intro.liveTitle)}</div>
          <div style={panelStyle}>
            <div style={{ fontWeight: 800, marginBottom: '6px' }}>{t({ en: 'Verified Business Chain', ar: 'سلسلة أعمال محققة' })}</div>
            <div style={{ fontSize: '13px', color: 'var(--component-text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>{t(intro.liveDesc)}</div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: isRTL ? 'flex-start' : 'flex-start' }}>
              <button
                type="button"
                onClick={handleRunLive}
                disabled={liveLoading}
                style={{
                  ...buttonStyle,
                  background: 'var(--component-text-accent)',
                  color: 'var(--component-text-on-accent)',
                  border: '1px solid var(--component-text-accent)',
                  opacity: liveLoading ? 0.7 : 1,
                }}
              >
                {liveLoading
                  ? t({ en: 'Running…', ar: 'جارٍ التشغيل…' })
                  : t({ en: 'Run Live DB Query', ar: 'تشغيل استعلام حي' })}
              </button>
              <div style={{ fontSize: '12px', color: 'var(--component-text-muted)', alignSelf: 'center' }}>
                {t({ en: `Chain: ${liveChainKey}`, ar: `السلسلة: ${liveChainKey}` })}
              </div>
            </div>

            {liveError && (
              <div style={{ marginTop: '12px', color: 'var(--component-color-danger)', fontSize: '13px', lineHeight: 1.6 }}>{liveError}</div>
            )}

            {sample?.has_sample && (
              <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--component-text-secondary)' }}>
                <div>
                  <strong style={{ color: 'var(--component-text-primary)' }}>{t({ en: 'Auto-selected sample:', ar: 'تم اختيار مثال:' })}</strong>{' '}
                  <span style={{ color: 'var(--component-text-secondary)' }}>id={sample.id}, year={sample.year}</span>
                </div>
                {sample.summary && <div style={{ marginTop: '6px', color: 'var(--component-text-muted)' }}>{sample.summary}</div>}
              </div>
            )}

            {result && (
              <div style={{ marginTop: '14px' }}>
                <div style={{ fontWeight: 800, marginBottom: '6px' }}>{t({ en: 'Result', ar: 'النتيجة' })}</div>
                <div style={{ fontSize: '13px', color: 'var(--component-text-secondary)', marginBottom: '8px' }}>
                  {result.summary || t({ en: `Found ${result.count} path(s).`, ar: `تم العثور على ${result.count} مسار/مسارات.` })}
                </div>
                <pre
                  style={{
                    margin: 0,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid var(--component-panel-border)',
                    background: 'rgba(0,0,0,0.22)',
                    color: 'var(--component-text-primary)',
                    overflowX: 'auto',
                    fontSize: '12px',
                    lineHeight: 1.5,
                  }}
                >
                  {JSON.stringify({ count: result.count, results_preview: result.results?.slice(0, 1) ?? [] }, null, 2)}
                </pre>
                <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--component-text-muted)' }}>
                  {t({ en: 'Preview shows the first path only.', ar: 'المعاينة تعرض أول مسار فقط.' })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
