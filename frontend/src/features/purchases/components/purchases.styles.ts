// frontend/src/features/purchases/components/purchases.styles.ts
import type { CSSProperties } from "react";

export const styles = {
  page: {
    padding: "20px",
    backgroundColor: "#121212",
    color: "#fff",
    minHeight: "100vh",
  } as CSSProperties,

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
    borderBottom: "1px solid #333",
    paddingBottom: "10px",
  } as CSSProperties,

  title: { fontSize: "24px", margin: 0 } as CSSProperties,
  headerActions: { display: "flex", gap: "10px" } as CSSProperties,

  kpiRow: { display: "flex", gap: "15px", marginBottom: "20px" } as CSSProperties,
  kpiCard: {
    flex: 1,
    backgroundColor: "#1e1e1e",
    padding: "15px",
    borderRadius: "6px",
    border: "1px solid #333",
  } as CSSProperties,
  kpiLabel: { fontSize: "12px", color: "#aaa" } as CSSProperties,
  kpiValue: (color: string): CSSProperties => ({
    margin: "5px 0 0 0",
    color,
    fontSize: "22px",
  }),

  tabsRow: { display: "flex", gap: "10px", marginBottom: "20px" } as CSSProperties,
  tab: (active: boolean, activeColor: string): CSSProperties => ({
    backgroundColor: active ? "#2a2a2a" : "#1a1a1a",
    color: active ? activeColor : "#aaa",
    border: "1px solid #333",
    padding: "8px 16px",
    borderRadius: "4px 4px 0 0",
    cursor: "pointer",
    fontWeight: "bold",
  }),

  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "#1e1e1e",
    borderRadius: "6px",
    overflow: "hidden",
  } as CSSProperties,
  headRow: {
    borderBottom: "1px solid #333",
    textAlign: "left",
    color: "#aaa",
  } as CSSProperties,
  bodyRow: { borderBottom: "1px solid #222" } as CSSProperties,
  th: { padding: "12px" } as CSSProperties,
  thCenter: { padding: "12px", textAlign: "center" } as CSSProperties,
  td: { padding: "12px" } as CSSProperties,
  tdBold: { padding: "12px", fontWeight: "bold" } as CSSProperties,
  tdCenter: { padding: "12px", textAlign: "center" } as CSSProperties,

  badge: (bg: string): CSSProperties => ({
    backgroundColor: bg,
    padding: "3px 8px",
    borderRadius: "3px",
    fontSize: "11px",
    fontWeight: "bold",
  }),

  headerButton: (bg: string): CSSProperties => ({
    backgroundColor: bg,
    color: "#fff",
    border: "none",
    padding: "10px 15px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
  }),
  rowButton: (bg: string): CSSProperties => ({
    backgroundColor: bg,
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
  }),
};