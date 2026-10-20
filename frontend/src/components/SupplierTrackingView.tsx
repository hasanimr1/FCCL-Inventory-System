import React, { useState } from 'react';
import {
  Vendor,
  Asset,
  StockItem,
  AssetCategory,
} from '../types/inventory.ts';
import { formatPKR, getDeviceNumber } from '../utils/inventoryRules.ts';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Star,
  Server,
  Boxes,
  Plus,
  ExternalLink,
  Search,
} from 'lucide-react';

interface SupplierTrackingViewProps {
  vendors: Vendor[];
  assets: Asset[];
  stockItems: StockItem[];
  selectedVendorId?: string;
  onSelectVendor?: (vendorId: string) => void;
  onAddVendor: (vendor: Omit<Vendor, 'id'>) => void;
  onNavigateToAsset: (assetTag: string) => void;
}

export const SupplierTrackingView: React.FC<SupplierTrackingViewProps> = ({
  vendors,
  assets,
  stockItems,
  selectedVendorId,
  onSelectVendor,
  onAddVendor,
  onNavigateToAsset,
}) => {
  const [activeVendorId, setActiveVendorId] = useState<string>(
    selectedVendorId || vendors[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New vendor form state
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('VND-');
  const [newCategory, setNewCategory] = useState('Hardware & Networking');
  const [newContact, setNewContact] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('Islamabad / Rawalpindi');
  const [newSla, setNewSla] = useState(4);
  const [newHotline, setNewHotline] = useState('0800-');

  const filteredVendors = vendors.filter((v) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.code.toLowerCase().includes(q) ||
      v.contactPerson.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q)
    );
  });

  const currentVendor = vendors.find((v) => v.id === activeVendorId) || vendors[0];

  const vendorAssets = assets.filter((a) => a.vendorId === currentVendor?.id);
  const vendorSpares = stockItems.filter((s) => s.vendorId === currentVendor?.id);
  const totalVendorAssetsValuation = vendorAssets.reduce((acc, curr) => acc + curr.costPKR, 0);

  const handleCreateVendor = (e: React.FormEvent) => {
    e.preventDefault();
    onAddVendor({
      code: newCode,
      name: newName,
      category: newCategory,
      contactPerson: newContact,
      email: newEmail,
      phone: newPhone,
      address: newAddress,
      rating: 4.7,
      activeContracts: 1,
      slaHours: Number(newSla),
      supportHotline: newHotline,
      suppliedCategories: ['Server', 'Network Switch'],
      totalSpendPKR: 0,
    });
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Procurement &amp; Vendor Management</span>
            <span aria-hidden="true">·</span>
            <span>Supplier Performance</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Supplier &amp; Hardware Vendor Tracking
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Maintain authorized enterprise suppliers, SLA contracts, support escalation hotlines, and track vendor-linked assets and spare part inventories.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Main Split: Supplier Directory (Left) + Detailed Profile & Linked Assets (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Vendor List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search suppliers by name, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white"
            />
          </div>

          <div className="space-y-2">
            {filteredVendors.map((vendor) => {
              const isSelected = vendor.id === currentVendor?.id;
              const assetCount = assets.filter((a) => a.vendorId === vendor.id).length;

              return (
                <div
                  key={vendor.id}
                  onClick={() => {
                    setActiveVendorId(vendor.id);
                    if (onSelectVendor) onSelectVendor(vendor.id);
                  }}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border-slate-900 shadow-sm ring-1 ring-slate-900'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {vendor.code}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{vendor.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-1">{vendor.category}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono font-medium text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      <span>{vendor.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      SLA: <strong className="text-slate-700 font-mono">{vendor.slaHours}h</strong>
                    </span>
                    <span>
                      <strong className="text-slate-800 font-mono">{assetCount}</strong> Assets Linked
                    </span>
                    <span className="font-mono text-slate-800 font-semibold">
                      {formatPKR(vendor.totalSpendPKR)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Vendor Deep-Dive */}
        <div className="lg:col-span-7 space-y-4">
          {currentVendor ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {currentVendor.code}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">{currentVendor.name}</h2>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{currentVendor.category}</p>
                </div>

                <div className="text-right sm:text-right">
                  <span className="text-xs text-slate-500 block">Total Procurement Spend</span>
                  <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
                    {formatPKR(currentVendor.totalSpendPKR)}
                  </span>
                </div>
              </div>

              {/* Vendor Contact & SLA Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Point of Contact</span>
                  </div>
                  <div className="text-slate-700">{currentVendor.contactPerson}</div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{currentVendor.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 font-mono">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{currentVendor.phone}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>SLA &amp; Support Escalation</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Incident Response SLA:</span>
                    <span className="font-mono font-bold text-slate-900">{currentVendor.slaHours} Hours On-Site</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Active Maintenance Contracts:</span>
                    <span className="font-mono font-semibold">{currentVendor.activeContracts} Master Agreements</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span>24/7 Hotline:</span>
                    <span className="font-mono font-semibold text-emerald-700">{currentVendor.supportHotline}</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Regional Depot / Office: {currentVendor.address}</span>
              </div>

              {/* Linked Hardware Assets */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-slate-600" />
                    <span>Active Capital Assets ({vendorAssets.length})</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    Subtotal: {formatPKR(totalVendorAssetsValuation)}
                  </span>
                </div>

                {vendorAssets.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No assets registered under this supplier yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {vendorAssets.map((asset) => {
                      const devNum = getDeviceNumber(asset, assets);
                      return (
                        <div
                          key={asset.id}
                          onClick={() => onNavigateToAsset(asset.assetTag)}
                          className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-100/70 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 bg-slate-200/80 px-1.5 py-0.5 rounded text-[11px]">
                                Device #{devNum}
                              </span>
                              {asset.liveStatus === 'Online' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded font-semibold border border-orange-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Offline
                                </span>
                              )}
                              <span className="text-slate-600 font-medium">{asset.model}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              SN: {asset.serialNumber} · Warranty until {asset.warrantyEnd}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-mono text-slate-800 font-semibold block">
                              {formatPKR(asset.costPKR)}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 justify-end">
                              Inspect <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Linked Spare Parts In Store */}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                  <Boxes className="w-3.5 h-3.5 text-slate-600" />
                  <span>Sourced Spare Parts in Inventory ({vendorSpares.length})</span>
                </div>

                {vendorSpares.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2 text-center">No spare parts linked to this vendor.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {vendorSpares.map((spare) => (
                      <div key={spare.id} className="p-2 rounded border border-slate-200 bg-white">
                        <div className="font-mono font-semibold text-slate-900">Part #: {spare.sku}</div>
                        <div className="text-slate-600 text-[11px] line-clamp-1">{spare.name}</div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Stock: <strong className="font-mono text-slate-800">{spare.currentStock}</strong></span>
                          <span className="font-mono font-medium text-slate-900">{formatPKR(spare.unitPricePKR)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-xs">
              Select a supplier from the directory to review contract SLAs and assets.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Supplier */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Register Enterprise Supplier</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Vendor Code</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Company / Brand Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Primary Category</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Account Contact Person</label>
                <input
                  type="text"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Phone</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">SLA Hours</label>
                <input
                  type="number"
                  min={1}
                  value={newSla}
                  onChange={(e) => setNewSla(Number(e.target.value))}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">24/7 Hotline</label>
                <input
                  type="text"
                  value={newHotline}
                  onChange={(e) => setNewHotline(e.target.value)}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5 font-mono"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-slate-700 font-medium w-36 shrink-0">Depot Office Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="flex-1 border border-slate-300 rounded px-2.5 py-1.5"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-slate-900 text-white hover:bg-slate-800 font-medium"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
