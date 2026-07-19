# 🌙 moon · تقويم هجري وميلادي

تطبيق تقويم احترافي يعتمد على **تقويم أم القرى** الرسمي المعتمد في المملكة العربية السعودية، مع نظام كامل لإدارة المواعيد والإشعارات وتحويل التواريخ.

## ✨ المميزات

- 📅 **تقويم هجري (أم القرى)** بدقة عالية جداً — مغطى من ١٣٥٦ هـ إلى ١٥٠٠ هـ
- 🗓️ **تقويم ميلادي** مع التبديل الفوري بين النظامين
- 🔄 **محول تاريخ** في الاتجاهين (ميلادي ↔ هجري)
- ⏰ **إدارة مواعيد** كاملة (إضافة / تعديل / حذف) مع تصنيفات ملوّنة
- 🔔 **إشعارات المتصفح** للتذكير بالمواعيد قبل وقتها
- 📥📤 **استيراد وتصدير** بصيغة iCalendar (.ics) — متوافق مع Google Calendar و Apple Calendar و Outlook
- 💾 **نسخ احتياطية JSON** لحفظ بياناتك
- 📅 **عداد الأيام المتبقية** لكل موعد مع تنسيق لوني حسب القرب
- 📱 **تطبيق PWA** — يعمل بدون إنترنت، قابل للتثبيت على الأجهزة، يصلح كتطبيق Android عبر Google Play
- 🎨 **تصميم كلاسيكي** بألوان أخضر زمردي + ذهبي + كريمي
- 🇸🇦 **دعم كامل للعربية** مع الأرقام العربية-الهندية و RTL
- 📐 **خط Amiri** للعناوين (كلاسيكي وراقي) + Tajawal للواجهة

## 🚀 التشغيل السريع

### محلياً
التطبيق عبارة عن **صفحات ويب ثابتة** بدون أي backend. شغّله بأي خادم HTTP بسيط:

```bash
# Python (الأسهل)
cd moon-calendar
python -m http.server 8000

# أو Node.js
npx http-server -p 8000

# أو PHP
php -S localhost:8000
```

ثم افتح المتصفح على: `http://localhost:8000`

> 💡 **ملاحظة:** بعض المتصفحات تقيّد الـ Service Worker على `file://`، فافتح التطبيق عبر `http://` أو `https://` دائماً.

## 📤 النشر على GitHub Pages

