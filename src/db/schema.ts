import { pgTable, text, timestamp, primaryKey, integer, bigint, pgEnum } from "drizzle-orm/pg-core"
import type { AdapterAccount } from "@auth/core/adapters"
import { relations } from "drizzle-orm"

// Authentication Tables (existing)
export const users = pgTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
})

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
)

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
)

// Business Logic Tables

// Order status enum
export const orderStatusEnum = pgEnum("order_status", ["CREATED", "PROCESSING", "DELIVERED"])

// Image type enum
export const imageTypeEnum = pgEnum("image_type", ["ORDER_IMAGE", "BILL_PHOTO"])

// Customers table
export const customers = pgTable("customers", {
  id: bigint("id", { mode: "bigint" }).primaryKey().generatedByDefaultAsIdentity(),
  name: text("name").notNull(),
  address: text("address"),
  phoneNumber: text("phone_number"),
  email: text("email"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
})

// Customer visiting cards table
export const customerVisitingCards = pgTable("customer_visiting_cards", {
  id: bigint("id", { mode: "bigint" }).primaryKey().generatedByDefaultAsIdentity(),
  customerId: bigint("customer_id", { mode: "bigint" })
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  uploadedAt: timestamp("uploaded_at", { mode: "date" }).defaultNow().notNull(),
})

// Orders table with unique order number
export const orders = pgTable("orders", {
  id: bigint("id", { mode: "bigint" }).primaryKey().generatedByDefaultAsIdentity(),
  orderNumber: text("order_number").notNull().unique(), // Format: #2025-09-02-0001
  customerId: bigint("customer_id", { mode: "bigint" })
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  notes: text("notes"),
  audioUrl: text("audio_url"),
  status: orderStatusEnum("status").default("CREATED").notNull(),
  billNumber: text("bill_number"),
  transportName: text("transport_name"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
})

// Order images table (includes both order images and bill photos)
export const orderImages = pgTable("order_images", {
  id: bigint("id", { mode: "bigint" }).primaryKey().generatedByDefaultAsIdentity(),
  orderId: bigint("order_id", { mode: "bigint" })
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  remark: text("remark"),
  type: imageTypeEnum("type").notNull().default("ORDER_IMAGE"),
  uploadedAt: timestamp("uploaded_at", { mode: "date" }).defaultNow().notNull(),
})

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
  visitingCards: many(customerVisitingCards),
  orders: many(orders),
}))

export const customerVisitingCardsRelations = relations(customerVisitingCards, ({ one }) => ({
  customer: one(customers, {
    fields: [customerVisitingCards.customerId],
    references: [customers.id],
  }),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  images: many(orderImages),
}))

export const orderImagesRelations = relations(orderImages, ({ one }) => ({
  order: one(orders, {
    fields: [orderImages.orderId],
    references: [orders.id],
  }),
}))

// Type definitions for better TypeScript support
export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert

export type CustomerVisitingCard = typeof customerVisitingCards.$inferSelect
export type NewCustomerVisitingCard = typeof customerVisitingCards.$inferInsert

export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert

export type OrderImage = typeof orderImages.$inferSelect
export type NewOrderImage = typeof orderImages.$inferInsert

export type OrderStatus = "CREATED" | "PROCESSING" | "DELIVERED"
export type ImageType = "ORDER_IMAGE" | "BILL_PHOTO"