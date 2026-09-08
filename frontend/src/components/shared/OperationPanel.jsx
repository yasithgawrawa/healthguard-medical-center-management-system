import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Code2,
  Database,
  Layers,
  RefreshCw,
  Send
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { operationsApi } from "../../services/operationsApi.js";

const initialValues = (fields) =>
  fields.reduce((acc, field) => {
    acc[field.name] = field.defaultValue ?? "";
    return acc;
  }, {});

const coerceValue = (value, type) => {
  if (type === "number") return Number(value);
  if (type === "json") return JSON.parse(value || "null");
  return value;
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const OperationPanel = ({ id, title, description, listPath, actions = [] }) => {
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [forms, setForms] = useState(() =>
    actions.reduce((acc, action) => {
      acc[action.label] = initialValues(action.fields || []);
      return acc;
    }, {})
  );

  const loadRecords = async () => {
    if (!listPath) return;
    setBusy(true);
    setError("");
    try {
      const result = await operationsApi.request("get", listPath);
      setRecords(Array.isArray(result.data) ? result.data : result.data ? [result.data] : []);
      if (result.message && result.message !== "Records fetched") {
        setMessage(result.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load live records");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [listPath]);

  const visibleRecords = useMemo(() => records.slice(0, 6), [records]);

  const setField = (actionLabel, fieldName, value) => {
    setFieldErrors((current) => ({
      ...current,
      [actionLabel]: { ...(current[actionLabel] || {}), [fieldName]: "" }
    }));
    setForms((current) => ({
      ...current,
      [actionLabel]: { ...current[actionLabel], [fieldName]: value }
    }));
  };

  const validateAction = (action) => {
    const form = forms[action.label] || {};
    const errors = {};
    for (const field of action.fields || []) {
      if (field.required && String(form[field.name] || "").trim() === "") {
        errors[field.name] = `${field.label} is required`;
      }
      if (field.type === "number" && form[field.name] !== "" && Number.isNaN(Number(form[field.name]))) {
        errors[field.name] = `${field.label} must be a number`;
      }
      if (field.type === "json" && form[field.name]) {
        try {
          JSON.parse(form[field.name]);
        } catch {
          errors[field.name] = `${field.label} must be valid JSON`;
        }
      }
    }
    setFieldErrors((current) => ({ ...current, [action.label]: errors }));
    return Object.keys(errors).length === 0;
  };

  const submitAction = async (action) => {
    setBusy(true);
    setError("");
    setMessage("");
    if (!validateAction(action)) {
      setBusy(false);
      return;
    }
    try {
      const form = forms[action.label] || {};
      const payload = {};
      for (const field of action.fields || []) {
        if (field.pathParam) continue;
        if (!field.required && form[field.name] === "") continue;
        payload[field.name] = coerceValue(form[field.name], field.type);
      }
      const path = (action.path || "").replace(/:([A-Za-z0-9_]+)/g, (_, key) => form[key]);
      const result = await operationsApi.request(action.method, path, payload);
      setMessage(result.message || `${action.label} executed successfully.`);
      await loadRecords();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Operation failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="operation-panel" id={id || slugify(title)}>
      <div className="operation-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {listPath ? (
          <button type="button" onClick={loadRecords} disabled={busy}>
            <RefreshCw size={15} className={busy ? "spin-animation" : ""} />
            <span>Refresh</span>
          </button>
        ) : null}
      </div>

      {message ? (
        <div className="success-alert" style={{ marginTop: "16px" }}>
          <CheckCircle size={18} />
          <span>{message}</span>
        </div>
      ) : null}

      {error ? (
        <div className="form-alert" style={{ marginTop: "16px" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : null}

      {actions.length > 0 ? (
        <div className="operation-actions-grid">
          {actions.map((action) => (
            <form
              className="operation-form-card"
              key={action.label}
              onSubmit={(event) => {
                event.preventDefault();
                submitAction(action);
              }}
            >
              <h3>{action.label}</h3>
              {(action.fields || []).map((field) => {
                const fieldError = fieldErrors[action.label]?.[field.name];
                return (
                <label className={`form-field${fieldError ? " has-error" : ""}`} key={field.name}>
                  <span>{field.label}</span>
                  {field.type === "select" ? (
                    <select
                      value={forms[action.label]?.[field.name] || ""}
                      onChange={(event) => setField(action.label, field.name, event.target.value)}
                      required={field.required}
                      aria-invalid={Boolean(fieldError)}
                    >
                      <option value="">{field.placeholder || "Select option"}</option>
                      {field.options.map((option) => (
                        <option value={option.value} key={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "json" ? (
                    <textarea
                      value={forms[action.label]?.[field.name] || ""}
                      onChange={(event) => setField(action.label, field.name, event.target.value)}
                      required={field.required}
                      rows={3}
                      placeholder={field.placeholder || "Paste item details as JSON"}
                      aria-invalid={Boolean(fieldError)}
                    />
                  ) : (
                    <input
                      type={field.type || "text"}
                      value={forms[action.label]?.[field.name] || ""}
                      onChange={(event) => setField(action.label, field.name, event.target.value)}
                      required={field.required}
                      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                      aria-invalid={Boolean(fieldError)}
                    />
                  )}
                  {fieldError ? <small>{fieldError}</small> : null}
                </label>
              );
              })}
              <button
                className="submit-button"
                type="submit"
                disabled={busy}
                style={{ marginTop: "auto" }}
              >
                <Send size={16} />
                <span>{action.label}</span>
              </button>
            </form>
          ))}
        </div>
      ) : null}

      {listPath ? (
        <div className="records-section">
          <h4>
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Database size={18} color="var(--brand-600)" />
              <span>Recent Records ({records.length})</span>
            </span>
            <button
              type="button"
              style={{
                background: "transparent",
                border: "1px solid var(--line)",
                borderRadius: "8px",
                padding: "4px 10px",
                fontSize: "0.78rem",
                color: "var(--brand-700)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
              onClick={() => setShowRawJson(!showRawJson)}
            >
              <Code2 size={14} />
              <span>{showRawJson ? "Show Formatted" : "Show JSON"}</span>
            </button>
          </h4>

          {visibleRecords.length > 0 ? (
            showRawJson ? (
              <div className="record-cards-list">
                {visibleRecords.map((record, index) => (
                  <pre className="record-json-pre" key={record._id || index}>
                    {JSON.stringify(record, null, 2)}
                  </pre>
                ))}
              </div>
            ) : (
              <div className="record-cards-list">
                {visibleRecords.map((record, index) => (
                  <div className="record-item-card" key={record._id || index}>
                    <div className="record-item-header">
                      <span className="record-id">
                        ID: {record._id ? String(record._id).slice(-8) : `#${index + 1}`}
                      </span>
                      {record.status ? (
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: "700",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            background:
                              record.status === "completed" || record.status === "verified" || record.status === "active"
                                ? "var(--success-bg)"
                                : "var(--brand-100)",
                            color:
                              record.status === "completed" || record.status === "verified" || record.status === "active"
                                ? "var(--success)"
                                : "var(--brand-800)",
                            textTransform: "capitalize"
                          }}
                        >
                          {record.status}
                        </span>
                      ) : null}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--ink-700)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "6px" }}>
                      {Object.entries(record)
                        .filter(([k]) => !["_id", "__v", "passwordHash", "status"].includes(k))
                        .slice(0, 4)
                        .map(([key, val]) => (
                          <div key={key}>
                            <span style={{ color: "var(--muted)", textTransform: "capitalize" }}>
                              {key.replace(/([A-Z])/g, " $1")}:{" "}
                            </span>
                            <strong>
                              {typeof val === "object" ? JSON.stringify(val).slice(0, 20) : String(val)}
                            </strong>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div style={{ padding: "30px", textAlign: "center", background: "var(--brand-50)", borderRadius: "14px", border: "1px dashed var(--brand-200)", color: "var(--muted)" }}>
              <Layers size={28} style={{ opacity: 0.5, marginBottom: "8px" }} />
              <p style={{ margin: 0, fontSize: "0.9rem" }}>No records yet. Use an action above to create one.</p>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
};
