import { Router, type IRouter } from "express";
import { eq, ilike, sql } from "drizzle-orm";
import { db, suppliersTable, purchasesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/suppliers", async (req, res): Promise<void> => {
  const { search } = req.query as { search?: string };
  const rows = await db
    .select({
      id: suppliersTable.id,
      name: suppliersTable.name,
      phone: suppliersTable.phone,
      address: suppliersTable.address,
      balance: suppliersTable.balance,
      totalPurchases: sql<string>`COALESCE(SUM(CAST(${purchasesTable.total} AS numeric)), 0)`,
    })
    .from(suppliersTable)
    .leftJoin(purchasesTable, eq(purchasesTable.supplierId, suppliersTable.id))
    .where(search ? ilike(suppliersTable.name, `%${search}%`) : undefined)
    .groupBy(suppliersTable.id)
    .orderBy(suppliersTable.name);

  res.json(rows.map((s) => ({
    ...s,
    balance: parseFloat(s.balance ?? "0"),
    totalPurchases: parseFloat(s.totalPurchases ?? "0"),
  })));
});

router.post("/suppliers", async (req, res): Promise<void> => {
  const { name, phone, address, balance } = req.body;
  if (!name) {
    res.status(400).json({ error: "الاسم مطلوب" });
    return;
  }
  const [s] = await db
    .insert(suppliersTable)
    .values({ name, phone, address, balance: String(balance ?? 0) })
    .returning();
  res.status(201).json({ ...s, balance: parseFloat(s.balance ?? "0"), totalPurchases: 0 });
});

router.get("/suppliers/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [s] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, id));
  if (!s) {
    res.status(404).json({ error: "المورد غير موجود" });
    return;
  }
  res.json({ ...s, balance: parseFloat(s.balance ?? "0"), totalPurchases: 0 });
});

router.patch("/suppliers/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, phone, address, balance } = req.body;
  const updates: Record<string, unknown> = {};
  if (name != null) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (address !== undefined) updates.address = address;
  if (balance != null) updates.balance = String(balance);
  const [s] = await db
    .update(suppliersTable)
    .set(updates)
    .where(eq(suppliersTable.id, id))
    .returning();
  if (!s) {
    res.status(404).json({ error: "المورد غير موجود" });
    return;
  }
  res.json({ ...s, balance: parseFloat(s.balance ?? "0"), totalPurchases: 0 });
});

router.delete("/suppliers/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(suppliersTable).where(eq(suppliersTable.id, id));
  res.sendStatus(204);
});

export default router;
