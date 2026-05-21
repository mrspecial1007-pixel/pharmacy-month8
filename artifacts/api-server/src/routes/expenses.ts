import { Router, type IRouter } from "express";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { db, expensesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/expenses", async (req, res): Promise<void> => {
  const { date_from, date_to } = req.query as { date_from?: string; date_to?: string };
  const conditions = [];
  if (date_from) conditions.push(gte(expensesTable.createdAt, new Date(date_from)));
  if (date_to) {
    const to = new Date(date_to);
    to.setDate(to.getDate() + 1);
    conditions.push(lte(expensesTable.createdAt, to));
  }

  const rows = await db
    .select()
    .from(expensesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(expensesTable.createdAt));

  res.json(rows.map((e) => ({ ...e, amount: parseFloat(e.amount ?? "0"), createdAt: e.createdAt.toISOString() })));
});

router.post("/expenses", async (req, res): Promise<void> => {
  const { category, description, amount } = req.body;
  if (!category || !amount) {
    res.status(400).json({ error: "الفئة والمبلغ مطلوبان" });
    return;
  }
  const [e] = await db
    .insert(expensesTable)
    .values({ category, description: description ?? null, amount: String(amount) })
    .returning();
  res.status(201).json({ ...e, amount: parseFloat(e.amount ?? "0"), createdAt: e.createdAt.toISOString() });
});

router.delete("/expenses/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(expensesTable).where(eq(expensesTable.id, id));
  res.sendStatus(204);
});

export default router;
