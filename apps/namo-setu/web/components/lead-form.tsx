"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@foundation/ui";

const leadSchema = z.object({
  name: z.string().min(2, "Enter at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  organization: z.string().min(2, "Enter your organization name"),
});

type LeadFormValues = z.infer<typeof leadSchema>;

export function LeadForm({ title }: { title: string }) {
  const [submitted, setSubmitted] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: { name: "", email: "", organization: "" },
  });

  const onSubmit = handleSubmit(async () => {
    setSubmitted(true);
    reset();
  });

  return (
    <Card className="border-slate-200/80 bg-white/90 backdrop-blur">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Validated form flow wired with React Hook Form and Zod.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Full name" {...register("name")} />
            {errors.name ? <p className="text-sm text-red-600">{errors.name.message}</p> : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="name@company.com" {...register("email")} />
            {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="organization">Organization</Label>
            <Input id="organization" placeholder="Organization name" {...register("organization")} />
            {errors.organization ? <p className="text-sm text-red-600">{errors.organization.message}</p> : null}
          </div>
          <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
          {submitted ? <p className="text-sm text-emerald-700">Form accepted locally. Backend integration comes later.</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
