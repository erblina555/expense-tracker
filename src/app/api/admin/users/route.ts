import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const adminEmail = process.env.ADMIN_EMAIL ?? "erblinakalludra5@gmail.com";

type ExpenseRow = {
  amount: number | string;
  user_id: string;
};

type ProfileRow = {
  id: string;
  monthly_budget: number | string | null;
};

type AlertRow = {
  user_id: string;
};

function getClients() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return null;
  }

  return {
    admin: createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }),
    auth: createClient(supabaseUrl, supabaseAnonKey),
  };
}

async function verifyAdmin(request: NextRequest) {
  const clients = getClients();

  if (!clients) {
    return {
      error: NextResponse.json(
        { error: "Admin environment variables are missing." },
        { status: 500 },
      ),
    };
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.replace("Bearer ", "");

  if (!token) {
    return {
      error: NextResponse.json({ error: "Missing auth token." }, { status: 401 }),
    };
  }

  const { data, error } = await clients.auth.auth.getUser(token);

  if (error || data.user?.email !== adminEmail) {
    return {
      error: NextResponse.json({ error: "Admin access denied." }, { status: 403 }),
    };
  }

  return { clients };
}

export async function GET(request: NextRequest) {
  const verification = await verifyAdmin(request);

  if (verification.error) {
    return verification.error;
  }

  const { clients } = verification;
  const [{ data: usersData, error: usersError }, profiles, expenses, alerts] =
    await Promise.all([
      clients.admin.auth.admin.listUsers({ page: 1, perPage: 100 }),
      clients.admin.from("profiles").select("id, monthly_budget"),
      clients.admin.from("expenses").select("user_id, amount"),
      clients.admin.from("budget_alerts").select("user_id"),
    ]);

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  const profileRows = (profiles.data ?? []) as ProfileRow[];
  const expenseRows = (expenses.data ?? []) as ExpenseRow[];
  const alertRows = (alerts.data ?? []) as AlertRow[];

  const users = usersData.users.map((user) => {
    const userExpenses = expenseRows.filter((row) => row.user_id === user.id);
    const profile = profileRows.find((row) => row.id === user.id);
    const totalSpent = userExpenses.reduce(
      (sum, row) => sum + Number(row.amount),
      0,
    );

    return {
      budget: Number(profile?.monthly_budget ?? 0),
      createdAt: user.created_at,
      email: user.email,
      expenseCount: userExpenses.length,
      id: user.id,
      isAdmin: user.email === adminEmail,
      lastSignIn: user.last_sign_in_at,
      totalAlerts: alertRows.filter((row) => row.user_id === user.id).length,
      totalSpent,
    };
  });

  return NextResponse.json({
    totals: {
      expenses: expenseRows.length,
      users: users.length,
    },
    users,
  });
}

export async function DELETE(request: NextRequest) {
  const verification = await verifyAdmin(request);

  if (verification.error) {
    return verification.error;
  }

  const { clients } = verification;
  const body = (await request.json()) as { userId?: string };

  if (!body.userId) {
    return NextResponse.json({ error: "Missing user id." }, { status: 400 });
  }

  const { data: adminUserData } = await clients.auth.auth.getUser(
    request.headers.get("authorization")?.replace("Bearer ", "") ?? "",
  );

  if (body.userId === adminUserData.user?.id) {
    return NextResponse.json(
      { error: "Admin account cannot delete itself." },
      { status: 400 },
    );
  }

  const { error } = await clients.admin.auth.admin.deleteUser(body.userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
