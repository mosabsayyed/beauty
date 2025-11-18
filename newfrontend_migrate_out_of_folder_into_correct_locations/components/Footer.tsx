import { motion } from "motion/react";
import { Globe, Linkedin, Twitter, Mail } from "lucide-react";
import { Language } from "../types";
import { content } from "../data/content";
import { useNavigate } from "react-router-dom";
import companyLogo from "figma:asset/b8cb315aa51767ca721aed58d9a7e9bddafcb634.png";

interface FooterProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function Footer({
  language,
  onLanguageChange,
}: FooterProps) {
  const t = content[language].footer;
  const navigate = useNavigate();

  return (
    <footer
      className="relative bg-slate-900 border-t border-slate-700"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
        <div className="grid md:grid-cols-3 gap-16 items-center justify-items-center">
          {/* Brand - Centered */}
          <div className="flex justify-center w-full">
            <div
              className={`flex items-center gap-4 ${language === "ar" ? "flex-row-reverse" : ""}`}
            >
              <img
                src={companyLogo}
                alt="AI Twin Tech"
                className="w-20 h-20 object-contain"
              />
              <div
                className={
                  language === "ar" ? "text-right" : "text-left"
                }
              >
                <div className="text-white text-[24px]">AI Twin Tech</div>
              </div>
            </div>
          </div>

          {/* Connect */}
          <div
            className={`flex flex-col items-center w-full ${language === "ar" ? "text-right" : "text-left"}`}
          >
            <div
              className="flex gap-4 justify-center"
            >
              {[
                { icon: Linkedin, href: "#" },
                { icon: Twitter, href: "#" },
                { icon: Mail, href: "#" },
              ].map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  whileHover={{ scale: 1.1 }}
                  className="w-10 h-10 bg-slate-800 hover:bg-[#1A2435] rounded-lg flex items-center justify-center transition-all"
                >
                  <social.icon className="w-5 h-5 text-gray-400 hover:text-white" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div
            className="flex flex-col gap-3 items-center w-full"
          >
            <div className={`flex gap-6 ${language === "ar" ? "flex-row-reverse" : ""}`}>
              <a
                href="#"
                className="text-gray-500 hover:text-sky-400 transition-colors"
              >
                {language === "en"
                  ? "Privacy Policy"
                  : "سياسة الخصوصية"}
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-sky-400 transition-colors"
              >
                {language === "en"
                  ? "Terms of Service"
                  : "شروط الخدمة"}
              </a>
            </div>
            <p className="text-gray-500 text-center">
              {t.copyright}
            </p>
          </div>
        </div>
      </div>

      {/* Decorative Line */}
      <motion.div
        animate={{
          scaleX: [0, 1, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-sky-500 to-transparent origin-center"
      />
    </footer>
  );
}