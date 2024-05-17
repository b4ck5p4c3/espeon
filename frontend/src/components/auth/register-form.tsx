import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Card, CardContent} from "@/components/ui/card";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Loader2} from "lucide-react";
import React from "react";

const registerFormSchema = z.object({
    username: z.string().min(2).max(32),
    password: z.string().min(8),
    repeatPassword: z.string().min(8),
    registerToken: z.string().min(1)
}).superRefine(({password, repeatPassword}, ctx) => {
    if (repeatPassword !== password) {
        ctx.addIssue({
            path: ["password"],
            fatal: true,
            code: "custom",
            message: "Passwords do not match"
        });
        ctx.addIssue({
            path: ["repeatPassword"],
            fatal: true,
            code: "custom",
            message: "Passwords do not match"
        });
    }
});

export type RegisterFormData = z.infer<typeof registerFormSchema>;

export function RegisterForm({onSubmit, loading}: { onSubmit: (params: RegisterFormData) => void, loading: boolean }) {
    const form = useForm<RegisterFormData>({
        resolver: zodResolver(registerFormSchema)
    });

    return <Card>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-4">
                    <FormField
                        control={form.control}
                        name="username"
                        disabled={loading}
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <Input placeholder="someusername" {...field} />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        disabled={loading}
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input type={"password"} {...field} />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="repeatPassword"
                        disabled={loading}
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Repeat password</FormLabel>
                                <FormControl>
                                    <Input type={"password"} {...field} />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="registerToken"
                        disabled={loading}
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Registration token</FormLabel>
                                <FormControl>
                                    <Input type={"password"} {...field} />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <Button className={"w-full"} type="submit" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Register"}
                    </Button>
                </form>
            </Form>
        </CardContent>
    </Card>;
}