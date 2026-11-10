import React, { useState } from 'react';
import {
  PlantId,
  UserRole,
  Vendor,
  Asset,
  AssetCategory,
  PurchaseRequest,
  PurchaseOrder,
  PurchaseRequestItem,
  PurchaseOrderItem,
  POStatus,
} from '../types/inventory.ts';
import { formatPKR } from '../utils/inventoryRules.ts';
import { hasPermission } from '../utils/rbac.ts';
import {
  createPurchaseRequest,
  approvePurchaseRequest,
  generatePurchaseOrderFromPR,
  completePurchaseOrder,
} from '../utils/procurementService.ts';
import {
  FileText,
  Plus,
  CheckCircle2,
  XCircle,
  Truck,
  Building2,
  Calendar,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Search,
  ExternalLink,
  ChevronRight,
  Check,
  PackageCheck,
  Send,
  Boxes,
  Server,
  FileCheck2,
} from 'lucide-react';

interface PurchaseOrdersViewProps {
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
  vendors: Vendor[];
  assets: Asset[];
  selectedPlant: PlantId | 'all';
  currentRole: UserRole;
  currentUserName: string;
  onAddPR: (pr: PurchaseRequest) => void;
  onApprovePR: (prId: string, decision: 'Approved' | 'Rejected', comments?: string) => void;
  onAddPO: (po: PurchaseOrder, updatedPR: PurchaseRequest) => void;
  onCompletePO: (poId: string) => void;
  onNavigateToAssets: () => void;
  onNavigateToVendor: (vendorId: string) => void;
}

