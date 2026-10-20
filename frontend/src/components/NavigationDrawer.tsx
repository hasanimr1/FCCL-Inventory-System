import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  Server,
  Boxes,
  Layers,
  Wrench,
  Truck,
  FileText,
  QrCode,
  X,
  ChevronRight,
  Shield,
  Activity,
  Building2,
} from 'lucide-react';
import { PlantId } from '../types/inventory.ts';
import fcclLogo from '../Assets/FCCL logo.png';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onOpenScannerModal: () => void;
  selectedPlant: PlantId | 'all';
  totalDevicesCount: number;
  onlineDevicesCount: number;
  offlineDevicesCount: number;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onOpenScannerModal,
  selectedPlant,
  totalDevicesCount,
  onlineDevicesCount,
  offlineDevicesCount,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const coreSections = [
    {
      id: 'overview',
      name: 'Overview',
      subtitle: 'Executive dashboard, site status & KPIs',
      icon: LayoutDashboard,
      badge: 'Main',
    },
    {
      id: 'assets',
      name: 'Devices',
      subtitle: 'Hardware registry, serial numbers & status',
      icon: Server,
      badge: `${totalDevicesCount} total`,
    },
    {
      id: 'stock',
      name: 'Parts & Spares',
      subtitle: 'Component stock levels & reorders',
      icon: Boxes,
      badge: undefined,
    },
  ];

  const operationsSections = [
    {
      id: 'racks',
      name: 'Server Racks',
      subtitle: '42U/48U datacenter elevation & layout',
      icon: Layers,
    },
    {
      id: 'workorders',
      name: 'Work Orders',
      subtitle: 'Maintenance requests & technician logs',
      icon: Wrench,
    },
    {
      id: 'suppliers',
      name: 'Suppliers & SLAs',
      subtitle: 'Vendor directory & support contracts',
      icon: Truck,
    },
  ];

  const auditSections = [
    {
      id: 'audit',
      name: 'Activity & Audit Log',
      subtitle: 'Verified history & change records',
      icon: FileText,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel */}
      <aside
        className="fixed inset-y-0 left-0 max-w-full flex"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
      >
        <div className="w-84 sm:w-96 bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0">
                <img src={fcclLogo} alt="Fauji Cement Company Limited" className="h-full w-full object-contain" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">FCCL Inventory</h2>
                <p className="text-[11px] text-slate-400 font-mono">Plant Asset Management</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Device Quick Status Pill */}
          <div className="px-5 py-3 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Device Status:</span>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium font-mono text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {onlineDevicesCount} Online
              </span>
              <span className="text-slate-600">·</span>
              <span className="inline-flex items-center gap-1.5 text-orange-400 font-medium font-mono text-[11px]">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                {offlineDevicesCount} Offline
              </span>
            </div>
          </div>

          {/* Navigation Items (Organized into Clear Groups) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Group 1: Important Sections (Always on Top) */}
            <div>
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Primary Sections (On Top)
                </span>
                <span className="text-[9px] font-mono text-emerald-400 uppercase bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.2 rounded">
                  Quick Access
                </span>
              </div>
              <div className="space-y-1">
                {coreSections.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white flex items-center gap-2">
                            <span>{item.name}</span>
                            {item.badge && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{item.subtitle}</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Group 2: Operations & Hardware (Shifted into Drawer) */}
            <div>
              <div className="px-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Operations &amp; Infrastructure
                </span>
              </div>
              <div className="space-y-1">
                {operationsSections.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">{item.name}</div>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{item.subtitle}</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Group 3: Auditing & Tools */}
            <div>
              <div className="px-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Compliance &amp; Utilities
                </span>
              </div>
              <div className="space-y-1">
                {auditSections.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">{item.name}</div>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{item.subtitle}</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                    </button>
                  );
                })}

                {/* Direct Scan Tool Button */}
                <button
                  onClick={() => {
                    onClose();
                    onOpenScannerModal();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer text-slate-300 hover:text-white hover:bg-slate-800/60 border border-dashed border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 flex items-center justify-center shrink-0">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Physical Barcode Scan</div>
                      <p className="text-[11px] text-slate-400">Launch camera &amp; barcode audit tool</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-700/50">
                    Scan
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">Plant Isolation</span>
              <span className="text-[11px] text-slate-300 font-medium">
                {selectedPlant === 'all' ? 'All 4 Plants Active' : selectedPlant}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">Press Esc to close menu</p>
          </div>
        </div>
      </aside>
    </div>
  );
};
