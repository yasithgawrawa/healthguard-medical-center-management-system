import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { e1Api } from "../../services/e1Api.js";
import { FormInput } from "../shared/forms/FormInput.jsx";

const centerSchema = z.object({
  name: z.string().trim().min(2, "Center name is required").max(120, "Center name is too long"),
  latitude: z.coerce.number().min(-90, "Latitude is required").max(90),
  longitude: z.coerce.number().min(-180, "Longitude is required").max(180),
  radiusMeters: z.coerce.number().int("Radius must be a whole number").min(10, "Minimum radius is 10m").max(1000, "Maximum radius is 1000m")
});

export const CenterLocationPanel = ({ onToast }) => {
  const [busy, setBusy] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(centerSchema),
    mode: "onChange",
    defaultValues: { name: "Health Guard Medical Center", latitude: "", longitude: "", radiusMeters: 100 }
  });

  useEffect(() => {
    e1Api
      .getCenterLocation()
      .then((center) => {
        if (center) reset(center);
      })
      .catch(() => {});
  }, [reset]);

  const useCurrentLocation = () => {
    setLocationMessage("");
    if (!navigator.geolocation) {
      setLocationMessage("Location is not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue("latitude", Number(position.coords.latitude.toFixed(6)), { shouldValidate: true });
        setValue("longitude", Number(position.coords.longitude.toFixed(6)), { shouldValidate: true });
        setLocationMessage("Center location captured.");
      },
      () => setLocationMessage("Unable to capture location. Allow browser location access or enter coordinates manually."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = async (values) => {
    setBusy(true);
    try {
      await e1Api.saveCenterLocation(values);
      onToast?.({ type: "success", message: "Center check-in location saved" });
    } catch (error) {
      onToast?.({ type: "error", message: error.response?.data?.message || "Unable to save center location" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="geo-section" onSubmit={handleSubmit(submit)}>
      <div className="geo-section-header">
        <div>
          <strong>Health Guard Center Check-In Location</strong>
          <span>All staff check-ins must happen inside this center radius.</span>
        </div>
        <button className="button-secondary" type="button" onClick={useCurrentLocation}>
          <MapPin size={16} />
          <span>Use Current Location</span>
        </button>
      </div>
      <div className="form-grid">
        <FormInput label="Center Name" error={errors.name?.message} {...register("name")} />
        <FormInput label="Latitude" type="number" step="0.000001" error={errors.latitude?.message} {...register("latitude")} />
        <FormInput label="Longitude" type="number" step="0.000001" error={errors.longitude?.message} {...register("longitude")} />
        <FormInput label="Allowed Radius (meters)" type="number" error={errors.radiusMeters?.message} {...register("radiusMeters")} />
      </div>
      {locationMessage ? <p className="section-description" style={{ margin: "0 0 12px" }}>{locationMessage}</p> : null}
      <button className="button-primary" type="submit" disabled={busy}>
        {busy ? "Saving..." : "Save Center Location"}
      </button>
    </form>
  );
};
