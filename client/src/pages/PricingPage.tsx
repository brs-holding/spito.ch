import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "wouter";

const tiers = [
  {
    name: "Basic",
    price: "99",
    description: "Essential healthcare management features",
    features: [
      "Patient management",
      "Basic appointment scheduling",
      "Medical records storage",
      "Basic reporting",
      "Email support",
    ],
  },
  {
    name: "Medium",
    price: "199",
    description: "Advanced features for growing practices",
    features: [
      "All Basic features",
      "Advanced scheduling",
      "Document management",
      "Custom reporting",
      "Priority support",
      "Team collaboration",
    ],
  },
  {
    name: "Expert",
    price: "299",
    description: "Complete solution for healthcare institutions",
    features: [
      "All Medium features",
      "Custom workflows",
      "API access",
      "Advanced analytics",
      "24/7 phone support",
      "Custom integrations",
      "Training sessions",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight">Simple, transparent pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            30-day free trial, no credit card required
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {tiers.map((tier) => (
            <Card key={tier.name} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mb-4">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground"> CHF/month</span>
                </div>
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/register">
                  <Button className="w-full">Start Free Trial</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
