import { pgTable, text, serial, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  pharmacyName: text("pharmacy_name").notNull().default("صيدلية"),
  address: text("address"),
  phone: text("phone"),
  pin: text("pin"),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(10),
  nearExpiryDays: integer("near_expiry_days").notNull().default(90),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  printerName: text("printer_name"),
  invoiceFooter: text("invoice_footer"),
  licenseKey: text("license_key"),
  appVersion: text("app_version").notNull().default("1.0.0"),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
