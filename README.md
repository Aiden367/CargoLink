# 🌐 CargoLink

> A modern, full-stack logistics tracking web application. Designed for speed, scalability, and user experience, the platform features a sleek UI and robust backend architecture. Built with React, Node.js, JavaScript, and MongoDB,and Redis.


## 📌 Table of Contents

- [About the Project](#about-the-project)
- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)

---


📦 Overview

CargoLink is a web application built for logistics-focused companies to manage and track their operations from a single platform. It allows businesses to monitor orders, customers, vehicles, inventory, and delivery drivers in real time.

To ensure high performance and scalability, CargoLink uses Redis for fast caching and Redis Geolocation commands to track the live locations of drivers and deliveries. This significantly improves response times while reducing load on the NoSQL database.

The application also implements JWT-based authentication to securely manage user sessions and protect API endpoints.

CargoLink features an interactive map for real-time tracking, as well as a comprehensive dashboard that provides insights into order volumes, driver activity, and delivery status.

---

✨ Key Features

- 📍 Real-time driver and order tracking using Redis Geolocation

- 📦 Inventory and stock management

- 🚛 Vehicle and delivery driver monitoring

- 🗺️ Interactive map visualization

- 📊 Centralized dashboard with operational insights

- ⚡ Redis-powered caching for high performance

- 🔐 Secure JWT authentication and protected API routes
  
---

## 📸 Screenshots

## Homepage
![Logistics- Home-page](https://github.com/user-attachments/assets/c0ad94b7-9906-4996-919a-e444aa2c9e3f)

![Tracking](https://github.com/user-attachments/assets/9313784c-fb9d-4773-abdc-7a8743a41f7d)


![Driver-home](https://github.com/user-attachments/assets/6c5e4556-d2b1-4c24-904b-91a27860457e)


## Orders Page

![Orders-page](https://github.com/user-attachments/assets/f30ba6cd-15bc-4140-816e-dd52e60a9f16)

## Drivers Page

![Drivers-page](https://github.com/user-attachments/assets/5140cd68-a86b-4a70-bdb9-a4bbf5a8d497)

## Vehicles Page
![Vehiclees-page](https://github.com/user-attachments/assets/5e195fdb-5f2f-472d-8dd8-c3172784db67)

## Vendors Page
![Vendors-page](https://github.com/user-attachments/assets/0262831a-bb1c-4af0-bed6-17b157b76046)


## Products Page
![Products-paage](https://github.com/user-attachments/assets/3cfb85a9-1a5e-4156-8456-b64f992435ef)

## Login Page
![Login-page](https://github.com/user-attachments/assets/585e253d-779a-4da1-9594-b48f110a0197)

## Register  Page
![Register-page](https://github.com/user-attachments/assets/c7246fc2-d560-4701-8c8e-b5ffdda3cc62)

## Order Tracking Page
![order-tracking-page](https://github.com/user-attachments/assets/45b7963f-5332-4cc5-a68f-587cdfa3dbe6)




---

## 🧰 Tech Stack

| Frontend           | Backend            | Database | Security                           |       
|--------------------|--------------------|----------|------------------------------------
| React (JavaScript) | Node.js + Express  | MongoDB,Redis  | Helmet, xss-clean, RateLimit | 

---
