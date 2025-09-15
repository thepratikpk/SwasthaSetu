import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAppState } from "@/context/app-state";
import PatientVerification from "@/components/doctor/dietPlan/PatientVerification";
import DietQuiz from "@/components/doctor/dietPlan/DietQuiz";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, X, ArrowLeft, Leaf } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

type Meal = {
  type: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  vitamins: string[];
  ayur: { dosha?: string; rasa: string; properties: string[] };
};

type DayPlan = { day: string; meals: Meal[] };

type Food = {
  name: string;
  type: Meal["type"];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ayur: { dosha?: string; rasa: string; properties: string[] };
};

const FOOD_DB: Food[] = [
  {
    name: "Moong Dal Khichdi",
    type: "Lunch",
    calories: 450,
    protein: 18,
    carbs: 78,
    fat: 8,
    ayur: {
      dosha: "Tridoshic",
      rasa: "Madhura",
      properties: ["Light", "Sattvic"],
    },
  },
  {
    name: "Oats with Fruits",
    type: "Breakfast",
    calories: 350,
    protein: 12,
    carbs: 60,
    fat: 8,
    ayur: { dosha: "Pitta", rasa: "Madhura", properties: ["Cooling"] },
  },
  {
    name: "Grilled Paneer Salad",
    type: "Dinner",
    calories: 420,
    protein: 25,
    carbs: 30,
    fat: 18,
    ayur: { dosha: "Kapha", rasa: "Madhura", properties: ["Light"] },
  },
  {
    name: "Herbal Tea + Nuts",
    type: "Snack",
    calories: 180,
    protein: 6,
    carbs: 12,
    fat: 10,
    ayur: { dosha: "Vata", rasa: "Kashaya", properties: ["Warm"] },
  },
  {
    name: "Chicken Curry with Rice",
    type: "Lunch",
    calories: 600,
    protein: 28,
    carbs: 80,
    fat: 18,
    ayur: { dosha: "Pitta", rasa: "Madhura", properties: ["Sattvic"] },
  },
  {
    name: "Steamed Veg + Ghee",
    type: "Dinner",
    calories: 420,
    protein: 10,
    carbs: 45,
    fat: 16,
    ayur: { dosha: "Vata", rasa: "Madhura", properties: ["Grounding"] },
  },
  {
    name: "Idli Sambhar",
    type: "Breakfast",
    calories: 320,
    protein: 10,
    carbs: 60,
    fat: 6,
    ayur: { dosha: "Tridoshic", rasa: "Amla", properties: ["Light"] },
  },
  {
    name: "Curd Rice",
    type: "Lunch",
    calories: 500,
    protein: 12,
    carbs: 85,
    fat: 12,
    ayur: { dosha: "Pitta", rasa: "Amla", properties: ["Cooling"] },
  },
];