export const PurchaseOrdersView: React.FC<PurchaseOrdersViewProps> = ({
  purchaseRequests,
  purchaseOrders,
  vendors,
  assets,
  selectedPlant,
  currentRole,
  currentUserName,
  onAddPR,
  onApprovePR,
  onAddPO,
  onCompletePO,
  onNavigateToAssets,
  onNavigateToVendor,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'orders' | 'approval_queue'>('requests');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPRModalOpen, setIsPRModalOpen] = useState(false);
  const [selectedPOForDetail, setSelectedPOForDetail] = useState<PurchaseOrder | null>(null);
  const [selectedPRForPO, setSelectedPRForPO] = useState<PurchaseRequest | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New PR Form State
  const [prTitle, setPrTitle] = useState('');
  const [prDepartment, setPrDepartment] = useState('Plant IT Operations');
  const [prPlant, setPrPlant] = useState<PlantId>(selectedPlant === 'all' ? 'plant-1' : selectedPlant);
  const [prPriority, setPrPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High');
  const [prJustification, setPrJustification] = useState('');
  const [prVendorId, setPrVendorId] = useState(vendors[0]?.id || '');
  const [prItems, setPrItems] = useState<Array<{
    description: string;
    category: AssetCategory;
    quantity: number;
    estimatedUnitPricePKR: number;
    suggestedModel: string;
  }>>([
    {
      description: 'Enterprise Compute Server 2U Rack',
      category: 'Server',
      quantity: 1,
      estimatedUnitPricePKR: 850000,
      suggestedModel: 'Dell PowerEdge R660',
    },
  ]);

  // PO Generation Form State (for approved PR)
  const [poSelectedVendorId, setPoSelectedVendorId] = useState(vendors[0]?.id || '');
  const [poDeliveryMethod, setPoDeliveryMethod] = useState('Ground Insured Heavy Logistics');
  const [poNotes, setPoNotes] = useState('Standard FCCL technical inspection required before receipt.');

  const canApprove = hasPermission(currentRole, 'APPROVE_PURCHASE_REQUEST');
  const canGeneratePO = hasPermission(currentRole, 'GENERATE_PURCHASE_ORDER');
  const canCompletePO = hasPermission(currentRole, 'COMPLETE_PURCHASE_ORDER');
  const canCreatePR = hasPermission(currentRole, 'CREATE_PURCHASE_REQUEST');

  // Filtered PRs and POs
  const filteredPRs = purchaseRequests.filter((pr) => {
    if (selectedPlant !== 'all' && pr.plantId !== selectedPlant) return false;
    if (activeSubTab === 'approval_queue' && pr.status !== 'Pending Approval') return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      pr.prNumber.toLowerCase().includes(q) ||
      pr.title.toLowerCase().includes(q) ||
      pr.requestedBy.toLowerCase().includes(q) ||
      pr.department.toLowerCase().includes(q)
    );
  });

  const filteredPOs = purchaseOrders.filter((po) => {
    if (selectedPlant !== 'all' && po.plantId !== selectedPlant) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      po.orderNo.toLowerCase().includes(q) ||
      po.vendorName.toLowerCase().includes(q) ||
      po.customerName.toLowerCase().includes(q) ||
      po.trackingNo.toLowerCase().includes(q)
    );
  });

  const pendingApprovalCount = purchaseRequests.filter(
    (pr) => pr.status === 'Pending Approval' && (selectedPlant === 'all' || pr.plantId === selectedPlant)
  ).length;

  const handleAddPRItem = () => {
    setPrItems([
      ...prItems,
      {
        description: '',
        category: 'Workstation PC',
        quantity: 1,
        estimatedUnitPricePKR: 250000,
        suggestedModel: '',
      },
    ]);
  };

  const handleRemovePRItem = (idx: number) => {
    if (prItems.length <= 1) return;
    setPrItems(prItems.filter((_, i) => i !== idx));
  };

  const handleCreatePRSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newPR = createPurchaseRequest(
        {
          title: prTitle,
          department: prDepartment,
          plantId: prPlant,
          priority: prPriority,
          justification: prJustification,
          items: prItems,
          targetVendorId: prVendorId,
        },
        currentUserName,
        currentRole
      );

      onAddPR(newPR);
      setIsPRModalOpen(false);
      setFeedbackBanner({
        type: 'success',
        message: `Purchase Request ${newPR.prNumber} created and routed to Admin Dashboard for approval.`,
      });
      // Reset form
      setPrTitle('');
      setPrJustification('');
    } catch (err: any) {
      setFeedbackBanner({ type: 'error', message: err.message });
    }
  };

  const handleApprovePRClick = (pr: PurchaseRequest, decision: 'Approved' | 'Rejected') => {
    try {
      onApprovePR(pr.id, decision, `Reviewed by ${currentUserName} (${currentRole})`);
      setFeedbackBanner({
        type: 'success',
        message: `Purchase Request ${pr.prNumber} marked as ${decision}.`,
      });
    } catch (err: any) {
      setFeedbackBanner({ type: 'error', message: err.message });
    }
  };

  const handleOpenPOGenerationModal = (pr: PurchaseRequest) => {
    setSelectedPRForPO(pr);
    if (pr.targetVendorId) {
      setPoSelectedVendorId(pr.targetVendorId);
    }
  };

  const handleGeneratePOSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPRForPO) return;

    const vendor = vendors.find((v) => v.id === poSelectedVendorId) || vendors[0];
    if (!vendor) {
      setFeedbackBanner({ type: 'error', message: 'Please select a valid supplier/vendor.' });
      return;
    }

    try {
      const { purchaseOrder, updatedPR } = generatePurchaseOrderFromPR(
        selectedPRForPO,
        vendor,
        currentUserName,
        currentRole,
        {
          deliveryMethod: poDeliveryMethod,
          notes: poNotes,
        }
      );

      onAddPO(purchaseOrder, updatedPR);
      setSelectedPRForPO(null);
      setSelectedPOForDetail(purchaseOrder);
      setActiveSubTab('orders');
      setFeedbackBanner({
        type: 'success',
        message: `Purchase Order ${purchaseOrder.orderNo} successfully generated from PR ${updatedPR.prNumber} with pre-filled details for ${vendor.name}.`,
      });
    } catch (err: any) {
      setFeedbackBanner({ type: 'error', message: err.message });
    }
  };

  const handleCompletePOClick = (po: PurchaseOrder) => {
    try {
      onCompletePO(po.id);
      setSelectedPOForDetail(null);
      setFeedbackBanner({
        type: 'success',
        message: `Purchase Order ${po.orderNo} marked as COMPLETED! All ordered hardware items have been automatically registered in the Hardware Register (Assets).`,
      });
    } catch (err: any) {
      setFeedbackBanner({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Procurement &amp; Acquisition</span>
            <span aria-hidden="true">·</span>
            <span>PR &amp; PO Lifecycle</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-[#0b6340]" />
            Purchase Requests &amp; Orders
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Submit equipment requisitions, manage Admin approval routing, generate vendor POs, and automatically induct received assets into the Hardware Register.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canCreatePR && (
            <button
              onClick={() => setIsPRModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#063d2a] hover:bg-[#0b6340] rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Purchase Request (PR)</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackBanner && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-xs ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-red-50 border-red-300 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackBanner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{feedbackBanner.message}</span>
          </div>
          <button
            onClick={() => setFeedbackBanner(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Tab Navigation & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('requests')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeSubTab === 'requests'
                ? 'bg-[#063d2a] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Purchase Requests ({purchaseRequests.length})
          </button>

          <button
            onClick={() => setActiveSubTab('approval_queue')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'approval_queue'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <span>Admin Approval Queue</span>
            {pendingApprovalCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white text-amber-900 font-bold">
                {pendingApprovalCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('orders')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeSubTab === 'orders'
                ? 'bg-[#063d2a] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Purchase Orders ({purchaseOrders.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search PR / PO numbers, vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0b6340] bg-white"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {activeSubTab === 'orders' ? (
        /* Purchase Orders View */
        <div className="space-y-4">
          {filteredPOs.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
              No Purchase Orders found. Approved Purchase Requests can be converted into POs.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPOs.map((po) => {
                const isCompleted = po.orderStatus === 'Completed';

                return (
                  <div
                    key={po.id}
                    className="bg-white rounded-xl border border-slate-200 hover:border-[#0b6340] shadow-sm transition p-4 space-y-3 cursor-pointer"
                    onClick={() => setSelectedPOForDetail(po)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[#063d2a] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {po.orderNo}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {po.orderStatus}
                          </span>
                        </div>
                        <h3 className="font-bold text-xs text-slate-900 mt-1.5">{po.vendorName}</h3>
                      </div>

                      <span className="text-xs font-mono font-bold text-slate-900">
                        {formatPKR(po.totalPKR)}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Items Count:</span>
                        <span className="font-semibold text-slate-700">
                          {po.items.reduce((s, i) => s + i.qty, 0)} units ({po.items.length} line items)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Order Date:</span>
                        <span className="font-mono text-slate-700">{po.date}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Est. Delivery:</span>
                        <span className="font-mono text-slate-700">{po.deliveryDate}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-[#00783d] font-semibold flex items-center gap-1">
                        <FileCheck2 className="w-3.5 h-3.5" />
                        View Order Form
                      </span>

                      {!isCompleted && canCompletePO && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompletePOClick(po);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded transition cursor-pointer flex items-center gap-1"
                        >
                          <PackageCheck className="w-3 h-3" />
                          Mark Completed
                        </button>
                      )}

                      {isCompleted && (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Inducted to Hardware Register
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Purchase Requests View (All or Approval Queue) */
        <div className="space-y-4">
          {filteredPRs.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
              {activeSubTab === 'approval_queue'
                ? 'No Purchase Requests currently pending Admin approval.'
                : 'No Purchase Requests found.'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPRs.map((pr) => {
                const isPending = pr.status === 'Pending Approval';
                const isApproved = pr.status === 'Approved';
                const isConverted = pr.status === 'Converted to PO';
                const isRejected = pr.status === 'Rejected';

                return (
                  <div
                    key={pr.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            {pr.prNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              isPending
                                ? 'bg-amber-100 text-amber-800'
                                : isApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : isConverted
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {pr.status}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              pr.priority === 'Critical'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            Priority: {pr.priority}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm text-slate-900 mt-1">{pr.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Requested by <strong className="text-slate-700">{pr.requestedBy}</strong> ({pr.department}) on {pr.requestedDate}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 block">Estimated Cost</span>
                        <span className="text-base font-bold font-mono text-slate-900">
                          {formatPKR(pr.totalEstimatedCostPKR)}
                        </span>
                      </div>
                    </div>

                    {/* Justification & Line Items Table */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-2">
                      <div className="text-slate-700">
                        <strong className="text-slate-900">Justification: </strong>
                        {pr.justification}
                      </div>

                      <div className="overflow-x-auto pt-1">
                        <table className="w-full text-left text-[11px]">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                              <th className="pb-1 font-semibold">Category</th>
                              <th className="pb-1 font-semibold">Description / Model</th>
                              <th className="pb-1 font-semibold text-center">Qty</th>
                              <th className="pb-1 font-semibold text-right">Est. Unit Price</th>
                              <th className="pb-1 font-semibold text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {pr.items.map((item) => (
                              <tr key={item.id}>
                                <td className="py-1 text-slate-800 font-medium">{item.category}</td>
                                <td className="py-1 text-slate-600">{item.description}</td>
                                <td className="py-1 text-center font-mono font-semibold">{item.quantity}</td>
                                <td className="py-1 text-right font-mono text-slate-600">
                                  {formatPKR(item.estimatedUnitPricePKR)}
                                </td>
                                <td className="py-1 text-right font-mono font-bold text-slate-900">
                                  {formatPKR(item.estimatedTotalPKR)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Action Bar (Admin Approval & PO Generation) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div className="text-[11px] text-slate-500">
                        {pr.approvalDecision ? (
                          <span>
                            {pr.approvalDecision.decision} by{' '}
                            <strong>{pr.approvalDecision.decidedBy}</strong> on{' '}
                            {new Date(pr.approvalDecision.decidedAt).toLocaleDateString()}
                            {pr.approvalDecision.comments && ` ("${pr.approvalDecision.comments}")`}
                          </span>
                        ) : (
                          <span className="text-amber-800 font-medium">
                            Awaiting review by Plant Administrator
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Admin Approval Buttons */}
                        {isPending && (
                          <>
                            {canApprove ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleApprovePRClick(pr, 'Rejected')}
                                  className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition cursor-pointer"
                                >
                                  Reject Request
                                </button>
                                <button
                                  onClick={() => handleApprovePRClick(pr, 'Approved')}
                                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition shadow-sm cursor-pointer flex items-center gap-1.5"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  Approve PR
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                                <span>Admin role required for approval</span>
                              </div>
                            )}
                          </>
                        )}

                        {/* PO Generation Button */}
                        {isApproved && (
                          <>
                            {canGeneratePO ? (
                              <button
                                onClick={() => handleOpenPOGenerationModal(pr)}
                                className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#063d2a] hover:bg-[#0b6340] rounded-lg transition shadow-sm cursor-pointer flex items-center gap-1.5"
                              >
                                <FileText className="w-4 h-4" />
                                Generate Purchase Order (PO)
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-500">
                                Approved · PO creation restricted to Admin
                              </span>
                            )}
                          </>
                        )}

                        {isConverted && (
                          <span className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            PO Generated ({pr.generatedPoId})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          Detailed Purchase Order Modal (Formatted exactly as ORDER FORM image!)
          ========================================================================= */}
      {selectedPOForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-300 overflow-hidden my-6">
            {/* Header: Forest Green Banner matching uploaded image */}
            <div className="bg-[#006633] text-white py-4 px-6 flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-widest uppercase">ORDER FORM</h2>
              <button
                onClick={() => setSelectedPOForDetail(null)}
                className="text-white/80 hover:text-white text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 text-slate-900">
              {/* CUSTOMER INFORMATION + Top Boxes */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                  <div className="bg-[#006633] text-white px-4 py-1.5 text-xs font-bold tracking-wide uppercase inline-block">
                    CUSTOMER INFORMATION
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex border border-slate-400 text-xs">
                      <span className="font-bold px-2.5 py-1 bg-slate-100 border-r border-slate-400">
                        ORDER NO.
                      </span>
                      <span className="font-mono font-bold px-3 py-1 bg-white text-slate-900">
                        {selectedPOForDetail.orderNo}
                      </span>
                    </div>

                    <div className="flex border border-slate-400 text-xs">
                      <span className="font-bold px-2.5 py-1 bg-slate-100 border-r border-slate-400">
                        DATE
                      </span>
                      <span className="font-mono px-3 py-1 bg-white text-slate-900">
                        {selectedPOForDetail.date}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pre-filled Customer & Vendor Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border border-slate-200 p-3 rounded-lg bg-slate-50/50">
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase text-[#006633] border-b pb-0.5">
                      Client Entity (Buyer)
                    </div>
                    <div>
                      <strong className="text-slate-500">NAME: </strong>
                      <span className="font-medium text-slate-800">{selectedPOForDetail.customerName}</span>
                    </div>
                    <div>
                      <strong className="text-slate-500">COMPANY: </strong>
                      <span className="font-medium text-slate-800">{selectedPOForDetail.company}</span>
                    </div>
                    <div>
                      <strong className="text-slate-500">PHONE NO: </strong>
                      <span className="font-mono text-slate-800">{selectedPOForDetail.phoneNo}</span>
                    </div>
                    <div>
                      <strong className="text-slate-500">EMAIL: </strong>
                      <span className="text-slate-800">{selectedPOForDetail.email}</span>
                    </div>
                    <div>
                      <strong className="text-slate-500">ADDRESS: </strong>
                      <span className="text-slate-800">{selectedPOForDetail.address}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase text-[#006633] border-b pb-0.5 flex items-center justify-between">
                      <span>Vendor / Supplier Records</span>
                      <span className="font-mono text-[10px] font-bold text-slate-500">
                        {selectedPOForDetail.vendorId}
                      </span>
                    </div>
                    <div>
                      <strong className="text-slate-500">NAME: </strong>
                      <span className="font-medium text-slate-800">{selectedPOForDetail.vendorName}</span>
                    </div>
                    <div>
                      <strong className="text-slate-500">COMPANY: </strong>
                      <span className="font-medium text-slate-800">{selectedPOForDetail.vendorCompany}</span>
                    </div>
                    <div>
                      <strong className="text-slate-500">PHONE NO: </strong>
                      <span className="font-mono text-slate-800">{selectedPOForDetail.vendorPhone}</span>
                    </div>
                    <div>
                      <strong className="text-slate-500">EMAIL: </strong>
                      <span className="text-slate-800">{selectedPOForDetail.vendorEmail}</span>
                    </div>
                    <div>
                      <strong className="text-slate-500">ADDRESS: </strong>
                      <span className="text-slate-800">{selectedPOForDetail.vendorAddress}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ORDER DETAILS Section */}
              <div>
                <div className="bg-[#006633] text-white px-4 py-1.5 text-xs font-bold tracking-wide uppercase mb-2 inline-block">
                  ORDER DETAILS
                </div>

                <div className="border border-slate-300 overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                        <th className="p-2 border-r border-slate-300 text-center w-12">NO.</th>
                        <th className="p-2 border-r border-slate-300">ITEM DESCRIPTION</th>
                        <th className="p-2 border-r border-slate-300 text-center w-16">QTY</th>
                        <th className="p-2 border-r border-slate-300 text-right w-28">PRICE</th>
                        <th className="p-2 border-r border-slate-300 text-right w-24">DISCOUNT</th>
                        <th className="p-2 text-right w-28">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedPOForDetail.items.map((item) => (
                        <tr key={item.itemNo} className="hover:bg-slate-50">
                          <td className="p-2 border-r border-slate-300 text-center font-mono">{item.itemNo}</td>
                          <td className="p-2 border-r border-slate-300 font-medium">
                            {item.description}
                            {item.suggestedModel && (
                              <span className="block text-[11px] text-slate-500">
                                Model: {item.suggestedModel}
                              </span>
                            )}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center font-mono font-bold">
                            {item.qty}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-right font-mono">
                            {formatPKR(item.price)}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-right font-mono text-slate-500">
                            {formatPKR(item.discount)}
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">
                            {formatPKR(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Summary Footer on bottom right */}
                  <div className="flex justify-end border-t border-slate-300 bg-slate-50">
                    <div className="w-64 border-l border-slate-300 text-xs">
                      <div className="flex justify-between p-2 border-b border-slate-200">
                        <span className="font-semibold text-slate-600">SUBTOTAL</span>
                        <span className="font-mono font-semibold">{formatPKR(selectedPOForDetail.subtotalPKR)}</span>
                      </div>
                      <div className="flex justify-between p-2 border-b border-slate-200">
                        <span className="font-semibold text-slate-600">TAX (18% GST)</span>
                        <span className="font-mono font-semibold">{formatPKR(selectedPOForDetail.taxPKR)}</span>
                      </div>
                      <div className="flex justify-between p-2 border-b border-slate-200">
                        <span className="font-semibold text-slate-600">SHIPPING</span>
                        <span className="font-mono font-semibold">{formatPKR(selectedPOForDetail.shippingPKR)}</span>
                      </div>
                      <div className="flex justify-between p-2 font-bold bg-[#006633]/10 text-slate-900">
                        <span>TOTAL</span>
                        <span className="font-mono text-sm">{formatPKR(selectedPOForDetail.totalPKR)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ORDER STATUS Checkboxes matching uploaded image */}
              <div>
                <div className="bg-[#006633] text-white px-4 py-1.5 text-xs font-bold tracking-wide uppercase mb-2 inline-block">
                  ORDER STATUS
                </div>

                <div className="flex items-center gap-6 text-xs font-bold">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPOForDetail.orderStatus === 'Started'}
                      readOnly
                      className="w-4 h-4 text-[#006633] rounded"
                    />
                    <span>STARTED</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPOForDetail.orderStatus === 'Completed'}
                      readOnly
                      className="w-4 h-4 text-[#006633] rounded"
                    />
                    <span>COMPLETED</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPOForDetail.orderStatus === 'Delivered'}
                      readOnly
                      className="w-4 h-4 text-[#006633] rounded"
                    />
                    <span>DELIVERED</span>
                  </label>
                </div>
              </div>

              {/* Split Bottom: DELIVERY DETAILS + NOTES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="bg-[#006633] text-white px-4 py-1.5 text-xs font-bold tracking-wide uppercase mb-2 inline-block">
                    DELIVERY DETAILS
                  </div>

                  <div className="border border-slate-300 text-xs">
                    <div className="grid grid-cols-3 border-b border-slate-200 p-2">
                      <span className="font-bold text-slate-600">METHOD</span>
                      <span className="col-span-2 font-medium">{selectedPOForDetail.deliveryMethod}</span>
                    </div>
                    <div className="grid grid-cols-3 border-b border-slate-200 p-2">
                      <span className="font-bold text-slate-600">EST. DATE</span>
                      <span className="col-span-2 font-mono">{selectedPOForDetail.deliveryDate}</span>
                    </div>
                    <div className="grid grid-cols-3 border-b border-slate-200 p-2">
                      <span className="font-bold text-slate-600">TRACKING NO</span>
                      <span className="col-span-2 font-mono font-bold text-slate-800">
                        {selectedPOForDetail.trackingNo}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 p-2 bg-slate-50">
                      <span className="font-bold text-slate-600">DATE RECEIVED</span>
                      <span className="col-span-2 font-mono font-bold text-emerald-800">
                        {selectedPOForDetail.dateReceived || 'Pending Receiving Inspection'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="bg-[#006633] text-white px-4 py-1.5 text-xs font-bold tracking-wide uppercase mb-2 inline-block">
                    NOTES
                  </div>

                  <div className="border border-slate-300 p-3 h-28 text-xs text-slate-700 bg-slate-50/50 rounded overflow-y-auto leading-relaxed">
                    {selectedPOForDetail.notes}
                    {selectedPOForDetail.completedBy && (
                      <div className="mt-2 text-[11px] font-semibold text-emerald-800 border-t pt-1">
                        Completed &amp; Inducted by {selectedPOForDetail.completedBy} at{' '}
                        {new Date(selectedPOForDetail.completedAt!).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Mark Completed -> Auto Induct Assets */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedPOForDetail(null)}
                  className="px-4 py-2 border border-slate-300 text-xs font-semibold text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Close Form
                </button>

                {selectedPOForDetail.orderStatus !== 'Completed' ? (
                  <button
                    type="button"
                    onClick={() => handleCompletePOClick(selectedPOForDetail)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>Mark Completed &amp; Induct into Hardware Register</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      All items registered in Hardware Register
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPOForDetail(null);
                        onNavigateToAssets();
                      }}
                      className="px-3 py-1.5 bg-[#063d2a] hover:bg-[#0b6340] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      <Server className="w-3.5 h-3.5" />
                      View Devices
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          Create Purchase Request Modal
          ========================================================================= */}
      {isPRModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-300 overflow-hidden my-6">
            <div className="bg-[#063d2a] text-white py-3.5 px-6 flex items-center justify-between">
              <h2 className="text-sm font-bold tracking-wide flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Submit New Purchase Request (PR)
              </h2>
              <button
                onClick={() => setIsPRModalOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePRSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Request Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Edge Server telemetry upgrade for CCR"
                    value={prTitle}
                    onChange={(e) => setPrTitle(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-[#0b6340] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={prDepartment}
                    onChange={(e) => setPrDepartment(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-[#0b6340] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Plant Site</label>
                  <select
                    value={prPlant}
                    onChange={(e) => setPrPlant(e.target.value as PlantId)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none"
                  >
                    <option value="plant-1">Plant 1 — Hattar</option>
                    <option value="plant-2">Plant 2 — Nizampur</option>
                    <option value="plant-3">Plant 3 — Wah / Askari</option>
                    <option value="plant-4">Plant 4 — Pezu</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={prPriority}
                    onChange={(e) => setPrPriority(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preferred Supplier</label>
                  <select
                    value={prVendorId}
                    onChange={(e) => setPrVendorId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Business &amp; Operational Justification *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Explain operational necessity, risk of downtime, or project requirement..."
                  value={prJustification}
                  onChange={(e) => setPrJustification(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-[#0b6340] focus:outline-none"
                />
              </div>

              {/* Line Items Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Requisition Line Items ({prItems.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPRItem}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                  {prItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-200"
                    >
                      <div className="col-span-3">
                        <select
                          value={item.category}
                          onChange={(e) => {
                            const updated = [...prItems];
                            updated[idx].category = e.target.value as AssetCategory;
                            setPrItems(updated);
                          }}
                          className="w-full border border-slate-300 rounded p-1 text-[11px]"
                        >
                          <option value="Server">Server</option>
                          <option value="Network Switch">Network Switch</option>
                          <option value="Workstation PC">Workstation PC</option>
                          <option value="Industrial Laptop">Industrial Laptop</option>
                          <option value="UPS System">UPS System</option>
                          <option value="SAN Storage">SAN Storage</option>
                          <option value="Core Router">Core Router</option>
                        </select>
                      </div>

                      <div className="col-span-4">
                        <input
                          type="text"
                          required
                          placeholder="Description / Model"
                          value={item.description}
                          onChange={(e) => {
                            const updated = [...prItems];
                            updated[idx].description = e.target.value;
                            setPrItems(updated);
                          }}
                          className="w-full border border-slate-300 rounded p-1 text-[11px]"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          min={1}
                          required
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...prItems];
                            updated[idx].quantity = Math.max(1, parseInt(e.target.value, 10) || 1);
                            setPrItems(updated);
                          }}
                          className="w-full border border-slate-300 rounded p-1 text-[11px] font-mono text-center"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          min={1000}
                          step={1000}
                          required
                          placeholder="PKR"
                          value={item.estimatedUnitPricePKR}
                          onChange={(e) => {
                            const updated = [...prItems];
                            updated[idx].estimatedUnitPricePKR = Math.max(0, parseInt(e.target.value, 10) || 0);
                            setPrItems(updated);
                          }}
                          className="w-full border border-slate-300 rounded p-1 text-[11px] font-mono text-right"
                        />
                      </div>

                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemovePRItem(idx)}
                          className="text-red-500 hover:text-red-700 font-bold text-sm cursor-pointer"
                          disabled={prItems.length <= 1}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                <span className="font-semibold text-emerald-900">Total Estimated Procurement Cost:</span>
                <span className="font-mono font-bold text-sm text-emerald-900">
                  {formatPKR(
                    prItems.reduce((acc, curr) => acc + curr.quantity * curr.estimatedUnitPricePKR, 0)
                  )}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsPRModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#063d2a] hover:bg-[#0b6340] text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Route to Admin Dashboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          Generate Purchase Order Modal (Pre-fills Vendor from Supplier records)
          ========================================================================= */}
      {selectedPRForPO && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-300 overflow-hidden my-6">
            <div className="bg-[#006633] text-white py-3.5 px-6 flex items-center justify-between">
              <h2 className="text-sm font-bold tracking-wide uppercase">
                Generate PO from PR {selectedPRForPO.prNumber}
              </h2>
              <button
                onClick={() => setSelectedPRForPO(null)}
                className="text-white/80 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGeneratePOSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border rounded-lg space-y-1">
                <div className="font-bold text-slate-800">{selectedPRForPO.title}</div>
                <div className="text-slate-500">
                  PR Ref: <span className="font-mono">{selectedPRForPO.prNumber}</span> · Plant:{' '}
                  {selectedPRForPO.plantId}
                </div>
              </div>

              {/* Select Vendor to Pre-fill */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Vendor / Supplier (Pre-fills Contract Details)
                </label>
                <select
                  value={poSelectedVendorId}
                  onChange={(e) => setPoSelectedVendorId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium focus:ring-1 focus:ring-[#006633] focus:outline-none"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.code}) — {v.category}
                    </option>
                  ))}
                </select>

                {/* Vendor Preview Box */}
                {(() => {
                  const vend = vendors.find((v) => v.id === poSelectedVendorId);
                  if (!vend) return null;
                  return (
                    <div className="mt-2 p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-lg text-[11px] text-slate-700 space-y-1">
                      <div className="font-bold text-[#006633]">{vend.name}</div>
                      <div>Contact: {vend.contactPerson} ({vend.email})</div>
                      <div className="font-mono">Phone: {vend.phone} · SLA: {vend.slaHours}h</div>
                      <div>Address: {vend.address}</div>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Shipping &amp; Logistics Method</label>
                <input
                  type="text"
                  value={poDeliveryMethod}
                  onChange={(e) => setPoDeliveryMethod(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">PO Terms &amp; Inspection Notes</label>
                <textarea
                  rows={2}
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedPRForPO(null)}
                  className="px-3.5 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#006633] hover:bg-[#00552b] text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Generate Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
