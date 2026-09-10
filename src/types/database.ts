export type SmartRule = {
  id: string;
  conditionType: 'device' | 'os' | 'browser' | 'country' | 'language' | 'time' | 'date' | 'dayOfWeek' | 'referrer';
  operator: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than';
  value: string;
  destinationUrl: string;
  priority: number;
};

export type Schedule = {
  id: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  destinationUrl: string;
  timezone: string;
  priority: number;
  isEnabled: boolean;
};

export type ABVariant = {
  id: string;
  destinationUrl: string;
  weight: number; // Percentage 0-100
};

export type QRCodeData = {
  id: string;
  user_id: string;
  short_code: string;
  keyword: string | null;
  destination_url: string;
  design_config: any;
  created_at: string;
  
  // Advanced Features
  qr_type: 'url' | 'wifi' | 'vcard' | 'email' | 'sms' | 'whatsapp' | 'location' | 'upi' | 'app';
  type_data: any;
  rules: SmartRule[];
  schedules: Schedule[];
  password_hash: string | null;
  is_password_protected: boolean;
  expires_at: string | null;
  expiration_url: string | null;
  expiration_message: string | null;
  ab_variants: ABVariant[];
  campaign_id: string | null;
  workspace_id: string | null;
  custom_domain: string | null;
  scan_limit: number | null;
  url_health_status: 'healthy' | 'slow' | 'error' | '404' | '500';
  last_health_check: string | null;
};

export type Campaign = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: 'active' | 'completed' | 'paused' | 'draft';
  created_at: string;
};

export type Workspace = {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
};
