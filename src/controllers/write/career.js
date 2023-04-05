'use strict';

const helpers = require('../helpers');
const user = require('../../user');
const db = require('../../database');
const http = require('http');

const Career = module.exports;

Career.register = async (req, res) => {
    const userData = req.body;
    try {
        const userCareerData = {
            student_id: userData.student_id,
            major: userData.major,
            age: userData.age,
            gender: userData.gender,
            gpa: userData.gpa,
            extra_curricular: userData.extra_curricular,
            num_programming_languages: userData.num_programming_languages,
            num_past_internships: userData.num_past_internships,
        };
        // TODO: Change this line to do call and retrieve actual
        // candidate success prediction from the model instead of using a random number

        // Importing https module
        // const http = require('http');
  
        // Setting the configuration for
        // the request
        const options = {
            hostname: 'https://nodebb-green-career.fly.dev/predict',
            path: '/posts',
            method: 'GET'
        };
    
        // Sending the request
        const req = http.request(options, (res) => {
            let data = userCareerData
     
            res.on('data', (chunk) => {
                data += chunk;
            });
    
            // Ending the response 
            res.on('end', () => {
                console.log('Body:', JSON.parse(data))
            });
       
        }).on("error", (err) => {
            console.log("Error: ", err)
        }).end()

        console.log("statusCode:", res.statusCode);

        userCareerData.prediction = chunk;

        await user.setCareerData(req.uid, userCareerData);
        db.sortedSetAdd('users:career', req.uid, req.uid);
        res.json({});
    } catch (err) {
        console.log(err);
        helpers.noScriptErrors(req, res, err.message, 400);
    }
};
