import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Card, CardContent} from "@/components/ui/card";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Loader2} from "lucide-react";
import React from "react";

const loginFormSchema = z.object({
    username: z.string().min(2).max(32),
    password: z.string().min(8)
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

export function LoginForm({onSubmit, loading}: { onSubmit: (params: LoginFormData) => void, loading: boolean }) {
    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginFormSchema)
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
                    <Button className={"w-full"} type="submit" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Login"}
                    </Button>
                </form>
            </Form>
        </CardContent>
    </Card>;
}
