import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { 
  FaSearch, 
  FaFilter, 
  FaPlus, 
  FaTrashAlt, 
  FaEdit, 
  FaCompass, 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaChevronLeft, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaInfoCircle, 
  FaArrowRight, 
  FaBox, 
  FaImage, 
  FaTag, 
  FaHashtag, 
  FaFileUpload, 
  FaArrowLeft, 
  FaStickyNote,
  FaTools
} from "react-icons/fa";
import { apiRequest } from "../api.js";

const CONDITIONS = ["WORKING", "DAMAGED", "DEAD"];
const DEVICE_TYPES = ["Laptop", "Mobile", "Tablet", "Desktop", "Monitor", "Printer", "Battery", "Other"];
const STATUS_LABELS = {
  SUBMITTED: "Submitted",
  PENDING: "Pending Approval",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  SCHEDULED: "Pickup Scheduled",
  PICKUP_SCHEDULED: "Pickup Scheduled",
  PICKED_UP: "Picked Up"
};
const STATUS_DETAILS = {
  SUBMITTED: "Your request has been submitted and is waiting for admin approval.",
  PENDING: "Your request is waiting for admin approval.",
  ACCEPTED: "Your request has been accepted and will be scheduled soon.",
  REJECTED: "Unfortunately, your request was rejected by the admin.",
  SCHEDULED: "Pickup date and time have been scheduled.",
  PICKUP_SCHEDULED: "Pickup date and time have been scheduled.",
  PICKED_UP: "Your e-waste has been successfully collected."
};
const FORM_STEPS = [
  { id: 1, title: "Device", hint: "Item details" },
  { id: 2, title: "Pickup", hint: "Location & Notes" },
  { id: 3, title: "Confirm", hint: "Submit request" }
];

const MAP_PIN_ICON = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapCenterUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    map.setView([center.lat, center.lon], map.getZoom());
  }, [center, map]);
  return null;
}

function MapClickSetter({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    }
  });
  return null;
}

