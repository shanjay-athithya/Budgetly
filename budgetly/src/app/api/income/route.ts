import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongoose';
import User from '../../../../models/User';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');
        const month = searchParams.get('month');

        console.log('📥 GET /api/income - UID:', uid, 'Month:', month);

        if (!uid) {
            return NextResponse.json({ error: 'UID is required' }, { status: 400 });
        }

        const user = await User.findByUID(uid);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        console.log('👤 User found:', user._id);
        console.log('📊 User months data:', JSON.stringify(user.months, null, 2));

        if (month) {
            // Return specific month data
            const monthData = user.getMonthData(month);
            console.log('📋 Month data for', month, ':', JSON.stringify(monthData, null, 2));
            return NextResponse.json({
                income: monthData.income || [],
                totalIncome: (monthData.income || []).reduce((sum: number, item: any) => sum + item.amount, 0)
            });
        }

        // Return all months data
        const monthsData = Object.fromEntries(user.months);
        console.log('📊 All months data:', JSON.stringify(monthsData, null, 2));
        return NextResponse.json(monthsData);
    } catch (error) {
        console.error('❌ Error fetching income:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const { uid, month, incomeEntry } = body;

        console.log('📥 POST /api/income - Request body:', JSON.stringify(body, null, 2));

        if (!uid || !month || !incomeEntry) {
            return NextResponse.json({ error: 'UID, month, and incomeEntry are required' }, { status: 400 });
        }

        const user = await User.findByUID(uid);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        console.log('👤 User found before adding income:', user._id);
        console.log('📊 User months before:', JSON.stringify(user.months, null, 2));

        // Direct MongoDB update approach
        const currentMonths = user.months || {};
        const currentMonthData = currentMonths[month] || { income: [], expenses: [] };
        
        // Ensure income is an array
        if (!Array.isArray(currentMonthData.income)) {
            currentMonthData.income = [];
        }
        
        // Add new income entry with _id
        const newIncomeEntry = {
            ...incomeEntry,
            _id: new Date().getTime().toString() // Simple ID generation
        };
        
        currentMonthData.income.push(newIncomeEntry);
        currentMonths[month] = currentMonthData;
        
        console.log('💾 About to update user with months:', JSON.stringify(currentMonths, null, 2));
        
        // Use findOneAndUpdate directly
        const updatedUser = await User.findOneAndUpdate(
            { _id: user._id },
            { $set: { months: currentMonths } },
            { new: true, runValidators: false }
        );
        
        console.log('✅ User updated successfully. Updated months:', JSON.stringify(updatedUser.months, null, 2));
        console.log('✅ Income added successfully');

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error('❌ Error adding income:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const { uid, month, incomeId, incomeEntry } = body;

        if (!uid || !month || !incomeId || !incomeEntry) {
            return NextResponse.json({ error: 'UID, month, incomeId, and incomeEntry are required' }, { status: 400 });
        }

        const user = await User.findByUID(uid);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Update specific income entry
        const monthData = user.getMonthData(month);
        const incomeIndex = monthData.income.findIndex((item: any) => item._id === incomeId);

        if (incomeIndex === -1) {
            return NextResponse.json({ error: 'Income entry not found' }, { status: 404 });
        }

        monthData.income[incomeIndex] = { ...monthData.income[incomeIndex], ...incomeEntry };
        user.months[month] = monthData;
        await user.save({ validateBeforeSave: false });

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error('Error updating income:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const { uid, month, incomeId } = body;

        if (!uid || !month || !incomeId) {
            return NextResponse.json({ error: 'UID, month, and incomeId are required' }, { status: 400 });
        }

        const user = await User.findByUID(uid);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Delete specific income entry
        const monthData = user.getMonthData(month);
        monthData.income = monthData.income.filter((item: any) => item._id !== incomeId);
        user.months[month] = monthData;
        await user.save({ validateBeforeSave: false });

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error('Error deleting income:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 