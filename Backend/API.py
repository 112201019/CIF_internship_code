from fastapi import FastAPI, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from BaseModels import *
from hashlib import sha256
import database_handler
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = FastAPI()


users: dict[str, (str, str)] = {}

# Allow requests from specific origins
origins = [
    # "http://127.0.0.1:5500"
"*"
]

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],  # Allow specific methods
    allow_headers=["*"],  # Allow all headers
)


# db: database_handler.PostgresqlDB = None

def open_connection(key: str):
    username, password = users[key]
    db = database_handler.login(username, password)
    return db

@app.get("/")
async def root():
    return {"message": "Hello World"}

def authenticate(username: str, password: str):
    global users
    try:
        db = database_handler.login(username, password)
        db = None
        return True
    except:
        return False

@app.post("/login")
async def login(credentials: LoginCredentials ,response : Response):
    username, password = credentials.username, credentials.password
    token = sha256(username.encode()).hexdigest()
    t=authenticate(username, password)
    if t:
        users[token] = (username, password)
        return {"message" : "Cookie is set on the browser", "Token": token}
    else:
        return {"message" : f"Failed {t}"}

@app.post("/logout")
async def logout(token: Token):
    try:
        # session = list(request.cookies)[0]
        session = token.token
        user = users[session][0]
        if session in users:
            users.pop(session)
            return {"message": f"Logout successful for user: {user}"}
        else:
            return {"message": "No active session"}
    except Exception as err:
        print(err)
        return {"message": "No active session"}

@app.post("/current_user")
async def show_current_user(token: Token):
    try:
        # current_user = list(request.cookies)[0]
        current_user = token.token
        db = open_connection(current_user)
        result = list(db.execute_dql_commands("select current_user"))
        db = None # dereference
        return {"message":result[0][0]}
    except Exception as err:
        print("error_show_user", err)
        return {"message":"NO CURRENT USER"}

@app.post("/is_member_of")
async def is_member_of(token: Token):
    try:
        # current_user = list(request.cookies)[0]
        current_user = token.token
        db = open_connection(current_user)
        result = database_handler.is_member_of(db)
        db = None # dereference
        return {"message":result}
    except Exception as err:
        print("error_show_user", err)
        return {"message":"ERROR"}
    
@app.post("/show_all_student")
async def show_all_student(token: Token):
    try:
        # current_user = list(request.cookies)[0]
        current_user = token.token
        db = open_connection(current_user)
        result = database_handler.show_all_student(db)
        db = None # dereference
        return {"message":result}
    except Exception as err:
        print("error_show_user", err)
        return {"message":"ERROR"}
    
@app.post("/show_all_faculty")
async def show_all_faculty(token: Token):
    try:
        # current_user = list(request.cookies)[0]
        current_user = token.token
        db = open_connection(current_user)
        result = database_handler.show_all_faculty(db)
        db = None # dereference
        return {"message":result}
    except Exception as err:
        print("error_show_user", err)
        return {"message":"ERROR"}
    
@app.post("/show_all_staff")
async def show_all_staff(token: Token):
    try:
        # current_user = list(request.cookies)[0]
        current_user = token.token
        db = open_connection(current_user)
        result = database_handler.show_all_staff(db)
        db = None # dereference
        return {"message":result}
    except Exception as err:
        print("error_show_user", err)
        return {"message":"ERROR"}
    
@app.post("/show_all_equipments")
async def show_all_equipment(token: Token):
    try:
        # current_user = list(request.cookies)[0]
        current_user = token.token
        db = open_connection(current_user)
        result = database_handler.show_all_equipment(db)
        db = None # dereference
        return {"message":result}
    except Exception as err:
        print("error_show_user", err)
        return {"message":"ERROR"}
@app.post("/show_all_equipment")
async def show_all_equipment(token: Token):
    try:
        # current_user = list(request.cookies)[0]
        current_user = token.token
        db = open_connection(current_user)
        result = database_handler.show_all_equipment_admin(db)
        db = None # dereference
        return {"message":result}
    except Exception as err:
        print("error_show_user", err)
        return {"message":"ERROR"}

