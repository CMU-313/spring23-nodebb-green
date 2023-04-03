import pandas as pd
import joblib
from pydantic import BaseModel, Field
from pydantic.tools import parse_obj_as
from flask import Flask, request, jsonify

app = Flask(__name__)

# Pydantic Models
class Student(BaseModel):
    student_id: str = Field(alias="Student ID")
    gender: str = Field(alias="Gender")
    age: str = Field(alias="Age")
    major: str = Field(alias="Major")
    gpa: str = Field(alias="GPA")
    extra_curricular: str = Field(alias="Extra Curricular")
    num_programming_languages: str = Field(alias="Num Programming Languages")
    num_past_internships: str = Field(alias="Num Past Internships")

    class Config:
        allow_population_by_field_name = True

class PredictionResult(BaseModel):
    good_employee: int


# Main Functionality
def predict(student):
    '''
    Returns a prediction on whether the student will be a good employee
    based on given parameters by using the ML model

    Parameters
    ----------
    student : dict
        A dictionary that contains all fields in Student
    
    Returns
    -------
    dict
        A dictionary satisfying type PredictionResult, contains a single field
        'good_employee' which is either 1 (will be a good employee) or 0 (will
        not be a good employee)
    '''
    # Use Pydantic to validate model fields exist
    student = parse_obj_as(Student, student)

    clf = joblib.load('./model.pkl')
    
    student = student.dict(by_alias=True)
    query = pd.DataFrame(student, index=[0])
    print(query)
    prediction = clf.predict(query) # TODO: Error handling ??

    return { 'good_employee': prediction[0] }

# Flask Endpoint
@app.route('/predict', methods=['POST'])
def predict_endpoint():
    # Parse request body as Student object
    student = request.get_json()
    prediction_result = predict(student)

    # Return prediction as JSON response
    return jsonify({"res": str(prediction_result['good_employee'])})

if __name__ == '__main__':
    app.run()
