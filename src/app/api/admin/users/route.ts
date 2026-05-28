import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAIL = "erblinakalludra5@gmail.com";

export async function GET() {
  try {
    const {
      data: { users: authUsers },
      error,
    } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const users = await Promise.all(
      authUsers.map(async (user) => {
        const { data: expenses } = await supabaseAdmin
          .from("expenses")
          .select("*")
          .eq("user_id", user.id);

        const totalSpent =
          expenses?.reduce(
            (sum, expense) =>
              sum + Number(expense.amount || 0),
            0
          ) || 0;

        return {
          id: user.id,
          email: user.email,
          createdAt: user.created_at,
          expenseCount: expenses?.length || 0,
          totalSpent,
          totalAlerts: totalSpent >= 250 ? 1 : 0,
          budget: 300,
          isAdmin: user.email === ADMIN_EMAIL,
        };
      })
    );

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      { error: "Admin dashboard error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    await supabaseAdmin.auth.admin.deleteUser(
      body.userId
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}