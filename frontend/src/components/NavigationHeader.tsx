import React from 'react';
import {
  PlantId,
  UserRole,
} from '../types/inventory.ts';
import { canAccessTab } from '../utils/rbac.ts';
import { INITIAL_PLANTS } from '../../../backend/data/mockInventoryData.ts';
import {
  Menu,
  Building2,
  Clock,
  LayoutDashboard,
  Server,
  Boxes,
  Layers as RacksIcon,
  Wrench,
  Truck,
  FileText,
  ShoppingBag,
  LogOut,
  Shield,
} from 'lucide-react';
import fcclLogo from '../Assets/FCCL logo.png';

interface NavigationHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenDrawer: () => void;
  selectedPlant: PlantId | 'all';
  onPlantChange: (plant: PlantId | 'all') => void;
  currentRole: UserRole;
  pktTime: string;
  currentUserName?: string;
  onSignOut?: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenDrawer,
  selectedPlant,
  onPlantChange,
  currentRole,
  pktTime,
  currentUserName,
  onSignOut,
}) => {
  // Primary sections that fit on top
  const allPrimaryTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'assets', label: 'Devices', icon: Server },
    { id: 'stock', label: 'Spares', icon: Boxes },
    { id: 'procurement', label: 'PR & PO', icon: ShoppingBag },
  ];

  // Filter primary tabs by current user RBAC permissions
  const primaryTabs = allPrimaryTabs.filter((tab) => canAccessTab(currentRole, tab.id));

  // Role badge color styling based on role
  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'Admin':
        return 'bg-amber-400/20 text-amber-300 border-amber-500/40';
      case 'Plant Admin':
        return 'bg-emerald-400/20 text-emerald-300 border-emerald-500/40';
      case 'Employee':
        return 'bg-blue-400/20 text-blue-300 border-blue-500/40';
      case 'Auditor':
        return 'bg-purple-400/20 text-purple-300 border-purple-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <header className="bg-[#063d2a] border-b border-[#0b6340] text-slate-100 sticky top-0 z-40 select-none shadow-md w-full">
      <div className="w-full px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between gap-2 sm:gap-3 h-16">
          {/* Left Zone: Menu Toggle + Logo Branding */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Drawer Menu Button */}
            <button
              onClick={onOpenDrawer}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-colors shadow-sm cursor-pointer"
              title="Open Navigation Hub"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4 text-[#a7e3bd]" />
              <span className="text-xs font-semibold tracking-wide hidden md:inline">Menu</span>
            </button>

            {/* Wordmark Logo */}
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => onTabChange('overview')}
            >
              <div className="h-9 w-9 sm:h-10 sm:w-10 shrink-0">
                <img
                  src={fcclLogo}
                  alt="Fauji Cement Company Limited"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs sm:text-sm font-bold tracking-tight text-white whitespace-nowrap leading-tight">
                  FCCL Inventory
                </span>
                <span className="text-[9px] text-slate-400 font-mono tracking-wider uppercase">
                  Plant Asset OS
                </span>
              </div>
            </div>
          </div>

          {/* Center Zone: Clean, compact primary tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 shrink-0">
            {primaryTabs.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-emerald-300 shadow-sm border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#9ee6ba]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Zone: Plant Selector, Locked Static Role Badge, Clock, Sign Out (Zero Overflow) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Plant Scope Selector (Compact) */}
            <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1.5 shadow-sm text-xs">
              <Building2 className="w-3.5 h-3.5 text-[#9ee6ba] shrink-0" />
              <select
                value={selectedPlant}
                onChange={(e) => onPlantChange(e.target.value as PlantId | 'all')}
                className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer max-w-[110px] sm:max-w-[140px] truncate"
                aria-label="Filter by Plant Scope"
              >
                <option value="all" className="bg-slate-900 text-slate-200">
                  All 4 Plants
                </option>
                {INITIAL_PLANTS.map((plant) => (
                  <option key={plant.id} value={plant.id} className="bg-slate-900 text-slate-200">
                    {plant.name.split('—')[0].trim()}
                  </option>
                ))}
              </select>
            </div>

            {/* Read-Only Locked Role Badge (Cannot be changed after login!) */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold tracking-wide shadow-sm whitespace-nowrap ${getRoleBadgeStyle(
                currentRole
              )}`}
              title={`Logged in as ${currentUserName || 'User'} with fixed role "${currentRole}"`}
            >
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span>{currentRole}</span>
            </div>

            {/* PKT Clock (Visible on screens >= 1100px) */}
            <div className="hidden xl:flex items-center gap-1 text-slate-400 text-xs font-mono px-2 py-1 bg-slate-950/40 rounded-lg border border-slate-800 whitespace-nowrap">
              <Clock className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="tabular-nums text-[11px]">{pktTime}</span>
            </div>

            {/* Prominent, Always-Visible Sign Out Button */}
            {onSignOut && (
              <button
                onClick={onSignOut}
                title="Sign out of system and lock session"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white bg-red-800/80 hover:bg-red-700 border border-red-700/80 transition-colors shadow-sm cursor-pointer text-xs font-bold shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile / Tablet Tab Bar */}
        <div className="flex lg:hidden items-center justify-between py-1.5 border-t border-slate-800/80">
          <div className="flex overflow-x-auto gap-1 no-scrollbar flex-1">
            {primaryTabs.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-emerald-300 border border-slate-700 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={onOpenDrawer}
            className="ml-2 px-2 py-1 text-xs font-medium text-emerald-400 bg-slate-800 rounded-md border border-slate-700 shrink-0 cursor-pointer"
          >
            More...
          </button>
        </div>
      </div>
    </header>
  );
};
