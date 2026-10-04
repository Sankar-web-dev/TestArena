"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value: Date | undefined;
  onChange: (value: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
}

/**
 * Date + time picker composed of shadcn Calendar/Popover
 * with a native time input. Returns a Date or undefined.
 */
export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date & time",
  disabled,
  "aria-invalid": ariaInvalid,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);

  const timeValue = value ? format(value, "HH:mm") : "00:00";

  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!value) return;
    const [hours, minutes] = e.target.value.split(":").map(Number);
    const next = new Date(value);
    next.setHours(hours ?? 0, minutes ?? 0, 0, 0);
    onChange(next);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={ariaInvalid}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
            )}
          />
        }
      >
        <CalendarIcon className="size-4" />
        {value ? format(value, "PPP p") : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            if (!date) {
              onChange(undefined);
              return;
            }
            const next = new Date(date);
            if (value) {
              next.setHours(value.getHours(), value.getMinutes(), 0, 0);
            } else {
              next.setHours(9, 0, 0, 0);
            }
            onChange(next);
          }}
          autoFocus
        />
        <div className="flex items-center gap-3 border-t p-3">
          <div className="flex-1 space-y-1">
            <Label htmlFor="dtp-time" className="text-xs">
              Time
            </Label>
            <Input
              id="dtp-time"
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              disabled={!value}
            />
          </div>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-5"
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
              aria-label="Clear date"
            >
              <XIcon />
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