@app.post("/show_available_slots_equipment")
async def show_available_slots_equipment(equipment: EquipmentByID):
    try:
        current_user = equipment.token
        db = open_connection(current_user)
        result = database_handler.show_avaiable_slots_for_equipment(db, equipment.ID)
        db = None # dereference
        return {"message":result}
    except Exception as err:
        print("error_show_user", err)
        return {"message":"ERROR"}
    
@app.post("/request_a_slot_for_project")
async def request_a_slot_for_project(request: Slot_Request):
    try:
        current_user = request.token
        db = open_connection(current_user)
        result = database_handler.request_a_slot_for_project(db, request.slot_ID, request.project_ID)
        print(result)
        db = None # dereference
        return {"message":"success"}
    except Exception as err:
        print("error_show_user", err)
        return {"message":"ERROR"}
    
@app.post("/show_requests_student")
async def show_requests_student(token: Token):
    try:
        current_user = token.token
        db = open_connection(current_user)
        result = database_handler.show_requests_student(db)
        db = None # dereference
        return {"message":result}
    except Exception as err:
        print("error_show_user", err)
        return {"message":"ERROR"}
    
@app.post("/show_requests_supervisor")
async def show_requests_supervisor(token: Token):
    try:
        current_user = token.token
        db = open_connection(current_user)
        result = database_handler.show_requests_supervisor(db)
        db = None # dereference
        return {"message":result}
    except Exception as err:
        print("error_show_user", err)
        return {"message":"ERROR"}
    
@app.post("/show_requests_faculty_incharge")
async def show_requests_faculty_incharge(token: Token):
    try:
        current_user = token.token
        db = open_connection(current_user)
        result = database_handler.show_requests_faculty_incharge(db)
        db = None # dereference
        return {"message":result}
    except Exception as err:
        print("error_show_user", err)
        return {"message":"ERROR"}
    
@app.post("/show_requests_staff_incharge")
async def show_requests_staff_incharge(token: Token):
    try:
        current_user = token.token
        db = open_connection(current_user)
        result = database_handler.show_requests_staff_incharge(db)
        db = None # dereference
        return {"message":result}
    except Exception as err:
        print("error_show_user", err)
        return {"message":"ERROR"}
    
# @app.post("/insert_slot_staff_incharge")
# async def insert_slot_staff_incharge(token: Token):
    # 
# 
# In API.py

@app.post("/insert_slot_staff_incharge")
async def insert_slot_staff_incharge(request_data: InsertSlotRequest):
    try:
        # Get the token from the incoming request data
        current_user_token = request_data.token

        # Open a database connection using your existing helper function
        db = open_connection(current_user_token)

        # Get the Staff ID from the current database session
        staff_id_result = list(db.execute_dql_commands("SELECT current_user"))
        staff_id = staff_id_result[0][0]

        # Call the database handler function with all the required data
        database_handler.insert_slot_staff_incharge(
            db=db,
            equipment_id=request_data.equipment_id,
            start_time=request_data.start_time,
            end_time=request_data.end_time,
            staff_id=staff_id
        )
        
        db = None # dereference

        # Return a simple success message, just like your other functions
        return {"message": "Slots created successfully"}

    except Exception as err:
        # This is the generic error handling block that matches your other endpoints
        print("error_insert_slot", err)
        return {"message": "ERROR"}
    
@app.post("/decide_by_super_visor")
async def decide_by_super_visor(decision: Decision):
    try:
        current_user = decision.token
        db = open_connection(current_user)
        result = database_handler.decide_by_super_visor(db, decision.request_id, decision.decision)
        
        # NEW: Send email if rejected
        if decision.decision.lower() == "rejected":
            student_email = database_handler.get_student_email_from_request(db, decision.request_id)
            if student_email:
                subject = f"Equipment Request Rejected: ID {decision.request_id}"
                body = f"Hello,\n\nYour booking request (ID: {decision.request_id}) has been REJECTED by your Supervisor.\n\nPlease contact them for further details.\n\nRegards,\nCIF Team"
                send_email_notification(student_email, subject, body)

        db = None # dereference
        return {"message": "Success"}
    except Exception as err:
        print("error_decide_supervisor", err)
        return {"message":"ERROR"}

