import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, categoriesTable, medicinesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  const cats = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      icon: categoriesTable.icon,
      medicineCount: sql<string>`COUNT(${medicinesTable.id})`,
    })
    .from(categoriesTable)
    .leftJoin(medicinesTable, eq(medicinesTable.categoryId, categoriesTable.id))
    .groupBy(categoriesTable.id, categoriesTable.name, categoriesTable.icon)
    .orderBy(categoriesTable.name);

  res.json(cats.map((c) => ({ ...c, medicineCount: parseInt(c.medicineCount ?? "0") })));
});

router.post("/categories", async (req, res): Promise<void> => {
  const { name, icon } = req.body as { name: string; icon?: string };
  if (!name) {
    res.status(400).json({ error: "الاسم مطلوب" });
    return;
  }
  const [cat] = await db.insert(categoriesTable).values({ name, icon }).returning();
  res.status(201).json({ ...cat, medicineCount: 0 });
});

router.patch("/categories/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, icon } = req.body as { name?: string; icon?: string };
  const [cat] = await db
    .update(categoriesTable)
    .set({ name, icon })
    .where(eq(categoriesTable.id, id))
    .returning();
  if (!cat) {
    res.status(404).json({ error: "الفئة غير موجودة" });
    return;
  }
  res.json({ ...cat, medicineCount: 0 });
});

router.delete("/categories/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  res.sendStatus(204);
});

export default router;
