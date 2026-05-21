import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const returnsTable = pgTable("returns", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'sale' | 'purchase'
  medicineId: integer("medicine_id").notNull(),
  medicineName: text("medicine_name").notNull(),
  referenceId: integer("reference_id"),
  quantity: integer("quantity").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReturnSchema = createInsertSchema(returnsTable).omit({ id: true, createdAt: true });
export type InsertReturn = z.infer<typeof insertReturnSchema>;
export type Return = typeof returnsTable.$inferSelect;