@app.post("/decide_by_faculty_incharge")
async def decide_by_faculty_incharge(decision: Decision):
    try:
        current_user = decision.token
        db = open_connection(current_user)
        result = database_handler.decide_by_faculty_incharge(db, decision.request_id, decision.decision)
        
        # NEW: Send email if rejected
        if decision.decision.lower() == "rejected":
            student_email = database_handler.get_student_email_from_request(db, decision.request_id)
            if student_email:
                subject = f"Equipment Request Rejected: ID {decision.request_id}"
                body = f"Hello,\n\nYour booking request (ID: {decision.request_id}) has been REJECTED by the Faculty In-Charge.\n\nPlease contact them for further details.\n\nRegards,\nCIF Team"
                send_email_notification(student_email, subject, body)

        db = None # dereference
        return {"message": "Success"}
    except Exception as err:
        print("error_decide_faculty", err)
        return {"message":"ERROR"}
    
# @app.post("/decide_by_staff_incharge")
# async def decide_by_staff_incharge(decision: Decision):
#     try:
#         current_user = decision.token
#         db = open_connection(current_user)
#         result = database_handler.decide_by_staff_incharge(db, decision.request_id, decision.decision)
#         db = None # dereference
#         return {"message":result}
#     except Exception as err:
#         print("error_show_user", err)
#         return {"message":"ERROR"}

@app.post("/decide_by_staff_incharge")
async def decide_by_staff_incharge(decision: Decision):
    try:
        current_user = decision.token
        db = open_connection(current_user)
        
        # 1. Execute the approval/rejection in the database
        result = database_handler.decide_by_staff_incharge(db, decision.request_id, decision.decision)
        
        # 2. Fetch the student's email
        student_email = database_handler.get_student_email_from_request(db, decision.request_id)
        
        if student_email:
            if decision.decision.lower() == "approved":
                print(f"Request {decision.request_id} approved. Sending email...")
                subject = f"Request Approved: ID {decision.request_id}"
                body = f"Hello,\n\nYour booking request (ID: {decision.request_id}) has been APPROVED by the Staff In-charge.\n\nYou can now proceed with your experiment as scheduled.\n\nRegards,\nCIF Team"
                send_email_notification(student_email, subject, body)
                
            elif decision.decision.lower() == "rejected":
                print(f"Request {decision.request_id} rejected. Sending email...")
                subject = f"Equipment Request Rejected: ID {decision.request_id}"
                body = f"Hello,\n\nYour booking request (ID: {decision.request_id}) has been REJECTED by the Staff In-Charge.\n\nPlease contact them for further details.\n\nRegards,\nCIF Team"
                send_email_notification(student_email, subject, body)
        else:
            print("Student email not found.")

        db = None
        return {"message": "Success"}
    except Exception as err:
        print("error_decide_staff", err)
        return {"message": "ERROR: " + str(err)}
    
@app.post("/check_status")
async def check_status(request: Simple_Request):
    try:
        current_user = request.token
        db = open_connection(current_user)
        result = database_handler.check_status(db, request.request_id)
        db = None # dereference
        return {"message":result}
    except Exception as err:
        print("error_show_user", err)
        return {"message":"ERROR"}
    
@app.post("/show_projects")
async def show_projects(token: Token):
    try:
        current_user = token.token
        db = open_connection(current_user)
        result = database_handler.show_projects(db)
        db = None # dereference
        return {"message":result}
    except Exception as err:
        print("error_show_user", err)
        return {"message":"ERROR"}
    
@app.post("/show_projects_approved")
async def show_projects_approved(token: Token):
    try:
        current_user = token.token
        db = open_connection(current_user)
        result = database_handler.show_projects_approved(db)
        db = None # dereference
        return {"message":result}
    except Exception as err:
        print("error_show_user", err)
        return {"message":"ERROR"}

