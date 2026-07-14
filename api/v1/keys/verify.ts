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

    const { data, error } = await supabase.rpc('api_verify_key', {
      p_key_hash: keyHash
    });

    if (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: error.code || 'UNAUTHORIZED',
          message: error.message || 'Invalid or revoked API key'
        }
      });
    }

    return res.status(200).json(data);
  } catch (err: any) {
    console.error('Error in /api/v1/keys/verify:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred'
      }
    });
  }
}
