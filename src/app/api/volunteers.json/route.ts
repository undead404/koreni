import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

// eslint-disable-next-line @typescript-eslint/require-await
export async function GET() {
  return NextResponse.json({
    works: true,
  });
}