@app.post("/get_ids_by_equipment_name")
async def get_ids_by_equipment_name(equipment: Equipment):
    try:
        current_user = equipment.token
        db = open_connection(current_user)
        result = database_handler.get_ids_by_equipment_name(db, equipment.name)
        db = None # dereference
        return {"message":result}
    except Exception as err:
        print("error_show_user", err)
        return {"message":"ERROR"}

# Remove or comment out the separate admin login endpoint
@app.post("/admin/login")
async def admin_login(credentials: AdminCredentials):
    try:
        username, password = credentials.username, credentials.password
        token = sha256(f"admin_{username}".encode()).hexdigest()
        db = database_handler.login(username, password)
        result = database_handler.is_member_of(db)
        users[token] = (username, password)
        # print(f"Admin login result: {result}")
        db = None
        return {"message": "success", "token": token} if result == "admin" else {"message": "Unauthorized"}
    except Exception as err:
        print(f"Admin check error: {err}")
        return {"message": "Unauthorized"}
    # if credentials.username == "admin1" and credentials.password == "admin123":  # Replace with secure method
    #     token = sha256(f"admin_{credentials.username}".encode()).hexdigest()
    #     users[token] = (credentials.username, credentials.password)
    #     return {"message": "success", "token": token}
    # return {"message": "Invalid credentials"}

# Update is_admin function to check if the user has the admin role
def is_admin(token: str) -> bool:
    if token not in users:
        return False
    try:
        username, password = users[token]
        db = database_handler.login(username, password)
        result = database_handler.is_member_of(db)
        db = None
        return result == "admin"
    except Exception as err:
        print(f"Admin check error: {err}")
        return False

@app.post("/admin/create_user")
async def create_user(user_data: CreateUser|CreateEquipment):
    try:
        if not is_admin(user_data.token):
            return {"message": "Unauthorized"}
        
        db = open_connection(user_data.token)
        
        if user_data.user_type == "equipment":
            # PASS THE NEW ARGUMENTS HERE
            result = database_handler.create_equipment(
                db,
                user_data.equipment_name,
                user_data.location,
                user_data.staff_incharge_id,
                user_data.faculty_incharge_id,
                user_data.equipment_id,
                user_data.unit_time,
                user_data.requirements, # New
                user_data.questions     # New
            )
        else:
            # (Existing logic for students/staff/faculty remains unchanged)
            result = database_handler.create_user(
                db, 
                user_data.user_type,
                user_data.user_id,
                user_data.name,
                user_data.mail_id,
                user_data.department,
                user_data.password,
                user_data.additional_info
            )
        return {"message": "success"}
    except Exception as err:
        print(f"Error creating user: {err}")
        return {"message": "ERROR"}

@app.post("/admin/delete_user")
async def delete_user(delete_data: DeleteUser):
    try:
        if not is_admin(delete_data.token):
            return {"message": "Unauthorized"}
        
        db = open_connection(delete_data.token)
        result = database_handler.delete_user(
            db,
            delete_data.user_type,
            delete_data.user_id
        )
        return {"message": "success"}
    except Exception as err:
        return {"message": "ERROR"}

@app.post("/admin/search")
async def search_users(search_data: SearchQuery):
    try:
        if not is_admin(search_data.token):
            return {"message": "Unauthorized"}
        
        db = open_connection(search_data.token)
        result = database_handler.search_users(
            db,
            search_data.user_type,
            search_data.query
        )
        return {"message": result}
    except Exception as err:
        return {"message": "ERROR"}




    
    # Add UpdateUser model to BaseModels.py first
from BaseModels import UpdateUser

@app.post("/admin/update_user")
async def update_user(update_data: UpdateUser):
    try:
        if not is_admin(update_data.token):
            return {"message": "Unauthorized"}
        
        db = open_connection(update_data.token)
        print(f"Update data: {update_data.updates}")
        result = database_handler.update_user(
            db,
            update_data.user_type,
            update_data.user_id,
            update_data.updates
        )
        return {"message": "success"}
    except Exception as err:
        print(f"Update error: {err}")
        return {"message": str(err)}
    
    
