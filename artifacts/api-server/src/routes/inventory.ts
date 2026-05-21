import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, medicinesTable, stockMovementsTable, auditLogTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/inventory", async (_req, res): Promise<void> => {
  const meds = await db
    .select({
      medicineId: medicinesTable.id,
      medicineName: medicinesTable.name,
      barcode: medicinesTable.barcode,
      systemQuantity: medicinesTable.quantity,
    })
    .from(medicinesTable)
    .orderBy(medicinesTable.name);

  res.json(
    meds.map((m) => ({
      ...m,
      actualQuantity: null,
      difference: null,
    }))
  );
});

router.post("/inventory", async (req, res): Promise<void> => {
  const { items = [] }: { items: { medicineId: number; actualQuantity: number }[] } = req.body;

  let savedCount = 0;
  let adjustedCount = 0;

  for (const item of items) {
    const [med] = await db
      .select()
      .from(medicinesTable)
      .where(eq(medicinesTable.id, item.medicineId));

    if (!med) continue;

    const diff = item.actualQuantity - med.quantity;
    if (diff !== 0) {
      await db
        .update(medicinesTable)
        .set({ quantity: item.actualQuantity })
        .where(eq(medicinesTable.id, item.medicineId));

      await db.insert(stockMovementsTable).values({
        medicineId: item.medicineId,
        medicineName: med.name,
        type: "inventory",
        quantity: diff,
        reference: `جرد-${new Date().toLocaleDateString("ar-SA")}`,
      });

      adjustedCount++;
    }
    savedCount++;
  }

  await db.insert(auditLogTable).values({
    operation: "جرد فعلي",
    reference: `جرد-${new Date().toLocaleDateString("ar-SA")}`,
  });

  res.json({ savedCount, adjustedCount });
});

export default router;
