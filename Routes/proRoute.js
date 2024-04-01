const express = require('express');
const router = express.Router();
const order = require('../Models/orderModel');
const User = require('../Models/userModel');
const bcrypt = require('bcrypt');
// const Token = require("../Models/tokenModel");
// const nodemailer = require('nodemailer');
// const JWT = require("jsonwebtoken");
// require("dotenv").config();
// const sendEmail = require("../utils/email/sendEmail");
router.get('/reg', async (req,res) =>{
    try {
        const { cans,address,phoneNo,name } = req.query;

        if (!cans){
            return res.status(401).json({msg:'Pease enter your name.'})
        }
        if(!address){
            return res.status(401).json({msg:'Pease enter your address.'})
        }
        if(!phoneNo){
            return res.status(401).json({msg:'Pease enter your phone number.'})
        }
        if(!name){
            return res.status(401).json({msg:'Pease enter your date of birth.'})
        }
        
        

        

        var newOrder = new order();
            newOrder.cans =cans ;
            newOrder.address = address;
            newOrder.phoneNo = phoneNo;
            newOrder.name = name;
    

        await newOrder.save();

        res.status(200).json({
            status:true,
            msg:"Order created Successfully",
            data:newOrder,
        })
        return;
    }catch (e) {
            console.log(e)
            res.status(500).json({
                status: false,
                msg: 'Something went wrong!'
            });
        }
})

router.get('/getadmin', async (req, res) => {
    const orders = await order.find({}, 'name address phoneNo cans deliverystatus');
    res.status(200).json({
        status:true,
        data: orders
    });
});

router.delete('/deleteOrder', async (req, res) => {
    const phoneNo = req.query.phoneNo;

    try {
        const deletedOrder = await order.findOneAndDelete({ phoneNo: phoneNo });
        if (deletedOrder) {
            return res.status(200).json({
                status: true,
                message: 'Order deleted successfully.',
                data: deletedOrder,
            });
        } else {
            return res.status(404).json({
                status: false,
                message: 'Order not found with the given phone number.',
            });
        }
    } catch (error) {
        console.error('Error deleting order:', error);
        return res.status(500).json({
            status: false,
            message: 'Internal Server Error',
        });
    }
});




router.post('/register', async (req, res) => {
    try {
      const { name, phoneNumber, email, password } = req.body;
      const existingUser = await User.findOne({ phoneNumber });
      if (existingUser) {
        return res.status(400).json({ error: 'UserExists', message: 'User with this phone number already exists' });

      }
      const existingEmailUser = await User.findOne({ email });

      if (existingEmailUser) {
          return res.status(400).json({ error: 'UserExists', message: 'User with this email already exists.' });
      }

     
      

      const newUser = new User({
        name,
        phoneNumber,
        email,
        password,
      });
     
  
      await newUser.save();
      res.status(200).send('User registration successful');
    } catch (error) {
      if (error.code === 11000 && error.keyPattern.email) {
        // Duplicate key error, email already exists
        res.status(400).send('Email is already in use');
      } else if (error.code === 11000 && error.keyPattern.phoneNumber) {
        // Duplicate key error, phone number already exists
        res.status(400).send('Phone number is already in use');
      } else {
        console.error(error);
        res.status(500).send('Error saving user to the database');
      }
    }
});


// Login route
router.post('/login', async (req, res) => {
    const { phoneNumber, password } = req.body;

    try {
        // Find user by phone number
        const user = await User.findOne({ phoneNumber });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare hashed password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        
        res.json({ message: 'Login successful' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/Orders', async (req, res) => {
    try {
      const orders = new order(req.body);
      await orders.save();
      res.status(201).send(orders);
    } catch (error) {
      res.status(400).send(error);
    }
  });
  
  router.get('/', async (req, res) => {
    try {
      const orders = await order.find();
      res.send(orders);
    } catch (error) {
      res.status(500).send(error);
    }
  });
module.exports = router;