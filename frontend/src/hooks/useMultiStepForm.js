
import { useState } from 'react';

export function useMultiStepForm(stepsCount) {
  const [currentStep, setCurrentStep] = useState(1);

  function next() {
    if (currentStep < stepsCount) setCurrentStep(prev => prev + 1);
  }

  function back() {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  }

  function goTo(step) {
    setCurrentStep(step);
  }

  return {
    currentStep,
    next,
    back,
    goTo,
    isFirst: currentStep === 1,
    isLast: currentStep === stepsCount
  };
}
