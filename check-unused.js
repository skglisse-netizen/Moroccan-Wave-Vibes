import fs from 'fs';
const src = fs.readFileSync('src/App.tsx', 'utf-8');
const afterImports = src.replace(/^import.*;\n/gm, '');

// Check each import
const toCheck = [
  'LayoutDashboard','TrendingUp','TrendingDown','Calendar','Users','LogOut','Plus',
  'Waves','ChevronRight','DollarSign','UserCheck','CheckCircle2','RotateCcw',
  'Shield','ClipboardList','Tags','ChevronDown','Check','X','Settings','Download',
  'ArrowRightLeft','FileText','Search','ChevronLeft','Anchor','Package','RefreshCcw',
  'Menu','Bell','ImageIcon','Database','MapPin','Mail','MailOpen','Globe',
  'motion','AnimatePresence','LineChart','Line','XAxis','YAxis','CartesianGrid',
  'Tooltip','ResponsiveContainer','format','fr',
  'User','DashboardStats','AppSettings','AppNotification','LandingPageContent',
  'PublicService','Spot','Conseil','ContactMessage','GroupsManagement',
  'LandingPage','MapContainer','TileLayer','Marker','useMapEvents','L'
];

const used = toCheck.filter(name => {
  const re = new RegExp(`\\b${name}\\b`);
  return re.test(afterImports);
});

const unused = toCheck.filter(name => !used.includes(name));

console.log('USED:', used.join(', '));
console.log('\nUNUSED:', unused.join(', '));
