import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/ui/Logo";

type FormData = {
  username: string;
  password: string;
  fullName?: string;
};

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const { register: registerUser, login } = useUser();
  const { toast } = useToast();
  const { register, handleSubmit, reset } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      if (isRegister) {
        const result = await registerUser({
          ...data,
          fullName: data.fullName || '', // Ensure fullName is provided
        });
        if (!result.ok) {
          throw new Error(result.message);
        }
      } else {
        const result = await login(data);
        if (!result.ok) {
          throw new Error(result.message);
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{isRegister ? "Register" : "Login"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  {...register("username", { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password", { required: true })}
                />
              </div>
              {isRegister && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    {...register("fullName", { required: true })}
                  />
                </div>
              )}
              <Button type="submit" className="w-full">
                {isRegister ? "Register" : "Login"}
              </Button>
            </form>
            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => {
                setIsRegister(!isRegister);
                reset();
              }}
            >
              {isRegister
                ? "Already have an account? Login"
                : "Don't have an account? Register"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}