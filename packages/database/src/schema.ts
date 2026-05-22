import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["customer", "sales", "admin"]);

export const orderStatusEnum = pgEnum("order_status", [
  "placed",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
]);

export const contentWorkflowEnum = pgEnum("content_workflow", [
  "draft",
  "ai_generated",
  "human_approved",
  "published",
]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // matches auth.users.id when synced from Supabase Auth
  email: varchar("email", { length: 255 }).notNull().unique(),
  fullName: varchar("full_name", { length: 255 }),
  role: userRoleEnum("role").notNull().default("customer"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id").references(() => categories.id),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  priceCents: integer("price_cents").notNull(),
  costCents: integer("cost_cents"),
  metaTitle: varchar("meta_title", { length: 120 }),
  metaDescription: varchar("meta_description", { length: 320 }),
  workflow: contentWorkflowEnum("workflow").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const productImages = pgTable("product_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: varchar("alt", { length: 255 }),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  excerpt: text("excerpt"),
  body: text("body").notNull(),
  metaTitle: varchar("meta_title", { length: 120 }),
  metaDescription: varchar("meta_description", { length: 320 }),
  workflow: contentWorkflowEnum("workflow").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerProfileId: uuid("customer_profile_id").references(() => profiles.id),
  status: orderStatusEnum("status").notNull().default("placed"),
  totalCents: integer("total_cents").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
});

export const crmNotes = pgTable("crm_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }),
  customerProfileId: uuid("customer_profile_id").references(() => profiles.id),
  authorProfileId: uuid("author_profile_id")
    .notNull()
    .references(() => profiles.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const crmStageEvents = pgTable("crm_stage_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  fromStatus: orderStatusEnum("from_status"),
  toStatus: orderStatusEnum("to_status").notNull(),
  actorProfileId: uuid("actor_profile_id").references(() => profiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const aiDrafts = pgTable("ai_drafts", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: varchar("entity_type", { length: 32 }).notNull(),
  entityId: uuid("entity_id"),
  prompt: text("prompt").notNull(),
  modelOutput: jsonb("model_output").notNull(),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  customer: one(profiles, {
    fields: [orders.customerProfileId],
    references: [profiles.id],
  }),
  notes: many(crmNotes),
  stageEvents: many(crmStageEvents),
}));
