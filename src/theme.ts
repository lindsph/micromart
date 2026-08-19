import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1F4D3A" },
    secondary: { main: "#5C6561" },
    background: { default: "#F3F4F6", paper: "#FFFFFF" },
    text: { primary: "#141516", secondary: "#6B7280" },
    divider: "#E8E9EC",
  },
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h1: { fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em" },
    h2: { fontSize: 16, fontWeight: 650 },
    body1: { fontSize: 15, lineHeight: 1.4 },
    body2: { fontSize: 13, lineHeight: 1.35 },
    caption: { fontSize: 12, lineHeight: 1.3 },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", borderRadius: 999 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999 },
      },
    },
  },
});
