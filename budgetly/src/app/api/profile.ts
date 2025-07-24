import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose, { Schema, model, models } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined');

// Connect to MongoDB
if (!mongoose.connections[0].readyState) {
    mongoose.connect(MONGODB_URI, {
        dbName: 'budgetly',
    });
}

// Define the user profile schema
const IncomeSchema = new Schema({
    month: { type: String, required: true }, // e.g., '2024-06'
    amount: { type: Number, required: true },
});

const ExpenseSchema = new Schema({
    name: { type: String, required: true },
    amount: { type: Number, required: true },
});

const UserProfileSchema = new Schema({
    uid: { type: String, required: true, unique: true }, // Firebase UID
    name: { type: String, required: true },
    incomes: [IncomeSchema], // month-wise income
    fixedExpenses: [ExpenseSchema],
    savings: { type: Number },
    location: { type: String },
    occupation: { type: String },
});

const UserProfile = models.UserProfile || model('UserProfile', UserProfileSchema);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { uid, name, incomes, fixedExpenses, savings, location, occupation } = req.body;
        if (!uid || !name || !incomes) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        try {
            const profile = await UserProfile.findOneAndUpdate(
                { uid },
                { $set: { name, incomes, fixedExpenses, savings, location, occupation } },
                { upsert: true, new: true }
            );
            return res.status(200).json({ profile });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to save profile' });
        }
    } else if (req.method === 'GET') {
        const { uid } = req.query;
        if (!uid) return res.status(400).json({ error: 'Missing uid' });
        try {
            const profile = await UserProfile.findOne({ uid });
            return res.status(200).json({ profile });
        } catch (error) {
            return res.status(500).json({ error: 'Failed to fetch profile' });
        }
    } else {
        res.setHeader('Allow', ['POST', 'GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 