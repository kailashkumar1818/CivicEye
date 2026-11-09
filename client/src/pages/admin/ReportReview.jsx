import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminApi from '../../api/admin';
import StatusBadge from '../../components/reports/StatusBadge';
import CategoryBadge from '../../components/reports/CategoryBadge';
import Timeline from '../../components/reports/Timeline';
import BeforeAfterCompare from '../../components/reports/BeforeAfterCompare';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Calendar,
  Sparkles,
  AlertTriangle,
  Building2,
  Flame,
  GitMerge,
  Send,
  CheckCircle2,
  Lock,
  User,
  Phone,
  Mail,
  Edit2,
  Check,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const customPin = L.divIcon({
  className: 'custom-map-marker',
  html: `<div style="background-color:#2563eb; width:28px; height:28px; border-radius:50%; border:3px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:white; font-size:12px;">📍</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

export default function ReportReview() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  // Local state
  const [activeImage, setActiveImage] = useState(0);
  const [statusVal, setStatusVal] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [selectedDept, setSelectedDept] = useState('');
  const [priorityVal, setPriorityVal] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');

  const [mergeTargetId, setMergeTargetId] = useState('');
  const [showMergeDialog, setShowMergeDialog] = useState(false);

  // Resolution photo state
  const [resolutionFile, setResolutionFile] = useState(null);
  const [resolutionPreview, setResolutionPreview] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');

  // Fetch report details
  const { data: report, isLoading, error } = useQuery({
    queryKey: ['admin', 'report', id],
    queryFn: async () => {
      const data = await adminApi.getReportById(id);
      setStatusVal(data.status);
      setSelectedDept(data.assigned_department_id || '');
      setPriorityVal(data.priority || 0);
      setSelectedCategory(data.category);
      return data;
    },
  });

  // Fetch departments list
  const { data: departments = [] } = useQuery({
    queryKey: ['admin', 'departments'],
    queryFn: () => adminApi.getDepartments(),
  });

  // Upload resolution proof mutation
  const resolutionMutation = useMutation({
    mutationFn: async () => {
      if (!resolutionFile) {
        throw new Error('Please select an image file first.');
      }
      const formData = new FormData();
      formData.append('image', resolutionFile);
      if (resolutionNote) {
        formData.append('note', resolutionNote);
      }
      return adminApi.uploadResolutionPhoto(id, formData);
    },
    onSuccess: () => {
      toast.success('Resolution proof photo uploaded!');
      setResolutionFile(null);
      setResolutionPreview(null);
      setResolutionNote('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'report', id] });
    },
    onError: (err) => toast.error(err.message || 'Failed to upload resolution photo'),
  });

  // Mutations
  const statusMutation = useMutation({
    mutationFn: async () => {
      await adminApi.updateStatus(id, {
        status: statusVal,
        note: statusNote,
        isInternal,
        rejectionReason: statusVal === 'rejected' ? rejectionReason || statusNote : undefined,
      });

      // If user uploaded a resolution photo alongside resolving
      if (statusVal === 'resolved' && resolutionFile) {
        const formData = new FormData();
        formData.append('image', resolutionFile);
        if (resolutionNote || statusNote) {
          formData.append('note', resolutionNote || statusNote);
        }
        await adminApi.uploadResolutionPhoto(id, formData);
      }
    },
    onSuccess: () => {
      toast.success('Status updated successfully!');
      setStatusNote('');
      setResolutionFile(null);
      setResolutionPreview(null);
      setResolutionNote('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'report', id] });
    },
    onError: (err) => toast.error(err.message || 'Failed to update status'),
  });

  const assignMutation = useMutation({
    mutationFn: () => adminApi.assignDepartment(id, { departmentId: selectedDept || null }),
    onSuccess: () => {
      toast.success('Department assigned!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'report', id] });
    },
    onError: (err) => toast.error(err.message || 'Failed to assign department'),
  });

  const priorityMutation = useMutation({
    mutationFn: () => adminApi.updatePriority(id, Number(priorityVal)),
    onSuccess: () => {
      toast.success('Priority score updated!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'report', id] });
    },
    onError: (err) => toast.error(err.message || 'Failed to update priority'),
  });

  const categoryMutation = useMutation({
    mutationFn: (cat) => adminApi.updateCategory(id, cat),
    onSuccess: () => {
      toast.success('Category updated & reviewed!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'report', id] });
    },
    onError: (err) => toast.error(err.message || 'Failed to update category'),
  });

  const mergeMutation = useMutation({
    mutationFn: () => adminApi.mergeReport(id, { duplicateOfId: mergeTargetId }),
    onSuccess: () => {
      toast.success('Report consolidated into master report!');
      setShowMergeDialog(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'report', id] });
    },
    onError: (err) => toast.error(err.message || 'Failed to merge report'),
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm text-slate-500">Loading complaint triage file...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-rose-200 rounded-2xl text-center shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Complaint Record Not Found</h2>
        <p className="text-xs text-slate-500 mb-6">{error?.message || 'Report could not be retrieved.'}</p>
        <Link
          to="/admin/reports"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Reports Table
        </Link>
      </div>
    );
  }

  const images = report.images || [];
  const currentImage = images[activeImage] || images[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Navigation breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/reports"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Reports Table
        </Link>
        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
          Complaint #{report.complaint_no}
        </span>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {report.title}
            </h1>
            <CategoryBadge category={report.category} />
            <StatusBadge status={report.status} size="lg" />
            {report.needs_review && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Needs Review
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Filed {report.created_at ? format(new Date(report.created_at), 'MMM d, yyyy · h:mm a') : 'Recently'}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {report.address || `${report.area || ''}, ${report.city || ''}`}
            </span>
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Priority Score: <strong>{report.priority}</strong> (+{report.confirmation_count || 1} upvotes)
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowMergeDialog(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors self-start md:self-auto shrink-0"
        >
          <GitMerge className="w-4 h-4 text-slate-500" />
          Merge as Duplicate
        </button>
      </div>

      {/* Two-Column Grid: Left (Evidence & Map) / Right (Controls & Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (6 cols): Photos, Map, AI Analysis */}
        <div className="lg:col-span-6 space-y-6">
          {/* Resolution Before/After Comparison Card (shown when resolved photo exists) */}
          {report.resolved_image_url && (
            <BeforeAfterCompare
              beforeUrl={currentImage?.url}
              afterUrl={report.resolved_image_url}
              createdAt={report.created_at}
              resolvedAt={report.resolved_at}
              title="Verified Resolution Evidence"
            />
          )}

          {/* Photo Viewer */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Citizen Evidence Photos ({images.length})
            </h3>
            {currentImage ? (
              <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
                <img
                  src={currentImage.url}
                  alt={report.title}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                No images attached
              </div>
            )}

            {images.length > 1 && (
              <div className="flex gap-2 pt-1">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => setActiveImage(idx)}
                    className={`w-16 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImage === idx ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* AI Assessment & Comparison Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                AI Model Analysis vs Citizen Submission
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold uppercase">
                Status: {report.ai_status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Citizen Category</span>
                <span className="font-bold text-slate-900 capitalize">
                  {report.category.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">AI Detected</span>
                <span className="font-bold text-blue-600 capitalize">
                  {report.ai_category ? report.ai_category.replace('_', ' ') : 'N/A'}
                </span>
                {report.ai_confidence && (
                  <span className="text-[11px] text-slate-500 ml-1">
                    ({Math.round(report.ai_confidence * 100)}%)
                  </span>
                )}
              </div>
            </div>

            {report.ai_category && report.ai_category !== report.category && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Category mismatch detected between AI and citizen.</span>
                </div>
                <button
                  type="button"
                  onClick={() => categoryMutation.mutate(report.ai_category)}
                  disabled={categoryMutation.isPending}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-[11px] shrink-0"
                >
                  Accept AI Suggestion
                </button>
              </div>
            )}

            {/* Quick manual category correction */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-600 font-medium">Override Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="pothole">Pothole</option>
                <option value="garbage">Garbage</option>
                <option value="broken_streetlight">Broken Streetlight</option>
                <option value="damaged_road">Damaged Road</option>
                <option value="other">Other</option>
              </select>
              {selectedCategory !== report.category && (
                <button
                  type="button"
                  onClick={() => categoryMutation.mutate(selectedCategory)}
                  disabled={categoryMutation.isPending}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                >
                  Save
                </button>
              )}
            </div>
          </div>

          {/* Interactive Location Pin Map */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600" />
              Geographic Pin ({report.lat}, {report.lng})
            </h3>
            <div className="h-56 rounded-xl overflow-hidden border border-slate-200">
              {report.lat && report.lng ? (
                <MapContainer
                  center={[Number(report.lat), Number(report.lng)]}
                  zoom={15}
                  scrollWheelZoom={false}
                  className="h-full w-full"
                >
                  <TileLayer
                    url={import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
                  />
                  <Marker position={[Number(report.lat), Number(report.lng)]} icon={customPin} />
                </MapContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  Coordinates missing
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (6 cols): Triage Controls, Assignment, Timeline */}
        <div className="lg:col-span-6 space-y-6">
          {/* Citizen Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" />
              Citizen Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Name</span>
                <span className="font-semibold text-slate-900">{report.citizen_name || 'Anonymous Citizen'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Email</span>
                <span className="font-mono text-slate-700 truncate block">{report.citizen_email || '—'}</span>
              </div>
              {report.citizen_phone && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 sm:col-span-2">
                  <span className="text-[10px] text-slate-400 block uppercase">Phone Number</span>
                  <span className="font-mono text-slate-700">{report.citizen_phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Mutation Console */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Update Complaint Status
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Status
                </label>
                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {statusVal === 'rejected' && (
                <div>
                  <label className="block text-xs font-semibold text-rose-700 mb-1">
                    Rejection Reason
                  </label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Private property, not municipal jurisdiction"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-rose-300 focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Remarks / Officer Note
                </label>
                <textarea
                  rows={2}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Official action details or resolution notes..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Resolution Photo Attachment (Shown when resolving or already resolved) */}
              {(statusVal === 'resolved' || report.status === 'resolved') && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-emerald-600" />
                      Resolution Proof Photo (After)
                    </label>
                    {report.resolved_image_url && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Proof On File
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-normal">
                    Upload an on-site photo demonstrating that the hazard has been resolved/repaired.
                  </p>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setResolutionFile(file);
                        setResolutionPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                  />

                  {resolutionPreview && (
                    <div className="relative aspect-video max-h-40 bg-slate-900 rounded-lg overflow-hidden border border-emerald-300">
                      <img
                        src={resolutionPreview}
                        alt="Resolution preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setResolutionFile(null);
                          setResolutionPreview(null);
                        }}
                        className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white text-[10px] px-2 py-0.5 rounded font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {resolutionFile && statusVal === report.status && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => resolutionMutation.mutate()}
                        disabled={resolutionMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                      >
                        {resolutionMutation.isPending ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Uploading Proof...
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            Upload Proof Photo Now
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex items-center gap-1 font-medium">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    Internal note only (hidden from citizen)
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => statusMutation.mutate()}
                  disabled={statusMutation.isPending || (statusVal === report.status && !resolutionFile)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {statusMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Apply Status Change
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Department Assignment & Priority Console */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              Department & Priority Assignment
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Department */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Department</label>
                <div className="flex gap-2">
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="">Unassigned</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => assignMutation.mutate()}
                    disabled={assignMutation.isPending}
                    className="px-3 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    Assign
                  </button>
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Priority Score: {priorityVal}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={priorityVal}
                    onChange={(e) => setPriorityVal(e.target.value)}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => priorityMutation.mutate()}
                    disabled={priorityMutation.isPending}
                    className="px-3 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    Set
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Complete Status Audit Trail with Internal Notes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              Official History & Internal Log
            </h3>
            <Timeline events={report.timeline} />
          </div>
        </div>
      </div>

      {/* Merge Duplicate Dialog */}
      {showMergeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GitMerge className="w-5 h-5 text-blue-600" />
              Consolidate Duplicate Report
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Consolidating this report will mark it as rejected (duplicate) and transfer its citizen confirmation vote and priority boost to the master complaint.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Master Report ID (UUID)
              </label>
              <input
                type="text"
                value={mergeTargetId}
                onChange={(e) => setMergeTargetId(e.target.value.trim())}
                placeholder="Enter master report UUID..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMergeDialog(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => mergeMutation.mutate()}
                disabled={mergeMutation.isPending || !mergeTargetId}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                {mergeMutation.isPending ? 'Merging...' : 'Confirm Merge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
