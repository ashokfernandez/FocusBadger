export const HEADER_LAYOUT = {
  container: {
    w: "full",
    ml: { md: "auto" },
    align: { base: "stretch", md: "center" },
    justify: { base: "flex-start", md: "flex-end" },
    direction: { base: "column", md: "row" },
    gap: { base: 3, md: 4 }
  },
  stack: {
    w: { base: "full", md: "auto" },
    direction: { base: "column", sm: "row" },
    spacing: { base: 2, sm: 3 },
    align: { base: "stretch", sm: "center" },
    justify: { base: "stretch", sm: "flex-end" },
    flexWrap: { base: "nowrap", sm: "wrap" },
    flex: { base: "1 1 auto", md: "0 0 auto" }
  },
  button: {
    w: { base: "full", sm: "auto" }
  }
};

export const MATRIX_GRID_COLUMNS = { base: 1, md: 2, xl: 4 };
