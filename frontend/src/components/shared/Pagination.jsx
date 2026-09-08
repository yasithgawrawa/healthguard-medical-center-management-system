import { ChevronLeft, ChevronRight } from "lucide-react";

export const Pagination = ({ page, totalPages, onPageChange }) => (
  <div className="pagination">
    <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
      <ChevronLeft size={16} />
      <span>Previous</span>
    </button>
    <span>
      Page {page} of {Math.max(totalPages, 1)}
    </span>
    <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
      <span>Next</span>
      <ChevronRight size={16} />
    </button>
  </div>
);