# Import the new model at the top of API.py
from BaseModels import LoginCredentials, Token, AddProjectModel

# In API.py

# Import the new ApproveProjectModel
from BaseModels import AddProjectModel, ApproveProjectModel

# REPLACE your existing /add_project endpoint with this new one
@app.post("/add_project")
async def add_project(data: AddProjectModel):
    try:
        db = open_connection(data.token)
        fac_id = list(db.execute_dql_commands("SELECT current_user"))[0][0]
        
        # The project_id now comes directly from the request payload
        query = f"""
        INSERT INTO project (project_id, project_title, faculty_incharge_id, project_type)
        VALUES ('{data.project_id}', '{data.project_title}', '{fac_id}', '{data.project_type}');
        """
        db.execute_ddl_and_dml_commands(query)
        return {"message": "Project submitted successfully. It is now pending admin approval."}

    except Exception as err:
        # Check for unique violation error (project_id already exists)
        if "unique constraint" in str(err).lower():
            return {"message": f"An error occurred: A project with ID '{data.project_id}' already exists."}
        return {"message": f"An error occurred: {str(err)}"}
    
# In API.py, add these new endpoints

@app.post("/admin/pending_projects")
async def get_pending_projects(token: Token):
    if not is_admin(token.token):
        return {"message": "Unauthorized"}
    try:
        db = open_connection(token.token)
        result = database_handler.get_pending_projects(db)
        return {"message": result}
    except Exception as err:
        return {"message": f"An error occurred: {str(err)}"}

@app.post("/admin/approve_project")
async def approve_project(data: ApproveProjectModel):
    if not is_admin(data.token):
        return {"message": "Unauthorized"}
    try:
        db = open_connection(data.token)
        database_handler.approve_project(
            db,
            data.project_id,
            data.allocated_money,
            data.expiry_date
        )
        return {"message": "Project approved and funds allocated successfully."}
    except Exception as err:
        return {"message": f"An error occurred: {str(err)}"}

@app.post("/faculty/my_projects")
async def get_faculty_projects(token: Token):
    try:
        db = open_connection(token.token)
        result = database_handler.get_projects_by_faculty(db)
        return {"message": result}
    except Exception as err:
        return {"message": f"An error occurred: {str(err)}"}
    
@app.post("/departments")
async def get_departments(token: Token):
    try:
        db = open_connection(token.token)
        result = database_handler.get_all_departments(db)
        return {"message": result}
    except Exception as err:
        return {"message": f"An error occurred: {str(err)}"}



@app.post("/project_exists")
async def project_exists(data: ProjectCheck):
    try:
        db = open_connection(data.token)
        exists = database_handler.check_project_exists(db, data.project_id)
        return {"exists": exists}
    except Exception as err:
        return {"exists": True, "error": f"An error occurred: {str(err)}"}
    
# In API.py, add this new endpoint

# Import the new model at the top of API.py


@app.post("/admin/reject_project")
async def reject_project(data: RejectProjectModel):
    if not is_admin(data.token):
        return {"message": "Unauthorized"}
    try:
        db = open_connection(data.token)
        database_handler.reject_project(db, data.project_id)
        return {"message": "Project rejected successfully."}
    except Exception as err:
        return {"message": f"An error occurred: {str(err)}"}
    
# In API.py
from BaseModels import MultiSlotRequest

@app.post("/request_multiple_slots")
async def request_multiple_slots(request: MultiSlotRequest):
    try:
        current_user = request.token
        db = open_connection(current_user)
        
        database_handler.request_multiple_slots(
            db, 
            request.slot_id, 
            request.project_id, 
            request.count,
            request.request_data,
            request.comment
        )
        
        return {"message": "success"}
    except ValueError as ve:
        return {"message": str(ve)}
    except Exception as err:
        print("error_multi_book", err)
        return {"message": "ERROR: " + str(err)}
    
