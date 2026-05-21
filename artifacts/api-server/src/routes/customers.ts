import { Router, type IRouter } from "express";
import { eq, ilike, sql } from "drizzle-orm";
import { db, customersTable, salesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/customers", async (req, res): Promise<void> => {
  const { search } = req.query as { search?: string };
  const rows = await db
    .select({
      id: customersTable.id,
      name: customersTable.name,
      phone: customersTable.phone,
      address: customersTable.address,
      balance: customersTable.balance,
      notes: customersTable.notes,
      totalSales: sql<string>`COALESCE(SUM(CAST(${salesTable.finalTotal} AS numeric)), 0)`,
    })
    .from(customersTable)
    .leftJoin(salesTable, eq(salesTable.customerId, customersTable.id))
    .where(search ? ilike(customersTable.name, `%${search}%`) : undefined)
    .groupBy(customersTable.id)
    .orderBy(customersTable.name);

  res.json(rows.map((c) => ({
    ...c,
    balance: parseFloat(c.balance ?? "0"),
    totalSales: parseFloat(c.totalSales ?? "0"),
  })));
});

router.post("/customers", async (req, res): Promise<void> => {
  const { name, phone, address, balance, notes } = req.body;
  if (!name) {
    res.status(400).json({ error: "الاسم مطلوب" });
    return;
  }
  const [c] = await db
    .insert(customersTable)
    .values({ name, phone, address, balance: String(balance ?? 0), notes })
    .returning();
  res.status(201).json({ ...c, balance: parseFloat(c.balance ?? "0"), totalSales: 0 });
});

router.get("/customers/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [c] = await db.select().from(customersTable).where(eq(customersTable.id, id));
  if (!c) {
    res.status(404).json({ error: "العميل غير موجود" });
    return;
  }
  res.json({ ...c, balance: parseFloat(c.balance ?? "0"), totalSales: 0 });
});

router.patch("/customers/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, phone, address, balance, notes } = req.body;
  const updates: Record<string, unknown> = {};
  if (name != null) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (address !== undefined) updates.address = address;
  if (balance != null) updates.balance = String(balance);
  if (notes !== undefined) updates.notes = notes;
  const [c] = await db
    .update(customersTable)
    .set(updates)
    .where(eq(customersTable.id, id))
    .returning();
  if (!c) {
    res.status(404).json({ error: "العميل غير موجود" });
    return;
  }
  res.json({ ...c, balance: parseFloat(c.balance ?? "0"), totalSales: 0 });
});

router.delete("/customers/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(customersTable).where(eq(customersTable.id, id));
  res.sendStatus(204);
});

export default router;
