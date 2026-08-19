import { Alert, Button } from "@mui/material";

type ConnectionBannerProps = {
  online: boolean;
  isError: boolean;
  filtersError?: boolean;
  isBusy?: boolean;
  isFetching: boolean;
  hasData: boolean;
  onRetry: () => void;
};

export function ConnectionBanner({
  online,
  isError,
  filtersError = false,
  isBusy = false,
  isFetching,
  hasData,
  onRetry,
}: ConnectionBannerProps) {
  if (online && !isError && !filtersError) {
    return null;
  }

  if (!online) {
    return (
      <Alert
        severity="warning"
        action={
          <Button color="inherit" size="small" onClick={onRetry} disabled={isFetching}>
            Retry
          </Button>
        }
      >
        {hasData
          ? "You're offline. Showing the last catalog we loaded."
          : "You're offline. We'll retry the moment you're back."}
      </Alert>
    );
  }

  if (isError) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={onRetry} disabled={isFetching}>
            {isFetching ? "Retrying" : "Retry now"}
          </Button>
        }
      >
        {isBusy
          ? hasData
            ? "Catalog is busy. The list below is the last good load."
            : "Catalog is busy. We'll try again in a moment."
          : hasData
            ? "Couldn't refresh. The list below is the last good load."
            : isFetching
              ? "Still trying to reach the catalog…"
              : "Couldn't reach the catalog. Retrying automatically."}
      </Alert>
    );
  }

  if (filtersError) {
    return (
      <Alert
        severity="warning"
        action={
          <Button color="inherit" size="small" onClick={onRetry} disabled={isFetching}>
            {isFetching ? "Retrying" : "Retry now"}
          </Button>
        }
      >
        Couldn't load categories. Search and the list still work.
      </Alert>
    );
  }

  return null;
}
