import React, {useState} from "react";
import EmojiPicker from "@emoji-mart/react";
import {Button} from "@/components/ui/button";
import {Pencil} from "lucide-react";
import {AppleEmoji} from "@/components/apple-emoji";

interface EmojiIconInputProps {
    value: string;
    disabled: boolean;
    onChange: (value: string) => void;
}

export function EmojiIconInput({value, disabled, onChange}: EmojiIconInputProps) {
    const [emojiPickerShown, setEmojiPickerShown] = useState(false);

    return emojiPickerShown ?
        <EmojiPicker set={"apple"} onEmojiSelect={(emoji: { unified: string }) => {
            setEmojiPickerShown(false);
            onChange(emoji.unified);
        }}/> :
        <>
            <div className={"flex flex-row gap-2 items-center w-full"}>
                <div>
                    {value ? <AppleEmoji unified={value} className={"w-6 h-6"}/> : "No icon"}
                </div>
                <Button hidden={emojiPickerShown} variant={"outline"} className={"h-8 w-8 p-0"} onClick={e => {
                    e.preventDefault();
                    onChange("");
                    setEmojiPickerShown(true);
                }} disabled={disabled}>
                    <Pencil className={"h-4 w-4"}/>
                </Button>
            </div>
        </>;
}