export default function DoctorDietGenerator() {
  const { requests, setRequests } = useAppState();
  const navigate = useNavigate();
  const location = useLocation();

  // Get patient details from URL parameters
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get("patientId") || "";
  const patientName = searchParams.get("patientName") ? decodeURIComponent(searchParams.get("patientName") || '') : "";
  const dosha = searchParams.get("dosha") || "";

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fetchedName, setFetchedName] = useState<string | null>(patientName || null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(!!patientId);
  
  // Debug log URL parameters and state
  useEffect(() => {
    console.log('URL Params:', { patientId, patientName, dosha });
    console.log('State:', { fetchedName, confirmed, step });
  }, [patientId, patientName, dosha, fetchedName, confirmed, step]);

  // Auto-advance to step 2 if patient is already confirmed
  useEffect(() => {
    if (confirmed && step === 1) {
      setStep(2);
    }
  }, [confirmed, step]);

  // Quiz inputs
  const [cuisine, setCuisine] = useState("Indian");
  const [veg, setVeg] = useState(true);
  const [activity, setActivity] = useState<"Low" | "Moderate" | "High">(
    "Moderate",
  );
  const [restrictions, setRestrictions] = useState<string[]>([]);

  // Plan data
  const [plan, setPlan] = useState<DayPlan[] | null>(null);
  const [detail, setDetail] = useState<{ di: number; mi: number } | null>(null);

  // Editing and search state
  const [editing, setEditing] = useState<{ di: number; mi: number } | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return FOOD_DB.slice(0, 6);
    return FOOD_DB.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q) ||
        (f.ayur.dosha || "").toLowerCase().includes(q),
    ).slice(0, 10);
  }, [search]);

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  // Fetch patient details if not in URL
  useEffect(() => {
    if (patientName) {
      setFetchedName(decodeURIComponent(patientName));
    } else if (patientId) {
      // Fallback to fetch from requests if name not in URL
      const patient = requests.find(r => r.id === patientId);
      if (patient) {
        setFetchedName(patient.patientName || 'Patient');
        setFetchError(null);
      } else {
        setFetchError("Patient details not found. Please select a patient first.");
      }
    }
  }, [patientId, patientName, requests]);

  const recommend = useMemo(() => {
    const water =
      activity === "High" ? 3000 : activity === "Moderate" ? 2500 : 2000;
    const calories =
      activity === "High" ? 2600 : activity === "Moderate" ? 2200 : 1800;
    return { water, calories };
  }, [activity]);

  const generatePlan = (): DayPlan[] => {
    return Array.from({ length: 3 }).map((_, i) => ({
      day: `Day ${i + 1}`,
      meals: [
        {
          type: "Breakfast",
          name: "Oats with Fruits",
          calories: 350,
          protein: 12,
          carbs: 60,
          fat: 8,
          vitamins: ["B1", "C"],
          ayur: {
            dosha: "Pitta",
            rasa: "Madhura",
            properties: ["Light", "Cooling"],
          },
        },
        {
          type: "Lunch",
          name: veg ? "Moong Dal Khichdi" : "Chicken Curry with Rice",
          calories: veg ? 450 : 600,
          protein: veg ? 18 : 28,
          carbs: veg ? 78 : 80,
          fat: veg ? 8 : 18,
          vitamins: ["A", "B12"],
          ayur: {
            dosha: veg ? "Tridoshic" : "Pitta",
            rasa: "Madhura",
            properties: ["Sattvic"],
          },
        },
        {
          type: "Dinner",
          name: "Steamed Veg + Ghee",
          calories: 420,
          protein: 10,
          carbs: 45,
          fat: 16,
          vitamins: ["E"],
          ayur: {
            dosha: "Vata",
            rasa: "Madhura",
            properties: ["Grounding"],
          },
        },
      ],
    }));
  };

  const stats = useMemo(() => {
    if (!plan) return { perDay: [], avgCal: 0 };
    const perDay = plan.map((d) => ({
      date: d.day,
      calories: d.meals.reduce(
        (s: number, m: Meal) => s + (m.calories || 0),
        0,
      ),
    }));
    const avgCal = perDay.length
      ? Math.round(perDay.reduce((s, x) => s + x.calories, 0) / perDay.length)
      : 0;
    return { perDay, avgCal };
  }, [plan]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            Diet Plan Generator
          </h1>
          <div className="w-48">
            <Progress value={progress} />
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Search by Patient ID or Name to verify the patient, then proceed.
        </p>
      </div>

      {/* Patient Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Patient Details</CardTitle>
          <CardDescription>
            {fetchedName ? `Generating diet plan for ${fetchedName}${dosha ? ` (${dosha} dosha)` : ''}` : 'No patient selected'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!patientId ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Please select a patient first</p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => navigate('/doctor/patients')}
              >
                <User className="h-4 w-4 mr-2" />
                Select Patient
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{fetchedName || 'Patient'}</span>
                </div>
                {dosha && (
                  <div className="flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Dosha: {dosha}</span>
                  </div>
                )}
              </div>
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/doctor/patients/${patientId}`)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Patient
                </Button>
              </div>
            </div>
          )}

          {fetchError && (
            <div className="mt-3 text-sm text-destructive bg-destructive/5 p-3 rounded-md flex items-center gap-2 border border-destructive/20">
              <X className="h-4 w-4" />
              {fetchError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 1 */}
      {step === 1 && (
        <div className={!patientId ? "opacity-50 pointer-events-none" : ""}>
          <PatientVerification
            requests={requests}
            patientId={patientId}
            onVerified={(name) => {
              setFetchedName(name);
              setStep(2);
            }}
            setPatientId={() => {
              // No-op since we're handling patient ID through URL parameters
            }}
          />
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="space-y-4">
          <DietQuiz
            cuisine={cuisine}
            setCuisine={setCuisine}
            veg={veg}
            setVeg={setVeg}
            activity={activity}
            setActivity={setActivity}
            restrictions={restrictions}
            setRestrictions={setRestrictions}
          />
          <div className="flex justify-end">
            <button
              className="px-4 py-2 rounded bg-primary text-white"
              onClick={() => {
                setPlan(generatePlan());
                setStep(3);
              }}
            >
              Generate Diet Plan
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && plan && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                Diet Plan for {fetchedName || "Patient"} • Avg {stats.avgCal}{" "}
                kcal/day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  cal: { label: "Calories", color: "hsl(var(--primary))" },
                }}
              >
                <BarChart data={stats.perDay}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="calories" fill="var(--color-cal)" radius={4} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generated Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="text-sm text-muted-foreground">
                  Click a meal to edit or replace from search.
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setPlan((p) =>
                        p
                          ? [...p, { day: `Day ${p.length + 1}`, meals: [] }]
                          : p,
                      )
                    }
                  >
                    Add Day
                  </Button>
                  <Button
                    onClick={() => {
                      if (!plan) return;
                      // Save flat plan into matching patient request if found
                      const q = (patientId || patientName).trim().toLowerCase();
                      const match = requests.find(
                        (r) =>
                          r.userId.toLowerCase() === q ||
                          (r.patientName || "").toLowerCase().includes(q),
                      );
                      if (match) {
                        setRequests(
                          requests.map((r) =>
                            r.id === match.id
                              ? {
                                  ...r,
                                  plan: plan.flatMap((d) =>
                                    d.meals.map((m) => ({
                                      time:
                                        m.type === "Breakfast"
                                          ? "08:00"
                                          : m.type === "Lunch"
                                            ? "12:30"
                                            : m.type === "Snack"
                                              ? "16:00"
                                              : "19:30",
                                      name: m.name,
                                      calories: m.calories,
                                      waterMl:
                                        m.type === "Snack" ? 200 : undefined,
                                    })),
                                  ),
                                }
                              : r,
                          ),
                        );
                        alert("Plan saved to patient");
                      } else {
                        alert(
                          "No matching patient to save plan. Use exact User ID or patient name.",
                        );
                      }
                    }}
                  >
                    Save to Patient
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Meal</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">kcal</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plan.map((day, di) =>
                      day.meals.map((m, mi) => (
                        <TableRow key={`${day.day}-${mi}`}>
                          {mi === 0 && (
                            <TableCell
                              rowSpan={day.meals.length}
                              className="font-mono text-xs align-top"
                            >
                              {day.day}
                              <div className="mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setPlan((p) =>
                                      p
                                        ? p.map((d, idx) =>
                                            idx === di
                                              ? {
                                                  ...d,
                                                  meals: [
                                                    ...d.meals,
                                                    {
                                                      type: "Snack",
                                                      name: "Herbal Tea + Nuts",
                                                      calories: 180,
                                                      protein: 6,
                                                      carbs: 12,
                                                      fat: 10,
                                                      vitamins: [],
                                                      ayur: {
                                                        dosha: "Vata",
                                                        rasa: "Kashaya",
                                                        properties: ["Warm"],
                                                      },
                                                    },
                                                  ],
                                                }
                                              : d,
                                          )
                                        : p,
                                    );
                                  }}
                                >
                                  Add Meal
                                </Button>
                              </div>
                            </TableCell>
                          )}
                          <TableCell>
                            {editing &&
                            editing.di === di &&
                            editing.mi === mi ? (
                              <Input
                                value={m.name}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setPlan((p) =>
                                    p
                                      ? p.map((d, i1) =>
                                          i1 === di
                                            ? {
                                                ...d,
                                                meals: d.meals.map((mm, i2) =>
                                                  i2 === mi
                                                    ? { ...mm, name: v }
                                                    : mm,
                                                ),
                                              }
                                            : d,
                                        )
                                      : p,
                                  );
                                }}
                              />
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    className="underline-offset-2 hover:underline"
                                    onClick={() => setDetail({ di, mi })}
                                  >
                                    {m.name}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs">
                                    <div className="font-medium">{m.name}</div>
                                    <div>{m.calories} kcal</div>
                                    <div>Dosha: {m.ayur.dosha}</div>
                                    <div>Rasa: {m.ayur.rasa}</div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell>
                            {editing &&
                            editing.di === di &&
                            editing.mi === mi ? (
                              <Select
                                value={m.type}
                                onValueChange={(v) => {
                                  setPlan((p) =>
                                    p
                                      ? p.map((d, i1) =>
                                          i1 === di
                                            ? {
                                                ...d,
                                                meals: d.meals.map((mm, i2) =>
                                                  i2 === mi
                                                    ? {
                                                        ...mm,
                                                        type: v as Meal["type"],
                                                      }
                                                    : mm,
                                                ),
                                              }
                                            : d,
                                        )
                                      : p,
                                  );
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Breakfast">
                                    Breakfast
                                  </SelectItem>
                                  <SelectItem value="Lunch">Lunch</SelectItem>
                                  <SelectItem value="Snack">Snack</SelectItem>
                                  <SelectItem value="Dinner">Dinner</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              m.type
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editing &&
                            editing.di === di &&
                            editing.mi === mi ? (
                              <Input
                                className="text-right"
                                type="number"
                                value={m.calories}
                                onChange={(e) => {
                                  const v = Math.max(
                                    0,
                                    parseInt(e.target.value || "0", 10),
                                  );
                                  setPlan((p) =>
                                    p
                                      ? p.map((d, i1) =>
                                          i1 === di
                                            ? {
                                                ...d,
                                                meals: d.meals.map((mm, i2) =>
                                                  i2 === mi
                                                    ? { ...mm, calories: v }
                                                    : mm,
                                                ),
                                              }
                                            : d,
                                        )
                                      : p,
                                  );
                                }}
                              />
                            ) : (
                              m.calories
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editing &&
                            editing.di === di &&
                            editing.mi === mi ? (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditing(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => setEditing(null)}
                                >
                                  Done
                                </Button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditing({ di, mi })}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSearch("");
                                    setEditing({ di, mi });
                                    const el =
                                      document.getElementById(
                                        "food-search-input",
                                      );
                                    if (el)
                                      setTimeout(
                                        () => (el as HTMLInputElement).focus(),
                                        0,
                                      );
                                  }}
                                >
                                  Search Food
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setPlan((p) =>
                                      p
                                        ? p.map((d, i1) =>
                                            i1 === di
                                              ? {
                                                  ...d,
                                                  meals: d.meals.filter(
                                                    (_, i2) => i2 !== mi,
                                                  ),
                                                }
                                              : d,
                                          )
                                        : p,
                                    )
                                  }
                                >
                                  Remove
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )),
                    )}
                  </TableBody>
                </Table>
              </div>

              {editing && plan ? (
                <div className="mt-4 rounded-lg border p-3">
                  <div className="mb-2 text-sm font-medium">
                    Search and replace meal
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] items-center">
                    <Input
                      id="food-search-input"
                      placeholder="Search food (name, type, dosha)"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="text-right text-sm text-muted-foreground hidden sm:block">
                      Results: {searchResults.length}
                    </div>
                    <Button variant="outline" onClick={() => setSearch("")}>
                      Clear
                    </Button>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {searchResults.map((f, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 rounded-md border p-2"
                      >
                        <div>
                          <div className="font-medium">{f.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {f.type} • {f.calories} kcal • {f.ayur.rasa} •{" "}
                            {f.ayur.properties.join(", ")}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            const { di, mi } = editing;
                            setPlan((p) =>
                              p
                                ? p.map((d, i1) =>
                                    i1 === di
                                      ? {
                                          ...d,
                                          meals: d.meals.map((mm, i2) =>
                                            i2 === mi
                                              ? {
                                                  ...mm,
                                                  name: f.name,
                                                  type: f.type,
                                                  calories: f.calories,
                                                  protein: f.protein,
                                                  carbs: f.carbs,
                                                  fat: f.fat,
                                                  ayur: f.ayur,
                                                }
                                              : mm,
                                          ),
                                        }
                                      : d,
                                  )
                                : p,
                            );
                          }}
                        >
                          Use
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Meal details modal */}
          <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
            <DialogContent className="sm:max-w-[560px]">
              {detail && (
                <>
                  <DialogHeader>
                    <DialogTitle>Meal Details</DialogTitle>
                    <DialogDescription>
                      Nutrition and Ayurveda properties
                    </DialogDescription>
                  </DialogHeader>
                  {(() => {
                    const m = plan[detail.di].meals[detail.mi];
                    return (
                      <div className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs text-muted-foreground">
                              Day
                            </div>
                            <div>{plan[detail.di].day}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">
                              Type
                            </div>
                            <div>{m.type}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <div className="text-xs text-muted-foreground">
                              Calories
                            </div>
                            <div>{m.calories}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">
                              Protein (g)
                            </div>
                            <div>{m.protein}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">
                              Carbs (g)
                            </div>
                            <div>{m.carbs}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">
                              Fat (g)
                            </div>
                            <div>{m.fat}</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Vitamins
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {m.vitamins.map((v: string) => (
                              <Badge key={v} variant="secondary">
                                {v}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Dosha
                          </div>
                          <div>{m.ayur.dosha}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Rasa
                          </div>
                          <div>{m.ayur.rasa}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Properties
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {m.ayur.properties.map((p: string) => (
                              <Badge key={p} variant="secondary">
                                {p}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}

      <div className="mt-4">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 border rounded"
        >
          Back
        </button>
      </div>
    </div>
  );
}
