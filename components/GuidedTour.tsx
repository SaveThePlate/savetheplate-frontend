"use client";

import React, { useState, useEffect } from "react";
import Joyride, { Step, CallBackProps, STATUS, EVENTS } from "react-joyride";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface GuidedTourProps {
  steps: Step[];
  tourKey: string; // Unique key to track if tour was completed (e.g., "client-home", "provider-home")
  run?: boolean; // Optional: control tour externally
  onTourComplete?: () => void;
}

const GuidedTour: React.FC<GuidedTourProps> = ({
  steps,
  tourKey,
  run: externalRun,
  onTourComplete,
}) => {
  const { t } = useLanguage();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Check if tour should run externally
  useEffect(() => {
    if (externalRun !== undefined) {
      setRun(externalRun);
    }
  }, [externalRun]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      localStorage.setItem(`tour-${tourKey}-completed`, "true");
      if (onTourComplete) {
        onTourComplete();
      }
    } else if (type === EVENTS.STEP_AFTER) {
      // Move to next step
      setStepIndex(index + 1);
    } else if (type === EVENTS.TARGET_NOT_FOUND) {
      // Skip step if target not found (e.g., pending orders banner not visible)
      setStepIndex(index + 1);
    }
  };

  const startTour = () => {
    setStepIndex(0);
    setRun(true);
    localStorage.removeItem(`tour-${tourKey}-completed`); // Allow restart
  };

  return (
    <>
      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        callback={handleJoyrideCallback}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        styles={{
          options: {
            primaryColor: "#A8DADC",
            textColor: "#344E41",
            overlayColor: "rgba(0, 0, 0, 0.5)",
            arrowColor: "#A8DADC",
            backgroundColor: "#FFFFFF",
            beaconSize: 36,
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: 12,
            padding: 20,
          },
          tooltipContainer: {
            textAlign: "left",
          },
          buttonNext: {
            backgroundColor: "#A8DADC",
            color: "#1D3557",
            fontSize: 14,
            fontWeight: 600,
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
          },
          buttonBack: {
            color: "#344E41",
            marginRight: 10,
            fontSize: 14,
          },
          buttonSkip: {
            color: "#6B7280",
            fontSize: 14,
          },
        }}
        locale={{
          back: t("tour.back") || "Back",
          close: t("tour.close") || "Close",
          last: t("tour.last") || "Last",
          next: t("tour.next") || "Next",
          open: t("tour.open") || "Open",
          skip: t("tour.skip") || "Skip",
        }}
      />
      <Button
        onClick={startTour}
        variant="outline"
        size="icon"
        className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg bg-white hover:bg-gray-50 border-2 border-[#A8DADC]"
        title={t("tour.start_guide") || "Start guided tour"}
      >
        <HelpCircle className="h-5 w-5 text-[#344E41]" />
      </Button>
    </>
  );
};

export default GuidedTour;

