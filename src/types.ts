export interface Permission {
  id: number;
  codename: string;
  name: string;
}

export interface Group {
  id: number;
  name: string;
  permissions: Permission[];
}

export interface User {
  id: number;
  username: string;
  role: 'administrateur' | 'utilisateur';
  permissions: string[];
  group_ids?: number[];
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  sub_category?: string;
  date: string;
}

export interface Revenue {
  id: number;
  description: string;
  amount: number;
  type: string;
  category: string;
  sub_category?: string;
  date: string;
  lesson_id?: number;
  rental_id?: number;
}

export interface Lesson {
  id: number;
  title: string;
  instructors?: { id: number, full_name: string }[];
  assistants?: { id: number, full_name: string }[];
  student_count: number;
  price: number;
  date: string;
  time: string;
  type: 'individual' | 'group';
  status: 'scheduled' | 'completed';
  reservation_id?: number;
  clients?: Client[];
}

export interface Staff {
  id: number;
  full_name: string;
  birth_date: string;
  cin: string;
  type: string;
  status: 'journalier' | 'salarie';
  matricule?: string;
}

export interface DashboardStats {
  totalExpenses: number;
  totalRevenue: number;
  dailyRevenue: number;
  dailyExpenses: number;
  dailyRev?: { total: number };
  dailyExp?: { total: number };
  todayLessons?: Lesson[];
  totalLessonsToday?: number;
  trends?: {
    revenue: string;
    expenses: string;
    profit: string;
  };
  debts?: {
    pendingDebts: number;
    pendingLoans: number;
    totalDebts: number;
    totalLoans: number;
  };
}

export interface DebtLoan {
  id: number;
  description: string;
  amount: number;
  paid_amount: number;
  type: 'debt' | 'loan';
  person: string;
  status: 'pending' | 'paid';
  date: string;
  due_date?: string;
  created_at: string;
}

export interface DebtPayment {
  id: number;
  debt_loan_id: number;
  amount: number;
  date: string;
  note?: string;
  created_at: string;
}

export interface Settings {
  app_name: string;
  app_logo: string;
  app_bg?: string;
  pages_bg?: string;
  header_color?: string;
  header_text_color?: string;
  nav_color?: string;
  nav_text_color?: string;
  footer_color?: string;
  footer_text_color?: string;
  body_bg_color?: string;
  sticky_header?: boolean;
  sticky_footer?: boolean;
  conseils_title?: string;
  conseils_subtitle?: string;
  conseils_button_text?: string;
  conseils_bg_image?: string;
  services_layout?: string;
  conseils_layout?: string;
  services_title?: string;
  services_subtitle?: string;
  services_bg_image?: string;
  spots_title?: string;
  spots_subtitle?: string;
  spots_bg_image?: string;
  spots_layout?: string;
  reserve_title?: string;
  reserve_subtitle?: string;
  reserve_bg_image?: string;
  reserve_layout?: string;
  title_color?: string;
  subtitle_color?: string;
  spots_content?: string;
  contact_bg_image?: string;
  smtp_host?: string;
  smtp_port?: string;
  smtp_user?: string;
  smtp_pass?: string;
  smtp_from?: string;
  smtp_to?: string;
  sponsor_duration?: string;
  sponsor_images?: string;
  sponsor_bar_color?: string;
  card_title_color?: string;
  card_text_color?: string;
  card_button_color?: string;
  card_button_text_color?: string;
}

export interface Log {
  id: number;
  user_id: number;
  username: string;
  action: string;
  details: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  type: 'expense' | 'revenue' | 'staff';
  parent_id?: number | null;
}

export interface Stock {
  id: number;
  name: string;
  quantity: number;
  price_unit: number;
  category: string;
  is_rentable?: boolean;
  rental_price?: number;
  created_at: string;
}

export interface Reservation {
  id: number;
  name: string;
  email: string;
  phone: string;
  service_id: number;
  service_name?: string;
  date: string;
  time: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}

export interface LandingPageContent {
  id: number;
  section: string;
  title: string;
  content: string;
  image_url?: string;
  video_url?: string;
  title_style?: string;
  content_style?: string;
  is_active: boolean;
  button_label?: string;
  section_button_label?: string;
  show_logo?: boolean | number;
  show_button?: boolean | number;
  button_link?: string;
  button_label_2?: string;
  button_link_2?: string;
  show_button_2?: boolean | number;
}

export interface PublicService {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  is_active: boolean;
  discount_percentage?: number;
  sessions_count?: number;
  is_pack?: boolean;
}

export interface Conseil {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  is_active: boolean;
}

export interface SpotSuggestion {
  type: string;
  name: string;
  link: string;
}

export interface Spot {
  id: number;
  name: string;
  description: string;
  lat: number;
  lng: number;
  image_url?: string;
  difficulty: string;
  is_active: boolean;
  live_cam_url?: string;
  // Old single suggestion fields (deprecated)
  suggestion_type?: string;
  suggestion_name?: string;
  suggestion_link?: string;
  // New multiple suggestions
  suggestions?: SpotSuggestion[];
  created_at: string;
}

export interface Rental {
  id: number;
  customer_name: string;
  customer_phone: string;
  equipment_id: number;
  equipment_name?: string;
  quantity: number;
  start_time: string;
  end_time?: string;
  total_price: number;
  date: string;
  status: 'active' | 'returned';
  created_at: string;
}

export interface Client {
  id: number;
  full_name: string;
  phone: string;
  email?: string;
  address?: string;
  is_subscriber: boolean;
  total_sessions?: number;
  remaining_sessions?: number;
  created_at: string;
  matricule?: string;
}

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ClientPurchase {
  id: number;
  client_id: number;
  service_id: number;
  service_name: string;
  price: number;
  sessions_added: number;
  date: string;
  created_at: string;
}
