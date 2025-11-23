# Backend API Contract: JOSOOR Platform (Detailed)

## Base URL
`http://<your-backend-host>/api/v1/`

---

## Chat & Conversations (`/chat`)

### Send Message
**POST** `/chat/message`
- **Request:**
  ```json
  {
    "query": "What are the top risks for 2025?",
    "conversation_id": 123,
    "persona": "transformation_analyst"
  }
  ```
- **Response:**
  ```json
  {
    "conversation_id": 123,
    "message": "The top risks for 2025 are...",
    "visualization": null,
    "insights": ["Risk 1", "Risk 2"],
    "artifacts": [
      {
        "artifact_type": "CHART",
        "title": "Risks Overview",
        "content": { /* Highcharts config or table data */ },
        "description": "Chart of risks"
      }
    ],
    "clarification_needed": false,
    "clarification_questions": [],
    "clarification_context": null
  }
  ```

### List Conversations
**GET** `/chat/conversations?user_id=1&limit=50`
- **Response:**
  ```json
  {
    "conversations": [
      {
        "id": 123,
        "title": "Risks Analysis",
        "message_count": 5,
        "created_at": "2025-11-16T12:00:00Z",
        "updated_at": "2025-11-16T12:05:00Z"
      }
    ]
  }
  ```

### Get Conversation Details
**GET** `/chat/conversations/{conversation_id}`
- **Response:**
  ```json
  {
    "conversation": {
      "id": 123,
      "title": "Risks Analysis",
      "created_at": "2025-11-16T12:00:00Z",
      "updated_at": "2025-11-16T12:05:00Z",
      "user_id": 1
    },
    "messages": [
      {
        "id": 1,
        "role": "user",
        "content": "What are the top risks for 2025?",
        "created_at": "2025-11-16T12:01:00Z",
        "metadata": {}
      },
      {
        "id": 2,
        "role": "assistant",
        "content": "The top risks for 2025 are...",
        "created_at": "2025-11-16T12:02:00Z",
        "metadata": {}
      }
    ]
  }
  ```

### Delete Conversation
**DELETE** `/chat/conversations/{conversation_id}`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Conversation deleted successfully"
  }
  ```

### Get Messages for a Conversation
**GET** `/chat/conversations/{conversation_id}/messages`
- **Response:**
  ```json
  {
    "messages": [
      {
        "id": 1,
        "role": "user",
        "content": "What are the top risks for 2025?",
        "created_at": "2025-11-16T12:01:00Z",
        "metadata": {}
      }
    ]
  }
  ```

### Get Debug Logs
**GET** `/chat/debug_logs/{conversation_id}`
- **Response:**  
  Returns debug log structure for agent reasoning, events, etc.

---

## File Upload (`/files`)

### Upload Files
**POST** `/files/upload`
- **Request:** `multipart/form-data`
  - `files`: List of files
  - `conversation_id`: (optional)
- **Response:**
  ```json
  {
    "success": true,
    "file_ids": ["uuid1", "uuid2"],
    "message": "Successfully uploaded 2 files."
  }
  ```

---

## Data Sync (`/sync`)

### Sync All to Neo4j
**POST** `/sync/neo4j/all`
- **Request:**
  ```json
  { "year": 2025 }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Data synced successfully for year 2025",
    "details": { /* sync details */ }
  }
  ```

### Sync Incremental to Neo4j
**POST** `/sync/neo4j/incremental`
- **Request:**
  ```json
  {
    "entity_type": "Project",
    "entity_id": "123",
    "year": 2025
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Entity synced successfully",
    "details": { /* sync details */ }
  }
  ```

### Clear Neo4j
**POST** `/sync/neo4j/clear`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Neo4j database cleared successfully",
    "details": { /* clear details */ }
  }
  ```

### Neo4j Status
**GET** `/sync/neo4j/status`
- **Response:**
  ```json
  {
    "status": "healthy",
    "connected": true,
    "details": { /* stats */ }
  }
  ```

---

## Authentication (`/auth`)

### Login
**POST** `/auth/login`
- **Request:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "access_token": "jwt-token",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "User Name"
    }
  }
  ```

### Register
**POST** `/auth/register`
- **Request:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "User Name"
  }
  ```
- **Response:**
  ```json
  {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "User Name"
    },
    "message": "User registered successfully"
  }
  ```

### Get Current User
**GET** `/auth/users/me`
- **Response:**
  ```json
  {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name"
  }
  ```

---

## Embeddings Management (`/embeddings`)

### Populate Schema Embeddings
**POST** `/embeddings/populate/schema`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Populated 100 schema embeddings",
    "count": 100
  }
  ```

### Populate Entity Embeddings
**POST** `/embeddings/populate/entities`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Populated 500 entity embeddings",
    "count": 500
  }
  ```

### Populate All Embeddings
**POST** `/embeddings/populate/all`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Populated all embeddings",
    "schema_count": 100,
    "entity_count": 500,
    "total_count": 600
  }
  ```

### Search Schema
**GET** `/embeddings/search/schema?query=project&top_k=5`
- **Response:**
  ```json
  {
    "success": true,
    "query": "project",
    "results": [ /* embedding results */ ]
  }
  ```

### Search Entities
**GET** `/embeddings/search/entities?query=project&entity_type=Project&top_k=10`
- **Response:**
  ```json
  {
    "success": true,
    "query": "project",
    "results": [ /* embedding results */ ]
  }
  ```

---

## Debug & Config (`/debug`)

### Toggle Debug Prompts
**POST** `/debug/prompts/toggle`
- **Request:**
  ```json
  { "enabled": true }
  ```
- **Response:**
  ```json
  {
    "status": "enabled",
    "message": "Debug mode ON - All LLM prompts will be logged to console",
    "warning": "Check server logs to see prompts"
  }
  ```

### Debug Status
**GET** `/debug/prompts/status`
- **Response:**
  ```json
  {
    "debug_enabled": true,
    "message": "Debug logs visible in server console"
  }
  ```

### Database Config
**GET** `/debug/database-config`
- **Response:**  
  Returns current database config and environment variables.

---

## Health (`/health`)

### Health Check
**GET** `/health/` or `/health/check`
- **Response:**
  ```json
  {
    "status": "healthy",
    "health_score": 100,
    "warnings": {},
    "data_completeness": { "database": "connected via Supabase REST API" },
    "last_check": "2025-11-16T12:00:00Z"
  }
  ```

---

## Setup (`/setup`)

### Verify Supabase Connection
**GET** `/setup/verify-connection`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Successfully connected to Supabase via REST API over HTTPS",
    "database": "External Supabase PostgreSQL",
    "url": "<supabase-url>",
    "connection_type": "REST API (HTTPS)"
  }
  ```

### Create App Tables
**POST** `/setup/create-app-tables`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Copy the SQL below and run it in your Supabase Dashboard SQL Editor",
    "instructions": [ /* step-by-step instructions */ ],
    "sql": "CREATE TABLE IF NOT EXISTS users (...);"
  }
  ```

### List Tables
**GET** `/setup/list-tables`
- **Response:**
  ```json
  {
    "success": true,
    "tables": [ /* list of tables */ ]
  }
  ```

---

**All endpoints use JSON unless noted (file upload uses multipart/form-data).  
Authentication is required for some routes (e.g., file upload).  
CORS is enabled for all origins.**