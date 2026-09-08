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

export const OperationPanel = ({ title, description, listPath, actions }) => {
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
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
      setRecords(Array.isArray(result.data) ? result.data : [result.data]);
      setMessage(result.message);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load records");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [listPath]);

  const visibleRecords = useMemo(() => records.slice(0, 5), [records]);

  const setField = (actionLabel, fieldName, value) => {
    setForms((current) => ({
      ...current,
      [actionLabel]: { ...current[actionLabel], [fieldName]: value }
    }));
  };

  const submitAction = async (action) => {
    setBusy(true);
    setError("");
    setMessage("");
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
      setMessage(result.message);
      await loadRecords();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Operation failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="operation-panel">
      <div className="operation-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {listPath ? (
          <button type="button" onClick={loadRecords} disabled={busy}>
            Refresh
          </button>
        ) : null}
      </div>
      {message ? <div className="success-alert">{message}</div> : null}
      {error ? <div className="form-alert">{error}</div> : null}

      <div className="operation-actions">
        {actions.map((action) => (
          <form
            className="operation-form"
            key={action.label}
            onSubmit={(event) => {
              event.preventDefault();
              submitAction(action);
            }}
          >
            <h3>{action.label}</h3>
            {(action.fields || []).map((field) => (
              <label className="form-field compact" key={field.name}>
                <span>{field.label}</span>
                {field.type === "select" ? (
                  <select value={forms[action.label]?.[field.name] || ""} onChange={(event) => setField(action.label, field.name, event.target.value)} required={field.required}>
                    <option value="">Select</option>
                    {field.options.map((option) => (
                      <option value={option.value} key={option.value}>{option.label}</option>
                    ))}
                  </select>
                ) : field.type === "json" ? (
                  <textarea value={forms[action.label]?.[field.name] || ""} onChange={(event) => setField(action.label, field.name, event.target.value)} required={field.required} />
                ) : (
                  <input type={field.type || "text"} value={forms[action.label]?.[field.name] || ""} onChange={(event) => setField(action.label, field.name, event.target.value)} required={field.required} />
                )}
              </label>
            ))}
            <button className="submit-button" type="submit" disabled={busy}>{action.label}</button>
          </form>
        ))}
      </div>

      {visibleRecords.length ? (
        <div className="record-list">
          {visibleRecords.map((record, index) => (
            <pre key={record._id || index}>{JSON.stringify(record, null, 2)}</pre>
          ))}
        </div>
      ) : (
        <p className="empty-state">No records loaded.</p>
      )}
    </section>
  );
};
