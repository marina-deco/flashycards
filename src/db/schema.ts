import { integer, pgTable, varchar, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: varchar({ length: 255 }).primaryKey(), // Clerk userId
  email: varchar({ length: 255 }),
  hasUnlimitedDecks: boolean().notNull().default(false),
  hasAIFeature: boolean().notNull().default(false),
  plan: varchar({ length: 50 }).notNull().default("free_user"),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const decks = pgTable("decks", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar({ length: 255 }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const cards = pgTable("cards", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  deckId: integer().notNull().references(() => decks.id, { onDelete: "cascade" }),
  front: text().notNull(),
  back: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});
