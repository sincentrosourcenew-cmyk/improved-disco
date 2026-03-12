# Omnibook AI

منصة احترافية لإنشاء كتب كاملة عبر Gemini API، مع تصدير مباشر إلى PDF.

## المتطلبات

- Node.js 18+
- مفتاح Gemini API

## التشغيل

```bash
cp env.example .env
# ثم ضع قيمة GEMINI_API_KEY
npm install
npm run dev
```

يفتح التطبيق على:

- http://localhost:3000

## البناء

```bash
npm run build
npm run preview
```

## المزايا

- إنشاء مخطط الفصول تلقائيًا.
- توليد محتوى كل فصل على مراحل.
- متابعة حالة الكتاب أثناء التوليد.
- تصدير PDF بجودة مناسبة للطباعة.
