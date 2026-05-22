import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

const SALES_PROCESS_FILE = path.join(process.cwd(), ".data", "sales-process.json");
const SALES_PROCESS_DIR = path.dirname(SALES_PROCESS_FILE);

type SalesProcessStage = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  requiresComment: boolean;
  comment: string;
};

type SalesProcessData = {
  stages: SalesProcessStage[];
};

const DEFAULTS: SalesProcessData = {
  stages: [
    {
      id: "1",
      name: "سبد خرید",
      description: "مرحله افزودن محصولات به سبد خرید",
      isActive: true,
      requiresComment: false,
      comment: ""
    },
    {
      id: "2",
      name: "تسویه حساب",
      description: "مرحله ورود اطلاعات مشتری و آدرس ارسال",
      isActive: false,
      requiresComment: true,
      comment: ""
    },
    {
      id: "3",
      name: "پرداخت",
      description: "مرحله انتخاب روش پرداخت و انجام تراکنش",
      isActive: false,
      requiresComment: true,
      comment: ""
    },
    {
      id: "4",
      name: "تأیید سفارش",
      description: "مرحله تأیید نهایی و ارسال ایمیل تأیید",
      isActive: false,
      requiresComment: false,
      comment: ""
    }
  ]
};

function load(): SalesProcessData {
  try {
    if (!fs.existsSync(SALES_PROCESS_FILE)) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(SALES_PROCESS_FILE, "utf8")) };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(data: Partial<SalesProcessData>) {
  if (!fs.existsSync(SALES_PROCESS_DIR)) {
    fs.mkdirSync(SALES_PROCESS_DIR, { recursive: true });
  }
  const current = load();
  fs.writeFileSync(SALES_PROCESS_FILE, JSON.stringify({ ...current, ...data }, null, 2), "utf8");
}

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true, stages: load().stages });
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as { stages?: SalesProcessStage[] };
    if (!body.stages || !Array.isArray(body.stages)) {
      return NextResponse.json({ ok: false, message: "فیلد stages معتبر نیست." }, { status: 400 });
    }
    save({ stages: body.stages });
    return NextResponse.json({ ok: true, stages: load().stages });
  } catch (e) {
    return NextResponse.json({ ok: false, message: e instanceof Error ? e.message : "خطا" }, { status: 400 });
  }
}