import { useQuery } from "@tanstack/react-query";
import { billingApi } from "@/lib/api";
import { Zap, Mail } from "lucide-react";
import { useState } from "react";

export function UsageMeter() {
  const { data } = useQuery({
    queryKey: ["usage"],
    queryFn: () => billingApi.getUsage(),
    refetchInterval: 60_000,
  });

  if (!data) return null;

  const { usage, limits } = data as any;
  const pct = Math.min(100, Math.round((usage.query / limits.query) * 100));
  const isNearLimit = pct >= 80;
  const isAtLimit = pct >= 100;

  return (
    <div className="px-3 pb-3">
      <div className="rounded-xl border border-glass-border bg-white/[0.02] p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Zap className="h-3 w-3" /> Queries
          </span>
          <span
            className={
              isAtLimit
                ? "text-destructive font-medium"
                : isNearLimit
                  ? "text-yellow-400 font-medium"
                  : "text-muted-foreground"
            }
          >
            {usage.query}/{limits.query}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isAtLimit ? "bg-destructive" : isNearLimit ? "bg-yellow-400" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {isNearLimit && (
          <RequestUpgradeButton used={usage.query} limit={limits.query} atLimit={isAtLimit} />
        )}
      </div>
    </div>
  );
}

function RequestUpgradeButton({
  used,
  limit,
  atLimit,
}: {
  used: number;
  limit: number;
  atLimit: boolean;
}) {
  const [showModal, setShowModal] = useState(false);
  const [sent, setSent] = useState(false);

  const sendRequest = () => {
    const subject = encodeURIComponent("Querify Pro Upgrade Request");
    const body = encodeURIComponent(
      `Hi Shreesh,\n\nI've used ${used}/${limit} of my monthly queries on Querify and would like to request an upgrade to increase my limit.\n\nPlease approve an increased limit for my account.\n\nThank you!`,
    );
    window.open(`mailto:dwivedishreesh8@gmail.com?subject=${subject}&body=${body}`);
    setSent(true);
    setShowModal(false);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`w-full flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
          atLimit
            ? "bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30"
            : "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 hover:bg-yellow-400/20"
        }`}
      >
        <Mail className="h-3 w-3" />
        {sent ? "Request sent!" : atLimit ? "Request upgrade" : "Approaching limit"}
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${atLimit ? "bg-destructive/10" : "bg-yellow-400/10"}`}
              >
                <Zap className={`h-5 w-5 ${atLimit ? "text-destructive" : "text-yellow-400"}`} />
              </div>
              <div>
                <div className="font-semibold text-sm">
                  {atLimit ? "Monthly limit reached" : "Approaching your limit"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {used} of {limit} queries used this month
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {atLimit
                ? "You've used all your free queries for this month. Send an upgrade request and we'll manually review and increase your limit - usually within 24 hours."
                : `You're at ${Math.round((used / limit) * 100)}% of your monthly limit. Consider requesting an upgrade before you run out.`}
            </p>

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs rounded-lg border border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20 transition"
              >
                Not now
              </button>
              <button
                onClick={sendRequest}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg font-medium transition ${
                  atLimit
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 hover:bg-yellow-400/30"
                }`}
              >
                <Mail className="h-3 w-3" />
                Send upgrade request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function SafeUsageMeter() {
  try {
    return <UsageMeter />;
  } catch {
    return null;
  }
}
