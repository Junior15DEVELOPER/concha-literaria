// Health Check Endpoint — Concha Literária (Vercel Serverless Function)
export default function handler(req: any, res: any) {
  res.status(200).json({
    status: 'ok',
    app: 'Concha Literária',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
}
