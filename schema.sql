-- SCRIPT DE CRÉATION DE LA BASE DE DONNÉES POSTGRESQL (SurfSchool Manager)
-- Vous pouvez copier-coller ce contenu dans l'éditeur SQL de Neon.tech ou Supabase.
-- Note : L'application va normalement exécuter cela automatiquement au démarrage,
--        mais vous pouvez le lancer manuellement pour être sûr !

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE,
  password TEXT,
  role TEXT DEFAULT 'administrateur',
  current_session_id TEXT
);

CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  description TEXT,
  amount DOUBLE PRECISION,
  category TEXT,
  sub_category TEXT,
  date TEXT,
  debt_loan_id INTEGER,
  debt_payment_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS revenue (
  id SERIAL PRIMARY KEY,
  description TEXT,
  amount DOUBLE PRECISION,
  type TEXT,
  category TEXT,
  sub_category TEXT,
  date TEXT,
  lesson_id INTEGER,
  rental_id INTEGER,
  purchase_id INTEGER,
  debt_loan_id INTEGER,
  debt_payment_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  title TEXT,
  instructor_name TEXT,
  instructor_id INTEGER,
  assistant_id INTEGER,
  student_count INTEGER,
  price DOUBLE PRECISION DEFAULT 0,
  date TEXT,
  time TEXT,
  type TEXT,
  status TEXT DEFAULT 'scheduled',
  reservation_id INTEGER
);

CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  full_name TEXT,
  birth_date TEXT,
  cin TEXT,
  type TEXT,
  status TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lesson_staff (
  lesson_id INTEGER,
  staff_id INTEGER,
  role TEXT,
  PRIMARY KEY (lesson_id, staff_id, role),
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action TEXT,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT,
  type TEXT,
  parent_id INTEGER
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS debts_loans (
  id SERIAL PRIMARY KEY,
  description TEXT,
  amount DOUBLE PRECISION,
  paid_amount DOUBLE PRECISION DEFAULT 0,
  type TEXT,
  person TEXT,
  status TEXT DEFAULT 'pending',
  date TEXT,
  due_date TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock (
  id SERIAL PRIMARY KEY,
  name TEXT,
  quantity INTEGER DEFAULT 0,
  price_unit DOUBLE PRECISION DEFAULT 0,
  category TEXT,
  is_rentable BOOLEAN DEFAULT FALSE,
  rental_price DOUBLE PRECISION DEFAULT 0,
  condition TEXT DEFAULT 'good',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  codename TEXT UNIQUE,
  name TEXT
);

CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS group_permissions (
  group_id INTEGER,
  permission_id INTEGER,
  PRIMARY KEY (group_id, permission_id),
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_groups (
  user_id INTEGER,
  group_id INTEGER,
  PRIMARY KEY (user_id, group_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  service_id INTEGER,
  date TEXT,
  time TEXT,
  guests INTEGER,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS landing_page_content (
  id SERIAL PRIMARY KEY,
  section TEXT UNIQUE,
  title TEXT,
  content TEXT,
  image_url TEXT,
  video_url TEXT,
  images TEXT,
  title_style TEXT,
  content_style TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  button_label TEXT,
  section_button_label TEXT,
  show_logo BOOLEAN DEFAULT TRUE,
  show_button BOOLEAN DEFAULT TRUE,
  button_link TEXT DEFAULT 'reserve'
);

CREATE TABLE IF NOT EXISTS user_connections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  logout_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS public_services (
  id SERIAL PRIMARY KEY,
  name TEXT,
  description TEXT,
  price DOUBLE PRECISION,
  image_url TEXT,
  sessions_count INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  discount_percentage INTEGER DEFAULT 0,
  is_pack BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS conseils (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spots (
  id SERIAL PRIMARY KEY,
  name TEXT,
  description TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  image_url TEXT,
  difficulty TEXT,
  suggestion_type TEXT,
  suggestion_name TEXT,
  suggestion_link TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rentals (
  id SERIAL PRIMARY KEY,
  customer_name TEXT,
  customer_phone TEXT,
  equipment_id INTEGER,
  quantity INTEGER DEFAULT 1,
  rental_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  rental_end TIMESTAMP,
  total_price DOUBLE PRECISION DEFAULT 0,
  date TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  is_subscriber BOOLEAN DEFAULT FALSE,
  subscription_end_date TEXT,
  total_sessions INTEGER DEFAULT 0,
  remaining_sessions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lesson_clients (
  lesson_id INTEGER,
  client_id INTEGER,
  is_deducted BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (lesson_id, client_id),
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS client_purchases (
  id SERIAL PRIMARY KEY,
  client_id INTEGER,
  service_id INTEGER,
  service_name TEXT,
  price DOUBLE PRECISION,
  sessions_added INTEGER,
  date TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  type TEXT,
  title TEXT,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  subject TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS footer_widgets (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT,
  type TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS debt_payments (
  id SERIAL PRIMARY KEY,
  debt_loan_id INTEGER,
  amount DOUBLE PRECISION,
  date TEXT,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (debt_loan_id) REFERENCES debts_loans(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_visits (
  session_id TEXT,
  date DATE DEFAULT CURRENT_DATE,
  PRIMARY KEY (session_id, date)
);

CREATE TABLE IF NOT EXISTS rental_items (
  rental_id INTEGER,
  stock_id INTEGER,
  quantity INTEGER DEFAULT 1,
  PRIMARY KEY (rental_id, stock_id),
  FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE CASCADE,
  FOREIGN KEY (stock_id) REFERENCES stock(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS app_notifications (
  id SERIAL PRIMARY KEY,
  title TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
