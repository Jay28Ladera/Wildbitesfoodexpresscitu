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

        const fetchedReports = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((report) => report.status === "Completed"); // Only include completed orders

        // Format dates and ensure data integrity
        const formattedReports = fetchedReports.map((report) => {
          const date = report.orderDate
            ? new Date(report.orderDate)
            : new Date(report.createdAt?.toDate?.());
          const formattedDate = date
            ? date.toISOString().split("T")[0].replace(/-/g, "/")
            : "N/A";

          return {
            ...report,
            date: formattedDate,
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
      (report.userName || "").toLowerCase().includes(searchQuery.toLowerCase())
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
              <th>Order ID</th>
              <th>Name</th>
              <th>Student ID</th>
              <th>Total Amount</th>
              <th>Product</th>
              <th>Staff Assigned</th>
              <th>Receipt</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((report) => (
              <tr key={report.id}>
                <td>{report.date}</td>
                <td>{report.id || "N/A"}</td>
                <td>{report.userName || "Unknown"}</td>
                <td>{report.studentId || "N/A"}</td>
                <td>₱{(report.orderTotal || 0).toFixed(2)}</td>
                <td>
                  {report.items?.length
                    ? report.items
                        .map(
                          (item) =>
                            `${item.foodName || item.name} (x${item.quantity})`
                        )
                        .join(", ")
                    : "N/A"}
                </td>
                <td>{report.assignTo || "Unassigned"}</td>
                <td>
                  {report.paymentDetails?.receiptUrl ? (
                    <a
                      href={report.paymentDetails.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Receipt
                    </a>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td>{report.status || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Report;
