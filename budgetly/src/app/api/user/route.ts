import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongoose';
import User from '../../../../models/User';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const uid = searchParams.get('uid');

        console.log('GET /api/user - Fetching user with UID:', uid);

        if (!uid) {
            return NextResponse.json({ error: 'UID is required' }, { status: 400 });
        }

        const user = await User.findByUID(uid);

        if (!user) {
            console.log('GET /api/user - User not found for UID:', uid);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        console.log('GET /api/user - User found:', user._id);
        return NextResponse.json(user);
    } catch (error) {
        console.error('GET /api/user - Error fetching user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const { uid, email, name, photoURL, location, occupation, savings } = body;

        console.log('POST /api/user - Creating user with data:', { uid, email, name, savings });

        if (!uid || !email || !name) {
            return NextResponse.json({ error: 'UID, email, and name are required' }, { status: 400 });
        }

        const user = await User.findOrCreate({
            uid,
            email,
            name,
            photoURL,
            location,
            occupation,
            savings: savings || 0
        });

        console.log('POST /api/user - User created/found successfully:', user._id);
        return NextResponse.json(user);
    } catch (error) {
        console.error('POST /api/user - Error creating user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const { uid, ...updateData } = body;

        if (!uid) {
            return NextResponse.json({ error: 'UID is required' }, { status: 400 });
        }

        const user = await User.findOneAndUpdate(
            { uid },
            updateData,
            { new: true, runValidators: true }
        );

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Test endpoint to verify database connection
export async function PATCH(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const { action } = body;

        if (action === 'migrate-income') {
            console.log('Triggering income structure migration...');
            const migratedCount = await User.migrateIncomeStructure();
            return NextResponse.json({
                success: true,
                message: `Migration completed. ${migratedCount} users migrated.`
            });
        }

        return NextResponse.json({ success: true, message: 'Database connection successful' });
    } catch (error) {
        console.error('Database test error:', error);
        return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
} 