import { Router, type IRouter } from "express";
import { eq, ilike, or, sql, and, lte } from "drizzle-orm";
import { db, medicinesTable, categoriesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/medicines", async (req, res): Promise<void> => {
  const { search, filter, category_id } = req.query as {
    search?: string;
    filter?: string;
    category_id?: string;
  };

  const todayDate = new Date().toISOString().split("T")[0];
  const nearExpiryDate = new Date();
  nearExpiryDate.setDate(nearExpiryDate.getDate() + 90);
  const nearExpiryStr = nearExpiryDate.toISOString().split("T")[0];

  const meds = await db
    .select({
      id: medicinesTable.id,
      barcode: medicinesTable.barcode,
      name: medicinesTable.name,
      scientificName: medicinesTable.scientificName,
      manufacturer: medicinesTable.manufacturer,
      unit: medicinesTable.unit,
      categoryId: medicinesTable.categoryId,
      categoryName: categoriesTable.name,
      location: medicinesTable.location,
      purchasePrice: medicinesTable.purchasePrice,
      salePrice: medicinesTable.salePrice,
      quantity: medicinesTable.quantity,
      productionDate: medicinesTable.productionDate,
      expiryDate: medicinesTable.expiryDate,
      reorderLevel: medicinesTable.reorderLevel,
      createdAt: medicinesTable.createdAt,
    })
    .from(medicinesTable)
    .leftJoin(categoriesTable, eq(categoriesTable.id, medicinesTable.categoryId))
    .where(
      and(
        search
          ? or(
              ilike(medicinesTable.name, `%${search}%`),
              ilike(medicinesTable.barcode, `%${search}%`),
              ilike(medicinesTable.scientificName, `%${search}%`)
            )
          : undefined,
        category_id ? eq(medicinesTable.categoryId, parseInt(category_id)) : undefined,
        filter === "low_stock"
          ? sql`quantity <= COALESCE(reorder_level, 10)`
          : filter === "expired"
          ? sql`expiry_date IS NOT NULL AND expiry_date < ${todayDate}`
          : filter === "near_expiry"
          ? sql`expiry_date IS NOT NULL AND expiry_date >= ${todayDate} AND expiry_date <= ${nearExpiryStr}`
          : undefined
      )
    )
    .orderBy(medicinesTable.name);

  res.json(
    meds.map((m) => ({
      ...m,
      purchasePrice: parseFloat(m.purchasePrice ?? "0"),
      salePrice: parseFloat(m.salePrice ?? "0"),
      createdAt: m.createdAt.toISOString(),
    }))
  );
});

router.post("/medicines", async (req, res): Promise<void> => {
  const body = req.body;
  if (!body.name) {
    res.status(400).json({ error: "اسم الدواء مطلوب" });
    return;
  }
  const [med] = await db
    .insert(medicinesTable)
    .values({
      barcode: body.barcode ?? null,
      name: body.name,
      scientificName: body.scientificName ?? null,
      manufacturer: body.manufacturer ?? null,
      unit: body.unit ?? null,
      categoryId: body.categoryId ?? null,
      location: body.location ?? null,
      purchasePrice: String(body.purchasePrice ?? 0),
      salePrice: String(body.salePrice ?? 0),
      quantity: body.quantity ?? 0,
      productionDate: body.productionDate ?? null,
      expiryDate: body.expiryDate ?? null,
      reorderLevel: body.reorderLevel ?? 10,
    })
    .returning();
  res.status(201).json({
    ...med,
    purchasePrice: parseFloat(med.purchasePrice ?? "0"),
    salePrice: parseFloat(med.salePrice ?? "0"),
    createdAt: med.createdAt.toISOString(),
    categoryName: null,
  });
});

router.get("/medicines/barcode/:barcode", async (req, res): Promise<void> => {
  const barcode = Array.isArray(req.params.barcode) ? req.params.barcode[0] : req.params.barcode;
  const [med] = await db
    .select()
    .from(medicinesTable)
    .where(eq(medicinesTable.barcode, barcode));
  if (!med) {
    res.status(404).json({ error: "الدواء غير موجود" });
    return;
  }
  res.json({
    ...med,
    purchasePrice: parseFloat(med.purchasePrice ?? "0"),
    salePrice: parseFloat(med.salePrice ?? "0"),
    createdAt: med.createdAt.toISOString(),
    categoryName: null,
  });
});

router.get("/medicines/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [med] = await db
    .select({
      id: medicinesTable.id,
      barcode: medicinesTable.barcode,
      name: medicinesTable.name,
      scientificName: medicinesTable.scientificName,
      manufacturer: medicinesTable.manufacturer,
      unit: medicinesTable.unit,
      categoryId: medicinesTable.categoryId,
      categoryName: categoriesTable.name,
      location: medicinesTable.location,
      purchasePrice: medicinesTable.purchasePrice,
      salePrice: medicinesTable.salePrice,
      quantity: medicinesTable.quantity,
      productionDate: medicinesTable.productionDate,
      expiryDate: medicinesTable.expiryDate,
      reorderLevel: medicinesTable.reorderLevel,
      createdAt: medicinesTable.createdAt,
    })
    .from(medicinesTable)
    .leftJoin(categoriesTable, eq(categoriesTable.id, medicinesTable.categoryId))
    .where(eq(medicinesTable.id, id));
  if (!med) {
    res.status(404).json({ error: "الدواء غير موجود" });
    return;
  }
  res.json({
    ...med,
    purchasePrice: parseFloat(med.purchasePrice ?? "0"),
    salePrice: parseFloat(med.salePrice ?? "0"),
    createdAt: med.createdAt.toISOString(),
  });
});

router.patch("/medicines/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const body = req.body;
  const updates: Record<string, unknown> = {};
  if (body.name != null) updates.name = body.name;
  if (body.barcode !== undefined) updates.barcode = body.barcode;
  if (body.scientificName !== undefined) updates.scientificName = body.scientificName;
  if (body.manufacturer !== undefined) updates.manufacturer = body.manufacturer;
  if (body.unit !== undefined) updates.unit = body.unit;
  if (body.categoryId !== undefined) updates.categoryId = body.categoryId;
  if (body.location !== undefined) updates.location = body.location;
  if (body.purchasePrice != null) updates.purchasePrice = String(body.purchasePrice);
  if (body.salePrice != null) updates.salePrice = String(body.salePrice);
  if (body.quantity != null) updates.quantity = body.quantity;
  if (body.productionDate !== undefined) updates.productionDate = body.productionDate;
  if (body.expiryDate !== undefined) updates.expiryDate = body.expiryDate;
  if (body.reorderLevel !== undefined) updates.reorderLevel = body.reorderLevel;

  const [med] = await db
    .update(medicinesTable)
    .set(updates)
    .where(eq(medicinesTable.id, id))
    .returning();
  if (!med) {
    res.status(404).json({ error: "الدواء غير موجود" });
    return;
  }
  res.json({
    ...med,
    purchasePrice: parseFloat(med.purchasePrice ?? "0"),
    salePrice: parseFloat(med.salePrice ?? "0"),
    createdAt: med.createdAt.toISOString(),
    categoryName: null,
  });
});

router.delete("/medicines/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(medicinesTable).where(eq(medicinesTable.id, id));
  res.sendStatus(204);
});

export default router;
