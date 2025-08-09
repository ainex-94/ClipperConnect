// src/components/icons/easypaisa-icon.tsx

import { cn } from "@/lib/utils";
import Image from "next/image";

export const EasypaisaIcon = ({ className }: { className?: string }) => {
    return (
        <Image
            src="https://crystalpng.com/wp-content/uploads/2024/10/Easypaisa-logo.png"
            alt="EasyPaisa"
            width={24}
            height={24}
            className={cn("rounded-sm", className)}
        />
    )
}
