import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Pencil, Plus, ReceiptText, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "../../context/AuthContext.jsx";
import { billingApi } from "../../services/billingApi.js";
import { ROLES } from "../../utils/roles.js";
import { ConfirmDialog } from "../shared/ConfirmDialog.jsx";
import { DataTable } from "../shared/DataTable.jsx";
import { FilterSelect } from "../shared/FilterSelect.jsx";
import { FormInput } from "../shared/forms/FormInput.jsx";
import { FormSelect } from "../shared/forms/FormSelect.jsx";
import { FormTextarea } from "../shared/forms/FormTextarea.jsx";
import { Modal } from "../shared/Modal.jsx";
import { SearchBar } from "../shared/SearchBar.jsx";
import { Toast } from "../shared/Toast.jsx";

const categories = [
  { value: "electricity", label: "Electricity" },
  { value: "water", label: "Water" },
  { value: "internet", label: "Internet" },
  { value: "repairs", label: "Repairs" },
  { value: "other", label: "Other" }
];

const monthOptions = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
].map((label, index) => ({ value: String(index + 1), label }));

const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const yearOptions = Array.from({ length: 11 }, (_, index) => {
  const year = currentYear - index;
  return { value: String(year), label: String(year) };
});

const expenseSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(120, "Title cannot exceed 120 characters"),
  category: z.enum(categories.map((category) => category.value)),
  amount: z.string().trim()
    .min(1, "Amount is required")
    .regex(/^\d+(?:\.\d{1,2})?$/, "Use a valid amount with up to 2 decimal places")
    .refine((value) => Number(value) > 0, "Amount must be greater than 0")
    .refine((value) => Number(value) <= 10000000, "Amount cannot exceed Rs. 10,000,000.00"),
  expenseDate: z.string().min(1, "Expense date is required").regex(/^\d{4}-\d{2}-\d{2}$/, "Expense date is invalid"),
  notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional()
});

const localDateInput = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const dateInputValue = (value) => value ? String(value).slice(0, 10) : localDateInput();
const categoryLabel = (value) => categories.find((category) => category.value === value)?.label || value;
const dateLabel = (value) => value ? new Date(value).toLocaleDateString("en-LK") : "-";
const userLabel = (value) => [value?.firstName, value?.lastName].filter(Boolean).join(" ") || "-";

const moneyFromCents = (value) => {
  const cents = Number.isSafeInteger(Number(value)) ? Number(value) : 0;
  const whole = Math.trunc(cents / 100).toLocaleString("en-LK");
  return `Rs. ${whole}.${String(Math.abs(cents % 100)).padStart(2, "0")}`;
};

const amountInputValue = (value) => {
  const cents = Number(value || 0);
  return `${Math.trunc(cents / 100)}.${String(Math.abs(cents % 100)).padStart(2, "0")}`;
};

const formValuesFor = (expense) => ({
  title: expense?.title || "",
  category: expense?.category || "electricity",
  amount: expense ? amountInputValue(expense.amountCents) : "",
  expenseDate: dateInputValue(expense?.expenseDate),
  notes: expense?.notes || ""
});