export default function Requests({ mode = "all" }) {
  const navigate = useNavigate();
  const inputStyle = {
  padding: "14px",
  borderRadius: "12px",
  border: "2px solid var(--border)",
  background: "var(--surface)",
  color: "var(--ink-1)",
  fontSize: "15px",
  width: "100%"
  };
  const isSubmitOnly = mode === "submit";

  const [form, setForm] = useState({
    deviceType: "Laptop",
    customDeviceType: "",
    brand: "",
    model: "",
    condition: "WORKING",
    quantity: 1,
    pickupAddress: "",
    additionalRemarks: ""
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [requests, setRequests] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [locationInfo, setLocationInfo] = useState("");
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapSearchLoading, setMapSearchLoading] = useState(false);
  const [mapSearchError, setMapSearchError] = useState("");
  const [mapResults, setMapResults] = useState([]);
  const [selectedMapResult, setSelectedMapResult] = useState({ lat: 20.5937, lon: 78.9629, displayName: "Default Location (India)" }); 
  const [mapPinLoading, setMapPinLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState("");
  const [editingRequest, setEditingRequest] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    deviceType: "Laptop",
    customDeviceType: "",
    brand: "",
    model: "",
    condition: "WORKING",
    quantity: 1,
    pickupAddress: "",
    additionalRemarks: ""
  });
  const [updateImageFile, setUpdateImageFile] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [requestImages, setRequestImages] = useState({});

  useEffect(() => {
    if (!isSubmitOnly) {
      fetchMyRequests();
    }
  }, [isSubmitOnly]);

  useEffect(() => {
    if (isSubmitOnly) return;
    const intervalId = setInterval(() => {
      fetchMyRequests({ background: true });
    }, 15000);
    return () => clearInterval(intervalId);
  }, [isSubmitOnly]);

  useEffect(() => {
    if (requests.length === 0) return;
    let isActive = true;
    const token = localStorage.getItem("token");

    const fetchImages = async () => {
      const updates = {};
      await Promise.all(
        requests.map(async (request) => {
          if (!request?.id || requestImages[request.id]) return;
          try {
            const imagePayload = await apiRequest(`/requests/${request.id}/image-data`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (imagePayload?.base64Data) {
              const contentType = imagePayload.contentType || "image/jpeg";
              updates[request.id] = `data:${contentType};base64,${imagePayload.base64Data}`;
            }
          } catch { }
        })
      );
      if (isActive && Object.keys(updates).length > 0) {
        setRequestImages((prev) => ({ ...prev, ...updates }));
      }
    };

    fetchImages();
    return () => { isActive = false; };
  }, [requests, requestImages]);

  const fetchMyRequests = async ({ background = false } = {}) => {
    const token = localStorage.getItem("token");
    if (!background) setListLoading(true);
    setError("");
    try {
      const data = await apiRequest("/requests/mine", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!background) setListLoading(false);
    }
  };

  const statusClassName = (status) => {
    switch (status) {
      case "PENDING":
      case "SUBMITTED": return "status-badge status-pending";
      case "ACCEPTED": return "status-badge status-accepted";
      case "REJECTED": return "status-badge status-rejected";
      case "PICKED_UP": return "status-badge status-picked";
      case "PICKUP_SCHEDULED":
      case "SCHEDULED": return "status-badge status-scheduled";
      default: return "status-badge status-other";
    }
  };

  const openUpdateModal = (request) => {
    setUpdateError("");
    setUpdateImageFile(null);
    const knownDeviceType = DEVICE_TYPES.includes(request.deviceType) ? request.deviceType : "Other";
    setUpdateForm({
      deviceType: knownDeviceType,
      customDeviceType: knownDeviceType === "Other" ? request.deviceType || "" : "",
      brand: request.brand || "",
      model: request.model || "",
      condition: request.condition || "WORKING",
      quantity: request.quantity || 1,
      pickupAddress: request.pickupAddress || "",
      additionalRemarks: request.additionalRemarks || ""
    });
    setEditingRequest(request);
  };

  const closeUpdateModal = () => {
    setEditingRequest(null);
    setUpdateError("");
    setUpdateImageFile(null);
  };

  const handleUpdateChange = (event) => {
    const { name, value } = event.target;
    if (name === "quantity") {
      setUpdateForm((prev) => ({ ...prev, quantity: Number(value) }));
      return;
    }
    setUpdateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateSubmit = async (event) => {
    event.preventDefault();
    if (!editingRequest) return;
    setUpdateError("");
    setUpdateLoading(true);
    const token = localStorage.getItem("token");
    const payload = new FormData();
    const finalDeviceType = updateForm.deviceType === "Other" ? updateForm.customDeviceType.trim() : updateForm.deviceType.trim();

    payload.append("deviceType", finalDeviceType);
    payload.append("brand", updateForm.brand.trim());
    payload.append("model", updateForm.model.trim());
    payload.append("condition", updateForm.condition);
    payload.append("quantity", String(updateForm.quantity));
    payload.append("pickupAddress", updateForm.pickupAddress.trim());
    if (updateForm.additionalRemarks.trim()) payload.append("additionalRemarks", updateForm.additionalRemarks.trim());
    if (updateImageFile) payload.append("image", updateImageFile);

    try {
      const updated = await apiRequest(`/requests/${editingRequest.id}/update`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: payload
      });
      setRequests((prev) => prev.map((request) => (request.id === updated.id ? updated : request)));
      closeUpdateModal();
    } catch (err) {
      setUpdateError(err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return requests.filter((request) => {
      if (statusFilter !== "ALL" && request.status !== statusFilter) return false;
      if (!normalizedQuery) return true;
      const searchable = [request.id, request.brand, request.model, request.deviceType, request.condition, STATUS_LABELS[request.status]]
        .filter(Boolean).join(" ").toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [requests, searchQuery, statusFilter]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setStepError("");
    if (name === "quantity") {
      setForm((prev) => ({ ...prev, quantity: Number(value) }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeleteRequest = async (requestId) => {
    const token = localStorage.getItem("token");
    setDeletingId(requestId);
    setError("");
    try {
      await apiRequest(`/requests/${requestId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests((prev) => prev.filter((request) => request.id !== requestId));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleFetchLiveLocation = async () => {
    setLocationError("");
    setLocationInfo("");
    if (!navigator.geolocation) { setLocationError("Geolocation not supported."); return; }
    setLocationLoading(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });
      const { latitude, longitude } = position.coords;
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`, {
        headers: { "User-Agent": "EcoCycle-EWasteManagement/1.0" }
      });
      const data = await response.json();
      const address = data?.display_name || `Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}`;
      setForm((prev) => ({ ...prev, pickupAddress: address }));
      setLocationInfo("Location fetched successfully.");
    } catch (geoError) {
      setLocationError("Unable to fetch location.");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleOpenMapPicker = () => {
    setMapPickerOpen(true);
    setMapSearchQuery(editingRequest ? updateForm.pickupAddress : form.pickupAddress || "");
    if (!(editingRequest ? updateForm.pickupAddress : form.pickupAddress)) {
      setMapResults([]);
    }
  };

  const handleSearchMapLocations = async (event) => {
    if (event) event.preventDefault();
    const query = mapSearchQuery.trim();
    if (!query) return;
    setMapSearchLoading(true);
    setMapSearchError("");
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=5`, {
        headers: { "User-Agent": "EcoCycle-EWasteManagement/1.0" }
      });
      const data = await response.json();
      if (data && data.length > 0) {
        const results = data.map(r => ({ id: r.place_id, displayName: r.display_name, lat: Number(r.lat), lon: Number(r.lon) }));
        setMapResults(results);
        setSelectedMapResult(results[0]);
      } else {
        setMapSearchError("No locations found.");
      }
    } catch { 
      setMapSearchError("Location search failed. Please try again."); 
    } finally { 
      setMapSearchLoading(false); 
    }
  };

  const setMapPointAndResolveAddress = async (lat, lon) => {
    setMapPinLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`, {
        headers: { "User-Agent": "EcoCycle-EWasteManagement/1.0" }
      });
      const data = await response.json();
      setSelectedMapResult({ id: Date.now(), lat, lon, displayName: data?.display_name || `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}` });
    } catch { 
      setSelectedMapResult(prev => ({ ...prev, lat, lon, displayName: `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}` }));
    } finally { 
      setMapPinLoading(false); 
    }
  };

  const handleUseMapLocation = () => {
    if (!selectedMapResult) return;
    const address = selectedMapResult.displayName || "Selected Location";
    if (editingRequest) {
      setUpdateForm((prev) => ({ ...prev, pickupAddress: address }));
    } else {
      setForm((prev) => ({ ...prev, pickupAddress: address }));
    }
    setMapPickerOpen(false);
  };

  const validateStepData = (stepId) => {
    if (stepId === 1) {
      if (!form.brand.trim()) return "Brand is required.";
      if (!form.model.trim()) return "Model is required.";
      if (form.deviceType === "Other" && !form.customDeviceType.trim()) return "Please specify the device type.";
    } else if (stepId === 2) {
      if (!form.pickupAddress.trim()) return "Pickup address is required.";
    }
    return "";
  };

  const handleNextStep = () => {
    setError("");
    const errorMsg = validateStepData(currentStep);
    if (errorMsg) {
      setStepError(errorMsg);
      return;
    }
    setStepError("");
    setCurrentStep(prev => prev + 1);
  };

  const handlePreviousStep = () => {
    setError("");
    setStepError("");
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (imageFiles.length === 0) {
  setStepError("At least one proof image is required.");
  return;
}
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      setError("Please login again.");
      navigate("/login");
      return;
    }
    const payload = new FormData();
    const finalDeviceType = form.deviceType === "Other" ? form.customDeviceType.trim() : form.deviceType.trim();
    payload.append("deviceType", finalDeviceType);
    payload.append("brand", form.brand.trim());
    payload.append("model", form.model.trim());
    payload.append("condition", form.condition);
    payload.append("quantity", String(form.quantity));
    payload.append("pickupAddress", form.pickupAddress.trim());
    if (form.additionalRemarks.trim()) payload.append("additionalRemarks", form.additionalRemarks.trim());
    imageFiles.forEach((file) => {
  payload.append("images", file);
});

    try {
      await apiRequest("/requests", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: payload });
      navigate("/requests/view");
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="page-shell" style={{ display: 'block', padding: '40px 24px', minHeight: '100vh' }}>
      
      {/* Header Section */}
      <header style={{ 
        maxWidth: '1120px', 
        margin: '0 auto 48px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        <div>
          <div className="pin-pill" style={{ background: 'rgba(14, 165, 164, 0.2)', color: 'var(--accent-1)', fontWeight: '700' }}>Request Center</div>
          <h1 className="page-title" style={{ fontSize: '42px', margin: '8px 0', fontWeight: '800', color: 'var(--ink-1)' }}>Disposal Portal</h1>
          <p className="page-subtitle" style={{ fontSize: '16px', color: 'var(--ink-2)' }}>Monitor and submit your electronic waste recycling requests</p>
        </div>
        <div style={{ display: 'flex', gap: '14px' }}>
          {!isSubmitOnly && (
            <Link to="/requests/submit" className="btn pin-btn-primary" style={{ padding: '14px 28px', fontSize: '15px' }}>
              <FaPlus style={{ marginRight: '10px' }} /> New Request
            </Link>
          )}
          <button className="btn pin-btn-ghost" onClick={() => navigate("/dashboard")} style={{ padding: '14px 28px', fontSize: '15px' }}>
            <FaChevronLeft style={{ marginRight: '10px' }} /> Dashboard
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1120px', margin: '0 auto' }}>
        
        {/* SUBMIT MODE: Multi-step Wizard */}
        {isSubmitOnly && (
           <section className="content-card" style={{ padding: '48px', maxWidth: '800px', margin: '0 auto', background: 'var(--surface)', borderRadius: '32px', boxShadow: 'var(--shadow)' }}>
             <h2 style={{ fontSize: '32px', marginBottom: '40px', textAlign: 'center', fontFamily: 'Space Grotesk, sans-serif', color: 'var(--ink-1)', fontWeight: '800' }}>Submit Pickup Request</h2>
             
             <div className="request-stepper" style={{ display: 'flex', justifyContent: 'center', marginBottom: '60px' }}>
                {FORM_STEPS.map((s, i) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center', opacity: currentStep >= s.id ? 1 : 0.3 }}>
                      <div className="request-step-badge" style={{ 
                        margin: '0 auto 12px', 
                        width: '50px',
                        height: '50px',
                        fontSize: '20px',
                        fontWeight: '800',
                        background: currentStep >= s.id ? 'var(--accent-1)' : 'var(--border)', 
                        color: 'white',
                        boxShadow: currentStep === s.id ? '0 0 0 6px rgba(14, 165, 164, 0.15)' : 'none'
                      }}>{s.id}</div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--ink-1)' }}>{s.title}</div>
                    </div>
                    {i < FORM_STEPS.length - 1 && (
                      <div style={{ width: '80px', height: '3px', background: currentStep > s.id ? 'var(--accent-1)' : 'var(--border)', margin: '0 15px', marginTop: '-25px' }} />
                    )}
                  </div>
                ))}
             </div>
             
             <div style={{ minHeight: '350px' }}>
                {stepError && <div className="form-error" style={{ marginBottom: '32px', padding: '16px', borderRadius: '14px' }}>{stepError}</div>}
                {error && <div className="form-error" style={{ marginBottom: '32px', padding: '16px', borderRadius: '14px' }}>{error}</div>}
                
                {currentStep === 1 && (
                  <div className="form-grid" style={{ display: 'grid', gap: '28px' }}>
                    <div className="input-group">
                      <label style={{ color: 'var(--ink-1)', fontWeight: '700', fontSize: '14px' }}><FaBox style={{ marginRight: '10px' }} /> DEVICE TYPE</label>
                      <select name="deviceType" value={form.deviceType} onChange={handleChange} style={{ color: 'var(--ink-1)', padding: '16px', borderRadius: '14px', border: '2px solid var(--border)', background: 'rgba(148, 163, 184, 0.05)', fontSize: '16px' }}>
                        {DEVICE_TYPES.map(t => <option key={t} value={t} style={{ background: 'var(--surface)', color: 'var(--ink-1)' }}>{t}</option>)}
                      </select>
                    </div>
                    {form.deviceType === "Other" && (
                      <div className="input-group">
                        <label style={{ color: 'var(--ink-1)', fontWeight: '700', fontSize: '14px' }}>SPECIFY TYPE</label>
                        <input name="customDeviceType" value={form.customDeviceType} onChange={handleChange} placeholder="What device is it?" style={{ color: 'var(--ink-1)', padding: '16px', borderRadius: '14px', border: '2px solid var(--border)', background: 'rgba(148, 163, 184, 0.05)', fontSize: '16px' }} />
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      <div className="input-group">
                        <label style={{ color: 'var(--ink-1)', fontWeight: '700', fontSize: '14px' }}>BRAND</label>
                        <input name="brand" value={form.brand} onChange={handleChange} placeholder="e.g. Dell" style={{ color: 'var(--ink-1)', padding: '16px', borderRadius: '14px', border: '2px solid var(--border)', background: 'rgba(148, 163, 184, 0.05)', fontSize: '16px' }} />
                      </div>
                      <div className="input-group">
                        <label style={{ color: 'var(--ink-1)', fontWeight: '700', fontSize: '14px' }}>MODEL</label>
                        <input name="model" value={form.model} onChange={handleChange} placeholder="e.g. Inspiron 15" style={{ color: 'var(--ink-1)', padding: '16px', borderRadius: '14px', border: '2px solid var(--border)', background: 'rgba(148, 163, 184, 0.05)', fontSize: '16px' }} />
                      </div>
                    </div>
                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="btn pin-btn-primary" style={{ padding: '18px 40px', fontSize: '16px' }} onClick={handleNextStep}>
                        Continue to Pickup <FaArrowRight style={{ marginLeft: '10px' }} />
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="form-grid" style={{ display: 'grid', gap: '28px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      <div className="input-group">
                        <label style={{ color: 'var(--ink-1)', fontWeight: '700', fontSize: '14px' }}><FaTag style={{ marginRight: '10px' }} /> CONDITION</label>
                        <select name="condition" value={form.condition} onChange={handleChange} style={{ color: 'var(--ink-1)', padding: '16px', borderRadius: '14px', border: '2px solid var(--border)', background: 'rgba(148, 163, 184, 0.05)', fontSize: '16px' }}>
                          {CONDITIONS.map(c => <option key={c} value={c} style={{ background: 'var(--surface)', color: 'var(--ink-1)' }}>{c}</option>)}
                        </select>
                      </div>
                      <div className="input-group">
                        <label style={{ color: 'var(--ink-1)', fontWeight: '700', fontSize: '14px' }}><FaHashtag style={{ marginRight: '10px' }} /> QUANTITY</label>
                        <input type="number" min="1" name="quantity" value={form.quantity} onChange={handleChange} style={{ color: 'var(--ink-1)', padding: '16px', borderRadius: '14px', border: '2px solid var(--border)', background: 'rgba(148, 163, 184, 0.05)', fontSize: '16px' }} />
                      </div>
                    </div>
                    <div className="input-group">
                      <label style={{ color: 'var(--ink-1)', fontWeight: '700', fontSize: '14px' }}><FaMapMarkerAlt style={{ marginRight: '10px' }} /> PICKUP ADDRESS</label>
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                        <button className="btn" type="button" onClick={handleFetchLiveLocation} disabled={locationLoading} style={{ flex: 1, background: 'rgba(148, 163, 184, 0.1)', border: 'none', color: 'var(--ink-2)', fontSize: '13px', fontWeight: '700', padding: '12px' }}>
                          <FaCompass style={{ marginRight: '8px' }} /> {locationLoading ? "Fetching..." : "Use Live Location"}
                        </button>
                        <button className="btn" type="button" onClick={handleOpenMapPicker} style={{ flex: 1, background: 'rgba(148, 163, 184, 0.1)', border: 'none', color: 'var(--ink-2)', fontSize: '13px', fontWeight: '700', padding: '12px' }}>
                          <FaMapMarkerAlt style={{ marginRight: '8px' }} /> Select on Map
                        </button>
                      </div>
                      <textarea name="pickupAddress" value={form.pickupAddress} onChange={handleChange} placeholder="Where should we pick up?" style={{ color: 'var(--ink-1)', padding: '16px', borderRadius: '14px', border: '2px solid var(--border)', background: 'rgba(148, 163, 184, 0.05)', fontSize: '16px', minHeight: '100px' }} />
                      {locationInfo && <small style={{ color: '#10b981', fontWeight: '600', marginTop: '4px' }}>{locationInfo}</small>}
                      {locationError && <small style={{ color: '#dc2626', fontWeight: '600', marginTop: '4px' }}>{locationError}</small>}
                    </div>
                    <div className="input-group">
                      <label style={{ color: 'var(--ink-1)', fontWeight: '700', fontSize: '14px' }}><FaStickyNote style={{ marginRight: '10px' }} /> ADDITIONAL REMARKS (OPTIONAL)</label>
                      <textarea name="additionalRemarks" value={form.additionalRemarks} onChange={handleChange} placeholder="Any notes for the pickup team?" style={{ color: 'var(--ink-1)', padding: '16px', borderRadius: '14px', border: '2px solid var(--border)', background: 'rgba(148, 163, 184, 0.05)', fontSize: '16px', minHeight: '80px' }} />
                    </div>
                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
                      <button className="btn" style={{ background: 'rgba(148, 163, 184, 0.1)', color: 'var(--ink-2)', padding: '18px 40px', fontSize: '16px', fontWeight: '700', borderRadius: '14px' }} onClick={handlePreviousStep}>
                        <FaArrowLeft style={{ marginRight: '10px' }} /> Back
                      </button>
                      <button className="btn pin-btn-primary" style={{ padding: '18px 40px', fontSize: '16px' }} onClick={handleNextStep}>
                        Continue to Review <FaArrowRight style={{ marginLeft: '10px' }} />
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="form-grid" style={{ display: 'grid', gap: '28px' }}>
                    <div style={{ background: 'rgba(148, 163, 184, 0.05)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                      <h3 style={{ fontSize: '18px', color: 'var(--ink-1)', marginBottom: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}><FaInfoCircle color="var(--accent-1)" /> Request Summary</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--ink-2)' }}>DEVICE</div>
                          <div style={{ fontSize: '15px', color: 'var(--ink-1)', fontWeight: '600' }}>{form.deviceType === "Other" ? form.customDeviceType : form.deviceType}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--ink-2)' }}>BRAND / MODEL</div>
                          <div style={{ fontSize: '15px', color: 'var(--ink-1)', fontWeight: '600' }}>{form.brand} {form.model}</div>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--ink-2)' }}>PICKUP ADDRESS</div>
                          <div style={{ fontSize: '15px', color: 'var(--ink-1)', fontWeight: '600' }}>{form.pickupAddress}</div>
                        </div>
                      </div>
                    </div>

                    <div className="input-group">
  <label style={{ color: 'var(--ink-1)', fontWeight: '700', fontSize: '14px' }}>
    <FaFileUpload style={{ marginRight: '10px' }} /> PROOF IMAGE (REQUIRED)
  </label>

  <div
    style={{
      border: '2px dashed var(--border)',
      borderRadius: '14px',
      padding: '32px',
      textAlign: 'center',
      background: imageFiles.length > 0 ? 'rgba(16,185,129,0.05)' : 'rgba(148,163,184,0.05)',
      cursor: 'pointer'
    }}
    onClick={() => document.getElementById('image-input').click()}
  >
    <input
      id="image-input"
      type="file"
      accept="image/*"
      multiple
      style={{ display: 'none' }}
      onChange={(e) => setImageFiles(Array.from(e.target.files))}
    />

    {imageFiles.length > 0 ? (
      <div style={{ color: '#10b981', fontWeight: '700' }}>
        <FaCheckCircle size={24} style={{ marginBottom: '8px' }} /><br/>
        {imageFiles.length} file(s) selected
      </div>
    ) : (
      <div style={{ color: 'var(--ink-2)' }}>
        <FaImage size={32} style={{ marginBottom: '12px', opacity: 0.5 }} /><br/>
        Click to upload device photo(s)
      </div>
    )}
  </div>
</div>

                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
                      <button className="btn" style={{ background: 'rgba(148, 163, 184, 0.1)', color: 'var(--ink-2)', padding: '18px 40px', fontSize: '16px', fontWeight: '700', borderRadius: '14px' }} onClick={handlePreviousStep} disabled={loading}>
                        <FaArrowLeft style={{ marginRight: '10px' }} /> Back
                      </button>
                      <button className="btn pin-btn-primary" style={{ padding: '18px 40px', fontSize: '16px' }} onClick={handleSubmit} disabled={loading}>
                        {loading ? "Submitting..." : "Confirm & Submit"} <FaCheckCircle style={{ marginLeft: '10px' }} />
                      </button>
                    </div>
                  </div>
                )}
             </div>
           </section>
        )}

        {/* VIEW MODE Logic ... */}
        {!isSubmitOnly && (
          <div style={{ display: 'grid', gap: '40px' }}>
            
            {/* Filter Toolbar */}
            <section className="content-card" style={{ padding: '32px', background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-soft)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'flex-end' }}>
                <div className="input-group" style={{ flex: '3 1 400px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '700', color: 'var(--ink-1)', marginBottom: '10px' }}>
                    <FaSearch size={14} color="var(--accent-1)" /> SEARCH YOUR REQUESTS
                  </label>
                  <input 
                    placeholder="Search by Brand, Model, ID or Status..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ background: 'rgba(148, 163, 184, 0.05)', padding: '16px 20px', color: 'var(--ink-1)', border: '2px solid var(--border)', borderRadius: '14px', fontSize: '15px', width: '100%' }}
                  />
                </div>
                <div className="input-group" style={{ flex: '1 1 250px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '700', color: 'var(--ink-1)', marginBottom: '10px' }}>
                    <FaFilter size={14} color="var(--accent-1)" /> FILTER BY STATUS
                  </label>
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)} 
                    style={{ background: 'rgba(148, 163, 184, 0.05)', padding: '16px', color: 'var(--ink-1)', border: '2px solid var(--border)', borderRadius: '14px', fontSize: '15px', width: '100%', appearance: 'auto' }}
                  >
                    <option value="ALL">All Statuses</option>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k} style={{ background: 'var(--surface)', color: 'var(--ink-1)' }}>{v}</option>)}
                  </select>
                </div>
                <button 
                  className="btn" 
                  style={{ height: '56px', padding: '0 32px', background: 'rgba(148, 163, 184, 0.1)', border: 'none', color: 'var(--ink-2)', fontWeight: '700', borderRadius: '14px' }}
                  onClick={() => { setSearchQuery(""); setStatusFilter("ALL"); }}
                  disabled={!searchQuery && statusFilter === "ALL"}
                >
                  Reset Filters
                </button>
              </div>
              <div style={{ marginTop: '24px', fontSize: '15px', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(14, 165, 164, 0.05)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <FaInfoCircle color="var(--accent-1)" />
                <span>Showing <strong>{filteredRequests.length}</strong> of {requests.length} results matching your search criteria.</span>
              </div>
            </section>

            {/* Request List Cards */}
            {listLoading ? (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <div className="loading" style={{ fontSize: '20px', fontWeight: '600', color: 'var(--ink-1)' }}>Loading your records...</div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="content-card" style={{ textAlign: 'center', padding: '100px 20px', background: 'var(--surface)' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(148, 163, 184, 0.1)', display: 'grid', placeItems: 'center', margin: '0 auto 32px' }}>
                  <FaBox size={40} color="var(--ink-2)" style={{ opacity: 0.5 }} />
                </div>
                <h3 style={{ fontSize: '26px', marginBottom: '16px', color: 'var(--ink-1)', fontWeight: '800' }}>No Requests Found</h3>
                <p style={{ color: 'var(--ink-2)', maxWidth: '450px', margin: '0 auto 40px', fontSize: '16px', lineHeight: '1.6' }}>We couldn't find any disposal requests matching your current filters.</p>
                <Link to="/requests/submit" className="btn pin-btn-primary" style={{ padding: '16px 40px' }}>Create Your First Pickup</Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '28px' }}>
                {filteredRequests.map((req) => (
                  <article key={req.id} style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    background: 'var(--surface)', 
                    borderRadius: '28px', 
                    border: '2px solid var(--border)',
                    boxShadow: 'var(--shadow-soft)',
                    overflow: 'hidden',
                    transition: 'transform 0.2s ease'
                  }}>
                    <div style={{ flex: '0 0 260px', padding: '40px', borderRight: '1px solid var(--border)', background: 'rgba(148, 163, 184, 0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '140px', height: '140px', borderRadius: '24px', background: 'var(--surface)', marginBottom: '24px', overflow: 'hidden', display: 'grid', placeItems: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.06)', border: '1px solid var(--border)' }}>
                        {requestImages[req.id] ? <img src={requestImages[req.id]} alt="Device" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FaImage size={48} color="var(--ink-2)" style={{ opacity: 0.5 }} />}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-1)', letterSpacing: '1.5px', marginBottom: '8px' }}>{req.deviceType}</div>
                      <h3 style={{ fontSize: '22px', textAlign: 'center', margin: 0, fontFamily: 'Space Grotesk, sans-serif', color: 'var(--ink-1)', fontWeight: '800' }}>{req.brand} {req.model}</h3>
                    </div>
                    <div style={{ flex: '1 1 350px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--ink-2)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '1px' }}>
                          <FaMapMarkerAlt color="var(--accent-1)" /> PICKUP LOCATION
                        </div>
                        <p style={{ fontSize: '16px', color: 'var(--ink-1)', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>{req.pickupAddress || "Not provided"}</p>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--ink-2)', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '1px' }}>
                            <FaTag color="var(--accent-1)" /> CONDITIONS
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <span style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(148, 163, 184, 0.1)', fontWeight: '800', color: 'var(--ink-1)', border: '1px solid var(--border)' }}>{req.condition}</span>
                            <span style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(148, 163, 184, 0.1)', fontWeight: '800', color: 'var(--ink-1)', border: '1px solid var(--border)' }}>Qty: {req.quantity}</span>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--ink-2)', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '1px' }}>
                            <FaCalendarAlt color="var(--accent-1)" /> CREATED ON
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--ink-1)' }}>{new Date(req.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ flex: '0 0 300px', padding: '40px', background: 'rgba(148, 163, 184, 0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderLeft: '1px solid var(--border)' }}>
                      <div className={statusClassName(req.status)} style={{ padding: '10px 24px', borderRadius: '99px', fontSize: '13px', fontWeight: '900', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>{STATUS_LABELS[req.status]}</div>
                      <p style={{ fontSize: '14px', color: '#475569', textAlign: 'center', marginBottom: '32px', lineHeight: '1.6', fontWeight: '500' }}>{STATUS_DETAILS[req.status]}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
                        <button className="btn" style={{ background: 'var(--surface)', border: '2px solid var(--border)', color: 'var(--ink-1)', fontWeight: '700', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => navigate(`/requests/track/${req.id}`)}><FaCompass size={16} color="var(--accent-1)" /> Track</button>
                        {(req.status === "PENDING" || req.status === "SUBMITTED") && <button className="btn" style={{ background: 'var(--surface)', border: '2px solid var(--border)', color: 'var(--ink-1)', fontWeight: '700', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => openUpdateModal(req)}><FaEdit size={16} color="var(--accent-1)" /> Edit</button>}
                        <button className="btn" style={{ gridColumn: 'span 2', background: 'var(--surface)', border: '2px solid rgba(239, 68, 68, 0.3)', color: '#dc2626', fontWeight: '700', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={() => setPendingDeleteId(req.id)}><FaTrashAlt size={16} /> Delete Request</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Confirmation Modals ... (Rest of the previous logic) */}
      {mapPickerOpen && (
        <div className="popup-overlay" style={{ zIndex: 2000 }}>
          <div className="popup-box map-picker-popup-box" style={{ width: 'min(800px, 94vw)', background: 'var(--surface)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '24px', color: 'var(--ink-1)', fontWeight: '800', marginBottom: '8px' }}>Select Location</h2>
            <p style={{ color: 'var(--ink-2)', fontSize: '14px', marginBottom: '24px' }}>Search or click on the map to set your pickup address.</p>
            <form onSubmit={handleSearchMapLocations} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <input value={mapSearchQuery} onChange={(e) => setMapSearchQuery(e.target.value)} placeholder="Search for area..." style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(148, 163, 184, 0.05)', color: 'var(--ink-1)' }} />
              <button className="btn pin-btn-primary" type="submit" disabled={mapSearchLoading}>{mapSearchLoading ? "Searching..." : "Search"}</button>
            </form>
            {mapSearchError && <div className="form-error" style={{ marginBottom: '16px' }}>{mapSearchError}</div>}
            {selectedMapResult && (
              <div style={{ height: '300px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: '20px' }}>
                <MapContainer center={[selectedMapResult.lat, selectedMapResult.lon]} zoom={16} style={{ height: '100%', width: '100%' }}>
                  <MapCenterUpdater center={selectedMapResult} />
                  <MapClickSetter onPick={setMapPointAndResolveAddress} />
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[selectedMapResult.lat, selectedMapResult.lon]} icon={MAP_PIN_ICON} />
                </MapContainer>
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setMapPickerOpen(false)} style={{ background: 'rgba(148, 163, 184, 0.1)', color: 'var(--ink-2)', fontWeight: '700', padding: '12px 24px', borderRadius: '10px', border: 'none' }}>Cancel</button>
              <button className="btn pin-btn-primary" onClick={handleUseMapLocation}>Set Address</button>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteId !== null && (
        <div className="popup-overlay" style={{ zIndex: 1000 }}>
          <div className="popup-box" style={{ maxWidth: '450px', background: 'var(--surface)', padding: '48px', borderRadius: '32px', border: '1px solid var(--border)' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', display: 'grid', placeItems: 'center', margin: '0 auto 24px' }}>
              <FaExclamationTriangle size={40} />
            </div>
            <h2 style={{ fontSize: '26px', color: 'var(--ink-1)', fontWeight: '800' }}>Confirm Deletion</h2>
            <p style={{ color: 'var(--ink-2)', marginBottom: '40px', fontSize: '16px', lineHeight: '1.6' }}>This will permanently remove your disposal request from our system. This action cannot be reversed.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <button className="btn" onClick={() => setPendingDeleteId(null)} style={{ background: 'rgba(148, 163, 184, 0.1)', color: 'var(--ink-2)', fontWeight: '700', padding: '16px', borderRadius: '14px' }}>Cancel</button>
              <button className="btn" style={{ background: '#dc2626', color: '#fff', fontWeight: '700', padding: '16px', borderRadius: '14px' }} onClick={() => { handleDeleteRequest(pendingDeleteId); setPendingDeleteId(null); }}>Delete Now</button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="popup-overlay" style={{ zIndex: 1000 }}>
          <div className="popup-box" style={{ padding: '56px', maxWidth: '480px', background: 'var(--surface)', borderRadius: '32px', border: '1px solid var(--border)' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'grid', placeItems: 'center', margin: '0 auto 24px' }}>
              <FaCheckCircle size={40} />
            </div>
            <h2 style={{ fontSize: '28px', marginBottom: '16px', color: 'var(--ink-1)', fontWeight: '800' }}>Success!</h2>
            <p style={{ color: 'var(--ink-2)', marginBottom: '40px', fontSize: '16px', lineHeight: '1.6' }}>Your e-waste disposal request has been submitted successfully. You can now track its progress.</p>
            <button className="btn pin-btn-primary" style={{ width: '100%', padding: '18px', fontSize: '16px' }} onClick={() => { setShowSuccess(false); navigate("/requests/view"); }}>Go to My Requests</button>
          </div>
        </div>
      )}

    </div>
  );
}
