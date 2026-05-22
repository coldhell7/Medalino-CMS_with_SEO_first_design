import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type UserRole = "admin" | "sales" | "customer";

export type DemoUser = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: UserRole;
  created_at: string;
  orders_count: number;
  active: boolean;
};

const SEED: DemoUser[] = [
  {
    id: "usr-admin-1",
    email: "admin@medalino.local",
    full_name: "مدیر سیستم",
    phone: "02100000000",
    role: "admin",
    created_at: "2026-01-01T08:00:00.000Z",
    orders_count: 0,
    active: true,
  },
  {
    id: "usr-sales-1",
    email: "seller@medalino.local",
    full_name: "فروشنده نمونه",
    phone: "02188887777",
    role: "sales",
    created_at: "2026-01-05T10:00:00.000Z",
    orders_count: 0,
    active: true,
  },
  {
    id: "usr-cust-1",
    email: "sara.m@example.com",
    full_name: "سارا محمدی",
    phone: "09121234567",
    role: "customer",
    created_at: "2026-05-10T14:00:00.000Z",
    orders_count: 1,
    active: true,
  },
  {
    id: "usr-cust-2",
    email: "amir.r@example.com",
    full_name: "امیر رضایی",
    phone: "09351239876",
    role: "customer",
    created_at: "2026-05-12T09:00:00.000Z",
    orders_count: 1,
    active: true,
  },
  {
    id: "usr-cust-3",
    email: "maryam.k@example.com",
    full_name: "مریم کریمی",
    phone: "09131112233",
    role: "customer",
    created_at: "2026-05-14T08:00:00.000Z",
    orders_count: 1,
    active: true,
  },
  {
    id: "usr-cust-4",
    email: "hossein.a@example.com",
    full_name: "حسین علوی",
    phone: "09217894561",
    role: "customer",
    created_at: "2026-05-14T12:00:00.000Z",
    orders_count: 1,
    active: true,
  },
  {
    id: "usr-cust-5",
    email: "nazanin.a@example.com",
    full_name: "نازنین احمدی",
    phone: "09195556677",
    role: "customer",
    created_at: "2026-05-14T16:00:00.000Z",
    orders_count: 1,
    active: true,
  },
  {
    id: "usr-cust-6",
    email: "reza.m@example.com",
    full_name: "رضا موسوی",
    phone: "09367891234",
    role: "customer",
    created_at: "2026-05-14T11:00:00.000Z",
    orders_count: 1,
    active: true,
  },
  {
    id: "usr-cust-7",
    email: "leila.j@example.com",
    full_name: "لیلا جعفری",
    phone: "09127778899",
    role: "customer",
    created_at: "2026-05-13T10:00:00.000Z",
    orders_count: 1,
    active: true,
  },
];

function dataPath(): string {
  const dir = path.join(process.cwd(), ".data");
  return path.join(dir, "demo-users.json");
}

export function listDemoUsers(): DemoUser[] {
  const file = dataPath();
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(SEED, null, 2), "utf8");
    return [...SEED];
  }

  const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
  if (!Array.isArray(parsed) || parsed.length === 0) {
    fs.writeFileSync(file, JSON.stringify(SEED, null, 2), "utf8");
    return [...SEED];
  }
  return parsed as DemoUser[];
}

export function createDemoUser(input: Omit<DemoUser, "id" | "created_at" | "orders_count">): DemoUser {
  const users = listDemoUsers();
  const user: DemoUser = {
    ...input,
    id: `usr-${randomUUID().slice(0, 8)}`,
    created_at: new Date().toISOString(),
    orders_count: input.role === "customer" ? 0 : 0,
  };
  users.unshift(user);
  fs.writeFileSync(dataPath(), JSON.stringify(users, null, 2), "utf8");
  return user;
}

export function updateDemoUser(id: string, patch: Partial<DemoUser>): DemoUser | null {
  const users = listDemoUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx < 0) return null;
  users[idx] = { ...users[idx], ...patch, id: users[idx].id };
  fs.writeFileSync(dataPath(), JSON.stringify(users, null, 2), "utf8");
  return users[idx];
}
