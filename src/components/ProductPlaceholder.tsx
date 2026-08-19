import { Box, Typography } from "@mui/material";

type PackKind = "bottle" | "can" | "bag" | "candy" | "bar" | "carton" | "scoop" | "pump";

type Atmosphere = {
  well: string;
  sweep: string;
  ink: string;
  body: string;
  accent: string;
  glass: string;
};

const ATMOSPHERE: Record<string, Atmosphere> = {
  drink: {
    well: "#E6EFE9",
    sweep: "rgba(31, 77, 58, 0.12)",
    ink: "#1E3F32",
    body: "#7FA892",
    accent: "#1F4D3A",
    glass: "rgba(255, 255, 255, 0.42)",
  },
  snack: {
    well: "#F6E7D3",
    sweep: "rgba(150, 82, 28, 0.12)",
    ink: "#5C3318",
    body: "#D4924E",
    accent: "#C25824",
    glass: "rgba(255, 244, 230, 0.55)",
  },
  cold: {
    well: "#E5EDF3",
    sweep: "rgba(38, 72, 102, 0.12)",
    ink: "#243F52",
    body: "#7E9CB1",
    accent: "#355F78",
    glass: "rgba(255, 255, 255, 0.4)",
  },
  frozen: {
    well: "#E6F3F5",
    sweep: "rgba(42, 118, 132, 0.12)",
    ink: "#255058",
    body: "#8DC6CF",
    accent: "#3E8490",
    glass: "rgba(255, 255, 255, 0.5)",
  },
  "personal care": {
    well: "#F0E9E4",
    sweep: "rgba(90, 62, 50, 0.1)",
    ink: "#4E3F38",
    body: "#C7B3A6",
    accent: "#8B6F63",
    glass: "rgba(255, 255, 255, 0.45)",
  },
};

const FALLBACK_ATMOSPHERE: Atmosphere = ATMOSPHERE.drink;

type ProductPlaceholderProps = {
  category?: string;
  tags?: string[];
  size: number;
  label: string;
};

function atmosphereFor(category?: string): Atmosphere {
  const key = category?.trim().toLowerCase() ?? "";
  return ATMOSPHERE[key] ?? FALLBACK_ATMOSPHERE;
}

function packKind(category?: string, tags: string[] = []): PackKind {
  const haystack = [category, ...tags].join(" ").toLowerCase();

  if (/(chip|popcorn|puff|pretzel|cracker|trail mix|nuts|snack mix)/.test(haystack)) {
    return "bag";
  }
  if (/(candy|chocolate|chewy|sour|gummy|caramel)/.test(haystack)) {
    return "candy";
  }
  if (/(protein bar|cookie|pastry|bar)/.test(haystack)) {
    return "bar";
  }
  if (/(ice cream|frozen treat|drumstick)/.test(haystack)) {
    return "scoop";
  }
  if (/(energy drink|carbonated|soft drink|caffeinated|soda)/.test(haystack)) {
    return "can";
  }
  if (/(personal care|tissue|toilet)/.test(haystack)) {
    return "pump";
  }
  if (/(sandwich|mac & cheese|ready-to-eat|frozen)/.test(haystack)) {
    return "carton";
  }
  if (/(cold)/.test(haystack) && !/(drink)/.test(haystack)) {
    return "can";
  }
  if (category?.toLowerCase() === "snack") {
    return "bag";
  }
  if (category?.toLowerCase() === "drink") {
    return "bottle";
  }
  return "bottle";
}

