import { Router, type IRouter } from "express";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { db, stockMovementsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/stock-movements", async (req, res): Promise<void> => {
  const { medicine_id, type, date_from, date_to } = req.query as {
    medicine_id?: string;
    type?: string;
    date_from?: string;
    date_to?: string;
  };

  const conditions = [];
  if (medicine_id) conditions.push(eq(stockMovementsTable.medicineId, parseInt(medicine_id)));
  if (type) conditions.push(eq(stockMovementsTable.type, type));
  if (date_from) conditions.push(gte(stockMovementsTable.createdAt, new Date(date_from)));
  if (date_to) {
    const to = new Date(date_to);
    to.setDate(to.getDate() + 1);
    conditions.push(lte(stockMovementsTable.createdAt, to));
  }

  const rows = await db
    .select()
    .from(stockMovementsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(stockMovementsTable.createdAt))
    .limit(500);

  res.json(rows.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })));
});

export default router;
