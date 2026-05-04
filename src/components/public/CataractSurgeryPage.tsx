import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  HelpCircle,
  MapPin,
  Microscope,
  Phone,
  ShieldCheck,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import type { PublicLocale } from './PublicHomePage'

const phoneDisplay = '098555 62229'
const phoneHref = 'tel:+919855562229'
const whatsappHref = 'https://wa.me/919855562229'

const paths: Record<PublicLocale, { home: string; cataract: string }> = {
  en: { home: '/', cataract: '/cataract-surgery' },
  hi: { home: '/hi', cataract: '/hi/cataract-surgery' },
  pa: { home: '/pa', cataract: '/pa/cataract-surgery' },
}

export const cataractContent = {
  en: {
    htmlLang: 'en',
    title: 'Cataract Surgery in Dhuri | Sharma Eye Hospital',
    description:
      'Cataract surgery information for patients in Dhuri: symptoms, eye examination, lens options, recovery, and appointment guidance.',
    back: 'Back to home',
    eyebrow: 'Cataract surgery in Dhuri',
    h1: 'Clear advice before cataract surgery.',
    intro:
      'This page is designed to help patients and families understand when cataract surgery is needed, what happens during the hospital visit, and what recovery usually involves.',
    call: `Call ${phoneDisplay}`,
    whatsapp: 'Ask on WhatsApp',
    visualLabel: 'Photo placeholder',
    heroPhoto: 'Doctor counselling a cataract patient',
    symptomsTitle: 'Symptoms that should be checked',
    symptoms: [
      'Cloudy or blurred vision',
      'Glare from headlights or bright light',
      'Difficulty reading or recognizing faces',
      'Frequent change in glasses',
      'Colours looking dull or yellow',
    ],
    processTitle: 'Typical cataract consultation flow',
    process: [
      'Vision and eye pressure check',
      'Slit-lamp examination by the doctor',
      'Retina and diabetes-related eye check when needed',
      'Lens measurement and IOL counselling',
      'Surgery date, medicines, and follow-up instructions',
    ],
    lensTitle: 'Lens options explained simply',
    lensText:
      'The right intraocular lens depends on eye condition, daily needs, budget, and doctor advice. The website should later include the exact lens options offered at the hospital after doctor review.',
    recoveryTitle: 'After surgery',
    recovery: [
      'Use eye drops as advised',
      'Avoid rubbing the eye',
      'Come for scheduled follow-up',
      'Call immediately if pain, sudden vision drop, or redness increases',
    ],
    photoSetTitle: 'Photos needed for this page',
    photoSet: [
      { title: 'Consultation room', text: 'Doctor explaining cataract report', icon: Stethoscope },
      { title: 'Diagnostic equipment', text: 'Lens measurement and eye testing setup', icon: Microscope },
      { title: 'OT corridor or equipment', text: 'Clean, non-graphic surgery environment', icon: ShieldCheck },
    ],
    faqTitle: 'Common questions',
    faq: [
      {
        q: 'Is cataract surgery painful?',
        a: 'Most cataract surgery is done with numbing drops or local anaesthesia. The doctor will explain what is suitable for the patient.',
      },
      {
        q: 'How long is recovery?',
        a: 'Many patients return to light routine quickly, but drops and follow-up are important. Exact instructions depend on the eye and surgery.',
      },
      {
        q: 'Which lens is best?',
        a: 'There is no single best lens for everyone. The right choice depends on eye health, visual needs, and budget.',
      },
    ],
    contactTitle: 'Ready to get checked?',
    contactText:
      'Call before visiting so the team can guide you on timing, documents, and whether the patient should bring previous reports or medicines.',
  },
  hi: {
    htmlLang: 'hi',
    title: 'धूरी में मोतियाबिंद ऑपरेशन | शर्मा आई हॉस्पिटल',
    description:
      'धूरी के मरीजों के लिए मोतियाबिंद ऑपरेशन जानकारी: लक्षण, आंख जांच, लेंस विकल्प, रिकवरी और अपॉइंटमेंट सलाह.',
    back: 'होम पर वापस',
    eyebrow: 'धूरी में मोतियाबिंद ऑपरेशन',
    h1: 'मोतियाबिंद ऑपरेशन से पहले साफ सलाह.',
    intro:
      'यह पेज मरीजों और परिवारों को समझाने के लिए है कि मोतियाबिंद ऑपरेशन कब जरूरी हो सकता है, हॉस्पिटल विजिट में क्या होता है, और रिकवरी में आम तौर पर क्या ध्यान रखना होता है.',
    call: `कॉल करें ${phoneDisplay}`,
    whatsapp: 'WhatsApp पर पूछें',
    visualLabel: 'फोटो प्लेसहोल्डर',
    heroPhoto: 'डॉक्टर मरीज को मोतियाबिंद सलाह देते हुए',
    symptomsTitle: 'लक्षण जिन्हें जांचना चाहिए',
    symptoms: [
      'धुंधला या बादल जैसा दिखना',
      'तेज रोशनी या हेडलाइट से चकाचौंध',
      'पढ़ने या चेहरे पहचानने में दिक्कत',
      'चश्मे का नंबर बार-बार बदलना',
      'रंग फीके या पीले लगना',
    ],
    processTitle: 'मोतियाबिंद परामर्श की सामान्य प्रक्रिया',
    process: [
      'विजन और आंख के प्रेशर की जांच',
      'डॉक्टर द्वारा स्लिट-लैंप जांच',
      'जरूरत होने पर रेटिना और डायबिटीज से जुड़ी जांच',
      'लेंस माप और IOL सलाह',
      'सर्जरी तारीख, दवाइयां और फॉलो-अप निर्देश',
    ],
    lensTitle: 'लेंस विकल्प आसान भाषा में',
    lensText:
      'सही इंट्राऑक्युलर लेंस आंख की स्थिति, रोजमर्रा की जरूरत, बजट और डॉक्टर की सलाह पर निर्भर करता है. डॉक्टर समीक्षा के बाद वेबसाइट पर अस्पताल में उपलब्ध वास्तविक लेंस विकल्प जोड़े जा सकते हैं.',
    recoveryTitle: 'ऑपरेशन के बाद',
    recovery: [
      'डॉक्टर की सलाह के अनुसार आई ड्रॉप्स लगाएं',
      'आंख न रगड़ें',
      'निर्धारित फॉलो-अप पर आएं',
      'दर्द, अचानक दृष्टि कम होना या लालिमा बढ़ने पर तुरंत कॉल करें',
    ],
    photoSetTitle: 'इस पेज के लिए जरूरी फोटो',
    photoSet: [
      { title: 'कंसल्टेशन रूम', text: 'डॉक्टर रिपोर्ट समझाते हुए', icon: Stethoscope },
      { title: 'डायग्नोस्टिक उपकरण', text: 'लेंस माप और आई टेस्टिंग सेटअप', icon: Microscope },
      { title: 'OT कॉरिडोर या उपकरण', text: 'साफ, गैर-ग्राफिक सर्जरी वातावरण', icon: ShieldCheck },
    ],
    faqTitle: 'आम सवाल',
    faq: [
      {
        q: 'क्या मोतियाबिंद ऑपरेशन दर्दनाक होता है?',
        a: 'अधिकतर मोतियाबिंद ऑपरेशन सुन्न करने वाली ड्रॉप्स या लोकल एनेस्थीसिया से होता है. डॉक्टर मरीज के लिए सही तरीका समझाते हैं.',
      },
      {
        q: 'रिकवरी में कितना समय लगता है?',
        a: 'कई मरीज हल्की दिनचर्या जल्दी शुरू कर लेते हैं, लेकिन ड्रॉप्स और फॉलो-अप जरूरी हैं. सटीक सलाह आंख और ऑपरेशन पर निर्भर करती है.',
      },
      {
        q: 'कौन सा लेंस सबसे अच्छा है?',
        a: 'हर मरीज के लिए एक ही लेंस सबसे अच्छा नहीं होता. सही चुनाव आंख की सेहत, जरूरत और बजट पर निर्भर करता है.',
      },
    ],
    contactTitle: 'जांच करवानी है?',
    contactText:
      'आने से पहले कॉल करें ताकि टीम समय, दस्तावेज और पुरानी रिपोर्ट या दवाइयां लाने की जरूरत पर मार्गदर्शन दे सके.',
  },
  pa: {
    htmlLang: 'pa',
    title: 'ਧੂਰੀ ਵਿੱਚ ਮੋਤੀਆਬਿੰਦ ਸਰਜਰੀ | ਸ਼ਰਮਾ ਆਈ ਹਸਪਤਾਲ',
    description:
      'ਧੂਰੀ ਦੇ ਮਰੀਜ਼ਾਂ ਲਈ ਮੋਤੀਆਬਿੰਦ ਸਰਜਰੀ ਜਾਣਕਾਰੀ: ਲੱਛਣ, ਅੱਖ ਜਾਂਚ, ਲੈਂਸ ਵਿਕਲਪ, ਰਿਕਵਰੀ ਅਤੇ ਅਪਾਇੰਟਮੈਂਟ ਸਲਾਹ.',
    back: 'ਹੋਮ ਤੇ ਵਾਪਸ',
    eyebrow: 'ਧੂਰੀ ਵਿੱਚ ਮੋਤੀਆਬਿੰਦ ਸਰਜਰੀ',
    h1: 'ਮੋਤੀਆਬਿੰਦ ਸਰਜਰੀ ਤੋਂ ਪਹਿਲਾਂ ਸਾਫ਼ ਸਲਾਹ.',
    intro:
      'ਇਹ ਪੇਜ ਮਰੀਜ਼ਾਂ ਅਤੇ ਪਰਿਵਾਰਾਂ ਨੂੰ ਸਮਝਾਉਣ ਲਈ ਹੈ ਕਿ ਮੋਤੀਆਬਿੰਦ ਸਰਜਰੀ ਕਦੋਂ ਲੋੜੀਂਦੀ ਹੋ ਸਕਦੀ ਹੈ, ਹਸਪਤਾਲ ਵਿਜ਼ਿਟ ਵਿੱਚ ਕੀ ਹੁੰਦਾ ਹੈ, ਅਤੇ ਰਿਕਵਰੀ ਵਿੱਚ ਆਮ ਤੌਰ ਤੇ ਕੀ ਧਿਆਨ ਰੱਖਣਾ ਹੁੰਦਾ ਹੈ.',
    call: `ਕਾਲ ਕਰੋ ${phoneDisplay}`,
    whatsapp: 'WhatsApp ਤੇ ਪੁੱਛੋ',
    visualLabel: 'ਫੋਟੋ ਪਲੇਸਹੋਲਡਰ',
    heroPhoto: 'ਡਾਕਟਰ ਮਰੀਜ਼ ਨੂੰ ਮੋਤੀਆਬਿੰਦ ਸਲਾਹ ਦਿੰਦੇ ਹੋਏ',
    symptomsTitle: 'ਲੱਛਣ ਜਿਨ੍ਹਾਂ ਦੀ ਜਾਂਚ ਕਰਵਾਉਣੀ ਚਾਹੀਦੀ ਹੈ',
    symptoms: [
      'ਧੁੰਦਲਾ ਜਾਂ ਬੱਦਲ ਵਰਗਾ ਦਿਖਣਾ',
      'ਤੇਜ਼ ਰੋਸ਼ਨੀ ਜਾਂ ਹੈਡਲਾਈਟ ਨਾਲ ਚਮਕ',
      'ਪੜ੍ਹਨ ਜਾਂ ਚਿਹਰੇ ਪਛਾਣਣ ਵਿੱਚ ਦਿੱਕਤ',
      'ਚਸ਼ਮੇ ਦਾ ਨੰਬਰ ਵਾਰ-ਵਾਰ ਬਦਲਣਾ',
      'ਰੰਗ ਫਿੱਕੇ ਜਾਂ ਪੀਲੇ ਲੱਗਣਾ',
    ],
    processTitle: 'ਮੋਤੀਆਬਿੰਦ ਸਲਾਹ ਦੀ ਆਮ ਪ੍ਰਕਿਰਿਆ',
    process: [
      'ਨਜ਼ਰ ਅਤੇ ਅੱਖ ਦੇ ਪ੍ਰੈਸ਼ਰ ਦੀ ਜਾਂਚ',
      'ਡਾਕਟਰ ਵੱਲੋਂ ਸਲਿਟ-ਲੈਂਪ ਜਾਂਚ',
      'ਲੋੜ ਹੋਣ ਤੇ ਰੈਟਿਨਾ ਅਤੇ ਡਾਇਬਿਟੀਜ਼ ਨਾਲ ਜੁੜੀ ਜਾਂਚ',
      'ਲੈਂਸ ਮਾਪ ਅਤੇ IOL ਸਲਾਹ',
      'ਸਰਜਰੀ ਤਾਰੀਖ, ਦਵਾਈਆਂ ਅਤੇ ਫਾਲੋ-ਅੱਪ ਹਦਾਇਤਾਂ',
    ],
    lensTitle: 'ਲੈਂਸ ਵਿਕਲਪ ਸੌਖੀ ਭਾਸ਼ਾ ਵਿੱਚ',
    lensText:
      'ਸਹੀ ਇੰਟ੍ਰਾਓਕੁਲਰ ਲੈਂਸ ਅੱਖ ਦੀ ਸਥਿਤੀ, ਰੋਜ਼ਾਨਾ ਲੋੜਾਂ, ਬਜਟ ਅਤੇ ਡਾਕਟਰ ਦੀ ਸਲਾਹ ਤੇ ਨਿਰਭਰ ਕਰਦਾ ਹੈ. ਡਾਕਟਰ ਸਮੀਖਿਆ ਤੋਂ ਬਾਅਦ ਹਸਪਤਾਲ ਵਿੱਚ ਉਪਲਬਧ ਅਸਲੀ ਲੈਂਸ ਵਿਕਲਪ ਜੋੜੇ ਜਾ ਸਕਦੇ ਹਨ.',
    recoveryTitle: 'ਸਰਜਰੀ ਤੋਂ ਬਾਅਦ',
    recovery: [
      'ਡਾਕਟਰ ਦੀ ਸਲਾਹ ਅਨੁਸਾਰ ਆਈ ਡਰਾਪਸ ਲਗਾਓ',
      'ਅੱਖ ਨਾ ਰਗੜੋ',
      'ਨਿਰਧਾਰਤ ਫਾਲੋ-ਅੱਪ ਤੇ ਆਓ',
      'ਦਰਦ, ਅਚਾਨਕ ਨਜ਼ਰ ਘਟਣ ਜਾਂ ਲਾਲੀ ਵਧਣ ਤੇ ਤੁਰੰਤ ਕਾਲ ਕਰੋ',
    ],
    photoSetTitle: 'ਇਸ ਪੇਜ ਲਈ ਲੋੜੀਂਦੀਆਂ ਫੋਟੋਆਂ',
    photoSet: [
      { title: 'ਕੰਸਲਟੇਸ਼ਨ ਰੂਮ', text: 'ਡਾਕਟਰ ਰਿਪੋਰਟ ਸਮਝਾਉਂਦੇ ਹੋਏ', icon: Stethoscope },
      { title: 'ਡਾਇਗਨੋਸਟਿਕ ਉਪਕਰਣ', text: 'ਲੈਂਸ ਮਾਪ ਅਤੇ ਅੱਖ ਜਾਂਚ ਸੈਟਅੱਪ', icon: Microscope },
      { title: 'OT ਕਰੀਡੋਰ ਜਾਂ ਉਪਕਰਣ', text: 'ਸਾਫ਼, ਗੈਰ-ਗ੍ਰਾਫਿਕ ਸਰਜਰੀ ਮਾਹੌਲ', icon: ShieldCheck },
    ],
    faqTitle: 'ਆਮ ਸਵਾਲ',
    faq: [
      {
        q: 'ਕੀ ਮੋਤੀਆਬਿੰਦ ਸਰਜਰੀ ਦਰਦਨਾਕ ਹੁੰਦੀ ਹੈ?',
        a: 'ਜ਼ਿਆਦਾਤਰ ਮੋਤੀਆਬਿੰਦ ਸਰਜਰੀ ਸੁੰਨ ਕਰਨ ਵਾਲੀਆਂ ਡਰਾਪਸ ਜਾਂ ਲੋਕਲ ਐਨੇਸਥੀਸੀਆ ਨਾਲ ਹੁੰਦੀ ਹੈ. ਡਾਕਟਰ ਮਰੀਜ਼ ਲਈ ਢੁੱਕਵਾਂ ਤਰੀਕਾ ਸਮਝਾਉਂਦੇ ਹਨ.',
      },
      {
        q: 'ਰਿਕਵਰੀ ਵਿੱਚ ਕਿੰਨਾ ਸਮਾਂ ਲੱਗਦਾ ਹੈ?',
        a: 'ਕਈ ਮਰੀਜ਼ ਹਲਕੀ ਰੁਟੀਨ ਜਲਦੀ ਸ਼ੁਰੂ ਕਰ ਲੈਂਦੇ ਹਨ, ਪਰ ਡਰਾਪਸ ਅਤੇ ਫਾਲੋ-ਅੱਪ ਜ਼ਰੂਰੀ ਹਨ. ਸਹੀ ਸਲਾਹ ਅੱਖ ਅਤੇ ਸਰਜਰੀ ਤੇ ਨਿਰਭਰ ਕਰਦੀ ਹੈ.',
      },
      {
        q: 'ਕਿਹੜਾ ਲੈਂਸ ਸਭ ਤੋਂ ਵਧੀਆ ਹੈ?',
        a: 'ਹਰ ਮਰੀਜ਼ ਲਈ ਇੱਕੋ ਲੈਂਸ ਸਭ ਤੋਂ ਵਧੀਆ ਨਹੀਂ ਹੁੰਦਾ. ਸਹੀ ਚੋਣ ਅੱਖ ਦੀ ਸਿਹਤ, ਲੋੜਾਂ ਅਤੇ ਬਜਟ ਤੇ ਨਿਰਭਰ ਕਰਦੀ ਹੈ.',
      },
    ],
    contactTitle: 'ਜਾਂਚ ਕਰਵਾਉਣੀ ਹੈ?',
    contactText:
      'ਆਉਣ ਤੋਂ ਪਹਿਲਾਂ ਕਾਲ ਕਰੋ ਤਾਂ ਜੋ ਟੀਮ ਸਮਾਂ, ਦਸਤਾਵੇਜ਼ ਅਤੇ ਪੁਰਾਣੀਆਂ ਰਿਪੋਰਟਾਂ ਜਾਂ ਦਵਾਈਆਂ ਲਿਆਉਣ ਬਾਰੇ ਸਲਾਹ ਦੇ ਸਕੇ.',
  },
} satisfies Record<PublicLocale, {
  htmlLang: string
  title: string
  description: string
  back: string
  eyebrow: string
  h1: string
  intro: string
  call: string
  whatsapp: string
  visualLabel: string
  heroPhoto: string
  symptomsTitle: string
  symptoms: string[]
  processTitle: string
  process: string[]
  lensTitle: string
  lensText: string
  recoveryTitle: string
  recovery: string[]
  photoSetTitle: string
  photoSet: { title: string; text: string; icon: LucideIcon }[]
  faqTitle: string
  faq: { q: string; a: string }[]
  contactTitle: string
  contactText: string
}>

