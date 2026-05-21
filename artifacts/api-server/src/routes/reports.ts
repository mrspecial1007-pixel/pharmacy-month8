import { Router, type IRouter } from "express";
import { eq, sql, and, gte, lte, desc } from "drizzle-orm";
import {
  db,
  medicinesTable,
  categoriesTable,
  salesTable,
  saleItemsTable,
  expensesTable,
} from "@workspace/db";

const router: IRouter = Router();

router.get("/reports/expiry-analysis", async (req, res): Promise<void> => {
  const { period = "3months" } = req.query as { period?: string };
  const days = period === "1month" ? 30 : period === "6months" ? 180 : 90;

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  const futureDateStr = futureDate.toISOString().split("T")[0];
  const todayStr = new Date().toISOString().split("T")[0];

  const meds = await db
    .select()
    .from(medicinesTable)
    .where(
      sql`expiry_date IS NOT NULL AND expiry_date >= ${todayStr} AND expiry_date <= ${futureDateStr}`
    )
    .orderBy(medicinesTable.expiryDate);

  res.json(
    meds.map((m) => {
      const expiry = new Date(m.expiryDate!);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysUntil = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const urgency = daysUntil <= 30 ? "critical" : daysUntil <= 60 ? "high" : "medium";
      return {
        id: m.id,
        name: m.name,
        barcode: m.barcode,
        expiryDate: m.expiryDate,
        quantity: m.quantity,
        daysUntilExpiry: daysUntil,
        urgency,
      };
    })
  );
});

router.get("/reports/stock-by-category", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      categoryName: sql<string>`COALESCE(${categoriesTable.name}, 'غير مصنفة')`,
      medicineCount: sql<string>`COUNT(${medicinesTable.id})`,
      totalQuantity: sql<string>`COALESCE(SUM(${medicinesTable.quantity}), 0)`,
      totalValue: sql<string>`COALESCE(SUM(${medicinesTable.quantity} * CAST(${medicinesTable.salePrice} AS numeric)), 0)`,
    })
    .from(medicinesTable)
    .leftJoin(categoriesTable, eq(categoriesTable.id, medicinesTable.categoryId))
    .groupBy(categoriesTable.name)
    .orderBy(desc(sql`SUM(${medicinesTable.quantity} * CAST(${medicinesTable.salePrice} AS numeric))`));

  res.json(
    rows.map((r) => ({
      categoryName: r.categoryName,
      medicineCount: parseInt(r.medicineCount ?? "0"),
      totalQuantity: parseInt(r.totalQuantity ?? "0"),
      totalValue: parseFloat(r.totalValue ?? "0"),
    }))
  );
});

router.get("/reports/top-selling", async (req, res): Promise<void> => {
  const { limit = "10" } = req.query as { limit?: string };
  const limitNum = parseInt(limit, 10);

  const rows = await db
    .select({
      medicineId: saleItemsTable.medicineId,
      medicineName: saleItemsTable.medicineName,
      totalQuantity: sql<string>`SUM(${saleItemsTable.quantity})`,
      totalRevenue: sql<string>`SUM(CAST(${saleItemsTable.total} AS numeric))`,
      totalProfit: sql<string>`SUM(CAST(${saleItemsTable.total} AS numeric) - (${saleItemsTable.quantity} * CAST(${saleItemsTable.purchasePrice} AS numeric)))`,
    })
    .from(saleItemsTable)
    .groupBy(saleItemsTable.medicineId, saleItemsTable.medicineName)
    .orderBy(desc(sql`SUM(${saleItemsTable.quantity})`))
    .limit(limitNum);

  res.json(
    rows.map((r) => ({
      medicineId: r.medicineId,
      medicineName: r.medicineName,
      totalQuantity: parseInt(r.totalQuantity ?? "0"),
      totalRevenue: parseFloat(r.totalRevenue ?? "0"),
      totalProfit: parseFloat(r.totalProfit ?? "0"),
    }))
  );
});

router.get("/reports/profitability", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      medicineId: saleItemsTable.medicineId,
      medicineName: saleItemsTable.medicineName,
      totalRevenue: sql<string>`SUM(CAST(${saleItemsTable.total} AS numeric))`,
      totalCost: sql<string>`SUM(${saleItemsTable.quantity} * CAST(${saleItemsTable.purchasePrice} AS numeric))`,
      profit: sql<string>`SUM(CAST(${saleItemsTable.total} AS numeric) - (${saleItemsTable.quantity} * CAST(${saleItemsTable.purchasePrice} AS numeric)))`,
    })
    .from(saleItemsTable)
    .groupBy(saleItemsTable.medicineId, saleItemsTable.medicineName)
    .orderBy(desc(sql`SUM(CAST(${saleItemsTable.total} AS numeric) - (${saleItemsTable.quantity} * CAST(${saleItemsTable.purchasePrice} AS numeric)))`));

  res.json(
    rows.map((r) => {
      const revenue = parseFloat(r.totalRevenue ?? "0");
      const cost = parseFloat(r.totalCost ?? "0");
      const profit = parseFloat(r.profit ?? "0");
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      return {
        medicineId: r.medicineId,
        medicineName: r.medicineName,
        totalRevenue: revenue,
        totalCost: cost,
        profit,
        margin: Math.round(margin * 100) / 100,
      };
    })
  );
});

router.get("/reports/daily-sales", async (req, res): Promise<void> => {
  const { period = "today" } = req.query as { period?: string };

  let startDate: Date;
  const now = new Date();

  if (period === "today") {
    startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    startDate = new Date(now.getFullYear(), 0, 1);
  }

  const [salesRow] = await db
    .select({
      totalSales: sql<string>`COALESCE(SUM(CAST(final_total AS numeric)), 0)`,
      totalProfit: sql<string>`COALESCE(SUM(CAST(profit AS numeric)), 0)`,
      invoiceCount: sql<string>`COUNT(*)`,
    })
    .from(salesTable)
    .where(gte(salesTable.createdAt, startDate));

  const [expensesRow] = await db
    .select({ totalExpenses: sql<string>`COALESCE(SUM(CAST(amount AS numeric)), 0)` })
    .from(expensesTable)
    .where(gte(expensesTable.createdAt, startDate));

  res.json({
    totalSales: parseFloat(salesRow?.totalSales ?? "0"),
    totalProfit: parseFloat(salesRow?.totalProfit ?? "0"),
    totalExpenses: parseFloat(expensesRow?.totalExpenses ?? "0"),
    invoiceCount: parseInt(salesRow?.invoiceCount ?? "0"),
    period,
  });
});

export default router;
