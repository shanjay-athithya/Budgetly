import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Schema, model, models } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/budgetly';
if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined');

if (!mongoose.connections[0].readyState) {
    mongoose.connect(MONGODB_URI, { dbName: 'budgetly' });
}

const IncomeSchema = new Schema({
    amount: { type: Number, required: true },
    date: { type: String, required: true }, // YYYY-MM
    source: { type: String },
    recurring: { type: Boolean, default: false },
});
const ExpenseSchema = new Schema({ name: String, amount: Number, category: String });
const UserProfileSchema = new Schema({
    uid: { type: String, required: true, unique: true },
    name: String,
    incomes: [IncomeSchema],
    fixedExpenses: [ExpenseSchema],
    savings: Number,
    location: String,
    occupation: String,
});
const UserProfile = models.UserProfile || model('UserProfile', UserProfileSchema);

export async function POST(req: NextRequest) {
    const { uid, name, incomes, fixedExpenses, savings, location, occupation } = await req.json();
    if (!uid) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    try {
        // If name is provided, update all fields (profile setup)
        // If only incomes is provided, update only incomes
        let update: any = {};
        if (name !== undefined) {
            update = { name, fixedExpenses, savings, location, occupation, incomes };
        } else if (incomes !== undefined) {
            update = { incomes };
        }
        const profile = await UserProfile.findOneAndUpdate(
            { uid },
            { $set: update },
            { upsert: true, new: true }
        );
        return NextResponse.json({ profile });
    } catch {
        return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');
    if (!uid) return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    try {
        const profile = await UserProfile.findOne({ uid });
        return NextResponse.json({ profile });
    } catch {
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
} 