import { cn } from "@/lib/utils"
import { Loader2Icon } from "lucide-react"
import type { SVGProps } from "react";

function Spinner({
  className,
  ...props
}: SVGProps<SVGSVGElement>){
  return (
    <Loader2Icon
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props} />
  );
}

export { Spinner }
