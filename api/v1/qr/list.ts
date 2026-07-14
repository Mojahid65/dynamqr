import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ffeenpqozgtuuztiqgqk.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_kfk0tjhnsKoxbnD7VmuMuQ_WXgypvEf';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only GET requests are supported on /api/v1/qr/list'
      }
    });
  }

  try {
    const authHeader = req.headers.authorization || req.headers['x-api-key'] || '';
    let apiKey = '';

    if (authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7).trim();
    } else if (typeof authHeader === 'string' && authHeader.startsWith('dq_live_')) {
      apiKey = authHeader.trim();
    }

    if (!apiKey || !apiKey.startsWith('dq_live_')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid API key format. Please pass Authorization: Bearer dq_live_xxxx...'
        }
      });
    }

    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const limit = parseInt(req.query?.limit || '20', 10);
    const offset = parseInt(req.query?.offset || '0', 10);

    const { data, error } = await supabase.rpc('api_list_qrs', {
      p_key_hash: keyHash,
      p_limit: isNaN(limit) ? 20 : limit,
      p_offset: isNaN(offset) ? 0 : offset
    });

    if (error) {
      return res.status(error.code === '40100' ? 401 : 400).json({
        success: false,
        error: {
          code: error.code || 'API_ERROR',
          message: error.message || 'Failed to fetch QR codes'
        }
      });
    }

    return res.status(200).json(data);
  } catch (err: any) {
    console.error('Error in /api/v1/qr/list:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred'
      }
    });
  }
}
