const nodemailer = require("nodemailer");
const express = require("express");
const router = express.Router();
const session = require('express-session');
// const JWT = require("jsonwebtoken");
const User = require("../../Models/userModel");
const Token = require("../../Models/tokenModel");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const generateOTP = require("./generateotp");
require("dotenv").config();
const EMAIL = "varshwaters@gmail.com"
const PASSWORD = "xmnt ikbd dkut knzo"

let otp; // to store the generated OTP

router.post("/sendOtp", async (req, res) => {
  console.log(req.body);
  let email = req.body.email;
  let phoneNumber = req.body.userPhone;
  const user = await User.findOne({ $and: [{ phoneNumber }, { email }] });
  
  // If no user is found, return a 400 status with a message
  if (!user) {
    return res.status(400).json({ msg: "Email not registered with this phone number" });
  } else {
    // let token = await Token.findOne({userId: user._id});
    // if (token) await token.deleteOne();

    //Generate token
    let resetToken = crypto.randomBytes(32).toString("hex");
    const hash = await bcrypt.hash(resetToken, 10);
    otp = generateOTP();
    console.log("otp : ", otp);
    await new Token({
      userId: user._id,
      token: hash,
      otp: otp,
      createdAt: Date.now(),
    }).save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      auth: {
        user: EMAIL,
        pass: PASSWORD,
      },
    });



    var mailOptions = {
      from: `"No Reply" <${process.env.EMAIL}>`, // sender address
      to: `${email}`, // list of receivers
      subject: "Password Reset Request", // Subject line
      text: `Your password reset code is : ${otp}. </p><p>This link will expire in 30 minutes. If you did not request a password reset please ignore this.</p><p>Click here to reset your password</a>.</p>`,
    };
    // }
    transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        console.error(`Error sending password reset request: ${err}`);
        return res
          .status(500)
          .json({ msg: "Error sending email. Please try again later." });
      } else {

        console.log(`Message sent: ${info.messageId}`);
        req.session.email = email;
        res.json({ msg: "Password reset request sent successfully." });
      }
    });

    return res.status(200).json({ msg: "OTP is sent to your email" });
  }
});

router.post("/verifyOtp", async (req, res) => {
  try {
    let cotp = req.body.otp;

    console.log(otp);
    console.log(cotp);
    // Retrieve email from session

    // Find the token associated with the user and the provided OTP
    const token = await Token.findOne({ otp: cotp });

    if (!token) {
      return res.status(401).json({ msg: "Invalid OTP." });
    }

    // Check if the token has expired
    const tokenExpirationTime =
      new Date(token.createdAt).getTime() + 3600 * 1000; // 1 hour
    if (Date.now() > tokenExpirationTime) {
      await token.deleteOne(); // Remove expired token from the database
      return res.status(401).json({ msg: "OTP has expired." });
    }

    // If the OTP is valid and token has not expired, delete the token from the database
    await token.deleteOne();
    // res.redirect(`/reset-password?email=${encodeURIComponent(email)}`);

    return res.status(200).json({ msg: "OTP Verified!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error processing request." });
  }
});


// Route to handle password reset form submission
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
 
    console.log("Email : ", email);

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ msg: "Passwords do not match." });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password in the database
    await User.findOneAndUpdate({ email }, { password: hashedPassword });

    res.status(200).json({ msg: "Password updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error resetting password." });
  }
});


module.exports = router;