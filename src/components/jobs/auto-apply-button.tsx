"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export function AutoApplyButton() {
  return (
    <Button asChild>
      <Link href="/jobs/auto-apply">
        <Zap className="mr-2 h-4 w-4" /> Auto-Apply Queue
      </Link>
    </Button>
  );
}
