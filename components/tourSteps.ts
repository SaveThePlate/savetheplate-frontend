import { Step } from "react-joyride";

// Client home page tour steps
export const getClientHomeTourSteps = (t: (key: string) => string): Step[] => [
  {
    target: "body",
    content: t("tour.client.home.step1_content"),
    title: t("tour.client.home.step1_title"),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="pending-orders"]',
    content: t("tour.client.home.step2_content"),
    title: t("tour.client.home.step2_title"),
    placement: "bottom",
    disableBeacon: true,
    floaterProps: {
      disableAnimation: true,
    },
  },
  {
    target: '[data-tour="offers-section"]',
    content: t("tour.client.home.step3_content"),
    title: t("tour.client.home.step3_title"),
    placement: "top",
  },
  {
    target: '[data-tour="refresh-button"]',
    content: t("tour.client.home.step4_content"),
    title: t("tour.client.home.step4_title"),
    placement: "left",
  },
  {
    target: '[data-tour="navigation-menu"]',
    content: t("tour.client.home.step5_content"),
    title: t("tour.client.home.step5_title"),
    placement: "bottom",
  },
  {
    target: '[data-tour="bottom-nav"]',
    content: t("tour.client.home.step6_content"),
    title: t("tour.client.home.step6_title"),
    placement: "top",
  },
];

// Provider home page tour steps
export const getProviderHomeTourSteps = (t: (key: string) => string): Step[] => [
  {
    target: "body",
    content: t("tour.provider.home.step1_content"),
    title: t("tour.provider.home.step1_title"),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="publish-button"]',
    content: t("tour.provider.home.step2_content"),
    title: t("tour.provider.home.step2_title"),
    placement: "left",
  },
  {
    target: '[data-tour="offers-grid"]',
    content: t("tour.provider.home.step3_content"),
    title: t("tour.provider.home.step3_title"),
    placement: "top",
  },
  {
    target: '[data-tour="navigation-menu"]',
    content: t("tour.provider.home.step4_content"),
    title: t("tour.provider.home.step4_title"),
    placement: "bottom",
  },
  {
    target: '[data-tour="bottom-nav"]',
    content: t("tour.provider.home.step5_content"),
    title: t("tour.provider.home.step5_title"),
    placement: "top",
  },
];

