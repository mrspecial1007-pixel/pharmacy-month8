import { pgTable, text, serial, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shiftsTable = pgTable("shifts", {
  id: serial("id").primaryKey(),
  openingBalance: numeric("opening_balance", { precision: 12, scale: 2 }).notNull().default("0"),
  closingBalance: numeric("closing_balance", { precision: 12, scale: 2 }),
  totalSales: numeric("total_sales", { precision: 12, scale: 2 }),
  status: text("status").notNull().default("open"), // 'open' | 'closed'
  notes: text("notes"),
  startTime: timestamp("start_time", { withTimezone: true }).notNull().defaultNow(),
  endTime: timestamp("end_time", { withTimezone: true }),
});

export const insertShiftSchema = createInsertSchema(shiftsTable).omit({ id: true, startTime: true });
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type Shift = typeof shiftsTable.$inferSelect;
