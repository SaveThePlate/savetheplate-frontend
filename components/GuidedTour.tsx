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
  const [mounted, setMounted] = useState(false);

  // Set mounted to true after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if tour should run externally
  useEffect(() => {
    if (externalRun !== undefined) {
      setRun(externalRun);
    }
  }, [externalRun]);

  const removeTourFromPage = () => {
    // Force remove any remaining overlay/tooltip elements from DOM
    setTimeout(() => {
      // Remove joyride overlay and tooltip elements
      const joyrideElements = document.querySelectorAll('[class*="__floater"], [class*="__overlay"], [class*="__tooltip"]');
      joyrideElements.forEach(el => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
      // Also remove by data attributes if they exist
      const overlays = document.querySelectorAll('[data-joyride-overlay], [data-testid="joyride-overlay"]');
      overlays.forEach(el => el.remove());
      const tooltips = document.querySelectorAll('[data-joyride-tooltip], [data-testid="joyride-tooltip"]');
      tooltips.forEach(el => el.remove());
    }, 100);
  };

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      setStepIndex(0); // Reset to beginning
      localStorage.setItem(`tour-${tourKey}-completed`, "true");
      // Remove tour elements from page
      removeTourFromPage();
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

  const closeTour = () => {
    // Immediately stop the tour, reset step, and remove from page
    setRun(false);
    setStepIndex(0);
    localStorage.setItem(`tour-${tourKey}-completed`, "true");
    // Remove tour elements from page
    removeTourFromPage();
    if (onTourComplete) {
      onTourComplete();
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
        hideCloseButton={true}
        disableOverlayClose={true}
        disableScrolling={false}
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
            position: "relative",
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
          buttonClose: {
            color: "#6B7280",
            fontSize: 18,
            fontWeight: "bold",
            padding: "4px 8px",
            borderRadius: "4px",
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            position: "absolute",
            top: "8px",
            right: "8px",
            width: "28px",
            height: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: "1",
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
      {mounted && (
        <button
          onClick={startTour}
          className="flex items-center hover:text-green-600 transition-colors text-gray-700"
          title={t("tour.start_guide") || "Start guided tour"}
        >
          <HelpCircle size={18} />
        </button>
      )}
    </>
  );
};

export default GuidedTour;

