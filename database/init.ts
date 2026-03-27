import bcrypt from 'bcryptjs';
import { db, query, getOne, getAll } from './db.js';

export async function initDb() {
  try {
    await db.exec(`
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
        login_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        last_seen_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        logout_at TIMESTAMPTZ,
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
    `);



    // Migrations for landing_page_content
    const landingPageCols = await getAll("SELECT column_name as name FROM information_schema.columns WHERE table_name = 'landing_page_content'");
    const landingPageColNames = (landingPageCols as any[]).map(c => c.name);
    if (!landingPageColNames.includes('is_active')) {
      await db.exec("ALTER TABLE landing_page_content ADD COLUMN is_active BOOLEAN DEFAULT TRUE");
      console.log("✓ Added is_active column to landing_page_content");
    }
    if (!landingPageColNames.includes('button_label')) {
      await db.exec("ALTER TABLE landing_page_content ADD COLUMN button_label TEXT");
      console.log("✓ Added button_label column to landing_page_content");
    }
    if (!landingPageColNames.includes('show_logo')) {
      await db.exec("ALTER TABLE landing_page_content ADD COLUMN show_logo BOOLEAN DEFAULT TRUE");
      console.log("✓ Added show_logo column to landing_page_content");
    }
    if (!landingPageColNames.includes('show_button')) {
      await db.exec("ALTER TABLE landing_page_content ADD COLUMN show_button BOOLEAN DEFAULT TRUE");
      console.log("✓ Added show_button column to landing_page_content");
    }
    if (!landingPageColNames.includes('button_link')) {
      await db.exec("ALTER TABLE landing_page_content ADD COLUMN button_link TEXT DEFAULT 'reserve'");
      console.log("✓ Added button_link column to landing_page_content");
    }
    if (!landingPageColNames.includes('section_button_label')) {
      await db.exec("ALTER TABLE landing_page_content ADD COLUMN section_button_label TEXT");
      console.log("✓ Added section_button_label column to landing_page_content");
    }
    
    // Migrations for users
    const usersCols = await getAll("SELECT column_name as name FROM information_schema.columns WHERE table_name = 'users'");
    const usersColNames = (usersCols as any[]).map(c => c.name);
    if (!usersColNames.includes('current_session_id')) {
      await db.exec("ALTER TABLE users ADD COLUMN current_session_id TEXT");
      console.log("✓ Added current_session_id column to users");
    }

    // Migrations for spots
    const spotsCols = await getAll("SELECT column_name as name FROM information_schema.columns WHERE table_name = 'spots'");
    const spotsColNames = (spotsCols as any[]).map(c => c.name);
    if (!spotsColNames.includes('is_active')) {
      await db.exec("ALTER TABLE spots ADD COLUMN is_active BOOLEAN DEFAULT TRUE");
      console.log("✓ Added is_active column to spots");
    }

    // Migrations for debts_loans
    const debtsLoansCols = await getAll("SELECT column_name as name FROM information_schema.columns WHERE table_name = 'debts_loans'");
    const debtsLoansColNames = (debtsLoansCols as any[]).map(c => c.name);
    if (!debtsLoansColNames.includes('paid_amount')) {
      await db.exec("ALTER TABLE debts_loans ADD COLUMN paid_amount DOUBLE PRECISION DEFAULT 0");
      console.log("✓ Added paid_amount column to debts_loans");
    }
    if (!debtsLoansColNames.includes('due_date')) {
      await db.exec("ALTER TABLE debts_loans ADD COLUMN due_date TEXT");
      console.log("✓ Added due_date column to debts_loans");
    }

    // Migrations for debts_loans financial links
    const revenueCols = await getAll("SELECT column_name as name FROM information_schema.columns WHERE table_name = 'revenue'");
    const revenueColNames = (revenueCols as any[]).map(c => c.name);
    if (!revenueColNames.includes('debt_loan_id')) {
      await db.exec("ALTER TABLE revenue ADD COLUMN debt_loan_id INTEGER");
      await db.exec("ALTER TABLE revenue ADD COLUMN debt_payment_id INTEGER");
      console.log("✓ Added debt_loan_id and debt_payment_id to revenue");
    }

    const expensesCols = await getAll("SELECT column_name as name FROM information_schema.columns WHERE table_name = 'expenses'");
    const expensesColNames = (expensesCols as any[]).map(c => c.name);
    if (!expensesColNames.includes('debt_loan_id')) {
      await db.exec("ALTER TABLE expenses ADD COLUMN debt_loan_id INTEGER");
      await db.exec("ALTER TABLE expenses ADD COLUMN debt_payment_id INTEGER");
      console.log("✓ Added debt_loan_id and debt_payment_id to expenses");
    }

    console.log("Database schema initialized successfully");

    // Auto-sync confirmed reservations to clients table
    const confirmedReservations = await getAll(
      "SELECT * FROM reservations WHERE status = 'confirmed' AND phone IS NOT NULL AND phone != ''"
    );

    for (const resv of confirmedReservations as any[]) {
      const existing = await getOne("SELECT id FROM clients WHERE phone = ?", [resv.phone]);
      if (!existing) {
        await query(
          "INSERT INTO clients (full_name, phone, email, is_subscriber) VALUES (?, ?, ?, FALSE)",
          [resv.name, resv.phone, resv.email || null]
        );
      }
    }
    console.log(`✓ Synced confirmed reservations to clients`);

    // Initialize default settings
    const settingsToInit = [
      { key: 'app_name', value: '' },
      { key: 'app_logo', value: 'Waves' },
      { key: 'app_bg', value: '' },
      { key: 'header_color', value: '#ffffff' },
      { key: 'title_color', value: '#1e293b' },
      { key: 'subtitle_color', value: '#64748b' },
      { key: 'header_text_color', value: '#000000' },
      { key: 'nav_color', value: '#ffffff' },
      { key: 'nav_text_color', value: '#475569' },
      { key: 'footer_color', value: '#ffffff' },
      { key: 'footer_text_color', value: '#000000' },
      { key: 'body_bg_color', value: '#f8fafc' },
      { key: 'sticky_header', value: 'true' },
      { key: 'sticky_footer', value: 'false' },
      { key: 'services_layout', value: 'grid-3' },
      { key: 'conseils_layout', value: 'grid-3' }
    ];

    for (const setting of settingsToInit) {
      const exists = await getOne("SELECT value FROM settings WHERE key = ?", [setting.key]);
      if (!exists) {
        await query("INSERT INTO settings (key, value) VALUES (?, ?)", [setting.key, setting.value]);
      }
    }

    // Seed default landing page sections (if missing)
    const sectionsToInit = [
      { section: 'about', button_label: 'Accueil', is_active: true },
      { section: 'services', button_label: 'Services', is_active: true },
      { section: 'reserve', button_label: 'Réserver', is_active: true },
      { section: 'conseils', button_label: 'Conseils', is_active: true },
      { section: 'spots', button_label: 'Spots', is_active: true },
      { section: 'contact', button_label: 'Contact', is_active: true },
    ];

    for (const sec of sectionsToInit) {
      const exists = await getOne("SELECT id FROM landing_page_content WHERE section = ?", [sec.section]);
      if (!exists) {
        await query(
          "INSERT INTO landing_page_content (section, button_label, is_active) VALUES (?, ?, ?)",
          [sec.section, sec.button_label, sec.is_active]
        );
        console.log(`✓ Seeded landing_page_content section: ${sec.section}`);
      }
    }

    // Initialize default categories
    const expenseCatsCount: any = await getOne("SELECT COUNT(*) as count FROM categories WHERE type = 'expense'");
    if (parseInt(expenseCatsCount.count) === 0) {
      const defaultExpenseCats = ['Salaire', 'Achat Matériel', 'Loyer / Factures', 'Paiement', 'Autre'];
      for (const cat of defaultExpenseCats) {
        await query("INSERT INTO categories (name, type) VALUES (?, 'expense')", [cat]);
      }
    }

    const revenueCatsCount: any = await getOne("SELECT COUNT(*) as count FROM categories WHERE type = 'revenue'");
    if (parseInt(revenueCatsCount.count) === 0) {
      const defaultRevenueCats = ['lesson_individual', 'lesson_group', 'sale', 'other'];
      for (const cat of defaultRevenueCats) {
        await query("INSERT INTO categories (name, type) VALUES (?, 'revenue')", [cat]);
      }
    }

    // Seed sub-categories for Achat Matériel
    const achatMateriel: any = await getOne("SELECT id FROM categories WHERE name = 'Achat Matériel' AND type = 'expense'");
    if (achatMateriel) {
      const subCats = ['Planche', 'Combinaison', 'Leash', 'Dérives', 'Wax', 'Autre'];
      for (const cat of subCats) {
        const exists = await getOne("SELECT id FROM categories WHERE name = ? AND parent_id = ?", [cat, achatMateriel.id]);
        if (!exists) {
          await query("INSERT INTO categories (name, type, parent_id) VALUES (?, 'expense', ?)", [cat, achatMateriel.id]);
        }
      }
    }

    // Create default SuperAdmin if not exists
    const adminExists = await getOne("SELECT * FROM users WHERE username = ?", ["SuperAdmin"]);
    if (!adminExists) {
      const hashedPassword = bcrypt.hashSync("@dminSurf2026", 10);
      await query("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", ["SuperAdmin", hashedPassword, "administrateur"]);
    } else {
      await query("UPDATE users SET role = 'administrateur' WHERE username = 'SuperAdmin'");
    }

    // Seed Permissions and Groups
    const modules = [
      { code: 'revenue', name: 'Revenus' },
      { code: 'expenses', name: 'Dépenses' },
      { code: 'staff', name: 'Personnel' },
      { code: 'stock', name: 'Stock' },
      { code: 'debts', name: 'Dettes & Prêts' },
      { code: 'lessons', name: 'Planning' },
      { code: 'categories', name: 'Catégories' },
      { code: 'logs', name: 'Logs' },
      { code: 'users', name: 'Utilisateurs' },
      { code: 'settings', name: 'Configuration' },
      { code: 'groups', name: 'Groupes & Permissions' },
      { code: 'clients', name: 'Clients' },
      { code: 'rentals', name: 'Locations' },
      { code: 'reservations', name: 'Réservations' },
      { code: 'messages', name: 'Messages' },
      { code: 'landing_page', name: 'Site Web' },
      { code: 'notifications', name: 'Notifications' }
    ];

    const permissionActions = [
      { code: 'view', name: 'Peut voir' },
      { code: 'add', name: 'Peut ajouter' },
      { code: 'change', name: 'Peut modifier' },
      { code: 'delete', name: 'Peut supprimer' },
      { code: 'remettre', name: 'Peut remettre' }
    ];

    for (const mod of modules) {
      for (const action of permissionActions) {
        await query(
          "INSERT INTO permissions (codename, name) VALUES (?, ?) ON CONFLICT (codename) DO NOTHING",
          [`${action.code}_${mod.code}`, `${action.name} ${mod.name}`]
        );
      }
    }
    await query("INSERT INTO permissions (codename, name) VALUES (?, ?) ON CONFLICT (codename) DO NOTHING", ['complete_lessons', 'Peut marquer les cours comme réalisés']);
    await query("INSERT INTO permissions (codename, name) VALUES (?, ?) ON CONFLICT (codename) DO NOTHING", ['manage_site', 'Gestion complète du site']);

    await query("INSERT INTO groups (name) VALUES (?) ON CONFLICT (name) DO NOTHING", ['Administrateur']);
    const adminGroup: any = await getOne("SELECT id FROM groups WHERE name = 'Administrateur'");

    if (adminGroup) {
      const allPerms = await getAll("SELECT id FROM permissions");
      for (const p of allPerms as any[]) {
        await query(
          "INSERT INTO group_permissions (group_id, permission_id) VALUES (?, ?) ON CONFLICT (group_id, permission_id) DO NOTHING",
          [adminGroup.id, p.id]
        );
      }

      const usersToMigrate = await getAll("SELECT id, username, role FROM users");
      for (const u of usersToMigrate as any[]) {
        if (u.role === 'administrateur' && u.username !== 'SuperAdmin') {
          await query(
            "INSERT INTO user_groups (user_id, group_id) VALUES (?, ?) ON CONFLICT (user_id, group_id) DO NOTHING",
            [u.id, adminGroup.id]
          );
        }
      }
    }

    console.log("Database initialization completed successfully");
  } catch (err) {
    console.error("Database initialization error:", err);
  }
}
