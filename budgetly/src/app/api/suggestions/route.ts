import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongoose';
import ProductSuggestion, { IProductSuggestionModel } from '../../../../models/ProductSuggestion';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');
        const limit = searchParams.get('limit') || '10';

        if (!uid) {
            return NextResponse.json({ error: 'UID is required' }, { status: 400 });
        }

        const suggestions = await (ProductSuggestion as IProductSuggestionModel).findByUser(uid, parseInt(limit));

        return NextResponse.json({ suggestions });
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const { uid, productName, price, emiAmount, duration, suggestionScore, reason } = body;

        if (!uid || !productName || !price || !suggestionScore || !reason) {
            return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
        }

        const suggestion = new ProductSuggestion({
            uid,
            productName,
            price,
            emiAmount,
            duration,
            suggestionScore,
            reason,
            suggestedAt: new Date()
        });

        await suggestion.save();

        return NextResponse.json({ success: true, suggestion });
    } catch (error) {
        console.error('Error creating suggestion:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');
        const suggestionId = searchParams.get('id');

        if (!uid || !suggestionId) {
            return NextResponse.json({ error: 'UID and suggestion ID are required' }, { status: 400 });
        }

        const suggestion = await ProductSuggestion.findOneAndDelete({
            _id: suggestionId,
            uid
        });

        if (!suggestion) {
            return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting suggestion:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 