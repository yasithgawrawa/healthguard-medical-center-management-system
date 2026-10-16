// Render a submit button that reflects the form's pending state.
export const SubmitButton = ({ isSubmitting, children }) => (
  <button className="submit-button" type="submit" disabled={isSubmitting}>
    {isSubmitting ? "Please wait..." : children}
  </button>
);
