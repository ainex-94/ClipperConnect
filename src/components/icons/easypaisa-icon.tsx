// src/components/icons/easypaisa-icon.tsx

import { cn } from "@/lib/utils";
import Image from "next/image";

export const EasypaisaIcon = ({ className }: { className?: string }) => {
    return (
        <Image
            src="https://play-lh.googleusercontent.com/unfO2Fg_9Y2bk0yI1uWpE_N4tJBb03f0Qv1v2CV14IK2XQk802S4lK-Gk0i_Gb25lA"
            alt="EasyPaisa"
            width={24}
            height={24}
            className={cn("rounded-sm", className)}
        />
    )
}

    