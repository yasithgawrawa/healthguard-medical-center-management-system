import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { e1Api } from "../../services/e1Api.js";
import { FormInput } from "../shared/forms/FormInput.jsx";

// Set Clinic Location | Frontend Validation | Validate center values including latitude, longitude, radius meters.
const centerSchema = z.object({
  latitude: z.coerce.number().min(-90, "Latitude is required").max(90),
  longitude: z.coerce.number().min(-180, "Longitude is required").max(180),
  radiusMeters: z.coerce.number().int("Radius must be a whole number").min(10, "Minimum radius is 10m").max(1000, "Maximum radius is 1000m")
});

// Set Clinic Location | Frontend Logic | Edit the clinic attendance point and optionally fill coordinates from browser geolocation.
export const CenterLocationPanel = ({ onToast }) => {
  const [busy, setBusy] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  // Connect form fields, validation errors, and submission handling through React Hook Form.
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(centerSchema),
    mode: "onChange",
    defaultValues: { latitude: "", longitude: "", radiusMeters: 100 }
  });

  // Reset the form when its selected record or dialog state changes.
  useEffect(() => {
    // View Clinic Location | Data Loading | Call e1Api.getCenterLocation for this feature and use the returned records
    e1Api
      .getCenterLocation()
      .then((center) => {
        if (center) reset({
          latitude: center.latitude ?? "",
          longitude: center.longitude ?? "",
          radiusMeters: center.radiusMeters ?? 100
        });
      })
      .catch(() => {});
  }, [reset]);

  // Set Clinic Location | Frontend Logic | Read browser geolocation and fill the clinic attendance coordinates.
  const useCurrentLocation = () => {
    setLocationMessage("");
    if (!navigator.geolocation) {
      setLocationMessage("Browser location is not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue("latitude", Number(position.coords.latitude.toFixed(6)), { shouldValidate: true });
        setValue("longitude", Number(position.coords.longitude.toFixed(6)), { shouldValidate: true });
        setLocationMessage("Clinic check-in point captured.");
      },
      () => setLocationMessage("Unable to capture location. Allow browser location access or enter coordinates manually."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Set Clinic Location | Submit Logic | Submit the validated center location form and show the resulting success or error feedback.
  const submit = async (values) => {
    setBusy(true);
    try {
      // Set Clinic Location | Submit Logic | Call e1Api.saveCenterLocation for this feature.
      await e1Api.saveCenterLocation(values);
      onToast?.({ type: "success", message: "Clinic attendance point saved" });
    } catch (error) {
      onToast?.({ type: "error", message: error.response?.data?.message || "Unable to save clinic attendance point" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="geo-section" onSubmit={handleSubmit(submit)}>
      {/* Set Clinic Location | Form | Render fields, validation feedback, and submission controls for this feature. */}
      <div className="geo-section-header">
        <div>
          <strong>Single Clinic Attendance Point</strong>
          <span>All staff check-ins are verified against this one Health Guard Medical Center location.</span>
        </div>
        <button className="button-secondary" type="button" onClick={useCurrentLocation}>
          <MapPin size={16} />
          <span>Capture Clinic Coordinates</span>
        </button>
      </div>
      <div className="form-grid">
        <FormInput label="Latitude" placeholder="6.914700" type="number" step="0.000001" error={errors.latitude?.message} {...register("latitude")} />
        <FormInput label="Longitude" placeholder="79.878000" type="number" step="0.000001" error={errors.longitude?.message} {...register("longitude")} />
        <FormInput label="Allowed Radius (meters)" placeholder="100" type="number" error={errors.radiusMeters?.message} {...register("radiusMeters")} />
      </div>
      {locationMessage ? <p className="section-description" style={{ margin: "0 0 12px" }}>{locationMessage}</p> : null}
      <button className="button-primary" type="submit" disabled={busy}>
        {busy ? "Saving..." : "Save Clinic Attendance Point"}
      </button>
    </form>
  );
};
