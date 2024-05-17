import React from "react";

export function PageCentered({children}: Readonly<{
    children: React.ReactNode;
}>) {
    return <div className={"flex justify-center items-center min-h-screen"}>
        <div>{children}</div>
    </div>
}