export const formatCurrency = (amount) => `Rs. ${Number(amount || 0).toLocaleString()}`;

export const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};