export const ExpenseManagementPanel = ({ embedded = false }) => {
  const { user } = useAuth();
  const canManage = user?.role === ROLES.CASHIER;
  const [expenses, setExpenses] = useState([]);
  const [totalAmountCents, setTotalAmountCents] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [month, setMonth] = useState(String(currentDate.getMonth() + 1));
  const [year, setYear] = useState(String(currentYear));
  const [modal, setModal] = useState({ type: null, expense: null });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const requestNumber = useRef(0);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(expenseSchema),
    mode: "onChange",
    defaultValues: formValuesFor()
  });

  useEffect(() => {
    if (["create", "edit"].includes(modal.type)) reset(formValuesFor(modal.expense));
  }, [modal, reset]);

  useEffect(() => {
    const thisRequest = ++requestNumber.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = Object.fromEntries(Object.entries({ search: search.trim(), category, month, year }).filter(([, value]) => value));
        const result = await billingApi.expenses(params);
        if (thisRequest !== requestNumber.current) return;
        setExpenses(Array.isArray(result?.expenses) ? result.expenses : []);
        setTotalAmountCents(result?.totalAmountCents || 0);
      } catch (error) {
        if (thisRequest !== requestNumber.current) return;
        setToast({ type: "error", message: error.response?.data?.message || "Unable to load expenses" });
      } finally {
        if (thisRequest === requestNumber.current) setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search, category, month, year]);

  const refreshExpenses = async () => {
    const params = Object.fromEntries(Object.entries({ search: search.trim(), category, month, year }).filter(([, value]) => value));
    const result = await billingApi.expenses(params);
    setExpenses(Array.isArray(result?.expenses) ? result.expenses : []);
    setTotalAmountCents(result?.totalAmountCents || 0);
  };

  const openDetails = async (expense) => {
    setBusy(true);
    try {
      const details = await billingApi.getExpense(expense._id);
      setModal({ type: "view", expense: details });
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to load expense details" });
    } finally {
      setBusy(false);
    }
  };

  const saveExpense = async (values) => {
    setBusy(true);
    try {
      const payload = {
        title: values.title.trim(),
        category: values.category,
        amount: values.amount.trim(),
        expenseDate: values.expenseDate,
        notes: values.notes?.trim() || ""
      };
      if (modal.type === "edit") {
        await billingApi.updateExpense(modal.expense._id, payload);
        setToast({ type: "success", message: "Expense updated successfully" });
      } else {
        await billingApi.createExpense(payload);
        setToast({ type: "success", message: "Expense created successfully" });
      }
      setModal({ type: null, expense: null });
      await refreshExpenses();
    } catch (error) {
      const response = error.response?.data;
      Object.entries(response?.errors || {}).forEach(([field, message]) => {
        setError(field.replace(/^body\./, ""), { type: "server", message });
      });
      setToast({ type: "error", message: response?.message || "Unable to save expense" });
    } finally {
      setBusy(false);
    }
  };

  const removeExpense = async () => {
    setBusy(true);
    try {
      await billingApi.deleteExpense(modal.expense._id);
      setToast({ type: "success", message: "Expense deleted successfully" });
      setModal({ type: null, expense: null });
      await refreshExpenses();
    } catch (error) {
      setToast({ type: "error", message: error.response?.data?.message || "Unable to delete expense" });
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: "expenseId", header: "Expense ID" },
    { key: "expenseDate", header: "Date", render: (item) => dateLabel(item.expenseDate) },
    { key: "title", header: "Expense Title", render: (item) => <strong>{item.title}</strong> },
    { key: "category", header: "Category", render: (item) => categoryLabel(item.category) },
    { key: "amountCents", header: "Amount", render: (item) => <strong>{moneyFromCents(item.amountCents)}</strong> },
    { key: "createdBy", header: "Entered By", render: (item) => userLabel(item.createdBy) },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="expense-row-actions">
          <button type="button" title="View expense" aria-label={`View ${item.title}`} onClick={() => openDetails(item)} disabled={busy}>
            <Eye size={17} />
          </button>
          {canManage ? (
            <>
              <button type="button" title="Edit expense" aria-label={`Edit ${item.title}`} onClick={() => setModal({ type: "edit", expense: item })}>
                <Pencil size={17} />
              </button>
              <button className="danger-icon-button" type="button" title="Delete expense" aria-label={`Delete ${item.title}`} onClick={() => setModal({ type: "delete", expense: item })}>
                <Trash2 size={17} />
              </button>
            </>
          ) : null}
        </div>
      )
    }
  ];

  const periodLabel = month
    ? `${monthOptions.find((option) => option.value === month)?.label || "Selected month"} ${year}`
    : year ? year : "all dates";

  const PanelElement = embedded ? "div" : "section";

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <PanelElement className={embedded ? "expense-management-panel" : "e1-panel"} id="billing-expenses">
        <div className="e1-panel-header">
          <div>
            <h2>Medical Center Expenses</h2>
            <p>{canManage ? "Record and maintain day-to-day operating expenses." : "Review medical center operating expenses."}</p>
          </div>
          {canManage ? (
            <button className="button-primary" type="button" onClick={() => setModal({ type: "create", expense: null })}>
              <Plus size={17} />
              <span>Add Expense</span>
            </button>
          ) : null}
        </div>

        <div className="expense-summary" aria-live="polite">
          <div>
            <span>Total expenses for {periodLabel}</span>
            <strong>{moneyFromCents(totalAmountCents)}</strong>
          </div>
          <span>{expenses.length} record{expenses.length === 1 ? "" : "s"}{category ? ` in ${categoryLabel(category)}` : ""}</span>
        </div>

        <div className="table-toolbar expense-toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Search expense title" />
          <FilterSelect label="Category" value={category} onChange={setCategory} options={categories} />
          <FilterSelect
            label="Month"
            value={month}
            onChange={(value) => {
              setMonth(value);
              if (value && !year) setYear(String(currentYear));
            }}
            options={monthOptions}
          />
          <FilterSelect
            label="Year"
            value={year}
            onChange={(value) => {
              setYear(value);
              if (!value) setMonth("");
            }}
            options={yearOptions}
          />
        </div>

        <DataTable
          columns={columns}
          rows={expenses}
          emptyText={loading ? "Loading expenses..." : "No expenses found for the selected filters."}
        />
      </PanelElement>

      <Modal
        open={["create", "edit"].includes(modal.type)}
        title={modal.type === "edit" ? "Edit Expense" : "Add Expense"}
        subtitle="Expense records remain separate from invoices, medicine purchases, and payroll."
        onClose={() => setModal({ type: null, expense: null })}
      >
        <form onSubmit={handleSubmit(saveExpense)}>
          <div className="form-grid">
            <FormInput label="Expense Title" maxLength={120} required error={errors.title?.message} {...register("title")} />
            <FormSelect label="Category" required error={errors.category?.message} {...register("category")}>
              {categories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </FormSelect>
            <FormInput label="Amount (LKR)" inputMode="decimal" placeholder="0.00" required error={errors.amount?.message} {...register("amount")} />
            <FormInput label="Expense Date" type="date" required error={errors.expenseDate?.message} {...register("expenseDate")} />
          </div>
          <FormTextarea label="Notes" rows={4} maxLength={500} error={errors.notes?.message} {...register("notes")} />
          <div className="modal-actions">
            <button className="button-secondary" type="button" onClick={() => setModal({ type: null, expense: null })} disabled={busy}>Cancel</button>
            <button className="button-primary" type="submit" disabled={busy}>
              <ReceiptText size={17} />
              <span>{busy ? "Saving..." : modal.type === "edit" ? "Update Expense" : "Save Expense"}</span>
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={modal.type === "view"}
        title={modal.expense?.title || "Expense Details"}
        subtitle={modal.expense?.expenseId || ""}
        onClose={() => setModal({ type: null, expense: null })}
      >
        {modal.expense ? (
          <div className="detail-grid">
            <div><span>Category</span><strong>{categoryLabel(modal.expense.category)}</strong></div>
            <div><span>Amount</span><strong>{moneyFromCents(modal.expense.amountCents)}</strong></div>
            <div><span>Expense Date</span><strong>{dateLabel(modal.expense.expenseDate)}</strong></div>
            <div><span>Entered By</span><strong>{userLabel(modal.expense.createdBy)}</strong></div>
            <div><span>Created</span><strong>{dateLabel(modal.expense.createdAt)}</strong></div>
            <div><span>Last Updated</span><strong>{dateLabel(modal.expense.updatedAt)}</strong></div>
            <div className="expense-detail-notes"><span>Notes</span><strong>{modal.expense.notes || "No notes provided"}</strong></div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={modal.type === "delete"}
        title={`Delete ${modal.expense?.expenseId || "expense"}?`}
        message="This expense record will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete Expense"
        busy={busy}
        onCancel={() => setModal({ type: null, expense: null })}
        onConfirm={removeExpense}
      />
    </>
  );
};
