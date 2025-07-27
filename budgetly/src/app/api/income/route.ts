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
            return NextResponse.json({ income: monthData.income });
        }

        // Return all months data
        const monthsData = Object.fromEntries(user.months);
        return NextResponse.json(monthsData);
    } catch (error) {
        console.error('Error fetching income:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const { uid, month, amount } = body;

        if (!uid || !month || !amount) {
            return NextResponse.json({ error: 'UID, month, and amount are required' }, { status: 400 });
        }

        const user = await User.findByUID(uid);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        await user.addIncome(month, amount);

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error('Error adding income:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const { uid, month, amount } = body;

        if (!uid || !month || !amount) {
            return NextResponse.json({ error: 'UID, month, and amount are required' }, { status: 400 });
        }

        const user = await User.findByUID(uid);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Replace the total income amount (for editing)
        const monthData = user.getMonthData(month);
        monthData.income = amount;
        user.months.set(month, monthData);
        await user.save();

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error('Error updating income:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 