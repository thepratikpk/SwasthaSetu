import { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppState } from "@/context/app-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, User, Clock, Calendar, Activity, Heart, Plus, MoreHorizontal, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

export default function DoctorPatients() {
  const { currentUser, doctors, requests } = useAppState();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [showAddPatient, setShowAddPatient] = useState(false);

  const getDoctorProfileId = () => {
    const key = `app:doctor-map:${currentUser?.id || "anon"}`;
    let mapped = localStorage.getItem(key);
    if (!mapped) {
      mapped = doctors[0]?.id || "d1";
      localStorage.setItem(key, mapped);
    }
    return mapped;
  };
  const doctorProfileId = getDoctorProfileId();

  type LastViewedMap = Record<string, number>;
  const lvKey = `app:patients:lastViewed:${doctorProfileId}`;
  const readLV = (): LastViewedMap => {
    try { return JSON.parse(localStorage.getItem(lvKey) || "{}"); } catch { return {}; }
  };
  const writeLV = (m: LastViewedMap) => localStorage.setItem(lvKey, JSON.stringify(m));
  const markViewed = (id: string) => { const m = readLV(); m[id] = Date.now(); writeLV(m); };

  // Get all patients for this doctor
  const myPatients = useMemo(() => 
    requests.filter(r => r.doctorId === doctorProfileId && r.status === "accepted"), 
    [requests, doctorProfileId]
  );
  
  // Calculate statistics based on available data
  const stats = useMemo(() => {
    const now = new Date();
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    // Count patients added in the last month
    const recentPatients = myPatients.filter(p => {
      const patientDate = new Date(p.createdAt);
      return patientDate > monthAgo;
    });
    
    // Count patients who might need follow-up (using last viewed as a proxy)
    const needsFollowUp = myPatients.filter(p => {
      const lastViewed = readLV()[p.id];
      if (!lastViewed) return true; // Never viewed
      const lastViewDate = new Date(lastViewed);
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return lastViewDate < weekAgo;
    }).length;
    
    return {
      total: myPatients.length,
      recent: recentPatients.length,
      needsFollowUp
    };
  }, [myPatients]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const lv = readLV();
    const arr = myPatients.filter(r => {
      const name = (r.patientName || `Patient ${r.userId}`).toLowerCase();
      return q ? name.includes(q) : true;
    });
    return arr.sort((a,b) => {
      const la = lv[a.id];
      const lb = lv[b.id];
      if (la && lb) return lb - la;
      if (la && !lb) return -1;
      if (!la && lb) return 1;
      const na = (a.patientName || `Patient ${a.userId}`).toLowerCase();
      const nb = (b.patientName || `Patient ${b.userId}`).toLowerCase();
      return na.localeCompare(nb);
    });
  }, [query, myPatients]);

  useEffect(() => {
    // ensure lv exists
    if (!localStorage.getItem(lvKey)) writeLV({});
  }, [lvKey]);

  const formatLV = (id: string) => {
    const lv = readLV();
    const t = lv[id];
    return t ? new Date(t).toLocaleString() : "Never";
  };

  const openDetails = (id: string) => {
    markViewed(id);
    navigate(`/doctor/patients/${id}`);
  };

  if (showAddPatient) {
    return (
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Add New Patient</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AddPatientForm
              onCancel={() => setShowAddPatient(false)}
              onCreate={(payload) => {
                const newId = `req_${Date.now()}`;
                const newUserId = `u_${Date.now()}`;
                const newReq = {
                  id: newId,
                  userId: newUserId,
                  doctorId: doctorProfileId,
                  status: "accepted" as const,
                  createdAt: new Date().toISOString(),
                  patientName: payload.name,
                  patientDosha: (payload as any).dosha || null,
                  plan: defaultPlan,
                  patientProfile: {
                    whatsapp: payload.whatsapp,
                    dob: payload.dob,
                    address: payload.address,
                    gender: payload.gender,
                    heightCm: payload.heightCm,
                    weightKg: payload.weightKg,
                    allergies: payload.allergies,
                    conditions: payload.conditions,
                    medications: payload.medications,
                    habits: payload.habits,
                    sleepPattern: payload.sleepPattern,
                    digestion: payload.digestion,
                    notes: payload.notes,
                    hasPdf: !!payload.medicalDoc,
                  },
                };
                setShowAddPatient(false);
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patient Management</h1>
          <p className="text-muted-foreground">Manage and monitor your patients' health journey</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search patients..."
            className="pl-10 w-full"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Patients</CardTitle>
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-800/50">
              <User className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-white">{stats.total}</div>
            <p className="text-xs text-blue-600 dark:text-blue-300">Under your care</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 bg-green-50 dark:bg-green-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Recent Additions</CardTitle>
            <div className="rounded-full bg-green-100 p-2 dark:bg-green-800/50">
              <Activity className="h-4 w-4 text-green-600 dark:text-green-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 dark:text-white">+{stats.recent}</div>
            <p className="text-xs text-green-600 dark:text-green-300">This month</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-200">Requiring Follow-up</CardTitle>
            <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-800/50">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stats.needsFollowUp > 0 ? 'text-amber-900 dark:text-white' : 'text-gray-500'}`}>
              {stats.needsFollowUp}
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-300">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Patients Table */}
      <Card className="border-t-4 border-t-primary overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-green-500 to-amber-500" />
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-25 dark:from-blue-900/30 dark:to-blue-800/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-green-400">
                Patient Records
              </CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">
                Manage and view your patients' information
              </CardDescription>
            </div>
            <Button size="sm" className="gap-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600" onClick={() => setShowAddPatient(true)}>
              <Plus className="h-4 w-4" />
              Add Patient
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length > 0 ? (
            <Table className="min-w-full">
              <TableHeader className="bg-blue-50 dark:bg-blue-900/30">
                <TableRow className="border-b border-blue-100 dark:border-blue-800">
                  <TableHead className="w-[300px] px-6 py-4 font-semibold text-blue-800 dark:text-blue-200">
                    Patient
                  </TableHead>
                  <TableHead className="w-[180px] px-4 py-4 font-semibold text-blue-800 dark:text-blue-200">
                    Last Visit
                  </TableHead>
                  <TableHead className="w-[140px] px-4 py-4 font-semibold text-blue-800 dark:text-blue-200">
                    Status
                  </TableHead>
                  <TableHead className="w-[180px] px-6 py-4 text-right font-semibold text-blue-800 dark:text-blue-200">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((patient) => (
                  <TableRow key={patient.id} className="hover:bg-muted/50">
                    <TableCell className="px-6 py-4 font-medium">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {patient.patientName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'P'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{patient.patientName || `Patient ${patient.userId}`}</div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Heart className="h-3 w-3 mr-1 text-rose-500" />
                            {patient.patientDosha || 'No dosha data'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex items-center text-sm">
                        <Calendar className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                        {new Date(patient.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200 shadow-sm">
                        <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                          onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                        >
                          View <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                            <DropdownMenuItem>Message</DropdownMenuItem>
                            <DropdownMenuItem>View History</DropdownMenuItem>
                            <DropdownMenuItem className="text-rose-600">Remove</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-medium">No patients found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                When you accept patient requests, they'll appear here.
              </p>
              <Button className="mt-4">Add New Patient</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const patientSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  gender: z.enum(["male", "female", "other"], { required_error: "Gender is required" }),
  dob: z.string().min(1, "Date of birth is required"),
  whatsapp: z.string().regex(/^\d{10}$/, "Must be 10 digits").optional(),
  address: z.string().min(3, "Address is required").optional(),
  heightCm: z.string().optional(),
  weightKg: z.string().optional(),
  allergies: z.string().optional(),
  conditions: z.string().optional(),
  medications: z.string().optional(),
  habits: z.string().optional(),
  sleepPattern: z.string().optional(),
  digestion: z.string().optional(),
  notes: z.string().optional(),
  medicalDoc: z.any().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

function AddPatientForm({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (payload: PatientFormValues) => void;
}) {
  const methods = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: "",
      gender: "male",
      dob: "",
      whatsapp: "",
      address: "",
      heightCm: "",
      weightKg: "",
      allergies: "",
      conditions: "",
      medications: "",
      habits: "",
      sleepPattern: "",
      digestion: "",
      notes: "",
      medicalDoc: undefined,
    },
    mode: "onTouched",
  });

  const { register, handleSubmit, setValue, formState } = methods;
  const { errors } = formState;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    setValue("medicalDoc", file);
  };

  const submit = (data: PatientFormValues) => {
    // Normalize address into the shape your dashboard expects (optional:
    // you can capture structured address fields if you prefer)
    onCreate(data);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(submit)} className="w-full">
        <div className="p-6">
          <Card className="rounded-2xl shadow-md border">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Add New Patient</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Personal Information</h3>
                  <div className="text-sm text-muted-foreground">Required</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name</Label>
                    <Input {...register("name")} placeholder="John Doe" />
                    {errors.name && <p className="text-xs text-destructive mt-1">{String(errors.name.message)}</p>}
                  </div>

                  <div>
                    <Label>Gender</Label>
                    <select {...register("gender")} className="w-full rounded-md border px-3 py-2">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.gender && <p className="text-xs text-destructive mt-1">{String(errors.gender.message)}</p>}
                  </div>

                  <div>
                    <Label>Date of birth</Label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input type="date" className="pl-9" {...register("dob")} />
                    </div>
                    {errors.dob && <p className="text-xs text-destructive mt-1">{String(errors.dob.message)}</p>}
                  </div>

                  <div>
                    <Label>WhatsApp (optional)</Label>
                    <Input placeholder="9876543210" {...register("whatsapp")} />
                    {errors.whatsapp && <p className="text-xs text-destructive mt-1">{String(errors.whatsapp.message)}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <Label>Address</Label>
                    <Textarea placeholder="Street, City, State, Country" {...register("address")} />
                    {errors.address && <p className="text-xs text-destructive mt-1">{String(errors.address.message)}</p>}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Medical Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Medical Details</h3>
                  <div className="text-sm text-muted-foreground">Optional</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Height (cm)</Label>
                    <Input type="number" placeholder="e.g. 170" {...register("heightCm")} />
                  </div>
                  <div>
                    <Label>Weight (kg)</Label>
                    <Input type="number" placeholder="e.g. 65" {...register("weightKg")} />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Allergies</Label>
                    <Input placeholder="e.g. peanuts, pollen" {...register("allergies")} />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Medical Conditions</Label>
                    <Textarea placeholder="e.g. diabetes, hypertension" {...register("conditions")} />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Medications</Label>
                    <Textarea placeholder="Current medications" {...register("medications")} />
                  </div>

                  <div>
                    <Label>Upload Medical Document (PDF)</Label>
                    <Input type="file" accept="application/pdf" onChange={handleFileChange} />
                    {errors.medicalDoc && <p className="text-xs text-destructive mt-1">{String(errors.medicalDoc.message)}</p>}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Lifestyle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Lifestyle & Notes</h3>
                  <div className="text-sm text-muted-foreground">Optional</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Habits</Label>
                    <Input placeholder="e.g. smoking, alcohol" {...register("habits")} />
                  </div>
                  <div>
                    <Label>Sleep Pattern</Label>
                    <Input placeholder="e.g. 7-8 hrs" {...register("sleepPattern")} />
                  </div>
                  <div>
                    <Label>Digestion</Label>
                    <Input placeholder="e.g. normal, weak" {...register("digestion")} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Additional Notes</Label>
                    <Textarea placeholder="Any extra notes..." {...register("notes")} />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button type="submit" className="px-6">
                  Create Patient
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </FormProvider>
  );
}
