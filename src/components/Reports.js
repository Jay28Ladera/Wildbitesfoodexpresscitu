import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase/firebase"; // Ensure Firebase is configured correctly
import Navbar from "./Navbar"; // Include Navbar component
import SPLoader from "./spinnerloader"; // Include loading spinner
import "./Reports.css"; // Include custom CSS for reports
import "./orderAdmin.css"; // Include additional styling for admin orders

function Report() {
  const [reports, setReports] = useState([]); // Store fetched reports
  const [loading, setLoading] = useState(true); // Loading state
  const [reportType, setReportType] = useState("sales"); // Default report type
  const [filteredReports, setFilteredReports] = useState([]); // Filtered reports for display
  const [searchQuery, setSearchQuery] = useState(""); // Search query for filtering

  // Fetch reports based on the selected type (sales/cancellations)
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        // Define the collection name
        const collectionName =
          reportType === "sales"
            ? "successfulOrders"
            : reportType === "cancellations"
            ? "cancelledOrders"
            : "orders";

        // Fetch data from Firestore
        const reportsRef = collection(db, collectionName);
        const snapshot = await getDocs(reportsRef);

        // Map and structure the data
        const fetchedReports = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setReports(fetchedReports);
        setFilteredReports(fetchedReports); // Initially, all reports are shown
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [reportType]); // Refetch data when report type changes

  // Filter reports by search query
  useEffect(() => {
    const filtered = reports.filter((report) =>
      report.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredReports(filtered);
  }, [searchQuery, reports]);

  // Handle tab change for report type
  const handleTabChange = (type) => {
    if (reportType === type) return; // Avoid reloading if already selected
    setReportType(type);
    setSearchQuery(""); // Clear search when switching tabs
  };

  // Export filtered reports to CSV
  const exportToCSV = () => {
    if (filteredReports.length === 0) {
      alert("No data available to export.");
      return;
    }

    const rows = filteredReports.map((report) => ({
      Date: report.date || "N/A",
      OrderID: report.orderId || "N/A",
      Name: report.name || "Unknown",
      TotalAmount: report.totalAmount || 0,
      StaffAssigned: report.assignTo || "Unassigned",
      ModeOfPurchase: "N/A", // Add a value if applicable
      Status: report.status || "N/A",
    }));

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        Object.keys(rows[0]).join(","), // CSV headers
        ...rows.map((row) =>
          Object.values(row)
            .map((value) => `"${value}"`)
            .join(",")
        ),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <SPLoader />; // Show spinner while loading
  }

  return (
    <div className="App">
      <Navbar />
      <div className="reports-content" style={{ padding: "20px" }}>
        <h2>Wildcats Sales Reports</h2>
        <div className="report-tabs">
          <button
            className={`report-tab ${
              reportType === "sales" ? "active-tab" : ""
            }`}
            onClick={() => handleTabChange("sales")}
          >
            Sales Report
          </button>
          <button
            className={`report-tab ${
              reportType === "cancellations" ? "active-tab" : ""
            }`}
            onClick={() => handleTabChange("cancellations")}
          >
            Cancellations Report
          </button>
        </div>

        {/* Search Box */}
        <input
          type="text"
          placeholder="Search reports by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ margin: "10px 0", padding: "6px", width: "300px" }}
        />

        <table className="reports-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Order ID</th>
              <th>Name</th>
              <th>Total Amount</th>
              <th>Staff Assigned</th>
              <th>Mode of Purchase</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((report) => (
              <tr key={report.id}>
                <td>{report.date || "N/A"}</td>
                <td>{report.orderId || "N/A"}</td>
                <td>{report.name || "Unknown"}</td>
                <td>₱{report.totalAmount?.toFixed(2)}</td>
                <td>{report.assignTo || "Unassigned"}</td>
                <td>N/A</td>
                <td>{report.status || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <button onClick={exportToCSV} className="export-button">
          Export to CSV
        </button>
      </div>
    </div>
  );
}

export default Report;
