"use client";

import { useState, useEffect } from "react";
import TopBar from "@/components/shared/TopBar";
import BottomNav from "@/components/shared/BottomNav";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { Label } from "recharts";

export default function ResidentWalletPage() {
  const { user } = useAuthStore();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-KE', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateString));
  };
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const [topupOpen, setTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupLoading, setTopupLoading] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const [balanceRes, txRes] = await Promise.all([
        api.get("/resident/wallet"),
        api.get("/resident/wallet/transactions"),
      ]);
      setBalance(Number(balanceRes.data.data.balance));
      setTransactions(txRes.data.data.data);
    } catch (error) {
      console.error("Failed to fetch wallet data", error);
      toast.error("Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (amount < 50) {
      toast.error("Minimum withdrawal amount is KES 50");
      return;
    }
    if (balance && amount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    setWithdrawLoading(true);
    try {
      await api.post("/resident/wallet/withdraw", {
        amount,
        phone: user?.phone,
      });
      toast.success("Withdrawal initiated successfully");
      setWithdrawOpen(false);
      setWithdrawAmount("");
      fetchWalletData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Withdrawal failed");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleTopup = async () => {
    const amount = Number(topupAmount);
    if (amount < 1) {
      toast.error("Invalid amount");
      return;
    }

    setTopupLoading(true);
    try {
      await api.post("/payments/mpesa/stkpush", {
        type: "wallet_topup",
        amount,
        phone_number: user?.phone,
      });
      toast.success("Top-up initiated. Check your phone for M-Pesa prompt.");
      setTopupOpen(false);
      setTopupAmount("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to initiate top-up");
    } finally {
      setTopupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-20">
      <TopBar title="My Wallet" showBack />

      <main className="px-4 py-6">
        <section className="bg-primary text-white rounded-2xl p-6 shadow-md mb-8">
          <div className="flex items-center space-x-3 mb-2 opacity-90">
            <Wallet className="w-5 h-5" />
            <h2 className="text-sm font-medium uppercase tracking-wider">
              Available Balance
            </h2>
          </div>
          {loading ? (
            <Skeleton className="h-10 w-32 bg-white/20 rounded mt-2" />
          ) : (
            <div className="text-4xl font-bold font-display tracking-tight">
              {formatCurrency(balance || 0)}
            </div>
          )}

          <div className="mt-6 flex space-x-3">
            <Button
              variant="outline"
              className="w-full bg-white text-primary hover:bg-gray-100 font-semibold"
              onClick={() => setTopupOpen(true)}
            >
              Top Up
            </Button>
            <Button
              variant="secondary"
              className="w-full bg-white/20 text-white hover:bg-white/30 border-none font-semibold"
              onClick={() => setWithdrawOpen(true)}
              disabled={loading || !balance || balance < 50}
            >
              Withdraw
            </Button>
          </div>
        </section>

        <section>
          <h3 className="font-semibold text-lg text-text-primary mb-4">
            Recent Transactions
          </h3>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-border">
              <p className="text-text-muted">No transactions yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="bg-white p-4 rounded-xl border border-border flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${tx.amount > 0 ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent-dark'
                      }`}>
                      {tx.amount > 0 ? <ArrowDownCircle className="w-6 h-6" /> : <ArrowUpCircle className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary line-clamp-1">{tx.description}</p>
                      <div className="flex items-center text-xs text-text-muted mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDate(tx.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.amount > 0 ? 'text-success' : 'text-text-primary'}`}>
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </p>
                    <div className="flex justify-end mt-1">
                      {tx.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-success" />}
                      {tx.status === 'pending' && <Clock className="w-4 h-4 text-warning" />}
                      {tx.status === 'failed' && <XCircle className="w-4 h-4 text-error" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="w-11/12 max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Withdraw to M-Pesa</DialogTitle>
            <DialogDescription>
              Funds will be sent to your registered number: <span className="font-semibold text-text-primary">{user?.phone}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Amount (KES)</label>
            <Input
              type="number"
              placeholder="e.g. 500"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="mt-2 text-lg"
              min={50}
            />
            <p className="text-xs text-text-muted mt-2">Minimum withdrawal: KES 50</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>Cancel</Button>
            <Button onClick={handleWithdraw} disabled={withdrawLoading || !withdrawAmount}>
              {withdrawLoading ? "Processing..." : "Confirm Withdrawal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
        <DialogContent className="w-11/12 max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Top Up Wallet</DialogTitle>
            <DialogDescription>
              Enter the amount to add to your wallet via M-Pesa.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Amount (KES)</Label>
            <Input
              type="number"
              placeholder="e.g. 1000"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              className="mt-2 text-lg"
              min={1}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopupOpen(false)}>Cancel</Button>
            <Button onClick={handleTopup} disabled={topupLoading || !topupAmount}>
              {topupLoading ? "Processing..." : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
