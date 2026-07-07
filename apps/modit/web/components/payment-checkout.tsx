"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createApiClient } from "@foundation/api-client";
import {
  CreditCard,
  Loader2,
  CheckCircle2,
  XCircle,
  Receipt,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { Button, Input, Card, CardHeader, CardContent, CardFooter } from "@/lib/modit-ui";
import { getAccessToken } from "@/lib/auth";
import { env } from "@/lib/env";

interface PaymentCheckoutProps {
  amount: number;
  currency: string;
  description: string;
  onSuccess?: (receipt: PaymentReceipt) => void;
  onFailure?: (error: Error) => void;
}

interface PaymentReceipt {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  receipt_url?: string;
}

interface CardForm {
  number: string;
  exp: string;
  cvc: string;
  name: string;
}

export function PaymentCheckout({
  amount,
  currency,
  description,
  onSuccess,
  onFailure,
}: PaymentCheckoutProps) {
  const [step, setStep] = useState<"form" | "processing" | "success" | "error">("form");
  const [card, setCard] = useState<CardForm>({ number: "", exp: "", cvc: "", name: "" });
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const processPayment = useMutation({
    mutationFn: async () => {
      const client = createApiClient({
        baseUrl: env.NEXT_PUBLIC_API_BASE_URL,
        accessToken: getAccessToken(),
      });
      const data = await client.request<PaymentReceipt>("/api/v1/payments/create", {
        method: "POST",
        body: JSON.stringify({
          amount,
          currency,
          description,
          card: { token: "tok_simulated_" + Date.now() },
        }),
      });
      return data;
    },
    onSuccess: (data) => {
      setReceipt(data);
      setStep("success");
      onSuccess?.(data);
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || "Payment failed. Please try again.");
      setStep("error");
      onFailure?.(err);
    },
  });

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  const handleSubmit = () => {
    setStep("processing");
    processPayment.mutate();
  };

  if (step === "processing") {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <Loader2 className="h-10 w-10 animate-spin text-[var(--brand)]" />
          <p className="text-sm font-medium text-[var(--text-primary)]">Processing payment...</p>
          <p className="text-xs text-[var(--text-muted)]">Please do not close this window</p>
        </CardContent>
      </Card>
    );
  }

  if (step === "success" && receipt) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Payment Successful</h3>
          <p className="text-sm text-[var(--text-muted)]">Your payment has been recorded.</p>

          <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4 space-y-2 mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Amount</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {currency} {amount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Status</span>
              <span className="text-emerald-600 font-medium capitalize">{receipt.status}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Transaction ID</span>
              <span className="font-mono text-xs text-[var(--text-primary)]">{receipt.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Date</span>
              <span className="text-[var(--text-primary)]">
                {new Date(receipt.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-2">
            <Receipt className="h-3.5 w-3.5" />
            <span>A receipt has been sent to your email</span>
          </div>

          <Button variant="secondary" className="mt-2" onClick={() => setStep("form")}>
            <ArrowLeft className="h-4 w-4" />
            Done
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "error") {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Payment Failed</h3>
          <p className="text-sm text-red-600">{errorMessage}</p>
          <Button variant="secondary" onClick={() => setStep("form")}>
            <ArrowLeft className="h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Payment Details</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl bg-[var(--brand-bg)] p-4 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--brand)]">Amount Due</p>
          <p className="mt-1 text-3xl font-bold text-[var(--text-primary)]">
            {currency} {amount.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{description}</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-[var(--text-primary)]">Cardholder Name</label>
            <Input
              placeholder="Name on card"
              value={card.name}
              onChange={(e) => setCard({ ...card, name: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--text-primary)]">Card Number</label>
            <div className="relative mt-1">
              <Input
                placeholder="1234 5678 9012 3456"
                value={card.number}
                onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                maxLength={19}
              />
              <CreditCard className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)]">Expiry</label>
              <Input
                placeholder="MM/YY"
                value={card.exp}
                onChange={(e) => setCard({ ...card, exp: formatExpiry(e.target.value) })}
                maxLength={5}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)]">CVC</label>
              <Input
                placeholder="123"
                value={card.cvc}
                onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                maxLength={4}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-[var(--bg-subtle)] p-3 text-xs text-[var(--text-muted)]">
          <Shield className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>Secure payment. No real charges will be made in demo mode.</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={!card.name || card.number.replace(/\s/g, "").length < 16 || card.exp.length < 5 || card.cvc.length < 3}
        >
          <CreditCard className="h-4 w-4" />
          Pay {currency} {amount.toFixed(2)}
        </Button>
      </CardFooter>
    </Card>
  );
}
