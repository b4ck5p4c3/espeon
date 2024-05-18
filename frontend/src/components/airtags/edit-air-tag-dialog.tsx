import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {EmojiIconInput} from "@/components/airtags/emoji-icon-input";
import {Button} from "@/components/ui/button";
import {Loader2} from "lucide-react";
import React from "react";
import {AirTagData} from "@/lib/types";

const editAirTagFormSchema = z.object({
    name: z.string().min(2).max(64),
    icon: z.string().min(1),
    color: z.string().min(1)
});


export type EditAirTagFormData = z.infer<typeof editAirTagFormSchema>;

export function EditAirTagDialog({airTag, onSubmit, onOpenChange, loading}: {
    airTag: AirTagData,
    onSubmit: (data: EditAirTagFormData) => void,
    onOpenChange: (value: boolean) => void,
    loading: boolean
}) {

    const form = useForm<EditAirTagFormData>({
        resolver: zodResolver(editAirTagFormSchema),
        defaultValues: {
            name: airTag.privateData.name,
            icon: airTag.privateData.icon,
            color: airTag.privateData.color
        }
    });

    return <Dialog open={true} onOpenChange={onOpenChange} modal={false}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit AirTag</DialogTitle>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 pt-4 min-w-max">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({field}) => (
                            <FormItem className={"grid grid-cols-4 items-center gap-4"}>
                                <FormLabel className={"text-right"}>Name</FormLabel>
                                <FormControl>
                                    <Input className={"col-span-3"} disabled={loading} placeholder="Keys" {...field} />
                                </FormControl>
                                <FormMessage className={"col-span-3 col-start-2"}/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="icon"
                        render={({field}) => (
                            <FormItem className={"grid grid-cols-4 gap-4"}>
                                <FormLabel className={"text-right mt-4"}>Icon</FormLabel>
                                <FormControl>
                                    <div className={"col-span-3"}>
                                        <EmojiIconInput disabled={loading} {...field}/>
                                    </div>
                                </FormControl>
                                <FormMessage className={"col-span-3 col-start-2"}/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="color"
                        render={({field}) => (
                            <FormItem className={"grid grid-cols-4 gap-4"}>
                                <FormLabel className={"text-right mt-4"}>Color</FormLabel>
                                <FormControl>
                                    <Input className={"col-span-3"} disabled={loading} type={"color"} {...field} />
                                </FormControl>
                                <FormMessage className={"col-span-3 col-start-2"}/>
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <Button type="submit" className={"mt-4"} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Save"}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>;
}
