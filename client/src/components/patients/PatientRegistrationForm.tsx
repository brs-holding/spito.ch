import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Phone,
  Mail,
  Home,
  Shield,
  FileText,
  Calendar,
  AlertCircle,
  Upload,
  FileSignature,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const addressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
});

const emergencyContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  phone: z.string().min(1, "Phone number is required"),
});

const documentSchema = z.object({
  healthInsurance: z.instanceof(File).optional(),
  otherDocuments: z.array(z.instanceof(File)).default([]),
});

const contractSchema = z.object({
  signature: z.string().min(1, "Signature is required"),
  dateOfSigning: z.string().min(1, "Date of signing is required"),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

const familyAccessItemSchema = z.object({
  name: z.string(),
  relationship: z.string(),
  accessLevel: z.enum(["full", "limited", "emergency_only"]),
});

const patientFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other"]),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  address: addressSchema,
  emergencyContact: emergencyContactSchema,
  medicalHistory: z.string().optional(),
  currentDiagnoses: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  primaryPhysicianContact: z.object({
    name: z.string().min(1, "Physician name is required"),
    phone: z.string().min(1, "Physician phone is required"),
    email: z.string().email("Invalid email address").optional(),
  }),
  preferences: z.string().optional(),
  familyAccess: z.array(familyAccessItemSchema).default([]),
  documents: documentSchema,
  contract: contractSchema,
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

const STEPS = [
  { id: "basic", label: "Basic Info", icon: User },
  { id: "medical", label: "Medical", icon: AlertCircle },
  { id: "documents", label: "Documents", icon: Upload },
  { id: "contract", label: "Contract", icon: FileSignature },
  { id: "notes", label: "Notes", icon: FileText },
];

export default function PatientRegistrationForm() {
  const { toast } = useToast();
  const [activeStep, setActiveStep] = useState(0);
  const queryClient = useQueryClient();

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      currentDiagnoses: [],
      allergies: [],
      familyAccess: [],
      documents: {
        otherDocuments: [],
      },
      contract: {
        termsAccepted: false,
      },
    },
  });

  const createPatient = useMutation({
    mutationFn: async (data: PatientFormValues) => {
      const formData = new FormData();

      // Add basic patient data
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'documents' && key !== 'contract') {
          formData.append(key, JSON.stringify(value));
        }
      });

      // Add documents
      if (data.documents.healthInsurance) {
        formData.append('healthInsurance', data.documents.healthInsurance);
      }
      data.documents.otherDocuments.forEach((file) => {
        formData.append('otherDocuments', file);
      });

      // Add contract data
      formData.append('contract', JSON.stringify(data.contract));

      const response = await fetch("/api/patients", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Success",
        description: "Patient information saved successfully",
      });
      form.reset();
      setActiveStep(0);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save patient information",
      });
    },
  });

  const isStepValid = async (step: number) => {
    const fields = getFieldsForStep(step);
    const result = await form.trigger(fields as any);
    return result;
  };

  const getFieldsForStep = (step: number) => {
    switch (step) {
      case 0: // Basic Info
        return [
          "firstName",
          "lastName",
          "dateOfBirth",
          "gender",
          "email",
          "phone",
          "address.street",
          "address.city",
          "address.state",
          "address.zipCode",
          "emergencyContact.name",
          "emergencyContact.relationship",
          "emergencyContact.phone",
        ];
      case 1: // Medical
        return [
          "medicalHistory",
          "currentDiagnoses",
          "allergies",
          "primaryPhysicianContact.name",
          "primaryPhysicianContact.phone",
          "primaryPhysicianContact.email",
        ];
      case 2: // Documents
        return ["documents.healthInsurance", "documents.otherDocuments"];
      case 3: // Contract
        return ["contract.signature", "contract.dateOfSigning", "contract.termsAccepted"];
      case 4: // Notes
        return ["preferences", "familyAccess"];
      default:
        return [];
    }
  };

  const handleNext = async () => {
    const isValid = await isStepValid(activeStep);
    if (isValid) {
      setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    } else {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields before proceeding.",
      });
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  async function onSubmit(data: PatientFormValues) {
    try {
      await createPatient.mutateAsync(data);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            {/* Basic Information Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Address</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address.street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address.zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Emergency Contact</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emergencyContact.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergencyContact.relationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergencyContact.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            {/* Medical Information Fields */}
            <FormField
              control={form.control}
              name="medicalHistory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medical History</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentDiagnoses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Diagnoses</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enter current diagnoses, separated by commas" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="allergies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allergies</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enter allergies, separated by commas" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Primary Physician</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="primaryPhysicianContact.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="primaryPhysicianContact.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="primaryPhysicianContact.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="documents.healthInsurance"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Health Insurance Document</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="application/pdf,image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              onChange(file);
                            }
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="prose max-w-none mb-6">
                  <h3>Terms and Conditions</h3>
                  <p>
                    By signing this contract, you agree to the following terms:
                  </p>
                  {/* Add your terms and conditions text here */}
                </div>

                <FormField
                  control={form.control}
                  name="contract.signature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Digital Signature</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Type your full name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contract.dateOfSigning"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Signing</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contract.termsAccepted"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I accept the terms and conditions
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="preferences"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Care Preferences</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter care preferences..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Family Access</h3>
              <div className="space-y-4">
                {form.watch("familyAccess").map((_, index) => (
                  <div key={index} className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`familyAccess.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`familyAccess.${index}.relationship`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relationship</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`familyAccess.${index}.accessLevel`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Access Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select access level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="full">Full Access</SelectItem>
                              <SelectItem value="limited">Limited Access</SelectItem>
                              <SelectItem value="emergency_only">Emergency Only</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const currentFamilyAccess = form.getValues("familyAccess");
                    form.setValue("familyAccess", [
                      ...currentFamilyAccess,
                      { name: "", relationship: "", accessLevel: "limited" }
                    ]);
                  }}
                >
                  Add Family Member
                </Button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={STEPS[activeStep].id} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            {STEPS.map((step, index) => (
              <TabsTrigger
                key={step.id}
                value={step.id}
                disabled={index !== activeStep}
                className="data-[state=active]:bg-primary"
              >
                <step.icon className="h-4 w-4 mr-2" />
                {step.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6">
            {renderStepContent(activeStep)}
          </div>
        </Tabs>

        <div className="flex justify-between space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            Back
          </Button>

          {activeStep === STEPS.length - 1 ? (
            <Button type="submit" disabled={createPatient.isPending}>
              {createPatient.isPending ? "Registering..." : "Register Patient"}
            </Button>
          ) : (
            <Button type="button" onClick={handleNext}>
              Next
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}