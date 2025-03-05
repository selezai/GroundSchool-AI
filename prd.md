## **Product Requirements Document (PRD): GroundSchool-AI**  
**Version 1.0**  

---

### **1. App Overview**  
#### **1.1 App Name**  
**GroundSchool-AI**  

#### **1.2 Tagline**  
*"AI-powered aviation study app for pilots."*  

#### **1.3 Purpose**  
GroundSchool-AI helps pilots study for SACAA exams by generating exam-style questions from uploaded study materials (PDFs/images). The app provides immediate feedback, tracks progress, and ensures a professional, aviation-themed user experience.  

#### **1.4 Key Features**  
1. **AI-Powered Question Generation**: Upload study materials (PDFs/images) to generate 8–50 SACAA-style MCQs.  
2. **Immediate Feedback**: Users receive pass/fail results (75% pass threshold) with references to study materials for incorrect answers.  
3. **Recent Activity**: Track past attempts and resume incomplete question sets (data retained for 30 days).  
4. **Simple Authentication**: Email/password + optional Google/Apple login.  
5. **Professional UI/UX**: Aviation-inspired design with dark mode as default.  

---

### **2. Target Audience**  
#### **2.1 Primary Users**  
- **Student Pilots**: Preparing for SACAA exams.  
- **Licensed Pilots**: Refreshing knowledge or staying updated.  

#### **2.2 User Pain Points**  
- Lack of personalized study materials.  
- Difficulty finding SACAA-style practice questions.  
- Limited progress tracking tools.  

---

### **3. Key Features & Functionality**  
#### **3.1 User Authentication**  
- **Email/Password**: Standard sign-up/login.  
- **Social Login**: Optional Google/Apple login.  
- **Forgot Password**: Email-based password recovery.  

#### **3.2 Material Upload & Processing**  
- **File Types**: PDFs and images (max 20MB).  
- **AI Processing**: Claude (free version) extracts text and generates 8–50 MCQs.  
- **No Data Storage**: Uploaded files are deleted after processing.  

#### **3.3 Question Bank**  
- **Dynamic Question Count**: AI determines the number of questions based on content.  
- **Immediate Feedback**: Pass/fail results with references for incorrect answers.  

#### **3.4 Recent Activity**  
- **Past Attempts**: View complete/incomplete question sets.  
- **Resume Incomplete Sets**: Continue where the user left off.  
- **30-Day Retention**: Activity data is auto-deleted after 30 days.  

#### **3.5 Profile Screen**  
- **User Email**: Display logged-in user’s email.  
- **Log Out**: Clear session and return to login screen.  
- **Contact Support**: Open email client to `groundschoolai@gmail.com`.  

---

### **4. Technical Requirements**  
#### **4.1 Frontend**  
- **Framework**: React Native (cross-platform mobile development).  
- **UI Library**: NativeBase (pre-built components).  
- **Styling**: Styled Components (dynamic theming).  
- **State Management**: Zustand (global state) + AsyncStorage (persistence).  
- **Navigation**: React Navigation (Stack + Bottom Tabs).  

#### **4.2 Backend**  
- **Framework**: Node.js with Express.js.  
- **Database**: PostgreSQL (Supabase).  
- **Authentication**: Supabase Auth (email/password + Google/Apple).  
- **File Handling**: Supabase Storage (temporary file storage).  
- **AI Integration**: Claude API (text extraction + question generation).  

#### **4.3 Performance Optimization**  
- **Frontend**: Lazy loading, code splitting.  
- **Backend**: Database query optimization, Redis caching.  

#### **4.4 Security**  
- **Input Validation**: Sanitize user inputs to prevent SQL injection and XSS attacks.  
- **Data Encryption**: Encrypt sensitive data (e.g., passwords) using bcrypt.  

---

### **5. User Flow**  
#### **5.1 New Users**  
1. **Splash Screen** → **Login/Signup** (Email + optional Google/Apple).  
2. **Home Screen**:  
   - **Question Bank Button** → **Upload Screen** → Generate MCQs.  
   - **Recent Activity Button** → View past attempts.  
3. **Results Screen**: Review incorrect answers with references.  

#### **5.2 Returning Users**  
1. **Open App** → **Home Screen** (if already logged in).  
2. **Recent Activity Screen**: Resume incomplete sets or start new.  

---

### **6. Success Metrics**  
- **User Retention**: 70% of users return weekly.  
- **Question Accuracy**: 90% of AI-generated questions deemed relevant by pilots.  
- **App Rating**: 4.5+ stars on App Store/Play Store.  

---

### **7. Assumptions & Risks**  
#### **7.1 Assumptions**  
- Users have access to study materials in PDF/image format.  
- Claude API will reliably generate high-quality questions.  

#### **7.2 Risks**  
- **AI Processing Failures**: Fallback to local question templates.  
- **Supabase Rate Limits**: Optimize queries and monitor usage.  
- **Large File Uploads**: Compress images client-side to reduce failures.  

---

### **8. Timeline**  
- **Phase 1: Core MVP** (4 Weeks):  
  - Set up Supabase + React Native.  
  - Implement auth, file upload, and question generation.  
- **Phase 2: UI/UX Polish** (2 Weeks):  
  - Add glassmorphism, HUD elements, and animations.  
- **Phase 3: Testing & Deployment** (2 Weeks):  
  - Conduct load testing and deploy to App Store/Play Store.  

---

### **9. Third-Party Libraries**  
| **Library**            | **Purpose**                                                                 |  
|-------------------------|-----------------------------------------------------------------------------|  
| **React Navigation**    | Navigation between screens (Stack + Bottom Tabs).                           |  
| **NativeBase**          | Pre-built UI components.                                                    |  
| **Styled Components**   | Styling and theming.                                                        |  
| **Zustand**             | Global state management.                                                    |  
| **Supabase**            | Authentication, database, and storage.                                      |  
| **Claude API**         | AI-powered question generation.                                             |  
| **Redis**               | Caching for performance optimization.                                       |  
| **Bcrypt**              | Password hashing and encryption.                                            |  
| **Jest**                | Unit testing.                                                               |  
| **React Testing Library**| Integration testing.                                                        |  

