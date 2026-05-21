import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, paymentsTable, suppliersTable, customersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/payments", async (req, res): Promise<void> => {
  const { party_type, party_id } = req.query as {
    party_type?: string;
    party_id?: string;
  };

  const conditions = [];
  if (party_type) conditions.push(eq(paymentsTable.partyType, party_type));
  if (party_id) conditions.push(eq(paymentsTable.partyId, parseInt(party_id)));

  const rows = await db
    .select()
    .from(paymentsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(paymentsTable.createdAt));

  res.json(
    rows.map((p) => ({
      ...p,
      amount: parseFloat(p.amount ?? "0"),
      createdAt: p.createdAt.toISOString(),
    }))
  );
});

router.post("/payments", async (req, res): Promise<void> => {
  const { partyType, partyId, amount, method, notes } = req.body as {
    partyType: string;
    partyId?: number;
    amount: number;
    method: string;
    notes?: string;
  };

  if (!partyType || !amount || !method) {
    res.status(400).json({ error: "بيانات ناقصة" });
    return;
  }

  // Resolve party name
  let partyName: string | null = null;
  if (partyId) {
    if (partyType === "supplier") {
      const [s] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, partyId));
      partyName = s?.name ?? null;
    } else {
      const [c] = await db.select().from(customersTable).where(eq(customersTable.id, partyId));
      partyName = c?.name ?? null;
    }
  }

  const [p] = await db
    .insert(paymentsTable)
    .values({
      partyType,
      partyId: partyId ?? null,
      partyName,
      amount: String(amount),
      method,
      notes: notes ?? null,
    })
    .returning();

  res.status(201).json({
    ...p,
    amount: parseFloat(p.amount ?? "0"),
    createdAt: p.createdAt.toISOString(),
  });
});

export default router;
