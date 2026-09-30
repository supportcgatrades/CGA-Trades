export const broadcastActivity = async (
  name: string,
  actionText: string,
  amountText?: string,
  isAmountPositive?: boolean,
  flag?: string
) => {
  try {
    await fetch("/api/broadcast-activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, actionText, amountText, isAmountPositive, flag })
    });
  } catch (err) {
    console.warn("Could not broadcast live activity:", err);
  }
};
