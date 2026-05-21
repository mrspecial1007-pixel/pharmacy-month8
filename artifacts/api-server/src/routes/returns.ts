import { Router, type IRouter } from "express";
import { eq, and, sql, desc } from "drizzle-orm";
import { db, returnsTable, medicinesTable, stockMovementsTable, auditLogTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/returns", async (req, res): Promise<void> => {
  const { type } = req.query as { type?: string };
  const rows = await db
    .select()
    .from(returnsTable)
    .where(type ? eq(returnsTable.type, type) : undefined)
    .orderBy(desc(returnsTable.createdAt));

  res.json(
    rows.map((r) => ({
      ...r,
      amount: parseFloat(r.amount ?? "0"),
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

router.post("/returns", async (req, res): Promise<void> => {
  const { type, medicineId, referenceId, quantity, amount, reason } = req.body as {
    type: string;
    medicineId: number;
    referenceId?: number;
    quantity: number;
    amount: number;
    reason?: string;
  };

  const [med] = await db.select().from(medicinesTable).where(eq(medicinesTable.id, medicineId));
  if (!med) {
    res.status(404).json({ error: "الدواء غير موجود" });
    return;
  }

  const [ret] = await db
    .insert(returnsTable)
    .values({
      type,
      medicineId,
      medicineName: med.name,
      referenceId: referenceId ?? null,
      quantity,
      amount: String(amount),
      reason: reason ?? null,
    })
    .returning();

  // Adjust stock: sale return adds back, purchase return removes
  const stockDelta = type === "sale" ? quantity : -quantity;
  await db
    .update(medicinesTable)
    .set({ quantity: sql`quantity + ${stockDelta}` })
    .where(eq(medicinesTable.id, medicineId));

  await db.insert(stockMovementsTable).values({
    medicineId,
    medicineName: med.name,
    type: "return",
    quantity: stockDelta,
    reference: `مرتجع-${ret.id}`,
  });

  await db.insert(auditLogTable).values({
    operation: type === "sale" ? "مرتجع مبيعات" : "مرتجع مشتريات",
    reference: `مرتجع-${ret.id}`,
  });

  res.status(201).json({
    ...ret,
    amount: parseFloat(ret.amount ?? "0"),
    createdAt: ret.createdAt.toISOString(),
  });
});

export default router;
