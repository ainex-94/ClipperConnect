// src/components/icons/jazzcash-icon.tsx

import { cn } from "@/lib/utils";
import Image from "next/image";

export const JazzcashIcon = ({ className }: { className?: string }) => {
    return (
        <Image
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/JazzCash_logo_%282025%29.png/960px-JazzCash_logo_%282025%29.png"
            alt="JazzCash"
            width={24}
            height={24}
            className={cn("rounded-sm", className)}
        />
    )
}
