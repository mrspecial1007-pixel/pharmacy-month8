import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, shiftsTable } from "@workspace/db";

const toShift = (s: typeof shiftsTable.$inferSelect) => ({
  ...s,
  openingBalance: parseFloat(s.openingBalance ?? "0"),
  closingBalance: s.closingBalance != null ? parseFloat(s.closingBalance) : null,
  totalSales: s.totalSales != null ? parseFloat(s.totalSales) : null,
  startTime: s.startTime.toISOString(),
  endTime: s.endTime ? s.endTime.toISOString() : null,
});

const router: IRouter = Router();

router.get("/shifts/active", async (_req, res): Promise<void> => {
  const [shift] = await db
    .select()
    .from(shiftsTable)
    .where(eq(shiftsTable.status, "open"))
    .limit(1);
  res.json({ shift: shift ? toShift(shift) : null });
});

router.get("/shifts", async (_req, res): Promise<void> => {
  const rows = await db.select().from(shiftsTable).orderBy(desc(shiftsTable.startTime));
  res.json(rows.map(toShift));
});

router.post("/shifts", async (req, res): Promise<void> => {
  // Close any open shift first
  await db
    .update(shiftsTable)
    .set({ status: "closed", endTime: new Date() })
    .where(eq(shiftsTable.status, "open"));

  const { openingBalance, notes } = req.body as { openingBalance: number; notes?: string };
  const [shift] = await db
    .insert(shiftsTable)
    .values({
      openingBalance: String(openingBalance ?? 0),
      status: "open",
      notes: notes ?? null,
    })
    .returning();
  res.status(201).json(toShift(shift));
});

router.post("/shifts/:id/close", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { closingBalance, notes } = req.body as { closingBalance: number; notes?: string };
  const [shift] = await db
    .update(shiftsTable)
    .set({
      closingBalance: String(closingBalance),
      status: "closed",
      endTime: new Date(),
      notes: notes ?? null,
    })
    .where(eq(shiftsTable.id, id))
    .returning();
  if (!shift) {
    res.status(404).json({ error: "الوردية غير موجودة" });
    return;
  }
  res.json(toShift(shift));
});

export default router;
