import React from "react";

export function AppleEmoji(props: { unified: string } & React.HTMLProps<HTMLImageElement>) {
    return <img alt={props.unified} {...props}
                src={`https://cdnjs.cloudflare.com/ajax/libs/emoji-datasource-apple/15.1.2/img/apple/64/${props.unified}.png`}/>
}