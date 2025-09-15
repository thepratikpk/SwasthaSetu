import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Icons
import { 
  Droplet, 
  Flame, 
  Activity, 
  Moon, 
  Share2, 
  Download, 
  Plus, 
  Minus,
  Utensils,
  Clock,
  CheckCircle2,
  Clock as ClockIcon,
  TrendingUp,
  CheckCircle
} from "lucide-react";

// Recharts components
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  Cell,
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  CartesianGrid
} from "recharts";

// Types
type GoalStatus = 'active' | 'in-progress' | 'consistent' | 'on-track';

interface Goal {
  id: string;
  title: string;
  progress: number;
  status: GoalStatus;
  icon: React.ReactNode;
}

interface Meal {
  id: string;
  time: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface DailyData {
  day: string;
  water: number;
  calories: number;
  steps: number;
  sleep: number;
}

// Constants
const WATER_GOAL = 2500; // ml
const CALORIE_GOAL = 2000; // kCal
const STEPS_GOAL = 10000;
const SLEEP_GOAL = 8; // hours

// Color scheme
const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  accent: '#8b5cf6',
} as const;

// Custom components
// Using Card component instead of StatCard since it's not available
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";

// Custom hooks
import { useAppState } from "@/context/app-state";

const Tracking = () => {
  // State
  const [water, setWater] = useState(1200);
  const [calories, setCalories] = useState(1450);
  const [steps, setSteps] = useState(7243);
  const [sleep, setSleep] = useState(6.5);
  const [mealsTaken, setMealsTaken] = useState(0);
  const mealsPlanned = 3; // Default number of planned meals per day
  const [reminders, setReminders] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() || 7);
  const [notif, setNotif] = useState<string | null>(null);

  // Sample data
  const goals = [
    { id: '1', title: 'Drink 8 glasses of water daily', progress: 75, status: 'on-track', icon: <Droplet className="h-4 w-4" /> },
    { id: '2', title: 'Walk 10,000 steps', progress: 60, status: 'in-progress', icon: <Activity className="h-4 w-4" /> },
    { id: '3', title: 'Sleep 8 hours', progress: 45, status: 'active', icon: <Moon className="h-4 w-4" /> },
  ];

  const meals = [
    {
      id: '1',
      time: '08:30 AM',
      name: 'Oatmeal with fruits',
      calories: 320,
      protein: 12,
      carbs: 54,
      fat: 8
    },
    {
      id: '2',
      time: '12:30 PM',
      name: 'Grilled Chicken Salad',
      calories: 450,
      protein: 35,
      carbs: 20,
      fat: 25
    },
    {
      id: '3',
      time: '03:00 PM',
      name: 'Apple with Peanut Butter',
      calories: 220,
      protein: 6,
      carbs: 28,
      fat: 12
    },
    {
      id: '4',
      time: '07:00 PM',
      name: 'Salmon with Quinoa',
      calories: 460,
      protein: 38,
      carbs: 45,
      fat: 18
    }
  ];

  const nutritionData = [
    { name: 'Protein', value: 91, color: COLORS.primary },
    { name: 'Carbs', value: 147, color: COLORS.success },
    { name: 'Fat', value: 63, color: COLORS.warning },
  ];

  // Generate weekly data
  const week = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => ({
        day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        water: 1200 + Math.round(Math.random() * 1200),
        calories: 1800 + Math.round(Math.random() * 700),
        steps: 5000 + Math.round(Math.random() * 8000),
        sleep: 5 + Math.random() * 4,
      })),
    [],
  );

  // Calculate progress percentages
  const waterProgress = Math.min(Math.round((water / WATER_GOAL) * 100), 100);
  const caloriesProgress = Math.min(Math.round((calories / CALORIE_GOAL) * 100), 100);
  const stepsProgress = Math.min(Math.round((steps / STEPS_GOAL) * 100), 100);
  const sleepProgress = Math.min(Math.round((sleep / SLEEP_GOAL) * 100), 100);

  // Helper to get progress color
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Handle water intake
  const handleWaterIntake = (amount: number) => {
    setWater(prev => Math.max(0, prev + amount));
  };

  // Handle reminders toggle
  const toggleReminders = () => {
    setReminders(!reminders);
    if (!reminders) {
      setNotif('Reminders enabled! You\'ll be notified to drink water.');
      setTimeout(() => setNotif(null), 3000);
    }
  };

    // Effect for water reminders
  useEffect(() => {
    if (!reminders) return;
    
    const id = setInterval(() => {
      setNotif('Time to drink water (250ml)?');
      // Auto-dismiss after 5 seconds
      setTimeout(() => setNotif(null), 5000);
    }, 60 * 60 * 1000); // Every hour
    
    return () => clearInterval(id);
  }, [reminders]);

  // Calculate daily stats
  const dailyStats = useMemo(() => ({
    water: week[selectedDay - 1]?.water || 0,
    calories: week[selectedDay - 1]?.calories || 0,
    steps: week[selectedDay - 1]?.steps || 0,
    sleep: week[selectedDay - 1]?.sleep || 0,
  }), [week, selectedDay]);

  // Helper functions
  const updateWater = (amount: number) => {
    setWater(prev => Math.max(0, prev + amount));
  };

  const markMealAsTaken = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setMealsTaken(prev => Math.min(mealsPlanned, prev + 1));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Health Dashboard</h1>
          <p className="text-muted-foreground">Track your daily health metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Water Intake</CardTitle>
            <Droplet className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{water}ml</div>
            <div className="mt-2">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${waterProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{waterProgress}% of daily goal</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calories</CardTitle>
            <Flame className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calories}kcal</div>
            <div className="mt-2">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500" 
                  style={{ width: `${caloriesProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{caloriesProgress}% of daily goal</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Steps</CardTitle>
            <Activity className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{steps.toLocaleString()}</div>
            <div className="mt-2">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500" 
                  style={{ width: `${stepsProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stepsProgress}% of daily goal</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sleep</CardTitle>
            <Moon className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sleep.toFixed(1)}hrs</div>
            <div className="mt-2">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500" 
                  style={{ width: `${sleepProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{sleepProgress}% of daily goal</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Water Intake Chart */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
              Water Intake
            </CardTitle>
            <CardDescription>Daily water consumption this week</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="text-3xl font-bold text-sky-600 mb-2">
                {water}ml
                <span className="text-lg text-gray-500">
                  /{WATER_GOAL}ml
                </span>
              </div>
              <Progress
                value={waterProgress}
                className="mb-4 h-2"
              />
              <div className="text-sm text-emerald-600 mb-3">
                ↑ {waterProgress}% of daily goal
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateWater(250)}
                  className="text-xs"
                >
                  +250ml
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateWater(500)}
                  className="text-xs"
                >
                  +500ml
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Meals Card */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                Meals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600 mb-2">
                {mealsTaken}
                <span className="text-lg text-gray-500">
                  /{mealsPlanned}
                </span>
              </div>
              <div className="text-sm text-emerald-600 mb-3">
                ↑{" "}
                {Math.round((mealsTaken / mealsPlanned) * 100)}%
                completed
              </div>
              <Button
                size="sm"
                onClick={(e) => markMealAsTaken(e)}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                Mark Meal
              </Button>
            </CardContent>
          </Card>

          {/* Reminders Card */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Smart Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                <Switch checked={reminders} onCheckedChange={setReminders} />
                <div className="text-sm text-gray-600">Auto notifications</div>
              </div>
              {notif && (
                <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm">
                  <div className="font-medium text-sky-800">
                    💧 Hydration Reminder
                  </div>
                  <div className="mt-1 text-sky-700">{notif}</div>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        updateWater(250);
                        setNotif(null);
                      }}
                      className="bg-sky-500 hover:bg-sky-600 text-xs"
                    >
                      Done
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNotif(null)}
                      className="text-xs"
                    >
                      Later
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                Weekly Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 leading-relaxed">
                🎯 Hydration improving steadily this week. Keep warm meals and
                avoid iced drinks in the evening for better results.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Hydration Trend */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-3 h-3 bg-sky-500 rounded-full"></div>
                Daily Hydration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ water: { label: "Water (ml)", color: "#06b6d4" } }}
                className="h-64 w-full"
              >
                <AreaChart data={week}>
                  <defs>
                    <linearGradient
                      id="waterGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop
                        offset="95%"
                        stopColor="#06b6d4"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    className="text-sm"
                  />
                  <YAxis hide />
                  <Area
                    type="monotone"
                    dataKey="water"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    fill="url(#waterGradient)"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Sleep Pattern */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                Daily Calories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ calories: { label: "Calories", color: "#f59e0b" } }}
                className="h-64 w-full"
              >
                <LineChart data={week}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    className="text-sm"
                  />
                  <YAxis hide />
                  <Line
                    type="monotone"
                    dataKey="calories"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ fill: "#f59e0b", strokeWidth: 2, r: 6 }}
                    activeDot={{
                      r: 8,
                      stroke: "#f59e0b",
                      strokeWidth: 2,
                      fill: "#fff",
                    }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Macro Distribution */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                Nutrition Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  carb: { label: "Carbs" },
                  protein: { label: "Protein" },
                  fat: { label: "Fats" },
                }}
                className="h-64 w-full"
              >
                <PieChart>
                  <Pie
                    data={[
                      { name: "carb", value: 55, label: "Carbohydrates" },
                      { name: "protein", value: 20, label: "Protein" },
                      { name: "fat", value: 25, label: "Healthy Fats" },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {Object.values(COLORS).map((color, i) => (
                      <Cell key={i} fill={color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Adherence Status */}
          <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
                Health Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Warm Food Preference
                  </span>
                  <Badge className="bg-accent/10 text-accent hover:bg-accent/20">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Light Exercise Routine
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary"
                  >
                    In Progress
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Regular Meal Schedule
                  </span>
                  <Badge className="bg-accent/10 text-accent hover:bg-accent/20">
                    Consistent
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Hydration Target
                  </span>
                  <Badge className="bg-accent/10 text-accent hover:bg-accent/20">
                    On Track
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Tracking;