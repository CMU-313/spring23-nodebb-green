'use strict';

const fetch = require('node-fetch');
const helpers = require('../helpers');
const user = require('../../user');
const db = require('../../database');

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
        try {
            const response = await fetch('https://nodebb-green-career.fly.dev/predict', {
                method: 'post',
                body: JSON.stringify(userCareerData),
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            console.log(data);

            userCareerData.prediction = data.res;

            await user.setCareerData(req.uid, userCareerData);
            db.sortedSetAdd('users:career', req.uid, req.uid);
        } catch (err) {
            console.log(err);
        } finally {
            res.json({});
        }
    } catch (err) {
        console.log(err);
        helpers.noScriptErrors(req, res, err.message, 400);
    }
};
