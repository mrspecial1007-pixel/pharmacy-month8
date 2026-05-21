import { Router, type IRouter } from "express";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import {
  db,
  purchasesTable,
  purchaseItemsTable,
  medicinesTable,
  suppliersTable,
  stockMovementsTable,
  auditLogTable,
} from "@workspace/db";

const router: IRouter = Router();

router.get("/purchases", async (req, res): Promise<void> => {
  const { supplier_id, date_from, date_to } = req.query as {
    supplier_id?: string;
    date_from?: string;
    date_to?: string;
  };

  const conditions = [];
  if (supplier_id) conditions.push(eq(purchasesTable.supplierId, parseInt(supplier_id)));
  if (date_from) conditions.push(gte(purchasesTable.createdAt, new Date(date_from)));
  if (date_to) {
    const to = new Date(date_to);
    to.setDate(to.getDate() + 1);
    conditions.push(lte(purchasesTable.createdAt, to));
  }

  const rows = await db
    .select({
      id: purchasesTable.id,
      invoiceNumber: purchasesTable.invoiceNumber,
      supplierId: purchasesTable.supplierId,
      supplierName: suppliersTable.name,
      total: purchasesTable.total,
      status: purchasesTable.status,
      createdAt: purchasesTable.createdAt,
    })
    .from(purchasesTable)
    .leftJoin(suppliersTable, eq(suppliersTable.id, purchasesTable.supplierId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(purchasesTable.createdAt));

  res.json(
    rows.map((p) => ({
      ...p,
      total: parseFloat(p.total ?? "0"),
      createdAt: p.createdAt.toISOString(),
    }))
  );
});

router.post("/purchases", async (req, res): Promise<void> => {
  const {
    supplierId,
    items = [],
  }: {
    supplierId?: number;
    items: {
      medicineId: number;
      quantity: number;
      unitPrice: number;
      productionDate?: string;
      expiryDate?: string;
    }[];
  } = req.body;

  if (!items.length) {
    res.status(400).json({ error: "يجب إضافة أصناف للفاتورة" });
    return;
  }

  let total = 0;
  const invoiceNumber = `PUR-${Date.now()}`;

  const [purchase] = await db
    .insert(purchasesTable)
    .values({
      invoiceNumber,
      supplierId: supplierId ?? null,
      total: "0",
      status: "completed",
    })
    .returning();

  for (const item of items) {
    const [med] = await db
      .select()
      .from(medicinesTable)
      .where(eq(medicinesTable.id, item.medicineId));

    const medicineName = med?.name ?? `دواء ${item.medicineId}`;
    const itemTotal = item.quantity * item.unitPrice;
    total += itemTotal;

    await db.insert(purchaseItemsTable).values({
      purchaseId: purchase.id,
      medicineId: item.medicineId,
      medicineName,
      quantity: item.quantity,
      unitPrice: String(item.unitPrice),
      total: String(itemTotal),
      productionDate: item.productionDate ?? null,
      expiryDate: item.expiryDate ?? null,
    });

    // Increment stock
    await db
      .update(medicinesTable)
      .set({
        quantity: sql`quantity + ${item.quantity}`,
        purchasePrice: String(item.unitPrice),
        productionDate: item.productionDate ? item.productionDate : undefined,
        expiryDate: item.expiryDate ? item.expiryDate : undefined,
      })
      .where(eq(medicinesTable.id, item.medicineId));

    // Stock movement
    await db.insert(stockMovementsTable).values({
      medicineId: item.medicineId,
      medicineName,
      type: "purchase",
      quantity: item.quantity,
      reference: invoiceNumber,
    });
  }

  await db
    .update(purchasesTable)
    .set({ total: String(total) })
    .where(eq(purchasesTable.id, purchase.id));

  // Audit log
  await db.insert(auditLogTable).values({
    operation: "تسجيل فاتورة مشتريات",
    reference: invoiceNumber,
  });

  res.status(201).json({
    ...purchase,
    total,
    createdAt: purchase.createdAt.toISOString(),
    supplierName: null,
  });
});

router.get("/purchases/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [purchase] = await db
    .select({
      id: purchasesTable.id,
      invoiceNumber: purchasesTable.invoiceNumber,
      supplierId: purchasesTable.supplierId,
      supplierName: suppliersTable.name,
      total: purchasesTable.total,
      status: purchasesTable.status,
      createdAt: purchasesTable.createdAt,
    })
    .from(purchasesTable)
    .leftJoin(suppliersTable, eq(suppliersTable.id, purchasesTable.supplierId))
    .where(eq(purchasesTable.id, id));

  if (!purchase) {
    res.status(404).json({ error: "الفاتورة غير موجودة" });
    return;
  }

  const items = await db
    .select()
    .from(purchaseItemsTable)
    .where(eq(purchaseItemsTable.purchaseId, id));

  res.json({
    ...purchase,
    total: parseFloat(purchase.total ?? "0"),
    createdAt: purchase.createdAt.toISOString(),
    items: items.map((i) => ({
      ...i,
      unitPrice: parseFloat(i.unitPrice ?? "0"),
      total: parseFloat(i.total ?? "0"),
    })),
  });
});

export default router;
