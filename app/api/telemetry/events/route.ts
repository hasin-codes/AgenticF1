import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');

    if (!year) {
        return NextResponse.json({ error: 'Year parameter is required' }, { status: 400 });
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/telemetry/events/${year}`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Backend API returned ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching events:', error);
        return NextResponse.json(
            { error: 'Failed to fetch events from backend' },
            { status: 500 }
        );
    }
}