### ١. أنشئ مستودع جديد على GitHub
- اذهب إلى [github.com/new](https://github.com/new)
- سمّه مثلاً `moon-calendar`
- اجعله **Public** (ضروري لـ GitHub Pages المجاني)
- **لا تضف** README أو .gitignore أو license — عندنا جاهزين

### ٢. ارفع الملفات
في مجلد المشروع نفّذ:

```bash
cd moon-calendar
git init
git add .
git commit -m "Initial commit: moon calendar v1.0.0"
git branch -M main
git remote add origin https://github.com/اسم-المستخدم-بتاعك/moon-calendar.git
git push -u origin main
```

### ٣. فعّل GitHub Pages
- في المستودع اذهب إلى **Settings** ← **Pages**
- تحت **Source** اختر **Deploy from a branch**
- اختر **main** و **/(root)**
- اضغط **Save**
- بعد دقيقة سيظهر رابط موقعك: `https://اسم-المستخدم-بتاعك.github.io/moon-calendar/`

### ٤. (اختياري) اسم نطاق مخصص
في **Settings** ← **Pages** يمكنك إضافة **Custom domain** لتستخدم نطاقك الخاص.

## 📱 النشر على Google Play (كتطبيق Android)

التطبيق مبني كتطبيق ويب تقدمي (PWA)، ويمكن تحويله لتطبيق Android أصيل ونشره على Google Play عبر **Trusted Web Activity (TWA)**.

### الطريقة الأسهل: PWABuilder.com

PWABuilder هي خدمة مجانية من Microsoft تحوّل الـ PWA إلى APK/AAB جاهز لـ Google Play.

**الخطوة ١:** انشر التطبيق على GitHub Pages أولاً (اتبع الخطوات أعلاه).

**الخطوة ٢:** اذهب إلى:
```
https://www.pwabuilder.com/reportcard?site=https://اسم-المستخدم-بتاعك.github.io/moon-calendar/
```

**الخطوة ٣:** اضغط على **Package For Stores** ← **Android**

**الخطوة ٤:** في صفحة الإعدادات:
- **Package ID:** مثلاً `app.moon.calendar`
- **App name:** `moon تقويم`
- **Display mode:** `standalone`
- **Orientation:** `any`
- **Status bar color:** `#0d4f3c` (اللون الأخضر)
- **Splash color:** `#0d4f3c`
- **Icon:** تأكد إن الأيقونات ظاهرة بشكل صحيح

**الخطوة ٥:** اضغط **Generate** ثم **Download** — ستحصل على ملف `.aab` (Android App Bundle) جاهز للنشر.

**الخطوة ٦:** سجّل في [Google Play Console](https://play.google.com/console) (يحتاج حساب مطوّر بـ ٢٥ دولار مرة واحدة).

**الخطوة ٧:** أنشئ تطبيقاً جديداً وارفع ملف `.aab`:
- **اسم التطبيق:** moon - تقويم هجري
- **وصف قصير:** تقويم أم القرى مع نظام مواعيد وإشعارات
- **وصف كامل:** انسخ من القسم أدناه
- **لغة:** العربية + الإنجليزية
- **تصنيف:** Productivity
- **محتوى:** موجه للجميع
- **سياسة الخصوصية:** مطلوبة — استخدم [هذه الخدمة](https://app-privacy-policy-generator.firebaseapp.com/) لتوليدها
- **أيقونة التطبيق:** ارفع `icons/icon-512.png`
- **Screenshots:** التقطها من التطبيق المنشور وأضفها

### التحقق من Digital Asset Links
لكي يعمل التطبيق كتطبيق حقيقي (بدون شريط عنوان المتصفح) ويتثبّت من Google Play، تحتاج للتحقق من الملكية.

أنشئ ملف `.well-known/assetlinks.json` في موقعك بمحتوى:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "app.moon.calendar",
    "sha256_cert_fingerprints": [
      "FINGERPRINT_HERE_FROM_PWABUILDER"
    ]
  }
}]
```

> استبدل `FINGERPRINT_HERE_FROM_PWABUILDER` بالقيمة اللي يعطيك إياها PWABuilder، و `app.moon.calendar` بـ Package ID اللي اخترته.

### وصف Google Play (جاهز للنسخ)

**اسم التطبيق (عربي):** moon - تقويم هجري وميلادي

**اسم التطبيق (إنجليزي):** moon - Hijri & Gregorian Calendar

**وصف قصير (٣٠ حرف):**
```
تقويم أم القرى مع مواعيد وإشعارات
```

**وصف كامل (عربي):**
```
moon - تقويم هجري وميلادي احترافي يعتمد على تقويم أم القرى الرسمي المعتمد في المملكة العربية السعودية.

✨ المميزات:
• تقويم أم القرى بدقة عالية (١٣٥٦ - ١٥٠٠ هـ)
• عرض التاريخ الهجري والميلادي معاً
• محول تاريخ في الاتجاهين
• إدارة مواعيد كاملة مع تصنيفات ملوّنة
• إشعارات تذكير قبل المواعيد
• استيراد وتصدير بصيغة iCalendar (.ics)
• متوافق مع Google Calendar و Apple Calendar
• يعمل بدون إنترنت (بعد التحميل الأول)
• تصميم كلاسيكي أنيق بالعربية
```

**وصف كامل (إنجليزي):**
```
moon - A professional Hijri & Gregorian calendar based on the official Umm Al-Qura calendar of Saudi Arabia.

