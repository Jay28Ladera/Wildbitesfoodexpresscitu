import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import Navbar from "./Navbar";
import SPLoader from "./spinnerloader";
import "./Reports.css";
import "./orderAdmin.css";

function Report() {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
              report.paymentDetails?.studentId || // Fetch from paymentDetails
              report.studentId || // Fallback to top-level field
              report.priorityNumber || // Or priorityNumber
              "Unknown", // Default if none exist
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

  // Filter reports based on search query
  useEffect(() => {
    const filtered = reports.filter((report) =>
      (report.userName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (report.studentId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (report.priorityNumber || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredReports(filtered);
  }, [searchQuery, reports]);

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
          placeholder="Search reports by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ margin: "10px 0", padding: "6px", width: "300px" }}
        />

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
                <td>{report.studentId}</td> {/* Fetch from nested paymentDetails */}
                <td>₱{(report.orderTotal || report.totalPrice || 0).toFixed(2)}</td>
                <td>
                  {report.items?.length || report.orderItems?.length
                    ? (report.items || report.orderItems)
                        .map(
                          (item) =>
                            `${item.foodName || item.name} (x${item.quantity})`
                        )
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
                <td>{report.referenceNumber || "N/A"}</td>
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
