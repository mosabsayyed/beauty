import { motion } from 'motion/react';
import { Language } from '../types';
import { Footer } from '../components/Footer';
import architectBackground from 'figma:asset/4fb13bac889f2eb518dd49222c505e56df9af2b7.png';

interface OriginsPageProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function OriginsPage({ language, onLanguageChange }: OriginsPageProps) {
  
  const founderLetter = {
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

  const content = founderLetter[language];
  
  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundImage: `url(${architectBackground})`,
        backgroundSize: 'contain',
        backgroundPosition: 'right 80px',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#f9fafb'
      }}
    >
      {/* Title Section */}
      <section 
        className="relative pt-32 pb-8 overflow-hidden" 
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-white mb-4">
              {content.title}
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Letter Content */}
      <section 
        className="pt-0 pb-0" 
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
            {/* Letter Content with Background */}
            <motion.div
              initial={{ opacity: 0.3, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="w-full"
            >
              <div 
                className="md:p-8 border-2 border-gray-500 shadow-xl p-[32px] relative overflow-hidden w-4/5 mx-auto"
                style={{
                  backgroundColor: 'rgba(26, 36, 53, 0.80)'
                }}
              >
                <div className={`space-y-4 ${language === 'ar' ? 'text-right' : 'text-left'} relative z-10`}>
                  
                  {content.paragraphs.map((paragraph, index) => {
                    const isQuote = paragraph.startsWith('"');
                    const Component = isQuote ? motion.h2 : motion.p;
                    
                    return (
                      <Component
                        key={index}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className={`
                          ${isQuote ? 'text-white italic my-6 pl-6 border-gold border-l-4' : 'text-white'}
                          ${language === 'ar' ? 'text-right' : 'text-left'}
                        `}
                      >
                        {paragraph}
                      </Component>
                    );
                  })}

                  {/* Signature */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 }}
                    className={`mt-8 pt-6 border-t border-gray-600 ${language === 'ar' ? 'text-right' : 'text-left'}`}
                  >
                    <h3 className={`text-white ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      {content.signature}
                    </h3>
                  </motion.div>

                </div>
              </div>
            </motion.div>

        </div>
      </section>

      <Footer language={language} onLanguageChange={onLanguageChange} />
    </div>
  );
}
