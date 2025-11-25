import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { 
  LayoutDashboard,
  Users, 
  ClipboardList, 
  MapPin, 
  DollarSign, 
  FileText,
  BarChart3, 
  Database,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from './ui/Button';
import { getInitials } from '@/lib/utils';

export function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar, closeSidebar } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isManager = user?.role === 'manager';

  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/app/dashboard', roles: ['manager'] },
    { name: 'Attendance', icon: ClipboardList, href: '/app/attendance', roles: ['manager', 'supervisor'] },
    { name: 'Employees', icon: Users, href: '/app/employees', roles: ['manager'] },
    { name: 'Sites', icon: MapPin, href: '/app/sites', roles: ['manager'] },
    { name: 'Payroll', icon: DollarSign, href: '/app/payroll', roles: ['manager'] },
    { name: 'Reports', icon: BarChart3, href: '/app/reports', roles: ['manager'] },
    // { name: 'Backup', icon: Database, href: '/app/backup', roles: ['manager'] }, // Disabled - requires Google Workspace
    { name: 'Supervisors', icon: Users, href: '/app/users', roles: ['manager'] },
    { name: 'Audit Logs', icon: FileText, href: '/app/audit', roles: ['manager'] },
  ];

  const filteredNav = navigation.filter(item => item.roles.includes(user?.role));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-[#145359] border-b z-40 px-4 py-2.5 flex items-center justify-between shadow-lg">
        <button onClick={toggleSidebar} className="p-2 text-white">
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <div className="flex items-center gap-2">
          <img 
            src="/bawabt-logo.png" 
            alt="BAWABT ALMASKAN" 
            className="h-8 w-auto"
          />
          <div className="text-left">
            <h1 className="text-sm font-bold text-white tracking-wide leading-tight">BAWABT ALMASKAN</h1>
            <p className="text-[9px] text-white/80">Labour Management</p>
          </div>
        </div>
        <div className="w-10" />
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r transform transition-transform duration-200 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Company Branding */}
          <div className="p-6 border-b bg-[#145359]">
            <div className="flex items-center gap-3 mb-3">
              <img 
                src="/bawabt-logo.png" 
                alt="BAWABT ALMASKAN Logo" 
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-base font-bold text-white leading-tight">BAWABT ALMASKAN</h1>
                <p className="text-[10px] text-white/70">REAL ESTATE</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg px-3 py-2">
              <p className="text-xs text-white/90">
                {isManager ? '👨‍💼 Manager Portal' : '👷 Supervisor Portal'}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredNav.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={closeSidebar}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                {getInitials(user?.name || '')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Main content */}
      <main className={`
        transition-all duration-200
        lg:ml-64
        pt-16 lg:pt-0
      `}>
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
