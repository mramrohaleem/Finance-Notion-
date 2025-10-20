# Notion Finance MCP (Arabic-ready)

خادم MCP بسيط (JavaScript) يضيف معاملات "المعاملات" في Notion مباشرة.
يستخدم:
- @modelcontextprotocol/sdk (Streamable HTTP)
- @notionhq/client
- express / dotenv / zod

## 0) إعداد Notion Integration
1) في Notion: Settings → Connections → Develop or manage integrations → New integration
2) فعّل الصلاحيات: Read, Update/Insert, Search
3) انسخ الـ Internal Integration Secret واحفظه في متغير بيئة `NOTION_TOKEN`
4) شارك صفحة/مجلد **Finance** مع الـIntegration (Share → Invite → Can edit)

### الحصول على Database ID
- افتح قاعدة **المعاملات** كصفحة كاملة → … → Copy link
- خذ الـUUID من الرابط (طويل من أرقام/حروف) وضعه في `TRANSACTIONS_DB_ID`

## 1) تشغيل سريع على Replit (أسهل للمبتدئين)
1) حساب Replit → Create Repl → Node.js
2) ارفع ملفات هذا المشروع (أو انسخ المحتوى):
   - package.json
   - server.mjs
   - .env.example (انسخها إلى .env داخل Replit Secrets)
3) من Secrets (قفل يسار المحرر) أضف:
   - NOTION_TOKEN = secret_xxx
   - TRANSACTIONS_DB_ID = your_db_id
   - PORT = 8787
4) Run → سيظهر لك رابط عام مثل: https://your-repl-name.username.repl.co
   - اختبر الصحة: افتح https://your-repl-name.username.repl.co/health → يجب أن تعرض OK
   - عنوان MCP سيكون: https://your-repl-name.username.repl.co/mcp

## 2) ربطه في ChatGPT كـ Custom MCP
ChatGPT → Settings → Connectors → Add → Custom (MCP) → الصق:
```json
{
  "mcpServers": {
    "NotionFinance": { "url": "https://YOUR-APP-URL/mcp" }
  }
}
```
احفظ. ثم افتح محادثة جديدة → Tools → Use connectors → فعّل NotionFinance.

## 3) اختبار الأداة داخل الشات
نفِّذ الأداة `add_transaction` بالمدخلات:
```json
{
  "date": "2025-10-20",
  "category": "قهوة/مشروبات",
  "amount": 30,
  "type": "مصروف",
  "pay_method": "كاش",
  "account": "محفظة كاش",
  "note": "لاتيه"
}
```
سترى `pageId` و `url`؛ افتح قاعدة **المعاملات** وستجد الصف أُضيف.

## ملاحظات
- لو خصائصك في Notion من نوع Select بدلاً من نص، عدّل خصائص `server.mjs` وفق التعليق داخل الملف.
- Node ≥ 18 مطلوب.
- لتشغيله على Render/railway/Vercel: أنشئ مشروعًا جديدًا، ارفع الملفات، وضع المتغيرات في لوحة Environment.
