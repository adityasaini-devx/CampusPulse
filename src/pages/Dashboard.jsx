import { useState } from "react";

import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import ComplaintTable from "../components/ComplaintTable";

import { complaints as initialComplaints } from "../data";


function Dashboard() {

  // Load complaints from localStorage
  // If nothing is saved, use initial complaints
  const [complaints, setComplaints] = useState(() => {

    const savedComplaints =
      localStorage.getItem("campusComplaints");

    return savedComplaints
      ? JSON.parse(savedComplaints)
      : initialComplaints;

  });


  // Mark complaint as completed
  function handleMarkDone(id) {

    const updatedComplaints = complaints.map(
      (complaint) => {

        if (complaint.id === id) {

          return {
            ...complaint,
            status: "Resolved"
          };

        }

        return complaint;

      }
    );


    // Update screen
    setComplaints(updatedComplaints);


    // Save updated complaints
    localStorage.setItem(
      "campusComplaints",
      JSON.stringify(updatedComplaints)
    );

  }


  return (

    <>

      <Navbar />


      <main className="page">

        <div className="container">


          {/* =========================
              PAGE HEADING
          ========================== */}

          <section className="page-heading">

            <div>

              <span className="eyebrow">
                ADMINISTRATION
              </span>

              <h1>
                Campus Dashboard
              </h1>

              <p>
                Monitor complaints and campus maintenance activity.
              </p>

            </div>


            <div className="system-status">

              <span></span>

              All systems operational

            </div>

          </section>



          {/* =========================
              STATISTICS
          ========================== */}

          <section className="stats-grid">


            <StatCard
              title="Total Complaints"
              value="1,248"
              description="+14% from last month"
              icon="▣"
            />


            <StatCard
              title="Active Issues"
              value="24"
              description="6 require attention"
              icon="◷"
            />


            <StatCard
              title="Critical Issues"
              value="4"
              description="2 need immediate action"
              icon="!"
            />


            <StatCard
              title="Resolved"
              value="1,176"
              description="94.2% resolution rate"
              icon="✓"
            />

          </section>



          {/* =========================
              MAIN DASHBOARD
          ========================== */}

          <section className="dashboard-grid">


            {/* =========================
                COMPLAINTS
            ========================== */}

            <div className="card">

              <div className="section-header">

                <div>

                  <h2>
                    Recent Complaints
                  </h2>

                  <p>
                    Latest maintenance requests.
                  </p>

                </div>


                <a href="/analytics">
                  View analytics
                </a>

              </div>


              {/* Complaint Table */}

              <ComplaintTable
                complaints={complaints}
                onMarkDone={handleMarkDone}
              />

            </div>



            {/* =========================
                AI INSIGHT
            ========================== */}

            <div className="card ai-card">

              <span className="ai-label">
                ✦ DEMO AI INSIGHT
              </span>


              <h2>
                Electrical complaints are rising.
              </h2>


              <p>
                CSE Block has received 32% more
                electrical complaints this week.
              </p>


              <div className="recommendation">

                <small>
                  RECOMMENDED ACTION
                </small>


                <strong>
                  Schedule an electrical inspection.
                </strong>

              </div>


              <span className="priority">
                HIGH PRIORITY · 91/100
              </span>

            </div>

          </section>



          {/* =========================
              BOTTOM SECTION
          ========================== */}

          <section className="dashboard-grid">


            {/* =========================
                CAMPUS HEALTH
            ========================== */}

            <div className="card">

              <div className="section-header">

                <div>

                  <h2>
                    Campus Health
                  </h2>

                  <p>
                    Overall campus condition.
                  </p>

                </div>


                <strong className="health-score">
                  87
                </strong>

              </div>


              {[

                ["Electricity", 92],

                ["Water", 81],

                ["Internet", 90],

                ["Cleanliness", 88],

                ["Safety", 95]

              ].map(([name, value]) => (

                <div
                  className="health-row"
                  key={name}
                >

                  <div>

                    <span>
                      {name}
                    </span>

                    <strong>
                      {value}%
                    </strong>

                  </div>


                  <div className="progress">

                    <span
                      style={{
                        width: `${value}%`
                      }}
                    ></span>

                  </div>

                </div>

              ))}

            </div>



            {/* =========================
                TODAY'S ACTIVITY
            ========================== */}

            <div className="card">

              <div className="section-header">

                <div>

                  <h2>
                    Today's Activity
                  </h2>

                  <p>
                    Recent campus actions.
                  </p>

                </div>

              </div>


              <div className="activity">


                <div>

                  <span className="dot green"></span>

                  <p>

                    <strong>
                      CP-1046 resolved
                    </strong>

                    <small>
                      Projector issue · 20 minutes ago
                    </small>

                  </p>

                </div>



                <div>

                  <span className="dot orange"></span>

                  <p>

                    <strong>
                      CP-1048 assigned
                    </strong>

                    <small>
                      Electrical team · 42 minutes ago
                    </small>

                  </p>

                </div>



                <div>

                  <span className="dot blue"></span>

                  <p>

                    <strong>
                      New complaint received
                    </strong>

                    <small>
                      Library · 1 hour ago
                    </small>

                  </p>

                </div>


              </div>

            </div>

          </section>


        </div>

      </main>

    </>

  );

}


export default Dashboard;