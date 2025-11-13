
import { integer, json, pgTable, varchar, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";


export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
});

export const sessionChatTable = pgTable("session_chat_table", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  sessionId: varchar({ length: 255 }).notNull(),
  note: varchar({ length: 5000 }).notNull(),
  conversation: json(),
  selectedDoctor: json(),
  language: varchar({ length: 50 }),
  report: json(),
  status: varchar({ length: 100 }).notNull(),
  userId: integer().notNull().references(() => usersTable.id), // 🔹 proper FK
  createdOn: timestamp({ withTimezone: true }).defaultNow().notNull(),
});


export const usersRelations = relations(usersTable, ({ many }) => ({
  sessions: many(sessionChatTable),
}));

export const sessionRelations = relations(sessionChatTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessionChatTable.userId],
    references: [usersTable.id],
  }),
}));
