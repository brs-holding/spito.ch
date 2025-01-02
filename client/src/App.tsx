import { Switch, Route } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import PatientDashboard from "./pages/PatientDashboard";
import PatientRegistration from "./pages/PatientRegistration";
import PricingPage from "./pages/PricingPage";
import HomePage from "./pages/HomePage";
import { EmployeeManagement } from "@/components/dashboard/EmployeeManagement";
import PatientsPage from "./pages/PatientsPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import SchedulePage from "./pages/SchedulePage";
import TasksPage from "./pages/TasksPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import { OnboardingTutorial } from "@/components/onboarding/OnboardingTutorial";
import { useUser } from "./hooks/use-user";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/ui/Header";

function App() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // If user is not logged in, show public routes
  if (!user) {
    return (
      <>
        <Header />
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/pricing" component={PricingPage} />
          <Route path="/register">
            <AuthPage isRegister={true} />
          </Route>
          <Route path="/login">
            <AuthPage />
          </Route>
          <Route>
            <HomePage />
          </Route>
        </Switch>
        <Toaster />
      </>
    );
  }

  // Only allow spitex_org and super_admin to access analytics
  const canAccessAnalytics = ["spitex_org", "super_admin"].includes(user.role);

  return (
    <>
      <Header />
      <main className="pt-16">
        <Switch>
          <Route path="/" component={user.role === "patient" ? PatientDashboard : Dashboard} />
          <Route path="/register-patient" component={PatientRegistration} />
          <Route path="/pricing" component={PricingPage} />
          <Route path="/employees">
            {user.role === "spitex_org" ? <EmployeeManagement /> : <NotFound />}
          </Route>
          <Route path="/patients" component={PatientsPage} />
          <Route path="/appointments" component={AppointmentsPage} />
          <Route path="/schedule" component={SchedulePage} />
          <Route path="/tasks" component={TasksPage} />
          <Route path="/analytics">
            {canAccessAnalytics ? <AnalyticsPage /> : <NotFound />}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
      <OnboardingTutorial />
      <Toaster />
    </>
  );
}

// fallback 404 not found page
function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            The page you're looking for doesn't exist.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;