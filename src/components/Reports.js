import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import Navbar from "./Navbar";
import SPLoader from "./spinnerloader";
import { saveAs } from "file-saver"; // For saving the file
import "./Reports.css";
import "./orderAdmin.css";

function Report() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(""); // Date filter state

  const totalSales = filteredReports.reduce((sum, report) => {
    const total = report.orderTotal || report.totalPrice || 0; // Use orderTotal or totalPrice for each report
    return sum + total;
  }, 0);

  // Fetch completed orders from Firestore
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const reportsRef = collection(db, "successfulOrders");
        const snapshot = await getDocs(reportsRef);

        const fetchedReports = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Format dates and ensure data integrity
        const formattedReports = fetchedReports.map((report) => {
          const date = report.orderDate
            ? new Date(report.orderDate)
            : report.createdAt?.toDate
            ? new Date(report.createdAt.toDate())
            : null;
          const formattedDate = date
            ? date.toISOString().split("T")[0].replace(/-/g, "/")
            : "N/A";

          return {
            ...report,
            date: formattedDate,
            studentId:
              report.paymentDetails?.studentId ||
              report.studentId ||
              report.priorityNumber ||
              "Unknown",
          };
        });

        setReports(formattedReports);
        setFilteredReports(formattedReports);
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Filter reports based on search query and selected date
  useEffect(() => {
    const filtered = reports.filter((report) => {
      const matchesSearchQuery =
        (report.userName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (report.studentId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (report.priorityNumber || "").toLowerCase().includes(searchQuery.toLowerCase());

      const formattedSelectedDate = selectedDate
        ? selectedDate.replace(/-/g, "/")
        : null;

      const matchesDateFilter = formattedSelectedDate
        ? report.date === formattedSelectedDate
        : true;

      return matchesSearchQuery && matchesDateFilter;
    });
    setFilteredReports(filtered);
  }, [searchQuery, selectedDate, reports]);

  // Generate CSV content and download the file
  const downloadCSV = () => {
    const headers = [
      "Date",
      "Name",
      "Student ID / Priority Number",
      "Total Amount",
      "Products",
      "Staff Assigned",
      "Receipt",
      "Reference Number",
      "Status",
    ];

    const rows = filteredReports.map((report) => [
      report.date,
      report.userName || "Unknown",
      report.studentId,
      `${report.orderTotal || report.totalPrice ? `₱${(report.orderTotal || report.totalPrice).toFixed(2)}` : "₱0.00"}`,
      report.items?.length || report.orderItems?.length
        ? (report.items || report.orderItems)
            .map((item) => `${item.foodName || item.name} (x${item.quantity})`)
            .join(", ")
        : "N/A",
      report.assignTo || report.assign || "Unassigned",
      report.paymentDetails?.receiptUrl || report.receiptUrl || "N/A",
      report.paymentDetails?.referenceNumber || "N/A",
      report.status || report.orderStatus || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((field) => `"${field}"`).join(",")),
    ].join("\n");

    const csvWithBom = "\uFEFF" + csvContent;

    const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "report.csv");
  };

  if (loading) {
    return <SPLoader />;
  }

  return (
    <div className="App">
      <Navbar />
      <div className="reports-content" style={{ padding: "20px" }}>
        <h2>Completed Orders Report</h2>

        {/* Search Box */}
        <input
          type="text"
          placeholder="Search reports by name, student ID, or priority number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ margin: "10px 0", padding: "6px", width: "300px" }}
        />

        {/* Date Picker */}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ margin: "10px 10px 10px 0", padding: "6px", width: "200px" }}
        />

        <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
          {/* Download CSV Button */}
          <button
            onClick={downloadCSV}
            style={{
              padding: "10px 15px",
              backgroundColor: "#b30000",
              color: "white",
              border: "none",
              cursor: "pointer",
              borderRadius: "10px",
            }}
          >
            Download CSV
          </button>

          {/* Total Sales */}
          <span style={{ marginLeft: "20px", fontSize: "16px", fontWeight: "bold" }}>
            Total Sales: ₱{totalSales.toFixed(2)}
          </span>
        </div>

        <table className="reports-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Name</th>
              <th>Student ID / Priority Number</th>
              <th>Total Amount</th>
              <th>Products</th>
              <th>Staff Assigned</th>
              <th>Receipt</th>
              <th>Reference Number</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((report) => (
              <tr key={report.id}>
                <td>{report.date}</td>
                <td>{report.userName || "Unknown"}</td>
                <td>{report.studentId}</td>
                <td>₱{(report.orderTotal || report.totalPrice || 0).toFixed(2)}</td>
                <td>
                  {report.items?.length || report.orderItems?.length
                    ? (report.items || report.orderItems)
                        .map((item) => `${item.foodName || item.name} (x${item.quantity})`)
                        .join(", ")
                    : "N/A"}
                </td>
                <td>{report.assignTo || report.assign || "Unassigned"}</td>
                <td>
                  {report.paymentDetails?.receiptUrl || report.receiptUrl ? (
                    <a
                      href={report.paymentDetails?.receiptUrl || report.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Receipt
                    </a>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td>{report.paymentDetails?.referenceNumber || "N/A"}</td>
                <td>{report.status || report.orderStatus || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Report;
