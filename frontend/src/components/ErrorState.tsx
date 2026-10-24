interface ErrorStateProps {
  message: string; // what went wrong, e.g. the text sent by the backend
  onRetry: () => void; // called when the user clicks "Retry"
  embedded?: boolean; // true when shown inside a card that already has a border
}

// Shown when the data could not be loaded
function ErrorState({ message, onRetry, embedded = false }: ErrorStateProps) {
  // On its own it is a card. Inside another card it is just the content, so the
  // card does not end up with a second border inside it.
  const boxClass = embedded
    ? "py-12"
    : "rounded-xl border border-border bg-card py-16";

  return (
    <div className={`flex flex-col items-center px-6 text-center ${boxClass}`}>
      <p className="text-lg font-semibold text-fg">Could not load the data</p>
      <p className="mt-2 max-w-md text-sm text-fg-secondary">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 rounded-lg border border-border bg-elevated px-4 py-2 text-sm font-medium text-fg transition-colors hover:border-border-active"
      >
        Retry
      </button>
    </div>
  );
}

export default ErrorState;
