import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../api.js";

const STATUS_STEPS = ["SUBMITTED", "PICKUP_SCHEDULED", "PICKED_UP", "RECYCLED"];
const STATUS_LABELS = {
  SUBMITTED: "Submitted",
  PICKUP_SCHEDULED: "Pickup Scheduled",
  PICKED_UP: "Picked Up",
  RECYCLED: "Recycled",
  REJECTED: "Rejected",
  OTHER: "Other"
};
const STEP_DETAILS = {
  SUBMITTED: "Your request has been created.",
  PICKUP_SCHEDULED: "Pickup partner has been assigned.",
  PICKED_UP: "Device has been collected from your address.",
  RECYCLED: "Recycling process is completed.",
  REJECTED: "Request could not be processed.",
  OTHER: "Status updated with a custom value."
};

export default function RequestTracking() {
  const { id } = useParams();
  const [requestData, setRequestData] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const summary = await apiRequest(`/requests/${id}`, { headers });
        setRequestData(summary);

        try {
          const imagePayload = await apiRequest(`/requests/${id}/image-data`, { headers });
          if (imagePayload?.base64Data) {
            const contentType = imagePayload.contentType || "image/jpeg";
            setImageUrl(`data:${contentType};base64,${imagePayload.base64Data}`);
          } else {
            setImageUrl("");
          }
        } catch {
          setImageUrl("");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const readableStatus = (status) => STATUS_LABELS[status] || STATUS_LABELS.OTHER;

  const statusClassName = (status) => {
    switch (status) {
      case "RECYCLED":
        return "status-badge status-recycled";
      case "REJECTED":
        return "status-badge status-rejected";
      case "PICKED_UP":
        return "status-badge status-picked";
      case "PICKUP_SCHEDULED":
        return "status-badge status-scheduled";
      case "OTHER":
        return "status-badge status-other";
      default:
        return "status-badge status-submitted";
    }
  };

  const steps = useMemo(() => {
    if (!requestData?.status) return STATUS_STEPS;
    if (requestData.status === "REJECTED") return ["SUBMITTED", "PICKUP_SCHEDULED", "PICKED_UP", "REJECTED"];
    if (!STATUS_LABELS[requestData.status]) return ["SUBMITTED", "PICKUP_SCHEDULED", "PICKED_UP", "OTHER"];
    return STATUS_STEPS;
  }, [requestData]);

  const getStepState = (stepIndex) => {
    const currentIndex = steps.indexOf(requestData?.status);
    if (currentIndex > stepIndex) return "done";
    if (currentIndex === stepIndex) return "active";
    return "pending";
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <div className="page-title">Track Request</div>
          <div className="page-subtitle">Request details, uploaded image, and live tracking status</div>
        </div>
        <Link className="btn ghost" to="/requests/view">
          Back to Requests
        </Link>
      </div>

      {loading ? (
        <div className="content-card request-card">
          <div className="loading">Loading request tracking...</div>
        </div>
      ) : error ? (
        <div className="content-card request-card">
          <div className="form-error">{error}</div>
        </div>
      ) : requestData ? (
        <div className="content-card request-card fk-order-shell">
          <div className="fk-order-top">
            <div className="fk-product-card">
              <div className="fk-product-image-wrap">
                {imageUrl ? (
                  <img className="fk-product-image" src={imageUrl} alt="E-waste request" />
                ) : (
                  <div className="loading">Image unavailable</div>
                )}
              </div>
              <div className="fk-product-meta">
                <div className="fk-product-title">{requestData.brand} {requestData.model}</div>
                <div className="fk-product-subtitle">{requestData.deviceType} • {requestData.condition}</div>
                <div className="fk-product-subtitle">Quantity: {requestData.quantity}</div>
                <div className="fk-product-status">
                  <span className={statusClassName(requestData.status)}>{readableStatus(requestData.status)}</span>
                </div>
              </div>
            </div>

            <div className="fk-delivery-card">
              <div className="fk-section-head">Pickup Address</div>
              <p>{requestData.pickupAddress}</p>
              <div className="fk-delivery-divider" />
              <div className="fk-section-head">Additional Notes</div>
              <p>{requestData.additionalRemarks || "-"}</p>
              <div className="fk-delivery-divider" />
              <div className="fk-meta-line"><strong>Created:</strong> {requestData.createdAt ? new Date(requestData.createdAt).toLocaleString() : "-"}</div>
              <div className="fk-meta-line"><strong>Last Updated:</strong> {requestData.updatedAt ? new Date(requestData.updatedAt).toLocaleString() : "-"}</div>
            </div>
          </div>

          <div className="fk-tracking-card">
            <div className="fk-section-head">Track Request</div>
            <div className="fk-track-list">
              {steps.map((step, index) => {
                const stepState = getStepState(index);
                return (
                  <div className="fk-track-item" key={step}>
                    <div className="fk-track-rail">
                      <div className={["fk-track-dot", `fk-track-dot-${stepState}`].join(" ")}>
                        {stepState === "done" ? "v" : ""}
                      </div>
                      {index < steps.length - 1 && (
                        <div className={["fk-track-line", `fk-track-line-${stepState}`].join(" ")} />
                      )}
                    </div>
                    <div className="fk-track-content">
                      <div className={["fk-track-title", stepState === "active" ? "fk-track-title-active" : ""].join(" ")}>
                        {readableStatus(step)}
                      </div>
                      <div className="fk-track-subtitle">{STEP_DETAILS[step]}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
