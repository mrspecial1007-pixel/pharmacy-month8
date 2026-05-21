import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";

export const medicinesTable = pgTable("medicines", {
  id: serial("id").primaryKey(),
  barcode: text("barcode"),
  name: text("name").notNull(),
  scientificName: text("scientific_name"),
  manufacturer: text("manufacturer"),
  unit: text("unit"),
  categoryId: integer("category_id").references(() => categoriesTable.id),
  location: text("location"),
  purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }).notNull().default("0"),
  salePrice: numeric("sale_price", { precision: 12, scale: 2 }).notNull().default("0"),
  quantity: integer("quantity").notNull().default(0),
  productionDate: text("production_date"),
  expiryDate: text("expiry_date"),
  reorderLevel: integer("reorder_level").default(10),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertMedicineSchema = createInsertSchema(medicinesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMedicine = z.infer<typeof insertMedicineSchema>;
export type Medicine = typeof medicinesTable.$inferSelect;
