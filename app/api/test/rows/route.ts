import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseInfo } from '@/lib/db';

export function GET(_req: NextRequest) {
  try {
    // DEPRECATED: contratantes table no longer exists (refactored to entidades)
    const info = getDatabaseInfo();
    return NextResponse.json({
      success: true,
      database: info.databaseUrl || null,
      rows: [],
      message: 'Legacy contratantes table deprecated. Use entidades instead.',
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
