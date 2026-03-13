import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "nav": {
        "home": "Home",
        "findJobs": "Find Jobs",
        "browseWorkers": "Browse Workers",
        "howItWorks": "How It Works",
        "registerWorker": "Register as Worker",
        "postJob": "Post a Job",
        "dashboard": "Dashboard",
        "myProfile": "My Profile",
        "logout": "Logout",
        "login": "Login"
      },
      "hero": {
        "title": "Daksh-Bharat",
        "subtitle": "कुशल भारत, सशक्त भारत",
        "tagline": "India's first skill-verified labor exchange platform.",
        "description": "Connecting verified rural talent with local opportunities — digitally, transparently, and fairly.",
        "cta_worker": "I want Work",
        "cta_employer": "I want to Hire"
      },
      "browse": {
        "title": "Browse Skilled Workers",
        "subtitle": "Find the right talent for your project with verified skills",
        "search_placeholder": "Search by name or skill...",
        "filters": "Filters",
        "trade_category": "Trade Category",
        "min_score": "Min Daksh Score",
        "availability": "Availability",
        "view_list": "List View",
        "view_map": "Map View",
        "view_profile": "View Profile",
        "whatsapp": "WhatsApp",
        "no_workers": "No workers found",
        "adjust_filters": "Try adjusting your filters or search term"
      },
      "jobs": {
        "title": "Available Jobs Near You",
        "search_placeholder": "Search by title or city...",
        "filter_all": "All Trades",
        "apply_now": "Apply Now",
        "loading": "Finding opportunities...",
        "no_jobs": "No jobs found",
        "adjust_filters": "Try adjusting your filters or search term",
        "near_me": "Near Me",
        "view_details": "View Details",
        "per_day": "per day",
        "verified_employer": "Verified Employer"
      }
    }
  },
  hi: {
    translation: {
      "nav": {
        "home": "होम",
        "findJobs": "काम खोजें",
        "browseWorkers": "श्रमिक खोजें",
        "howItWorks": "यह कैसे काम करता है",
        "registerWorker": "श्रमिक के रूप में पंजीकरण करें",
        "postJob": "काम पोस्ट करें",
        "dashboard": "डैशबोर्ड",
        "myProfile": "मेरी प्रोफाइल",
        "logout": "लॉगआउट",
        "login": "लॉगिन"
      },
      "hero": {
        "title": "दक्ष-भारत",
        "subtitle": "कुशल भारत, सशक्त भारत",
        "tagline": "भारत का पहला कौशल-सत्यापित श्रम विनिमय मंच।",
        "description": "सत्यापित ग्रामीण प्रतिभाओं को स्थानीय अवसरों से जोड़ना - डिजिटल, पारदर्शी और निष्पक्ष रूप से।",
        "cta_worker": "मुझे काम चाहिए",
        "cta_employer": "मुझे काम पर रखना है"
      },
      "browse": {
        "title": "कुशल श्रमिकों को खोजें",
        "subtitle": "सत्यापित कौशल के साथ अपनी परियोजना के लिए सही प्रतिभा खोजें",
        "search_placeholder": "नाम या कौशल से खोजें...",
        "filters": "फिल्टर",
        "trade_category": "व्यापार श्रेणी",
        "min_score": "न्यूनतम दक्ष स्कोर",
        "availability": "उपलब्धता",
        "view_list": "सूची दृश्य",
        "view_map": "मानचित्र दृश्य",
        "view_profile": "प्रोफ़ाइल देखें",
        "whatsapp": "व्हाट्सएप",
        "no_workers": "कोई श्रमिक नहीं मिला",
        "adjust_filters": "अपने फ़िल्टर या खोज शब्द को समायोजित करने का प्रयास करें"
      },
      "jobs": {
        "title": "आपके पास उपलब्ध नौकरियां",
        "search_placeholder": "शीर्षक या शहर से खोजें...",
        "filter_all": "सभी व्यापार",
        "apply_now": "अभी आवेदन करें",
        "loading": "अवसर खोज रहे हैं...",
        "no_jobs": "कोई नौकरी नहीं मिली",
        "adjust_filters": "अपने फ़िल्टर या खोज शब्द को समायोजित करने का प्रयास करें",
        "near_me": "मेरे पास",
        "view_details": "विवरण देखें",
        "per_day": "प्रति दिन",
        "verified_employer": "सत्यापित नियोक्ता"
      }
    }
  },
  mr: {
    translation: {
      "nav": {
        "home": "होम",
        "findJobs": "काम शोधा",
        "browseWorkers": "कामगार शोधा",
        "howItWorks": "हे कसे कार्य करते",
        "registerWorker": "कामगार म्हणून नोंदणी करा",
        "postJob": "काम पोस्ट करा",
        "dashboard": "डॅशबोर्ड",
        "myProfile": "माझी प्रोफाइल",
        "logout": "लॉगआउट"
      },
      "hero": {
        "title": "दक्ष-भारत",
        "subtitle": "कुशल भारत, सशक्त भारत",
        "tagline": "भारतातील पहिले कौशल्य-सत्यापित श्रम विनिमय प्लॅटफॉर्म.",
        "description": "सत्यापित ग्रामीण प्रतिभांना स्थानिक संधींशी जोडणे - डिजिटल, पारदर्शक आणि न्याय्य पद्धतीने।",
        "cta_worker": "मला काम हवे आहे",
        "cta_employer": "मला कामावर घ्यायचे आहे"
      },
      "browse": {
        "title": "कुशल कामगार शोधा",
        "subtitle": "सत्यापित कौशल्यासह आपल्या प्रकल्पासाठी योग्य प्रतिभा शोधा",
        "search_placeholder": "नाव किंवा कौशल्याने शोधा...",
        "filters": "फिल्टर",
        "trade_category": "व्यापार श्रेणी",
        "min_score": "किमान दक्ष स्कोर",
        "availability": "उपलब्धता",
        "view_list": "सूची दृश्य",
        "view_map": "नकाशा दृश्य",
        "view_profile": "प्रोफाइल पहा",
        "whatsapp": "व्हॉट्सअॅप",
        "no_workers": "कोणतेही कामगार आढळले नाहीत",
        "adjust_filters": "आपले फिल्टर किंवा शोध शब्द समायोजित करण्याचा प्रयत्न करा"
      },
      "jobs": {
        "title": "तुमच्या जवळ उपलब्ध नोकऱ्या",
        "search_placeholder": "शीर्षक किंवा शहराद्वारे शोधा...",
        "filter_all": "सर्व व्यापार",
        "apply_now": "आता अर्ज करा",
        "loading": "संधी शोधत आहे...",
        "no_jobs": "कोणतीही नोकरी आढळली नाही",
        "adjust_filters": "आपले फिल्टर किंवा शोध शब्द समायोजित करण्याचा प्रयत्न करा",
        "near_me": "माझ्या जवळ",
        "view_details": "तपशील पहा",
        "per_day": "दररोज",
        "verified_employer": "सत्यापित नियोक्ता"
      }
    }
  },
  gu: {
    translation: {
      "nav": {
        "home": "હોમ",
        "findJobs": "કામ શોધો",
        "browseWorkers": "કામદારો શોધો",
        "howItWorks": "તે કેવી રીતે કામ કરે છે",
        "registerWorker": "કામદાર તરીકે નોંધણી કરો",
        "postJob": "કામ પોસ્ટ કરો",
        "dashboard": "ડેશબોર્ડ",
        "myProfile": "મારી પ્રોફાઇલ",
        "logout": "લોગઆઉટ"
      },
      "hero": {
        "title": "દક્ષ-ભારત",
        "subtitle": "કુશળ ભારત, સશક્ત ભારત",
        "tagline": "ભારતનું પ્રથમ કૌશલ્ય-ચકાસાયેલ શ્રમ વિનિમય પ્લેટફોર્મ.",
        "description": "ચકાસાયેલ ગ્રામીણ પ્રતિભાને સ્થાનિક તકો સાથે જોડવી - ડિજિટલ, પારદર્શક અને ન્યાયી રીતે।",
        "cta_worker": "મારે કામ જોઈએ છે",
        "cta_employer": "મારે હાયર કરવું છે"
      },
      "browse": {
        "title": "કુશળ કામદારો શોધો",
        "subtitle": "ચકાસાયેલ કુશળતા સાથે તમારા પ્રોજેક્ટ માટે યોગ્ય પ્રતિભા શોધો",
        "search_placeholder": "નામ અથવા કૌશલ્ય દ્વારા શોધો...",
        "filters": "ફિલ્ટર્સ",
        "trade_category": "વેપાર શ્રેણી",
        "min_score": "ન્યૂનતમ દક્ષ સ્કોર",
        "availability": "ઉપલબ્ધતા",
        "view_list": "સૂચિ દૃશ્ય",
        "view_map": "નકશા દૃશ્ય",
        "view_profile": "પ્રોફાઇલ જુઓ",
        "whatsapp": "વોટ્સએપ",
        "no_workers": "કોઈ કામદારો મળ્યા નથી",
        "adjust_filters": "તમારા ફિલ્ટર્સ અથવા શોધ શબ્દને સમાયોજિત કરવાનો પ્રયાસ કરો"
      },
      "jobs": {
        "title": "તમારી નજીક ઉપલબ્ધ નોકરીઓ",
        "search_placeholder": "શીર્ષક અથવા શહેર દ્વારા શોધો...",
        "filter_all": "બધા વેપાર",
        "apply_now": "હમણાં જ અરજી કરો",
        "loading": "તકો શોધી રહ્યા છીએ...",
        "no_jobs": "કોઈ નોકરી મળી નથી",
        "adjust_filters": "તમારા ફિલ્ટર્સ અથવા શોધ શબ્દને સમાયોજિત કરવાનો પ્રયાસ કરો",
        "near_me": "મારી નજીક",
        "view_details": "વિગતો જુઓ",
        "per_day": "દરરોજ",
        "verified_employer": "ચકાસાયેલ એમ્પ્લોયર"
      }
    }
  },
  kn: {
    translation: {
      "nav": {
        "home": "ಹೋಮ್",
        "findJobs": "ಕೆಲಸ ಹುಡುಕಿ",
        "browseWorkers": "ಕೆಲಸಗಾರರನ್ನು ಹುಡುಕಿ",
        "howItWorks": "ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ",
        "registerWorker": "ಕೆಲಸಗಾರನಾಗಿ ನೋಂದಾಯಿಸಿ",
        "postJob": "ಕೆಲಸ ಪೋಸ್ಟ್ ಮಾಡಿ",
        "dashboard": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
        "myProfile": "ನನ್ನ ಪ್ರೊಫೈಲ್",
        "logout": "ಲಾಗ್ ಔಟ್"
      },
      "hero": {
        "title": "ದಕ್ಷ-ಭಾರತ",
        "subtitle": "ಕುಶಲ ಭಾರತ, ಸಶಕ್ತ ಭಾರತ",
        "tagline": "ಭಾರತದ ಮೊದಲ ಕೌಶಲ್ಯ-ಪರಿಶೀಲಿತ ಕಾರ್ಮಿಕ ವಿನಿಮಯ ವೇದಿಕೆ.",
        "description": "ಪರಿಶೀಲಿಸಿದ ಗ್ರಾಮೀಣ ಪ್ರತಿಭೆಯನ್ನು ಸ್ಥಳೀಯ ಅವಕಾಶಗಳೊಂದಿಗೆ ಸಂಪರ್ಕಿಸುವುದು - ಡಿಜಿಟಲ್, ಪಾರದರ್ಶಕ ಮತ್ತು ನ್ಯಾಯಯುತವಾಗಿ।",
        "cta_worker": "ನನಗೆ ಕೆಲಸ ಬೇಕು",
        "cta_employer": "ನಾನು ನೇಮಿಸಿಕೊಳ್ಳಲು ಬಯಸುತ್ತೇನೆ"
      },
      "browse": {
        "title": "ಕುಶಲ ಕಾರ್ಮಿಕರನ್ನು ಹುಡುಕಿ",
        "subtitle": "ಪರಿಶೀಲಿಸಿದ ಕೌಶಲ್ಯಗಳೊಂದಿಗೆ ನಿಮ್ಮ ಯೋಜನೆಗೆ ಸರಿಯಾದ ಪ್ರತಿಭೆಯನ್ನು ಹುಡುಕಿ",
        "search_placeholder": "ಹೆಸರು ಅಥವಾ ಕೌಶಲ್ಯದ ಮೂಲಕ ಹುಡುಕಿ...",
        "filters": "ಫಿಲ್ಟರ್‌ಗಳು",
        "trade_category": "ವ್ಯಾಪಾರ ವರ್ಗ",
        "min_score": "ಕನಿಷ್ಠ ದಕ್ಷ ಸ್ಕೋರ್",
        "availability": "ಲಭ್ಯತೆ",
        "view_list": "ಪಟ್ಟಿ ನೋಟ",
        "view_map": "ನಕ್ಷೆ ನೋಟ",
        "view_profile": "ಪ್ರೊಫೈಲ್ ವೀಕ್ಷಿಸಿ",
        "whatsapp": "ವಾಟ್ಸಾಪ್",
        "no_workers": "ಯಾವುದೇ ಕಾರ್ಮಿಕರು ಕಂಡುಬಂದಿಲ್ಲ",
        "adjust_filters": "ನಿಮ್ಮ ಫಿಲ್ಟರ್‌ಗಳು ಅಥವಾ ಹುಡುಕಾಟ ಪದವನ್ನು ಹೊಂದಿಸಲು ಪ್ರಯತ್ನಿಸಿ"
      },
      "jobs": {
        "title": "ನಿಮ್ಮ ಹತ್ತಿರ ಲಭ್ಯವಿರುವ ಉದ್ಯೋಗಗಳು",
        "search_placeholder": "ಶೀರ್ಷಿಕೆ ಅಥವಾ ನಗರದ ಮೂಲಕ ಹುಡುಕಿ...",
        "filter_all": "ಎಲ್ಲಾ ವ್ಯಾಪಾರಗಳು",
        "apply_now": "ಈಗ ಅನ್ವಯಿಸಿ",
        "loading": "ಅವಕಾಶಗಳನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ...",
        "no_jobs": "ಯಾವುದೇ ಉದ್ಯೋಗಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
        "adjust_filters": "ನಿಮ್ಮ ಫಿಲ್ಟರ್‌ಗಳು ಅಥವಾ ಹುಡುಕಾಟ ಪದವನ್ನು ಹೊಂದಿಸಲು ಪ್ರಯತ್ನಿಸಿ",
        "near_me": "ನನ್ನ ಹತ್ತಿರ",
        "view_details": "ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
        "per_day": "ಪ್ರತಿದಿನ",
        "verified_employer": "ಪರಿಶೀಲಿಸಿದ ಉದ್ಯೋಗದಾತ"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
