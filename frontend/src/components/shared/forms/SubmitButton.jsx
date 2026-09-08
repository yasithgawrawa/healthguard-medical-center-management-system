export const SubmitButton = ({ isSubmitting, children }) => (
  <button className="submit-button" type="submit" disabled={isSubmitting}>
    {isSubmitting ? "Please wait..." : children}
  </button>
);
