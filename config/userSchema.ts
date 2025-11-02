// import { integer, json, pgTable, varchar } from "drizzle-orm/pg-core";


// export const usersTable = pgTable("users", {
//   id: integer().primaryKey().generatedAlwaysAsIdentity(),
//   name: varchar({ length: 255 }).notNull(),
//   email: varchar({ length: 255 }).notNull().unique(),
// });

// export const SessionChatTable = pgTable('sessionChatTable', {
//   id: integer().primaryKey().generatedAlwaysAsIdentity(),
//   sessionId: varchar().notNull(),
//   note: varchar().notNull(),
//   conversation: json(),
//   selectedDoctor: json(),
//   report: json(),
//   status: varchar().notNull(),
//   createdBy: varchar({ length: 255 }).references(() => usersTable.email), 
//   createdOn: varchar().notNull(),
// });

// config/userSchema.ts
import { integer, json, pgTable, varchar, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table
export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
});

// Session Chat Table
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

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  sessions: many(sessionChatTable),
}));

export const sessionRelations = relations(sessionChatTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessionChatTable.userId],
    references: [usersTable.id],
  }),
}));
