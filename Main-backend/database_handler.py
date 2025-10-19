import sqlalchemy

# Database Utility Class
from sqlalchemy.engine import create_engine

# Provides executable SQL expression construct
from sqlalchemy.sql import text

sqlalchemy.__version__


class PostgresqlDB:
    def __init__(self, user_name, password, host, port, db_name):
        """
        class to implement DDL, DQL and DML commands,
        user_name:- username
        password:- password of the user
        host
        port:- port number
        db_name:- database name
        """
        self.user_name = user_name
        self.password = password
        self.host = host
        self.port = port
        self.db_name = db_name
        self.engine = self.create_db_engine()
        # testing
        # print(user_name, password, host, port, db_name)
        self.execute_dql_commands("select current_user")

    def create_db_engine(self):
        """
        Method to establish a connection to the database, will return an instance of Engine
        which can used to communicate with the database
        """
        try:
            db_uri = f"postgresql+psycopg2://{self.user_name}:{self.password}@{self.host}:{self.port}/{self.db_name}"
            return create_engine(db_uri)
        except Exception as err:
            raise RuntimeError(f"Failed to establish connection -- {err}") from err

    def execute_dql_commands(self, stmnt, values=None):
        """
        DQL - Data Query Language
        SQLAlchemy execute query by default as

        BEGIN
        ....
        ROLLBACK

        BEGIN will be added implicitly everytime but if we don't mention commit or rollback explicitly
        then rollback will be appended at the end.
        We can execute only retrieval query with above transaction block.If we try to insert or update data
        it will be rolled back.That's why it is necessary to use commit when we are executing
        Data Manipulation Langiage(DML) or Data Definition Language(DDL) Query.
        """
        try:
            with self.engine.connect() as conn:
                if values is not None:
                    result = conn.execute(text(stmnt), values)
                else:
                    result = conn.execute(text(stmnt))
            return result
        except Exception as err:
            print(f"Failed to execute dql commands -- {err}")
            raise RuntimeError

    def execute_ddl_and_dml_commands(self, stmnt, values=None):
        """
        Method to execute DDL and DML commands
        here we have followed another approach without using the "with" clause
        """
        connection = self.engine.connect()
        trans = connection.begin()
        try:
            if values is not None:
                result = connection.execute(text(stmnt), values)
            else:
                result = connection.execute(text(stmnt))
            trans.commit()
            connection.close()
            print("Command executed successfully.")
        except Exception as err:
            trans.rollback()
            print(f"Failed to execute ddl and dml commands -- {err}")
            raise RuntimeError


# Defining Db Credentials
def login(username, password) -> PostgresqlDB:
    USER_NAME = username
    PASSWORD = password
    PORT = 5432
    DATABASE_NAME = "cif"
    HOST = "localhost"

    # Note - Database should be created before executing below operation
    # Initializing SqlAlchemy Postgresql Db Instance
    db = PostgresqlDB(
        user_name=USER_NAME,
        password=PASSWORD,
        host=HOST,
        port=PORT,
        db_name=DATABASE_NAME,
    )
    engine = db.engine

    return db


def show_all_student(db: PostgresqlDB):
    fields = ["student_id", "student_name", "super_visor_id","mail_id", "department","password"]
    r = list(db.execute_dql_commands("select * from student"))
    result = []
    for i in r:
        record = {}
        for j in range(len(i)):
            record[fields[j]] = i[j]
        result.append(record)
    return result


def show_all_faculty(db: PostgresqlDB):
    fields = ["faculty_id", "faculty_name","mail_id", "department","password"]
    r = list(db.execute_dql_commands("select * from faculty"))
    result = []
    for i in r:
        record = {}
        for j in range(len(i)):
            record[fields[j]] = i[j]
        result.append(record)
    return result


def show_all_staff(db: PostgresqlDB):
    fields = ["staff_id", "staff_name","mail_id", "department","password"]
    r = list(db.execute_dql_commands("select * from staff"))
    result = []
    for i in r:
        record = {}
        for j in range(len(i)):
            record[fields[j]] = i[j]
        result.append(record)
    return result


def show_all_equipment(db: PostgresqlDB):
    fields = ["equipment_name"]
    r = list(db.execute_dql_commands("select distinct equipment_name from equipment"))
    result = []
    for i in r:
        record = {}
        for j in range(len(i)):
            record[fields[j]] = i[j]
        result.append(record)
    return result
def show_all_equipment_admin(db: PostgresqlDB):
    fields = ["equipment_name", "location", "staff_incharge_id","faculty_incharge_id","equipment_id"]
    r = list(db.execute_dql_commands("select * from equipment"))
    result = []
    for i in r:
        record = {}
        for j in range(len(i)):
            record[fields[j]] = i[j]
        result.append(record)
    return result


