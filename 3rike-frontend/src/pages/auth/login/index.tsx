import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from "react-router-dom";
import pin from "@/assets/pin.svg";
import { useState } from "react";
import { EyeClosed, EyeIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { login, setToken } from "@/lib/api";
import { hydrateVerificationStatus, type VerificationStatus } from "@/lib/ownership";

const formSchema = z.object({
    identifier: z.string().min(1, { message: "Enter your phone number or email" }),
    password: z.string().min(1, { message: "Enter your password" }),
});

export default function LoginForm() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: {
            identifier: "",
            password: "",
        },
    });
    const { errors } = form.formState;

    const isTab0Valid = () => {
        const values = form.getValues();
        return values.identifier.trim().length > 0 && values.password.length > 0 && !errors.identifier && !errors.password;
    };

    const handleDone = async () => {
        const isValid = await form.trigger(["identifier", "password"]);
        if (isValid) {
            form.handleSubmit(onSubmit)();
        }
    };

    async function onSubmit(data: z.infer<typeof formSchema>) {
        setLoading(true);
        setApiError(null);
        try {
            const res = await login(data.identifier, data.password);
            setToken(res.token);
            hydrateVerificationStatus(res.user.verificationStatus as VerificationStatus);
            navigate("/driver");
        } catch (e) {
            setApiError(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 overflow-y-auto bg-opacity-50 flex justify-center">
            <div className="bg-white w-full p-6 mt-15">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="space-y-6">
                            <div className="flex flex-col space-y-4 pt-10">
                                <div className="flex flex-row space-x-3">
                                    <img src={pin} alt="pin" className="w-10 h-10" />
                                    <h1 className="font-extrabold flex flex-col justify-center">Welcome back</h1>
                                </div>
                            </div>

                            <FormField
                                control={form.control}
                                name="identifier"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input
                                                placeholder="Phone number or email"
                                                {...field}
                                                className="border border-gray-300 w-full h-12"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div className="relative w-full">
                                                <Input
                                                    {...field}
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Enter password"
                                                    className="border border-gray-300 w-full pr-24 h-12"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2"
                                                >
                                                    {showPassword ? (
                                                        <EyeIcon className="w-6 h-6" />
                                                    ) : (
                                                        <EyeClosed className="w-6 h-6" />
                                                    )}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="text-end text-sm pb-5 mr-1">
                                <Link to="/forgot-password-phone" className="text-gray-400 font-light">Forgot Password</Link>
                            </div>

                            {apiError && (
                                <p className="text-sm text-[#EC1111]" role="alert">{apiError}</p>
                            )}

                            <Button
                                className={`
                                        w-full py-6 rounded-md transition
                                        ${isTab0Valid()
                                        ? "bg-[#01C259] hover:bg-[#019f4a]"
                                        : "bg-[#7BCD8A] cursor-not-allowed"}
                                    `}
                                type="button"
                                disabled={!isTab0Valid() || loading}
                                onClick={handleDone}
                                loading={loading}
                            >
                                Confirm
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
};
