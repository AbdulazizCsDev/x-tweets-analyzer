# X Analyzer

أداة تحليل تغريدات X بالذكاء الاصطناعي. تستورد آلاف التغريدات بدون مفتاح Twitter API، وتكتشف أنماطاً خفية باستخدام Claude.

## المصادر المدعومة
- **أرشيف X الرسمي** (ZIP) — مجاني وكامل لتاريخك
- **Apify** — لجلب أي حساب عام (الحساب المجاني يعطي ~12K تغريدة شهرياً)

## ميزات الذكاء الاصطناعي
- **تجميع المواضيع** (Topic clustering)
- **اكتشاف الأنماط** (Pattern mining)
- **ملف الصوت والشخصية** (Voice profile)
- **التغريدات الشاذة** (Anomalies)
- **توصيات قابلة للتطبيق** (Recommendations)

## التشغيل المحلي

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
uvicorn main:app --reload
```
يعمل على `http://localhost:8000`.

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
يعمل على `http://localhost:3000`.

## المفاتيح المطلوبة (من المستخدم)
- **Anthropic API key** — لتحليلات AI (يُحفظ محلياً في المتصفح)
- **Apify API token** — اختياري، فقط لو استخدمت مصدر Apify

## التقنيات
- Backend: FastAPI · SQLite · anthropic-sdk · apify-client
- Frontend: Next.js 15 · React 19 · Tailwind · Recharts · shadcn-style components
