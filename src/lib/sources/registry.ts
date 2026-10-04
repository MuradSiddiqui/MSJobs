import { JOB_SOURCE_NAMES, type JobSourceName } from "@/lib/core/types";
import { isSourceEnabled } from "@/lib/env";
import { arbeitnowAdapter } from "@/lib/sources/adapters/arbeitnow";
import { ashbyAdapter } from "@/lib/sources/adapters/ashby";
import { bundesagenturAdapter } from "@/lib/sources/adapters/bundesagentur";
import { greenhouseAdapter } from "@/lib/sources/adapters/greenhouse";
import { leverAdapter } from "@/lib/sources/adapters/lever";
import { personioAdapter } from "@/lib/sources/adapters/personio";
import { recruiteeAdapter } from "@/lib/sources/adapters/recruitee";
import { smartrecruitersAdapter } from "@/lib/sources/adapters/smartrecruiters";
import { teamtailorAdapter } from "@/lib/sources/adapters/teamtailor";
import type { JobSourceAdapter } from "@/lib/sources/types";

export const ALL_ADAPTERS: Record<JobSourceName, JobSourceAdapter> = {
  arbeitnow: arbeitnowAdapter,
  greenhouse: greenhouseAdapter,
  ashby: ashbyAdapter,
  smartrecruiters: smartrecruitersAdapter,
  personio: personioAdapter,
  recruitee: recruiteeAdapter,
  lever: leverAdapter,
  teamtailor: teamtailorAdapter,
  bundesagentur: bundesagenturAdapter,
};

export function getAdapter(name: JobSourceName): JobSourceAdapter {
  const adapter = ALL_ADAPTERS[name];
  if (!adapter) throw new Error(`Unknown job source: ${name}`);
  return adapter;
}

export function enabledAdapters(): JobSourceAdapter[] {
  return JOB_SOURCE_NAMES.filter((name) => isSourceEnabled(name)).map(getAdapter);
}
