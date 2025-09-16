"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/context/app-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

type Document = {
  name: string;
  url: string;
};

type PatientRequest = {
  id: string;
  patientName?: string; // Made optional to match ConsultRequest
  patientDosha?: string; // Made optional to match ConsultRequest
  status: "pending" | "accepted" | "rejected";
  weight?: number | string;
  height?: number | string;
  lifestyle?: string;
  emergencyContact?: string;
  documents?: Document[];
  // Add other fields that might exist in ConsultRequest
  name?: string;
  dosha?: string;
  [key: string]: any; // For any additional properties
};

export default function DoctorDashboard() {
  const { currentUser, requests = [], setRequests } = useAppState() as {
    currentUser: any;
    requests: any[];
    setRequests: (updater: (prev: any[]) => any[]) => void;
  };
  const [selectedPatient, setSelectedPatient] = useState<PatientRequest | null>(
    null
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  // Sample hardcoded patient requests
  const sampleRequests: PatientRequest[] = [
    {
      id: "1",
      name: "Rahul Sharma",
      patientName: "Rahul Sharma",
      dosha: "Vata",
      patientDosha: "Vata",
      status: "pending",
      age: 32,
      gender: "Male",
      symptoms: "Digestive issues, Insomnia",
      requestedDate: "2023-06-15",
      avatar: "/avatars/1.jpg",
    },
    {
      id: "2",
      name: "Priya Patel",
      patientName: "Priya Patel",
      dosha: "Pitta",
      patientDosha: "Pitta",
      status: "pending",
      age: 28,
      gender: "Female",
      symptoms: "Acid reflux, Skin rashes",
      requestedDate: "2023-06-16",
      avatar: "/avatars/2.jpg",
    },
    {
      id: "3",
      name: "Amit Kumar",
      patientName: "Amit Kumar",
      dosha: "Kapha",
      patientDosha: "Kapha",
      status: "pending",
      age: 45,
      gender: "Male",
      symptoms: "Weight gain, Fatigue",
      requestedDate: "2023-06-17",
      avatar: "/avatars/3.jpg",
    },
  ];

  // 🔹 Local state copy so we can hide cards
  const [visibleRequests, setVisibleRequests] =
    useState<PatientRequest[]>(sampleRequests);

  // Get pending requests (from local copy, so we can hide after accept/reject)
  const pendingRequests = useMemo<PatientRequest[]>(
    () => visibleRequests.filter((r) => r.status === "pending"),
    [visibleRequests]
  );

  // Get counts for different statuses
  const stats = useMemo(
    () => ({
      pending: requests.filter((r: any) => r.status === "pending").length,
      active: requests.filter((r: any) => r.status === "accepted").length,
      consulted:
        requests.filter((r: any) => r.status === "consulted").length || 0,
      total: requests.length,
    }),
    [requests]
  );

  // Helper function to get patient name
  const getPatientName = (patient: PatientRequest) => {
    return patient.patientName || patient.name || "Unknown";
  };

  // Helper function to get patient dosha
  const getPatientDosha = (patient: PatientRequest) => {
    return patient.patientDosha || patient.dosha || "N/A";
  };

  // Handle patient selection
  const handleSelectPatient = (patient: PatientRequest) => {
    if (patient?.id) {
      setSelectedPatient(patient);
      setSearchParams({ patient: patient.id });
    }
  };

  // ✅ Handle accepting a request (hide + toast)
  const handleAcceptRequest = (id: string) => {
    setVisibleRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "accepted" } : r))
    );
    toast({
      title: "Request Accepted",
      description: "You have accepted this patient request.",
    });
  };

  // ✅ Handle rejecting a request (hide + toast)
  const handleRejectRequest = (id: string) => {
    setVisibleRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r))
    );
    toast({
      title: "Request Rejected",
      description: "You have rejected this patient request.",
    });
  };

  // Load selected patient from URL on mount
  useEffect(() => {
    const patientId = searchParams.get("patient");
    if (patientId) {
      const patient = requests.find((r: any) => r.id === patientId);
      if (patient) setSelectedPatient(patient);
    }
  }, [searchParams, requests]);

  // If a patient is selected, show patient details
  if (selectedPatient) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Patient Details</h1>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedPatient(null);
              setSearchParams({});
            }}
          >
            Back to Dashboard
          </Button>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Name</h3>
                  <p className="mt-1">{selectedPatient.patientName || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Dosha Type
                  </h3>
                  <p className="mt-1">{selectedPatient.patientDosha || "N/A"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Weight</h3>
                  <p className="mt-1">
                    {selectedPatient.weight
                      ? `${selectedPatient.weight} kg`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Height</h3>
                  <p className="mt-1">
                    {selectedPatient.height
                      ? `${selectedPatient.height} cm`
                      : "N/A"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500">
                    Lifestyle
                  </h3>
                  <p className="mt-1">{selectedPatient.lifestyle || "N/A"}</p>
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500">
                    Emergency Contact
                  </h3>
                  <p className="mt-1">
                    {selectedPatient.emergencyContact || "N/A"}
                  </p>
                </div>
              </div>

              {selectedPatient.documents?.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Medical Documents
                  </h3>
                  <div className="space-y-2">
                    {selectedPatient.documents.map(
                      (doc: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <span className="text-sm">{doc.name}</span>
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View
                            </a>
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Consultation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p className="mt-1 capitalize">{selectedPatient.status}</p>
                </div>
                {selectedPatient.status === "pending" && (
                  <div className="flex space-x-2">
                    <Button onClick={() => handleAcceptRequest(selectedPatient.id)}>
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRejectRequest(selectedPatient.id)}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main dashboard view
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
          <p className="text-gray-500">Welcome, {currentUser?.name || "User"}</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-yellow-400">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-yellow-600">
                  {stats.pending}
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Awaiting your response
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-blue-400">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {stats.active}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Currently under care
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-green-400">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Consulted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats.consulted}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Completed consultations
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-purple-400">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {stats.total}
              </div>
              <p className="mt-2 text-xs text-gray-500">All consultations</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                New Consultation Requests
              </CardTitle>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-full">
                  {pendingRequests.length} New
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {pendingRequests.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>No pending consultation requests</p>
              </div>
            ) : (
              <div className="divide-y">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex space-x-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                          <span className="text-lg font-medium">
                            {getPatientName(request)
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {getPatientName(request)}
                          </h4>
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <span className="capitalize">
                              {request.gender?.toLowerCase()}
                            </span>
                            <span className="mx-2">•</span>
                            <span>{request.age} years</span>
                            <span className="mx-2">•</span>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-600">
                              {getPatientDosha(request)} Dosha
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Symptoms:</span>{" "}
                            {request.symptoms}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className="text-xs text-gray-500">
                          Requested on {request.requestedDate}
                        </span>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectPatient(request)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleRejectRequest(request.id)}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAcceptRequest(request.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Accept
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
