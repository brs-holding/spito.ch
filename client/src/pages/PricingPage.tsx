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
    name: "Basis",
    price: "99",
    description: "Grundlegende Funktionen für das Gesundheitsmanagement",
    features: [
      "Patientenverwaltung",
      "Einfache Terminplanung",
      "Medizinische Dokumentenverwaltung",
      "Basis-Berichterstattung",
      "E-Mail-Support",
    ],
  },
  {
    name: "Professional",
    price: "199",
    description: "Erweiterte Funktionen für wachsende Praxen",
    features: [
      "Alle Basis-Funktionen",
      "Erweiterte Terminplanung",
      "Dokumentenmanagement",
      "Individuelle Berichte",
      "Prioritäts-Support",
      "Team-Zusammenarbeit",
    ],
  },
  {
    name: "Enterprise",
    price: "299",
    description: "Komplettlösung für Gesundheitseinrichtungen",
    features: [
      "Alle Professional-Funktionen",
      "Individuelle Workflows",
      "API-Zugang",
      "Erweiterte Analysen",
      "24/7 Telefon-Support",
      "Individuelle Integrationen",
      "Schulungen",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight">Einfache, transparente Preise</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            30 Tage kostenlos testen, keine Kreditkarte erforderlich
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
                  <span className="text-muted-foreground"> CHF/Monat</span>
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
                  <Button className="w-full">Kostenlos Testen</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}