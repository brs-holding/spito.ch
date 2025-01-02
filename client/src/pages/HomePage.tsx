import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  ClipboardList, 
  Calendar, 
  UserPlus, 
  Shield, 
  Clock, 
  CheckCircle 
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Optimieren Sie Ihre Gesundheitspraxis
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Eine umfassende digitale Gesundheitsplattform, entwickelt zur Verbesserung der Patientenversorgung
              und Vereinfachung des Praxismanagements.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/register">
                <Button size="lg">Kostenlos Testen</Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg">Preise Anzeigen</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Alles, was Sie für Ihre Praxis brauchen
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <ClipboardList className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Patientenverwaltung</CardTitle>
                <CardDescription>
                  Verwalten Sie Patientenakten, Termine und Behandlungspläne effizient an einem Ort.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Calendar className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Intelligente Terminplanung</CardTitle>
                <CardDescription>
                  Optimieren Sie die Terminbuchung und reduzieren Sie Ausfälle durch automatische Erinnerungen.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Sicher & Konform</CardTitle>
                <CardDescription>
                  DSGVO-konforme Plattform, die Ihre Patientendaten zuverlässig schützt.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            So funktioniert's
          </h2>
          <div className="max-w-3xl mx-auto">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <UserPlus className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">1. Registrieren Sie Ihre Praxis</h3>
                  <p className="text-muted-foreground">
                    Melden Sie sich in wenigen Minuten an und passen Sie die Plattform an Ihre Praxisbedürfnisse an.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">2. Starten Sie Ihre kostenlose Testphase</h3>
                  <p className="text-muted-foreground">
                    Testen Sie 30 Tage lang alle Funktionen kostenlos, keine Kreditkarte erforderlich.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">3. Transformieren Sie Ihre Praxis</h3>
                  <p className="text-muted-foreground">
                    Optimieren Sie Ihre Abläufe und verbessern Sie die Patientenversorgung mit unseren umfassenden Tools.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Bereit, Ihre Gesundheitspraxis zu transformieren?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90">
            Schließen Sie sich tausenden Gesundheitsdienstleistern an, die Spito.ch vertrauen
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary">
              Kostenlose Testphase Starten
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}