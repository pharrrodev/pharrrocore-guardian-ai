import * as React from "react"
import { type VariantProps } from "class-variance-authority" // cva import removed

import { cn } from "@/lib/utils"
import { badgeVariants } from "./badge-variants" // Import from new file

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge } // Only export Badge component and BadgeProps (implicitly via usage)
