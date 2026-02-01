// Material Design Components (BIM Workbench Professional Interface)
export { MaterialButton } from "./MaterialButton"
export type { MaterialButtonProps } from "./MaterialButton"

export { MaterialSlider } from "./MaterialSlider"
export type { MaterialSliderProps } from "./MaterialSlider"

export { MaterialCard } from "./MaterialCard"
export type { MaterialCardProps } from "./MaterialCard"

export { MaterialDialog } from "./MaterialDialog"
export type { MaterialDialogProps } from "./MaterialDialog"

// Control Interfaces (Upgraded ceiling tool controls)
export { default as CeilingControlPanel } from "./CeilingControlPanel"
export type { CeilingControlPanelProps } from "./CeilingControlPanel"

// Theme Integration (Global Material Design integration)
export { default as ThemeWrapper, useThemeContext, useResponsive, ResponsiveWrapper } from "./ThemeWrapper"

// Original Radix UI + Tailwind Components (kept for backward compatibility)

export { Button, buttonVariants } from "./Button"
export type { ButtonProps } from "./Button"

export { Input } from "./Input"
export type { InputProps } from "./Input"

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "./Select"

export { Separator } from "./Separator"

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./Dialog"

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./Tooltip"

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "./Tabs"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./Card"

export { Toolbar } from "./Toolbar"

export { Badge, badgeVariants } from "./Badge"
export type { BadgeProps } from "./Badge"
