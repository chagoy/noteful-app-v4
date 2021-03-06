'use strict'; 

const express = require('express');
const mongoose = require('mongoose');

const User = require('../models/user');

const router = express.Router();

/* ===== CREATE A USER ==== */
router.post('/', (req, res, next) => {
    const requiredFields = ['username', 'password'];
    const missingField = requiredFields.find(field => !(field in req.body));

    if (missingField) {
        return res.status(422).json({
            code: 422, 
            reason: 'ValidationError',
            message: 'Missing field', 
            location: missingField
        });
    }

    const stringField = ['username', 'password', 'fullname'];
    const nonStringField = stringField.find(field => field in req.body && typeof req.body[field] !== 'string');

    if (nonStringField) {
        return res.status(422).json({
            code: 422, 
            reason: 'ValidationError',
            message: 'Incorrect field type: expected string',
            location: nonStringField
        });
    }

    const explicitlyTrimmedFields = ['username', 'password'];
    const nonTrimmedField = explicitlyTrimmedFields.find(
        field => req.body[field].trim() !== req.body[field]
    );

    if (nonTrimmedField) {
        const err = new Error(`Field: '${nonTrimmedField}' cannot start or end with whitespace`);
        err.status = 422;
        return next(err);
    }

    const sizedFields = {
        username: {
            min: 3
        },
        password: {
            min: 8, 
            max: 72
        }
    };

    const tooSmallField = Object.keys(sizedFields).find(
        field => 
            'min' in sizedFields[field] && req.body[field].length < sizedFields[field].min
    );
    const tooLargeField = Object.keys(sizedFields).find(
        field => 
            'max' in sizedFields[field] && req.body[field].length > sizedFields[field].max
    );

    if (tooSmallField || tooLargeField) {
        return res.status(422).json({
            code: 422, 
            reason: 'ValidationError', 
            message: tooSmallField ? `Must be at least ${sizedFields[tooSmallField].min} characters long` : `Must be at most ${sizedFields[tooLargeField].max} characters long`,
            location: tooSmallField || tooLargeField
        });
    }

    let { username, password, fullname = '' } = req.body;

    fullname = fullname.trim();

    return User.hashPassword(password)
        .then(digest => {
            const newUser = {
                username, 
                password: digest, 
                fullname
            };
            return User.create(newUser);
        })
        .then(result => {
            res
            .location(`${req.originalUrl}/${result.id}`)
            .status(201)
            .json(result)
        })
        .catch(err => {
            if (err.code == 11000) {
                err = new Error('The username already exists');
                err.status = 400;
            }
            next(err);
        });
});

module.exports = router;