import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet: ${response.statusText}`);
    }
    const data = await response.arrayBuffer();
    
    // Set CORS headers to allow requests from your app's origin
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*'); // Adjust this to your domain in production for better security
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return new NextResponse(data, {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ...headers,
        }
    });

  } catch (error) {
    console.error('[SHEETS API] Error fetching sheet:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new NextResponse(JSON.stringify({ error: message }), { status: 500 });
  }
}
