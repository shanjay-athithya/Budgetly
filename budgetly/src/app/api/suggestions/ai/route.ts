import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongoose';
import User, { IUserModel } from '../../../../../models/User';

import ProductSuggestion from '../../../../../models/ProductSuggestion';
import { GoogleGenAI } from '@google/genai';

type AISuggestionResponse = {
    suggestionScore: 'Good' | 'Moderate' | 'Risky';
    reason: string;
    derived?: {
        monthlyEMI?: number;
        duration?: number;
        price?: number;
    };
    explanation?: string;
};

export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        // Gemini-only
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
        }
        const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        const genAI = new GoogleGenAI({ apiKey: geminiKey });

        const body = await request.json();
        const { uid, productName, price, monthlyEMI, duration, category, month } = body as {
            uid?: string;
            productName?: string;
            price?: number;
            monthlyEMI?: number;
            duration?: number;
            category?: string;
            month?: string;
        };

        if (!uid || !productName) {
            return NextResponse.json({ error: 'uid and productName are required' }, { status: 400 });
        }

        if (!price && !(monthlyEMI && duration)) {
            return NextResponse.json({ error: 'Provide price or (monthlyEMI and duration)' }, { status: 400 });
        }

        const user = await (User as IUserModel).findByUID(uid);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthKey = month || currentMonth;
        const monthData = user.getMonthData(monthKey);
        const monthIncome = Array.isArray(monthData.income)
            ? monthData.income.reduce((s, i) => s + i.amount, 0)
            : 0;
        const monthExpenses = Array.isArray(monthData.expenses)
            ? monthData.expenses.reduce((s, e) => s + e.amount, 0)
            : 0;
        const monthEMIs = Array.isArray(monthData.expenses)
            ? monthData.expenses.filter(e => e.type === 'emi').reduce((s, e) => s + e.amount, 0)
            : 0;

        const isOneTime = typeof price === 'number' && !(typeof monthlyEMI === 'number' && monthlyEMI > 0);

        const payload = {
            monthlyIncome: monthIncome,
            monthlyExpenses: monthExpenses,
            existingEMIs: monthEMIs,
            savings: user.savings || 0,
            paymentType: isOneTime ? 'one-time' : 'emi',
            product: {
                productName,
                price: price ?? undefined,
                monthlyEMI: monthlyEMI ?? undefined,
                duration: duration ?? undefined,
                category: category ?? undefined,
            },
            month: monthKey
        };

        const system = `Respond with ONLY strict JSON (no prose, no markdown), matching exactly this shape:
{"suggestionScore":"Good|Moderate|Risky","reason":"short one-line","derived":{"monthlyEMI":number,"duration":number,"price":number},"explanation":"2-4 sentences with key trade-offs"}
Context: India (INR). Prefer conservative advice. Safety heuristics: monthlyEMI <= 25% of income; total EMIs <= 40% of income; expense ratio <= 80%; savings buffer > 10% of income.
Obey paymentType strictly:
- If paymentType == "one-time": set derived.monthlyEMI = 0, derived.duration = 0, derived.price = provided price.
- If paymentType == "emi": do NOT change provided duration; set derived.duration = provided duration; if price missing, set derived.price = monthlyEMI * duration.`;

        // For one-time purchases, avoid LLM and apply deterministic scoring
        if (isOneTime) {
            const expenseRatio = monthIncome > 0 ? (monthExpenses / monthIncome) * 100 : 0;
            let suggestionScore: 'Good' | 'Moderate' | 'Risky' = 'Moderate';
            let reason = 'Moderate impact on liquidity';
            if (price && (price <= (user.savings || 0) * 0.1) && expenseRatio <= 70) {
                suggestionScore = 'Good';
                reason = 'Small portion of savings and healthy expense ratio';
            } else if (price && (price <= (user.savings || 0) * 0.3) && expenseRatio <= 80) {
                suggestionScore = 'Moderate';
                reason = 'Manageable portion of savings; watch monthly expenses';
            } else {
                suggestionScore = 'Risky';
                reason = 'Large draw on savings or high expense ratio';
            }

            const explanation = `One-time purchase assessed against current savings (₹${(user.savings || 0).toLocaleString()}) and expense ratio (${expenseRatio.toFixed(1)}%).`;

            const suggestion = new ProductSuggestion({
                uid,
                productName,
                price: price!,
                emiAmount: 0,
                duration: 0,
                suggestionScore,
                reason,
                suggestedAt: new Date(),
            });
            await suggestion.save();

            return NextResponse.json({ suggestion, explanation });
        }

        // Gemini SDK call
        let content: string | undefined;
        try {
            const resp = await genAI.models.generateContent({
                model,
                contents: [
                    { role: 'user', parts: [{ text: system }, { text: JSON.stringify(payload) }] }
                ],
                // Optional on 2.5 models; safe to omit if unsupported
                config: {}
            });
            const r = resp as {
                response?: {
                    text?: string;
                    candidates?: { content?: { parts?: { text?: string }[] } }[]
                };
                text?: string;
            };
            const parts = r.response?.candidates?.[0]?.content?.parts || [];
            const joined = Array.isArray(parts) ? parts.map(p => p?.text).filter(Boolean).join('') : undefined;
            const respText = r.response?.text || r.text || joined;
            if (respText && typeof respText === 'string') content = respText;
        } catch (e) {
            const err = e as { message?: string };
            const msg = err?.message || 'Gemini request failed';
            const lower = String(msg).toLowerCase();
            if (lower.includes('quota')) {
                return NextResponse.json({ error: 'LLM quota exceeded' }, { status: 402 });
            }
            if (lower.includes('model') && (lower.includes('not found') || lower.includes('unavailable'))) {
                return NextResponse.json({ error: 'LLM model not available' }, { status: 404 });
            }
            return NextResponse.json({ error: msg }, { status: 502 });
        }
        let ai: AISuggestionResponse | null = null;
        try {
            ai = content ? JSON.parse(content) as AISuggestionResponse : null;
        } catch {
            // fallback: try to extract first JSON object from content
            ai = null;
            if (content) {
                const m = content.match(/\{[\s\S]*\}/);
                if (m) {
                    try { ai = JSON.parse(m[0]) as AISuggestionResponse; } catch { }
                }
            }
        }

        if (!ai || !ai.suggestionScore || !ai.reason) {
            console.error('AI raw content:', content);
            return NextResponse.json({ error: 'Invalid AI response', raw: content ?? null }, { status: 502 });
        }

        // Enforce paymentType guards regardless of model output
        let derivedMonthlyEMI = ai.derived?.monthlyEMI ?? (price && duration ? price / duration : monthlyEMI);
        let derivedDuration = ai.derived?.duration ?? duration ?? (price && monthlyEMI ? Math.max(1, Math.round(price / monthlyEMI)) : undefined);
        let derivedPrice = ai.derived?.price ?? price ?? (monthlyEMI && duration ? monthlyEMI * duration : undefined);

        if (isOneTime) {
            derivedMonthlyEMI = 0;
            derivedDuration = 0;
            derivedPrice = price;
        } else {
            // emi: respect provided duration
            if (typeof duration === 'number') {
                derivedDuration = duration;
            }
            if (!derivedPrice && typeof monthlyEMI === 'number' && typeof derivedDuration === 'number') {
                derivedPrice = monthlyEMI * derivedDuration;
            }
        }

        if (!derivedMonthlyEMI || !derivedDuration || !derivedPrice) {
            return NextResponse.json({ error: 'Incomplete derived values' }, { status: 502 });
        }

        const suggestion = new ProductSuggestion({
            uid,
            productName,
            price: derivedPrice,
            emiAmount: derivedMonthlyEMI,
            duration: derivedDuration,
            suggestionScore: ai.suggestionScore,
            reason: ai.reason,
            suggestedAt: new Date(),
        });
        await suggestion.save();

        // Include optional detailed explanation to show in UI (not persisted)
        return NextResponse.json({ suggestion, explanation: ai.explanation || ai.reason });
    } catch (error) {
        console.error('AI suggestion error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}