Features:
• Accurate Umm Al-Qura calendar (1356-1500 AH)
• Both Hijri and Gregorian dates shown together
• Bidirectional date converter
• Full event management with color categories
• Browser notifications for reminders
• Import/Export as iCalendar (.ics)
• Compatible with Google Calendar, Apple Calendar, Outlook
• Works offline (after first load)
• Elegant classical Arabic design
```

## 🛠️ البنية التقنية

```
moon-calendar/
├── index.html              # الصفحة الرئيسية
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker (للعمل بدون إنترنت)
├── css/
│   └── style.css           # التصميم الكلاسيكي
├── js/
│   ├── hijri.js            # تحويل التاريخ (أم القرى)
│   ├── storage.js          # حفظ المواعيد في localStorage
│   ├── ics.js              # استيراد/تصدير iCalendar
│   ├── notifications.js    # نظام الإشعارات
│   ├── calendar.js         # عرض التقويم
│   └── app.js              # منطق التطبيق الرئيسي
├── icons/                  # أيقونات PWA (٧٢-٥١٢ بكسل)
└── README.md               # هذا الملف
```

## 🔧 التخصيص

### تغيير الألوان الأساسية
افتح `css/style.css` وعدّل المتغيرات في الأعلى:
```css
:root {
  --emerald-700: #0d4f3c;   /* اللون الأساسي */
  --gold-500: #c9a961;      /* لون التمييز */
  --ivory: #faf6ec;          /* الخلفية */
}
```

### تغيير اسم التطبيق
- `index.html` — `<title>moon · تقويم هجري وميلادي</title>`
- `manifest.json` — `"name"` و `"short_name"`
- `js/app.js` — ابحث عن "moon"

### إضافة تصنيفات جديدة للمواعيد
في `js/app.js` ابحث عن `const CATEGORIES` وأضف:
```js
{ id: 'custom', name: 'مخصص', color: '#YOUR_COLOR', icon: '🎯' }
```

## 📊 البيانات والتقويم

- **خوارزمية أم القرى:** مغطاة من ١٣٥٦ هـ (١٤ مارس ١٩٣٧) إلى ١٥٠٠ هـ (١٦ نوفمبر ٢٠٧٧)
- **خارج النطاق:** يستخدم التطبيق خوارزمية تقويم هجري تقريبية (±١ يوم)
- **مصدر البيانات:** Robert Harry van Gent / Suhail Alkowaileet ([Hijri.js](https://github.com/xsoh/Hijri.js))
- **التخزين:** كل البيانات محفوظة محلياً في متصفحك (localStorage) — لا يوجد سيرفر

## 🐛 حل المشاكل

### الإشعارات لا تعمل
- تأكد إنك تستخدم HTTPS أو localhost (المتصفحات تطلب ذلك)
- تحقق من صلاحيات الإشعارات في إعدادات المتصفح
- تأكد إن `Notification` مدعوم في متصفحك

### التقويم الهجري غير دقيق
- تأكد من تاريخ الجهاز (التطبيق يعتمد على `new Date()` للنظام)
- للتواريخ خارج ١٣٥٦-١٥٠٠ هـ قد يكون هناك فرق ±١ يوم (طبيعي في الحسابات الفلكية)

### التطبيق لا يتثبّت
- تأكد إن `manifest.json` يُحمَّل بنجاح (DevTools → Application → Manifest)
- تأكد إن `sw.js` يعمل (DevTools → Application → Service Workers)

## 📜 الترخيص

هذا المشروع مفتوح المصدر — استخدمه وعدّل فيه كيفما تشاء.

## 🙏 شكر وتقدير

- **Robert Harry van Gent** و **Suhail Alkowaileet** على بيانات تقويم أم القرى
- **PWABuilder** من Microsoft لتسهيل نشر PWAs على Google Play
- **خط Amiri** و **Tajawal** من Google Fonts

---

صنع بـ ❤️ للمجتمع العربي والإسلامي 🌙
