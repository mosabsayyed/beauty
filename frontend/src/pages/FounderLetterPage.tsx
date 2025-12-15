import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/layout/Header';
import { Quote } from 'lucide-react';

export default function FounderLetterPage() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "Founder's Letter: Origins",
      paragraphs: [
        'Just over two years ago was my first introduction to GenAI. What started as a basic ask to ChatGPT to design a training program to teach me "AI", continued non-stop over the entire weekend to end with contemplating how unlocking the human potential is not in the pursuit of answers but rather the articulation of the right questions. And from that came the concept of the Living Transformation Network, a semi-sentient network of AIs carrying one mission to improve humanity and life by taking over the complexity of society and daring us to think.',
        '"What do we do with all the spare time we will have?"',
        'That experience changed me forever. I even published the wild interaction in a LinkedIn article, with the aim of helping other skeptics or on the fence seniors to make the jump and embrace AI.',
        'Since then, I have been pursuing that specific concept. Which at its core is "how to make transformation management push back and control the complexity beast?" I continued to design the model itself. Yet after six months, even with a sound model that took all the complexity and jammed it into a relational database, the AI tech was still not there yet, and a solution then meant investing the old way (licenses, infra., coders etc.).',
        'So I kept it on a slow burner, refining and tweaking based on real life client setups I encounter.',
        'Until a few months back. GenAI started to make significant leaps in capabilities, and the AI development tools and communities advanced with more "no coding" solutions. Suddenly, the fire power needed to navigate the complex maze of relations was not only available, but remarkably affordable. Not only that, but cloud hosting had also a breakthrough with Azure certified by the government after years of a no-cloud hosting policy.',
        'I had no choice, no excuse and no regrets in chasing this dream.',
        'All my career I was a pioneer, but for others\' benefit. This was my chance to flip the script and pioneer with no constraints. In fact, part of the fuel behind this was all the bottled up "red-tape" frustration. I am pursuing this all the way Inshallah.',
        'I hope once the concept and its national benefits clicks, you will join me in this journey, whether as an Architect or a Builder, so we give it the best chance of success.'
      ],
      signature: 'CEO/Founder - Mosab Sayyed'
    },
    ar: {
      title: 'رسالة المؤسس: أصل الفكرة',
      paragraphs: [
        'منذ أكثر من عامين بقليل كان تعريفي الأول بالذكاء الاصطناعي التوليدي. ما بدأ كطلب بسيط لـ ChatGPT لتصميم برنامج تدريبي لتعليمي "الذكاء الاصطناعي"، استمر دون توقف طوال عطلة نهاية الأسبوع بأكملها لينتهي بالتفكير في كيف أن إطلاق الإمكانات البشرية ليس في السعي وراء الإجابات بل في صياغة الأسئلة الصحيحة. ومن ذلك جاء مفهوم شبكة التحول الحية، شبكة شبه واعية من الذكاء الاصطناعي تحمل مهمة واحدة لتحسين الإنسانية والحياة من خلال السيطرة على تعقيد المجتمع وتحدينا للتفكير.',
        '"ماذا نفعل بكل الوقت الفائض الذي سيكون لدينا؟"',
        'غيرت تلك التجربة حياتي إلى الأبد. حتى أنني نشرت هذا التفاعل البري في مقال على LinkedIn، بهدف مساعدة المترددين الآخرين أو كبار السن الذين لم يحسموا أمرهم لاتخاذ القفزة واحتضان الذكاء الاصطناعي.',
        'منذ ذلك الحين، كنت أسعى وراء هذا المفهوم المحدد. الذي في جوهره هو "كيف نجعل إدارة التحول تدفع وتسيطر على وحش التعقيد؟" استمررت في تصميم النموذج نفسه. ومع ذلك، بعد ستة أشهر، حتى مع نموذج سليم أخذ كل التعقيد وحشره في قاعدة بيانات علائقية، لم تكن تقنية الذكاء الاصطناعي موجودة بعد، وكان الحل آنذاك يعني الاستثمار بالطريقة القديمة (التراخيص، البنية التحتية، المبرمجون إلخ).',
        'لذلك أبقيته على نار هادئة، أصقله وأعدله بناءً على إعدادات العملاء الحقيقية التي أواجهها.',
        'حتى قبل بضعة أشهر. بدأ الذكاء الاصطناعي التوليدي في تحقيق قفزات كبيرة في القدرات، وتقدمت أدوات ومجتمعات تطوير الذكاء الاصطناعي بحلول أكثر "بدون برمجة". فجأة، أصبحت القوة النارية اللازمة للتنقل في متاهة العلاقات المعقدة متاحة ليس فقط، بل بأسعار معقولة بشكل ملحوظ. ليس ذلك فحسب، بل كان لاستضافة السحابة أيضًا اختراق مع اعتماد Azure من قبل الحكومة بعد سنوات من سياسة عدم الاستضافة السحابية.',
        'لم يكن لدي خيار، ولا عذر ولا ندم في مطاردة هذا الحلم.',
        'طوال مسيرتي المهنية كنت رائدًا، ولكن لمصلحة الآخرين. كانت هذه فرصتي لقلب السيناريو والريادة بدون قيود. في الواقع، جزء من الوقود وراء هذا كان كل الإحباط المكبوت من "البيروقراطية". أنا أسعى وراء هذا بكل الطريق إن شاء الله.',
        'آمل أنه بمجرد أن ينقر المفهوم وفوائده الوطنية، ستنضم إلي في هذه الرحلة، سواء كمهندس معماري أو بناء، حتى نعطيها أفضل فرصة للنجاح.'
      ],
      signature: 'الرئيس التنفيذي/المؤسس - مصعب السيد'
    }
  };

  const t = content[language];
  const isRTL = language === 'ar';

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#111827', 
      color: '#F9FAFB',
      fontFamily: isRTL ? '"Cairo", sans-serif' : '"Inter", sans-serif',
      paddingTop: '80px', // Space for fixed header
      overflowY: 'auto',
      height: '100vh'
    }}>
      <Header />
      
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }} dir={isRTL ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ 
              display: 'inline-flex', 
              padding: '16px', 
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
              borderRadius: '16px',
              marginBottom: '24px'
            }}>
              <Quote size={32} color="white" />
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: 700, marginBottom: '16px', fontFamily: isRTL ? '"Tajawal", sans-serif' : 'inherit' }}>{t.title}</h1>
          </div>

          <div style={{ 
            background: 'rgba(31, 41, 55, 0.6)', 
            backdropFilter: 'blur(20px)', 
            borderRadius: '24px', 
            padding: '40px', 
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '40px'
          }}>
            {t.paragraphs.map((paragraph, index) => {
              const isQuote = paragraph.startsWith('"');
              return (
                <p key={index} style={{ 
                  fontSize: isQuote ? '20px' : '16px', 
                  lineHeight: '1.8', 
                  marginBottom: '24px',
                  color: isQuote ? '#FFD700' : '#D1D5DB',
                  fontStyle: isQuote ? 'italic' : 'normal',
                  textAlign: isQuote ? 'center' : (isRTL ? 'right' : 'left'),
                  fontWeight: isQuote ? 500 : 400
                }}>
                  {paragraph}
                </p>
              );
            })}

            <div style={{ 
              marginTop: '48px', 
              paddingTop: '32px', 
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: isRTL ? 'left' : 'right'
            }}>
              <p style={{ fontSize: '18px', fontWeight: 600, color: '#FFD700' }}>{t.signature}</p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
