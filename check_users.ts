import { getAll, getOne } from './database/db.js';

async function check() {
  try {
    const users = await getAll("SELECT id, username, role FROM users");
    console.log("Users:", JSON.stringify(users, null, 2));
    
    for (const user of users as any[]) {
      const perms = await getAll(`
        SELECT p.codename 
        FROM permissions p
        JOIN group_permissions gp ON p.id = gp.permission_id
        JOIN user_groups ug ON gp.group_id = ug.group_id
        WHERE ug.user_id = ?
      `, [user.id]);
      console.log(`Permissions for ${user.username}:`, perms.map((p: any) => p.codename).join(', '));
    }
    
    const groups = await getAll("SELECT * FROM groups");
    console.log("Groups:", JSON.stringify(groups, null, 2));

    const settings = await getAll("SELECT * FROM settings");
    console.log("Settings count:", settings.length);

  } catch (err) {
    console.error("Check failed:", err);
  } finally {
    process.exit();
  }
}

check();
