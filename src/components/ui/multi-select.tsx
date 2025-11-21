
'use client';

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, X, ChevronsUpDown, Trash2, Tag } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "./button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


const multiSelectVariants = cva(
  "m-1",
  {
    variants: {
      variant: {
        default:
          "border-foreground/10 text-foreground bg-card hover:bg-card/80",
        secondary:
          "border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        inverted:
          "inverted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface Option {
    value: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
}

interface MultiSelectProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof multiSelectVariants> {
  options: Option[];
  onValueChange: (value: string[]) => void;
  defaultValue?: string[];
  placeholder?: string;
  animation?: number;
  maxCount?: number;
  asChild?: boolean;
  className?: string;
}

export const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(({ 
    options,
    onValueChange,
    variant,
    defaultValue = [],
    placeholder = "Select options",
    ...props 
}, ref) => {

    const [selectedValues, setSelectedValues] = React.useState<string[]>(defaultValue);
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

    React.useEffect(() => {
        if (JSON.stringify(selectedValues) !== JSON.stringify(defaultValue)) {
            setSelectedValues(defaultValue);
        }
    }, [defaultValue, selectedValues]);

    const handleSelect = (value: string) => {
        const newSelectedValues = selectedValues.includes(value)
            ? selectedValues.filter(v => v !== value)
            : [...selectedValues, value];
        setSelectedValues(newSelectedValues);
        onValueChange(newSelectedValues);
    };

    const togglePopover = () => setIsPopoverOpen(prev => !prev);

    return (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
                <Button
                    ref={ref}
                    {...props}
                    onClick={togglePopover}
                    className="flex w-full p-1 rounded-md border min-h-10 h-auto items-center justify-between bg-inherit hover:bg-card"
                >
                    {selectedValues.length > 0 ? (
                        <div className="flex justify-between items-center w-full">
                             <div className="flex flex-wrap items-center">
                                {selectedValues.map(value => {
                                    const option = options.find(o => o.value === value);
                                    const Icon = option?.icon;
                                    return (
                                        <Badge key={value} className={cn(multiSelectVariants({ variant }))}>
                                            {Icon && <Icon className="h-4 w-4 mr-2" />} 
                                            {option?.label}
                                            <X
                                                className="h-4 w-4 ml-2 cursor-pointer"
                                                onClick={(e) => { e.stopPropagation(); handleSelect(value); }}
                                            />
                                        </Badge>
                                    );
                                })}
                            </div>
                            <div className="flex items-center justify-between">
                                <X className="h-4 w-4 text-muted-foreground cursor-pointer" onClick={(e) => { e.stopPropagation(); onValueChange([]); setSelectedValues([]);}}/>
                                <ChevronsUpDown className="h-4 w-4 ml-2 text-muted-foreground" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between w-full mx-auto">
                            <span className="text-sm text-muted-foreground">{placeholder}</span>
                            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                    <CommandInput placeholder="Search..." />
                    <CommandEmpty>No options found.</CommandEmpty>
                    <CommandGroup>
                        {options.map(option => (
                            <CommandItem key={option.value} onSelect={() => handleSelect(option.value)}>
                                <Check className={cn("h-4 w-4 mr-2", selectedValues.includes(option.value) ? "opacity-100" : "opacity-0" )} />
                                {option.icon && <option.icon className="h-4 w-4 mr-2 text-muted-foreground" />}
                                {option.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
});

MultiSelect.displayName = 'MultiSelect';