@app.post("/get_equipment_requirements")
async def get_equipment_requirements(data: EquipmentByID):
    try:
        db = open_connection(data.token)
        result = database_handler.get_equipment_requirements(db, data.ID)
        return {"message": result}
    except Exception as err:
        return {"message": "ERROR: " + str(err)}
    
    # In API.py
from BaseModels import DeductFundsModel # Import this

@app.post("/manual_deduct_funds")
async def manual_deduct_funds(data: DeductFundsModel):
    try:
        # Verify user is staf

        db = open_connection(data.token)
        
        database_handler.manual_fund_deduction(
            db,
            data.project_id,
            data.amount,
            data.reason
        )
        
        return {"message": "Funds deducted successfully."}
    except ValueError as ve:
        return {"message": str(ve)}
    except Exception as err:
        print("error_deduct", err)
        return {"message": "ERROR: " + str(err)}
    
@app.post("/get_ongoing_experiments")
async def get_ongoing_experiments(token: Token):
    try:
        # 1. Open connection using the existing helper
        db = open_connection(token.token)
        
        # 2. Execute SQL using the handler's DQL method
        # We use 'current_user' in SQL so Postgres uses the logged-in staff's ID
        query = """
            SELECT t.request_id, e.equipment_name, s.slot_time, r.proj_id
            FROM experiment_tracking t
            JOIN request r ON t.request_id = r.request_id
            JOIN slot s ON r.slot_id = s.slot_id
            JOIN equipment e ON s.equipment_id = e.equipment_id
            WHERE t.staff_id = current_user AND t.is_completed = FALSE
            ORDER BY s.slot_time ASC
        """
        
        # 3. Fetch and format results
        rows = list(db.execute_dql_commands(query))
        
        result = []
        for row in rows:
            result.append({
                "request_id": row[0],
                "equipment_name": row[1],
                "slot_time": str(row[2]), # Convert timestamp to string
                "proj_id": row[3]
            })
            
        db = None # dereference
        return {"message": result}

    except Exception as err:
        print("error_ongoing", err)
        return {"message": "ERROR"}
    
@app.post("/finalize_experiment")
async def finalize_experiment(request: Request):
    try:
        # 1. Parse Data
        data = await request.json()
        token = data.get("token")
        req_id = data.get("request_id")
        proj_id = data.get("project_id")
        extra_charges = int(data.get("extra_charges", 0))
        notes = data.get("notes", "") # Get the remark/notes from frontend

        # 2. Open Connection
        db = open_connection(token)
        
        # 3. Mark Experiment as Completed AND Store Remark
        # We use :remark and :req_id as placeholders to safely handle text with quotes/symbols
        query_update = """
            UPDATE experiment_tracking 
            SET is_completed = TRUE, 
                actual_completion_time = NOW(), 
                remark = :remark,
                extra_charges = :extra_charges  
            WHERE request_id = :req_id
        """
        
        # Execute with parameters
        db.execute_ddl_and_dml_commands(query_update, values={"remark": notes, "extra_charges": extra_charges, "req_id": req_id})
        
        # 4. Deduct Extra Charges (Only if applicable)
        if extra_charges > 0:
            query_deduct = f"""
                UPDATE project 
                SET money = money - {extra_charges} 
                WHERE project_id = '{proj_id}'
            """
            db.execute_ddl_and_dml_commands(query_deduct)
            
        db = None # dereference
        return {"message": "Experiment completed. Remarks saved and extra charges (if any) deducted."}

    except Exception as err:
        print("error_finalize", err)
        return {"message": "ERROR: " + str(err)}
    
@app.post("/cancel_experiment")
async def cancel_experiment_endpoint(request: Request):
    try:
        data = await request.json()
        token = data.get("token")
        req_id = data.get("request_id")
        
        db = open_connection(token)
        database_handler.cancel_experiment(db, req_id)
        db = None # dereference
        
        return {"message": "Experiment cancelled successfully. Funds refunded and slots freed."}
    except Exception as err:
        print("error_cancel", err)
        return {"message": "ERROR: " + str(err)}
    