export function CataractSurgeryPage({ locale }: { locale: PublicLocale }) {
  const content = cataractContent[locale]
  const route = paths[locale]

  return (
    <main lang={content.htmlLang} className="min-h-dvh bg-[#fbfcf7] text-ink-900">
      <header className="border-b border-[#dfe7d5] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href={route.home} className="flex items-center gap-3">
            <Logo size={38} halo />
            <div className="leading-tight">
              <div className="text-[15px] font-semibold">Sharma Eye Hospital</div>
              <div className="text-[12px] text-ink-500">Dhuri, Punjab</div>
            </div>
          </Link>
          <Link href={route.home} className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-white px-3 py-2 text-[13px] font-semibold text-ink-700">
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">{content.back}</span>
          </Link>
        </div>
      </header>

      <section className="border-b border-[#dfe7d5]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.94fr_1.06fr] lg:px-8 lg:py-20">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-accent-100 px-3 py-1 text-[12px] font-semibold text-accent-700">
              <Eye size={14} />
              {content.eyebrow}
            </div>
            <h1 className="text-[42px] font-semibold leading-[1.04] tracking-normal sm:text-[58px]">
              {content.h1}
            </h1>
            <p className="mt-6 max-w-2xl text-[17px] leading-8 text-ink-600">
              {content.intro}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={phoneHref} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-700 px-5 text-[14px] font-semibold text-white">
                <Phone size={18} />
                {content.call}
              </a>
              <a href={whatsappHref} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white px-5 text-[14px] font-semibold text-brand-800">
                {content.whatsapp}
                <ArrowRight size={17} />
              </a>
            </div>
          </div>

          <ImageSlot label={content.visualLabel} title={content.heroPhoto} icon={Stethoscope} large />
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8">
          <InfoBlock icon={HelpCircle} title={content.symptomsTitle} items={content.symptoms} />
          <InfoBlock icon={ClipboardCheck} title={content.processTitle} items={content.process} />
          <InfoBlock icon={CalendarCheck} title={content.recoveryTitle} items={content.recovery} />
        </div>
      </section>

      <section className="border-y border-[#dfe7d5] bg-[#f4f8ec]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.78fr_1.22fr] lg:px-8">
          <div>
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-700 shadow-soft">
              <Eye size={24} />
            </div>
            <h2 className="text-[32px] font-semibold leading-tight tracking-normal sm:text-[42px]">
              {content.lensTitle}
            </h2>
            <p className="mt-5 text-[16px] leading-8 text-ink-600">
              {content.lensText}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {content.photoSet.map((photo) => (
              <ImageSlot key={photo.title} label={content.visualLabel} title={photo.title} text={photo.text} icon={photo.icon} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-[32px] font-semibold tracking-normal sm:text-[40px]">
            {content.faqTitle}
          </h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {content.faq.map((item) => (
              <div key={item.q} className="rounded-[18px] border border-hairline bg-[#fbfcf7] p-6">
                <h3 className="text-[17px] font-semibold tracking-normal">{item.q}</h3>
                <p className="mt-3 text-[14px] leading-7 text-ink-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
          <div>
            <h2 className="text-[30px] font-semibold tracking-normal text-white">{content.contactTitle}</h2>
            <p className="mt-3 max-w-3xl text-[15.5px] leading-7 text-white/72">{content.contactText}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:items-center">
            <a href={phoneHref} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-[14px] font-semibold text-brand-800">
              <Phone size={18} />
              {phoneDisplay}
            </a>
            <a href={route.home + '#contact'} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/20 px-5 text-[14px] font-semibold text-white">
              <MapPin size={18} />
              Dhuri
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

function InfoBlock({
  icon: Icon,
  title,
  items,
}: {
  icon: LucideIcon
  title: string
  items: string[]
}) {
  return (
    <div className="rounded-[18px] border border-hairline bg-[#fbfcf7] p-6 shadow-soft">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
        <Icon size={23} />
      </div>
      <h2 className="text-[20px] font-semibold tracking-normal">{title}</h2>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-[14px] leading-6 text-ink-600">
            <CheckCircle2 className="mt-0.5 shrink-0 text-accent-600" size={17} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ImageSlot({
  icon: Icon,
  label,
  title,
  text,
  large,
}: {
  icon: LucideIcon
  label: string
  title: string
  text?: string
  large?: boolean
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[#dfe7d5] bg-white shadow-soft">
      <div className={large ? 'relative flex min-h-[390px] items-center justify-center bg-[linear-gradient(135deg,#eef4e7,#e8edf8)]' : 'relative flex aspect-[4/3] items-center justify-center bg-[linear-gradient(135deg,#eef4e7,#e8edf8)]'}>
        <div
          aria-hidden
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(49,72,130,0.10) 1px, transparent 1px), linear-gradient(rgba(49,72,130,0.08) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        <div className="relative flex h-18 w-18 items-center justify-center rounded-2xl bg-white/86 text-brand-700 shadow-glass">
          <Icon size={34} />
        </div>
        <div className="absolute bottom-4 left-4 rounded-full bg-white/86 px-3 py-1 text-[11px] font-semibold text-ink-500 shadow-soft">
          {label}
        </div>
      </div>
      <div className="p-5">
        <div className="text-[16px] font-semibold text-ink-900">{title}</div>
        {text && <p className="mt-1 text-[13px] leading-5 text-ink-500">{text}</p>}
      </div>
    </div>
  )
}
