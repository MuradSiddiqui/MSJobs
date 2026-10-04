import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function relativeTime(date: Date | string): string {
  const then = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.round((then.getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (abs < 60) return rtf.format(Math.round(seconds), "second");
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(seconds / 86400), "day");
  return rtf.format(Math.round(seconds / 86400 / 30), "month");
}

export function matchLabelCopy(label: string): string {
  switch (label) {
    case "excellent":
      return "Excellent Match";
    case "strong":
      return "Strong Match";
    case "good":
      return "Good Match";
    case "possible":
      return "Possible Match";
    default:
      return "Weak Match";
  }
}

export function recommendationCopy(value: string): string {
  switch (value) {
    case "apply":
      return "Apply";
    case "worth_applying":
      return "Worth applying";
    case "possible_stretch":
      return "Possible stretch";
    default:
      return "Low priority";
  }
}

const SOURCE_LABELS: Record<string, string> = {
  arbeitnow: "Arbeitnow",
  greenhouse: "Greenhouse",
  ashby: "Ashby",
  smartrecruiters: "SmartRecruiters",
  personio: "Personio",
  recruitee: "Recruitee",
  lever: "Lever",
  teamtailor: "Teamtailor",
  bundesagentur: "Bundesagentur für Arbeit",
};

export function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? source;
}

export function employmentBadge(category: string): string {
  switch (category) {
    case "hiwi":
      return "HiWi";
    case "working_student":
      return "Werkstudent";
    case "full_time":
      return "Full-time";
    case "internship":
      return "Internship";
    case "thesis":
      return "Thesis";
    case "part_time":
      return "Part-time";
    case "contract":
      return "Contract";
    default:
      return "Other";
  }
}
