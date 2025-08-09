// src/components/icons/jazzcash-icon.tsx

import { cn } from "@/lib/utils";
import Image from "next/image";

export const JazzcashIcon = ({ className }: { className?: string }) => {
    return (
        <Image
            src="https://play-lh.googleusercontent.com/VttJV40yOO8i222Kx_2_65b_Fl_2fL-1aC7S7-a_22_3Yv-V5Rj9e0c_M-A"
            alt="JazzCash"
            width={24}
            height={24}
            className={cn("rounded-sm", className)}
        />
    )
}

    