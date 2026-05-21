import { Router, type IRouter } from "express";
import { and, gte, lte, desc } from "drizzle-orm";
import { db, auditLogTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/audit-log", async (req, res): Promise<void> => {
  const { date_from, date_to } = req.query as { date_from?: string; date_to?: string };
  const conditions = [];
  if (date_from) conditions.push(gte(auditLogTable.createdAt, new Date(date_from)));
  if (date_to) {
    const to = new Date(date_to);
    to.setDate(to.getDate() + 1);
    conditions.push(lte(auditLogTable.createdAt, to));
  }

  const rows = await db
    .select()
    .from(auditLogTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(auditLogTable.createdAt))
    .limit(1000);

  res.json(rows.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })));
});

export default router;
