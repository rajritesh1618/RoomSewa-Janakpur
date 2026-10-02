import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Crown,
  Eye,
  CreditCard,
  Building,
  User,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { useRooms } from '../../context/RoomContext';
import { PremiumRequest } from '../../types';

export const AdminPaymentApprovals: React.FC = () => {
  const { premiumRequests, approvePremiumRequest, rejectPremiumRequest } = useRooms();

  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [approvingReq, setApprovingReq] = useState<PremiumRequest | null>(null);
  const [rejectingReq, setRejectingReq] = useState<PremiumRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredRequests = premiumRequests.filter((req) => {
    const matchesFilter = filter === 'all' || req.status === filter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (req.userName || '').toLowerCase().includes(q) ||
      (req.userEmail || '').toLowerCase().includes(q) ||
      (req.userPhone || '').toLowerCase().includes(q) ||
      (req.transactionReference || '').toLowerCase().includes(q) ||
      (req.paymentMethod || '').toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const pendingCount = premiumRequests.filter((r) => r.status === 'pending').length;
  const approvedCount = premiumRequests.filter((r) => r.status === 'approved').length;
  const rejectedCount = premiumRequests.filter((r) => r.status === 'rejected').length;

  const handleOpenApproveModal = (req: PremiumRequest) => {
    if (req.status === 'approved') {
      setFeedbackMsg({
        type: 'error',
        text: `Payment from ${req.userName} has already been approved.`
      });
      return;
    }
    setApprovingReq(req);
  };

  const handleConfirmApprove = async () => {
    if (!approvingReq) return;
    const req = approvingReq;

    setProcessingId(req.id);
    try {
      await approvePremiumRequest(req.id, req.userId);
      setFeedbackMsg({
        type: 'success',
        text: `Payment approved! Lifetime Gold status activated for ${req.userName}.`
      });
      setApprovingReq(null);
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err: any) {
      console.error('Approve payment error:', err);
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to approve payment. Please check database connection.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingReq) return;
    const reasonText = rejectReason.trim();
    if (!reasonText) {
      setFeedbackMsg({ type: 'error', text: 'Please enter a clear rejection reason for the owner.' });
      return;
    }

    setProcessingId(rejectingReq.id);
    try {
      await rejectPremiumRequest(rejectingReq.id, reasonText);
      setFeedbackMsg({
        type: 'success',
        text: `Payment request for ${rejectingReq.userName} has been rejected with reason recorded.`
      });
      setRejectingReq(null);
      setRejectReason('');
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err: any) {
      console.error('Reject payment error:', err);
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to reject payment request.' });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold mb-3">
              <Crown className="w-3.5 h-3.5 fill-amber-400" />
              Direct Landlord Payment Verification
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
              Premium Payment Approvals & Proof Desk
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Verify submitted eSewa, Khalti, and bank transfers. Approving a request grants lifetime Gold Landlord privileges and immediately highlights all room cards.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-center">
              <div className="text-2xl font-black text-amber-400">{pendingCount}</div>
              <div className="text-[10px] uppercase font-bold text-amber-200">Pending Review</div>
            </div>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {feedbackMsg.text}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, transaction ID..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-amber-600 outline-none"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              filter === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              filter === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              filter === 'rejected'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Rejected ({rejectedCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({premiumRequests.length})
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((req) => {
          const isPending = req.status === 'pending';
          const isApproved = req.status === 'approved';
          const isRejected = req.status === 'rejected';

          return (
            <div
              key={req.id}
              className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                isPending
                  ? 'bg-white border-amber-200 shadow-md ring-1 ring-amber-100'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                {/* Left: User Details */}
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold capitalize ${
                        isPending
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : isApproved
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-rose-100 text-rose-900 border border-rose-300'
                      }`}
                    >
                      {isPending && <Clock className="w-3 h-3 text-amber-600" />}
                      {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {isRejected && <XCircle className="w-3 h-3 text-rose-600" />}
                      {req.status}
                    </span>

                    <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      Amount: Rs {req.amountNPR || 200}
                    </span>

                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      Gateway: {req.paymentMethod}
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 font-heading">
                    {req.userName}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{req.userEmail || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono">{req.userPhone || 'No phone'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Txn Ref: <strong className="font-mono text-slate-900">{req.transactionReference || 'N/A'}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(req.requestedAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {(req.adminNotes || (req as any).rejectionReason) && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-rose-900">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        Rejection Reason:
                      </div>
                      <p className="italic pl-5 font-medium">{req.adminNotes || (req as any).rejectionReason}</p>
                    </div>
                  )}

                  {req.reviewedBy && (
                    <div className="text-[11px] text-slate-500 font-medium">
                      Reviewed by <strong>{req.reviewedBy}</strong> on {req.reviewedAt ? new Date(req.reviewedAt).toLocaleString() : ''}
                    </div>
                  )}
                </div>

                {/* Right: Proof Preview & Action Buttons */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-end gap-3 shrink-0">
                  {req.proofImageUrl && (
                    <button
                      onClick={() => setSelectedProofUrl(req.proofImageUrl || null)}
                      className="p-2 rounded-xl border border-slate-200 hover:border-indigo-400 flex items-center gap-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
                    >
                      <img
                        src={req.proofImageUrl}
                        alt="Proof receipt"
                        className="w-10 h-10 object-cover rounded-lg border border-slate-100"
                        onError={(e) => {
                          (e.target as any).style.display = 'none';
                        }}
                      />
                      <span>View Payment Receipt</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </button>
                  )}

                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenApproveModal(req)}
                        disabled={processingId === req.id}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {processingId === req.id ? 'Approving...' : 'Approve Payment'}
                      </button>
                      <button
                        onClick={() => setRejectingReq(req)}
                        disabled={processingId === req.id}
                        className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-all flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}

                  {isApproved && (
                    <div className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                      <Crown className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                      Lifetime Gold Active
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredRequests.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
            <Crown className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 font-heading">
              No payment requests found
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              There are no {filter !== 'all' ? filter : ''} payment submissions to display.
            </p>
          </div>
        )}
      </div>

      {/* Proof Receipt Zoom Modal */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full text-center shadow-2xl animate-in fade-in zoom-in-95">
            <h4 className="text-base font-bold text-slate-900 mb-4 font-heading">
              Payment Screenshot / Receipt Proof
            </h4>
            <div className="max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-200 mb-4">
              <img
                src={selectedProofUrl}
                alt="Receipt Full"
                className="w-full object-contain mx-auto"
              />
            </div>
            <button
              onClick={() => setSelectedProofUrl(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {approvingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Crown className="w-7 h-7 fill-amber-500 text-amber-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 font-heading text-center mb-1">
              Approve Premium Payment
            </h3>
            <p className="text-xs text-slate-500 text-center mb-5">
              Confirm activating lifetime Gold Landlord privileges for property owner <strong>{approvingReq.userName}</strong>.
            </p>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-5 space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Owner Name:</span>
                <span className="font-bold text-slate-900">{approvingReq.userName}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Email / Phone:</span>
                <span className="font-mono text-slate-700">{approvingReq.userEmail || approvingReq.userPhone || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Payment Method:</span>
                <span className="font-bold text-indigo-700 uppercase bg-indigo-50 px-2 py-0.5 rounded">{approvingReq.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Amount Received:</span>
                <span className="font-extrabold text-emerald-700 text-sm">रु {approvingReq.amountNPR || 200}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Transaction Reference:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {approvingReq.transactionReference || 'Direct / Bank'}
                </span>
              </div>

              {approvingReq.proofImageUrl && (
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Payment Screenshot:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedProofUrl(approvingReq.proofImageUrl || null)}
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 text-[11px]"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Receipt
                  </button>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs mb-5 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Actions that will be executed:
              </p>
              <ul className="list-disc list-inside text-[11px] text-emerald-800/90 pl-1 space-y-0.5">
                <li>Payment status saved as <strong>Approved</strong> in database</li>
                <li><strong>Lifetime Gold Landlord</strong> activated permanently for owner</li>
                <li>All current property listings updated with <strong>Verified Gold badge</strong></li>
                <li>Automatic confirmation message sent to Owner's Messages section</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setApprovingReq(null)}
                disabled={processingId === approvingReq.id}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={processingId === approvingReq.id}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {processingId === approvingReq.id ? 'Approving & Activating...' : 'Confirm & Approve Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-heading text-center mb-1">
              Reject Payment Request?
            </h3>
            <p className="text-xs text-slate-600 text-center mb-4">
              Rejecting payment from <strong>{rejectingReq.userName}</strong>. The user will remain on a standard account.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Reason for Rejection *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Transaction reference not found in bank statement, screenshot illegible, or payment amount mismatch..."
                  rows={3}
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-rose-600 outline-none resize-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  This reason will be displayed in the Owner's Premium screen and sent directly to their Messages.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingReq(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
