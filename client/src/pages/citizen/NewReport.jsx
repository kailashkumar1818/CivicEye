import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import reportsApi from '../../api/reports';
import ImageUploader from '../../components/reports/ImageUploader';
import LocationPicker from '../../components/map/LocationPicker';
import AiAnalysisChip from '../../components/reports/AiAnalysisChip';
import DuplicateModal from '../../components/reports/DuplicateModal';
import { extractExifGps } from '../../utils/exif';
import {
  MapPin,
  Loader2,
  Send,
  AlertCircle,
  Trash2,
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

const categories = [
  { id: 'pothole', label: 'Pothole', icon: AlertCircle, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { id: 'garbage', label: 'Garbage Dump', icon: Trash2, color: 'text-green-600 bg-green-50 border-green-200' },
  { id: 'broken_streetlight', label: 'Broken Streetlight', icon: Lightbulb, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { id: 'damaged_road', label: 'Damaged Road', icon: AlertTriangle, color: 'text-red-600 bg-red-50 border-red-200' },
  { id: 'other', label: 'Other Issue', icon: HelpCircle, color: 'text-slate-600 bg-slate-50 border-slate-200' },
];

const reportFormSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
  description: z.string().trim().max(2000).optional(),
  category: z.string().min(1, 'Please select a problem category'),
  lat: z.coerce.number().min(-90).max(90, 'Invalid latitude coordinates'),
  lng: z.coerce.number().min(-180).max(180, 'Invalid longitude coordinates'),
  locationSource: z.enum(['gps', 'exif', 'manual']).default('gps'),
  address: z.string().trim().max(500).optional(),
  area: z.string().trim().max(150).optional(),
  city: z.string().trim().max(100).optional(),
});

export default function NewReport() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'pothole',
      lat: 17.385,
      lng: 78.4867,
      locationSource: 'gps',
      address: '',
      area: '',
      city: 'Metro City',
    },
  });

  const selectedCategory = watch('category');
  const lat = watch('lat');
  const lng = watch('lng');
  const locationSource = watch('locationSource');

  // Trigger AI analysis on uploaded photo
  const analyzePhoto = async (file) => {
    setAnalyzingAi(true);
    try {
      const data = await reportsApi.analyzeImage(file);
      setAiResult(data);

      if (data.category && data.category !== 'other' && (data.confidence || 0) >= 0.4) {
        setValue('category', data.category, { shouldValidate: true });
        toast.success(
          `AI identified "${data.category.replace('_', ' ')}" (${Math.round((data.confidence || 0) * 100)}% confidence)`,
          { icon: '🤖' }
        );
      }
    } catch (err) {
      console.warn('AI analysis failed:', err);
      setAiResult({ ai_status: 'unavailable' });
    } finally {
      setAnalyzingAi(false);
    }
  };

  // Handle image upload, check EXIF GPS, and trigger AI analysis
  const handleFilesChanged = async (newFiles) => {
    setSelectedFiles(newFiles);

    // If new files were added, inspect the first newly added photo for EXIF GPS & AI analysis
    if (newFiles.length > selectedFiles.length) {
      const latestFileItem = newFiles[newFiles.length - 1];
      if (latestFileItem?.file) {
        // 1. EXIF GPS
        try {
          const exifCoords = await extractExifGps(latestFileItem.file);
          if (exifCoords) {
            setValue('lat', exifCoords.lat, { shouldValidate: true });
            setValue('lng', exifCoords.lng, { shouldValidate: true });
            setValue('locationSource', 'exif');
            toast.success(
              `Auto-detected GPS location from photo EXIF data! (${exifCoords.lat}, ${exifCoords.lng})`,
              { icon: '📸' }
            );
          }
        } catch (err) {
          console.warn('EXIF inspection skipped:', err);
        }

        // 2. AI Problem Identification
        analyzePhoto(latestFileItem.file);
      }
    } else if (newFiles.length === 0) {
      setAiResult(null);
    }
  };

  const handleLocationPickerChange = ({ lat: newLat, lng: newLng }) => {
    setValue('lat', newLat, { shouldValidate: true });
    setValue('lng', newLng, { shouldValidate: true });
    if (locationSource !== 'exif') {
      setValue('locationSource', 'manual');
    }
  };

  const handleAddressResolved = (geo) => {
    if (geo.address) setValue('address', geo.address);
    if (geo.city) setValue('city', geo.city);
    if (geo.area) setValue('area', geo.area);
  };

  const executeSubmission = async (data) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      formData.append('category', data.category);
      formData.append('lat', data.lat);
      formData.append('lng', data.lng);
      formData.append('locationSource', data.locationSource || 'gps');
      formData.append('address', data.address || '');
      formData.append('area', data.area || '');
      formData.append('city', data.city || '');

      selectedFiles.forEach((item) => {
        formData.append('images', item.file);
      });

      const response = await reportsApi.createReport(formData);
      const createdReport = response.data || response;

      toast.success(`Complaint filed! Reference: ${createdReport.complaint_no}`);
      navigate(`/reports/${createdReport.id}`, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = async (data) => {
    if (selectedFiles.length === 0) {
      toast.error('Please attach at least one photo of the problem.');
      return;
    }

    setSubmitting(true);
    // Check for nearby duplicates before creating
    try {
      const dups = await reportsApi.checkDuplicates({
        lat: data.lat,
        lng: data.lng,
        category: data.category,
      });

      if (dups && dups.length > 0) {
        setDuplicates(dups);
        setPendingData(data);
        setShowDuplicateModal(true);
        setSubmitting(false);
        return;
      }
    } catch (err) {
      console.warn('Duplicate check non-blocking warning:', err);
    }

    // No duplicates found, proceed directly with submission
    await executeSubmission(data);
  };

  const handleSubmitAnyway = async () => {
    if (!pendingData) return;
    setShowDuplicateModal(false);
    await executeSubmission(pendingData);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Report a Civic Problem</h1>
        <p className="text-sm text-slate-600 mt-1">
          Take a photo, pinpoint the issue on the interactive map, and authorities will track it.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        {/* Step 1: Photos with EXIF auto-detection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-slate-900">
              1. Photos of the Problem <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              EXIF GPS auto-detection enabled
            </span>
          </div>
          <ImageUploader files={selectedFiles} onChange={handleFilesChanged} maxFiles={3} />
          <AiAnalysisChip
            loading={analyzingAi}
            aiResult={aiResult}
            userCategory={selectedCategory}
            onReanalyze={() => selectedFiles[0] && analyzePhoto(selectedFiles[0].file)}
          />
          {selectedFiles.length === 0 && (
            <p className="text-xs text-slate-400">Attach 1 to 3 photos. Coordinates will automatically extract if present.</p>
          )}
        </div>

        {/* Step 2: Category Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-900">
            2. Category <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setValue('category', cat.id, { shouldValidate: true })}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${cat.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-xs font-semibold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
          {errors.category && <p className="text-xs text-rose-600">{errors.category.message}</p>}
        </div>

        {/* Step 3: Interactive Location Picker */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-slate-900">
              3. Problem Location & Map Pin <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              Source: <span className="font-semibold uppercase text-slate-700">{locationSource}</span>
            </span>
          </div>

          <LocationPicker
            lat={lat}
            lng={lng}
            onChange={handleLocationPickerChange}
            onAddressResolved={handleAddressResolved}
          />

          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Street Address / Landmark (Auto-filled by reverse geocoding)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                {...register('address')}
                placeholder="e.g. Near Market Crossroad, Ward 4"
                className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 4: Title & Description */}
        <div className="space-y-4">
          <label className="block text-sm font-bold text-slate-900">
            4. Details & Description <span className="text-rose-500">*</span>
          </label>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Complaint Title</label>
            <input
              type="text"
              {...register('title')}
              placeholder="e.g. Deep hazardous pothole on Main Street"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {errors.title && <p className="text-xs text-rose-600 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Description (Optional)</label>
            <textarea
              rows={3}
              {...register('description')}
              placeholder="Provide extra details such as severity, time noticed, or safety hazard..."
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-md transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting Report...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Complaint
              </>
            )}
          </button>
        </div>
      </form>

      {/* Duplicate Warning Modal */}
      <DuplicateModal
        isOpen={showDuplicateModal}
        duplicates={duplicates}
        onClose={() => setShowDuplicateModal(false)}
        onSubmitAnyway={handleSubmitAnyway}
        submittingAnyway={submitting}
      />
    </div>
  );
}
