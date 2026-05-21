import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, settingsTable } from "@workspace/db";

const router: IRouter = Router();

const toSettings = (s: typeof settingsTable.$inferSelect) => ({
  ...s,
  taxRate: parseFloat(s.taxRate ?? "0"),
});

router.get("/settings", async (_req, res): Promise<void> => {
  let [settings] = await db.select().from(settingsTable).limit(1);
  if (!settings) {
    [settings] = await db
      .insert(settingsTable)
      .values({ pharmacyName: "صيدليتي" })
      .returning();
  }
  res.json(toSettings(settings));
});

router.patch("/settings", async (req, res): Promise<void> => {
  let [existing] = await db.select().from(settingsTable).limit(1);
  if (!existing) {
    [existing] = await db
      .insert(settingsTable)
      .values({ pharmacyName: "صيدليتي" })
      .returning();
  }

  const updates: Record<string, unknown> = {};
  const body = req.body as Record<string, unknown>;
  const fields = [
    "pharmacyName", "address", "phone", "pin",
    "lowStockThreshold", "nearExpiryDays", "printerName",
    "invoiceFooter", "licenseKey",
  ];
  for (const f of fields) {
    if (body[f] !== undefined) updates[f] = body[f];
  }
  if (body.taxRate != null) updates.taxRate = String(body.taxRate);

  const [updated] = await db
    .update(settingsTable)
    .set(updates)
    .where(eq(settingsTable.id, existing.id))
    .returning();

  res.json(toSettings(updated));
});

export default router;
