import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ffeenpqozgtuuztiqgqk.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_kfk0tjhnsKoxbnD7VmuMuQ_WXgypvEf';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
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
    const { shortCode } = req.query;

    if (!shortCode || typeof shortCode !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ARGUMENT',
          message: 'Short code is required in the URL path (e.g. /api/v1/qr/mycode)'
        }
      });
    }

    if (req.method === 'GET') {
      const { data, error } = await supabase.rpc('api_get_qr', {
        p_key_hash: keyHash,
        p_short_code: shortCode
      });

      if (error) {
        return res.status(error.code === '40100' ? 401 : error.code === '40400' ? 404 : 400).json({
          success: false,
          error: {
            code: error.code || 'API_ERROR',
            message: error.message || 'Failed to get QR code'
          }
        });
      }
      return res.status(200).json(data);
    } 

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { destination_url } = body;

      if (!destination_url) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ARGUMENT',
            message: 'destination_url is required to update the QR code'
          }
        });
      }

      let formattedUrl = destination_url.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = 'https://' + formattedUrl;
      }

      const { data, error } = await supabase.rpc('api_update_qr', {
        p_key_hash: keyHash,
        p_short_code: shortCode,
        p_destination_url: formattedUrl
      });

      if (error) {
        return res.status(error.code === '40100' ? 401 : error.code === '40400' ? 404 : 400).json({
          success: false,
          error: {
            code: error.code || 'API_ERROR',
            message: error.message || 'Failed to update QR code'
          }
        });
      }
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { data, error } = await supabase.rpc('api_delete_qr', {
        p_key_hash: keyHash,
        p_short_code: shortCode
      });

      if (error) {
        return res.status(error.code === '40100' ? 401 : error.code === '40400' ? 404 : 400).json({
          success: false,
          error: {
            code: error.code || 'API_ERROR',
            message: error.message || 'Failed to delete QR code'
          }
        });
      }
      return res.status(200).json(data);
    }

    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: `Method ${req.method} is not supported on this endpoint`
      }
    });
  } catch (err: any) {
    console.error('Error in /api/v1/qr/[shortCode]:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred'
      }
    });
  }
}
