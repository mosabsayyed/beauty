import { motion } from "motion/react";
import { Language } from "../types";
import { Footer } from "../components/Footer";
import { Play, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import josoorLogo from "figma:asset/2c14eebd5b8a5df63fd7bfe674c59ce7b12ed179.png";

interface ChatOverCoffeePageProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenNoor?: () => void;
}

export function ChatOverCoffeePage({
  language,
  onLanguageChange,
  onOpenNoor,
}: ChatOverCoffeePageProps) {
  const phases = [
    {
      number: 1,
      title:
        language === "en"
          ? "Governance & Decision Making: Stage of Command and Control of Operations and Transformation"
          : "الحوكمة وصنع القرار: مرحلة التحكم والسيطرة في ادارة العمليات والتحول",
      description:
        language === "en"
          ? "Build the foundation: Digital twins that provide real-time organizational visibility. Transform decision-making to fully insight-driven."
          : "بناء الأساس: توائم رقمية توفر رؤية آنية للمنظمة. حوّل عملية صنع القرار بالكامل إلى عملية قائمة على الرؤى.",
      features: [
        language === "en"
          ? "AI fused with your Digital Twin as its memory"
          : "ذكاء اصطناعي ذاكرته هي توأمك الرقمي",
        language === "en"
          ? "True Intelligence Dashboards"
          : "لوحات معلومات الذكاء الحقيقي",
        language === "en"
          ? "Auto Risk Predictions and Analysis"
          : "الرصد والتنبؤ التلقائي للمخاطر وتحليلها",
        language === "en"
          ? "Full Visibility for Strategic Planning and Prioritization"
          : "شفافية كاملة في التخطيط وتحديد الاولويات الاستراتيجية",
      ],
    },
    {
      number: 2,
      title:
        language === "en"
          ? "Organizational Change & Culture AI Agents: Stage of Targeting the Organizations DNA"
          : "وكلاء رقميون للتغيير والثقافة المنظمية: مرحلة استهداف الحمض النووي للمنظمة",
      description:
        language === "en"
          ? "Transform from top-down mandates to organic adoption. AI agents that guide, coach, and accelerate cultural transformation at every level."
          : "التحول من التوجيهات العليا إلى التبني الطبيعي للتحول. وكلاء ذكاء اصطناعي تساند وتدرب وتسرع تحول ثقافة المنظمة لتقبل التغيير على كل المستويات.",
      features: [
        language === "en"
          ? "Personalized coaching on defining purpose"
          : "تدريب مخصص لتحديد الاهداف الشخصية",
        language === "en"
          ? "Context-aware change management"
          : "إدارة التغيير الموائمة للسياق",
        language === "en"
          ? "Cultural velocity measurement"
          : "قياس سرعة تحول الثقافة",
        language === "en"
          ? "Adaptive learning pathways"
          : "مسارات تعلم متكيفة",
      ],
    },
    {
      number: 3,
      title:
        language === "en"
          ? "True Agile Management based on Outcome Foresights: Transition into a (Continuous Transformation) State"
          : "الإدارة الرشيقة الحقيقية القائمة على استشراف النتائج: الانتقال إلى حالة (التحول المستمر) ",
      description:
        language === "en"
          ? "Increase the confidence levels of designed outcomes. Simulation engines that forecast transformation outcomes before you commit resources."
          : "زيادة مستويات الثقة في تحقيق التصميم للنتائج. محركات محاكاة تتنبأ بنتائج التحويل قبل تخصيص الموارد",
      features: [
        language === "en"
          ? "Multi-scenario simulation"
          : "محاكاة متعددة السيناريوهات",
        language === "en"
          ? "Standard Impact prediction modeling"
          : "نموذج معياري لتوقع النتائج",
        language === "en"
          ? "Resource allocation optimization engines"
          : "محركات تحسين تخصيص الموارد",
        language === "en"
          ? "Risk mitigation foresight"
          : "تخفيف المخاطر الاستشرافي",
      ],
    },
  ];

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Hero with JOSOOR Logo */}
      <section className="relative pt-32 pb-20 page-bg-pattern overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            {/* JOSOOR Logo */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <img
                src={josoorLogo}
                alt="JOSOOR Platform"
                className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.3)]"
              />
            </div>

            <div className="text-primary-dark mb-6">
              {language === "en"
                ? "JOSOOR Platform, your bridge to the Government Agency of the Future"
                : "منصة جسور، جسرك إلى الوكالة الحكومية للمستقبل"}
            </div>

            <h1 className="text-primary-dark mb-6 font-[Cairo]">
              {language === "en"
                ? "AI Twin Tech - your partner in the exciting journey towards the Cognitive Government"
                : "AI Twin Tech - شريكك في الرحلة المثيرة نحو الحكومة الإدراكية"}
            </h1>

            <p className="lead text-slate-600 max-w-4xl mx-auto">
              {language === "en"
                ? "We are thrilled to chat with you over coffee about this exciting topic and share our views on the possible phases and priorities shaping the next wave of government transformations"
                : "يسعدنا الدردشة معك على قهوة حول هذا الموضوع المثير ومشاركة آرائنا حول المراحل والأولويات المحتملة التي تشكل الموجة القادمة من التحولات الحكومية"}
            </p>
          </motion.div>
        </div>
      </section>

      {/* The 3 Phases - NO HEADER TEXT */}
      <section className="py-20 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {phases.map((phase, index) => (
              <motion.div
                key={phase.number}
                initial={{
                  opacity: 0,
                  x: index % 2 === 0 ? -30 : 30,
                }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="p-8 md:p-12 bg-white border-2 border-[#D4AF37]/30 hover:border-[#D4AF37]/50 hover:shadow-2xl hover:shadow-[#D4AF37]/10 transition-all">
                  <div
                    className={`flex gap-8 items-start ${language === "ar" ? "flex-row-reverse" : "flex-row"} flex-col md:flex-row`}
                  >
                    <div
                      className={`flex-shrink-0 ${language === "ar" ? "self-end md:self-start" : "self-start"}`}
                    >
                      <div className="w-20 h-20 bg-gradient-to-br from-[#D4AF37] to-[#B8960F] rounded-xl flex flex-col items-center justify-center shadow-lg shadow-[#D4AF37]/20">
                        <span
                          className="text-white opacity-90"
                          style={{ fontSize: "1rem" }}
                        >
                          {language === "en"
                            ? "Phase"
                            : "المرحلة"}
                        </span>
                        <span
                          className="text-white"
                          style={{ fontSize: "1.875rem" }}
                        >
                          {phase.number}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`flex-1 ${language === "ar" ? "text-right" : "text-left"}`}
                    >
                      <h3
                        className={`text-primary-dark mb-4 ${language === "ar" ? "text-right" : "text-left"}`}
                      >
                        {phase.title.split(':')[0]}:
                        <br />
                        <span className="text-[#D4AF37]">
                          {phase.title.split(':')[1]}
                        </span>
                      </h3>

                      <p
                        className={`text-slate-700 mb-6 ${language === "ar" ? "text-right" : "text-left"}`}
                      >
                        {phase.description}
                      </p>

                      <div className="grid md:grid-cols-2 gap-4">
                        {phase.features.map((feature, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2"
                          >
                            <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full flex-shrink-0 mt-2" />
                            <span className="text-slate-700">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Saudi Arabia Video Section */}
      <section className="py-20 page-bg-pattern">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-gradient-to-r from-[#D4AF37] to-[#B8960F] text-white text-sm px-4 py-2 border-0">
              {language === "en"
                ? "This can be your Case Study"
                : "اجعل هذه دراسة الحالة الخاصة بك"}
            </Badge>

            <h2 className="text-3xl md:text-4xl text-[#1A2435] mb-4">
              {language === "en"
                ? "A Parallel Universe: An imagined Saudi"
                : "عالم موازٍ: مملكة أخرى"}
            </h2>

            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {language === "en"
                ? "See how one government agency successfully navigated cognitive transformation"
                : "انظر كيف نجحت إحدى الوكالات الحكومية في التحول الى الحوكمة الادراكية"}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative aspect-video bg-slate-800 rounded-xl overflow-hidden shadow-2xl border-2 border-[#D4AF37]/40"
          >
            {/* Video Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
              <div className="text-center">
                <Play className="w-20 h-20 text-[#D4AF37] mx-auto mb-4 drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
                <p className="text-slate-600">
                  {language === "en"
                    ? "Video Coming Soon"
                    : "الفيديو قريبًا"}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8 text-center"
          >
            <p className="text-slate-600 text-sm">
              {language === "en"
                ? "Results: 97% time reduction in reporting, 85% increase in decision velocity, 100% executive satisfaction"
                : "��لنتائج: تقليل الوقت بنسبة 97٪ في التقارير، زيادة بنسبة 85٪ في سرعة القرار، رضا تنفيذي بنسبة 100٪"}
            </p>
          </motion.div>
        </div>
      </section>

      <Footer
        language={language}
        onLanguageChange={onLanguageChange}
      />
    </div>
  );
}