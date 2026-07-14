import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ffeenpqozgtuuztiqgqk.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_kfk0tjhnsKoxbnD7VmuMuQ_WXgypvEf';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req: any, res: any) {
  // Set CORS headers so developers can test from any frontend or browser
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST requests are supported on this endpoint. Use Authorization: Bearer <your_api_key>'
      }
    });
  }

  try {
    // Extract API Key
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

    // Compute SHA256 hash of the provided API key
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Parse body
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { destination_url, short_code, keyword, design_config } = body;

    if (!destination_url) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ARGUMENT',
          message: 'The field destination_url is required (e.g. https://yourwebsite.com)'
        }
      });
    }

    let formattedUrl = destination_url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    // Call our secure RPC function
    const { data, error } = await supabase.rpc('api_create_qr', {
      p_key_hash: keyHash,
      p_destination_url: formattedUrl,
      p_short_code: short_code || null,
      p_keyword: keyword || null,
      p_design_config: design_config || {}
    });

    if (error) {
      return res.status(error.code === '40100' ? 401 : error.code === '40900' ? 409 : 400).json({
        success: false,
        error: {
          code: error.code || 'API_ERROR',
          message: error.message || 'Failed to create QR code'
        }
      });
    }

    return res.status(201).json(data);
  } catch (err: any) {
    console.error('Error in /api/v1/qr/create:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred while creating the QR code'
      }
    });
  }
}
