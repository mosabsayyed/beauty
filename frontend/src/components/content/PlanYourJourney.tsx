import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function PlanYourJourney() {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const containerStyle = {
    padding: '40px',
    maxWidth: '1200px', // Increased width for horizontal layout
    margin: '0 auto',
    color: 'var(--component-text-primary)',
    fontFamily: 'var(--font-sans, sans-serif)',
    direction: isAr ? 'rtl' as const : 'ltr' as const,
  };

  const headerStyle = {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    color: 'var(--component-text-primary)',
    borderBottom: '1px solid var(--component-panel-border)',
    paddingBottom: '1rem',
    textAlign: isAr ? 'right' as const : 'left' as const,
  };

  const narrativeStyle = {
    fontSize: '1rem',
    color: 'var(--component-text-secondary)',
    marginBottom: '3rem',
    lineHeight: '1.6',
    whiteSpace: 'pre-line' as const, // Preserve newlines
    background: 'var(--component-panel-bg)',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid var(--component-panel-border)',
    textAlign: isAr ? 'right' as const : 'left' as const,
  };

  const horizonsContainerStyle = {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '24px',
    marginBottom: '40px',
    position: 'relative' as const,
  };

  // Horizontal line connecting cards
  const connectorLineStyle = {
    position: 'absolute' as const,
    top: '20px', // Align with markers roughly
    left: '10%',
    right: '10%',
    height: '2px',
    background: 'var(--component-panel-border)',
    zIndex: 0,
  };

  const cardContainerStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    position: 'relative' as const,
    zIndex: 1,
  };

  const markerStyle = {
    width: '40px',
    height: '40px',
    background: 'var(--component-accent)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: '16px',
    border: '4px solid var(--component-bg-primary)', // Gap effect
  };

  const titleStyle = {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: 'var(--component-text-primary)',
    textAlign: 'center' as const,
  };

  const cardStyle = {
    background: 'var(--component-panel-bg)',
    border: '1px solid var(--component-panel-border)',
    borderRadius: '12px',
    padding: '20px',
    width: '100%',
    textAlign: 'center' as const,
    minHeight: '150px', // Uniform height
  };

  const descStyle = {
    color: 'var(--component-text-secondary)',
    fontSize: '0.95rem',
    lineHeight: '1.5',
  };

  // Visuals Section below 90 days
  const visualsSectionStyle = {
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '10px',
    width: '100%', // Match parent width
  };

  const visualBoxStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '12px',
  };
  
  const arrowDown = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  );

  const t = {
    title: isAr ? 'خطط رحلتك' : 'Plan Your Journey',
    direction: isAr ? 'اتجاه التخطيط: يبدأ من المدى المتوسط (دراسة الجدوى) ➔ عودة إلى المدى القصير' : 'Planning Direction: Starts from Mid-Term (Business Case) ➔ Back to Short-Term',
    shortTerm: isAr ? 'المدى القصير (90 يوماً)\nمكاسب سريعة' : 'Short-Term (90 Days)\nQuick Wins',
    shortTermDesc: isAr ? 'التركيز على بناء الثقة والمصداقية والتبني. التأكيد على **الأشخاص** (التدريب، التوعية، المشاركة في التصميم).' : 'Focus on building confidence, credibility, and adoption. Emphasize <strong>People</strong> (training, awareness, design involvement).',
    midTerm: isAr ? 'المدى المتوسط (سنة واحدة)\nدراسة الجدوى' : 'Mid-Term (1 Year)\nBusiness Case',
    midTermDesc: isAr ? 'تحديد دراسة الجدوى، والنتائج المتوقعة من تبني الذكاء الاصطناعي، ومجالات التبني (متوافقة مع الاستراتيجية).' : 'Define business case, expected outcomes from AI adoption, and areas to adopt (ALIGNED with strategy).',
    startHere: isAr ? 'ابدأ هنا' : 'START HERE',
    longTerm: isAr ? 'المدى الطويل (3 سنوات)\nالنضج الكامل' : 'Long-Term (3 Years)\nFull Maturity',
    longTermDesc: isAr ? 'أفق المستقبل. مؤسسة معرفية كاملة. أنظمة دعم اتخاذ القرار المستقلة.' : 'Future horizon. Full cognitive enterprise. Autonomous decision support systems.',
    what90Days: isAr ? 'كيف تبدو الـ 90 يوماً' : 'What the 90 days look like',
    planningOp: isAr ? 'التخطيط وفق عملية الأعمال السنوية' : 'Planning along the Annual Business Operation',
  };

  const narrativeTextEn = `**How to "really" plan your first 90 days**

Although the activity itself might not be wrong, yet context makes a huge difference in the mindset driving the transformation.
To explain:
- Instead of "We will try to get xyz use case up in 90 days and see if we continue or ...) 
- Try "The 90 day milestone is important but not deterministic, if we fail then we try again."

Enterprises that realize AI is the inevitable end state will think and plan along a longer timeline. At the same time, AI is shaping and forming almost on a daily basis making it difficult to lock the usual longer strategic outcomes. 
Where Enterprises probably end up at, especially for late adopters, is to plan for the first year based on use cases the AI will genuinely solve problems (pains) or bring a competitive advantage (gains).

This sets the stage for two critical and simple principles:
1- Full Commitment of Leadership. Period. 
2- AI tied to Clear Strategic Outcomes.

With AI integrated into the strategy (not a side initiative), and planned with milestones leading up towards the defined outputs, the task of defining the 90 days and what happens is not only obvious but easy to explain, justify, and promote.

So, commit for the long term, plan for the mid term and act tomorrow...`;

  const narrativeTextAr = `**كيف تخطط "فعلياً" لأول 90 يوماً**

على الرغم من أن النشاط بحد ذاته قد لا يكون خاطئاً، إلا أن السياق يحدث فرقاً كبيراً في العقلية التي تقود التحول.
للشرح:
- بدلاً من "سنحاول تشغيل حالة الاستخدام س ص ع في 90 يوماً ونرى ما إذا كنا سنستمر أو..."
- جرب "معلم الـ 90 يوماً مهم ولكنه ليس حتمياً، إذا فشلنا، سنحاول مرة أخرى."

المؤسسات التي تدرك أن الذكاء الاصطناعي هو الحالة النهائية الحتمية ستفكر وتخطط وفق جدول زمني أطول. في الوقت نفسه، يتشكل الذكاء الاصطناعي ويتكون بشكل يومي تقريباً مما يجعل من الصعب تحديد النتائج الاستراتيجية الأطول المعتادة.
حيث ينتهي الأمر بالمؤسسات على الأرجح، خاصة للمتبنين المتأخرين، هو التخطيط للسنة الأولى بناءً على حالات الاستخدام حيث سيحل الذكاء الاصطناعي المشاكل (الآلام) بصدق أو يجلب ميزة تنافسية (مكاسب).

هذا يمهد الطريق لمبدأين حاسمين وبسيطين:
1- التزام كامل من القيادة. نقطة.
2- ربط الذكاء الاصطناعي بنتائج استراتيجية واضحة.

مع دمج الذكاء الاصطناعي في الاستراتيجية (ليس كمبادرة جانبية)، والتخطيط بمعالم تؤدي إلى المخرجات المحددة، فإن مهمة تحديد الـ 90 يوماً وما يحدث ليست واضحة فحسب، بل سهلة الشرح والتبرير والترويج.

لذا، التزم للمدى الطويل، وخطط للمدى المتوسط، وتصرف غداً...`;

  const narrativeText = isAr ? narrativeTextAr : narrativeTextEn;

  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>{t.title}</h1>
      
      {/* Narrative Section */}
      <div style={narrativeStyle}>
         {narrativeText.split('\n').map((line, i) => (
             <React.Fragment key={i}>
                 {line.startsWith('**') ? <strong style={{ display:'block', marginBottom:'12px', fontSize:'1.1rem' }}>{line.replace(/\*\*/g, '')}</strong> : line}
                 {'\n'}
             </React.Fragment>
         ))}
      </div>

      <div style={{ position: 'relative', marginBottom: '60px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--component-text-accent)' }}>
              <em>{t.direction}</em>
          </div>
      </div>

      <div style={horizonsContainerStyle}>
        <div style={connectorLineStyle}></div>
        
        {/* Short-Term (90 Days) */}
        <div style={cardContainerStyle}>
          <div style={markerStyle}>1</div>
          <h2 style={titleStyle} dangerouslySetInnerHTML={{ __html: t.shortTerm.replace('\n', '<br/>') }}></h2>
          <div style={cardStyle}>
            <p style={descStyle} dangerouslySetInnerHTML={{ __html: t.shortTermDesc }}></p>
          </div>
          
          {/* Visual Link Flow */}
          <div style={visualsSectionStyle}>
             <div style={{ color: 'var(--component-text-muted)' }}>{arrowDown}</div>
             <div style={visualBoxStyle}>
                 <img src="/att/inside_90days.svg" alt="What the 90 days look like" style={{ width: '100%', maxWidth: '200px', border: '1px solid var(--component-panel-border)', borderRadius: '8px' }} />
                 <span style={{ fontSize: '12px', color: 'var(--component-text-muted)' }}>{t.what90Days}</span>
             </div>
             <div style={{ color: 'var(--component-text-muted)' }}>{arrowDown}</div>
             <div style={visualBoxStyle}>
                 <img src="/att/use_case_lib.svg" alt="Use Case Library" style={{ width: '100%', maxWidth: '200px', border: '1px solid var(--component-panel-border)', borderRadius: '8px' }} />
                 <span style={{ fontSize: '12px', color: 'var(--component-text-muted)', textAlign: 'center' }}>{t.planningOp}</span>
             </div>
          </div>
        </div>

        {/* Mid-Term (1 Year) - ANCHOR */}
        <div style={cardContainerStyle}>
          <div style={{ ...markerStyle, background: '#10B981', transform: 'scale(1.2)' }}>2</div> {/* Highlight Marker */}
          <h2 style={{ ...titleStyle, color: '#10B981' }} dangerouslySetInnerHTML={{ __html: t.midTerm.replace('\n', '<br/>') }}></h2>
          <div style={{ ...cardStyle, border: '2px solid #10B981' }}> {/* Highlight Card */}
            <p style={descStyle}>{t.midTermDesc}</p>
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#10B981', fontWeight: 'bold' }}>{t.startHere}</div>
        </div>

        {/* Long-Term (3 Years) */}
        <div style={cardContainerStyle}>
          <div style={markerStyle}>3</div>
          <h2 style={titleStyle} dangerouslySetInnerHTML={{ __html: t.longTerm.replace('\n', '<br/>') }}></h2>
          <div style={cardStyle}>
            <p style={descStyle}>{t.longTermDesc}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
