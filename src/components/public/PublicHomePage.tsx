import Link from 'next/link'
import {
  ArrowRight,
  Award,
  Building2,
  CalendarCheck,
  Camera,
  CheckCircle2,
  Clock,
  ClipboardCheck,
  Eye,
  HeartHandshake,
  MapPin,
  Microscope,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { Logo } from '@/components/brand/Logo'

export type PublicLocale = 'en' | 'hi' | 'pa'

const phoneDisplay = '098555 62229'
const phoneHref = 'tel:+919855562229'
const whatsappHref = 'https://wa.me/919855562229'
const directionsHref =
  'https://www.google.com/maps/place/Sharma+Eye+Hospital/data=!4m2!3m1!1s0x0:0xaa9fd5ca1001c504'

const languageOptions = [
  { locale: 'en' as const, label: 'English', href: '/' },
  { locale: 'hi' as const, label: 'हिंदी', href: '/hi' },
  { locale: 'pa' as const, label: 'ਪੰਜਾਬੀ', href: '/pa' },
]

const localizedPaths: Record<PublicLocale, { home: string; cataract: string }> = {
  en: { home: '/', cataract: '/cataract-surgery' },
  hi: { home: '/hi', cataract: '/hi/cataract-surgery' },
  pa: { home: '/pa', cataract: '/pa/cataract-surgery' },
}

const visualContent = {
  en: {
    badge: 'Visual plan',
    title: 'Real photos to add before launch.',
    text: 'These placeholders mark the exact photo set that will make the site feel local, credible, and human.',
    items: [
      { title: 'Hospital exterior', text: 'Signboard and entrance on Bus Stand Road', icon: Building2 },
      { title: 'Doctor portrait', text: 'Dr. Ramesh Sharma and current doctors', icon: Stethoscope },
      { title: 'Examination room', text: 'Eye testing and diagnostic equipment', icon: Microscope },
      { title: 'Staff and reception', text: 'Friendly front desk and trained team', icon: UsersRound },
      { title: 'Patient counselling', text: 'Lens options and surgery guidance', icon: ClipboardCheck },
      { title: 'Community service', text: 'Free surgery camps and outreach work', icon: HeartHandshake },
    ],
    placeholder: 'Photo placeholder',
    cataractCta: 'Read the cataract surgery guide',
  },
  hi: {
    badge: 'विजुअल योजना',
    title: 'लॉन्च से पहले असली फोटो जोड़ें.',
    text: 'ये प्लेसहोल्डर बताते हैं कि कौन सी फोटो साइट को स्थानीय, भरोसेमंद और मानवीय बनाएंगी.',
    items: [
      { title: 'हॉस्पिटल बाहरी फोटो', text: 'बस स्टैंड रोड पर साइनबोर्ड और प्रवेश', icon: Building2 },
      { title: 'डॉक्टर पोर्ट्रेट', text: 'डॉ. रमेश शर्मा और वर्तमान डॉक्टर', icon: Stethoscope },
      { title: 'जांच कक्ष', text: 'आई टेस्टिंग और डायग्नोस्टिक उपकरण', icon: Microscope },
      { title: 'स्टाफ और रिसेप्शन', text: 'फ्रंट डेस्क और प्रशिक्षित टीम', icon: UsersRound },
      { title: 'मरीज काउंसलिंग', text: 'लेंस विकल्प और ऑपरेशन मार्गदर्शन', icon: ClipboardCheck },
      { title: 'समाज सेवा', text: 'मुफ्त सर्जरी कैंप और सेवा कार्य', icon: HeartHandshake },
    ],
    placeholder: 'फोटो प्लेसहोल्डर',
    cataractCta: 'मोतियाबिंद ऑपरेशन गाइड पढ़ें',
  },
  pa: {
    badge: 'ਵਿਜ਼ੁਅਲ ਯੋਜਨਾ',
    title: 'ਲਾਂਚ ਤੋਂ ਪਹਿਲਾਂ ਅਸਲੀ ਫੋਟੋਆਂ ਜੋੜੋ.',
    text: 'ਇਹ ਪਲੇਸਹੋਲਡਰ ਦੱਸਦੇ ਹਨ ਕਿ ਕਿਹੜੀਆਂ ਫੋਟੋਆਂ ਸਾਈਟ ਨੂੰ ਸਥਾਨਕ, ਭਰੋਸੇਯੋਗ ਅਤੇ ਮਨੁੱਖੀ ਬਣਾਉਣਗੀਆਂ.',
    items: [
      { title: 'ਹਸਪਤਾਲ ਬਾਹਰੀ ਫੋਟੋ', text: 'ਬੱਸ ਸਟੈਂਡ ਰੋਡ ਤੇ ਸਾਈਨਬੋਰਡ ਅਤੇ ਦਾਖਲਾ', icon: Building2 },
      { title: 'ਡਾਕਟਰ ਪੋਰਟ੍ਰੇਟ', text: 'ਡਾ. ਰਮੇਸ਼ ਸ਼ਰਮਾ ਅਤੇ ਮੌਜੂਦਾ ਡਾਕਟਰ', icon: Stethoscope },
      { title: 'ਜਾਂਚ ਕਮਰਾ', text: 'ਅੱਖ ਜਾਂਚ ਅਤੇ ਡਾਇਗਨੋਸਟਿਕ ਉਪਕਰਣ', icon: Microscope },
      { title: 'ਸਟਾਫ ਅਤੇ ਰਿਸੈਪਸ਼ਨ', text: 'ਫਰੰਟ ਡੈਸਕ ਅਤੇ ਪ੍ਰਸ਼ਿਕਸ਼ਿਤ ਟੀਮ', icon: UsersRound },
      { title: 'ਮਰੀਜ਼ ਕੌਂਸਲਿੰਗ', text: 'ਲੈਂਸ ਵਿਕਲਪ ਅਤੇ ਸਰਜਰੀ ਸਲਾਹ', icon: ClipboardCheck },
      { title: 'ਸਮਾਜ ਸੇਵਾ', text: 'ਮੁਫ਼ਤ ਸਰਜਰੀ ਕੈਂਪ ਅਤੇ ਸੇਵਾ ਕੰਮ', icon: HeartHandshake },
    ],
    placeholder: 'ਫੋਟੋ ਪਲੇਸਹੋਲਡਰ',
    cataractCta: 'ਮੋਤੀਆਬਿੰਦ ਸਰਜਰੀ ਗਾਈਡ ਪੜ੍ਹੋ',
  },
} satisfies Record<PublicLocale, {
  badge: string
  title: string
  text: string
  items: { title: string; text: string; icon: LucideIcon }[]
  placeholder: string
  cataractCta: string
}>

export const publicContent = {
  en: {
    htmlLang: 'en',
    title: 'Sharma Eye Hospital Dhuri | Cataract Surgery & Eye Care',
    description:
      'Trusted eye hospital in Dhuri, Punjab, focused on cataract surgery, complete eye checkups, advanced equipment, and compassionate care.',
    nav: ['Cataract', 'Services', 'About', 'Contact'],
    locationKicker: 'Eye hospital on Bus Stand Road, Dhuri',
    h1: 'Trusted cataract and eye care in Dhuri.',
    intro:
      'Sharma Eye Hospital combines decades of clinical experience with advanced equipment, skilled doctors, and trained staff for families across Dhuri and nearby Punjab.',
    call: `Call ${phoneDisplay}`,
    callShort: 'Call',
    whatsapp: 'Book on WhatsApp',
    directions: 'Directions',
    proof: [
      { value: '40+', label: 'years serving Dhuri' },
      { value: '10k+', label: 'free surgeries for needy patients' },
      { value: '1', label: 'trusted local eye-care institution' },
    ],
    heroCardTitle: 'Cataract-focused care',
    heroCardText: 'Evaluation, surgery, lens guidance, follow-up',
    advanced: 'Advanced',
    equipment: 'equipment',
    trust: [
      {
        title: '40+ years of practice',
        text: 'Founded by Dr. Ramesh Sharma and built as a trusted Dhuri institution.',
      },
      {
        title: 'Modern equipment',
        text: 'Designed for accurate diagnosis, cataract planning, and safer surgical care.',
      },
      {
        title: 'Community service',
        text: 'More than 10,000 needy patients helped with free surgeries.',
      },
    ],
    specialty: 'Main specialty',
    cataractTitle: 'Cataract surgery, explained clearly before you decide.',
    cataractText:
      'Cataract makes the natural lens cloudy. Patients may notice blurred vision, glare, dull colours, or difficulty reading and driving at night. Surgery replaces the cloudy lens with an intraocular lens selected after examination and counselling.',
    symptomsTitle: 'Common cataract symptoms',
    symptoms: [
      'Blurred or cloudy vision',
      'Glare from lights at night',
      'Frequent change in glasses',
      'Colours looking faded',
    ],
    expectTitle: 'What patients can expect',
    expect: [
      'Detailed eye examination',
      'Lens option counselling',
      'Day-care surgery planning',
      'Post-surgery follow-up guidance',
    ],
    servicesTitle: 'Eye-care services for families around Dhuri.',
    servicesText:
      'Keep the first website focused on the services patients search for most, then expand with detailed guides over time.',
    services: [
      'Cataract surgery',
      'Complete eye checkup',
      'Diabetic eye screening',
      'Glaucoma screening',
      'Spectacles and optical care',
      'Red eye and infection care',
    ],
    aboutBadge: 'Dhuri roots',
    aboutTitle:
      'Built by Dr. Ramesh Sharma, serving the region for over four decades.',
    aboutText:
      'Sharma Eye Hospital was started to bring reliable eye care closer to Dhuri. The institution continues that work with experienced doctors, highly trained staff, updated technology, and a strong commitment to patients who need care but cannot always afford it.',
    story: [
      {
        title: '40+ years',
        text: 'Continuity, trust, and clinical experience in Dhuri.',
      },
      {
        title: '10,000+ free surgeries',
        text: 'A long-running commitment to helping needy patients regain sight.',
      },
      {
        title: 'Practical care',
        text: 'Clear advice, follow-up, and treatment close to home.',
      },
    ],
    guidesTitle: 'Helpful eye-care guides for patients.',
    guidesText:
      'Simple guides help patients understand symptoms, reduce fear, and make better decisions before calling or visiting.',
    guides: [
      'What is cataract and when is surgery needed?',
      'How to prepare for cataract surgery',
      'What to expect after cataract surgery',
      'Why diabetic patients need regular eye checkups',
    ],
    contactTitle: 'Visit Sharma Eye Hospital in Dhuri.',
    address:
      'Sharma Eye Hospital, Mander Enclave, Bus Stand Road, Dhuri, Punjab 148024.',
    catchment:
      'Patients from Dhuri, Sangrur, Malerkotla, Sherpur, and nearby villages can call before visiting for appointment guidance.',
    openMap: 'Open map',
    appointmentLine: 'Appointment line',
    contactRows: [
      'Call for cataract consultation',
      'Get directions to Bus Stand Road',
      "Confirm today's timings before visiting",
    ],
  },
  hi: {
    htmlLang: 'hi',
    title: 'शर्मा आई हॉस्पिटल धूरी | मोतियाबिंद ऑपरेशन और आंखों की देखभाल',
    description:
      'धूरी, पंजाब में भरोसेमंद आई हॉस्पिटल, मोतियाबिंद ऑपरेशन, आंखों की पूरी जांच, आधुनिक उपकरण और संवेदनशील देखभाल.',
    nav: ['मोतियाबिंद', 'सेवाएं', 'परिचय', 'संपर्क'],
    locationKicker: 'बस स्टैंड रोड, धूरी पर आई हॉस्पिटल',
    h1: 'धूरी में भरोसेमंद मोतियाबिंद और आंखों की देखभाल.',
    intro:
      'शर्मा आई हॉस्पिटल धूरी और आसपास के पंजाब क्षेत्र के परिवारों के लिए वर्षों का अनुभव, आधुनिक उपकरण, अनुभवी डॉक्टर और प्रशिक्षित स्टाफ साथ लाता है.',
    call: `कॉल करें ${phoneDisplay}`,
    callShort: 'कॉल',
    whatsapp: 'WhatsApp पर बुक करें',
    directions: 'रास्ता देखें',
    proof: [
      { value: '40+', label: 'वर्षों से धूरी की सेवा' },
      { value: '10k+', label: 'जरूरतमंद मरीजों की मुफ्त सर्जरी' },
      { value: '1', label: 'भरोसेमंद स्थानीय आई-केयर संस्था' },
    ],
    heroCardTitle: 'मोतियाबिंद पर केंद्रित देखभाल',
    heroCardText: 'जांच, ऑपरेशन, लेंस सलाह, फॉलो-अप',
    advanced: 'आधुनिक',
    equipment: 'उपकरण',
    trust: [
      {
        title: '40+ वर्षों की प्रैक्टिस',
        text: 'डॉ. रमेश शर्मा द्वारा शुरू किया गया और धूरी में भरोसे की संस्था के रूप में विकसित.',
      },
      {
        title: 'आधुनिक उपकरण',
        text: 'सटीक जांच, मोतियाबिंद प्लानिंग और सुरक्षित सर्जिकल केयर के लिए.',
      },
      {
        title: 'समाज सेवा',
        text: '10,000 से अधिक जरूरतमंद मरीजों की मुफ्त सर्जरी में मदद.',
      },
    ],
    specialty: 'मुख्य विशेषज्ञता',
    cataractTitle: 'मोतियाबिंद ऑपरेशन, फैसले से पहले साफ समझाइए.',
    cataractText:
      'मोतियाबिंद में आंख का प्राकृतिक लेंस धुंधला हो जाता है. मरीजों को धुंधला दिखना, रोशनी से चकाचौंध, रंग फीके लगना या रात में पढ़ने/चलाने में दिक्कत हो सकती है. ऑपरेशन में धुंधले लेंस को हटाकर जांच और सलाह के बाद चुना गया इंट्राऑक्युलर लेंस लगाया जाता है.',
    symptomsTitle: 'मोतियाबिंद के आम लक्षण',
    symptoms: [
      'धुंधला या बादल जैसा दिखना',
      'रात में रोशनी से चकाचौंध',
      'चश्मे का नंबर बार-बार बदलना',
      'रंग फीके लगना',
    ],
    expectTitle: 'मरीज क्या उम्मीद कर सकते हैं',
    expect: [
      'विस्तृत आंखों की जांच',
      'लेंस विकल्पों पर सलाह',
      'डे-केयर सर्जरी की योजना',
      'ऑपरेशन के बाद फॉलो-अप मार्गदर्शन',
    ],
    servicesTitle: 'धूरी के परिवारों के लिए आंखों की सेवाएं.',
    servicesText:
      'पहले वेबसाइट को उन सेवाओं पर केंद्रित रखें जिन्हें मरीज सबसे ज्यादा खोजते हैं, फिर समय के साथ विस्तृत गाइड जोड़ें.',
    services: [
      'मोतियाबिंद ऑपरेशन',
      'आंखों की पूरी जांच',
      'डायबिटिक आई स्क्रीनिंग',
      'ग्लूकोमा स्क्रीनिंग',
      'चश्मा और ऑप्टिकल केयर',
      'लाल आंख और संक्रमण की देखभाल',
    ],
    aboutBadge: 'धूरी से जुड़ाव',
    aboutTitle:
      'डॉ. रमेश शर्मा द्वारा स्थापित, चार दशकों से अधिक समय से क्षेत्र की सेवा.',
    aboutText:
      'शर्मा आई हॉस्पिटल की शुरुआत धूरी के करीब भरोसेमंद आंखों की देखभाल लाने के लिए हुई. आज भी यह संस्था अनुभवी डॉक्टरों, प्रशिक्षित स्टाफ, आधुनिक तकनीक और उन मरीजों के प्रति प्रतिबद्धता के साथ काम करती है जिन्हें देखभाल की जरूरत है.',
    story: [
      {
        title: '40+ वर्ष',
        text: 'धूरी में निरंतरता, भरोसा और क्लिनिकल अनुभव.',
      },
      {
        title: '10,000+ मुफ्त सर्जरी',
        text: 'जरूरतमंद मरीजों की रोशनी लौटाने की लंबी प्रतिबद्धता.',
      },
      {
        title: 'व्यावहारिक देखभाल',
        text: 'साफ सलाह, फॉलो-अप और घर के करीब इलाज.',
      },
    ],
    guidesTitle: 'मरीजों के लिए उपयोगी आंखों की जानकारी.',
    guidesText:
      'ये सरल गाइड मरीजों को लक्षण समझने, डर कम करने और कॉल या विजिट से पहले बेहतर फैसला लेने में मदद करते हैं.',
    guides: [
      'मोतियाबिंद क्या है और ऑपरेशन कब जरूरी है?',
      'मोतियाबिंद ऑपरेशन की तैयारी कैसे करें',
      'ऑपरेशन के बाद क्या उम्मीद करें',
      'डायबिटीज के मरीजों को नियमित आंख जांच क्यों चाहिए',
    ],
    contactTitle: 'धूरी में शर्मा आई हॉस्पिटल आएं.',
    address:
      'शर्मा आई हॉस्पिटल, मंदर एन्क्लेव, बस स्टैंड रोड, धूरी, पंजाब 148024.',
    catchment:
      'धूरी, संगरूर, मलेरकोटला, शेरपुर और आसपास के गांवों के मरीज आने से पहले अपॉइंटमेंट सलाह के लिए कॉल कर सकते हैं.',
    openMap: 'मैप खोलें',
    appointmentLine: 'अपॉइंटमेंट लाइन',
    contactRows: [
      'मोतियाबिंद परामर्श के लिए कॉल करें',
      'बस स्टैंड रोड का रास्ता देखें',
      'आने से पहले आज का समय कन्फर्म करें',
    ],
  },
  pa: {
    htmlLang: 'pa',
    title: 'ਸ਼ਰਮਾ ਆਈ ਹਸਪਤਾਲ ਧੂਰੀ | ਮੋਤੀਆਬਿੰਦ ਸਰਜਰੀ ਅਤੇ ਅੱਖਾਂ ਦੀ ਦੇਖਭਾਲ',
    description:
      'ਧੂਰੀ, ਪੰਜਾਬ ਵਿੱਚ ਭਰੋਸੇਯੋਗ ਆਈ ਹਸਪਤਾਲ, ਮੋਤੀਆਬਿੰਦ ਸਰਜਰੀ, ਪੂਰੀ ਅੱਖ ਜਾਂਚ, ਨਵੇਂ ਉਪਕਰਣ ਅਤੇ ਸੰਵੇਦਨਸ਼ੀਲ ਦੇਖਭਾਲ.',
    nav: ['ਮੋਤੀਆਬਿੰਦ', 'ਸੇਵਾਵਾਂ', 'ਸਾਡੇ ਬਾਰੇ', 'ਸੰਪਰਕ'],
    locationKicker: 'ਬੱਸ ਸਟੈਂਡ ਰੋਡ, ਧੂਰੀ ਉੱਤੇ ਆਈ ਹਸਪਤਾਲ',
    h1: 'ਧੂਰੀ ਵਿੱਚ ਭਰੋਸੇਯੋਗ ਮੋਤੀਆਬਿੰਦ ਅਤੇ ਅੱਖਾਂ ਦੀ ਦੇਖਭਾਲ.',
    intro:
      'ਸ਼ਰਮਾ ਆਈ ਹਸਪਤਾਲ ਧੂਰੀ ਅਤੇ ਨੇੜਲੇ ਪੰਜਾਬ ਦੇ ਪਰਿਵਾਰਾਂ ਲਈ ਦਹਾਕਿਆਂ ਦਾ ਤਜਰਬਾ, ਅਧੁਨਿਕ ਉਪਕਰਣ, ਤਜਰਬੇਕਾਰ ਡਾਕਟਰ ਅਤੇ ਪ੍ਰਸ਼ਿਕਸ਼ਿਤ ਸਟਾਫ ਇਕੱਠੇ ਲਿਆਉਂਦਾ ਹੈ.',
    call: `ਕਾਲ ਕਰੋ ${phoneDisplay}`,
    callShort: 'ਕਾਲ',
    whatsapp: 'WhatsApp ਤੇ ਬੁੱਕ ਕਰੋ',
    directions: 'ਰਸਤਾ ਵੇਖੋ',
    proof: [
      { value: '40+', label: 'ਸਾਲਾਂ ਤੋਂ ਧੂਰੀ ਦੀ ਸੇਵਾ' },
      { value: '10k+', label: 'ਲੋੜਵੰਦ ਮਰੀਜ਼ਾਂ ਦੀ ਮੁਫ਼ਤ ਸਰਜਰੀ' },
      { value: '1', label: 'ਭਰੋਸੇਯੋਗ ਸਥਾਨਕ ਆਈ-ਕੇਅਰ ਸੰਸਥਾ' },
    ],
    heroCardTitle: 'ਮੋਤੀਆਬਿੰਦ ਕੇਂਦਰਿਤ ਦੇਖਭਾਲ',
    heroCardText: 'ਜਾਂਚ, ਸਰਜਰੀ, ਲੈਂਸ ਸਲਾਹ, ਫਾਲੋ-ਅੱਪ',
    advanced: 'ਅਧੁਨਿਕ',
    equipment: 'ਉਪਕਰਣ',
    trust: [
      {
        title: '40+ ਸਾਲਾਂ ਦੀ ਪ੍ਰੈਕਟਿਸ',
        text: 'ਡਾ. ਰਮੇਸ਼ ਸ਼ਰਮਾ ਵੱਲੋਂ ਸ਼ੁਰੂ ਕੀਤੀ ਅਤੇ ਧੂਰੀ ਵਿੱਚ ਭਰੋਸੇ ਦੀ ਸੰਸਥਾ ਵਜੋਂ ਬਣੀ.',
      },
      {
        title: 'ਅਧੁਨਿਕ ਉਪਕਰਣ',
        text: 'ਸਹੀ ਜਾਂਚ, ਮੋਤੀਆਬਿੰਦ ਯੋਜਨਾ ਅਤੇ ਸੁਰੱਖਿਅਤ ਸਰਜੀਕਲ ਕੇਅਰ ਲਈ.',
      },
      {
        title: 'ਸਮਾਜ ਸੇਵਾ',
        text: '10,000 ਤੋਂ ਵੱਧ ਲੋੜਵੰਦ ਮਰੀਜ਼ਾਂ ਦੀ ਮੁਫ਼ਤ ਸਰਜਰੀ ਵਿੱਚ ਮਦਦ.',
      },
    ],
    specialty: 'ਮੁੱਖ ਵਿਸ਼ੇਸ਼ਤਾ',
    cataractTitle: 'ਮੋਤੀਆਬਿੰਦ ਸਰਜਰੀ, ਫੈਸਲੇ ਤੋਂ ਪਹਿਲਾਂ ਸਾਫ਼ ਸਮਝਾਈ ਜਾਂਦੀ ਹੈ.',
    cataractText:
      'ਮੋਤੀਆਬਿੰਦ ਵਿੱਚ ਅੱਖ ਦਾ ਕੁਦਰਤੀ ਲੈਂਸ ਧੁੰਦਲਾ ਹੋ ਜਾਂਦਾ ਹੈ. ਮਰੀਜ਼ਾਂ ਨੂੰ ਧੁੰਦਲਾ ਦਿਖਣਾ, ਰੋਸ਼ਨੀ ਨਾਲ ਚਮਕ, ਰੰਗ ਫਿੱਕੇ ਲੱਗਣਾ ਜਾਂ ਰਾਤ ਨੂੰ ਪੜ੍ਹਨ/ਗੱਡੀ ਚਲਾਉਣ ਵਿੱਚ ਦਿੱਕਤ ਹੋ ਸਕਦੀ ਹੈ. ਸਰਜਰੀ ਵਿੱਚ ਧੁੰਦਲੇ ਲੈਂਸ ਦੀ ਥਾਂ ਜਾਂਚ ਅਤੇ ਸਲਾਹ ਤੋਂ ਬਾਅਦ ਚੁਣਿਆ ਗਿਆ ਇੰਟ੍ਰਾਓਕੁਲਰ ਲੈਂਸ ਲਾਇਆ ਜਾਂਦਾ ਹੈ.',
    symptomsTitle: 'ਮੋਤੀਆਬਿੰਦ ਦੇ ਆਮ ਲੱਛਣ',
    symptoms: [
      'ਧੁੰਦਲਾ ਜਾਂ ਬੱਦਲ ਵਰਗਾ ਦਿਖਣਾ',
      'ਰਾਤ ਨੂੰ ਰੋਸ਼ਨੀ ਨਾਲ ਚਮਕ',
      'ਚਸ਼ਮੇ ਦਾ ਨੰਬਰ ਵਾਰ-ਵਾਰ ਬਦਲਣਾ',
      'ਰੰਗ ਫਿੱਕੇ ਲੱਗਣਾ',
    ],
    expectTitle: 'ਮਰੀਜ਼ ਕੀ ਉਮੀਦ ਕਰ ਸਕਦੇ ਹਨ',
    expect: [
      'ਵਿਸਥਾਰ ਨਾਲ ਅੱਖਾਂ ਦੀ ਜਾਂਚ',
      'ਲੈਂਸ ਵਿਕਲਪਾਂ ਬਾਰੇ ਸਲਾਹ',
      'ਡੇ-ਕੇਅਰ ਸਰਜਰੀ ਦੀ ਯੋਜਨਾ',
      'ਸਰਜਰੀ ਤੋਂ ਬਾਅਦ ਫਾਲੋ-ਅੱਪ ਸਲਾਹ',
    ],
    servicesTitle: 'ਧੂਰੀ ਦੇ ਪਰਿਵਾਰਾਂ ਲਈ ਅੱਖਾਂ ਦੀਆਂ ਸੇਵਾਵਾਂ.',
    servicesText:
      'ਪਹਿਲੀ ਵੈੱਬਸਾਈਟ ਨੂੰ ਉਹਨਾਂ ਸੇਵਾਵਾਂ ਉੱਤੇ ਕੇਂਦਰਿਤ ਰੱਖੋ ਜੋ ਮਰੀਜ਼ ਸਭ ਤੋਂ ਵੱਧ ਲੱਭਦੇ ਹਨ, ਫਿਰ ਸਮੇਂ ਨਾਲ ਵਿਸਥਾਰ ਵਾਲੇ ਗਾਈਡ ਸ਼ਾਮਲ ਕਰੋ.',
    services: [
      'ਮੋਤੀਆਬਿੰਦ ਸਰਜਰੀ',
      'ਪੂਰੀ ਅੱਖ ਜਾਂਚ',
      'ਡਾਇਬਿਟਿਕ ਆਈ ਸਕ੍ਰੀਨਿੰਗ',
      'ਗਲੂਕੋਮਾ ਸਕ੍ਰੀਨਿੰਗ',
      'ਚਸ਼ਮਾ ਅਤੇ ਆਪਟਿਕਲ ਕੇਅਰ',
      'ਲਾਲ ਅੱਖ ਅਤੇ ਇਨਫੈਕਸ਼ਨ ਦੀ ਦੇਖਭਾਲ',
    ],
    aboutBadge: 'ਧੂਰੀ ਨਾਲ ਜੁੜਾਵ',
    aboutTitle:
      'ਡਾ. ਰਮੇਸ਼ ਸ਼ਰਮਾ ਵੱਲੋਂ ਬਣਾਈ ਸੰਸਥਾ, ਚਾਰ ਦਹਾਕਿਆਂ ਤੋਂ ਵੱਧ ਖੇਤਰ ਦੀ ਸੇਵਾ.',
    aboutText:
      'ਸ਼ਰਮਾ ਆਈ ਹਸਪਤਾਲ ਦੀ ਸ਼ੁਰੂਆਤ ਧੂਰੀ ਦੇ ਨੇੜੇ ਭਰੋਸੇਯੋਗ ਅੱਖਾਂ ਦੀ ਦੇਖਭਾਲ ਲਿਆਉਣ ਲਈ ਹੋਈ. ਇਹ ਸੰਸਥਾ ਅੱਜ ਵੀ ਤਜਰਬੇਕਾਰ ਡਾਕਟਰਾਂ, ਪ੍ਰਸ਼ਿਕਸ਼ਿਤ ਸਟਾਫ, ਅਪਡੇਟ ਤਕਨਾਲੋਜੀ ਅਤੇ ਲੋੜਵੰਦ ਮਰੀਜ਼ਾਂ ਪ੍ਰਤੀ ਵਚਨਬੱਧਤਾ ਨਾਲ ਕੰਮ ਕਰਦੀ ਹੈ.',
    story: [
      {
        title: '40+ ਸਾਲ',
        text: 'ਧੂਰੀ ਵਿੱਚ ਲਗਾਤਾਰ ਸੇਵਾ, ਭਰੋਸਾ ਅਤੇ ਕਲੀਨਿਕਲ ਤਜਰਬਾ.',
      },
      {
        title: '10,000+ ਮੁਫ਼ਤ ਸਰਜਰੀਆਂ',
        text: 'ਲੋੜਵੰਦ ਮਰੀਜ਼ਾਂ ਦੀ ਰੋਸ਼ਨੀ ਵਾਪਸ ਲਿਆਉਣ ਲਈ ਲੰਬੀ ਵਚਨਬੱਧਤਾ.',
      },
      {
        title: 'ਵਿਹਾਰਕ ਦੇਖਭਾਲ',
        text: 'ਸਾਫ਼ ਸਲਾਹ, ਫਾਲੋ-ਅੱਪ ਅਤੇ ਘਰ ਦੇ ਨੇੜੇ ਇਲਾਜ.',
      },
    ],
    guidesTitle: 'ਮਰੀਜ਼ਾਂ ਲਈ ਲਾਭਦਾਇਕ ਅੱਖਾਂ ਦੀ ਜਾਣਕਾਰੀ.',
    guidesText:
      'ਇਹ ਸੌਖੇ ਗਾਈਡ ਮਰੀਜ਼ਾਂ ਨੂੰ ਲੱਛਣ ਸਮਝਣ, ਡਰ ਘਟਾਉਣ ਅਤੇ ਕਾਲ ਜਾਂ ਵਿਜ਼ਿਟ ਤੋਂ ਪਹਿਲਾਂ ਵਧੀਆ ਫੈਸਲਾ ਲੈਣ ਵਿੱਚ ਮਦਦ ਕਰਦੇ ਹਨ.',
    guides: [
      'ਮੋਤੀਆਬਿੰਦ ਕੀ ਹੈ ਅਤੇ ਸਰਜਰੀ ਕਦੋਂ ਲੋੜੀਂਦੀ ਹੈ?',
      'ਮੋਤੀਆਬਿੰਦ ਸਰਜਰੀ ਲਈ ਤਿਆਰੀ ਕਿਵੇਂ ਕਰੀਏ',
      'ਸਰਜਰੀ ਤੋਂ ਬਾਅਦ ਕੀ ਉਮੀਦ ਕਰੀਏ',
      'ਡਾਇਬਿਟੀਜ਼ ਮਰੀਜ਼ਾਂ ਨੂੰ ਨਿਯਮਿਤ ਅੱਖ ਜਾਂਚ ਕਿਉਂ ਚਾਹੀਦੀ ਹੈ',
    ],
    contactTitle: 'ਧੂਰੀ ਵਿੱਚ ਸ਼ਰਮਾ ਆਈ ਹਸਪਤਾਲ ਆਓ.',
    address:
      'ਸ਼ਰਮਾ ਆਈ ਹਸਪਤਾਲ, ਮੰਦਰ ਐਨਕਲੇਵ, ਬੱਸ ਸਟੈਂਡ ਰੋਡ, ਧੂਰੀ, ਪੰਜਾਬ 148024.',
    catchment:
      'ਧੂਰੀ, ਸੰਗਰੂਰ, ਮਲੇਰਕੋਟਲਾ, ਸ਼ੇਰਪੁਰ ਅਤੇ ਨੇੜਲੇ ਪਿੰਡਾਂ ਦੇ ਮਰੀਜ਼ ਆਉਣ ਤੋਂ ਪਹਿਲਾਂ ਅਪਾਇੰਟਮੈਂਟ ਸਲਾਹ ਲਈ ਕਾਲ ਕਰ ਸਕਦੇ ਹਨ.',
    openMap: 'ਮੈਪ ਖੋਲ੍ਹੋ',
    appointmentLine: 'ਅਪਾਇੰਟਮੈਂਟ ਲਾਈਨ',
    contactRows: [
      'ਮੋਤੀਆਬਿੰਦ ਸਲਾਹ ਲਈ ਕਾਲ ਕਰੋ',
      'ਬੱਸ ਸਟੈਂਡ ਰੋਡ ਦਾ ਰਸਤਾ ਵੇਖੋ',
      'ਆਉਣ ਤੋਂ ਪਹਿਲਾਂ ਅੱਜ ਦਾ ਸਮਾਂ ਕਨਫਰਮ ਕਰੋ',
    ],
  },
} satisfies Record<PublicLocale, {
  htmlLang: string
  title: string
  description: string
  nav: string[]
  locationKicker: string
  h1: string
  intro: string
  call: string
  callShort: string
  whatsapp: string
  directions: string
  proof: { value: string; label: string }[]
  heroCardTitle: string
  heroCardText: string
  advanced: string
  equipment: string
  trust: { title: string; text: string }[]
  specialty: string
  cataractTitle: string
  cataractText: string
  symptomsTitle: string
  symptoms: string[]
  expectTitle: string
  expect: string[]
  servicesTitle: string
  servicesText: string
  services: string[]
  aboutBadge: string
  aboutTitle: string
  aboutText: string
  story: { title: string; text: string }[]
  guidesTitle: string
  guidesText: string
  guides: string[]
  contactTitle: string
  address: string
  catchment: string
  openMap: string
  appointmentLine: string
  contactRows: string[]
}>

export function PublicHomePage({ locale }: { locale: PublicLocale }) {
  const content = publicContent[locale]
  const visuals = visualContent[locale]
  const paths = localizedPaths[locale]
  const [cataractNav, servicesNav, aboutNav, contactNav] = content.nav

  return (
    <main lang={content.htmlLang} className="min-h-dvh bg-[#fbfcf7] text-ink-900">
      <header className="sticky top-0 z-30 border-b border-[#dfe7d5] bg-[#fbfcf7]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href={paths.home} className="flex min-w-0 items-center gap-3">
            <Logo size={40} halo />
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[15px] font-semibold text-ink-900">
                Sharma Eye Hospital
              </div>
              <div className="text-[12px] font-medium text-ink-500">
                Dhuri, Punjab
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-[13px] font-medium text-ink-600 lg:flex">
            <a href="#cataract" className="hover:text-brand-700">{cataractNav}</a>
            <a href="#services" className="hover:text-brand-700">{servicesNav}</a>
            <a href="#about" className="hover:text-brand-700">{aboutNav}</a>
            <a href="#contact" className="hover:text-brand-700">{contactNav}</a>
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden rounded-full border border-[#dfe7d5] bg-white p-1 sm:flex">
              {languageOptions.map((option) => (
                <Link
                  key={option.locale}
                  href={option.href}
                  className={
                    option.locale === locale
                      ? 'rounded-full bg-brand-700 px-3 py-1.5 text-[12px] font-semibold text-white'
                      : 'rounded-full px-3 py-1.5 text-[12px] font-semibold text-ink-500 hover:text-brand-700'
                  }
                  hrefLang={option.locale}
                >
                  {option.label}
                </Link>
              ))}
            </div>
            <a
              href={phoneHref}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-brand-700 px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-brand-800"
            >
              <Phone size={16} />
              <span className="hidden sm:inline">{content.callShort}</span>
            </a>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 sm:hidden">
          {languageOptions.map((option) => (
            <Link
              key={option.locale}
              href={option.href}
              className={
                option.locale === locale
                  ? 'rounded-full bg-brand-700 px-3 py-1.5 text-[12px] font-semibold text-white'
                  : 'rounded-full border border-[#dfe7d5] bg-white px-3 py-1.5 text-[12px] font-semibold text-ink-600'
              }
              hrefLang={option.locale}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#dfe7d5]">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(120deg, rgba(251,252,247,1) 0%, rgba(241,247,231,0.94) 48%, rgba(232,239,248,0.88) 100%)',
          }}
        />
        <div aria-hidden className="absolute -right-28 top-16 h-[420px] w-[420px] rounded-full border border-brand-200/70" />
        <div aria-hidden className="absolute -right-8 top-36 h-[250px] w-[250px] rounded-full border border-accent-200/80" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-18 lg:grid-cols-[1.04fr_0.96fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1.5 text-[12px] font-semibold text-brand-700 shadow-sm">
              <MapPin size={14} />
              {content.locationKicker}
            </div>
            <h1 className="max-w-3xl text-[42px] font-semibold leading-[1.04] tracking-normal text-ink-900 sm:text-[58px] lg:text-[68px]">
              {content.h1}
            </h1>
            <p className="mt-6 max-w-2xl text-[17px] leading-8 text-ink-600 sm:text-[18px]">
              {content.intro}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={phoneHref} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-700 px-5 text-[14px] font-semibold text-white shadow-lift transition hover:bg-brand-800">
                <Phone size={18} />
                {content.call}
              </a>
              <a href={whatsappHref} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white px-5 text-[14px] font-semibold text-brand-800 shadow-soft transition hover:border-brand-300">
                {content.whatsapp}
                <ArrowRight size={17} />
              </a>
              <a href={directionsHref} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#d9e2ce] bg-white/70 px-5 text-[14px] font-semibold text-ink-700 transition hover:bg-white">
                <MapPin size={17} />
                {content.directions}
              </a>
            </div>
          </div>

          <div className="relative min-h-[440px] overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_24px_80px_-38px_rgba(49,72,130,0.45)]">
            <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(61,90,160,0.08),rgba(76,184,53,0.08))]" />
            <div className="absolute left-8 top-8 rounded-2xl border border-white/80 bg-white/82 p-5 shadow-glass backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <Eye size={23} />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-ink-900">
                    {content.heroCardTitle}
                  </div>
                  <div className="text-[12px] text-ink-500">
                    {content.heroCardText}
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="rounded-2xl border border-white/80 bg-white/88 p-5 shadow-glass backdrop-blur">
                <div className="grid grid-cols-3 gap-3">
                  {content.proof.map((point) => (
                    <div key={point.label} className="rounded-xl bg-[#f6f8f0] p-4">
                      <div className="text-[25px] font-semibold tracking-normal text-brand-800">
                        {point.value}
                      </div>
                      <div className="mt-1 text-[11.5px] leading-4 text-ink-500">
                        {point.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute right-8 top-32 hidden h-44 w-44 items-center justify-center rounded-full bg-brand-700 text-white shadow-lift sm:flex">
              <div className="text-center">
                <Sparkles className="mx-auto mb-2" size={28} />
                <div className="text-[13px] font-semibold">{content.advanced}</div>
                <div className="text-[12px] text-white/78">{content.equipment}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#dfe7d5] bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-3 sm:px-6 lg:px-8">
          <TrustItem icon={Award} {...content.trust[0]} />
          <TrustItem icon={Microscope} {...content.trust[1]} />
          <TrustItem icon={HeartHandshake} {...content.trust[2]} />
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[12px] font-semibold text-brand-700">
                <Camera size={14} />
                {visuals.badge}
              </div>
              <h2 className="text-[32px] font-semibold leading-tight tracking-normal sm:text-[42px]">
                {visuals.title}
              </h2>
              <p className="mt-4 text-[15.5px] leading-7 text-ink-600">
                {visuals.text}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visuals.items.map((item) => (
                <PhotoPlaceholder
                  key={item.title}
                  icon={item.icon}
                  title={item.title}
                  text={item.text}
                  label={visuals.placeholder}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="cataract" className="bg-[#fbfcf7]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent-100 px-3 py-1 text-[12px] font-semibold text-accent-700">
              <Stethoscope size={14} />
              {content.specialty}
            </div>
            <h2 className="text-[34px] font-semibold leading-tight tracking-normal sm:text-[44px]">
              {content.cataractTitle}
            </h2>
            <p className="mt-5 text-[16px] leading-8 text-ink-600">
              {content.cataractText}
            </p>
            <Link
              href={paths.cataract}
              className="mt-7 inline-flex h-11 items-center gap-2 rounded-lg bg-brand-700 px-4 text-[13.5px] font-semibold text-white transition hover:bg-brand-800"
            >
              {visuals.cataractCta}
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoPanel title={content.symptomsTitle} items={content.symptoms} />
            <InfoPanel title={content.expectTitle} items={content.expect} />
          </div>
        </div>
      </section>

      <section id="services" className="bg-brand-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <h2 className="text-[32px] font-semibold tracking-normal text-white sm:text-[42px]">
                {content.servicesTitle}
              </h2>
              <p className="mt-4 text-[15.5px] leading-7 text-white/72">
                {content.servicesText}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {content.services.map((service) => (
                <div key={service} className="rounded-lg border border-white/12 bg-white/7 p-4">
                  <CheckCircle2 className="mb-4 text-accent-200" size={22} />
                  <div className="text-[15px] font-semibold text-white">{service}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-20">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[12px] font-semibold text-brand-700">
              <ShieldCheck size={14} />
              {content.aboutBadge}
            </div>
            <h2 className="text-[34px] font-semibold leading-tight tracking-normal sm:text-[44px]">
              {content.aboutTitle}
            </h2>
            <p className="mt-5 text-[16px] leading-8 text-ink-600">
              {content.aboutText}
            </p>
          </div>
          <div className="grid content-start gap-4">
            <StoryMetric icon={Clock} {...content.story[0]} />
            <StoryMetric icon={HeartHandshake} {...content.story[1]} />
            <StoryMetric icon={CalendarCheck} {...content.story[2]} />
          </div>
        </div>
      </section>

      <section className="border-y border-[#dfe7d5] bg-[#f4f8ec]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-[32px] font-semibold tracking-normal sm:text-[40px]">
              {content.guidesTitle}
            </h2>
            <p className="mt-4 text-[15.5px] leading-7 text-ink-600">
              {content.guidesText}
            </p>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {content.guides.map((guide, index) => (
              <Link key={guide} href={index === 0 ? paths.cataract : '#contact'} className="flex items-center justify-between gap-4 rounded-lg border border-[#d8e3cc] bg-white px-5 py-4 transition hover:border-brand-300">
                <span className="text-[15px] font-semibold text-ink-800">{guide}</span>
                <ArrowRight className="shrink-0 text-brand-600" size={18} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8 lg:py-20">
          <div>
            <h2 className="text-[34px] font-semibold tracking-normal sm:text-[44px]">
              {content.contactTitle}
            </h2>
            <div className="mt-6 space-y-4 text-[15.5px] leading-7 text-ink-600">
              <p>{content.address}</p>
              <p>{content.catchment}</p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={phoneHref} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-700 px-5 text-[14px] font-semibold text-white transition hover:bg-brand-800">
                <Phone size={18} />
                {phoneDisplay}
              </a>
              <a href={directionsHref} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-hairline bg-white px-5 text-[14px] font-semibold text-ink-800 transition hover:border-brand-300">
                <MapPin size={18} />
                {content.openMap}
              </a>
            </div>
          </div>

          <div className="rounded-[24px] border border-hairline bg-[#fbfcf7] p-5 shadow-soft">
            <div className="rounded-2xl border border-[#dfe7d5] bg-white p-6">
              <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                {content.appointmentLine}
              </div>
              <div className="mt-3 text-[30px] font-semibold tracking-normal text-brand-800">
                {phoneDisplay}
              </div>
              <div className="mt-5 grid gap-3">
                <ContactRow icon={Phone} label={content.contactRows[0]} />
                <ContactRow icon={MapPin} label={content.contactRows[1]} />
                <ContactRow icon={Clock} label={content.contactRows[2]} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function TrustItem({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon
  title: string
  text: string
}) {
  return (
    <div className="flex gap-4 rounded-lg bg-[#fbfcf7] p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
        <Icon size={22} />
      </div>
      <div>
        <div className="text-[15px] font-semibold text-ink-900">{title}</div>
        <p className="mt-1 text-[13px] leading-5 text-ink-500">{text}</p>
      </div>
    </div>
  )
}

function InfoPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[18px] border border-[#dfe7d5] bg-white p-6 shadow-soft">
      <h3 className="text-[18px] font-semibold tracking-normal">{title}</h3>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-[14.5px] leading-6 text-ink-600">
            <CheckCircle2 className="mt-0.5 shrink-0 text-accent-600" size={18} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PhotoPlaceholder({
  icon: Icon,
  title,
  text,
  label,
}: {
  icon: LucideIcon
  title: string
  text: string
  label: string
}) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-[#dfe7d5] bg-[#fbfcf7] shadow-soft">
      <div className="relative flex aspect-[4/3] items-center justify-center bg-[linear-gradient(135deg,#eef4e7,#e8edf8)]">
        <div
          aria-hidden
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(49,72,130,0.10) 1px, transparent 1px), linear-gradient(rgba(49,72,130,0.08) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/86 text-brand-700 shadow-glass">
          <Icon size={30} />
        </div>
        <div className="absolute bottom-3 left-3 rounded-full bg-white/86 px-3 py-1 text-[11px] font-semibold text-ink-500 shadow-soft">
          {label}
        </div>
      </div>
      <div className="p-4">
        <div className="text-[15px] font-semibold text-ink-900">{title}</div>
        <p className="mt-1 text-[12.8px] leading-5 text-ink-500">{text}</p>
      </div>
    </div>
  )
}

function StoryMetric({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon
  title: string
  text: string
}) {
  return (
    <div className="flex gap-4 rounded-[18px] border border-hairline bg-[#fbfcf7] p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 shadow-soft">
        <Icon size={23} />
      </div>
      <div>
        <div className="text-[17px] font-semibold text-ink-900">{title}</div>
        <p className="mt-1 text-[13.5px] leading-6 text-ink-500">{text}</p>
      </div>
    </div>
  )
}

function ContactRow({
  icon: Icon,
  label,
}: {
  icon: LucideIcon
  label: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-[#f6f8f0] px-4 py-3 text-[14px] font-medium text-ink-700">
      <Icon size={18} className="text-brand-700" />
      <span>{label}</span>
    </div>
  )
}
