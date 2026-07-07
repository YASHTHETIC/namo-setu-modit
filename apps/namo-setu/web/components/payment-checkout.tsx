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
import { Button, Input, Card, CardHeader, CardContent, CardFooter } from "./namo-ui";
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
          <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
          <p className="text-sm font-medium text-slate-700">Processing your payment...</p>
          <p className="text-xs text-slate-500">Please do not close this window</p>
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
          <h3 className="text-lg font-semibold text-slate-900">Payment Successful</h3>
          <p className="text-sm text-slate-500">Your donation has been recorded.</p>

          <div className="w-full rounded-xl border border-stone-200/60 bg-stone-50 p-4 space-y-2 mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Amount</span>
              <span className="font-semibold text-slate-900">
                {currency} {amount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Status</span>
              <span className="text-emerald-600 font-medium capitalize">{receipt.status}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Transaction ID</span>
              <span className="font-mono text-xs text-slate-700">{receipt.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Date</span>
              <span className="text-slate-700">
                {new Date(receipt.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
            <Receipt className="h-3.5 w-3.5" />
            <span>A receipt has been sent to your email</span>
          </div>

          <Button variant="outline" className="mt-2" onClick={() => setStep("form")}>
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
          <h3 className="text-lg font-semibold text-slate-900">Payment Failed</h3>
          <p className="text-sm text-red-600">{errorMessage}</p>
          <Button variant="outline" onClick={() => setStep("form")}>
            <ArrowLeft className="h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader title="Payment Details" />
      <CardContent className="space-y-4">
        <div className="rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 p-4 text-center">
          <p className="text-xs font-medium text-orange-600 uppercase tracking-wider">Amount</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {currency} {amount.toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Cardholder Name</label>
            <Input
              placeholder="Name on card"
              value={card.name}
              onChange={(e) => setCard({ ...card, name: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Card Number</label>
            <div className="relative mt-1">
              <Input
                placeholder="1234 5678 9012 3456"
                value={card.number}
                onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                maxLength={19}
              />
              <CreditCard className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Expiry</label>
              <Input
                placeholder="MM/YY"
                value={card.exp}
                onChange={(e) => setCard({ ...card, exp: formatExpiry(e.target.value) })}
                maxLength={5}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">CVC</label>
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

        <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          <Shield className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>This is a simulated payment. No real charges will be made.</span>
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
