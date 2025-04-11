"use client";

import Link from "next/link";
import { useState } from "react";

// Options for the various filters
const tagOptions = [
  { label: "All", value: "" },
  { label: "Mechanics", value: "MECHANICS" },
  { label: "Electricity", value: "ELECTRICITY" },
  { label: "Thermodynamics", value: "THERMODYNAMICS" },
  { label: "Optics", value: "OPTICS" },
  { label: "Modern", value: "MODERN" },
  { label: "Advanced", value: "ADVANCED" },
  { label: "Other", value: "OTHER" },
];

const problemStatusOptions = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Returned", value: "RETURNED" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Archived", value: "ARCHIVED" },
];

const translatedStatusOptions = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Returned", value: "RETURNED" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Archived", value: "ARCHIVED" },
];

const nominatedOptions = [
  { label: "All", value: "" },
  { label: "No", value: "No" },
  { label: "Yes", value: "Yes" },
];

const aiPerformanceOptions = [
  { label: "All", value: "" },
  { label: "0", value: "0" },
];

export default function DownloadProblemPage() {
  const [loading, setLoading] = useState(false);

  // Filter state values.
  // Default status is "APPROVED" to mimic the previous behavior.
  const [tag, setTag] = useState("");
  const [status, setStatus] = useState("APPROVED");
  const [translatedStatus, setTranslatedStatus] = useState("");
  const [nominated, setNominated] = useState("");
  const [aiPerformances, setAiPerformances] = useState("");

  const handleDownload = async () => {
    setLoading(true);
    try {
      // Build query string from filters.
      const queryParams = new URLSearchParams();
      if (tag) queryParams.append("tag", tag);
      if (status) queryParams.append("status", status);
      if (translatedStatus) queryParams.append("translatedStatus", translatedStatus);
      if (nominated) queryParams.append("nominated", nominated);
      if (aiPerformances) queryParams.append("aiPerformances", aiPerformances);

      const res = await fetch(`/api/data/getapprovedproblems?${queryParams.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch problems");
      }

      // Create a JSON blob and trigger a download.
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "problems.json";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Error in handleDownload:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-y-auto p-4">
      <Link href="/admin">
        <button className="mt-2 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors">
          返回AdminPage主页
        </button>
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-4">
        {/* Tag Dropdown */}
        <div>
          <label htmlFor="tag" className="block mb-1 font-medium">
            Tag:
          </label>
          <select
            id="tag"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {tagOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Problem Status Dropdown */}
        <div>
          <label htmlFor="status" className="block mb-1 font-medium">
            Problem Status:
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {problemStatusOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Translated Status Dropdown */}
        <div>
          <label htmlFor="translatedStatus" className="block mb-1 font-medium">
            Translated Status:
          </label>
          <select
            id="translatedStatus"
            value={translatedStatus}
            onChange={(e) => setTranslatedStatus(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {translatedStatusOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Nominated Dropdown */}
        <div>
          <label htmlFor="nominated" className="block mb-1 font-medium">
            Nominated:
          </label>
          <select
            id="nominated"
            value={nominated}
            onChange={(e) => setNominated(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {nominatedOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* AI Performances Dropdown */}
        <div>
          <label htmlFor="aiPerformances" className="block mb-1 font-medium">
            AI Performances:
          </label>
          <select
            id="aiPerformances"
            value={aiPerformances}
            onChange={(e) => setAiPerformances(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {aiPerformanceOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={handleDownload}
          disabled={loading}
          className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          {loading ? "Downloading..." : "Download Problems"}
        </button>
      </div>
    </div>
  );
}
