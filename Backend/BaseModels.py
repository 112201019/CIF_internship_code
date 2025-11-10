from pydantic import BaseModel


class LoginCredentials(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    token: str

class Equipment(BaseModel):
    token: str
    name: str

class Slot_Request(BaseModel):
    token: str
    slot_ID: int
    project_ID: str

class Decision(BaseModel):
    token: str
    request_id: int
    decision: str

class Simple_Request(BaseModel):
    token: str
    request_id: int

class EquipmentByID(BaseModel):
    token: str
    ID: str


# ...existing code...
# ...existing code...

class AdminCredentials(BaseModel):
    username: str
    password: str

class CreateUser(BaseModel):
    token: str
    user_type: str  # 'student', 'faculty', or 'staff'
    user_id: str
    name: str
    mail_id: str
    department: str
    password: str
    additional_info: dict  # For supervisor_id, department etc.
class CreateEquipment(BaseModel):
    token: str
    user_type: str
    equipment_id: str
    equipment_name: str
    location: str
    staff_incharge_id: str
    faculty_incharge_id: str
class DeleteUser(BaseModel):
    token: str
    user_type: str
    user_id: str

class SearchQuery(BaseModel):
    token: str
    user_type: str
    query: str

# class EquipmentCreate(BaseModel):
#     token: str
#     equipment_id: str
#     equipment_name: str
#     location: str
#     specifications: dict = {}
#     staff_incharge: str

class UpdateUser(BaseModel):
    token: str
    user_type: str
    user_id: str
    updates: dict
    
class InsertSlotRequest(BaseModel):
    token: str
    equipment_id: str
    start_time: str
    end_time: str
    
    

class AddProjectModel(BaseModel):
    token: str
    project_id: str  
    project_title: str
    project_type: str

class ApproveProjectModel(BaseModel):
    token: str
    project_id: str
    allocated_money: int
    expiry_date: str 
    
class ProjectCheck(BaseModel):
    token: str
    project_id: str
    
class RejectProjectModel(BaseModel):
    token: str
    project_id: str