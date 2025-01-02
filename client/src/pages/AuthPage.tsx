import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/ui/Logo";
import { useLocation } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FormData = {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: string;
  organizationName?: string;
  organizationType?: string;
};

interface AuthPageProps {
  isRegister?: boolean;
}

export default function AuthPage({ isRegister: defaultIsRegister = false }: AuthPageProps) {
  const [isRegister, setIsRegister] = useState(defaultIsRegister);
  const { register: registerUser, login } = useUser();
  const { toast } = useToast();
  const { register, handleSubmit, reset, watch } = useForm<FormData>();
  const [, setLocation] = useLocation();
  const role = watch("role");

  // Update isRegister state when prop changes
  useEffect(() => {
    setIsRegister(defaultIsRegister);
  }, [defaultIsRegister]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isRegister) {
        const result = await registerUser(data);
        if (!result.ok) {
          throw new Error(result.message);
        }
        setLocation('/'); // Redirect to main page after successful registration
      } else {
        const result = await login(data);
        if (!result.ok) {
          throw new Error(result.message);
        }
        setLocation('/'); // Redirect to main page after successful login
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const showOrganizationFields = role === "spitex_org" || role === "insurance";

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
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      {...register("fullName", { required: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email", { required: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select {...register("role", { required: true })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spitex_org">SPITEX Organization</SelectItem>
                        <SelectItem value="freelancer">Freelance SPITEX Caregiver</SelectItem>
                        <SelectItem value="insurance">Insurance Company</SelectItem>
                        <SelectItem value="family_member">Family Member/Client</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {showOrganizationFields && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="organizationName">Organization Name</Label>
                        <Input
                          id="organizationName"
                          type="text"
                          {...register("organizationName", { required: true })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="organizationType">Organization Type</Label>
                        <Select {...register("organizationType", { required: true })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select organization type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spitex">SPITEX</SelectItem>
                            <SelectItem value="insurance">Insurance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </>
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