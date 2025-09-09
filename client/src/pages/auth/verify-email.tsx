import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase-client";
import { Loader2, CheckCircle2, XCircle, Mail, ArrowRight } from "lucide-react";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error' | 'pending'>('pending');
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    // Check for verification token in URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const token = hashParams.get('token');
    const type = hashParams.get('type');

    if (token && type === 'email') {
      verifyEmail(token);
    } else if (type === 'recovery') {
      // Handle password recovery token
      setLocation('/auth/update-password');
    } else {
      // No token present, show instructions
      setVerificationStatus('pending');
    }
  }, []);

  const verifyEmail = async (token: string) => {
    setVerificationStatus('verifying');
    
    if (!supabase) {
      setVerificationStatus('error');
      setErrorMessage('Supabase is not configured');
      return;
    }
    
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email',
      });

      if (error) throw error;

      setVerificationStatus('success');
      toast({
        title: "Email verified successfully!",
        description: "Your account has been activated. Redirecting to login...",
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        setLocation('/auth/login');
      }, 3000);
    } catch (error: any) {
      setVerificationStatus('error');
      setErrorMessage(error.message || "Failed to verify email. The link may have expired.");
      toast({
        title: "Verification failed",
        description: error.message || "Please try requesting a new verification email.",
        variant: "destructive",
      });
    }
  };

  const resendVerificationEmail = async () => {
    const email = prompt("Please enter your email address:");
    if (!email) return;

    if (!supabase) {
      toast({
        title: "Error",
        description: "Supabase is not configured",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      toast({
        title: "Verification email sent",
        description: "Please check your inbox for a new verification link.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to resend email",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center pt-16 px-4">
      <Card className="w-full max-w-md bg-gray-900/90 border-gray-800 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-white">
            Email Verification
          </CardTitle>
          <CardDescription className="text-center text-gray-400">
            {verificationStatus === 'verifying' && "Verifying your email address..."}
            {verificationStatus === 'success' && "Your email has been verified!"}
            {verificationStatus === 'error' && "Verification failed"}
            {verificationStatus === 'pending' && "Verify your email to activate your account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verificationStatus === 'verifying' && (
            <div className="flex flex-col items-center space-y-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
              <p className="text-gray-400">Please wait while we verify your email...</p>
            </div>
          )}

          {verificationStatus === 'success' && (
            <div className="space-y-4">
              <Alert className="bg-green-900/20 border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-300">
                  Your email has been successfully verified! You can now access all features of your account.
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col items-center space-y-4 py-4">
                <CheckCircle2 className="h-16 w-16 text-green-400" />
                <p className="text-gray-300 text-center">
                  Redirecting you to the login page...
                </p>
                <Button
                  onClick={() => setLocation('/auth/login')}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  Go to Login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {verificationStatus === 'error' && (
            <div className="space-y-4">
              <Alert className="bg-red-900/20 border-red-800">
                <XCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">
                  {errorMessage}
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col items-center space-y-4 py-4">
                <XCircle className="h-16 w-16 text-red-400" />
                <p className="text-gray-300 text-center">
                  The verification link may have expired or is invalid.
                </p>
                <Button
                  onClick={resendVerificationEmail}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Verification Email
                </Button>
                <Button
                  onClick={() => setLocation('/auth/login')}
                  variant="outline"
                  className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Back to Login
                </Button>
              </div>
            </div>
          )}

          {verificationStatus === 'pending' && (
            <div className="space-y-4">
              <Alert className="bg-blue-900/20 border-blue-800">
                <Mail className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-300">
                  Please check your email for a verification link to activate your account.
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col items-center space-y-4 py-4">
                <Mail className="h-16 w-16 text-orange-400" />
                <div className="text-center space-y-2">
                  <p className="text-gray-300">
                    We've sent a verification email to your registered email address.
                  </p>
                  <p className="text-sm text-gray-400">
                    Click the link in the email to verify your account.
                  </p>
                </div>
                
                <div className="w-full space-y-2">
                  <Button
                    onClick={resendVerificationEmail}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </Button>
                  <Button
                    onClick={() => setLocation('/auth/login')}
                    variant="outline"
                    className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Back to Login
                  </Button>
                </div>
                
                <p className="text-xs text-gray-500 text-center mt-4">
                  If you don't see the email, please check your spam folder.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}