"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STORAGE_KEY = "sih-gitam-nav:seen-bonus-dialog";

const TIERS = [
  {
    label: "Easy",
    bonus: "+0",
    badgeClass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    note: "No bonus points",
  },
  {
    label: "Medium",
    bonus: "+25",
    badgeClass: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    note: "25 bonus points",
  },
  {
    label: "Hard",
    bonus: "+50",
    badgeClass: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    note: "50 bonus points",
  },
] as const;

export function BonusPointsDialog() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time first-visit check against localStorage
        setOpen(true);
      }
    } catch {
      // localStorage unavailable; skip the dialog
    }
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && dismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-2">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            <DialogTitle>Pick a bigger challenge, earn bonus points</DialogTitle>
          </div>
          <DialogDescription>
            Your choice of difficulty comes with bonus points on top of your base score.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1">
          {TIERS.map((tier) => (
            <div
              key={tier.label}
              className="flex items-center justify-between rounded-lg border border-border p-3"
            >
              <div className="flex items-center gap-2">
                <Badge className={`border-transparent px-2 py-1 font-medium ${tier.badgeClass}`}>
                  {tier.label}
                </Badge>
                <span className="text-sm text-muted-foreground">{tier.note}</span>
              </div>
              <span className="font-mono text-sm font-semibold">{tier.bonus}</span>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={dismiss} className="w-full sm:w-auto">
            Got it, let&apos;s explore
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