def show_avaiable_slots_for_equipment(db: PostgresqlDB, equipment_id: str):
    query = f"select s.slot_id, equipment.equipment_name, s.equipment_id, s.slot_time from equipment, check_slots() as s where s.equipment_id = equipment.equipment_id and equipment.equipment_id = '{equipment_id}'"
    r = list(db.execute_dql_commands(query))
    result = []
    fields = ["slot_id", "equipment_name", "equipment_id", "slot_time"]
    for i in r:
        record = {}
        for j in range(len(i)):
            record[fields[j]] = i[j]
        result.append(record)
    return result


def request_a_slot_for_project(db: PostgresqlDB, slot_id: int, project_id: str):
    query = f"call request_slot({slot_id}, '{project_id}')"
    db.execute_ddl_and_dml_commands(query)


def decide_by_super_visor(db: PostgresqlDB, request_id: int, decision: str):
    query = f"call decide_by_super_visor({request_id}, '{decision}')"
    db.execute_ddl_and_dml_commands(query)


def decide_by_faculty_incharge(db: PostgresqlDB, request_id: int, decision: str):
    query = f"call decide_by_faculty_incharge({request_id}, '{decision}')"
    db.execute_ddl_and_dml_commands(query)


def decide_by_staff_incharge(db: PostgresqlDB, request_id: int, decision: str):
    query = f"call decide_by_staff_incharge({request_id}, '{decision}')"
    db.execute_ddl_and_dml_commands(query)


def show_requests_supervisor(db: PostgresqlDB):
    query = "select * from show_requests_supervisor()"
    r = list(db.execute_dql_commands(query))
    result = []
    fields = ["request_id", "equipment_name", "slot_time", "slot_id"]
    for i in r:
        record = {}
        for j in range(len(i)):
            record[fields[j]] = i[j]
        result.append(record)
    return result


def show_requests_faculty_incharge(db: PostgresqlDB):
    query = "select * from show_requests_faculty_incharge()"
    r = list(db.execute_dql_commands(query))
    result = []
    fields = ["request_id", "equipment_name", "slot_time", "slot_id"]
    for i in r:
        record = {}
        for j in range(len(i)):
            record[fields[j]] = i[j]
        result.append(record)
    return result


def show_requests_staff_incharge(db: PostgresqlDB):
    query = "select * from show_requests_staff_incharge()"
    r = list(db.execute_dql_commands(query))
    result = []
    fields = ["request_id", "equipment_name", "slot_time", "slot_id"]
    for i in r:
        record = {}
        for j in range(len(i)):
            record[fields[j]] = i[j]
        result.append(record)
    return result
########################################
# In your database_handler.py file

from sqlalchemy.sql import text

# ... (other functions)

def insert_slot_staff_incharge(db: PostgresqlDB, equipment_id: str, start_time: str, end_time: str, staff_id: str):
    try:
        query = f"CALL add_slots_to_view({':p_equipment_id'}, {':p_staff_id'}, {':p_start_time'}, {':p_end_time'})"
        params = {
            "p_equipment_id": equipment_id,
            "p_staff_id": staff_id,
            "p_start_time": start_time,
            "p_end_time": end_time
        }
        
        db.execute_ddl_and_dml_commands(query, values=params)
        print(f"Successfully called procedure to add slots for equipment {equipment_id} by staff {staff_id}.")

    except Exception as err:
        print(f"Database procedure failed: {err}")
        raise err
#################################


def is_member_of(db: PostgresqlDB):
    user = list(db.execute_dql_commands("select current_user"))[0][0]
    group = "students"
    query = f"select is_member_of('{user}', '{group}')"
    result = list(db.execute_dql_commands(query))[0][0]
    if result:
        return group

    group = "faculty"
    query = f"select is_member_of('{user}', '{group}')"
    result = list(db.execute_dql_commands(query))[0][0]
    if result:
        return group

    group = "staff"
    query = f"select is_member_of('{user}', '{group}')"
    result = list(db.execute_dql_commands(query))[0][0]
    if result:
        return group
    group = "admin"
    query = f"select is_member_of('{user}', '{group}')"
    result = list(db.execute_dql_commands(query))[0][0]
    if result:
        return group

    return None


def show_requests_student(db: PostgresqlDB):
    user = list(db.execute_dql_commands("select current_user"))[0][0]
    view = "request_" + user
    query = f"select {view}.request_id, {view}.slot_id, slot.equipment_id, {view}.proj_id, slot.slot_time from {view}, slot where slot.slot_id = {view}.slot_id"
    r = list(db.execute_dql_commands(query))
    result = []
    fields = ["request_id", "slot_id", "equipment_id", "proj_id", "slot_time"]
    for i in r:
        record = {}
        for j in range(len(i)):
            record[fields[j]] = i[j]
        result.append(record)
    return result


