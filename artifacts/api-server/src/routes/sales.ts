import { Router, type IRouter } from "express";
import { eq, ilike, and, gte, lte, sql, desc } from "drizzle-orm";
import {
  db,
  salesTable,
  saleItemsTable,
  medicinesTable,
  customersTable,
  stockMovementsTable,
  auditLogTable,
} from "@workspace/db";

const router: IRouter = Router();

router.get("/sales", async (req, res): Promise<void> => {
  const { search, customer_id, date_from, date_to } = req.query as {
    search?: string;
    customer_id?: string;
    date_from?: string;
    date_to?: string;
  };

  const conditions: ReturnType<typeof and>[] = [];
  if (customer_id) conditions.push(eq(salesTable.customerId, parseInt(customer_id)));
  if (date_from) conditions.push(gte(salesTable.createdAt, new Date(date_from)));
  if (date_to) {
    const to = new Date(date_to);
    to.setDate(to.getDate() + 1);
    conditions.push(lte(salesTable.createdAt, to));
  }

  const rows = await db
    .select({
      id: salesTable.id,
      invoiceNumber: salesTable.invoiceNumber,
      customerId: salesTable.customerId,
      customerName: customersTable.name,
      total: salesTable.total,
      discount: salesTable.discount,
      finalTotal: salesTable.finalTotal,
      profit: salesTable.profit,
      status: salesTable.status,
      createdAt: salesTable.createdAt,
    })
    .from(salesTable)
    .leftJoin(customersTable, eq(customersTable.id, salesTable.customerId))
    .where(
      and(
        ...conditions,
        search ? ilike(salesTable.invoiceNumber, `%${search}%`) : undefined
      )
    )
    .orderBy(desc(salesTable.createdAt));

  const totals = rows.reduce(
    (acc, r) => ({
      totalSales: acc.totalSales + parseFloat(r.finalTotal ?? "0"),
      totalProfit: acc.totalProfit + parseFloat(r.profit ?? "0"),
    }),
    { totalSales: 0, totalProfit: 0 }
  );

  res.json({
    sales: rows.map((s) => ({
      ...s,
      total: parseFloat(s.total ?? "0"),
      discount: parseFloat(s.discount ?? "0"),
      finalTotal: parseFloat(s.finalTotal ?? "0"),
      profit: parseFloat(s.profit ?? "0"),
      createdAt: s.createdAt.toISOString(),
    })),
    totalCount: rows.length,
    totalSales: totals.totalSales,
    totalProfit: totals.totalProfit,
  });
});

router.post("/sales", async (req, res): Promise<void> => {
  const { customerId, discount = 0, items = [], status = "completed" } = req.body as {
    customerId?: number;
    discount?: number;
    items: { medicineId: number; quantity: number; unitPrice: number }[];
    status?: string;
  };

  if (!items.length) {
    res.status(400).json({ error: "يجب إضافة أصناف للفاتورة" });
    return;
  }

  let total = 0;
  let totalCost = 0;
  const enrichedItems: {
    medicineId: number;
    medicineName: string;
    quantity: number;
    unitPrice: number;
    purchasePrice: number;
    total: number;
  }[] = [];

  for (const item of items) {
    const [med] = await db
      .select()
      .from(medicinesTable)
      .where(eq(medicinesTable.id, item.medicineId));
    if (!med) {
      res.status(400).json({ error: `الدواء برقم ${item.medicineId} غير موجود` });
      return;
    }
    const itemTotal = item.quantity * item.unitPrice;
    const pp = parseFloat(med.purchasePrice ?? "0");
    total += itemTotal;
    totalCost += item.quantity * pp;
    enrichedItems.push({
      medicineId: item.medicineId,
      medicineName: med.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      purchasePrice: pp,
      total: itemTotal,
    });
  }

  const finalTotal = total - discount;
  const profit = finalTotal - totalCost;
  const invoiceNumber = `INV-${Date.now()}`;

  const [sale] = await db
    .insert(salesTable)
    .values({
      invoiceNumber,
      customerId: customerId ?? null,
      total: String(total),
      discount: String(discount),
      finalTotal: String(finalTotal),
      profit: String(profit),
      status,
    })
    .returning();

  for (const item of enrichedItems) {
    await db.insert(saleItemsTable).values({
      saleId: sale.id,
      medicineId: item.medicineId,
      medicineName: item.medicineName,
      quantity: item.quantity,
      unitPrice: String(item.unitPrice),
      purchasePrice: String(item.purchasePrice),
      total: String(item.total),
    });

    // Decrement stock
    await db
      .update(medicinesTable)
      .set({ quantity: sql`quantity - ${item.quantity}` })
      .where(eq(medicinesTable.id, item.medicineId));

    // Record stock movement
    await db.insert(stockMovementsTable).values({
      medicineId: item.medicineId,
      medicineName: item.medicineName,
      type: "sale",
      quantity: -item.quantity,
      reference: invoiceNumber,
    });
  }

  // Audit log
  await db.insert(auditLogTable).values({
    operation: "إنشاء فاتورة مبيعات",
    reference: invoiceNumber,
  });

  res.status(201).json({
    ...sale,
    total: parseFloat(sale.total ?? "0"),
    discount: parseFloat(sale.discount ?? "0"),
    finalTotal: parseFloat(sale.finalTotal ?? "0"),
    profit: parseFloat(sale.profit ?? "0"),
    createdAt: sale.createdAt.toISOString(),
    customerName: null,
  });
});

router.get("/sales/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [sale] = await db
    .select({
      id: salesTable.id,
      invoiceNumber: salesTable.invoiceNumber,
      customerId: salesTable.customerId,
      customerName: customersTable.name,
      total: salesTable.total,
      discount: salesTable.discount,
      finalTotal: salesTable.finalTotal,
      profit: salesTable.profit,
      status: salesTable.status,
      createdAt: salesTable.createdAt,
    })
    .from(salesTable)
    .leftJoin(customersTable, eq(customersTable.id, salesTable.customerId))
    .where(eq(salesTable.id, id));

  if (!sale) {
    res.status(404).json({ error: "الفاتورة غير موجودة" });
    return;
  }

  const items = await db
    .select()
    .from(saleItemsTable)
    .where(eq(saleItemsTable.saleId, id));

  res.json({
    ...sale,
    total: parseFloat(sale.total ?? "0"),
    discount: parseFloat(sale.discount ?? "0"),
    finalTotal: parseFloat(sale.finalTotal ?? "0"),
    profit: parseFloat(sale.profit ?? "0"),
    createdAt: sale.createdAt.toISOString(),
    items: items.map((i) => ({
      ...i,
      unitPrice: parseFloat(i.unitPrice ?? "0"),
      purchasePrice: parseFloat(i.purchasePrice ?? "0"),
      total: parseFloat(i.total ?? "0"),
    })),
  });
});

export default router;