function PackMark({
  kind,
  palette,
  detailed,
}: {
  kind: PackKind;
  palette: Atmosphere;
  detailed: boolean;
}) {
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden>
      <ellipse cx="32" cy="58" rx="16" ry="3.2" fill={palette.ink} opacity={0.1} />
      {kind === "bottle" ? (
        <>
          <path
            d="M27 8h10v5l-1 2v4c8 3 10 9 10 16v17c0 6.5-4.2 10-14 10s-14-3.5-14-10V35c0-7 2-13 10-16v-4l-1-2V8z"
            fill={palette.body}
          />
          <path d="M22 34c0 0 2 18 10 18s10-18 10-18" fill={palette.accent} opacity={0.88} />
          {detailed ? (
            <path d="M26 22c0 10 1 24 6 24" stroke={palette.glass} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          ) : null}
          <rect x="27.5" y="5" width="9" height="6" rx="1.2" fill={palette.ink} />
        </>
      ) : null}
      {kind === "can" ? (
        <>
          <path d="M19 16c0-1 5.5-5 13-5s13 4 13 5v32c0 5.5-5 8.5-13 8.5S19 53.5 19 48z" fill={palette.body} />
          <ellipse cx="32" cy="16" rx="13" ry="5" fill={palette.accent} />
          <ellipse cx="32" cy="14.5" rx="8" ry="2.4" fill={palette.glass} />
          {detailed ? <rect x="22" y="28" width="20" height="8" rx="1" fill={palette.ink} opacity={0.18} /> : null}
        </>
      ) : null}
      {kind === "bag" ? (
        <>
          <path
            d="M22 17c-2.2 0-3.8 1.8-3.4 3.6L16 50.2C15.5 54.8 20 57.5 32 57.5s16.5-2.7 16-7.3l-2.6-29.6c.4-1.8-1.2-3.6-3.4-3.6z"
            fill={palette.body}
          />
          <path d="M18.8 21.2h26.4l-.6 3.8H19.4z" fill={palette.accent} />
          <path d="M21.5 13.5c3.2-2.2 17.8-2.2 21 0l1.2 3.8H20.3z" fill={palette.accent} />
          {detailed ? (
            <>
              <path
                d="M23 15.2h18M23.6 17h16.8"
                stroke={palette.ink}
                strokeWidth="0.7"
                opacity={0.22}
              />
              <path
                d="M20 50c3 .8 21 .8 24 0"
                stroke={palette.ink}
                strokeWidth="1.2"
                fill="none"
                opacity={0.12}
              />
            </>
          ) : null}
          <rect x="23" y="30" width="18" height="16" rx="7" fill={palette.glass} />
          <ellipse
            cx="28.5"
            cy="37"
            rx="4"
            ry="2.5"
            transform="rotate(-32 28.5 37)"
            fill={palette.accent}
          />
          <ellipse
            cx="35.2"
            cy="40.2"
            rx="3.6"
            ry="2.2"
            transform="rotate(16 35.2 40.2)"
            fill={palette.body}
          />
          {detailed ? (
            <ellipse
              cx="33"
              cy="34.6"
              rx="3"
              ry="1.8"
              transform="rotate(8 33 34.6)"
              fill={palette.accent}
              opacity={0.75}
            />
          ) : null}
        </>
      ) : null}
      {kind === "candy" ? (
        <>
          <path
            d="M5 32c2.5-9 10-12 15-7.5-2.2 2.4-2.4 5.1-2.2 7.5-.2 2.4 0 5.1 2.2 7.5C15 44 7.5 41 5 32z"
            fill={palette.accent}
          />
          <path
            d="M59 32c-2.5-9-10-12-15-7.5 2.2 2.4 2.4 5.1 2.2 7.5.2 2.4 0 5.1-2.2 7.5C49 44 56.5 41 59 32z"
            fill={palette.accent}
          />
          <path
            d="M8 27c2-1.4 4-1 5 .8M8 37c2 1.4 4 1 5-.8M56 27c-2-1.4-4-1-5 .8M56 37c-2 1.4-4 1-5-.8"
            stroke={palette.ink}
            strokeWidth="1"
            fill="none"
            opacity={0.18}
            strokeLinecap="round"
          />
          <rect x="17" y="21" width="30" height="22" rx="11" fill={palette.body} />
          <path
            d="M22 27c4-5 12-6 16-2"
            stroke={palette.glass}
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
          />
          {detailed ? (
            <path
              d="M20 32h24"
              stroke={palette.ink}
              strokeWidth="1.2"
              opacity={0.12}
              strokeLinecap="round"
            />
          ) : null}
        </>
      ) : null}
      {kind === "bar" ? (
        <>
          <rect x="12" y="22" width="40" height="22" rx="4" fill={palette.body} />
          <rect x="12" y="22" width="40" height="7" rx="4" fill={palette.accent} />
          {detailed ? (
            <path d="M20 36h24" stroke={palette.glass} strokeWidth="2" strokeLinecap="round" />
          ) : null}
        </>
      ) : null}
      {kind === "carton" ? (
        <>
          <path d="M18 22h28v30H18z" fill={palette.body} />
          <path d="M18 22l14-10 14 10" fill={palette.accent} />
          {detailed ? <rect x="24" y="32" width="16" height="10" rx="1" fill={palette.glass} /> : null}
        </>
      ) : null}
      {kind === "scoop" ? (
        <>
          <path d="M23.5 34L32 58.5 40.5 34z" fill={palette.body} />
          {detailed ? (
            <>
              <path
                d="M26 38h12M27.2 43h9.6M28.6 48h6.8M30 53h4"
                stroke={palette.ink}
                strokeWidth="0.7"
                opacity={0.2}
              />
              <path
                d="M27 36.5l5 4 5-4M25.8 41.5l6.2 4.8 6.2-4.8M27.4 47.5l4.6 3.6 4.6-3.6"
                stroke={palette.ink}
                strokeWidth="0.55"
                fill="none"
                opacity={0.16}
              />
            </>
          ) : null}
          <circle cx="32" cy="25.5" r="12.5" fill={palette.accent} />
          <path
            d="M21.5 28c3 8 18 8 21 0 0 0-2.4 6.8-10.5 6.8S21.5 28 21.5 28z"
            fill={palette.accent}
          />
          <ellipse cx="27.2" cy="21.2" rx="4.2" ry="3" fill={palette.glass} />
        </>
      ) : null}
      {kind === "pump" ? (
        <>
          <path d="M30 6h10" stroke={palette.ink} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M30 6v6" stroke={palette.ink} strokeWidth="2.4" strokeLinecap="round" />
          <rect x="28" y="12" width="8" height="7" rx="1.2" fill={palette.ink} />
          <path d="M24 19h16l3 8v23c0 4.2-3.4 7-11 7s-11-2.8-11-7V27z" fill={palette.body} />
          {detailed ? <rect x="26" y="32" width="12" height="8" rx="1" fill={palette.glass} /> : null}
        </>
      ) : null}
    </svg>
  );
}

export function ProductPlaceholder({
  category,
  tags = [],
  size,
  label,
}: ProductPlaceholderProps) {
  const palette = atmosphereFor(category);
  const kind = packKind(category, tags);
  const featured = size >= 120;
  const markSize = featured ? size * 0.42 : size * 0.62;

  return (
    <Box
      role="img"
      aria-label={label}
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
        bgcolor: palette.well,
        backgroundImage: `radial-gradient(ellipse 88% 40% at 50% 88%, ${palette.sweep}, transparent 70%)`,
        border: "1px solid",
        borderColor: "rgba(40, 34, 28, 0.1)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: featured ? 12 : size < 48 ? 2 : 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: featured ? 1.5 : 0,
        }}
      >
        <Box sx={{ width: markSize, height: markSize }}>
          <PackMark kind={kind} palette={palette} detailed={size >= 56} />
        </Box>
        {featured ? (
          <Typography
            sx={{
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: palette.ink,
              opacity: 0.72,
              textAlign: "center",
              lineHeight: 1.4,
              px: 1,
            }}
          >
            {category ? `${category} photo needed` : "Package photo needed"}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}
