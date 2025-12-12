// server/voiceHandler.ts

export interface VoiceResponse {
  understood: boolean;
  service: string;
  clarificationNeeded: boolean;
  clarificationQuestion?: string;
  responseText: string;
  serviceUrl: string;
  nextAction: "speak" | "verify" | "redirect" | "clarify";
}

// قائمة الخدمات
const SERVICES = {
  passport_renewal: {
    name: "تجديد جواز السفر",
    keywords: [
      "تجديد الجواز",
      "تجديد جواز",
      "الجواز",
      "جواز",
      "ابي اجدد الجواز",
      "ابغى اجدد الجواز",
      "اجدد الجواز",
      "تجديد جواز بنتي",
      "ابغى اجدد جواز بنتي",
      "جواز بنتي",
    ],
    url: "https://absher.sa/passport/renewal",
  },
};

// تبسيط النص العربي
function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/أ|إ|آ/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[^\u0600-\u06FF0-9 ]/g, "")
    .trim();
}

// تحديد الخدمة
function detectIntent(transcript: string) {
  const t = normalize(transcript);

  for (const [key, svc] of Object.entries(SERVICES)) {
    for (const word of svc.keywords) {
      if (t.includes(normalize(word))) {
        return key;
      }
    }
  }
  return null;
}

// الدالة الأساسية
export function processVoiceRequest(transcript: string): VoiceResponse {
  const t = normalize(transcript);

  // مرحلة اسم البنت
  if (t.startsWith("اسمها") || t.includes("اسم البنت")) {
    return {
      understood: true,
      service: "passport_renewal",
      clarificationNeeded: false,
      responseText:
        "تمام. الآن سوف ننتقل لصفحة تجديد الجواز، وأنا معك خطوة بخطوة أشرح لك الشروط والأزرار.",
      serviceUrl: SERVICES.passport_renewal.url,
      nextAction: "redirect",
    };
  }

  // تحليل النية
  const intent = detectIntent(transcript);
  if (!intent) {
    return {
      understood: false,
      service: "",
      clarificationNeeded: true,
      clarificationQuestion:
        "ما فهمت الخدمة. هل تبغى تجديد الجواز؟",
      responseText: "لم أفهم الخدمة المطلوبة.",
      serviceUrl: "",
      nextAction: "clarify",
    };
  }

  const userWantsDaughter =
    t.includes("بنت") || t.includes("بنتي");

  // حالة: أبغى أجدد جواز بنتي
  if (intent === "passport_renewal" && userWantsDaughter) {
    return {
      understood: true,
      service: "passport_renewal",
      clarificationNeeded: false,
      responseText:
        "تمام، فهمت أنك تبغى تجدد جواز بنتك في التسجيل التالي قولي: اسم بنتك.",
      serviceUrl: SERVICES.passport_renewal.url,
      nextAction: "verify",
    };
  }

  // حالة: تجديد الجواز بدون بنت
  return {
    understood: true,
    service: "passport_renewal",
    clarificationNeeded: false,
    responseText:
      "تمام! فهمت أنك تبغى تجديد الجواز. اضغط الزر الأخضر للمتابعة.",
    serviceUrl: SERVICES.passport_renewal.url,
    nextAction: "speak",
  };
}

