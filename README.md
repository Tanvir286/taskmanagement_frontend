# TaskManagement

## Project Overview
**TaskManagement** হল একটি আধুনিক, উচ্চ-প্রদর্শন ক্ষমতার টাস্ক ম্যানেজমেন্ট সিস্টেম যা টিমের মধ্যে সহযোগিতা সহজ করে এবং প্রোডাক্টিভিটি বাড়ায়। এটি রিয়েল-টাইম আপডেট, রোল-ভিত্তিক এক্সেস কন্ট্রোল, এবং স্কেলেবল অ্যাপ্লিকেশনের জন্য অপ্টিমাইজড পারফরম্যান্স প্রদান করে।  

> **Note:** ভিডিওতে সব কিছুর বিস্তারিত দেওয়া আছে, একটু ভিডিও দেখুন  
> [Must Watch Video](https://drive.google.com/file/d/1l7TpYPZdS_dmm1QeOBwtgEiVmjcvnvYE/view?usp=sharing)  

---

## Demo Credentials

**User:**  
- Email: sukonna@gmail.com  
- Password: 123456  

**Admin:**  
- Email: tanvir1@gmail.com  
- Password: 123456  

---

## Live Demo

- **Frontend:** [Click Here](https://taskmanagement-frontend-ten.vercel.app)  
- **Backend:** [Click Here](https://nestjs-task-production-09a2.up.railway.app/)  

---

## Repositories

- **Frontend:** [GitHub](https://github.com/Tanvir286/taskmanagement_frontend)  
- **Backend:** [GitHub](https://github.com/Tanvir286/taskmanagement)  

---

## Tech Stack

**Backend:**  
- NestJS  
- TypeScript  
- Socket.IO  
- Redis  
- PostgreSQL  

**Frontend:**  
- Next.js (React)  
- Material-UI / Tailwind CSS  

**Real-Time Communication:**  
- Socket.IO + Redis (Pub/Sub)  

**Authentication:**  
- JWT-based auth with role-based access control  

**API Testing:**  
- Swagger / Postman  

---

## Architecture & Modules

### Modular Backend Structure (NestJS & TypeScript)
Backend স্পষ্ট এবং maintainable modules এ organized:

1. **Auth Module:**  
   - ইউজার authentication  
   - JWT-based authorization  
   - Secure role-based access  

2. **Task Module:**  
   - Task creation, update, assignment  
   - Status tracking  

3. **Notification Module:**  
   - Real-time notification পাঠানো  
   - Task updates ও alerts  

### Real-time Functionality
- Socket.IO ব্যবহার করে রিয়েল-টাইম task updates ও notifications।  
- Redis ব্যবহার করা হয়েছে caching ও pub/sub এর জন্য, যাতে দ্রুত এবং নির্ভরযোগ্য messaging হয়।  

### Role-Based Access Control
- NestJS AuthGuard এবং custom roles decorators ব্যবহার করে implement করা হয়েছে।  
- Admin এবং User role অনুযায়ী granular permissions।  

---

**Project Author:** Tanvir Ahmed  
