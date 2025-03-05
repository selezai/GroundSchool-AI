## **Backend Documentation** (`backend.md`)  

### **1. Backend Framework**  
- **Framework**: Node.js with Express.js (lightweight, scalable, and widely used for RESTful APIs).  
- **Why**: Node.js is efficient for handling asynchronous operations, and Express.js simplifies API development.  

---

### **2. Database**  
- **Database**: PostgreSQL (relational database, supported by Supabase).  
- **Schema Design**:  
  - **Users Table**: Stores user profiles and authentication data.  
  - **Questions Table**: Stores generated MCQs and references to study materials.  
  - **Activity Table**: Tracks user attempts (complete/incomplete) with a 30-day retention policy.  

- **Example Schema**:  
  ```sql  
  CREATE TABLE users (  
    id SERIAL PRIMARY KEY,  
    email TEXT UNIQUE NOT NULL,  
    password_hash TEXT NOT NULL,  
    created_at TIMESTAMP DEFAULT NOW()  
  );  

  CREATE TABLE questions (  
    id SERIAL PRIMARY KEY,  
    user_id INT REFERENCES users(id),  
    question_text TEXT NOT NULL,  
    options JSONB NOT NULL,  
    correct_answer TEXT NOT NULL,  
    material_reference TEXT,  
    created_at TIMESTAMP DEFAULT NOW()  
  );  

  CREATE TABLE activity (  
    id SERIAL PRIMARY KEY,  
    user_id INT REFERENCES users(id),  
    session_id TEXT NOT NULL,  
    status TEXT NOT NULL, -- 'complete' or 'incomplete'  
    created_at TIMESTAMP DEFAULT NOW()  
  );  
  ```  

---

### **3. Authentication**  
- **Method**: Email/password + optional Google/Apple OAuth.  
- **Library**: Supabase Auth (handles authentication, session management, and password recovery).  
- **Example**:  
  ```javascript  
  const { data, error } = await supabase.auth.signUp({  
    email: 'user@example.com',  
    password: 'password',  
  });  

  if (error) {  
    console.error('[Auth] Signup failed:', error.message);  
  }  
  ```  

---

### **4. API Design**  
- **Type**: RESTful APIs (simple, stateless, and easy to integrate).  
- **Endpoints**:  
  - **POST /upload**: Upload PDF/image for processing.  
  - **GET /questions**: Fetch generated MCQs.  
  - **POST /answers**: Submit user answers and receive results.  
  - **GET /activity**: Fetch recent activity.  

- **Example Endpoint**:  
  ```javascript  
  app.post('/upload', async (req, res) => {  
    const { file, userId } = req.body;  
    try {  
      const questions = await generateQuestions(file);  
      await saveQuestions(userId, questions);  
      res.status(200).json({ success: true, questions });  
    } catch (error) {  
      console.error('[Upload] Failed:', error.message);  
      res.status(500).json({ success: false, error: 'Upload failed' });  
    }  
  });  
  ```  

---

### **5. File Handling**  
- **Storage**: Supabase Storage (temporary storage for uploaded files).  
- **Process**:  
  1. User uploads file → stored temporarily in Supabase Storage.  
  2. DeepSeek R1 processes file → generates MCQs.  
  3. Uploaded file deleted post-processing.  

- **Example**:  
  ```javascript  
  const uploadFile = async (fileUri, userId) => {  
    const fileExt = fileUri.split('.').pop();  
    const fileName = `${userId}_${Date.now()}.${fileExt}`;  
    const { data, error } = await supabase.storage  
      .from('uploads')  
      .upload(fileName, file);  

    if (error) throw new Error('Upload failed. Please try again.');  
    return data.path;  
  };  
  ```  

---

### **6. AI Integration**  
- **Model**: Claude (free version) for text extraction and question generation.  
- **Process**:  
  1. Extract text from uploaded file.  
  2. Generate 8–50 MCQs with references to study materials.  
  3. Store questions in PostgreSQL database.  

- **Example**:  
  ```javascript  
  const generateQuestions = async (filePath) => {  
    const text = await extractText(filePath);  
    const questions = await claudeAPI.generateQuestions(text);  
    return questions;  
  };  
  ```  

---

### **7. Error Handling**  
- **API Errors**: Return specific error messages and status codes.  
- **Example**:  
  ```javascript  
  app.use((err, req, res, next) => {  
    console.error('[API] Error:', err.message);  
    res.status(500).json({ success: false, error: 'Internal server error' });  
  });  
  ```  

---

### **8. Performance Optimization**  
- **Database Indexing**: Index frequently queried fields (e.g., `user_id` in `questions` table).  
- **Caching**: Use Redis for caching frequently accessed data (e.g., recent activity).  
- **Example**:  
  ```javascript  
  const redis = require('redis');  
  const client = redis.createClient();  

  const getRecentActivity = async (userId) => {  
    const cacheKey = `activity_${userId}`;  
    const cachedData = await client.get(cacheKey);  
    if (cachedData) return JSON.parse(cachedData);  

    const data = await fetchActivityFromDB(userId);  
    await client.set(cacheKey, JSON.stringify(data), 'EX', 3600); // Cache for 1 hour  
    return data;  
  };  
  ```  

---

### **9. Security**  
- **Input Validation**: Sanitize user inputs to prevent SQL injection and XSS attacks.  
- **Data Encryption**: Encrypt sensitive data (e.g., passwords) using bcrypt.  
- **Example**:  
  ```javascript  
  const bcrypt = require('bcrypt');  

  const hashPassword = async (password) => {  
    const saltRounds = 10;  
    return await bcrypt.hash(password, saltRounds);  
  };  
  ```  

---

### **10. Third-Party Libraries**  
- **Supabase**: Authentication, database, and storage.  
- **Claude API**: AI-powered question generation.  
- **Redis**: Caching for performance optimization.  
- **Bcrypt**: Password hashing and encryption.  