def check_status(db: PostgresqlDB, request_id: int):
    query = f"select check_status({request_id})"
    r = list(db.execute_dql_commands(query))
    result = []
    fields = ["status"]
    for i in r:
        record = {}
        for j in range(len(i)):
            record[fields[j]] = i[j]
        result.append(record)
    return result


def show_projects(db: PostgresqlDB):
    query = f"select p.project_id, p.project_title, p.faculty_incharge_id from project as p, student where p.faculty_incharge_id = student.super_visor_id and student.student_id = current_user"
    r = list(db.execute_dql_commands(query))
    result = []
    fields = ["project_id", "project_title", "supervisor"]
    for i in r:
        record = {}
        for j in range(len(i)):
            record[fields[j]] = i[j]
        result.append(record)
    return result


def get_ids_by_equipment_name(db: PostgresqlDB, equipment_name: str):
    query = f"select equipment_id, location from equipment where equipment_name = '{equipment_name}'"
    r = list(db.execute_dql_commands(query))
    result = []
    fields = ["equipment_id", "location"]
    for i in r:
        record = {}
        for j in range(len(i)):
            record[fields[j]] = i[j]
        result.append(record)
    return result

# 
def create_equipment(db: PostgresqlDB, equipment_name: str, location: str, staff_incharge_id: str, faculty_incharge_id: str,equipment_id: str,):
    query = f"""
    INSERT INTO equipment (equipment_id, equipment_name, location, staff_incharge_id, faculty_incharge_id) 
    VALUES (
        '{equipment_id}', 
        '{equipment_name}', 
        '{location}', 
        '{staff_incharge_id}', 
        '{faculty_incharge_id}'
    )
    """
    # print(f"Executing query: {query}")
    db.execute_ddl_and_dml_commands(query)

def create_user(db: PostgresqlDB, user_type: str, user_id: str, name: str, mail_id: str, department: str, password: str, additional_info: dict = None):
    if user_type == "student":
        query = f"""
        INSERT INTO student (student_id, student_name, super_visor_id, mail_id, department, password) 
        VALUES (
            '{user_id}', 
            '{name}',
            '{additional_info.get("supervisor_id")}', 
            '{mail_id}',
            '{department}',
            '{password}'
        )
        """
    elif user_type == "faculty":
        query = f"""
        INSERT INTO faculty (faculty_id, faculty_name, mail_id, department, password) 
        VALUES (
            '{user_id}', 
            '{name}',
            '{mail_id}', 
            '{department}',
            '{password}'
        )
        """
    elif user_type == "staff":
        query = f"""
        INSERT INTO staff (staff_id, staff_name, mail_id, department, password) 
        VALUES (
            '{user_id}', 
            '{name}',
            '{mail_id}',
            '{department}',
            '{password}'
        )
        """
    db.execute_ddl_and_dml_commands(query)

# def delete_user(db: PostgresqlDB, user_type: str, user_id: str):
#     query = f"DELETE FROM {user_type} WHERE {user_type}_id = '{user_id}'"
#     db.execute_ddl_and_dml_commands(query)
def delete_user(db: PostgresqlDB, user_type: str, user_id: str):
    """Fix table names and column names"""
    try:
        table_map = {
            'student': ('student', 'student_id'),
            'faculty': ('faculty', 'faculty_id'),
            'staff': ('staff', 'staff_id'),
            'equipment': ('equipment', 'equipment_id')
        }
        
        if user_type not in table_map:
            raise ValueError(f"Invalid user type: {user_type}")
            
        table, id_column = table_map[user_type]
        query = f"DELETE FROM {table} WHERE {id_column} = '{user_id}'"
        db.execute_ddl_and_dml_commands(query)
        return "success"
    except Exception as e:
        print(f"Delete error: {str(e)}")
        raise

def update_user(db: PostgresqlDB, user_type: str, user_id: str, updates: dict):
    """Add update functionality"""
    try:
        table_map = {
            'student': ('student', 'student_id'),
            'faculty': ('faculty', 'faculty_id'),
            'staff': ('staff', 'staff_id'),
            'equipment': ('equipment', 'equipment_id')
        }
        
        if user_type not in table_map:
            raise ValueError(f"Invalid user type: {user_type}")
            
        table, id_column = table_map[user_type]
        
        # Filter out empty values
        updates = {k: v for k, v in updates.items() if v.strip()}
        # print(f"Updates: {updates}")
        if not updates:
            return "No updates provided"
            
        set_clause = ", ".join([f"{k} = '{v}'" for k, v in updates.items()])
        query = f"UPDATE {table} SET {set_clause} WHERE {id_column} = '{user_id}'"
        # print(f"Executing query: {query}")
        db.execute_ddl_and_dml_commands(query)
        return "success"
    except Exception as e:
        print(f"Update error: {str(e)}")
        raise
    
