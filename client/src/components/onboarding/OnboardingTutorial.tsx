import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useUser } from '@/hooks/use-user';

interface TutorialStep {
  title: string;
  description: string;
  icon: JSX.Element;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to Healthcare Admin",
    description: "Let's get you started with managing healthcare services efficiently.",
    icon: <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 4v.01M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="10" />
    </svg>
  },
  {
    title: "Patient Management",
    description: "View and manage patient information, medical history, and care plans all in one place.",
    icon: <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  },
  {
    title: "Appointments",
    description: "Schedule and manage appointments with an intuitive calendar interface.",
    icon: <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  },
  {
    title: "Medical Records",
    description: "Securely store and access patient medical records, prescriptions, and test results.",
    icon: <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 17h6M9 12h6M9 7h6M5 22h14a2 2 0 002-2V4a2 2 0 00-2-2H5a2 2 0 00-2 2v16a2 2 0 002 2z" />
    </svg>
  }
];

export function OnboardingTutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    // Check if user has completed tutorial
    const hasCompletedTutorial = localStorage.getItem('onboardingComplete');
    if (hasCompletedTutorial) {
      setIsVisible(false);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTutorial = () => {
    localStorage.setItem('onboardingComplete', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed inset-x-0 bottom-0 z-50 p-4 md:p-6"
      >
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={completeTutorial}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center text-center space-y-4"
            >
              <div className="text-primary">
                {tutorialSteps[currentStep].icon}
              </div>
              <h3 className="text-lg font-semibold">
                {tutorialSteps[currentStep].title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {tutorialSteps[currentStep].description}
              </p>
            </motion.div>

            <div className="flex justify-between items-center mt-6">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex gap-1">
                {tutorialSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 w-1.5 rounded-full ${
                      index === currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <Button
                onClick={handleNext}
                className="flex items-center gap-2"
              >
                {currentStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
                {currentStep < tutorialSteps.length - 1 && (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
