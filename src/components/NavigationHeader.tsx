import React from 'react';
import {
  PlantId,
  UserRole,
} from '../types/inventory.ts';
import { INITIAL_PLANTS } from '../data/mockInventoryData.ts';
import {
  Layers,
  Menu,
  Building2,
  UserCheck,
  Clock,
  LayoutDashboard,
  Server,
  Boxes,
  Layers as RacksIcon,
  Wrench,
  Truck,
  FileText,
  ChevronRight,
} from 'lucide-react';

interface NavigationHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenDrawer: () => void;
  selectedPlant: PlantId | 'all';
  onPlantChange: (plant: PlantId | 'all') => void;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  pktTime: string;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenDrawer,
  selectedPlant,
  onPlantChange,
  currentRole,
  onRoleChange,
  pktTime,
}) => {
  // Primary (Important) sections that always remain visible on top
  const primaryTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'assets', label: 'Devices', icon: Server },
    { id: 'stock', label: 'Parts & Spares', icon: Boxes },
  ];

  // Secondary sections shifted to left drawer, but tracked if active
  const drawerSectionsMap: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
    racks: { label: 'Server Racks', icon: RacksIcon },
    workorders: { label: 'Work Orders', icon: Wrench },
    suppliers: { label: 'Suppliers', icon: Truck },
    audit: { label: 'Audit Trail', icon: FileText },
  };

  const isDrawerSectionActive = Boolean(drawerSectionsMap[activeTab]);
  const activeDrawerSection = drawerSectionsMap[activeTab];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 select-none shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Left Zone: Left Drawer Menu Toggle + Logo Branding */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Drawer Menu Button */}
            <button
              onClick={onOpenDrawer}
              className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-colors shadow-sm cursor-pointer group"
              title="Open Navigation Hub (Shifted Sections: Racks, Work Orders, Suppliers, Audit)"
              aria-label="Open left drawer menu"
            >
              <Menu className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold tracking-wide hidden sm:inline">Menu</span>
            </button>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            {/* Wordmark Logo */}
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onTabChange('overview')}>
              <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shadow-inner">
                <Layers className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-bold tracking-tight text-white whitespace-nowrap leading-tight">
                  FCCL Inventory
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                  Plant Asset OS
                </span>
              </div>
            </div>
          </div>

          {/* Center Zone: Important Primary Sections on Top */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            {primaryTabs.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700 text-emerald-300'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* If a drawer section is currently active, show it as the 4th top tab with clear indicator */}
            {isDrawerSectionActive && activeDrawerSection && (
              <>
                <div className="h-4 w-px bg-slate-800 mx-0.5" />
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-300 shadow-sm">
                  {React.createElement(activeDrawerSection.icon, { className: 'w-3.5 h-3.5 text-emerald-400' })}
                  <span>{activeDrawerSection.label}</span>
                  <span className="text-[10px] text-emerald-400/70 font-mono ml-0.5">(From Menu)</span>
                </div>
              </>
            )}
          </nav>

          {/* Right Zone: Controls (Plant Filter, Role, Clock) - Clean, no stream numbers */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Plant Scope Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 shadow-sm">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={selectedPlant}
                onChange={(e) => onPlantChange(e.target.value as PlantId | 'all')}
                className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
                aria-label="Filter by Plant Scope"
              >
                <option value="all" className="bg-slate-900 text-slate-200">
                  All 4 Plants
                </option>
                {INITIAL_PLANTS.map((plant) => (
                  <option key={plant.id} value={plant.id} className="bg-slate-900 text-slate-200">
                    {plant.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Switcher */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5 shadow-sm">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={currentRole}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
                aria-label="Select User Role for Testing"
              >
                <option value="Super Admin" className="bg-slate-900 text-slate-200">Role: Super Admin</option>
                <option value="Plant Admin" className="bg-slate-900 text-slate-200">Role: Plant Admin</option>
                <option value="Store Officer" className="bg-slate-900 text-slate-200">Role: Store Officer</option>
                <option value="Technician" className="bg-slate-900 text-slate-200">Role: Technician</option>
                <option value="Auditor" className="bg-slate-900 text-slate-200">Role: Auditor</option>
              </select>
            </div>

            {/* PKT Clock */}
            <div className="hidden sm:flex items-center gap-1.5 text-slate-400 text-xs font-mono px-2 py-1 bg-slate-950/40 rounded-lg border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="tabular-nums">{pktTime}</span>
            </div>
          </div>
        </div>

        {/* Mobile / Small Screens Tab Bar */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-slate-800/80">
          <div className="flex overflow-x-auto gap-1 no-scrollbar flex-1">
            {primaryTabs.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            {isDrawerSectionActive && activeDrawerSection && (
              <span className="px-3 py-1 text-xs font-semibold rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 whitespace-nowrap">
                {activeDrawerSection.label}
              </span>
            )}
          </div>

          <button
            onClick={onOpenDrawer}
            className="ml-2 px-2.5 py-1 text-xs font-medium text-emerald-400 bg-slate-800 rounded-md border border-slate-700 shrink-0"
          >
            More...
          </button>
        </div>
      </div>
    </header>
  );
};
