import 'dotenv/config';
import express from 'express';
import { z } from 'zod';
import { Client as Notion } from '@notionhq/client';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

// ---- بيئة التشغيل ----
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const TRANSACTIONS_DB_ID = process.env.TRANSACTIONS_DB_ID;
const PORT = Number(process.env.PORT || 8787);

if (!NOTION_TOKEN) {
  console.error('❌ ضع NOTION_TOKEN في متغيرات البيئة (.env)');
  process.exit(1);
}
if (!TRANSACTIONS_DB_ID) {
  console.error('❌ ضع TRANSACTIONS_DB_ID في متغيرات البيئة (.env)');
  process.exit(1);
}

// ---- عميل Notion ----
const notion = new Notion({ auth: NOTION_TOKEN });

// ---- خادم MCP ----
const mcp = new McpServer({
  name: 'notion-finance-mcp',
  version: '1.0.0',
});

// أداة: إضافة معاملة في قاعدة "المعاملات"
const AddTxInput = z.object({
  date: z.string().min(10).max(10), // YYYY-MM-DD
  category: z.string().min(1),
  amount: z.number().nonnegative(),
  type: z.enum(['مصروف', 'دخل']),
  pay_method: z.string().optional(),
  account: z.string().optional(),
  note: z.string().optional(),
});

mcp.registerTool(
  'add_transaction',
  {
    title: 'إضافة معاملة إلى Notion',
    description: 'يضيف صفًا جديدًا في قاعدة "المعاملات" (التاريخ، الفئة، المبلغ، النوع، طريقة الدفع، الحساب، ملاحظة).',
    inputSchema: AddTxInput,
    outputSchema: z.object({
      pageId: z.string(),
      url: z.string().optional()
    })
  },
  async (input) => {
    const parsed = AddTxInput.parse(input);
    const { date, category, amount, type, pay_method = '', account = '', note = '' } = parsed;

    // ملاحظة: خصائص قاعدة "المعاملات" عندك بالعربي من استيراد CSV
    // إذا كانت خصائص "النوع/طريقة الدفع/الحساب (نص)" من نوع Select فعلاً،
    // بدّلها من rich_text إلى select كما هو موضح في التعليق.
    const properties = {
      'التاريخ': { date: { start: date } },
      'الفئة (نص)': { title: [{ text: { content: category } }] },
      'المبلغ': { number: amount },
      // إذا كانت Select:
      // 'النوع': { select: { name: type } },
      // 'طريقة الدفع': { select: { name: pay_method } },
      // 'الحساب (نص)': { select: { name: account } },
      // أما لو Text/Rich text كما في CSV المبدئي:
      'النوع': { rich_text: [{ text: { content: type } }] },
      'طريقة الدفع': { rich_text: [{ text: { content: pay_method } }] },
      'الحساب (نص)': { rich_text: [{ text: { content: account } }] },
      'ملاحظة': { rich_text: [{ text: { content: note } }] },
    };

    const res = await notion.pages.create({
      parent: { database_id: TRANSACTIONS_DB_ID },
      properties
    });

    const pageId = res.id;
    const url = res.url;
    return {
      content: [{ type: 'text', text: `✅ تمت إضافة المعاملة: ${pageId}` }],
      data: { pageId, url }
    };
  }
);

// (لاحقًا يمكن إضافة أدوات أخرى مثل link_transaction_to_budget)

// ---- تشغيل HTTP + قناة MCP ----
const app = express();
app.use(express.json());

// نقطة فحص
app.get('/health', (_req, res) => res.status(200).send('OK'));

// قناة MCP المستحسنة للويب
const transport = new StreamableHTTPServerTransport({ app, path: '/mcp' });
await mcp.connect(transport);

app.listen(PORT, () => {
  console.log(`🚀 MCP server running on http://localhost:${PORT}/mcp`);
});
