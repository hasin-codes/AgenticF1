import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');
    const gp = searchParams.get('gp');
    const session = searchParams.get('session');
    const drivers = searchParams.get('drivers');
    const lap = searchParams.get('lap');
    const lap_type = searchParams.get('lap_type') || 'fastest';

    if (!year || !gp || !session || !drivers) {
        return NextResponse.json(
            { error: 'year, gp, session, and drivers parameters are required' },
            { status: 400 }
        );
    }

    try {
        const url = new URL(`${BACKEND_URL}/api/telemetry/speed`);
        url.searchParams.set('year', year);
        url.searchParams.set('gp', gp);
        url.searchParams.set('session', session);
        url.searchParams.set('drivers', drivers);
        if (lap) url.searchParams.set('lap', lap);
        url.searchParams.set('lap_type', lap_type);

        const response = await fetch(url.toString(), {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            return NextResponse.json(
                { error: errorData.detail || `Backend API returned ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching speed telemetry:', error);
        return NextResponse.json(
            { error: 'Failed to fetch speed telemetry from backend' },
            { status: 500 }
        );
    }
}
