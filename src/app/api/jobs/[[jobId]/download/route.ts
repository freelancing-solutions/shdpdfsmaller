// app/api/jobs/[jobId]/download/route.ts
import { NextRequest } from 'next/server';

const FLASK = process.env.FLASK_API_URL || 'https://api.pdfsmaller.site/api';

export async function GET(
  _: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params;

  const res = await fetch(`${FLASK}/jobs/${encodeURIComponent(jobId)}/download`, {
    method: 'GET',
    headers: { Accept: 'application/pdf, application/octet-stream' },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    return Response.json(
      { status: 'error', message: text },
      { status: res.status }
    );
  }

  /*  stream the blob straight to the browser  */
  return new Response(res.body, {
    status: 200,
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream',
      'Content-Disposition': res.headers.get('Content-Disposition') || 'attachment',
    },
  });
}