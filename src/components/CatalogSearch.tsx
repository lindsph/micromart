import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { SEARCH_PLACEHOLDER } from "../review/locks";

type CatalogSearchProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  dense?: boolean;
};

export function CatalogSearch({
  value,
  onValueChange,
  placeholder = SEARCH_PLACEHOLDER,
  dense = false,
}: CatalogSearchProps) {
  const clear = () => onValueChange("");

  return (
    <TextField
      fullWidth
      size={dense ? "small" : "medium"}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Escape" && value) {
          event.preventDefault();
          clear();
        }
      }}
      placeholder={placeholder}
      autoComplete="off"
      type="search"
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" htmlColor="#9AA0A6" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment
              position="end"
              data-testid="search-clear-slot"
              sx={{ width: 40, justifyContent: "flex-end" }}
            >
              {value ? (
                <IconButton
                  type="button"
                  size="small"
                  aria-label="Clear search"
                  onClick={clear}
                  edge="end"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              ) : null}
            </InputAdornment>
          ),
        },
        htmlInput: {
          "aria-label": "Search catalog",
        },
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          bgcolor: "background.paper",
          borderRadius: 999,
          boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
        },
        "& fieldset": { borderColor: "divider" },
        "& input[type=\"search\"]::-webkit-search-cancel-button": {
          display: "none",
        },
      }}
    />
  );
}
