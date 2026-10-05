# 🚀 CampusPulse

## Smart Campus Maintenance & Issue Intelligence Platform

CampusPulse is an **ML-powered campus maintenance and issue intelligence platform** designed to transform traditional complaint management into an intelligent decision-support system.

Instead of simply storing and forwarding complaints, CampusPulse uses **Machine Learning, Clustering, and Ensemble Learning** to:

- Predict complaint priority
- Identify similar complaints
- Detect recurring campus issues
- Analyze complaint patterns
- Prioritize maintenance requests
- Help administrators make faster and more informed decisions

---

## 🎯 Problem Statement

In a traditional campus complaint system, complaints are usually recorded and forwarded manually. This makes it difficult to determine:

- Which complaints require immediate attention
- Whether multiple complaints describe the same issue
- Which problems are recurring
- How many users are affected by an issue
- Which maintenance requests should be handled first

CampusPulse addresses these problems by adding an **ML-assisted intelligence layer** to the complaint management process.

For example, multiple complaints about **Wi-Fi failure in the same laboratory** can be recognized as a common issue pattern. Similarly, an issue affecting a large number of users with high severity can automatically receive a higher priority.

---

# ✨ Key Features

### 📝 Complaint Submission

Students and faculty can report campus maintenance issues such as:

- Wi-Fi failures
- Projector malfunctions
- AC issues
- Laboratory PC problems
- Electrical faults
- Classroom equipment failures

### 🤖 Priority Prediction

CampusPulse predicts the priority of a complaint into four categories:

- 🟢 Low
- 🟡 Medium
- 🟠 High
- 🔴 Critical

### 🔎 Similar Complaint Detection

The system identifies complaints that are similar to each other and helps administrators understand whether multiple complaints are related to the same underlying problem.

### 🔄 Recurring Issue Detection

Historical complaint patterns are analyzed to identify issues that repeatedly occur in specific locations or categories.

### 📊 ML Model Comparison

Multiple classification algorithms are trained and evaluated:

- Logistic Regression
- Decision Tree
- Random Forest
- XGBoost / Gradient Boosting

### 🧩 Ensemble Learning

Different models are combined using:

- Hard Voting
- Soft Voting
- Bagging
- Boosting

The performance of ensemble models is compared with individual classifiers.

### 📈 Maintenance Intelligence

The system combines ML outputs into actionable indicators such as:

- Predicted priority
- Number of similar complaints
- Recurring issue status
- Number of affected users
- Complaint patterns

### 🖥️ Admin Dashboard

Administrators can:

- View complaints
- Analyze issue patterns
- Prioritize complaints
- Assign / forward complaints
- Track resolution
- Monitor maintenance issues

---

# 🧠 Machine Learning Approach

## 1. Dataset & Data Understanding

The complaint dataset contains information such as:

- Issue category
- Location
- Severity
- Number of affected users
- Issue duration
- Previous similar complaints
- Complaint frequency
- Priority

The dataset is analyzed to understand:

- Feature distributions
- Relationships between variables
- Data quality
- Missing values
- Relevant patterns

---

## 2. Data Preprocessing & Feature Engineering

The preprocessing pipeline includes:

- Handling missing values
- Encoding categorical variables
- Scaling numerical features where required
- Feature selection
- Historical feature creation
- Train-test splitting

---

## 3. Complaint Priority Classification

The system performs **multi-class classification** to predict:

```text
Low
Medium
High
Critical
