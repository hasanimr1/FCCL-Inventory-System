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
  ShoppingBag,
  Lock,
} from 'lucide-react';
import { PlantId, UserRole } from '../types/inventory.ts';
import { canAccessTab } from '../utils/rbac.ts';
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
  currentRole?: UserRole;
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
  currentRole = 'Admin',
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
      id: 'procurement',
      name: 'Procurement (PR/PO)',
      subtitle: 'Requisitions, Admin approval & Vendor POs',
      icon: ShoppingBag,
    },
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
                <p className="text-[11px] text-slate-400 font-mono">Role: {currentRole}</p>
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

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Group 1: Primary Sections */}
            <div>
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Primary Sections
                </span>
                <span className="text-[9px] font-mono text-emerald-400 uppercase bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.2 rounded">
                  Quick Access
                </span>
              </div>
              <div className="space-y-1">
                {coreSections.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const allowed = canAccessTab(currentRole, item.id);

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (allowed) {
                          onSelectTab(item.id);
                          onClose();
                        }
                      }}
                      disabled={!allowed}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                        !allowed
                          ? 'opacity-40 cursor-not-allowed text-slate-500'
                          : isActive
                          ? 'bg-slate-800 text-white shadow-sm border border-slate-700 cursor-pointer'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60 cursor-pointer'
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
                            {!allowed && (
                              <span className="text-[9px] text-amber-400/80 font-mono flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> Restricted
                              </span>
                            )}
                            {item.badge && allowed && (
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

            {/* Group 2: Operations Sections */}
            <div>
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Operations &amp; Procurement
                </span>
              </div>
              <div className="space-y-1">
                {operationsSections.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const allowed = canAccessTab(currentRole, item.id);

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (allowed) {
                          onSelectTab(item.id);
                          onClose();
                        }
                      }}
                      disabled={!allowed}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                        !allowed
                          ? 'opacity-40 cursor-not-allowed text-slate-500'
                          : isActive
                          ? 'bg-slate-800 text-white shadow-sm border border-slate-700 cursor-pointer'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60 cursor-pointer'
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
                            {!allowed && (
                              <span className="text-[9px] text-amber-400/80 font-mono flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> Restricted
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

            {/* Group 3: Compliance & Tamper-Evident Audit */}
            <div>
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Compliance &amp; Integrity
                </span>
              </div>
              <div className="space-y-1">
                {auditSections.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const allowed = canAccessTab(currentRole, item.id);

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (allowed) {
                          onSelectTab(item.id);
                          onClose();
                        }
                      }}
                      disabled={!allowed}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                        !allowed
                          ? 'opacity-40 cursor-not-allowed text-slate-500'
                          : isActive
                          ? 'bg-slate-800 text-white shadow-sm border border-slate-700 cursor-pointer'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60 cursor-pointer'
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
                            {!allowed && (
                              <span className="text-[9px] text-amber-400/80 font-mono flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> Restricted
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
          </div>

          {/* Footer Quick Scan Button */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80">
            <button
              onClick={() => {
                onClose();
                onOpenScannerModal();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Launch QR Scanner Walkthrough</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
