// app/api/jobs/[jobId]/route.ts
import { NextRequest } from 'next/server';
import { PdfApiService } from '@/lib/api/pdf-services';

/*  reuse the same Flask back-end  */
const FLASK = process.env.FLASK_API_URL || 'https://api.pdfsmaller.site/api';

export async function GET(
  _: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;

  /*  proxy the envelope straight from Flask  */
  const res = await fetch(`${FLASK}/jobs/${encodeURIComponent(jobId)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    return Response.json(
      { status: 'error', message: text },
      { status: res.status }
    );
  }

  const envelope = await res.json(); // { status, message, data }
  return Response.json(envelope);    // ← keep the wrapper
}