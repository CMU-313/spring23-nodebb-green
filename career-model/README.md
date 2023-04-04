# Career Recruiter ML Model Framework

## Overview
This folder contains an ML model for predicting whether a student applicant would be a good employee, along with some basic starter code for how to interact with the model.

This model should eventually be connected with the career page within NodeBB to allow recruiters to view a prediction of a student applicant's likeliness to be a good employee to hire.

## Setup
1. (Optional) Set up a [virtual environment](https://docs.python.org/3/library/venv.html) for Python
2. Run `pip install -r requirements.txt` to install all dependencies

## Running the Flask endoint
1. Ensure previous steps from the Setup section have been run
2. Run the following in your terminal:
  ```
  export FLASK_APP=predict.py
  export FLASK_ENV=development
  flask run
  ```
3. Query the endpoint through a CURL request or Postman to test it.

Example CURL request:
```
curl --header "Content-Type: application/json" --request POST --data '{"Student ID":"123", "Gender":"F", "Age":"21", "Major":"Computer Science", "GPA":"3.8", "Extra Curricular":"Student Theatre", "Num Programming Languages":"2", "Num Past Internships":"1"}' http://localhost:8080/predict
```

## Updating NodeBB to call the endpoint
To integrate this endoint into NodeBB, you will need to update [this file](https://github.com/CMU-313/spring23-nodebb-green/blob/career-model-implementation/src/controllers/write/career.js).

First, you must create an [HTTP request](https://www.geeksforgeeks.org/how-to-make-http-requests-in-node-js/) to call http://localhost:8080/predict, with userCareerData as the body. 

Then, you should set `userCareer.prediction` to the value of the response (replacing the current `Math.random` value).
## Running the Model
The file `predict.py` contains a function `predict` which, given a student application input, returns a prediction whether the student would be a good employee. 

Below is a sample run from the terminal:
```
% python3
>>> from predict import predict
>>> student = {
        "student_id": "student1",
        "major": "Computer Science",
        "age": "20",
        "gender": "M",
        "gpa": "4.0",
        "extra_curricular": "Men's Basketball",
        "num_programming_languages": "1",
        "num_past_internships": "2"
    }
>>> predict(student)
{'good_employee': 1}
```

## Function Inputs
The `predict` function takes in a student info dictionary that contains the following fields (note that all fields are taken as a `string` value and parsed by the model itself):

- `student_id`: unique identifier for the student
- `major`: major of the student
    - Computer Science, Information Systems, Business, Math, Electrical and Computer Engineering, Statistics and Machine Learning
- `age`: age of the student, [18, 25]
- `gender`: gender of the student, M(ale)/F(emale)/O(ther)
- `gpa`: gpa of the student, [0.0, 4.0]
- `extra_curricular`: the most important extracurricular activity to the student
    -  Student Theatre, Buggy, Teaching Assistant, Student Government, Society of Women Engineers, Women in CS, Volleyball, Sorority, Men's Basketball, American Football, Men's Golf, Fraternity
- `num_programming_languages`: number of programming languages that the student is familiar with, [1, 5]
- `num_past_internships`: number of previous internships that the student has had, [0, 4]

## Function Outputs
The `predict` function returns a prediction result dictionary containing the following:

- `good_employee`: int, 1 if the student is predicted to be a good employee, 0 otherwise