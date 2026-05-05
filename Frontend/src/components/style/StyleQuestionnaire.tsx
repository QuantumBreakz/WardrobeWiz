import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StylePreferencesForm } from "./StylePreferencesForm";
import type { StylePreferences, StyleQuestionnaireStep, StyleQuestionnaireResponse } from "@/types/style";

interface StyleQuestionnaireProps {
  steps: StyleQuestionnaireStep[];
  onComplete: (responses: StyleQuestionnaireResponse[], preferences: StylePreferences) => void;
  className?: string;
}

export const StyleQuestionnaire = ({
  steps,
  onComplete,
  className,
}: StyleQuestionnaireProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<StyleQuestionnaireResponse[]>([]);
  const [preferences, setPreferences] = useState<StylePreferences>({
    colors: {
      primary: [],
      secondary: [],
      accent: [],
    },
    aesthetics: [],
    fit: "Regular",
  });

  const progress = ((currentStep + 1) / (steps.length + 1)) * 100;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete(responses, preferences);
  };

  if (currentStep === steps.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Style Preferences</CardTitle>
          <CardDescription>
            Finalize your style preferences to complete the questionnaire
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <StylePreferencesForm preferences={preferences} onChange={setPreferences} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleComplete}>Complete</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const step = steps[currentStep];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{step.title}</CardTitle>
        <CardDescription>{step.question}</CardDescription>
        <Progress value={progress} className="mt-4" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {step.type === "multiple-choice" && step.options && (
            <div className="space-y-2">
              {step.options.map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    const newResponse: StyleQuestionnaireResponse = {
                      stepId: step.id,
                      answer: option,
                    };
                    setResponses([...responses.filter((r) => r.stepId !== step.id), newResponse]);
                    setTimeout(handleNext, 300);
                  }}
                >
                  {option}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {currentStep < steps.length - 1 && (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