def search_users(db: PostgresqlDB, user_type: str, search_query: str):
    query = f"""
    SELECT * FROM {user_type} 
    WHERE {user_type}_id ILIKE '%{search_query}%' 
    OR {user_type}_name ILIKE '%{search_query}%'
    """
    r = list(db.execute_dql_commands(query))
    fields = get_fields_for_type(user_type)
    result = []
    for i in r:
        record = {}
        for j in range(len(i)):
            record[fields[j]] = i[j]
        result.append(record)
    return result

def get_fields_for_type(user_type: str) -> list:
    if user_type == "student":
        return ["student_id", "student_name", "super_visor_id", 'mail_id', "department", "password"]
    elif user_type == "faculty":
        return ["faculty_id", "faculty_name", "department", "mail_id", "department", "password"]
    elif user_type == "staff":
        return ["staff_id", "staff_name", "department", "mail_id", "department", "password"]
    return []

# Add this function at the end of database_handler.py

# def add_project_with_fund_check(db: PostgresqlDB, project_id: str, project_title: str, faculty_incharge_id: str, money: int, project_type: str, department_id: str):
#     """Calls the stored procedure to add a project and deduct from department fund."""
#     try:
#         query = f"""
#         CALL add_project_with_fund_check(
#             '{project_id}',
#             '{project_title}',
#             '{faculty_incharge_id}',
#             {money},
#             '{project_type}'::project_type,
#             '{department_id}'
#         );
#         """
#         db.execute_ddl_and_dml_commands(query)
#         print(f"Successfully called procedure to add project {project_id}.")

#     except Exception as err:
#         print(f"Database procedure failed: {err}")
#         # Re-raise the exception so the API can catch it and return an error message
#         raise err

# In database_handler.py, add these new functions

def get_pending_projects(db: PostgresqlDB):
    """Fetches all projects with a 'pending' status."""
    query = "SELECT project_id, project_title, faculty_incharge_id, project_type FROM project WHERE status = 'pending'"
    r = list(db.execute_dql_commands(query))
    result = []
    fields = ["project_id", "project_title", "faculty_incharge_id", "project_type"]
    for i in r:
        record = {}
        for j in range(len(i)):
            record[fields[j]] = i[j]
        result.append(record)
    return result

def approve_project(db: PostgresqlDB, project_id: str, money: int, expiry_date: str):
    """Updates a project's status, money, and expiry date."""
    query = f"""
    UPDATE project
    SET
        status = 'approved',
        money = {money},
        expiry_date = '{expiry_date}'
    WHERE project_id = '{project_id}';
    """
    db.execute_ddl_and_dml_commands(query)
    
# In database_handler.py, add this new function

def get_projects_by_faculty(db: PostgresqlDB):
    """Fetches all projects submitted by the current faculty user."""
    query = """
    SELECT project_id, project_title, project_type, money, status, to_char(expiry_date, 'YYYY-MM-DD') as expiry_date
    FROM project
    WHERE faculty_incharge_id = current_user;
    """
    r = list(db.execute_dql_commands(query))
    result = []
    fields = ["project_id", "project_title", "project_type", "money", "status", "expiry_date"]
    for i in r:
        record = {}
        for j in range(len(i)):
            record[fields[j]] = i[j]
        result.append(record)
    return result

def get_all_departments(db: PostgresqlDB):
    """Fetches all department IDs and names from the database."""
    query = "SELECT department_id, department_name FROM department"
    r = list(db.execute_dql_commands(query))
    result = []
    fields = ["department_id", "department_name"]
    for i in r:
        record = {}
        for j in range(len(i)):
            record[fields[j]] = i[j]
        result.append(record)
    return result

def check_project_exists(db: PostgresqlDB, project_id: str):
    """Checks if a project with the given ID already exists."""
    query = f"SELECT 1 FROM project WHERE project_id = '{project_id}'"
    result = list(db.execute_dql_commands(query))
    return len(result) > 0

def reject_project(db: PostgresqlDB, project_id: str):
    """Updates a project's status to 'rejected'."""
    query = f"""
    UPDATE project
    SET status = 'rejected'
    WHERE project_id = '{project_id}';
    """
    db.execute_ddl_and_dml_commands(query)