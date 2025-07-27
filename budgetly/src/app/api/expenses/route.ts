import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongoose';
import User from '../../../../models/User';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');
        const month = searchParams.get('month');

        if (!uid) {
            return NextResponse.json({ error: 'UID is required' }, { status: 400 });
        }

        const user = await User.findByUID(uid);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (month) {
            const monthData = user.getMonthData(month);
            return NextResponse.json({ expenses: monthData.expenses });
        }

        // Return all expenses from all months
        const allExpenses = [];
        for (const [monthKey, monthData] of Object.entries(user.months)) {
            monthData.expenses.forEach(expense => {
                allExpenses.push({
                    ...expense.toObject(),
                    month: monthKey
                });
            });
        }

        return NextResponse.json({ expenses: allExpenses });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const { uid, month, expense } = body;

        if (!uid || !month || !expense) {
            return NextResponse.json({ error: 'UID, month, and expense are required' }, { status: 400 });
        }

        const user = await User.findByUID(uid);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Validate expense data
        if (!expense.label || !expense.amount || !expense.category || !expense.date || !expense.type) {
            return NextResponse.json({ error: 'Invalid expense data' }, { status: 400 });
        }

        console.log('👤 User found before adding expense:', user._id);
        console.log('📊 User months before:', JSON.stringify(user.months, null, 2));

        // Direct MongoDB update approach
        const currentMonths = user.months || {};
        const currentMonthData = currentMonths[month] || { income: [], expenses: [] };

        // Ensure expenses is an array
        if (!Array.isArray(currentMonthData.expenses)) {
            currentMonthData.expenses = [];
        }

        // Add new expense entry with _id
        const newExpenseEntry = {
            ...expense,
            date: new Date(expense.date),
            _id: new Date().getTime().toString() // Simple ID generation
        };

        currentMonthData.expenses.push(newExpenseEntry);
        currentMonths[month] = currentMonthData;

        console.log('💾 About to update user with months:', JSON.stringify(currentMonths, null, 2));

        // Use findOneAndUpdate directly
        const updatedUser = await User.findOneAndUpdate(
            { _id: user._id },
            { $set: { months: currentMonths } },
            { new: true, runValidators: false }
        );

        console.log('✅ User updated successfully. Updated months:', JSON.stringify(updatedUser.months, null, 2));
        console.log('✅ Expense added successfully');

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error('Error adding expense:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const { uid, month, expenseId, expense } = body;

        if (!uid || !month || !expenseId || !expense) {
            return NextResponse.json({ error: 'UID, month, expenseId, and expense are required' }, { status: 400 });
        }

        const user = await User.findByUID(uid);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const currentMonths = user.months || {};
        const currentMonthData = currentMonths[month] || { income: [], expenses: [] };
        const expenseIndex = currentMonthData.expenses.findIndex((e: any) => e._id === expenseId);

        if (expenseIndex === -1) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        currentMonthData.expenses[expenseIndex] = {
            ...expense,
            date: new Date(expense.date),
            _id: expenseId // Keep the same ID
        };

        currentMonths[month] = currentMonthData;

        const updatedUser = await User.findOneAndUpdate(
            { _id: user._id },
            { $set: { months: currentMonths } },
            { new: true, runValidators: false }
        );

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error('Error updating expense:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');
        const month = searchParams.get('month');
        const expenseId = searchParams.get('expenseId');

        if (!uid || !month || !expenseId) {
            return NextResponse.json({ error: 'UID, month, and expenseId are required' }, { status: 400 });
        }

        const user = await User.findByUID(uid);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const currentMonths = user.months || {};
        const currentMonthData = currentMonths[month] || { income: [], expenses: [] };
        const expenseIndex = currentMonthData.expenses.findIndex((e: any) => e._id === expenseId);

        if (expenseIndex === -1) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        currentMonthData.expenses.splice(expenseIndex, 1);
        currentMonths[month] = currentMonthData;

        const updatedUser = await User.findOneAndUpdate(
            { _id: user._id },
            { $set: { months: currentMonths } },
            { new: true, runValidators: false }
        );

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error('Error deleting expense:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 