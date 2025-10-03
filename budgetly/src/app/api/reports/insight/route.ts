import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongoose';
import User, { IUserModel } from '../../../../../models/User';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
        }
        const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        const genAI = new GoogleGenAI({ apiKey: geminiKey });

        const body = await request.json();
        const { uid, month } = body as { uid?: string; month?: string };
        if (!uid || !month) {
            return NextResponse.json({ error: 'uid and month are required' }, { status: 400 });
        }

        const user = await (User as IUserModel).findByUID(uid);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const monthData = user.getMonthData(month);
        const income = Array.isArray(monthData.income) ? monthData.income.reduce((s, i) => s + i.amount, 0) : 0;
        const expenses = Array.isArray(monthData.expenses) ? monthData.expenses.reduce((s, e) => s + e.amount, 0) : 0;
        const emis = Array.isArray(monthData.expenses) ? monthData.expenses.filter(e => e.type === 'emi').reduce((s, e) => s + e.amount, 0) : 0;
        const savingsTotal = user.savings || 0;

        // Category breakdown
        const categoryTotals: Record<string, number> = {};
        if (Array.isArray(monthData.expenses)) {
            for (const e of monthData.expenses) {
                categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
            }
        }

        const prompt = {
            income,
            expenses,
            emis,
            savingsTotal,
            expenseRatio: income > 0 ? (expenses / income) * 100 : 0,
            categories: categoryTotals,
            month
        };

        const system = `Write a concise monthly financial report statement (3-5 sentences) for an Indian user (INR). Mention income, expenses, savings impact, EMI burden, and the top overspend categories if any. Keep it actionable, polite, and neutral.`;

        const resp = await genAI.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{ text: system }, { text: JSON.stringify(prompt) }] }],
            // @ts-ignore
            config: { thinkingConfig: { thinkingBudget: 0 } }
        } as any);

        const text = (resp as any)?.response?.text || (resp as any)?.text || (resp as any)?.response?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join('\n');
        if (!text) return NextResponse.json({ error: 'Failed to generate report insight' }, { status: 502 });

        return NextResponse.json({ insight: String(text) });
    } catch (error: any) {
        const msg = error?.message || 'Internal server error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}


