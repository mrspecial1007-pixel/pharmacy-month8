import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  medicinesTable,
  salesTable,
  saleItemsTable,
  expensesTable,
} from "@workspace/db";
import { sql, gte, lte, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todaySalesRow] = await db
    .select({
      total: sql<string>`COALESCE(SUM(final_total), 0)`,
      profit: sql<string>`COALESCE(SUM(profit), 0)`,
    })
    .from(salesTable)
    .where(
      and(
        gte(salesTable.createdAt, today),
        lte(salesTable.createdAt, tomorrow)
      )
    );

  const todayExpensesRow = await db
    .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
    .from(expensesTable)
    .where(
      and(
        gte(expensesTable.createdAt, today),
        lte(expensesTable.createdAt, tomorrow)
      )
    );

  const todaySales = parseFloat(todaySalesRow?.total ?? "0");
  const todayProfit = parseFloat(todaySalesRow?.profit ?? "0");
  const todayExpenses = parseFloat(todayExpensesRow[0]?.total ?? "0");

  const [medicineStats] = await db
    .select({
      total: sql<string>`COUNT(*)`,
      stockValue: sql<string>`COALESCE(SUM(quantity * CAST(sale_price AS numeric)), 0)`,
    })
    .from(medicinesTable);

  const expiredNow = new Date().toISOString().split("T")[0];
  const [expiredRow] = await db
    .select({ count: sql<string>`COUNT(*)` })
    .from(medicinesTable)
    .where(sql`expiry_date IS NOT NULL AND expiry_date < ${expiredNow}`);

  const [lowStockRow] = await db
    .select({ count: sql<string>`COUNT(*)` })
    .from(medicinesTable)
    .where(sql`quantity <= COALESCE(reorder_level, 10)`);

  res.json({
    todaySales,
    netProfit: todayProfit - todayExpenses,
    totalMedicines: parseInt(medicineStats?.total ?? "0"),
    stockValue: parseFloat(medicineStats?.stockValue ?? "0"),
    expiredCount: parseInt(expiredRow?.count ?? "0"),
    lowStockCount: parseInt(lowStockRow?.count ?? "0"),
  });
});

router.get("/dashboard/sales-chart", async (req, res): Promise<void> => {
  const days: { date: string; sales: number; profit: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);

    const [row] = await db
      .select({
        sales: sql<string>`COALESCE(SUM(final_total), 0)`,
        profit: sql<string>`COALESCE(SUM(profit), 0)`,
      })
      .from(salesTable)
      .where(and(gte(salesTable.createdAt, d), lte(salesTable.createdAt, next)));

    days.push({
      date: d.toLocaleDateString("ar-SA", { month: "short", day: "numeric" }),
      sales: parseFloat(row?.sales ?? "0"),
      profit: parseFloat(row?.profit ?? "0"),
    });
  }
  res.json(days);
});

router.get("/dashboard/alerts", async (req, res): Promise<void> => {
  const expiryThreshold = new Date();
  expiryThreshold.setDate(expiryThreshold.getDate() + 90);
  const thresholdDate = expiryThreshold.toISOString().split("T")[0];
  const todayDate = new Date().toISOString().split("T")[0];

  const lowStock = await db
    .select({
      id: medicinesTable.id,
      name: medicinesTable.name,
      quantity: medicinesTable.quantity,
      expiryDate: medicinesTable.expiryDate,
      reorderLevel: medicinesTable.reorderLevel,
    })
    .from(medicinesTable)
    .where(sql`quantity <= COALESCE(reorder_level, 10)`)
    .limit(20);

  const nearExpiry = await db
    .select({
      id: medicinesTable.id,
      name: medicinesTable.name,
      quantity: medicinesTable.quantity,
      expiryDate: medicinesTable.expiryDate,
      reorderLevel: medicinesTable.reorderLevel,
    })
    .from(medicinesTable)
    .where(
      sql`expiry_date IS NOT NULL AND expiry_date >= ${todayDate} AND expiry_date <= ${thresholdDate}`
    )
    .limit(20);

  res.json({ lowStock, nearExpiry });
});

export default router;