def send_email_notification(to_email: str, subject: str, body: str):
    """Sends an email using your personal Gmail account."""
    # --- CONFIGURATION ---
    SENDER_EMAIL = "sriramnangunoori1@gmail.com"
    
    # PASTE YOUR 16-CHARACTER APP PASSWORD HERE (Keep the quotes)
    SENDER_PASSWORD = "xrec sssu vfts utnl"  # <--- REPLACE THIS WITH YOUR REAL APP PASSWORD
    
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587
    
    try:
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        # Connect to Gmail
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls() # Secure connection
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        
        # Send
        server.sendmail(SENDER_EMAIL, to_email, msg.as_string())
        server.quit()
        print(f"Email successfully sent to {to_email}")
    except Exception as e:
        print(f"Error sending email: {e}")

from BaseModels import ReportRequest

@app.post("/admin/export_report")
async def export_report(data: ReportRequest):
    try:
        if not is_admin(data.token):
            return {"message": "Unauthorized"}
        db = open_connection(data.token)
        result = database_handler.get_faculty_report(db, data.faculty_id, data.start_date, data.end_date)
        db = None
        return {"message": "success", "data": result}
    except Exception as err:
        print(f"Report error: {err}")
        return {"message": f"ERROR: {str(err)}"}
    
@app.post("/get_profile")
async def get_profile(token_data: Token):
    try:
        # Admins don't have a profile table
        if is_admin(token_data.token):
            return {"message": "Admin profiles are managed via the database console."}
            
        db = open_connection(token_data.token)
        
        # FIX: Changed 'department' to 'department_id as department' for the faculty table
        query = """
            SELECT student_id as id, student_name as name, mail_id, department, password, 'student' as role FROM student WHERE student_id = current_user
            UNION ALL
            SELECT faculty_id, faculty_name, mail_id, department_id as department, password, 'faculty' as role FROM faculty WHERE faculty_id = current_user
            UNION ALL
            SELECT staff_id, staff_name, mail_id, department, password, 'staff' as role FROM staff WHERE staff_id = current_user
        """
        result = list(db.execute_dql_commands(query))
        
        if not result:
            return {"message": "User not found"}
        
        user_data = {
            "id": result[0][0],
            "name": result[0][1],
            "mail_id": result[0][2],
            "department": result[0][3],
            "password": result[0][4],
            "role": result[0][5]
        }
        db = None
        return {"message": "success", "data": user_data}
    except Exception as err:
        return {"message": f"ERROR: {str(err)}"}
@app.post("/update_profile")
async def update_profile(data: ProfileUpdateRequest):
    try:
        db = open_connection(data.token)
        
        # Find user role to update the correct table
        query_find = """
            SELECT 'student' as role FROM student WHERE student_id = current_user
            UNION ALL
            SELECT 'faculty' as role FROM faculty WHERE faculty_id = current_user
            UNION ALL
            SELECT 'staff' as role FROM staff WHERE staff_id = current_user
        """
        result = list(db.execute_dql_commands(query_find))
        
        if not result:
            return {"message": "User not found"}
            
        role = result[0][0]
        
        # Thanks to RLS, even if someone hacked this query to say "WHERE student_id = 'someone_else'", 
        # PostgreSQL would block it!
        if role == 'student':
            update_q = "UPDATE student SET mail_id = :mail, password = :pwd WHERE student_id = current_user"
        elif role == 'faculty':
            update_q = "UPDATE faculty SET mail_id = :mail, password = :pwd WHERE faculty_id = current_user"
        elif role == 'staff':
            update_q = "UPDATE staff SET mail_id = :mail, password = :pwd WHERE staff_id = current_user"
            
        db.execute_ddl_and_dml_commands(update_q, values={"mail": data.mail_id, "pwd": data.password})
        
        db = None
        return {"message": "Profile updated successfully! Note: Your DB credentials have been synced."}
    except Exception as err:
        return {"message": f"ERROR: {str(err)}"}