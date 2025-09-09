import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/supabase-auth";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

const resetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const { toast } = useToast();
  const { resetPassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ResetFormData) => {
    setIsSubmitting(true);
    try {
      await resetPassword(data.email);
      setIsSuccess(true);
      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions to reset your password.",
      });
      form.reset();
    } catch (error: any) {
      toast({
        title: "Failed to send reset email",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center pt-16 px-4">
      <Card className="w-full max-w-md bg-gray-900/90 border-gray-800 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-white">
            Reset Your Password
          </CardTitle>
          <CardDescription className="text-center text-gray-400">
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="space-y-4">
              <Alert className="bg-green-900/20 border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-300">
                  Password reset instructions have been sent to your email address. 
                  Please check your inbox and follow the link to reset your password.
                </AlertDescription>
              </Alert>
              
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-400">
                  Didn't receive the email? Check your spam folder or{" "}
                  <button
                    onClick={() => {
                      setIsSuccess(false);
                      form.reset();
                    }}
                    className="text-orange-400 hover:text-orange-300"
                  >
                    try again
                  </button>
                </p>
                
                <Link href="/auth/login">
                  <Button
                    variant="outline"
                    className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              {...field}
                              type="email"
                              placeholder="Enter your email address"
                              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-orange-500"
                              disabled={isSubmitting}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending reset email...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Reset Email
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center space-y-4">
                <Link href="/auth/login">
                  <Button
                    variant="ghost"
                    className="text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
                
                <p className="text-sm text-gray-400">
                  Don't have an account?{" "}
                  <Link href="/auth/signup" className="text-orange-400 hover:text-orange-300 font-medium">
                    Sign up
                  </Link>
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}